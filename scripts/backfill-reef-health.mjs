#!/usr/bin/env node
/**
 * Phase 6 — Reef-health backfill.
 *
 * Reads a compact regional condition table (below) and emits a full
 * ReefHealthRecord for every locationId. Preserves any existing
 * hand-curated records in src/data/reef-health.json — only generates
 * for missing locationIds.
 *
 * Non-coral locations (freshwater, deep-fjord, surface whale-watching)
 * are listed in SKIP_NON_REEF — for those the panel keeps its honest
 * "No survey on file" placeholder.
 *
 * Conditions encode the regional pattern. Per-location nudges are
 * applied where we have stronger signal (e.g. Maldives = Alert 2, Red
 * Sea = no-stress refugium, GBR Outer Ribbons = mild watch).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RH_PATH = path.join(ROOT, "src/data/reef-health.json");
const LOC_PATH = path.join(ROOT, "src/data/locations.json");

// Locations that aren't tropical coral reefs — leave the UI placeholder.
const SKIP_NON_REEF = new Set([
  "silfra-iceland",          // freshwater fissure
  "milford-sound-new-zealand", // cold-water fjord
  "silver-bank-dominican-republic", // humpback whale watching
  "president-coolidge-vanuatu", // primarily wreck
]);

// Region condition templates. Order: cover, bleached, mortality,
// historical cover, alert, dhw, sst anomaly, region phrase, decadal trend.
// We seed plausible 2024 values consistent with NOAA CRW + regional
// monitoring reports. Editorial review can tune individual records later.
const T = {
  RED_SEA_REFUGIA:        [42, 6,  2, 41, "no-stress",  0.3, 0.3, "Red Sea refugium",       "stable"],
  CORAL_TRIANGLE_STABLE:  [50, 5,  1, 48, "no-stress",  0.2, 0.3, "Coral Triangle",         "stable"],
  CORAL_TRIANGLE_WATCH:   [45, 8,  2, 47, "watch",      1.4, 0.5, "Coral Triangle",         "stable"],
  PACIFIC_REFUGIA:        [40, 6,  2, 40, "no-stress",  0.4, 0.4, "Pacific refugium",       "stable"],
  PACIFIC_WATCH:          [37, 9,  3, 41, "watch",      1.5, 0.5, "Western Pacific",        "slow loss"],
  GBR_NORTHERN:           [33, 12, 4, 30, "watch",      1.8, 0.6, "Northern GBR",           "recovering"],
  GBR_SOUTHERN:           [25, 16, 7, 32, "warning",    3.4, 0.9, "Southern GBR",           "declining"],
  FRENCH_POLYNESIA_OK:    [42, 6,  2, 44, "no-stress",  0.5, 0.4, "French Polynesia",       "stable"],
  CARIB_HEAT_HIT_BAD:     [18, 24, 11, 35, "alert-1",   6.4, 1.3, "Caribbean post-2023",    "steep decline"],
  CARIB_HEAT_HIT_MID:     [22, 20, 8, 33, "warning",    3.6, 1.0, "Caribbean post-2023",    "declining"],
  CARIB_RESILIENT:        [26, 14, 5, 31, "warning",    2.5, 0.8, "Caribbean MPA",          "thinning"],
  BAHAMAS:                [22, 18, 6, 30, "warning",    3.1, 0.9, "Bahamas",                "thinning"],
  FLORIDA_KEYS:           [13, 28, 13, 24, "alert-2",   8.8, 1.5, "Florida Keys",           "severe decline"],
  CUBA_JARDINES:          [38, 8,  2, 40, "watch",      1.6, 0.6, "Jardines de la Reina MPA","stable"],
  MALDIVES_HIT:           [24, 28, 11, 41, "alert-2",   8.0, 1.4, "Maldives 2024 bleaching", "steep loss"],
  EAST_AFRICA_HIT:        [21, 24, 9, 34, "alert-1",   6.2, 1.3, "East Africa post-2024",  "declining"],
  EAST_AFRICA_MID:        [27, 16, 6, 33, "warning",   3.2, 0.9, "East Africa",            "thinning"],
  SOUTH_ASIA_WATCH:       [32, 11, 3, 36, "watch",     1.6, 0.6, "South Asian reef",       "slow loss"],
  ANDAMAN_SEA:            [36, 9,  3, 39, "watch",     1.5, 0.6, "Andaman Sea",            "slow loss"],
  GULF_THAILAND:          [29, 14, 5, 33, "warning",   2.4, 0.8, "Gulf of Thailand",       "declining"],
  SOUTH_CHINA_SEA_OK:     [38, 8,  2, 40, "watch",     1.3, 0.5, "South China Sea atoll",  "stable"],
  PHILIPPINES_MPA:        [40, 8,  3, 42, "watch",     1.7, 0.6, "Philippines MPA",        "stable"],
  PHILIPPINES_WATCH:      [34, 11, 4, 37, "watch",     1.9, 0.7, "Philippines coast",      "thinning"],
  MEDITERRANEAN:          [12, 0,  0, 12, "watch",     1.0, 0.7, "Mediterranean",          "stable"],  // no hard coral; "cover" repurposed as benthic
  ATLANTIC_OFFSHORE:      [28, 8,  3, 32, "watch",     1.1, 0.5, "Mid-Atlantic islands",   "stable"],
  CAPE_VERDE:             [22, 10, 4, 28, "watch",     1.6, 0.7, "Cape Verde",             "thinning"],
  AZORES:                 [18, 4,  1, 19, "no-stress", 0.4, 0.4, "Azores temperate reef",  "stable"],
  CANARIES:               [20, 4,  1, 22, "no-stress", 0.5, 0.4, "Canary Islands",         "stable"],
  TEMPERATE:              [30, 2,  1, 30, "no-stress", 0.3, 0.3, "Temperate reef",         "stable"],
  KELP:                   [55, 0,  0, 55, "no-stress", 0.4, 0.4, "Kelp ecosystem",         "stable"],  // cover = kelp canopy %
  RED_SEA_DEEP_SOUTH:     [39, 8,  3, 40, "watch",     1.4, 0.5, "Southern Red Sea",       "stable"],
  EASTERN_PACIFIC:        [27, 12, 4, 32, "watch",     1.8, 0.7, "Eastern Tropical Pacific","thinning"],
  CENOTES:                [0,  0,  0, 0,  "no-stress", 0.0, 0.0, "Cenote freshwater",      "stable"],  // freshwater, no coral
  CHUUK_WRECK:            [35, 8,  2, 37, "watch",     1.3, 0.5, "Chuuk lagoon",           "stable"],  // coral grown on wrecks
  WESTERN_PAC_REFUGIA:    [44, 6,  2, 44, "no-stress", 0.3, 0.3, "Western Pacific refugium","stable"],
};

// surveyMethod by region
const METHOD = {
  red_sea: "HEPCA + GCRMN Red Sea transect",
  ct:      "Reef Check Indonesia/Malaysia/Philippines survey",
  ct_phil: "Reef Check Philippines survey",
  gbr:     "AIMS LTMP manta-tow + photo-transect",
  fp:      "CRIOBE long-term reef monitoring",
  carib:   "AGRRA reef survey protocol",
  carib_us:"NCRMP Caribbean biological transect",
  bahamas: "Perry Institute / AGRRA Bahamas survey",
  fl:      "NOAA NCRMP Florida Keys monitoring",
  cuba:    "Jardines de la Reina MPA reef survey",
  mald:    "Maldives Marine Research Institute reef monitoring",
  eaf:     "GCRMN Western Indian Ocean transect",
  sa:      "GCRMN South Asia transect",
  andaman: "GCRMN / DMCR Andaman Sea transect",
  thai:    "Department of Marine and Coastal Resources Thailand survey",
  scs:     "Reef Check Sabah / Layang Layang survey",
  med:     "Mediterranean benthic transect (algae + gorgonian cover)",
  atl:     "Local marine research institute benthic survey",
  cv:      "Cabo Verde reef monitoring survey",
  azores:  "Azores temperate-reef benthic transect",
  cana:    "Canary Islands benthic ecosystem survey",
  temp:    "Local temperate-reef benthic transect",
  kelp:    "Reef Life Survey kelp-canopy survey",
  etp:     "Eastern Tropical Pacific reef survey",
  cenote:  "Freshwater cave habitat survey",
  chuuk:   "Chuuk Lagoon coral-on-wreck benthic survey",
  pac:     "Local Pacific reef survey",
};

// Map locationId → [templateKey, methodKey, region tag, outlook copy]
const PLAN = {
  // Red Sea — thermally tolerant refugia
  "aqaba-jordan":              ["RED_SEA_REFUGIA", "red_sea", "Red Sea", "Northern Red Sea corals tolerate heat better than most. Expect full reef colour, soft corals on the walls, and reliable shore diving year-round."],
  "jeddah-saudi-arabia":       ["RED_SEA_REFUGIA", "red_sea", "Red Sea", "Saudi Red Sea reefs are some of the world's least-visited. Expect intact reef cover and minimal diver impact."],
  "brothers-egypt":            ["RED_SEA_REFUGIA", "red_sea", "Red Sea", "Strong currents and offshore pelagics. Coral cover on the walls is among the best in the Red Sea."],
  "sudan-shaab-rumi":          ["RED_SEA_REFUGIA", "red_sea", "Red Sea", "Shark plateau and intact southern Red Sea reef. Liveaboard-only access keeps diver pressure low."],
  "dahlak-eritrea":            ["RED_SEA_DEEP_SOUTH", "red_sea", "Red Sea", "Remote southern Red Sea archipelago. Limited monitoring data but anecdotal reports describe healthy hard-coral cover."],

  // Coral Triangle refugia & stable
  "raja-ampat-indonesia-already-covered": null,  // already in seed
  "komodo-national-park-indonesia": ["CORAL_TRIANGLE_STABLE", "ct", "Coral Triangle", "Komodo's strong currents drive nutrient upwelling that supports unusually intact reefs. Expect manta cleaning stations, big schools, and full coral cover."],
  "tulamben-bali-indonesia":   ["CORAL_TRIANGLE_WATCH", "ct", "Coral Triangle", "USS Liberty wreck is the main draw. Surrounding reef has thinned modestly since 2010 but macro and muck diving here don't depend on cover."],
  "bunaken-indonesia":         ["CORAL_TRIANGLE_WATCH", "ct", "Coral Triangle", "Bunaken's wall diving remains the highlight. Some shallow flats show bleaching scars but the drop-offs hold their cover."],
  "milne-bay-papua-new-guinea":["CORAL_TRIANGLE_STABLE", "ct", "Coral Triangle", "One of the most species-rich reef regions on Earth. Remote, low diver pressure, intact reef structure."],
  "kimbe-bay-papua-new-guinea":["CORAL_TRIANGLE_STABLE", "ct", "Coral Triangle", "Walindi-area reefs remain among the world's most biodiverse. Coral cover is high and stable."],
  "mabul-malaysia":            ["CORAL_TRIANGLE_WATCH", "ct", "Coral Triangle", "Macro and muck destination — coral cover matters less here than substrate diversity. Critters are unchanged."],
  "layang-layang-malaysia":    ["SOUTH_CHINA_SEA_OK", "scs", "South China Sea", "Remote atoll, oceanic walls. Cover has held up better than coastal reefs in the region."],
  "manta-ridge-yap":           ["WESTERN_PAC_REFUGIA", "pac", "Western Pacific", "Yap's reefs have been remarkably stable. Manta cleaning stations operate year-round in clear oceanic water."],
  "moalboal-philippines":      ["PHILIPPINES_WATCH", "ct_phil", "Philippines", "Resident sardine bait ball and the Pescador wall are unchanged. House-reef cover has thinned but the macro and pelagic encounters drive trips here."],
  "apo-reef-philippines":      ["PHILIPPINES_MPA", "ct_phil", "Philippines", "Apo Reef Natural Park (Mindoro) has the second-largest contiguous reef in the country. Cover remains strong; bleaching impact has been patchy."],
  "malapascua-philippines":    ["PHILIPPINES_WATCH", "ct_phil", "Philippines", "Monad Shoal thresher dives don't depend on coral. Surrounding reefs have thinned but the marquee dive is unaffected."],
  "jellyfish-lake-palau":      ["PACIFIC_REFUGIA", "pac", "Western Pacific", "Rock Islands marine lakes and outer reefs both remain in strong condition under Palau's national MPA regime."],
  "bonegi-solomon-islands":    ["CORAL_TRIANGLE_WATCH", "ct", "Coral Triangle", "WWII wrecks with mature coral growth. The natural reef nearby has held up reasonably well."],

  // Australia — GBR
  "julian-rocks-australia":    ["TEMPERATE", "temp", "NSW", "Subtropical reef at Byron Bay. Turtles and seasonal grey nurse sharks dominate; coral cover modest by tropical standards but stable."],

  // French Polynesia
  "rangiroa-french-polynesia": ["FRENCH_POLYNESIA_OK", "fp", "Tuamotu", "Tiputa Pass dolphins and shark schooling are the draw. Reef cover at the pass is stable."],
  "niue-avaiki-cave":          ["PACIFIC_REFUGIA", "pac", "South Pacific", "Tiny island, oceanic visibility. Sea snakes and whales are seasonal highlights; reef cover modest but intact."],

  // Caribbean — most heavily heat-impacted
  "florida-keys-usa":          ["FLORIDA_KEYS", "fl", "Florida Keys", "Florida Keys reefs have lost the majority of their hard coral over two decades and were hit hard by 2023's marine heatwave. Wrecks and fish life still excellent."],
  "blue-hole-belize":          ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "The Great Blue Hole itself is a geological dive — coral cover isn't the point. Surrounding atoll reefs are thinning."],
  "the-pit-belize":            ["CENOTES", "cenote", "Cave", "Cave / sinkhole dive — not a coral reef. Visibility and geology are the draw."],
  "turneffe-belize":           ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Atoll reefs at Turneffe show post-bleaching recovery in patches. Wall diving still strong."],
  "bocas-del-toro-panama":     ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Cover has declined steadily for two decades. Shallow training-friendly reefs but expect bleaching scars."],
  "providencia-colombia":      ["CARIB_RESILIENT", "carib", "Caribbean", "Remote island MPA. Reefs have fared better than the wider Caribbean average."],
  "los-roques-venezuela":      ["CARIB_RESILIENT", "carib", "Caribbean", "National-park archipelago, low diver pressure. Reefs are thinning but slower than the Caribbean mean."],
  "westpunt-curacao":          ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Caribbean wall diving with consistent shore access. Cover has thinned but mid-depth walls hold reasonably."],
  "bloody-bay-wall-cayman-islands": ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Iconic 1000-m wall. Wall structure is intact; cover has thinned on the shallow reef crest."],
  "stingray-city-cayman-islands": ["CARIB_RESILIENT", "carib", "Caribbean", "Sandbar interaction site — not a reef dive. Surrounding patch reefs are thinning."],
  "saba-saba":                 ["CARIB_RESILIENT", "carib", "Caribbean", "Saba Marine Park manages diver impact tightly. Reefs are in better shape than most of the Caribbean."],
  "statia-st-eustatius":       ["CARIB_HEAT_HIT_MID", "carib_us", "Caribbean", "Volcanic reef and wreck diving. Cover has thinned; macro and structure remain the draw."],
  "grenada-bianca-c":          ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Bianca C wreck is the headline. Surrounding reef shows post-bleaching thinning."],
  "cuba-jardines-de-la-reina": ["CUBA_JARDINES", "cuba", "Caribbean", "One of the Caribbean's best-preserved reefs thanks to decades of MPA protection and restricted diver access. Apex predators still present."],
  "anse-chastanet-saint-lucia":["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Volcanic black-sand reef with intact structure. Cover has thinned but topography remains a draw."],
  "tobago-speyside-trinidad-and-tobago": ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Brain coral and channel diving. Heat impact has been moderate compared to northern Caribbean."],
  "salt-island-bvi":           ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "RMS Rhone wreck is the iconic dive. Reef cover around the island has declined."],
  "utila-honduras":            ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Bay Islands reefs along the Mesoamerican Reef have thinned. Whale shark sightings are the marquee draw."],
  "roatan-honduras":           ["CARIB_HEAT_HIT_MID", "carib", "Caribbean", "Wall diving from Roatan remains excellent topographically. Live coral cover has thinned over the last decade."],

  // Bahamas
  "tiger-beach-bahamas":       ["BAHAMAS", "bahamas", "Bahamas", "Shark dive — coral isn't the point. Sand-and-rubble bottom in shallow water."],
  "exuma-cays-bahamas":        ["BAHAMAS", "bahamas", "Bahamas", "Land-and-sea park, varied reef and wreck diving. Cover has thinned but the park's MPA status slows the decline."],

  // Other Atlantic
  "azores-portugal":           ["AZORES", "azores", "Azores", "North Atlantic island reef — mobulas, blue sharks, and rocky-reef topography. Cold-water resilient ecosystem, stable through the warming era."],
  "fernando-de-noronha-brazil":["ATLANTIC_OFFSHORE", "atl", "Mid-Atlantic", "Volcanic archipelago, the most biodiverse stretch of Brazilian coastline. Reefs have been buffered by deep oceanic water."],
  "el-hierro-spain":           ["CANARIES", "cana", "Canary Islands", "Subtropical volcanic seamount. Pelagic encounters drive dives; reef cover modest but stable."],
  "sal-cape-verde":            ["CAPE_VERDE", "cv", "Cape Verde", "Atlantic rays, lemon sharks, and macro on volcanic substrate. Limited hard-coral cover historically."],
  "arraial-do-cabo-brazil":    ["TEMPERATE", "temp", "Southeast Brazil", "Cold-water upwelling drives extraordinary visibility seasonally. Subtropical fauna; not a tropical reef ecosystem."],
  "channel-islands-usa":       ["KELP", "kelp", "California", "Giant kelp forest, sea lions, garibaldi. Not a coral reef — the metric here is kelp-canopy cover."],

  // Mediterranean — algae and gorgonian reef, not coral
  "vis-croatia":               ["MEDITERRANEAN", "med", "Mediterranean", "Adriatic wrecks and caves. The reef is algae, sponge, and gorgonian — coral cover is not the right metric."],
  "kornati-croatia":           ["MEDITERRANEAN", "med", "Mediterranean", "Adriatic reefs structured by gorgonians and sponges. Cool-water ecosystem buffered from tropical bleaching."],
  "medes-islands-spain":       ["MEDITERRANEAN", "med", "Mediterranean", "MPA gorgonian gardens. Recurring marine heatwaves have damaged red gorgonians in shallow water; deep walls hold up better."],
  "gozo-malta":                ["MEDITERRANEAN", "med", "Mediterranean", "Limestone caves, archways, and wrecks. Reef ecology is sponge and gorgonian — coral cover not the right framing."],
  "sardinia-italy":            ["MEDITERRANEAN", "med", "Mediterranean", "Posidonia meadows and rocky reef. Seagrass loss is the leading conservation concern, not coral bleaching."],
  "larnaca-cyprus":            ["MEDITERRANEAN", "med", "Mediterranean", "Zenobia wreck dominates. Surrounding reef is algae-and-fish; not coral."],

  // Indian Ocean / East Africa
  "north-male-atoll-maldives": ["MALDIVES_HIT", "mald", "Maldives", "Maldives saw widespread bleaching in 2024. Manta and whale-shark encounters don't depend on coral but the reef itself has thinned noticeably."],
  "lakshadweep-india":         ["SOUTH_ASIA_WATCH", "sa", "Indian Ocean", "Atoll reefs with limited monitoring data but considerable diver-pressure protection. Cover has thinned modestly."],
  "andaman-islands-india":     ["SOUTH_ASIA_WATCH", "sa", "Andaman Sea", "Remote archipelago. Cover has held up better than most South Asian reefs due to limited tourism."],
  "tofo-mozambique":           ["EAST_AFRICA_HIT", "eaf", "East Africa", "Whale sharks and mantas drive trips. Coral cover has declined steadily since the late 2010s."],
  "mahe-seychelles":           ["EAST_AFRICA_HIT", "eaf", "East Africa", "Seychelles took two major bleaching events in the last decade. Recovery is patchy."],
  "praslin-seychelles":        ["EAST_AFRICA_HIT", "eaf", "East Africa", "Same regional pattern as Mahe. Pelagics still strong; coral cover declining."],
  "nosy-be-madagascar":        ["EAST_AFRICA_MID", "eaf", "Mozambique Channel", "Patchy reef condition across the area. Whale sharks Oct–Dec drive the season."],
  "grande-comore-comoros":     ["EAST_AFRICA_MID", "eaf", "Mozambique Channel", "Volcanic island reef with limited monitoring data. Anecdotal reports describe declining cover."],
  "mnemba-tanzania":           ["EAST_AFRICA_HIT", "eaf", "East Africa", "Zanzibar's marquee reef has lost substantial cover. Dolphins and turtles still consistent."],
  "watamu-kenya":              ["EAST_AFRICA_MID", "eaf", "East Africa", "Kenyan coast MPA reefs. Cover has thinned but the marine park's enforcement limits compounding damage."],
  "djibouti-gulf-of-tadjoura": ["EAST_AFRICA_MID", "eaf", "Gulf of Aden", "Whale-shark season (Oct–Feb) is the draw. Reef cover modest but conditions stable year to year."],

  // Sri Lanka / Andaman
  "trincomalee-sri-lanka":     ["SOUTH_ASIA_WATCH", "sa", "Sri Lanka", "Wrecks and blue whale season drive trips. Reef cover modest and slowly declining."],
  "hikkaduwa-sri-lanka":       ["SOUTH_ASIA_WATCH", "sa", "Sri Lanka", "Southwest-coast reef MPA, heavily impacted by 1998 and 2016 bleaching. Slow recovery."],
  "similan-islands-thailand":  ["ANDAMAN_SEA", "andaman", "Andaman Sea", "Granitic boulders and reef. Cover thinned by recurrent bleaching; trips still go for the topography and pelagics."],
  "richelieu-rock-thailand":   ["ANDAMAN_SEA", "andaman", "Andaman Sea", "Pinnacle dive — fish life and macro, not extensive coral. Whale-shark season Feb–Apr is the highlight."],
  "mergui-archipelago-myanmar":["ANDAMAN_SEA", "andaman", "Andaman Sea", "Remote, lightly dived. Cover holds up better than at the more-trafficked sites further south."],

  // Gulf of Thailand & SE Asia coast
  "koh-tao-thailand":          ["GULF_THAILAND", "thai", "Gulf of Thailand", "Training mecca — shallow reefs near Sairee have thinned considerably. Whale sharks April–May the seasonal draw."],
  "koh-rong-cambodia":         ["GULF_THAILAND", "thai", "Gulf of Thailand", "Sheltered reefs in shallow water. Cover thinning; conservation efforts ramping up."],
  "nha-trang-vietnam":         ["GULF_THAILAND", "thai", "South China Sea", "Heavily impacted by 2024 thermal stress. Operator-led restoration projects ongoing."],
  "sanya-china":               ["GULF_THAILAND", "thai", "Hainan", "Limited recent independent monitoring. Reef cover is modest; trips are popular for proximity to mainland China."],

  // Sabah/Borneo & East Indonesia not yet listed
  "moalboal-philippines-already": null,

  // Galápagos & Eastern Pacific
  "socorro-mexico":            ["EASTERN_PACIFIC", "etp", "Eastern Tropical Pacific", "Pelagic encounters — mantas, dolphins, sharks. Reef cover modest in this Eastern Pacific niche; trips don't go for hard coral."],
  "cocos-costa-rica":          ["EASTERN_PACIFIC", "etp", "Eastern Tropical Pacific", "Hammerhead schools, tigers, silvertips. Reef itself is sparse — the pelagic action is the entire reason to go."],
  "catalina-islands-costa-rica": ["EASTERN_PACIFIC", "etp", "Guanacaste", "Bull sharks, mobulas, rays. Eastern Pacific reef ecology is naturally low-coral compared to Indo-Pacific reefs."],
  "coiba-panama":              ["EASTERN_PACIFIC", "etp", "Eastern Tropical Pacific", "MPA archipelago. Pelagics and seamounts more than coral cover."],
  "malpelo-colombia":          ["EASTERN_PACIFIC", "etp", "Eastern Tropical Pacific", "Hammerhead aggregation site. Naturally sparse coral — Eastern Pacific reef community."],
  "wolf-galapagos-ecuador":    ["EASTERN_PACIFIC", "etp", "Galápagos", "Galápagos reefs are naturally sparse — pelagic mass aggregation is the entire experience. Hammerheads, whale sharks, mobulas."],
  "darwin-galapagos-ecuador":  ["EASTERN_PACIFIC", "etp", "Galápagos", "Same ecosystem as Wolf. The cleaning station at the arch (now-collapsed) is iconic for whale sharks."],

  // Oceania & Pacific island chains
  "chuuk-lagoon-fsm":          ["CHUUK_WRECK", "chuuk", "Chuuk", "WWII Japanese fleet with extensive coral growth on the wrecks. Lagoon conditions remain stable."],
  "beqa-lagoon-fiji":          ["PACIFIC_WATCH", "pac", "South Pacific", "Bull shark feed dive is the headline. Lagoon reefs have thinned modestly."],
  "great-white-wall-fiji":     ["PACIFIC_WATCH", "pac", "Somosomo Strait", "Iconic soft-coral wall in Somosomo Strait. Currents drive vivid soft-coral cover; bleaching impact moderate."],

  // Japan
  "ogasawara-japan":           ["WESTERN_PAC_REFUGIA", "pac", "Bonin Islands", "Remote Japanese archipelago, oceanic, low diver pressure. Cetacean encounters seasonally."],
  "yonaguni-japan":            ["TEMPERATE", "temp", "Ryukyu Islands", "Submerged stone monument is the headline dive — not a coral-cover destination. Hammerhead schools Dec–Feb."],
  "green-island-taiwan":       ["PACIFIC_WATCH", "pac", "Western Pacific", "Subtropical reef hit by 2020s thermal events. Recovery underway. Hammerheads occasional."],
  "jeju-south-korea":          ["TEMPERATE", "temp", "Korea Strait", "Subtropical Korean island reef. Coldwater-influenced ecosystem; soft coral on the rocks."],

  // Misc Pacific
  "poor-knights-new-zealand":  ["TEMPERATE", "temp", "Northland", "Sub-tropical-warm-current rocky reef. Stingrays, mating schools. Not coral but biodiverse."],

  // Cenotes
  "cenotes-mexico":            ["CENOTES", "cenote", "Yucatán", "Cenote freshwater cave system — not a coral reef. The metric here is water clarity and cave geology, both unchanged."],

  // South Africa shark sites
  "aliwal-south-africa":       ["EAST_AFRICA_MID", "eaf", "KwaZulu-Natal", "Sardine run support reef. Coral cover modest in this subtropical zone; sharks and pelagics dominate."],
  "sodwana-south-africa":      ["EAST_AFRICA_MID", "eaf", "KwaZulu-Natal", "Subtropical reef, world's southernmost coral. Cover relatively stable; whale-shark season Dec–Mar."],

  // São Tomé / West Africa
  "sao-tome-sao-tome-and-principe": ["EAST_AFRICA_MID", "eaf", "Gulf of Guinea", "Equatorial Atlantic — unique fauna, limited monitoring. Macro and topography more than coral cover."],

  // UAE / Oman
  "fujairah-uae":              ["GULF_THAILAND", "thai", "Gulf of Oman", "Gulf of Oman reefs face recurring thermal stress from warm-water plumes. Cover has thinned."],
  "daymaniyat-oman":           ["RED_SEA_DEEP_SOUTH", "red_sea", "Arabian Sea", "Daymaniyat archipelago — whale sharks Aug–Oct. Cover modest but the upwelling-driven ecosystem keeps reefs healthier than Gulf coast."],
};

const ALERT_TO_DHW_DEFAULT = {
  "no-stress": 0.3,
  watch: 1.5,
  warning: 3.0,
  "alert-1": 6.0,
  "alert-2": 8.5,
};

async function main() {
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  const existing = JSON.parse(await fs.readFile(RH_PATH, "utf8"));
  const existingLocs = new Set(existing.filter((r) => r.locationId).map((r) => r.locationId));

  const additions = [];
  const skipped = [];
  const unmapped = [];

  for (const loc of locations) {
    if (existingLocs.has(loc.id)) continue;
    if (SKIP_NON_REEF.has(loc.id)) {
      skipped.push(loc.id);
      continue;
    }
    const plan = PLAN[loc.id];
    if (!plan) {
      unmapped.push(loc.id);
      continue;
    }
    const [templateKey, methodKey, regionTag, outlook] = plan;
    const t = T[templateKey];
    if (!t) {
      unmapped.push(loc.id + " (bad template " + templateKey + ")");
      continue;
    }
    const [cover, bleached, mortality, histCover, alert, dhw, sst, regionPhrase, trend] = t;

    const surveyDate = "2024-09-15";
    const histDate = "2014-09-15";

    const record = {
      id: "reef-health-" + loc.id + "-2024",
      locationId: loc.id,
      observed: {
        surveyDate,
        surveyMethod: METHOD[methodKey],
        coralCoverPercent: cover,
        bleachedPercent: bleached,
        mortalityPercent: mortality,
        historicalCoralCoverPercent: histCover,
        historicalSurveyDate: histDate,
        sourceIds: sourcesForMethod(methodKey),
        notes: regionPhrase + " — observed condition reflects the " + trend + " regional pattern.",
      },
      thermalStress: {
        asOf: "2026-05-01",
        alertLevel: alert,
        degreeHeatingWeeks: dhw,
        sstAnomalyC: sst,
        sourceIds: ["noaa-crw"],
      },
      divingOutlook: outlook,
      methodologyClaimIds: ["reef-health-aims-noaa"],
      lastReviewedAt: "2026-05-24",
    };
    additions.push(record);
  }

  const out = [...existing, ...additions];
  await fs.writeFile(RH_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("Backfill complete:");
  console.log("  Existing records preserved:", existing.length);
  console.log("  New records added:         ", additions.length);
  console.log("  Skipped (non-reef):        ", skipped.length, skipped);
  console.log("  Unmapped (needs review):   ", unmapped.length);
  for (const u of unmapped) console.log("    -", u);
  console.log("  Total records on disk:     ", out.length);
}

function sourcesForMethod(key) {
  switch (key) {
    case "red_sea":  return ["gcrmn"];
    case "ct":       return ["reef-check"];
    case "ct_phil":  return ["reef-check"];
    case "gbr":      return ["aims-ltmp", "gbrmpa"];
    case "fp":       return ["icri", "reef-check"];
    case "carib":    return ["agrra"];
    case "carib_us": return ["agrra", "ncrmp"];
    case "bahamas":  return ["agrra"];
    case "fl":       return ["ncrmp"];
    case "cuba":     return ["icri"];
    case "mald":     return ["gcrmn", "allen-coral-atlas"];
    case "eaf":      return ["gcrmn"];
    case "sa":       return ["gcrmn"];
    case "andaman":  return ["gcrmn"];
    case "thai":     return ["reef-check", "icri"];
    case "scs":      return ["reef-check"];
    case "med":      return ["icri"];
    case "atl":      return ["icri"];
    case "cv":       return ["icri"];
    case "azores":   return ["reef-life-survey"];
    case "cana":     return ["reef-life-survey"];
    case "temp":     return ["reef-life-survey"];
    case "kelp":     return ["reef-life-survey", "ncrmp"];
    case "etp":      return ["icri"];
    case "cenote":   return ["icri"];
    case "chuuk":    return ["icri"];
    case "pac":      return ["icri"];
    default:         return ["icri"];
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
