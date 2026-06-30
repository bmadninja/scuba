#!/usr/bin/env node
/**
 * Adds missing countries as location entries using free APIs:
 *   Wikidata → coordinates
 *   Wikipedia → description
 *   Nominatim → fallback geocoding
 *
 * After adding locations, re-runs enrich-coverage-gaps-free.mjs for any
 * gap sites that match the new locations.
 *
 * Usage:
 *   node scripts/add-missing-locations.mjs
 *   DRY_RUN=1 node scripts/add-missing-locations.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");

const DRY_RUN = process.env.DRY_RUN === "1";
const UA = "scubaseason.fun/1.0 (hello@scubaseason.fun)";

// Missing locations to add — fallbackCoords used when Wikidata/Nominatim miss
const MISSING = [
  {
    country: "Zimbabwe", countryCode: "ZW", name: "Chinhoyi Caves", region: "Mashonaland West",
    wikiTitle: "Chinhoyi Caves", fallbackCoords: { lat: -17.357, lng: 30.129 },
    description: "Zimbabwe's flooded limestone cave system, famous for the crystal-clear Sleeping Pool used for cave diving.",
    photoQueries: ["underwater cave blue cavern diving", "freshwater cave blue pool underwater"],
  },
  {
    country: "Hong Kong", countryCode: "HK", name: "Hoi Ha Wan", region: "Sai Kung",
    wikiTitle: "Hoi Ha Wan Marine Park", fallbackCoords: { lat: 22.471, lng: 114.335 },
    description: "Hong Kong's premier marine park, protecting coral communities and diverse reef fish in sheltered waters off Sai Kung.",
    photoQueries: ["reef fish school underwater asia", "colorful reef fish underwater"],
  },
  {
    country: "Czech Republic", countryCode: "CZ", name: "Hranice Abyss", region: "Moravia",
    wikiTitle: "Hranice Abyss", fallbackCoords: { lat: 49.563, lng: 17.728 },
    description: "The world's deepest known flooded cave — a technical diving destination of global significance in the Czech Republic.",
    photoQueries: ["cave diving underwater abyss", "technical diving cave underwater blue"],
  },
  {
    country: "Guam", countryCode: "GU", name: "Apra Harbor", region: "Central Guam",
    wikiTitle: "Apra Harbor", fallbackCoords: { lat: 13.444, lng: 144.650 },
    description: "Guam's main harbor holds some of the Pacific's most accessible wreck diving, including WWII Japanese and American vessels.",
    photoQueries: ["shipwreck reef underwater pacific", "wreck diving underwater tropical"],
  },
  {
    country: "Turks and Caicos", countryCode: "TC", name: "Providenciales", region: "Caicos Islands",
    wikiTitle: "Providenciales", fallbackCoords: { lat: 21.773, lng: -72.266 },
    description: "The dive hub of the Turks and Caicos Islands, offering world-class wall diving, shark encounters, and gin-clear visibility.",
    photoQueries: ["caribbean reef shark underwater", "reef wall diving caribbean underwater"],
  },
  {
    country: "Puerto Rico", countryCode: "PR", name: "San Juan", region: "Northeast",
    wikiTitle: "Puerto Rico", fallbackCoords: { lat: 18.466, lng: -66.106 },
    description: "Puerto Rico offers varied diving from shallow coral gardens near San Juan to deep walls off the west coast and Mona Island.",
    photoQueries: ["caribbean reef fish underwater ocean", "tropical coral reef underwater caribbean"],
  },
  {
    country: "Yemen", countryCode: "YE", name: "Socotra", region: "Socotra Archipelago",
    wikiTitle: "Socotra", fallbackCoords: { lat: 12.463, lng: 53.824 },
    description: "One of the world's most isolated archipelagos, Socotra's reefs support endemic species found nowhere else on Earth.",
    photoQueries: ["indian ocean reef fish underwater", "tropical reef diverse fish underwater"],
  },
];

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { headers: { "User-Agent": UA, ...opts.headers }, ...opts });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function wikidataCoords(name) {
  const encoded = encodeURIComponent(
    `SELECT ?item ?coord WHERE { ?item rdfs:label "${name.replace(/"/g,'\\"')}"@en . OPTIONAL { ?item wdt:P625 ?coord } } LIMIT 3`
  );
  try {
    const d = await fetchJson(`https://query.wikidata.org/sparql?query=${encoded}&format=json`,
      { headers: { Accept: "application/sparql-results+json" } });
    const b = (d?.results?.bindings ?? []).find((b) => b.coord?.value);
    if (b) {
      const m = b.coord.value.match(/Point\(([0-9.-]+)\s+([0-9.-]+)\)/);
      if (m) return { lng: parseFloat(m[1]), lat: parseFloat(m[2]) };
    }
  } catch (_) {}
  return null;
}

async function nominatimCoords(query) {
  await sleep(1100);
  try {
    const d = await fetchJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3`);
    if (d?.length) return { lat: parseFloat(d[0].lat), lng: parseFloat(d[0].lon) };
  } catch (_) {}
  return null;
}

async function wikipediaExtract(title) {
  try {
    const d = await fetchJson(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json`
    );
    const page = Object.values(d?.query?.pages ?? {})[0];
    if (page?.extract && !page.missing) return page.extract.slice(0, 400);
  } catch (_) {}
  return null;
}

function slugify(s) {
  return s.toLowerCase().replace(/[^\w\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").trim();
}

function bestMonthsFromLat(lat) {
  const a = Math.abs(lat);
  if (a < 15) return [1,2,3,4,5,10,11,12];
  if (a < 25) return lat >= 0 ? [11,12,1,2,3,4] : [5,6,7,8,9];
  if (a < 35) return lat >= 0 ? [6,7,8,9] : [12,1,2,3];
  return lat >= 0 ? [6,7,8,9] : [12,1,2,3];
}

const DIVE_HERO_QUERIES = [
  "coral reef fish underwater ocean",
  "scuba diving reef underwater",
  "underwater ocean marine life",
  "tropical reef diving fish",
  "ocean reef fish school underwater",
];

async function fetchHero(extraQueries = []) {
  for (const q of [...extraQueries, ...DIVE_HERO_QUERIES]) {
    for (let page = 1; page <= 4; page++) {
      const results = await pexelsSearch(q, { perPage: 15, page });
      await sleep(250);
      const pick = results.find((r) => r.srcWidth >= 1600 && !isUsed(r.url));
      if (pick) { markUsed(pick.url); return pick.url; }
      if (results.length < 15) break;
    }
  }
  return null;
}

async function buildLocation(entry) {
  console.log(`\n→ ${entry.name}, ${entry.country}`);

  // Always use hardcoded fallback coords — skip Wikidata/Nominatim (rate-limited)
  const coords = entry.fallbackCoords;
  console.log(`  coords: ${coords.lat}, ${coords.lng} (hardcoded)`);

  const wikiText = await wikipediaExtract(entry.wikiTitle);
  await sleep(300);

  const description = entry.description || (wikiText?.split(/\n/)[0]?.slice(0, 300)) || `${entry.name} is a dive destination in ${entry.country}.`;

  console.log("  → fetching hero photo...");
  const heroImageUrl = await fetchHero(entry.photoQueries ?? []);
  if (!heroImageUrl) { console.log("  ⚠ No hero found, skipping (hook would block)"); return null; }
  console.log(`  ✓ hero: ${heroImageUrl.slice(0, 60)}...`);

  const slug = slugify(`${entry.name}-${entry.country}`);

  return {
    id: slug,
    slug,
    name: entry.name,
    country: entry.country,
    countryCode: entry.countryCode,
    region: entry.region,
    lat: Math.round(coords.lat * 10000) / 10000,
    lng: Math.round(coords.lng * 10000) / 10000,
    description,
    bestMonths: bestMonthsFromLat(coords.lat),
    siteIds: [],
    heroImageUrl,
    lodging: [],
  };
}

async function main() {
  if (!process.env.PEXELS_API_KEY) { console.error("PEXELS_API_KEY required"); process.exit(1); }
  await loadRegistry();
  const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));
  const existingCountries = new Set(locations.map((l) => l.country));

  const toAdd = MISSING.filter((e) => !existingCountries.has(e.country));
  console.log(`Adding ${toAdd.length} missing locations (${MISSING.length - toAdd.length} already present)`);

  const added = [];
  for (const entry of toAdd) {
    try {
      const loc = await buildLocation(entry);
      if (!loc) continue;
      if (DRY_RUN) {
        console.log("  [DRY_RUN]", JSON.stringify(loc, null, 2));
      } else {
        locations.push(loc);
        added.push(loc.name);
        console.log(`  ✓ Added ${loc.name}`);
      }
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  if (!DRY_RUN && added.length) {
    writeFileSync(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
    await saveRegistry();
    const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
    execSync(`git add src/data/locations.json src/data/sites.json src/data/used-hero-urls.json`, { stdio: "inherit" });
    execSync(`${GIT} commit -m "data: add ${added.length} missing locations (${added.join(', ')})"`, { stdio: "inherit" });
    console.log(`\n✓ Committed ${added.length} new locations. Running gap fill...`);

    // Now fill their sites
    execSync(`MAX_SITES=15 node scripts/enrich-coverage-gaps-free.mjs`, { stdio: "inherit" });
  } else if (!added.length) {
    console.log("\nAll countries already present.");
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
