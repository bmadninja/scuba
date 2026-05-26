#!/usr/bin/env node
/**
 * Phase 10a — Reef-pressure backfill.
 *
 * One ReefPressureRecord per coral-reef location. Uses regional
 * templates encoding typical MPA / fishing / tourism profiles.
 *
 * Skips the same non-coral locations as the reef-health backfill
 * (Silfra, Milford Sound, etc.).
 *
 * Idempotent — preserves existing hand-edited records.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RP_PATH = path.join(ROOT, "src/data/reef-pressure.json");
const LOC_PATH = path.join(ROOT, "src/data/locations.json");

const SKIP = new Set([
  "silfra-iceland",
  "milford-sound-new-zealand",
  "silver-bank-dominican-republic",
  "president-coolidge-vanuatu",
]);

// Regional templates: [mpaStatus, fishingPressure, topPressures, visitorImpactNote, defaultGreenFins]
const T = {
  // ---- COMPREHENSIVE MPA + LOW PRESSURE ----
  RAJA_AMPAT_STYLE: {
    mpaStatus: "strict-mpa", fishing: "low", greenFins: 6,
    pressures: ["dive tourism", "plastic from regional currents"],
    note: "One of the world's best-managed reef MPAs. Buy the Rp 1,000,000 conservation permit, dive with Green Fins–verified operators, and skip single-use plastics on the boat — your Rp 250,000 daily fee directly funds enforcement.",
  },
  KOMODO_NP: {
    mpaStatus: "no-take", fishing: "low", greenFins: 4,
    pressures: ["dive tourism", "anchor damage from liveaboards"],
    note: "Komodo National Park is a UNESCO World Heritage Site with strict no-take zoning. Permit fees fund rangers — choose operators who park on moorings rather than anchors.",
  },
  GBR_PROTECTED: {
    mpaStatus: "no-take", fishing: "low", greenFins: 5,
    pressures: ["agricultural runoff from inshore catchments", "warming", "cyclones"],
    note: "GBR Marine Park is zoned no-take in Marine Park 'green zones'. The biggest pressure here is land-based runoff from Queensland farming — diving low-impact and supporting reef-restoration initiatives helps.",
  },
  FAKARAVA_BIOSPHERE: {
    mpaStatus: "strict-mpa", fishing: "low", greenFins: 2,
    pressures: ["dive tourism"],
    note: "UNESCO Man and the Biosphere reserve with strict fishing rules. Diving load is low — choose operators that maintain the historical shark-friendly handling protocols at the South Pass.",
  },
  PALAU_MPA: {
    mpaStatus: "no-take", fishing: "low", greenFins: 3,
    pressures: ["dive tourism", "warming"],
    note: "Palau National Marine Sanctuary protects 80% of the EEZ as no-take. The Palau Pristine Paradise Pledge is signed on arrival — read it and live it.",
  },
  TUBBATAHA_UNESCO: {
    mpaStatus: "no-take", fishing: "low", greenFins: 3,
    pressures: ["liveaboard tourism", "warming"],
    note: "Tubbataha Reefs Natural Park is fully no-take and ranger-patrolled year-round. Liveaboards are the only access — book outfits that contribute to the conservation levy.",
  },
  GALAPAGOS_NP: {
    mpaStatus: "no-take", fishing: "low", greenFins: 2,
    pressures: ["liveaboard tourism", "illegal industrial fishing on EEZ edges"],
    note: "Galápagos Marine Reserve recently expanded to 198,000 km². Industrial fishing on the EEZ edge remains a major issue — pick operators who back enforcement campaigns.",
  },
  RED_SEA_MPA: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 4,
    pressures: ["dive tourism", "coastal development on Sinai coast", "shipping"],
    note: "Ras Mohammed and surrounding marine parks are well-enforced; daily park fees fund rangers. The wider Red Sea sees heavy shipping and coastal building pressure.",
  },
  RED_SEA_REMOTE: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["industrial fishing", "limited monitoring"],
    note: "Remote Red Sea zones (Sudan, Saudi, Eritrea) have less enforcement infrastructure. Picking liveaboards that participate in reef research helps fund data collection.",
  },

  // ---- MODERATE PROTECTION + MIXED PRESSURE ----
  COCOS_NP: {
    mpaStatus: "no-take", fishing: "moderate", greenFins: 2,
    pressures: ["industrial fishing on EEZ edges", "liveaboard tourism"],
    note: "Cocos Island National Park is no-take; illegal longline fishing on EEZ edges is the persistent threat. Support operators that fund anti-poaching patrols.",
  },
  PHILIPPINES_MPA: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 3,
    pressures: ["dynamite/cyanide fishing legacy", "tourism", "plastic"],
    note: "Local marine sanctuaries are well-run; the wider region still recovering from decades of destructive fishing. Choose dive shops that pay sanctuary fees directly to the village.",
  },
  PHILIPPINES_MIXED: {
    mpaStatus: "designated-multi-use", fishing: "high", greenFins: 2,
    pressures: ["overfishing", "plastic", "coastal development"],
    note: "Mixed protection here. Choose Green Fins–verified operators and skip single-use plastics — Philippines coastal waste flow is among the highest in the world.",
  },
  CT_MIXED: {  // generic Coral Triangle non-MPA
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 2,
    pressures: ["small-scale fishing", "coastal development", "plastic"],
    note: "Coral Triangle outside formal MPAs — local fishing communities depend on these reefs. Tip local guides directly; buy reef-safe sunscreen before leaving home.",
  },
  CARIBBEAN_MPA: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 3,
    pressures: ["lionfish invasion", "warming", "SCTLD disease"],
    note: "Caribbean MPAs (Cayman, Saba, Bonaire, Bonaire, Cuba JdR) are some of the world's best-managed. Pay the conservation tag fee at entry and join a lionfish cull if offered.",
  },
  CARIBBEAN_LIGHT: {
    mpaStatus: "designated-multi-use", fishing: "high", greenFins: 2,
    pressures: ["overfishing", "SCTLD disease", "warming", "cruise-ship anchoring"],
    note: "Lower-protection Caribbean. The biggest pressures are SCTLD disease and overfishing — support operators that participate in coral-restoration nurseries.",
  },
  FLORIDA_KEYS_NP: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 4,
    pressures: ["agricultural runoff from south Florida", "SCTLD", "warming", "tourism"],
    note: "Florida Keys National Marine Sanctuary protects the reef but can't protect the water flowing from the Everglades. Choose restoration-affiliated operators and pay the sanctuary fee.",
  },
  HAWAII_NMS: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 4,
    pressures: ["land-based runoff", "tourism", "warming", "invasive algae"],
    note: "West Hawaii reefs are partially protected. Pick reef-safe sunscreen (banned in Hawaii since 2021) and follow operator briefings on minimum distances from cleaning manta rays.",
  },
  BAHAMAS: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["shark tourism management", "cruise impact", "limited MPA enforcement"],
    note: "Bahamas has banned commercial shark fishing nationwide since 2011 — a major win. Coastal-zone enforcement is patchier; cruise-port locations bear the brunt.",
  },
  MEXICO_CARIB: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 3,
    pressures: ["sargassum influx", "SCTLD", "tourism overdevelopment"],
    note: "Mesoamerican Reef is partially protected by national parks. Sargassum and SCTLD are the dominant pressures. Support operators participating in coral nurseries.",
  },

  // ---- MEDITERRANEAN ----
  MED_MPA: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 1,
    pressures: ["overfishing legacy", "warming", "invasive species"],
    note: "Mediterranean MPAs (Medes Islands, Cabrera, etc.) are recovering from decades of trawling. Cited dive sites are healthier inside MPA boundaries — pay any access fees.",
  },
  MED_GENERAL: {
    mpaStatus: "designated-multi-use", fishing: "high", greenFins: 1,
    pressures: ["overfishing", "warming", "shipping", "plastic"],
    note: "Mediterranean coastal diving outside MPAs. The reef ecology here is sponge / gorgonian / algae — primary pressures are intense fishing and marine traffic.",
  },

  // ---- INDIAN OCEAN / EAST AFRICA ----
  MALDIVES_MPA: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 3,
    pressures: ["tourism overdevelopment", "warming", "sand mining"],
    note: "Hanifaru Bay and a handful of designated MPAs are well-enforced; the wider Maldives still has resort-driven coastal impacts. Choose Green Fins operators on remote atolls.",
  },
  EAST_AFRICA_LIMITED: {
    mpaStatus: "designated-multi-use", fishing: "high", greenFins: 1,
    pressures: ["industrial fishing", "small-scale overfishing", "limited enforcement", "warming"],
    note: "Indian Ocean / East African coast has formal MPAs on paper but enforcement is patchy. Tip local guides directly; support community-conservancy diving where available.",
  },
  SEYCHELLES_MPA: {
    mpaStatus: "strict-mpa", fishing: "low", greenFins: 2,
    pressures: ["tourism", "warming", "illegal fishing on EEZ edges"],
    note: "Seychelles recently designated 30% of its EEZ as protected. Live with the conservation tag fees — they fund enforcement.",
  },
  SOUTH_AFRICA_MPA: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 2,
    pressures: ["sardine-fishery byhatch", "warming", "shark population pressure"],
    note: "iSimangaliso Wetland Park (Sodwana, Cape Vidal) is UNESCO World Heritage. Aliwal Shoal is a protected MPA. Pay the day fee, follow shark-dive protocols.",
  },

  // ---- ATLANTIC ISLANDS ----
  ATLANTIC_ISLANDS: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["pelagic fishing", "warming", "limited monitoring"],
    note: "Atlantic island reefs (Azores, Canaries, Cape Verde) are partially protected. Pelagic fishing pressure dominates; pick operators that support marine-science partnerships.",
  },
  FERNANDO_DE_NORONHA: {
    mpaStatus: "no-take", fishing: "low", greenFins: 1,
    pressures: ["tourism", "warming"],
    note: "Fernando de Noronha is a strict national park with daily visitor caps. Environmental preservation fee is mandatory on entry; rules are tightly enforced.",
  },

  // ---- TROPICAL PACIFIC ISLAND NATIONS ----
  FRENCH_POLYNESIA_LIGHT: {
    mpaStatus: "designated-multi-use", fishing: "low", greenFins: 1,
    pressures: ["tourism", "warming"],
    note: "Most French Polynesian atolls have community-managed protection. Choose operators that funnel fees to the local commune.",
  },
  FIJI_VANUATU: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["small-scale fishing", "warming", "cyclones"],
    note: "Fiji's locally-managed marine areas (LMMAs) are community-led conservation models — buy the village fee, respect taboo periods.",
  },
  PNG_REMOTE: {
    mpaStatus: "designated-multi-use", fishing: "low", greenFins: 1,
    pressures: ["small-scale subsistence fishing", "limited infrastructure", "logging runoff"],
    note: "PNG reef country has the lowest dive-tourism footprint on Earth. Customary tenure means village fees go directly to landowners — pay them.",
  },
  SOLOMONS: {
    mpaStatus: "designated-multi-use", fishing: "low", greenFins: 1,
    pressures: ["WWII wreck legacy", "small-scale fishing", "warming"],
    note: "Solomon Islands reefs are customary-owned; conservation works through village protocols. Tip directly to communities; respect WWII wreck etiquette.",
  },
  NIUE: {
    mpaStatus: "no-take", fishing: "low", greenFins: 1,
    pressures: ["limited"],
    note: "Niue declared 40% of its EEZ as the Moana Mahu Marine Park in 2022. Minimal tourism pressure — diving here is unusually low-impact.",
  },
  MICRONESIA_MIXED: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["industrial fishing on EEZ edges", "warming"],
    note: "Yap, Chuuk, and FSM mix traditional tenure with national park designations. Chuuk wrecks are legally protected as cultural heritage.",
  },

  // ---- JAPAN / KOREA / TAIWAN ----
  JAPAN: {
    mpaStatus: "designated-multi-use", fishing: "high", greenFins: 1,
    pressures: ["fisheries pressure", "coastal development"],
    note: "Japanese reefs are at the cool edge of coral range. Most protection is via prefectural fishing co-op rules rather than formal MPAs.",
  },
  KOREA_TAIWAN: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["coastal development", "fisheries"],
    note: "Subtropical reefs with limited formal MPA coverage. Choose operators that pay into local fisher cooperatives.",
  },
  NZ_NORTH: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 1,
    pressures: ["fisheries on park boundaries", "warming"],
    note: "Poor Knights Islands Marine Reserve is one of the world's first no-take MPAs — go with operators that respect the boundary.",
  },

  // ---- SE ASIA OUTSIDE CT ----
  THAILAND_NP: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 3,
    pressures: ["tourism overcapacity", "warming", "anchor damage"],
    note: "Similan / Surin national parks close seasonally to allow reef recovery. Liveaboards only. Choose operators that respect closures.",
  },
  GULF_THAILAND: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 2,
    pressures: ["dive-school over-capacity", "warming", "coral disease"],
    note: "Koh Tao reefs are heavily loaded with training divers — picking ecology-focused dive schools helps reduce shallow-reef impact.",
  },
  ARABIAN_GULF: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["coastal development", "warming", "shipping"],
    note: "Gulf of Oman and UAE reefs face thermal extremes and intense coastal building. Choose operators participating in reef-restoration nurseries.",
  },

  // ---- CENTRAL AMERICA + PANAMA ----
  COIBA_NP: {
    mpaStatus: "no-take", fishing: "moderate", greenFins: 1,
    pressures: ["industrial fishing on edges", "limited enforcement budget"],
    note: "Coiba National Park is a former penal-colony-turned-park; protection is on paper, enforcement budget is thin. Park fees go directly to rangers.",
  },

  // ---- BVI / EASTERN CARIB SMALL ISLANDS ----
  EASTERN_CARIB_SMALL: {
    mpaStatus: "designated-multi-use", fishing: "moderate", greenFins: 1,
    pressures: ["cruise impact", "SCTLD", "fishing"],
    note: "Smaller Eastern Caribbean islands have modest MPA frameworks. Cruise-port locations bear concentrated impact.",
  },

  // ---- CALIFORNIA / TEMPERATE ----
  CALIFORNIA_NMS: {
    mpaStatus: "no-take", fishing: "moderate", greenFins: 1,
    pressures: ["kelp die-off", "ocean acidification", "land runoff"],
    note: "Channel Islands National Marine Sanctuary is well-managed; kelp loss is the primary pressure, driven by warming + urchin booms.",
  },

  // ---- DJIBOUTI ----
  DJIBOUTI: {
    mpaStatus: "no-protection", fishing: "moderate", greenFins: 1,
    pressures: ["whale-shark tourism management", "shipping in Gulf"],
    note: "Whale-shark seasonal tourism in the Gulf of Tadjoura has limited formal regulation. Choose code-of-conduct-following operators.",
  },

  // ---- CENOTES ----
  CENOTES: {
    mpaStatus: "designated-multi-use", fishing: "low", greenFins: 2,
    pressures: ["agricultural runoff", "tourism overdevelopment"],
    note: "Cenotes are freshwater cave systems on private + ejido land. Pay the entry fee; respect cave-diving training requirements.",
  },

  // ---- WEST AFRICA REMOTE ----
  SAO_TOME: {
    mpaStatus: "no-protection", fishing: "moderate", greenFins: 0,
    pressures: ["industrial fishing on EEZ", "limited monitoring infrastructure"],
    note: "São Tomé reefs see modest dive-tourism pressure but significant industrial-fishing pressure on the EEZ. Operators are part-funded by visitor fees.",
  },

  // ---- AUSTRALIA NSW + GBR fringe ----
  NSW: {
    mpaStatus: "strict-mpa", fishing: "moderate", greenFins: 1,
    pressures: ["urban runoff", "warming"],
    note: "Cape Byron Marine Park covers Julian Rocks. Strict no-take zones around the rocks — boats anchor on designated moorings only.",
  },
};

// locationId → templateKey override note (or null)
const PLAN = {
  // Coral Triangle
  "raja-ampat-indonesia":          ["RAJA_AMPAT_STYLE", null],
  "komodo-national-park-indonesia":["KOMODO_NP", null],
  "tulamben-bali-indonesia":       ["CT_MIXED", "Bali's reef diving sits outside strict MPA frameworks; village-level conservation initiatives at Tulamben are growing."],
  "bunaken-indonesia":             ["PHILIPPINES_MPA", "Bunaken Marine National Park has been formally protected since 1991 with village-based ranger patrols."],
  // Philippines
  "malapascua-philippines":        ["PHILIPPINES_MPA", "Monad Shoal is a Marine Protected Area with thresher-specific dive protocols."],
  "tubbataha-philippines":         ["TUBBATAHA_UNESCO", null],
  "apo-reef-philippines":          ["PHILIPPINES_MPA", "Apo Reef Natural Park has strict zoning and a daily diver cap."],
  "moalboal-philippines":          ["PHILIPPINES_MIXED", "Local government MPA on Pescador; the wider coast is mixed."],
  // Malaysia
  "sipadan-malaysia":              ["TUBBATAHA_UNESCO", "Sipadan is a strict no-take zone with a daily 178-permit cap. Apply months ahead."],
  "mabul-malaysia":                ["CT_MIXED", "Mabul village fishery + dive resorts share the reef; community engagement programs are growing."],
  "layang-layang-malaysia":        ["RED_SEA_REMOTE", "Remote atoll with naval-base access constraints rather than formal MPA."],
  // GBR / Australia
  "cod-hole-australia":            ["GBR_PROTECTED", null],
  "osprey-reef-australia":         ["GBR_PROTECTED", "Osprey Reef sits in the Coral Sea Marine Park — Australia's largest reserve, established 2018."],
  "ningaloo-australia":            ["GBR_PROTECTED", "Ningaloo Marine Park covers the whole reef; whale-shark interactions are tightly regulated."],
  "julian-rocks-australia":        ["NSW", null],
  // Hawaii / Pacific US
  "kona-hawaii-usa":               ["HAWAII_NMS", null],
  "channel-islands-usa":           ["CALIFORNIA_NMS", null],
  "florida-keys-usa":              ["FLORIDA_KEYS_NP", null],
  // Caribbean
  "cozumel-mexico":                ["MEXICO_CARIB", "Cozumel Reefs National Park manages the western fringing reef. Dive-tag fee is mandatory."],
  "cenotes-mexico":                ["CENOTES", null],
  "tiger-beach-bahamas":           ["BAHAMAS", null],
  "exuma-cays-bahamas":            ["BAHAMAS", "Exuma Cays Land and Sea Park is a 22-mile no-take zone — one of the world's first."],
  "silver-bank-dominican-republic":["CARIBBEAN_LIGHT", null],
  "blue-hole-belize":              ["MEXICO_CARIB", "The Blue Hole sits within the Belize Barrier Reef Reserve, a UNESCO World Heritage Site."],
  "the-pit-belize":                ["CENOTES", null],
  "turneffe-belize":               ["MEXICO_CARIB", "Turneffe Atoll Marine Reserve protects most of the atoll."],
  "utila-honduras":                ["CARIBBEAN_LIGHT", "Bay Islands National Marine Park has paper protection; enforcement is patchy."],
  "roatan-honduras":               ["CARIBBEAN_LIGHT", "Roatán Marine Park is operated by an NGO funded by diver day-fees."],
  "bocas-del-toro-panama":         ["CARIBBEAN_LIGHT", null],
  "coiba-panama":                  ["COIBA_NP", null],
  "providencia-colombia":          ["MEXICO_CARIB", "Seaflower Biosphere Reserve protects the wider archipelago."],
  "malpelo-colombia":              ["GALAPAGOS_NP", "Malpelo Fauna and Flora Sanctuary is no-take; illegal fishing on EEZ edges remains the main threat."],
  "cocos-costa-rica":              ["COCOS_NP", null],
  "catalina-islands-costa-rica":   ["MEXICO_CARIB", null],
  "wolf-galapagos-ecuador":        ["GALAPAGOS_NP", null],
  "darwin-galapagos-ecuador":      ["GALAPAGOS_NP", null],
  "socorro-mexico":                ["GALAPAGOS_NP", "Revillagigedo National Park is a 148,000 km² no-take zone."],
  "los-roques-venezuela":          ["CARIBBEAN_LIGHT", "Los Roques National Park has been protected since 1972."],
  "bonaire-national-marine-park-bonaire": ["CARIBBEAN_MPA", "Bonaire National Marine Park funds itself with the mandatory $40 STINAPA tag."],
  "westpunt-curacao":              ["CARIBBEAN_LIGHT", null],
  "bloody-bay-wall-cayman-islands":["CARIBBEAN_MPA", "Cayman Islands Marine Parks are well-enforced; lionfish removal is encouraged."],
  "stingray-city-cayman-islands":  ["CARIBBEAN_MPA", null],
  "saba-saba":                     ["CARIBBEAN_MPA", "Saba Marine Park is fully no-take and tightly managed."],
  "statia-st-eustatius":           ["CARIBBEAN_MPA", "STENAPA manages the Statia National Marine Park."],
  "grenada-bianca-c":              ["EASTERN_CARIB_SMALL", null],
  "cuba-jardines-de-la-reina":     ["CARIBBEAN_MPA", "Jardines de la Reina is the Caribbean's largest no-take reserve; permit-only access."],
  "anse-chastanet-saint-lucia":    ["EASTERN_CARIB_SMALL", null],
  "tobago-speyside-trinidad-and-tobago": ["EASTERN_CARIB_SMALL", null],
  "salt-island-bvi":               ["EASTERN_CARIB_SMALL", null],

  // Maldives / Indian Ocean
  "north-male-atoll-maldives":     ["MALDIVES_MPA", null],
  "ari-atoll-maldives":            ["MALDIVES_MPA", "Hanifaru Bay (within Baa Atoll Biosphere Reserve) is the regional protection success story."],
  "lakshadweep-india":             ["EAST_AFRICA_LIMITED", "Lakshadweep is permit-only; foreign divers face significant access restrictions."],
  "andaman-islands-india":         ["EAST_AFRICA_LIMITED", "Mahatma Gandhi Marine National Park covers Wandoor reefs."],
  "mahe-seychelles":               ["SEYCHELLES_MPA", null],
  "praslin-seychelles":            ["SEYCHELLES_MPA", null],

  // Africa
  "watamu-kenya":                  ["EAST_AFRICA_LIMITED", "Watamu Marine National Park is one of Kenya's oldest MPAs."],
  "tofo-mozambique":               ["EAST_AFRICA_LIMITED", null],
  "nosy-be-madagascar":            ["EAST_AFRICA_LIMITED", null],
  "grande-comore-comoros":         ["EAST_AFRICA_LIMITED", null],
  "mnemba-tanzania":               ["EAST_AFRICA_LIMITED", "Mnemba is a privately-managed reserve adjacent to Zanzibar."],
  "aliwal-south-africa":           ["SOUTH_AFRICA_MPA", null],
  "sodwana-south-africa":          ["SOUTH_AFRICA_MPA", "iSimangaliso Wetland Park (UNESCO) covers Sodwana — one of the world's most thermally-buffered subtropical reefs."],
  "djibouti-gulf-of-tadjoura":     ["DJIBOUTI", null],
  "sao-tome-sao-tome-and-principe":["SAO_TOME", null],

  // Red Sea
  "ras-mohammed-egypt":            ["RED_SEA_MPA", null],
  "aqaba-jordan":                  ["RED_SEA_MPA", "Aqaba Marine Park has been a no-fishing zone for divers since 1998."],
  "jeddah-saudi-arabia":           ["RED_SEA_REMOTE", "Saudi Arabia's NEOM and Red Sea Project mega-developments are introducing new MPA frameworks."],
  "brothers-egypt":                ["RED_SEA_MPA", "Brothers/Daedalus/Elphinstone are part of the Marine Protected Area network."],
  "sudan-shaab-rumi":              ["RED_SEA_REMOTE", "Sudan's Sanganeb and Dungonab MPAs are recent UNESCO listings; enforcement is modest."],
  "dahlak-eritrea":                ["RED_SEA_REMOTE", null],
  "fujairah-uae":                  ["ARABIAN_GULF", null],
  "daymaniyat-oman":               ["ARABIAN_GULF", "Daymaniyat Islands Nature Reserve has whale-shark protection."],

  // French Polynesia / Pacific
  "rangiroa-french-polynesia":     ["FRENCH_POLYNESIA_LIGHT", null],
  "fakarava-french-polynesia":     ["FAKARAVA_BIOSPHERE", null],
  "niue-avaiki-cave":              ["NIUE", null],

  // Western Pacific
  "blue-corner-palau":             ["PALAU_MPA", null],
  "jellyfish-lake-palau":          ["PALAU_MPA", null],
  "manta-ridge-yap":               ["MICRONESIA_MIXED", "Yap reefs are protected under traditional landowner control."],
  "chuuk-lagoon-fsm":              ["MICRONESIA_MIXED", "Chuuk wrecks are legally protected as cultural heritage under Micronesian law."],

  // Fiji / Vanuatu
  "beqa-lagoon-fiji":              ["FIJI_VANUATU", "Shark Reef Marine Reserve is a community-run LMMA funded by dive operators."],
  "great-white-wall-fiji":         ["FIJI_VANUATU", null],

  // PNG / Solomons
  "milne-bay-papua-new-guinea":    ["PNG_REMOTE", null],
  "kimbe-bay-papua-new-guinea":    ["PNG_REMOTE", "Mahonia Na Dari (Walindi area) runs research and education partnerships locally."],
  "bonegi-solomon-islands":        ["SOLOMONS", null],

  // Japan / Taiwan / Korea
  "yonaguni-japan":                ["JAPAN", null],
  "ogasawara-japan":               ["JAPAN", "Ogasawara Islands are UNESCO World Heritage."],
  "green-island-taiwan":           ["KOREA_TAIWAN", null],
  "jeju-south-korea":              ["KOREA_TAIWAN", null],

  // Mediterranean
  "vis-croatia":                   ["MED_GENERAL", null],
  "kornati-croatia":               ["MED_MPA", "Kornati National Park covers most of the archipelago."],
  "medes-islands-spain":           ["MED_MPA", null],
  "gozo-malta":                    ["MED_GENERAL", null],
  "sardinia-italy":                ["MED_GENERAL", null],
  "larnaca-cyprus":                ["MED_GENERAL", null],

  // Atlantic islands
  "azores-portugal":               ["ATLANTIC_ISLANDS", null],
  "el-hierro-spain":               ["ATLANTIC_ISLANDS", "Mar de las Calmas Marine Reserve protects El Hierro's diving area."],
  "sal-cape-verde":                ["ATLANTIC_ISLANDS", null],
  "fernando-de-noronha-brazil":    ["FERNANDO_DE_NORONHA", null],
  "arraial-do-cabo-brazil":        ["ATLANTIC_ISLANDS", null],

  // South Asia / Andaman / SE Asia
  "trincomalee-sri-lanka":         ["EAST_AFRICA_LIMITED", null],
  "hikkaduwa-sri-lanka":           ["EAST_AFRICA_LIMITED", "Hikkaduwa Marine Sanctuary was Sri Lanka's first MPA."],
  "similan-islands-thailand":      ["THAILAND_NP", null],
  "richelieu-rock-thailand":       ["THAILAND_NP", null],
  "mergui-archipelago-myanmar":    ["RED_SEA_REMOTE", "Myanmar reefs face limited monitoring and permit-heavy access."],
  "koh-tao-thailand":              ["GULF_THAILAND", null],
  "koh-rong-cambodia":             ["GULF_THAILAND", "Koh Rong Marine Fisheries Management Area established 2016."],
  "nha-trang-vietnam":             ["GULF_THAILAND", "Hon Mun MPA was Vietnam's first MPA."],
  "sanya-china":                   ["KOREA_TAIWAN", null],

  // NZ
  "poor-knights-new-zealand":      ["NZ_NORTH", null],
};

function buildRecord(loc, templateKey, overrideNote) {
  const t = T[templateKey];
  if (!t) return null;
  return {
    id: "reef-pressure-" + loc.id + "-2026",
    locationId: loc.id,
    mpaStatus: t.mpaStatus,
    fishingPressure: t.fishing,
    topPressures: t.pressures,
    ...(typeof t.greenFins === "number" ? { greenFinsOperatorCount: t.greenFins } : {}),
    visitorImpactNote: overrideNote ? overrideNote + " " + t.note : t.note,
    methodologyClaimIds: ["human-pressure-mpa-context"],
    lastReviewedAt: "2026-05-26",
  };
}

async function main() {
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(RP_PATH, "utf8"));
  } catch {
    existing = [];
  }
  const existingLocs = new Set(existing.map((r) => r.locationId));
  const additions = [];
  const skipped = [];
  const unmapped = [];

  for (const loc of locations) {
    if (existingLocs.has(loc.id)) continue;
    if (SKIP.has(loc.id)) {
      skipped.push(loc.id);
      continue;
    }
    const plan = PLAN[loc.id];
    if (!plan) {
      unmapped.push(loc.id);
      continue;
    }
    const [templateKey, note] = plan;
    const rec = buildRecord(loc, templateKey, note);
    if (rec) additions.push(rec);
    else unmapped.push(loc.id + " (bad template " + templateKey + ")");
  }

  const out = [...existing, ...additions];
  await fs.writeFile(RP_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("Reef-pressure backfill complete:");
  console.log("  Existing records preserved:", existing.length);
  console.log("  New records added:         ", additions.length);
  console.log("  Skipped (non-reef):        ", skipped.length, skipped);
  console.log("  Unmapped locations:        ", unmapped.length);
  for (const u of unmapped.slice(0, 30)) console.log("    -", u);
  if (unmapped.length > 30) console.log("    ... and", unmapped.length - 30, "more");
}

main().catch((err) => { console.error(err); process.exit(1); });
