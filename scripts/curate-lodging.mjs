#!/usr/bin/env node
/**
 * Hand-curated hotel + liveaboard data per location, across low/mid/high
 * price tiers. Falls back to Booking.com + LiveaboardBookings search links
 * when a location isn't in the curated map.
 *
 * Curated picks are real, well-known properties pulled from training data —
 * verify before using affiliate codes. URLs are search queries (safer than
 * dead deep links).
 *
 * Run: node scripts/curate-lodging.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const sitesPath = new URL("../src/data/sites.json", import.meta.url);
const locsPath = new URL("../src/data/locations.json", import.meta.url);
const sites = JSON.parse(readFileSync(sitesPath, "utf8"));
const locations = JSON.parse(readFileSync(locsPath, "utf8"));
const locById = new Map(locations.map((l) => [l.id, l]));

const bookingSearch = (q) =>
  `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(q)}`;
const liveaboardSearch = (q) =>
  `https://www.liveaboard.com/diving/search?destination=${encodeURIComponent(q)}`;

const hotel = (label, priceLevel, query) => ({
  partner: "Booking.com",
  label,
  url: bookingSearch(query ?? label),
  isAffiliate: false,
  priceLevel,
  kind: "hotel",
});
const liveaboard = (label, priceLevel, query) => ({
  partner: "LiveaboardBookings",
  label,
  url: liveaboardSearch(query ?? label),
  isAffiliate: false,
  priceLevel,
  kind: "liveaboard",
});

/**
 * Curated picks. Each location: { hotels: [low, mid, high], liveaboards: [...] }
 * If a location has no realistic liveaboard scene, liveaboards is omitted and
 * the fallback skips the section.
 */
const CURATED = {
  "ari-atoll-maldives": {
    hotels: [
      hotel("Dhigurah Island Guesthouses", 1, "Dhigurah Maldives"),
      hotel("Vilamendhoo Island Resort", 3, "Vilamendhoo Island Resort"),
      hotel("Constance Halaveli Maldives", 4, "Constance Halaveli"),
    ],
    liveaboards: [
      liveaboard("Blue Force One", 2, "Blue Force One Maldives"),
      liveaboard("MV Emperor Voyager", 3, "Emperor Voyager Maldives"),
      liveaboard("Carpe Diem Maldives", 4, "Carpe Diem Maldives"),
    ],
  },
  "north-male-atoll-maldives": {
    hotels: [
      hotel("Hulhumalé guesthouses", 1, "Hulhumale Maldives"),
      hotel("Bandos Maldives", 3, "Bandos Maldives"),
      hotel("Four Seasons Kuda Huraa", 4, "Four Seasons Kuda Huraa"),
    ],
    liveaboards: [
      liveaboard("MV Adora", 2, "Adora Maldives liveaboard"),
      liveaboard("Emperor Explorer", 3, "Emperor Explorer Maldives"),
      liveaboard("Scubaspa Yang", 4, "Scubaspa Yang Maldives"),
    ],
  },
  "raja-ampat-indonesia": {
    hotels: [
      hotel("Yenkoranu Homestay (Kri Island)", 1, "Yenkoranu Homestay Raja Ampat"),
      hotel("Raja Ampat Biodiversity Eco Resort", 3, "Raja Ampat Biodiversity Eco Resort"),
      hotel("Misool Eco Resort", 4, "Misool Eco Resort"),
    ],
    liveaboards: [
      liveaboard("MV Ambai", 2, "Ambai liveaboard Raja Ampat"),
      liveaboard("Mermaid I & II", 3, "Mermaid liveaboard Raja Ampat"),
      liveaboard("Damai II", 4, "Damai II liveaboard Indonesia"),
    ],
  },
  "komodo-national-park-indonesia": {
    hotels: [
      hotel("Bayview Gardens Hotel Labuan Bajo", 1, "Bayview Gardens Hotel Labuan Bajo"),
      hotel("Sudamala Resort Komodo", 3, "Sudamala Resort Seraya"),
      hotel("Plataran Komodo Resort", 4, "Plataran Komodo Resort"),
    ],
    liveaboards: [
      liveaboard("KLM Cajoma IV", 2, "Cajoma liveaboard Komodo"),
      liveaboard("Mermaid I & II", 3, "Mermaid liveaboard Komodo"),
      liveaboard("Aqua Blu Komodo", 4, "Aqua Blu Komodo"),
    ],
  },
  "tulamben-bali-indonesia": {
    hotels: [
      hotel("Bali Reef Divers Tulamben", 1, "Bali Reef Divers Tulamben"),
      hotel("Siddhartha Ocean Front Resort", 3, "Siddhartha Ocean Front Resort Tulamben"),
      hotel("Alila Manggis", 4, "Alila Manggis"),
    ],
  },
  "bunaken-indonesia": {
    hotels: [
      hotel("Daniel's Homestay Bunaken", 1, "Daniel's Homestay Bunaken"),
      hotel("Bunaken Oasis Dive Resort", 3, "Bunaken Oasis Dive Resort"),
      hotel("Siladen Resort & Spa", 4, "Siladen Resort and Spa"),
    ],
  },
  "malapascua-philippines": {
    hotels: [
      hotel("Mike & Diose's Cottages", 1, "Mike and Dioses Malapascua"),
      hotel("Tepanee Beach Resort", 3, "Tepanee Beach Resort Malapascua"),
      hotel("Ocean Vida Beach Resort", 3, "Ocean Vida Malapascua"),
    ],
    liveaboards: [
      liveaboard("Atlantis Azores", 4, "Atlantis Azores liveaboard"),
    ],
  },
  "tubbataha-philippines": {
    hotels: [
      hotel("Casa Amiga Pension (Puerto Princesa)", 1, "Casa Amiga Pension Puerto Princesa"),
      hotel("Hotel Centro Puerto Princesa", 3, "Hotel Centro Puerto Princesa"),
      hotel("Sheridan Beach Resort Palawan", 4, "Sheridan Beach Resort Palawan"),
    ],
    liveaboards: [
      liveaboard("MY Discovery Palawan", 2, "Discovery Palawan liveaboard"),
      liveaboard("MV Resolute", 3, "Resolute liveaboard Tubbataha"),
      liveaboard("Atlantis Azores", 4, "Atlantis Azores Tubbataha"),
    ],
  },
  "similan-islands-thailand": {
    hotels: [
      hotel("Khao Lak budget guesthouses", 1, "Khao Lak guesthouse"),
      hotel("La Flora Resort Khao Lak", 3, "La Flora Resort Khao Lak"),
      hotel("The Sarojin Khao Lak", 4, "The Sarojin Khao Lak"),
    ],
    liveaboards: [
      liveaboard("MV Manta Queen series", 2, "Manta Queen liveaboard"),
      liveaboard("MV Hallelujah", 3, "Hallelujah liveaboard Similan"),
      liveaboard("MV Pawara", 4, "Pawara liveaboard Similan"),
    ],
  },
  "sipadan-malaysia": {
    hotels: [
      hotel("Uncle Chang's Mabul", 1, "Uncle Chang Mabul"),
      hotel("Mabul Water Bungalows", 3, "Mabul Water Bungalows"),
      hotel("Sipadan Kapalai Dive Resort", 4, "Sipadan Kapalai Dive Resort"),
    ],
    liveaboards: [
      liveaboard("Celebes Explorer", 3, "Celebes Explorer Sipadan"),
    ],
  },
  "cocos-costa-rica": {
    liveaboards: [
      liveaboard("MV Okeanos Aggressor I", 3, "Okeanos Aggressor Cocos"),
      liveaboard("MV Argo (Undersea Hunter)", 4, "Argo Cocos Island"),
      liveaboard("MV Sea Hunter", 4, "Sea Hunter Cocos Island"),
    ],
  },
  "wolf-galapagos-ecuador": {
    liveaboards: [
      liveaboard("Galápagos Aggressor III", 3, "Galapagos Aggressor III"),
      liveaboard("Humboldt Explorer", 4, "Humboldt Explorer Galapagos"),
      liveaboard("Galápagos Master", 4, "Galapagos Master liveaboard"),
    ],
  },
  "darwin-galapagos-ecuador": {
    liveaboards: [
      liveaboard("Galápagos Aggressor III", 3, "Galapagos Aggressor III"),
      liveaboard("Humboldt Explorer", 4, "Humboldt Explorer Galapagos"),
      liveaboard("Galápagos Sky", 4, "Galapagos Sky liveaboard"),
    ],
  },
  "socorro-mexico": {
    liveaboards: [
      liveaboard("MV Rocio del Mar", 3, "Rocio del Mar Socorro"),
      liveaboard("Nautilus Explorer", 3, "Nautilus Explorer Socorro"),
      liveaboard("Nautilus Belle Amie", 4, "Nautilus Belle Amie"),
    ],
  },
  "cozumel-mexico": {
    hotels: [
      hotel("Hotel Flamingo Cozumel", 1, "Hotel Flamingo Cozumel"),
      hotel("Casa Mexicana Cozumel", 3, "Casa Mexicana Cozumel"),
      hotel("Presidente InterContinental Cozumel", 4, "Presidente InterContinental Cozumel"),
    ],
  },
  "blue-hole-belize": {
    hotels: [
      hotel("Caye Caulker guesthouses", 1, "Caye Caulker Belize"),
      hotel("Ramon's Village Resort San Pedro", 3, "Ramon's Village Resort Belize"),
      hotel("Victoria House Resort & Spa", 4, "Victoria House Resort San Pedro Belize"),
    ],
    liveaboards: [
      liveaboard("Belize Aggressor IV", 3, "Belize Aggressor IV"),
      liveaboard("Sun Dancer II", 4, "Sun Dancer II Belize"),
    ],
  },
  "bonaire-national-marine-park-bonaire": {
    hotels: [
      hotel("Bonaire Seaside Apartments", 1, "Bonaire Seaside Apartments"),
      hotel("Buddy Dive Resort Bonaire", 3, "Buddy Dive Resort Bonaire"),
      hotel("Harbour Village Beach Club", 4, "Harbour Village Beach Club Bonaire"),
    ],
  },
  "tiger-beach-bahamas": {
    hotels: [
      hotel("Bimini Big Game Club", 3, "Bimini Big Game Club"),
      hotel("Resorts World Bimini", 4, "Resorts World Bimini"),
    ],
    liveaboards: [
      liveaboard("MV Dolphin Dream", 3, "Dolphin Dream Bahamas Tiger Beach"),
      liveaboard("Bahamas Aggressor", 3, "Bahamas Aggressor"),
      liveaboard("All Star Liveaboards Cat Ppalu", 4, "Cat Ppalu Bahamas"),
    ],
  },
  "brothers-egypt": {
    hotels: [
      hotel("Roots Camp El Quseir", 1, "Roots Camp El Quseir"),
      hotel("Movenpick El Quseir", 3, "Movenpick El Quseir"),
      hotel("Marsa Shagra Village (upscale tents)", 3, "Marsa Shagra Village"),
    ],
    liveaboards: [
      liveaboard("MY Blue Pearl", 2, "Blue Pearl Red Sea liveaboard"),
      liveaboard("MY Emperor Elite", 3, "Emperor Elite Red Sea"),
      liveaboard("MY Red Sea Aggressor IV", 4, "Red Sea Aggressor IV"),
    ],
  },
  "ras-mohammed-egypt": {
    hotels: [
      hotel("Camel Dive Club & Hotel Sharm", 1, "Camel Dive Club Sharm"),
      hotel("Sharm Plaza Resort", 3, "Sharm Plaza Resort"),
      hotel("Four Seasons Sharm El Sheikh", 4, "Four Seasons Sharm El Sheikh"),
    ],
    liveaboards: [
      liveaboard("MY Snefro Love", 2, "Snefro Love Red Sea"),
      liveaboard("MY Emperor Asmaa", 3, "Emperor Asmaa Red Sea"),
      liveaboard("MY Red Sea Aggressor III", 4, "Red Sea Aggressor III"),
    ],
  },
  "chuuk-lagoon-fsm": {
    hotels: [
      hotel("Truk Stop Hotel", 1, "Truk Stop Hotel"),
      hotel("Blue Lagoon Resort Chuuk", 3, "Blue Lagoon Resort Chuuk"),
    ],
    liveaboards: [
      liveaboard("SS Thorfinn", 3, "SS Thorfinn Truk"),
      liveaboard("Truk Master", 3, "Truk Master liveaboard"),
      liveaboard("Truk Odyssey", 4, "Truk Odyssey liveaboard"),
    ],
  },
  "blue-corner-palau": {
    hotels: [
      hotel("Palau Central Hotel", 1, "Palau Central Hotel Koror"),
      hotel("Sea Passion Hotel Palau", 3, "Sea Passion Hotel Palau"),
      hotel("Palau Pacific Resort", 4, "Palau Pacific Resort"),
    ],
    liveaboards: [
      liveaboard("Ocean Hunter III", 3, "Ocean Hunter Palau"),
      liveaboard("Palau Aggressor II", 4, "Palau Aggressor II"),
      liveaboard("Palau Siren", 4, "Palau Siren liveaboard"),
    ],
  },
  "jellyfish-lake-palau": {
    hotels: [
      hotel("Palau Central Hotel", 1, "Palau Central Hotel Koror"),
      hotel("Sea Passion Hotel Palau", 3, "Sea Passion Hotel Palau"),
      hotel("Palau Pacific Resort", 4, "Palau Pacific Resort"),
    ],
  },
  "fakarava-french-polynesia": {
    hotels: [
      hotel("Pension Paparara Fakarava", 1, "Pension Paparara Fakarava"),
      hotel("Havaiki Lodge Fakarava", 3, "Havaiki Lodge Fakarava"),
      hotel("White Sand Beach Resort Fakarava", 4, "White Sand Beach Resort Fakarava"),
    ],
    liveaboards: [
      liveaboard("Aqua Tiki III", 3, "Aqua Tiki Tuamotu"),
      liveaboard("French Polynesia Master", 4, "French Polynesia Master"),
    ],
  },
  "rangiroa-french-polynesia": {
    hotels: [
      hotel("Pension Loyna Rangiroa", 1, "Pension Loyna Rangiroa"),
      hotel("Hotel Maitai Rangiroa", 3, "Hotel Maitai Rangiroa"),
      hotel("Kia Ora Resort & Spa", 4, "Kia Ora Resort Rangiroa"),
    ],
    liveaboards: [
      liveaboard("Aqua Tiki III", 3, "Aqua Tiki Tuamotu"),
      liveaboard("French Polynesia Master", 4, "French Polynesia Master"),
    ],
  },
  "kona-hawaii-usa": {
    hotels: [
      hotel("Uncle Billy's Kona Bay Hotel", 1, "Uncle Billys Kona"),
      hotel("Royal Kona Resort", 3, "Royal Kona Resort"),
      hotel("Four Seasons Resort Hualalai", 4, "Four Seasons Hualalai"),
    ],
    liveaboards: [
      liveaboard("Kona Aggressor II", 3, "Kona Aggressor"),
    ],
  },
  "cenotes-mexico": {
    hotels: [
      hotel("Tulum hostels & cabanas", 1, "Tulum hostel"),
      hotel("Hotel Cabañas Tulum", 3, "Hotel Cabanas Tulum"),
      hotel("Hotel Esencia Riviera Maya", 4, "Hotel Esencia Tulum"),
    ],
  },
  "roatan-honduras": {
    hotels: [
      hotel("Roatan Backpackers Hostel", 1, "Roatan Backpackers Hostel"),
      hotel("Anthony's Key Resort", 3, "Anthonys Key Resort Roatan"),
      hotel("Pristine Bay Resort", 4, "Pristine Bay Roatan"),
    ],
    liveaboards: [
      liveaboard("Roatan Aggressor", 4, "Roatan Aggressor"),
    ],
  },
  "utila-honduras": {
    hotels: [
      hotel("Mango Inn Utila", 1, "Mango Inn Utila"),
      hotel("Utila Lodge", 3, "Utila Lodge"),
      hotel("Laguna Beach Resort Utila", 4, "Laguna Beach Resort Utila"),
    ],
  },
  "beqa-lagoon-fiji": {
    hotels: [
      hotel("Batiluva Beach Resort Beqa", 1, "Batiluva Beach Resort Beqa"),
      hotel("Lalati Resort & Spa Beqa", 3, "Lalati Resort Beqa"),
      hotel("Beqa Lagoon Resort", 4, "Beqa Lagoon Resort"),
    ],
  },
  "great-white-wall-fiji": {
    hotels: [
      hotel("Taveuni Island Resort", 3, "Taveuni Island Resort"),
      hotel("Paradise Taveuni", 3, "Paradise Taveuni"),
      hotel("Garden Island Resort Taveuni", 4, "Garden Island Resort Taveuni"),
    ],
    liveaboards: [
      liveaboard("Fiji Aggressor", 3, "Fiji Aggressor"),
      liveaboard("Nai'a Fiji", 4, "Naia liveaboard Fiji"),
    ],
  },

  // ---------- Second curation batch ----------

  "apo-reef-philippines": {
    hotels: [
      hotel("Apo Reef Club (Sablayan)", 1, "Apo Reef Club Sablayan"),
      hotel("Pandan Island Resort", 3, "Pandan Island Resort Sablayan"),
      hotel("Club Paradise Palawan", 4, "Club Paradise Palawan"),
    ],
    liveaboards: [
      liveaboard("MY Stella Maris Explorer", 3, "Stella Maris Explorer Philippines"),
      liveaboard("Atlantis Azores", 4, "Atlantis Azores liveaboard"),
    ],
  },
  "moalboal-philippines": {
    hotels: [
      hotel("Chief Mau Backpackers", 1, "Chief Mau Backpackers Moalboal"),
      hotel("Magic Oceans Dive Resort", 3, "Magic Oceans Moalboal"),
      hotel("Pescador Island View Apartments", 4, "Pescador Island View Moalboal"),
    ],
  },
  "koh-tao-thailand": {
    hotels: [
      hotel("Mr J Bungalows Koh Tao", 1, "Mr J Bungalows Koh Tao"),
      hotel("Koh Tao Cabana", 3, "Koh Tao Cabana"),
      hotel("Jamahkiri Resort & Spa", 4, "Jamahkiri Resort Koh Tao"),
    ],
  },
  "richelieu-rock-thailand": {
    hotels: [
      hotel("Khao Lak budget guesthouses", 1, "Khao Lak guesthouse"),
      hotel("La Flora Resort Khao Lak", 3, "La Flora Resort Khao Lak"),
      hotel("The Sarojin Khao Lak", 4, "The Sarojin Khao Lak"),
    ],
    liveaboards: [
      liveaboard("MV Manta Queen series", 2, "Manta Queen liveaboard"),
      liveaboard("MV Hallelujah", 3, "Hallelujah liveaboard Similan"),
      liveaboard("MV Pawara", 4, "Pawara liveaboard Similan"),
    ],
  },
  "mabul-malaysia": {
    hotels: [
      hotel("Uncle Chang's Mabul", 1, "Uncle Chang Mabul"),
      hotel("Mabul Water Bungalows", 3, "Mabul Water Bungalows"),
      hotel("Sipadan Kapalai Dive Resort", 4, "Sipadan Kapalai Dive Resort"),
    ],
  },
  "layang-layang-malaysia": {
    hotels: [
      hotel("Avillion Layang Layang Island Resort", 3, "Avillion Layang Layang"),
    ],
  },
  "kimbe-bay-papua-new-guinea": {
    hotels: [
      hotel("Walindi Plantation Resort", 3, "Walindi Plantation Resort"),
      hotel("Liamo Reef Resort", 3, "Liamo Reef Resort Kimbe"),
    ],
    liveaboards: [
      liveaboard("MV FeBrina", 3, "FeBrina liveaboard Kimbe Bay"),
      liveaboard("MV Oceania", 4, "Oceania liveaboard Papua New Guinea"),
    ],
  },
  "milne-bay-papua-new-guinea": {
    hotels: [
      hotel("Tawali Leisure & Dive Resort", 3, "Tawali Resort Milne Bay"),
      hotel("Driftwood Resort Alotau", 3, "Driftwood Resort Alotau"),
    ],
    liveaboards: [
      liveaboard("MV Chertan", 3, "Chertan liveaboard Milne Bay"),
      liveaboard("MV Spirit of Niugini", 3, "Spirit of Niugini PNG"),
      liveaboard("MV Oceania", 4, "Oceania liveaboard Papua New Guinea"),
    ],
  },
  "the-pit-belize": {
    hotels: [
      hotel("Caye Caulker guesthouses", 1, "Caye Caulker Belize"),
      hotel("Ramon's Village Resort San Pedro", 3, "Ramons Village Resort Belize"),
      hotel("Victoria House Resort & Spa", 4, "Victoria House Resort San Pedro Belize"),
    ],
    liveaboards: [
      liveaboard("Belize Aggressor IV", 3, "Belize Aggressor IV"),
      liveaboard("Sun Dancer II", 4, "Sun Dancer II Belize"),
    ],
  },
  "turneffe-belize": {
    hotels: [
      hotel("Caye Caulker guesthouses", 1, "Caye Caulker Belize"),
      hotel("Turneffe Flats Lodge", 3, "Turneffe Flats Lodge"),
      hotel("Turneffe Island Resort", 4, "Turneffe Island Resort"),
    ],
    liveaboards: [
      liveaboard("Belize Aggressor IV", 3, "Belize Aggressor IV"),
      liveaboard("Sun Dancer II", 4, "Sun Dancer II Belize"),
    ],
  },
  "coiba-panama": {
    hotels: [
      hotel("Hostal Heliconia Santa Catalina", 1, "Hostal Heliconia Santa Catalina"),
      hotel("Hibiscus Garden Hotel", 3, "Hibiscus Garden Hotel Santa Catalina"),
      hotel("Santa Catalina Boutique Hotel", 4, "Santa Catalina Boutique Hotel"),
    ],
    liveaboards: [
      liveaboard("MV Yemaya", 3, "Yemaya Coiba liveaboard"),
    ],
  },
  "westpunt-curacao": {
    hotels: [
      hotel("All West Apartments & Diving", 1, "All West Apartments Curacao"),
      hotel("Lodge Kura Hulanda Beach Club", 3, "Lodge Kura Hulanda Beach Club"),
      hotel("Sandals Royal Curaçao", 4, "Sandals Royal Curacao"),
    ],
  },
  "saba-saba": {
    hotels: [
      hotel("Scout's Place Saba", 1, "Scouts Place Saba"),
      hotel("Juliana's Hotel Saba", 3, "Julianas Hotel Saba"),
      hotel("Queen's Gardens Resort Saba", 4, "Queens Gardens Resort Saba"),
    ],
  },
  "exuma-cays-bahamas": {
    hotels: [
      hotel("Peace & Plenty Hotel Exuma", 1, "Peace and Plenty Exuma"),
      hotel("Grand Isle Resort Exuma", 4, "Grand Isle Resort Exuma"),
      hotel("Fowl Cay Resort", 4, "Fowl Cay Resort Exuma"),
    ],
    liveaboards: [
      liveaboard("Bahamas Aggressor", 3, "Bahamas Aggressor"),
      liveaboard("Cat Ppalu", 4, "Cat Ppalu Bahamas"),
    ],
  },
  "bloody-bay-wall-cayman-islands": {
    hotels: [
      hotel("Pirates Point Resort Little Cayman", 3, "Pirates Point Little Cayman"),
      hotel("Little Cayman Beach Resort", 3, "Little Cayman Beach Resort"),
      hotel("Southern Cross Club", 4, "Southern Cross Club Little Cayman"),
    ],
    liveaboards: [
      liveaboard("Cayman Aggressor V", 3, "Cayman Aggressor"),
    ],
  },
  "florida-keys-usa": {
    hotels: [
      hotel("Seafarer Resort Key Largo", 1, "Seafarer Resort Key Largo"),
      hotel("Amoray Dive Resort Key Largo", 3, "Amoray Dive Resort Key Largo"),
      hotel("Cheeca Lodge & Spa Islamorada", 4, "Cheeca Lodge Islamorada"),
    ],
  },
  "cuba-jardines-de-la-reina": {
    liveaboards: [
      liveaboard("Avalon Fleet I", 3, "Avalon Fleet Jardines de la Reina"),
      liveaboard("Jardines Avalon Fleet II", 3, "Jardines Avalon Fleet II"),
      liveaboard("Avalon Fleet III (Tortuga)", 4, "Avalon Tortuga Jardines"),
    ],
  },
  "fernando-de-noronha-brazil": {
    hotels: [
      hotel("Pousada do Vale Noronha", 1, "Pousada do Vale Noronha"),
      hotel("Pousada Maravilha", 4, "Pousada Maravilha Noronha"),
      hotel("Nannai Noronha Solar dos Ventos", 4, "Nannai Noronha"),
    ],
  },
  "los-roques-venezuela": {
    hotels: [
      hotel("Posada Mediterraneo Los Roques", 1, "Posada Mediterraneo Los Roques"),
      hotel("Posada Acquamarina", 3, "Posada Acquamarina Los Roques"),
      hotel("Posada La Cigala", 4, "Posada La Cigala Los Roques"),
    ],
  },
  "silver-bank-dominican-republic": {
    liveaboards: [
      liveaboard("Turks & Caicos Explorer II", 3, "Turks and Caicos Explorer II Silver Bank"),
      liveaboard("Sun Dancer II (Silver Bank)", 4, "Sun Dancer II Silver Bank"),
      liveaboard("Conscious Breath Adventures – Belle Amie", 4, "Conscious Breath Silver Bank"),
    ],
  },
  "sudan-shaab-rumi": {
    liveaboards: [
      liveaboard("MY Cassiopeia", 2, "Cassiopeia Sudan liveaboard"),
      liveaboard("MY Royal Evolution", 3, "Royal Evolution Sudan"),
      liveaboard("MY Sea Serpent Excellence", 4, "Sea Serpent Excellence Sudan"),
    ],
  },
  "aqaba-jordan": {
    hotels: [
      hotel("Captain's Hotel Aqaba", 1, "Captains Hotel Aqaba"),
      hotel("DoubleTree by Hilton Aqaba", 3, "DoubleTree Aqaba"),
      hotel("Kempinski Hotel Aqaba", 4, "Kempinski Aqaba"),
    ],
  },
  "daymaniyat-oman": {
    hotels: [
      hotel("Muscat Inn Hotel", 1, "Muscat Inn Hotel"),
      hotel("Crowne Plaza Muscat", 3, "Crowne Plaza Muscat"),
      hotel("The Chedi Muscat", 4, "The Chedi Muscat"),
    ],
    liveaboards: [
      liveaboard("Oman Aggressor", 4, "Oman Aggressor"),
    ],
  },
  "mahe-seychelles": {
    hotels: [
      hotel("Hanneman Holiday Residence", 1, "Hanneman Holiday Residence Mahe"),
      hotel("Avani Seychelles Barbarons", 3, "Avani Seychelles Barbarons"),
      hotel("Four Seasons Resort Seychelles", 4, "Four Seasons Seychelles"),
    ],
    liveaboards: [
      liveaboard("Galatea Seychelles", 3, "Galatea Seychelles liveaboard"),
      liveaboard("Sea Bird Seychelles", 3, "Sea Bird Seychelles"),
      liveaboard("Sea Star Seychelles", 4, "Sea Star Seychelles liveaboard"),
    ],
  },
  "tofo-mozambique": {
    hotels: [
      hotel("Fatima's Nest Tofo", 1, "Fatimas Nest Tofo"),
      hotel("Casa Barry Beach Lodge", 3, "Casa Barry Tofo"),
      hotel("Mozambeat Motel Tofo", 3, "Mozambeat Motel Tofo"),
    ],
  },
  "aliwal-south-africa": {
    hotels: [
      hotel("Aliwal Dive Lodge", 1, "Aliwal Dive Lodge Umkomaas"),
      hotel("Pumula Beach Hotel", 3, "Pumula Beach Hotel"),
      hotel("Beverley Country Cottages", 3, "Beverley Country Cottages KZN"),
    ],
  },
  "sodwana-south-africa": {
    hotels: [
      hotel("Coral Divers Sodwana Bay", 1, "Coral Divers Sodwana"),
      hotel("Reef Teach Lodge Sodwana", 3, "Reef Teach Sodwana"),
      hotel("Thonga Beach Lodge", 4, "Thonga Beach Lodge Mabibi"),
    ],
  },
  "nosy-be-madagascar": {
    hotels: [
      hotel("Chez Maman Hotel Nosy Be", 1, "Chez Maman Nosy Be"),
      hotel("Vanila Hotel & Spa Nosy Be", 3, "Vanila Hotel Nosy Be"),
      hotel("Tsara Komba Lodge", 4, "Tsara Komba Lodge"),
    ],
    liveaboards: [
      liveaboard("Nosy Be Princess II", 3, "Nosy Be Princess liveaboard"),
    ],
  },
  "silfra-iceland": {
    hotels: [
      hotel("Hostel Skogarholmi Þingvellir", 1, "Hostel near Thingvellir Iceland"),
      hotel("ION Adventure Hotel Þingvellir", 4, "ION Adventure Hotel Iceland"),
      hotel("Hotel Borealis (Reykjavík base)", 3, "Hotel Borealis Reykjavik"),
    ],
  },
  "gozo-malta": {
    hotels: [
      hotel("Downtown Hotel Gozo", 1, "Downtown Hotel Gozo Victoria"),
      hotel("Grand Hotel Gozo", 3, "Grand Hotel Gozo"),
      hotel("Kempinski Hotel San Lawrenz Gozo", 4, "Kempinski San Lawrenz Gozo"),
    ],
  },
  "vis-croatia": {
    hotels: [
      hotel("Apartments Diana Vis", 1, "Apartments Diana Vis"),
      hotel("Hotel San Giorgio Vis", 3, "Hotel San Giorgio Vis"),
      hotel("Issa Heritage Hotel Vis", 4, "Issa Heritage Hotel Vis"),
    ],
  },
  "medes-islands-spain": {
    hotels: [
      hotel("Hostal La Tuna L'Estartit", 1, "Hostal La Tuna Estartit"),
      hotel("Hotel Bell Aire L'Estartit", 3, "Hotel Bell Aire Estartit"),
      hotel("Hotel Sant Joan L'Estartit", 4, "Hotel Sant Joan Estartit"),
    ],
  },
  "azores-portugal": {
    hotels: [
      hotel("Charming Blue Hotel Santa Maria", 1, "Charming Blue Hotel Santa Maria Azores"),
      hotel("Hotel Colombo Santa Maria", 3, "Hotel Colombo Santa Maria"),
      hotel("Santa Bárbara Eco-Beach Resort", 4, "Santa Barbara Eco Beach Resort Azores"),
    ],
    liveaboards: [
      liveaboard("Azores expedition trips (Master Liveaboards)", 4, "Azores Master liveaboard"),
    ],
  },
  "cod-hole-australia": {
    hotels: [
      hotel("Cairns Backpackers", 1, "Cairns backpackers"),
      hotel("Shangri-La The Marina Cairns", 3, "Shangri-La Cairns"),
      hotel("Crystalbrook Riley Cairns", 4, "Crystalbrook Riley Cairns"),
    ],
    liveaboards: [
      liveaboard("Spirit of Freedom", 3, "Spirit of Freedom liveaboard"),
      liveaboard("Mike Ball Spoilsport", 3, "Mike Ball Spoilsport"),
      liveaboard("True North", 4, "True North Australia liveaboard"),
    ],
  },
  "ningaloo-australia": {
    hotels: [
      hotel("Exmouth Cape Holiday Park", 1, "Exmouth Cape Holiday Park"),
      hotel("Mantarays Ningaloo Beach Resort", 3, "Mantarays Ningaloo"),
      hotel("Sal Salis Ningaloo Reef", 4, "Sal Salis Ningaloo"),
    ],
    liveaboards: [
      liveaboard("True North", 4, "True North Australia liveaboard"),
    ],
  },
  "julian-rocks-australia": {
    hotels: [
      hotel("Aloha Lane Byron Bay", 1, "Aloha Lane Byron Bay"),
      hotel("The Atlantic Byron Bay", 3, "The Atlantic Byron Bay"),
      hotel("Rae's on Wategos", 4, "Raes on Wategos Byron Bay"),
    ],
  },
  "poor-knights-new-zealand": {
    hotels: [
      hotel("Tutukaka Holiday Park", 1, "Tutukaka Holiday Park"),
      hotel("Pacific Rendezvous Resort Tutukaka", 3, "Pacific Rendezvous Tutukaka"),
      hotel("Lodge Bordeaux Whangarei", 4, "Lodge Bordeaux Whangarei"),
    ],
  },
  "milford-sound-new-zealand": {
    hotels: [
      hotel("Te Anau YHA Lakefront Backpackers", 1, "Te Anau YHA"),
      hotel("Distinction Te Anau Hotel & Villas", 3, "Distinction Te Anau"),
      hotel("Milford Sound Lodge (Mountain View Lodges)", 4, "Milford Sound Lodge"),
    ],
  },
  "manta-ridge-yap": {
    hotels: [
      hotel("Pathways Hotel Yap", 1, "Pathways Hotel Yap"),
      hotel("Manta Ray Bay Resort", 3, "Manta Ray Bay Resort Yap"),
      hotel("Traders' Ridge Resort Yap", 4, "Traders Ridge Resort Yap"),
    ],
  },
  "president-coolidge-vanuatu": {
    hotels: [
      hotel("Deco Stop Lodge Santo", 1, "Deco Stop Lodge Espiritu Santo"),
      hotel("Aore Island Resort", 3, "Aore Island Resort Vanuatu"),
      hotel("The Espiritu Hotel Santo", 3, "The Espiritu Hotel Luganville"),
    ],
  },
};

function fallbackLodging(loc) {
  const ss = loc ? `${loc.name}, ${loc.country}` : "";
  return [
    hotel(`Budget hotels in ${loc?.name ?? "area"}`, 1, ss + " budget"),
    hotel(`Mid-range hotels in ${loc?.name ?? "area"}`, 3, ss),
    hotel(`Luxury hotels in ${loc?.name ?? "area"}`, 4, ss + " luxury"),
  ];
}

// Group sites by location to apply curation once per location.
const sitesByLoc = new Map();
for (const s of sites) {
  if (!sitesByLoc.has(s.locationId)) sitesByLoc.set(s.locationId, []);
  sitesByLoc.get(s.locationId).push(s);
}

let curated = 0;
let fallback = 0;
for (const [locId, locSites] of sitesByLoc) {
  const loc = locById.get(locId);
  const data = CURATED[locId];

  let lodging;
  if (data) {
    lodging = [...(data.hotels ?? []), ...(data.liveaboards ?? [])];
    curated++;
  } else {
    lodging = fallbackLodging(loc);
    fallback++;
  }

  for (const s of locSites) {
    s.lodging = lodging.map((l) => ({ ...l }));
  }
}

writeFileSync(sitesPath, JSON.stringify(sites, null, 2) + "\n");
console.log(`curated locations: ${curated}; fallback locations: ${fallback}`);
