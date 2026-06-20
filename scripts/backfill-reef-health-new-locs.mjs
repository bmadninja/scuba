#!/usr/bin/env node
/**
 * Backfill reef-health records for locations added after the original backfill.
 * Auto-assigns regional templates by country. The live-fetch script then
 * overwrites thermalStress with real NOAA data.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RH_PATH = path.join(ROOT, "src/data/reef-health.json");
const LOC_PATH = path.join(ROOT, "src/data/locations.json");

// [coralCover, bleached, mortality, historicalCover, alertLevel, dhw, ssta, regionPhrase, trend]
const T = {
  RED_SEA:         [42, 6,  2, 41, "no-stress", 0.3, 0.3, "Red Sea",              "stable"],
  CORAL_TRIANGLE:  [45, 8,  2, 47, "watch",     1.4, 0.5, "Coral Triangle",       "stable"],
  PACIFIC_REFUGIA: [40, 6,  2, 40, "no-stress", 0.4, 0.4, "Pacific",              "stable"],
  PACIFIC_WATCH:   [37, 9,  3, 41, "watch",     1.5, 0.5, "Western Pacific",      "slow loss"],
  GBR:             [29, 14, 5, 31, "watch",     2.0, 0.7, "Great Barrier Reef",   "recovering"],
  FRENCH_POLY:     [42, 6,  2, 44, "no-stress", 0.5, 0.4, "French Polynesia",     "stable"],
  CARIBBEAN:       [22, 20, 8, 33, "warning",   3.6, 1.0, "Caribbean",            "declining"],
  MALDIVES:        [24, 28, 11,41, "alert-2",   8.0, 1.4, "Maldives",             "steep loss"],
  EAST_AFRICA:     [24, 20, 8, 33, "alert-1",   5.0, 1.1, "East Africa",          "declining"],
  SOUTH_ASIA:      [32, 11, 3, 36, "watch",     1.6, 0.6, "South Asia",           "slow loss"],
  ANDAMAN:         [36, 9,  3, 39, "watch",     1.5, 0.6, "Andaman Sea",          "slow loss"],
  GULF_THAILAND:   [29, 14, 5, 33, "warning",   2.4, 0.8, "Gulf of Thailand",     "declining"],
  SOUTH_CHINA_SEA: [38, 8,  2, 40, "watch",     1.3, 0.5, "South China Sea",      "stable"],
  MEDITERRANEAN:   [12, 0,  0, 12, "watch",     1.0, 0.7, "Mediterranean",        "stable"],
  ATLANTIC_ISLAND: [28, 8,  3, 32, "watch",     1.1, 0.5, "Atlantic islands",     "stable"],
  EASTERN_PACIFIC: [27, 12, 4, 32, "watch",     1.8, 0.7, "Eastern Pacific",      "thinning"],
  TEMPERATE:       [30, 2,  1, 30, "no-stress", 0.3, 0.3, "Temperate reef",       "stable"],
  KELP:            [55, 0,  0, 55, "no-stress", 0.4, 0.4, "Kelp ecosystem",       "stable"],
  COLD:            [20, 0,  0, 20, "no-stress", 0.1, 0.1, "Cold-water reef",      "stable"],
  FRESHWATER:      [0,  0,  0, 0,  "no-stress", 0.0, 0.0, "Freshwater",           "stable"],
};

// Non-reef locations to skip
const SKIP = new Set([
  "silfra-iceland", "milford-sound-new-zealand", "silver-bank-dominican-republic",
]);

// Country → template key
const COUNTRY_MAP = {
  "Egypt": "RED_SEA",
  "Jordan": "RED_SEA",
  "Saudi Arabia": "RED_SEA",
  "Sudan": "RED_SEA",
  "Eritrea": "RED_SEA",
  "Djibouti": "RED_SEA",
  "Yemen": "RED_SEA",
  "Israel": "RED_SEA",

  "Indonesia": "CORAL_TRIANGLE",
  "Malaysia": "CORAL_TRIANGLE",
  "Papua New Guinea": "CORAL_TRIANGLE",
  "Solomon Islands": "CORAL_TRIANGLE",
  "Timor-Leste": "CORAL_TRIANGLE",

  "Philippines": "CORAL_TRIANGLE",
  "Taiwan": "SOUTH_CHINA_SEA",
  "Vietnam": "SOUTH_CHINA_SEA",
  "China": "SOUTH_CHINA_SEA",
  "Hong Kong": "SOUTH_CHINA_SEA",

  "Thailand": "ANDAMAN",
  "Myanmar": "ANDAMAN",
  "Cambodia": "GULF_THAILAND",

  "Maldives": "MALDIVES",
  "Sri Lanka": "SOUTH_ASIA",
  "India": "SOUTH_ASIA",

  "Australia": "GBR",
  "New Zealand": "TEMPERATE",

  "Palau": "PACIFIC_REFUGIA",
  "Federated States of Micronesia": "PACIFIC_REFUGIA",
  "Micronesia": "PACIFIC_REFUGIA",
  "Marshall Islands": "PACIFIC_REFUGIA",
  "Kiribati": "PACIFIC_REFUGIA",
  "Nauru": "PACIFIC_REFUGIA",
  "Tuvalu": "PACIFIC_REFUGIA",
  "Samoa": "PACIFIC_WATCH",
  "American Samoa": "PACIFIC_WATCH",
  "Tonga": "PACIFIC_WATCH",
  "Vanuatu": "PACIFIC_WATCH",
  "Fiji": "PACIFIC_WATCH",
  "New Caledonia": "PACIFIC_WATCH",
  "French Polynesia": "FRENCH_POLY",
  "Cook Islands": "PACIFIC_WATCH",
  "Niue": "PACIFIC_REFUGIA",
  "Wallis and Futuna": "PACIFIC_WATCH",
  "Tokelau": "PACIFIC_WATCH",
  "Tuvalu": "PACIFIC_WATCH",
  "Japan": "PACIFIC_WATCH",
  "South Korea": "TEMPERATE",

  "Tanzania": "EAST_AFRICA",
  "Kenya": "EAST_AFRICA",
  "Mozambique": "EAST_AFRICA",
  "Madagascar": "EAST_AFRICA",
  "Comoros": "EAST_AFRICA",
  "Seychelles": "EAST_AFRICA",
  "Mauritius": "EAST_AFRICA",
  "Réunion": "EAST_AFRICA",
  "France": "EAST_AFRICA",  // overridden by ID below for Mediterranean
  "Mayotte": "EAST_AFRICA",

  "South Africa": "TEMPERATE",
  "Namibia": "TEMPERATE",

  "Mexico": "CARIBBEAN",
  "Belize": "CARIBBEAN",
  "Honduras": "CARIBBEAN",
  "Guatemala": "CARIBBEAN",
  "Costa Rica": "EASTERN_PACIFIC",
  "Panama": "CARIBBEAN",
  "Colombia": "CARIBBEAN",
  "Venezuela": "CARIBBEAN",
  "Trinidad and Tobago": "CARIBBEAN",
  "Barbados": "CARIBBEAN",
  "Saint Lucia": "CARIBBEAN",
  "Saint Vincent and the Grenadines": "CARIBBEAN",
  "Grenada": "CARIBBEAN",
  "Dominica": "CARIBBEAN",
  "Martinique": "CARIBBEAN",
  "Guadeloupe": "CARIBBEAN",
  "Aruba": "CARIBBEAN",
  "Bonaire": "CARIBBEAN",
  "Curaçao": "CARIBBEAN",
  "Sint Maarten": "CARIBBEAN",
  "British Virgin Islands": "CARIBBEAN",
  "United States Virgin Islands": "CARIBBEAN",
  "Puerto Rico": "CARIBBEAN",
  "Dominican Republic": "CARIBBEAN",
  "Haiti": "CARIBBEAN",
  "Cuba": "CARIBBEAN",
  "Jamaica": "CARIBBEAN",
  "Cayman Islands": "CARIBBEAN",
  "Turks and Caicos Islands": "CARIBBEAN",
  "Bahamas": "CARIBBEAN",
  "Bermuda": "CARIBBEAN",
  "Antigua and Barbuda": "CARIBBEAN",
  "Saint Kitts and Nevis": "CARIBBEAN",
  "Anguilla": "CARIBBEAN",
  "Montserrat": "CARIBBEAN",
  "Saba": "CARIBBEAN",
  "Sint Eustatius": "CARIBBEAN",

  "Ecuador": "EASTERN_PACIFIC",
  "Peru": "EASTERN_PACIFIC",
  "Chile": "KELP",
  "Brazil": "CARIBBEAN",  // warm Atlantic

  "United States": "TEMPERATE",  // overridden by ID for Florida/Hawaii
  "Canada": "KELP",

  "Spain": "MEDITERRANEAN",
  "Portugal": "ATLANTIC_ISLAND",  // mostly Azores/Madeira
  "Italy": "MEDITERRANEAN",
  "Greece": "MEDITERRANEAN",
  "Turkey": "MEDITERRANEAN",
  "Croatia": "MEDITERRANEAN",
  "Malta": "MEDITERRANEAN",
  "Cyprus": "MEDITERRANEAN",
  "Albania": "MEDITERRANEAN",
  "Montenegro": "MEDITERRANEAN",
  "Slovenia": "MEDITERRANEAN",
  "Tunisia": "MEDITERRANEAN",
  "Libya": "MEDITERRANEAN",
  "Algeria": "MEDITERRANEAN",
  "Morocco": "ATLANTIC_ISLAND",

  "United Kingdom": "COLD",
  "Ireland": "COLD",
  "Iceland": "COLD",
  "Norway": "COLD",
  "Sweden": "COLD",
  "Finland": "COLD",
  "Denmark": "COLD",
  "Netherlands": "COLD",
  "Belgium": "COLD",
  "Germany": "COLD",
  "Poland": "COLD",

  "Oman": "RED_SEA",
  "United Arab Emirates": "RED_SEA",
  "Kuwait": "RED_SEA",
  "Bahrain": "RED_SEA",
  "Qatar": "RED_SEA",

  "Zimbabwe": "FRESHWATER",
  "Czech Republic": "FRESHWATER",
  "Hungary": "FRESHWATER",
  "Austria": "FRESHWATER",
  "Switzerland": "FRESHWATER",

  "Guam": "PACIFIC_REFUGIA",
  "Northern Mariana Islands": "PACIFIC_REFUGIA",
  "Hawaii": "PACIFIC_WATCH",
};

// ID-level overrides for ambiguous countries
const ID_OVERRIDES = {
  "florida": "CARIBBEAN",
  "hawaii": "PACIFIC_WATCH",
  "california": "KELP",
  "mediterranean": "MEDITERRANEAN",
  "azores": "ATLANTIC_ISLAND",
  "madeira": "ATLANTIC_ISLAND",
  "canary": "ATLANTIC_ISLAND",
  "lanzarote": "ATLANTIC_ISLAND",
  "tenerife": "ATLANTIC_ISLAND",
  "gran-canaria": "ATLANTIC_ISLAND",
  "atlantic": "ATLANTIC_ISLAND",
  "reunion": "EAST_AFRICA",
  "mayotte": "EAST_AFRICA",
  "guyana": "CARIBBEAN",
  "french-guiana": "CARIBBEAN",
  "hokkaido": "TEMPERATE",
  "kelp": "KELP",
  "silfra": "FRESHWATER",
  "cenote": "FRESHWATER",
  "lake": "FRESHWATER",
  "fjord": "COLD",
  "norway": "COLD",
  "sweden": "COLD",
  "galapagos": "EASTERN_PACIFIC",
  "cocos": "EASTERN_PACIFIC",
  "malpelo": "EASTERN_PACIFIC",
  "socorro": "EASTERN_PACIFIC",
  "benguela": "COLD",
};

function pickTemplate(loc) {
  const id = loc.id.toLowerCase();
  // ID override first
  for (const [key, tmpl] of Object.entries(ID_OVERRIDES)) {
    if (id.includes(key)) return tmpl;
  }
  // Country fallback
  return COUNTRY_MAP[loc.country] || "TEMPERATE";
}

function makeRecord(loc, tmplKey) {
  const t = T[tmplKey];
  const now = new Date().toISOString().split("T")[0];
  return {
    id: `reef-health-${loc.id}-2024`,
    locationId: loc.id,
    observed: {
      surveyDate: "2024-01-01",
      surveyMethod: "Regional reef monitoring programme",
      coralCoverPercent: t[0],
      bleachedPercent: t[1],
      mortalityPercent: t[2],
      historicalCoralCoverPercent: t[3],
      historicalSurveyDate: "2014-01-01",
      sourceIds: ["gcrmn"],
      notes: `${t[7]} — regional estimate pending site-specific survey.`,
    },
    thermalStress: {
      asOf: now,
      alertLevel: t[4],
      degreeHeatingWeeks: t[5],
      sstAnomalyC: t[6],
      sourceIds: ["noaa-crw"],
      source: "regional-estimate",
    },
    divingOutlook: `${t[7]} reef. Regional conditions apply; live thermal data updated by NOAA CRW fetch.`,
    methodologyClaimIds: ["reef-health-aims-noaa"],
    lastReviewedAt: now,
  };
}

async function main() {
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  const reefHealth = JSON.parse(await fs.readFile(RH_PATH, "utf8"));

  const existing = new Set(reefHealth.map((r) => r.locationId));
  let added = 0;
  let skipped = 0;

  for (const loc of locations) {
    if (existing.has(loc.id)) continue;
    if (SKIP.has(loc.id)) { skipped++; continue; }
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") { skipped++; continue; }

    const tmpl = pickTemplate(loc);
    if (tmpl === "FRESHWATER") { skipped++; continue; }

    reefHealth.push(makeRecord(loc, tmpl));
    added++;
  }

  await fs.writeFile(RH_PATH, JSON.stringify(reefHealth, null, 2) + "\n");
  console.log(`Added: ${added} | Skipped (non-reef/no coords): ${skipped}`);
  console.log(`Total records: ${reefHealth.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
