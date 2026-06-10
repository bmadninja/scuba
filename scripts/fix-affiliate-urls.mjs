#!/usr/bin/env node
/**
 * Fix affiliate link integrity for hotels and liveaboards in sites.json.
 *
 * Hotels: replaces Booking.com search URLs with direct property page URLs,
 *         sets isAffiliate=true, removes entries with no confirmed property page.
 * Liveaboards: replaces liveaboard.com search URLs with DiveBooker property
 *              page URLs (or direct operator websites for non-DiveBooker vessels).
 *              Removes entries with no confirmed destination URL.
 *
 * Run: node scripts/fix-affiliate-urls.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const sitesPath = new URL("../src/data/sites.json", import.meta.url);
const sites = JSON.parse(readFileSync(sitesPath, "utf8"));

// ─── Hotel URL map: label → confirmed Booking.com property page URL ───────────

const HOTEL_URLS = {
  "Alila Manggis": "https://www.booking.com/hotel/id/alila-manggis.html",
  "Aliwal Dive Lodge": "https://www.booking.com/hotel/za/aliwal-dive-centre-amp-lodge.html",
  "All West Apartments & Diving": "https://www.booking.com/hotel/cw/all-west-apartments-amp-diving.html",
  "Amoray Dive Resort Key Largo": "https://www.booking.com/hotel/us/amoray-resort.html",
  "Anthony's Key Resort": "https://www.booking.com/hotel/hn/anthony-39-s-key-resort.html",
  "Aore Island Resort": "https://www.booking.com/hotel/vu/aore-island-resort.html",
  "Avani Seychelles Barbarons": "https://www.booking.com/hotel/sc/avani-seychelles-barbarons-resort-amp-spa.html",
  "Bali Reef Divers Tulamben": "https://www.booking.com/hotel/id/bali-reef-divers-tulamben.html",
  "Bandos Maldives": "https://www.booking.com/hotel/mv/bandos-island-resort-spa.html",
  "Bangaram Island Resort": "https://www.booking.com/hotel/in/bangaram-island-resort-ihcl-seleqtions-lakshwadeep.html",
  "Bayview Gardens Hotel Labuan Bajo": "https://www.booking.com/hotel/id/bayview-gardens.html",
  "Beqa Lagoon Resort": "https://www.booking.com/hotel/fj/beqa-lagoon-resort-raviravi.html",
  "Berjaya Praslin Resort": "https://www.booking.com/hotel/sc/berjaya-praslin-resort.html",
  "Bimini Big Game Club": "https://www.booking.com/hotel/bs/bimini-alice-town-bimini-big-game-club-guy-harvey-outpost.html",
  "Bimini Big Game Club Resort": "https://www.booking.com/hotel/bs/bimini-alice-town-bimini-big-game-club-guy-harvey-outpost.html",
  "Bonaire Seaside Apartments": "https://www.booking.com/hotel/bq/bonaire-seaside-apartments.html",
  "Buddy Dive Resort Bonaire": "https://www.booking.com/hotel/bq/buddy-dive-resort-kralendijk.html",
  "Bunaken Oasis Dive Resort": "https://www.booking.com/hotel/id/bunaken-oasis-dive-resort-and-spa.html",
  "Camel Dive Club & Hotel Sharm": "https://www.booking.com/hotel/eg/camel-boutique.html",
  "Captain's Hotel Aqaba": "https://www.booking.com/hotel/jo/captains.html",
  "Casa Barry Beach Lodge": "https://www.booking.com/hotel/mz/casa-barry-beach-lodge.html",
  "Casa Mexicana Cozumel": "https://www.booking.com/hotel/mx/casa-mexicana-cozumel.html",
  "Charming Blue Hotel Santa Maria": "https://www.booking.com/hotel/pt/charming-blue.html",
  "Cheeca Lodge & Spa Islamorada": "https://www.booking.com/hotel/us/cheeca-lodge-spa.html",
  "Chief Mau Backpackers": "https://www.booking.com/hotel/ph/chief-mau-moalboal-cebu-moalboal.html",
  "Citrus Hikkaduwa": "https://www.booking.com/hotel/lk/citrus-hikkaduwa.html",
  "Club Paradise Palawan": "https://www.booking.com/hotel/ph/club-paradise-resort-palawan.html",
  "Constance Halaveli Maldives": "https://www.booking.com/hotel/mv/constance-halaveli.html",
  "Constance Lemuria Praslin": "https://www.booking.com/hotel/sc/constance-lemuria.html",
  "Coral Divers Sodwana Bay": "https://www.booking.com/hotel/za/coral-divers.html",
  "Crowne Plaza Muscat": "https://www.booking.com/hotel/om/crowne-plaza-muscat.html",
  "Crystalbrook Riley Cairns": "https://www.booking.com/hotel/au/riley.html",
  "Deco Stop Lodge Santo": "https://www.booking.com/hotel/vu/deco-stop-lodge.html",
  "Distinction Te Anau Hotel & Villas": "https://www.booking.com/hotel/nz/distinction-te-anau-villas.html",
  "DoubleTree by Hilton Aqaba": "https://www.booking.com/hotel/jo/doubletree-by-hilton-aqaba.html",
  "Downtown Hotel Gozo": "https://www.booking.com/hotel/mt/downtown.html",
  "Exmouth Cape Holiday Park": "https://www.booking.com/hotel/au/aspen-parks-exmouth-cape-holiday-park.html",
  "Four Seasons Kuda Huraa": "https://www.booking.com/hotel/mv/four-seasons-resort-maldives-at-kuda-huraa.html",
  "Four Seasons Resort Hualalai": "https://www.booking.com/hotel/us/four-seasons-resort-hualalai-at-historic-ka-upulehu.html",
  "Four Seasons Resort Seychelles": "https://www.booking.com/hotel/sc/four-seasons-resort-seychelles.html",
  "Four Seasons Sharm El Sheikh": "https://www.booking.com/hotel/eg/four-seasons-sharm-el-sheikh.html",
  "Garden Island Resort Taveuni": "https://www.booking.com/hotel/fj/garden-island-resort.html",
  "Grand Hotel Gozo": "https://www.booking.com/hotel/mt/grand.html",
  "Grand Isle Resort Exuma": "https://www.booking.com/hotel/bs/grand-isle-resort-amp-spa.html",
  "Harbour Village Beach Club": "https://www.booking.com/hotel/bq/harbour-village-beach-club.html",
  "Hibiscus Garden Hotel": "https://www.booking.com/hotel/pa/hibiscus-garden-santa-catalina.html",
  "Hikka Tranz by Cinnamon": "https://www.booking.com/hotel/lk/chaaya-tranz-hikkaduwa.html",
  "Hotel Bell Aire L'Estartit": "https://www.booking.com/hotel/es/bell-aire.html",
  "Hotel Borealis (Reykjavík base)": "https://www.booking.com/hotel/is/borealis.html",
  "Hotel Cabañas Tulum": "https://www.booking.com/hotel/mx/cabanas-tulum.html",
  "Hotel Centro Puerto Princesa": "https://www.booking.com/hotel/ph/centro.html",
  "Hotel Colombo Santa Maria": "https://www.booking.com/hotel/pt/colombo.html",
  "Hotel Esencia Riviera Maya": "https://www.booking.com/hotel/mx/esencia.html",
  "Hotel Flamingo Cozumel": "https://www.booking.com/hotel/mx/po-flamingo-hotel-the-best-rated-area-in-cozumel.html",
  "Hotel Maitai Rangiroa": "https://www.booking.com/hotel/pf/maitai-rangiroa.html",
  "Hotel San Giorgio Vis": "https://www.booking.com/hotel/hr/san-giorgio.html",
  "ION Adventure Hotel Þingvellir": "https://www.booking.com/hotel/is/fosshotel-hengill.html",
  "Issa Heritage Hotel Vis": "https://www.booking.com/hotel/hr/issa-vis.html",
  "Jamahkiri Resort & Spa": "https://www.booking.com/hotel/th/jamahkiri-resort-spa-koh-tao.html",
  "Jungle Beach by Uga Escapes": "https://www.booking.com/hotel/lk/jungle-beach-resort.html",
  "Kempinski Hotel Aqaba": "https://www.booking.com/hotel/jo/kempinski-aqaba.html",
  "Kempinski Hotel San Lawrenz Gozo": "https://www.booking.com/hotel/mt/kempinskisanlawrenz.html",
  "Kia Ora Resort & Spa": "https://www.booking.com/hotel/pf/hoshino-resort-kiaora-rangiroa.html",
  "Koh Tao Cabana": "https://www.booking.com/hotel/th/koh-tao-cabana.html",
  "La Digue Island Lodge": "https://www.booking.com/hotel/sc/la-digue-island-lodge.html",
  "La Flora Resort Khao Lak": "https://www.booking.com/hotel/th/la-flora-resort-spa-khao-lak.html",
  "Lalati Resort & Spa Beqa": "https://www.booking.com/hotel/fj/lalati-resort.html",
  "Le Duc de Praslin": "https://www.booking.com/hotel/sc/le-duc-de-praslin.html",
  "Le Soleil d'Or Cayman Brac": "https://www.booking.com/hotel/ky/le-soleil-d-39-or-cayman-brac.html",
  "Liamo Reef Resort": "https://www.booking.com/hotel/pg/liamo-reef-resort.html",
  "LionsDive Beach Resort": "https://www.booking.com/hotel/cw/lions-dive-and-beach-resort.html",
  "Lodge Bordeaux Whangarei": "https://www.booking.com/hotel/nz/lodge-bordeaux.html",
  "Lodge Kura Hulanda Beach Club": "https://www.booking.com/hotel/cw/kura-hulanada-lodge-and-beach-club.html",
  "Mabul Water Bungalows": "https://www.booking.com/hotel/my/mabul-good-lsland.html",
  "Magic Oceans Dive Resort": "https://www.booking.com/hotel/ph/magic-oceans-dive-resort.html",
  "Mango Inn Utila": "https://www.booking.com/hotel/hn/mango-inn.html",
  "Manta Ray Bay Resort": "https://www.booking.com/hotel/fm/manta-ray-bay-resort.html",
  "Mantarays Ningaloo Beach Resort": "https://www.booking.com/hotel/au/ningaloo-resort.html",
  "Marsa Shagra Village (upscale tents)": "https://www.booking.com/hotel/eg/marsa-shagra-village.html",
  "Matemwe Beach Village": "https://www.booking.com/hotel/tz/matemwe-beach-village.html",
  "Milford Sound Lodge (Mountain View Lodges)": "https://www.booking.com/hotel/nz/milford-sound-lodge.html",
  "Movenpick El Quseir": "https://www.booking.com/hotel/eg/moevenpick-resort-el-quseir.html",
  "Mozambeat Motel Tofo": "https://www.booking.com/hotel/mz/mozambeat-motel-inhambane.html",
  "Muscat Inn Hotel": "https://www.booking.com/hotel/om/muscat-inn.html",
  "Nannai Noronha Solar dos Ventos": "https://www.booking.com/hotel/br/pousada-solar-dos-ventos.html",
  "Nilaveli Beach Hotel": "https://www.booking.com/hotel/lk/nilavali-beach.html",
  "Pacific Rendezvous Resort Tutukaka": "https://www.booking.com/hotel/nz/pacific-rendezvous-motel.html",
  "Palau Central Hotel": "https://www.booking.com/hotel/pw/palau-central.html",
  "Palau Pacific Resort": "https://www.booking.com/hotel/pw/palau-pacific-resort.html",
  "Paradise Taveuni": "https://www.booking.com/hotel/fj/paradise-taveneuni.html",
  "Peace & Plenty Hotel Exuma": "https://www.booking.com/hotel/bs/exuma-george-town.html",
  "Pimalai Resort & Spa Koh Lanta": "https://www.booking.com/hotel/th/pimalai-resort-and-spa.html",
  "Plataran Komodo Resort": "https://www.booking.com/hotel/id/plataran-komodo.html",
  "Posada Acquamarina": "https://www.booking.com/hotel/ve/posada-acquamarina-los-roques.html",
  "Pousada Maravilha": "https://www.booking.com/hotel/br/pousada-maravilha-ltda.html",
  "Pousada do Vale Noronha": "https://www.booking.com/hotel/br/pousada-do-vale.html",
  "Presidente InterContinental Cozumel": "https://www.booking.com/hotel/mx/presidente-intercontinental-cozumel-resort-spa.html",
  "Pumula Beach Hotel": "https://www.booking.com/hotel/za/pumula-beach-umzumbe.html",
  "Queen's Gardens Resort Saba": "https://www.booking.com/hotel/bq/queens-garden-resort.html",
  "Rae's on Wategos": "https://www.booking.com/hotel/au/raes-guesthouses.html",
  "Raja Ampat Biodiversity Eco Resort": "https://www.booking.com/hotel/id/raja-ampat-biodiversity-eco-resort.html",
  "Ramon's Village Resort San Pedro": "https://www.booking.com/hotel/bz/ramon-39-s-village-resort.html",
  "Reef Teach Lodge Sodwana": "https://www.booking.com/hotel/za/reefteach-lodge-2.html",
  "Renaissance Wind Creek Curaçao Resort": "https://www.booking.com/hotel/cw/renaissance-curacao-resort.html",
  "Resorts World Bimini": "https://www.booking.com/hotel/bs/hilton-at-resorts-world-bimini.html",
  "Roatan Backpackers Hostel": "https://www.booking.com/hotel/hn/roatan-backpackers-39-hostel.html",
  "Roots Camp El Quseir": "https://www.booking.com/hotel/eg/roots-luxury-camp-redsea.html",
  "Royal Kona Resort": "https://www.booking.com/hotel/us/royal-kona-resort.html",
  "Sal Salis Ningaloo Reef": "https://www.booking.com/hotel/au/sal-salis-ningaloo-reef.html",
  "San Lameer Resort (KZN South Coast)": "https://www.booking.com/hotel/za/san-lameer-resort.html",
  "Sandals Royal Curaçao": "https://www.booking.com/hotel/cw/sandals-royal-curacao.html",
  "Santa Bárbara Eco-Beach Resort": "https://www.booking.com/hotel/pt/santa-barbara-eco-beach-resort.html",
  "Scout's Place Saba": "https://www.booking.com/hotel/bq/scout-39-s-place.html",
  "Sea Passion Hotel Palau": "https://www.booking.com/hotel/pw/sea-passion.html",
  "Seafarer Resort Key Largo": "https://www.booking.com/hotel/us/seafarer-resort.html",
  "Shangri-La The Marina Cairns": "https://www.booking.com/hotel/au/shangri-la-the-marina-cairns.html",
  "Sharm Plaza Resort": "https://www.booking.com/hotel/eg/the-sharm-plaza.html",
  "Sheridan Beach Resort Palawan": "https://www.booking.com/hotel/ph/sheridan-beach-resort.html",
  "Siddhartha Ocean Front Resort": "https://www.booking.com/hotel/id/siddhartha-ocean-front-resort-amp-spa.html",
  "Siladen Resort & Spa": "https://www.booking.com/hotel/id/siladen-island-resort-spa.html",
  "Sipadan Kapalai Dive Resort": "https://www.booking.com/hotel/my/sipadan-kapalai-dive-resort.html",
  "Spotted Grunter Resort (Port St Johns)": "https://www.booking.com/hotel/za/the-spotted-grunter-resort.html",
  "Sudamala Resort Komodo": "https://www.booking.com/hotel/id/sudamala-suites-amp-villas-komodo-labuan-bajo.html",
  "Sunshine Marine Lodge": "https://www.booking.com/hotel/tz/sunshine-marine-lodge.html",
  "TSG Blue Resort Havelock": "https://www.booking.com/hotel/in/tsg-blue-resort-havelock-island.html",
  "Taveuni Island Resort": "https://www.booking.com/hotel/fj/taveuni-island-resort-amp-spa.html",
  "Tawali Leisure & Dive Resort": "https://www.booking.com/hotel/pg/tawali-resort.html",
  "Te Anau YHA Lakefront Backpackers": "https://www.booking.com/hotel/nz/te-anau-lakefront-backpackers.html",
  "The Atlantic Byron Bay": "https://www.booking.com/hotel/au/atlantic-guesthouses.html",
  "The Chedi Muscat": "https://www.booking.com/hotel/om/the-chedi-muscat.html",
  "The Espiritu Hotel Santo": "https://www.booking.com/hotel/vu/apex-garden.html",
  "The Sarojin Khao Lak": "https://www.booking.com/hotel/th/the-sarojin.html",
  "Thonga Beach Lodge": "https://www.booking.com/hotel/za/thonga-beach-lodge.html",
  "Traders' Ridge Resort Yap": "https://www.booking.com/hotel/fm/yap-pacific-dive-resort-colonia.html",
  "Turneffe Island Resort": "https://www.booking.com/hotel/bz/turneffe-island-resort.html",
  "Uncle Billy's Kona Bay Hotel": "https://www.booking.com/hotel/us/uncle-billy-s-kona-bay.html",
  "Utila Lodge": "https://www.booking.com/hotel/hn/utila-lodge.html",
  "Vanila Hotel & Spa Nosy Be": "https://www.booking.com/hotel/mg/vanila-amp-spa.html",
  "Victoria House Resort & Spa": "https://www.booking.com/hotel/bz/victoria-house-san-pedro2.html",
  "Vilamendhoo Island Resort": "https://www.booking.com/hotel/mv/vilamendhoo-island-resort-amp-spa.html",
  "Villa Nautica Paradise Island": "https://www.booking.com/hotel/mv/paradise-island-resort-spa.html",
  "Walindi Plantation Resort": "https://www.booking.com/hotel/pg/walindi-plantation-resort.html",
  "Yenkoranu Homestay (Kri Island)": "https://www.booking.com/hotel/id/yenkoranu-dive-center-homestay.html",
  "Yenkoranu Homestay (Kri)": "https://www.booking.com/hotel/id/yenkoranu-dive-center-homestay.html",
};

// ─── Liveaboard DiveBooker URLs ───────────────────────────────────────────────

const LIVEABOARD_DIVEBOOKER = {
  "MV Ambai": "https://www.divebooker.com/ambai-haz254",
  "Mermaid I & II": "https://www.divebooker.com/mermaid-i-haz134",
  "Damai II": "https://www.divebooker.com/damai-ii-haz123",
  "Ocean Hunter III": "https://www.divebooker.com/ocean-hunter-iii-haz94",
  "Palau Aggressor II": "https://www.divebooker.com/palau-aggressor-ii-haz91",
  "Palau Siren": "https://www.divebooker.com/palau-siren-haz45",
  "MV Okeanos Aggressor I": "https://www.divebooker.com/okeanos-aggressor-haz88",
  "MV Argo (Undersea Hunter)": "https://www.divebooker.com/argo-haz85",
  "MV Sea Hunter": "https://www.divebooker.com/sea-hunter-haz84",
  "Galápagos Aggressor III": "https://www.divebooker.com/galapagos-aggressor-iii--haz53",
  "Humboldt Explorer": "https://www.divebooker.com/humboldt-explorer-haz229",
  "Galápagos Master": "https://www.divebooker.com/galapagos-master-haz48",
  "MY Discovery Palawan": "https://www.divebooker.com/discovery-palawan-haz235",
  "MV Resolute": "https://www.divebooker.com/resolute-haz352",
  "Atlantis Azores": "https://www.divebooker.com/atlantis-azores-haz77",
  "MY Blue Pearl": "https://www.divebooker.com/blue-pearl-haz20",
  "MY Emperor Elite": "https://www.divebooker.com/emperor-elite-haz2",
  "MY Red Sea Aggressor IV": "https://www.divebooker.com/red-sea-aggressor-iv-haz426",
  "Red Sea Aggressor IV": "https://www.divebooker.com/red-sea-aggressor-iv-haz426",
  "Blue Force One": "https://www.divebooker.com/blue-force-i-haz142",
  "MV Emperor Voyager": "https://www.divebooker.com/emperor-voyager-haz37",
  "Carpe Diem Maldives": "https://www.divebooker.com/carpe-diem-haz111",
  "Galápagos Sky": "https://www.divebooker.com/galapagos-sky-haz60",
  "MY Stella Maris Explorer": "https://www.divebooker.com/stella-maris-explorer-haz199",
  "MV Manta Queen series": "https://www.divebooker.com/manta-queen-3-haz423",
  "MV Pawara": "https://www.divebooker.com/pawara-haz284",
  "MV FeBrina": "https://www.divebooker.com/febrina-haz258",
  "MV Oceania": "https://www.divebooker.com/oceania-haz357",
  "Fiji Aggressor": "https://www.divebooker.com/fiji-aggressor-haz59",
  "Nai'a Fiji": "https://www.divebooker.com/naia-haz230",
  "Aqua Tiki III": "https://www.divebooker.com/aquatiki-iii-haz399",
  "French Polynesia Master": "https://www.divebooker.com/french-polynesia-master-haz49",
  "Belize Aggressor IV": "https://www.divebooker.com/belize-aggressor-iv-haz51",
  // Sun Dancer II (Belize) is now operating as Belize Aggressor IV
  "Sun Dancer II": "https://www.divebooker.com/belize-aggressor-iv-haz51",
  "Roatan Aggressor": "https://www.divebooker.com/roatan-aggressor-haz272",
  "Bahamas Aggressor": "https://www.divebooker.com/bahamas-aggressor-haz104",
  "All Star Liveaboards Cat Ppalu": "https://www.divebooker.com/cat-ppalu-haz340",
  "Cat Ppalu": "https://www.divebooker.com/cat-ppalu-haz340",
  "Cayman Aggressor V": "https://www.divebooker.com/bvi-aggressor-haz308",
  "Kona Aggressor II": "https://www.divebooker.com/kona-aggressor-haz103",
  "Turks & Caicos Explorer II": "https://www.divebooker.com/turks-caicos-explorer-ii-haz227",
  "MV Adora": "https://www.divebooker.com/adora-haz115",
  "Emperor Explorer": "https://www.divebooker.com/emperor-explorer-haz339",
  "Scubaspa Yang": "https://www.divebooker.com/scubaspa-yang-haz70",
  "MY Snefro Love": "https://www.divebooker.com/snefro-love-haz7",
  "MY Emperor Asmaa": "https://www.divebooker.com/emperor-asmaa-haz35",
  "MY Red Sea Aggressor III": "https://www.divebooker.com/red-sea-aggressor-iii-haz367",
  "MY Royal Evolution": "https://www.divebooker.com/royal-evolution-haz250",
  "MY Sea Serpent Excellence": "https://www.divebooker.com/sea-serpent-excellence-haz17",
  "Oman Aggressor": "https://www.divebooker.com/oman-aggressor-haz252",
  "Galatea Seychelles": "https://www.divebooker.com/galatea-haz74",
  "Sea Bird Seychelles": "https://www.divebooker.com/sea-bird-haz82",
  "Sea Star Seychelles": "https://www.divebooker.com/sea-star-haz81",
  "Spirit of Freedom": "https://www.divebooker.com/spirit-of-freedom-haz154",
  "Mike Ball Spoilsport": "https://www.divebooker.com/spoilsport-haz127",
  "SS Thorfinn": "https://www.divebooker.com/thorfinn-haz191",
  "Truk Master": "https://www.divebooker.com/truk-master-haz54",
  "Truk Odyssey": "https://www.divebooker.com/odyssey-haz207",
};

// ─── Non-DiveBooker liveaboards: fallback to operator's own website ───────────
// isAffiliate=false, partner="direct"

const LIVEABOARD_DIRECT = {
  "Aqua Blu Komodo": "https://www.aquaexpeditions.com/cruise-ships/aqua-blu",
  "Avalon Fleet I": "https://cubandivingcenters.com",
  "Jardines Avalon Fleet II": "https://cubandivingcenters.com",
  "Avalon Fleet III (Tortuga)": "https://cubandivingcenters.com",
  "Azores expedition trips (Master Liveaboards)": "https://masterliveaboards.com",
  "Celebes Explorer": "https://www.sipadan.com/MV-Celebes-Explorer-Liveaboard.php",
  "Conscious Breath Adventures – Belle Amie": "https://www.consciousbreathadventures.com",
  "KLM Cajoma IV": "https://cajoma.co.id/cajoma-iv",
  "MV Chertan": "https://www.mvchertanliveaboard.com",
  "MV Dolphin Dream": "https://www.dolphindreamteam.com",
  "MV Yemaya": "http://www.coibadiveexpeditions.com/web/mv-yemaya/",
  "Sun Dancer II (Silver Bank)": "https://www.explorerventures.com/silver-bank/",
  "True North": "https://truenorth.com.au",
};

// Labels with no confirmed URL — will be removed entirely.
// Reason: no DiveBooker listing and no verifiable own website.
const LIVEABOARD_REMOVE = new Set([
  "MV Hallelujah",
  "MV Spirit of Niugini",
  "Nosy Be Princess II",
  "MY Cassiopeia", // Sudan vessel; only a Mexico Cassiopeia found on DiveBooker — wrong vessel
]);

// ─── Apply changes ────────────────────────────────────────────────────────────

let hotelsUpdated = 0, hotelsRemoved = 0;
let liveaboardsDiveBooker = 0, liveaboardsDirect = 0, liveaboardsRemoved = 0;
let liveaboardsUnknown = [];

for (const site of sites) {
  if (!site.lodging) continue;
  const kept = [];
  for (const entry of site.lodging) {
    if (entry.kind === "hotel") {
      const url = HOTEL_URLS[entry.label];
      if (url) {
        kept.push({ ...entry, url, partner: "Booking.com", isAffiliate: true });
        hotelsUpdated++;
      } else {
        hotelsRemoved++;
        // dropped
      }
    } else if (entry.kind === "liveaboard") {
      if (LIVEABOARD_REMOVE.has(entry.label)) {
        liveaboardsRemoved++;
      } else if (LIVEABOARD_DIVEBOOKER[entry.label]) {
        kept.push({
          ...entry,
          url: LIVEABOARD_DIVEBOOKER[entry.label],
          partner: "DiveBooker",
          isAffiliate: true,
        });
        liveaboardsDiveBooker++;
      } else if (LIVEABOARD_DIRECT[entry.label]) {
        kept.push({
          ...entry,
          url: LIVEABOARD_DIRECT[entry.label],
          partner: "direct",
          isAffiliate: false,
        });
        liveaboardsDirect++;
      } else {
        // Still on liveaboard.com search — flag for investigation
        liveaboardsUnknown.push({ site: site.slug, label: entry.label });
        kept.push(entry);
      }
    } else {
      kept.push(entry);
    }
  }
  site.lodging = kept;
}

writeFileSync(sitesPath, JSON.stringify(sites, null, 2) + "\n", "utf8");

console.log("✓ sites.json updated");
console.log(`  Hotels:     ${hotelsUpdated} updated, ${hotelsRemoved} removed`);
console.log(`  Liveaboards: ${liveaboardsDiveBooker} → DiveBooker, ${liveaboardsDirect} → direct, ${liveaboardsRemoved} removed`);
if (liveaboardsUnknown.length) {
  console.warn(`\n⚠ ${liveaboardsUnknown.length} liveaboard(s) still on old search URL — needs manual fix:`);
  for (const { site, label } of liveaboardsUnknown) {
    console.warn(`  [${site}] ${label}`);
  }
}
