// One-shot migration: scuba-seasons.json → locations.json + sites.json + gear.json
// Run: node --experimental-strip-types scripts/migrate.ts

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Gear, Location, Site } from "../src/lib/data/types.ts";

type LegacyEntry = {
  id: string;
  site: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  diveStyle?: string;
  season: {
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
  };
  notes: string;
};

const ROOT = resolve(import.meta.dirname, "..");
const SRC = resolve(ROOT, "src/data/scuba-seasons.json");
const OUT_LOCATIONS = resolve(ROOT, "src/data/locations.json");
const OUT_SITES = resolve(ROOT, "src/data/sites.json");
const OUT_GEAR = resolve(ROOT, "src/data/gear.json");

// ISO-3166 alpha-2 for every country in the existing dataset.
const COUNTRY_ISO2: Record<string, string> = {
  Australia: "AU",
  Bahamas: "BS",
  Belize: "BZ",
  Bonaire: "BQ",
  Brazil: "BR",
  Cambodia: "KH",
  "Cape Verde": "CV",
  "Cayman Islands": "KY",
  China: "CN",
  Colombia: "CO",
  Comoros: "KM",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cuba: "CU",
  "Curaçao": "CW",
  Djibouti: "DJ",
  "Dominican Republic": "DO",
  Ecuador: "EC",
  Egypt: "EG",
  Eritrea: "ER",
  "Federated States of Micronesia": "FM",
  Fiji: "FJ",
  "French Polynesia": "PF",
  Grenada: "GD",
  Honduras: "HN",
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Italy: "IT",
  Japan: "JP",
  Jordan: "JO",
  Kenya: "KE",
  Madagascar: "MG",
  Malaysia: "MY",
  Maldives: "MV",
  Malta: "MT",
  Mexico: "MX",
  Mozambique: "MZ",
  Myanmar: "MM",
  "New Zealand": "NZ",
  Niue: "NU",
  Oman: "OM",
  Palau: "PW",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Philippines: "PH",
  Portugal: "PT",
  Saba: "BQ",
  "Saint Lucia": "LC",
  "Saudi Arabia": "SA",
  Seychelles: "SC",
  "Sint Eustatius": "BQ",
  "Solomon Islands": "SB",
  "South Africa": "ZA",
  "South Korea": "KR",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sudan: "SD",
  "São Tomé and Príncipe": "ST",
  Taiwan: "TW",
  Tanzania: "TZ",
  Thailand: "TH",
  "Trinidad and Tobago": "TT",
  "United Arab Emirates": "AE",
  "United States": "US",
  Vanuatu: "VU",
  Venezuela: "VE",
  Vietnam: "VN",
};

const monthRangeToList = (startMonth: number, endMonth: number): number[] => {
  if (startMonth <= endMonth) {
    return Array.from({ length: endMonth - startMonth + 1 }, (_, i) => startMonth + i);
  }
  // wraps over year (e.g. Nov-Apr)
  const tail = Array.from({ length: 12 - startMonth + 1 }, (_, i) => startMonth + i);
  const head = Array.from({ length: endMonth }, (_, i) => i + 1);
  return [...tail, ...head];
};

const legacy: LegacyEntry[] = JSON.parse(readFileSync(SRC, "utf8"));

const locations: Location[] = legacy.map((entry) => {
  const code = COUNTRY_ISO2[entry.country];
  if (!code) {
    throw new Error(`Missing ISO-2 for country: ${entry.country}`);
  }
  return {
    id: entry.id,
    slug: entry.id,
    name: entry.site,
    country: entry.country,
    region: entry.region,
    countryCode: code,
    lat: entry.lat,
    lng: entry.lng,
    description: entry.notes,
    bestMonths: monthRangeToList(entry.season.startMonth, entry.season.endMonth),
    siteIds: [],
  };
});

const sites: Site[] = [];

const seedGear: Gear[] = [
  {
    id: "mask-cressi-f1",
    name: "Cressi F1 Frameless Mask",
    category: "mask",
    levels: ["never-dived", "open-water", "advanced", "rescue", "divemaster", "tech"],
    description: "Low-volume frameless mask, popular entry-level pick. Black silicone reduces glare.",
    priceRangeUsd: { min: 40, max: 60 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
  {
    id: "snorkel-aqualung-impulse",
    name: "Aqualung Impulse 3 Snorkel",
    category: "snorkel",
    levels: ["never-dived", "open-water"],
    description: "Splash-guard dry-style snorkel. Good for surface swims and snorkel pairings.",
    priceRangeUsd: { min: 25, max: 45 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
  {
    id: "fins-mares-avanti-quattro",
    name: "Mares Avanti Quattro Plus Fins",
    category: "fins",
    levels: ["open-water", "advanced", "rescue", "divemaster"],
    description: "Power fins for current diving, four-channel blade design.",
    priceRangeUsd: { min: 120, max: 180 },
    partners: [{ partner: "scuba-com", productId: "TBD", url: "https://www.scuba.com/", commission: 8 }],
  },
  {
    id: "boots-henderson-aqualock-7",
    name: "Henderson Aqualock 7mm Boots",
    category: "boots",
    levels: ["open-water", "advanced", "rescue"],
    description: "Warm boots for temperate or cold diving. Pairs with open-heel fins.",
    priceRangeUsd: { min: 60, max: 90 },
    partners: [{ partner: "leisure-pro", productId: "TBD", url: "https://www.leisurepro.com/", commission: 6 }],
  },
  {
    id: "wetsuit-bare-3mm-full",
    name: "Bare Reactive 3mm Full Wetsuit",
    category: "wetsuit",
    levels: ["open-water", "advanced", "rescue", "divemaster"],
    description: "Tropical-to-temperate 3mm full suit. Stretch panels for mobility.",
    priceRangeUsd: { min: 200, max: 280 },
    partners: [{ partner: "divers-direct", productId: "TBD", url: "https://www.diversdirect.com/", commission: 7 }],
  },
  {
    id: "wetsuit-aqualung-aquaflex-5mm",
    name: "Aqualung Aquaflex 5mm Wetsuit",
    category: "wetsuit",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "Cool-water 5mm full suit for Galapagos, Socorro, Cocos.",
    priceRangeUsd: { min: 280, max: 400 },
    partners: [{ partner: "scuba-com", productId: "TBD", url: "https://www.scuba.com/", commission: 8 }],
  },
  {
    id: "drysuit-fourth-element-argonaut",
    name: "Fourth Element Argonaut Drysuit",
    category: "drysuit",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "Trilaminate drysuit for cold-water diving (Silfra, BC, UK).",
    priceRangeUsd: { min: 1800, max: 2400 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "bcd-scubapro-hydros-pro",
    name: "ScubaPro Hydros Pro BCD",
    category: "bcd",
    levels: ["open-water", "advanced", "rescue", "divemaster"],
    description: "Modular back-inflate BCD, travel-friendly, replaceable harness.",
    priceRangeUsd: { min: 700, max: 900 },
    partners: [{ partner: "leisure-pro", productId: "TBD", url: "https://www.leisurepro.com/", commission: 6 }],
  },
  {
    id: "reg-apeks-xtx200",
    name: "Apeks XTX200 Regulator Set",
    category: "regulator",
    levels: ["open-water", "advanced", "rescue", "divemaster", "tech"],
    description: "Cold-water rated, environmentally sealed first stage. Workhorse pick.",
    priceRangeUsd: { min: 800, max: 1100 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "computer-shearwater-peregrine",
    name: "Shearwater Peregrine Dive Computer",
    category: "computer",
    levels: ["open-water", "advanced", "rescue", "divemaster"],
    description: "Bright color screen, simple recreational profile, no-frills reliability.",
    priceRangeUsd: { min: 450, max: 550 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "computer-shearwater-teric",
    name: "Shearwater Teric Wrist Computer",
    category: "computer",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "Air-integrated capable, multi-gas tech computer in wristwatch form.",
    priceRangeUsd: { min: 1000, max: 1200 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "light-bigblue-vl5500p",
    name: "BigBlue VL5500P Dive Light",
    category: "light",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "Primary light for wrecks, caverns, night dives. 5500-lumen flood.",
    priceRangeUsd: { min: 350, max: 450 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "smb-xs-scuba-deluxe",
    name: "XS Scuba 6ft Closed-Bottom SMB",
    category: "reel-smb",
    levels: ["open-water", "advanced", "rescue", "divemaster", "tech"],
    description: "Surface marker buoy with reel kit. Required for drift dives.",
    priceRangeUsd: { min: 55, max: 90 },
    partners: [{ partner: "scuba-com", productId: "TBD", url: "https://www.scuba.com/", commission: 8 }],
  },
  {
    id: "reef-hook-dive-rite",
    name: "Dive Rite Reef Hook with Lanyard",
    category: "reef-hook",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "For current-exposed sites (Palau, Komodo, Galapagos). Hooks into dead reef only.",
    priceRangeUsd: { min: 25, max: 40 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "gloves-akona-3mm",
    name: "Akona 3mm Reef Gloves",
    category: "gloves",
    levels: ["open-water", "advanced", "rescue"],
    description: "Thin protective gloves where operator rules permit.",
    priceRangeUsd: { min: 25, max: 40 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
  {
    id: "hood-bare-5mm",
    name: "Bare 5mm Coldwater Hood",
    category: "hood",
    levels: ["advanced", "rescue", "divemaster", "tech"],
    description: "Cold-water hood for upwellings (Galapagos, Cocos, Channel Islands).",
    priceRangeUsd: { min: 45, max: 70 },
    partners: [{ partner: "leisure-pro", productId: "TBD", url: "https://www.leisurepro.com/", commission: 6 }],
  },
  {
    id: "bag-akona-roller",
    name: "Akona Roller Dive Bag",
    category: "bag",
    levels: ["open-water", "advanced", "rescue", "divemaster", "tech"],
    description: "Travel-ready wheeled gear bag, holds full kit for international dive trips.",
    priceRangeUsd: { min: 150, max: 220 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
  {
    id: "starter-kit-package",
    name: "Beginner Mask/Snorkel/Fin Set",
    category: "specialty",
    levels: ["never-dived", "open-water"],
    description: "Discover-scuba and first-OW-trip kit. Mask + snorkel + open-heel fins + boots in a bag.",
    priceRangeUsd: { min: 180, max: 280 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
  {
    id: "pony-bottle-19cf",
    name: "Catalina 19cf Pony Bottle Setup",
    category: "specialty",
    levels: ["rescue", "divemaster", "tech"],
    description: "Redundant-air pony for deeper or solo work. Tech / advanced rec only.",
    priceRangeUsd: { min: 400, max: 600 },
    partners: [{ partner: "dgx", productId: "TBD", url: "https://www.divegearexpress.com/", commission: 5 }],
  },
  {
    id: "muck-stick-trident",
    name: "Trident Stainless Muck Stick",
    category: "specialty",
    levels: ["advanced", "rescue", "divemaster"],
    description: "For macro photography on sand bottoms — only where operator rules allow.",
    priceRangeUsd: { min: 30, max: 45 },
    partners: [{ partner: "amazon", productId: "TBD", url: "https://www.amazon.com/", commission: 4 }],
  },
];

writeFileSync(OUT_LOCATIONS, `${JSON.stringify(locations, null, 2)}\n`, "utf8");
writeFileSync(OUT_SITES, `${JSON.stringify(sites, null, 2)}\n`, "utf8");
writeFileSync(OUT_GEAR, `${JSON.stringify(seedGear, null, 2)}\n`, "utf8");

console.log(`Wrote ${locations.length} locations → src/data/locations.json`);
console.log(`Wrote ${sites.length} sites → src/data/sites.json`);
console.log(`Wrote ${seedGear.length} gear items → src/data/gear.json`);
