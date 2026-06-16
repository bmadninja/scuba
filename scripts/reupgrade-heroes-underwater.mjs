#!/usr/bin/env node
/**
 * Re-upgrade all site/location heroes to guaranteed-underwater Pexels photos.
 *
 * Problem with the previous upgrade: location-name queries like
 * "Palau Blue Holes scuba diving underwater" return above-water resort/boat
 * photos because Pexels matches the location name first.
 *
 * This script fixes it by using ONLY species-first and dive-type queries.
 * Species names (whale shark, manta ray, coral, etc.) almost exclusively
 * appear in underwater photography.
 *
 * Run:
 *   PEXELS_API_KEY=xxx node scripts/reupgrade-heroes-underwater.mjs
 *   PEXELS_API_KEY=xxx node scripts/reupgrade-heroes-underwater.mjs --dry
 *   PEXELS_API_KEY=xxx node scripts/reupgrade-heroes-underwater.mjs --sites-only
 *   PEXELS_API_KEY=xxx node scripts/reupgrade-heroes-underwater.mjs --locations-only
 *   PEXELS_API_KEY=xxx node scripts/reupgrade-heroes-underwater.mjs --limit=50
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

const DRY = process.argv.includes("--dry");
const SITES_ONLY = process.argv.includes("--sites-only");
const LOCS_ONLY = process.argv.includes("--locations-only");
const LIMIT = (() => {
  const arg = process.argv.find((a) => a.startsWith("--limit="));
  return arg ? parseInt(arg.split("=")[1]) : Infinity;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Dive types that map to reliable underwater Pexels queries
const DIVE_TYPE_QUERIES = {
  "wall-dive": "coral wall dive underwater reef fish",
  "wreck-dive": "shipwreck underwater scuba diving",
  "drift-dive": "drift diving reef current fish underwater",
  "cave-dive": "underwater cave diving",
  "night-dive": "night diving reef underwater torch",
  "muck-dive": "muck diving critters underwater macro",
  "reef-dive": "coral reef scuba diving fish underwater",
  "pelagic": "open ocean scuba diving fish underwater",
};

function buildSpeciesQueries(site) {
  const species = (site.species ?? []).map((s) => (s.commonName || s.name || "").toLowerCase()).filter(Boolean);

  // Tier-1: species pairs (highest underwater confidence)
  const queries = [];
  if (species[0] && species[1]) queries.push(`${species[0]} ${species[1]} underwater reef`);
  if (species[0]) queries.push(`${species[0]} scuba diving underwater reef`);
  if (species[1]) queries.push(`${species[1]} underwater coral reef`);
  if (species[2]) queries.push(`${species[2]} underwater reef fish`);

  // Tier-2: dive types (still underwater-specific)
  for (const dt of (site.diveTypes ?? [])) {
    const q = DIVE_TYPE_QUERIES[dt];
    if (q) { queries.push(q); break; } // one dive-type query max
  }

  // Tier-3: varied generic underwater fallbacks — no location names, maximise pool spread
  queries.push("coral reef scuba diving fish underwater");
  queries.push("tropical reef underwater diving colorful fish");
  queries.push("scuba diver coral reef blue ocean underwater");
  queries.push("underwater ocean fish coral blue diving");
  queries.push("reef shark coral fish underwater diving");
  queries.push("sea turtle underwater coral reef ocean");
  queries.push("scuba diving underwater tropical ocean fish");
  queries.push("colorful reef fish underwater coral sea");

  return queries;
}

function buildLocationQueries(loc) {
  // For locations: use region/habitat, never the location name itself
  const regionLower = (loc.region ?? "").toLowerCase();
  const queries = [];

  // Region-based underwater hints
  if (regionLower.includes("pacific")) queries.push("pacific coral reef scuba diving fish underwater");
  if (regionLower.includes("indian")) queries.push("indian ocean reef diving fish underwater");
  if (regionLower.includes("caribbean")) queries.push("caribbean coral reef scuba diving fish");
  if (regionLower.includes("red sea")) queries.push("red sea coral reef scuba diving underwater");
  if (regionLower.includes("atlantic")) queries.push("atlantic ocean scuba diving fish underwater");
  if (regionLower.includes("micronesia") || regionLower.includes("polynesia")) queries.push("pacific island reef diving fish underwater");

  // Generic underwater fallbacks
  queries.push("coral reef scuba diving fish underwater");
  queries.push("tropical reef underwater diving colorful fish");
  queries.push("ocean reef scuba diving underwater");

  return queries;
}

function isPexels(url) {
  return url?.includes("images.pexels.com");
}

async function tryPexels(queries, currentUrl) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 40 });
    await sleep(350);
    for (const r of results) {
      if (r.srcWidth < 2000) continue;
      if (r.url === currentUrl) continue;
      if (isUsed(r.url)) continue;
      return { ...r, query: q };
    }
  }
  return null;
}

async function main() {
  if (!process.env.PEXELS_API_KEY) {
    console.error("PEXELS_API_KEY not set");
    process.exit(1);
  }

  await loadRegistry();
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);

  // Delete all current Pexels URLs from the registry before searching.
  // markUsed(url, null) only nulls the value — the key stays in the registry
  // and isUsed() still returns true. We must delete the key to actually free it.
  let freed = 0;
  const reg = await import("./lib/photo-registry.mjs");
  // Access internal registry map via a fresh load; we delete keys directly.
  // Since we already called loadRegistry(), the module's registry is populated.
  // We'll use a workaround: re-export a deleteUsed helper.
  // Simpler: just re-read and rebuild the registry minus Pexels keys.
  const rawReg = JSON.parse(await fs.readFile(reg.REGISTRY_PATH, "utf8").catch(() => "{}"));
  for (const url of Object.keys(rawReg)) {
    if (url.includes("images.pexels.com")) {
      delete rawReg[url];
      freed++;
    }
  }
  // Overwrite the registry file with Pexels entries removed, then reload.
  await fs.writeFile(reg.REGISTRY_PATH, JSON.stringify(rawReg, null, 2) + "\n");
  await reg.loadRegistry(); // reload so in-memory state matches file
  console.log(`Freed ${freed} Pexels URLs from registry.`);

  let siteHits = 0, siteMiss = 0, siteSkip = 0;
  let locHits = 0, locMiss = 0;
  let processed = 0;

  if (!LOCS_ONLY) {
    console.log(`\n── Sites (${sites.length}, limit=${LIMIT}) ──`);
    for (const site of sites) {
      if (!site.heroImageUrl) { siteSkip++; continue; }
      if (processed >= LIMIT) break;

      const queries = buildSpeciesQueries(site);
      const pick = await tryPexels(queries, site.heroImageUrl);
      processed++;

      if (pick) {
        siteHits++;
        const wasSource = isPexels(site.heroImageUrl) ? "pexels" : "wiki";
        console.log(`[✓] ${site.slug}  (was:${wasSource})  q="${pick.query.slice(0, 60)}"`);
        if (!DRY) {
          site.heroImageUrl = pick.url;
          // Also replace first entry in heroImages array if it exists
          if (site.heroImages?.length) site.heroImages[0] = pick.url;
          markUsed(pick.url, site.slug);
        }
      } else {
        siteMiss++;
        console.log(`[∅] ${site.slug}  no match`);
      }
    }
  }

  processed = 0;
  if (!SITES_ONLY) {
    console.log(`\n── Locations (${locations.length}) ──`);
    for (const loc of locations) {
      if (!loc.heroImageUrl) continue;
      if (processed >= LIMIT) break;

      const queries = buildLocationQueries(loc);
      const pick = await tryPexels(queries, loc.heroImageUrl);
      processed++;

      if (pick) {
        locHits++;
        const wasSource = isPexels(loc.heroImageUrl) ? "pexels" : "wiki";
        console.log(`[✓] ${loc.slug}  (was:${wasSource})  q="${pick.query.slice(0, 60)}"`);
        if (!DRY) {
          loc.heroImageUrl = pick.url;
          if (loc.heroImages?.length) loc.heroImages[0] = pick.url;
          markUsed(pick.url, loc.slug);
        }
      } else {
        locMiss++;
        console.log(`[∅] ${loc.slug}  no match`);
      }
    }
  }

  if (!DRY) {
    await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
    await saveRegistry();
    console.log("\nWrote sites.json, locations.json, used-hero-urls.json.");
  } else {
    console.log("\n[dry run] no files written.");
  }

  console.log(`\nSites:     upgraded=${siteHits} | no-match=${siteMiss} | skipped=${siteSkip}`);
  console.log(`Locations: upgraded=${locHits} | no-match=${locMiss}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
