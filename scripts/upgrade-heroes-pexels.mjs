#!/usr/bin/env node
/**
 * Upgrade Wikimedia hero images to Pexels for all sites and locations.
 *
 * For each entity with a Wikimedia hero, searches Pexels with site/location-
 * specific queries and replaces if a match is found. Entities already using
 * Pexels or without a hero are skipped.
 *
 * Run:
 *   PEXELS_API_KEY=xxx node scripts/upgrade-heroes-pexels.mjs
 *   PEXELS_API_KEY=xxx node scripts/upgrade-heroes-pexels.mjs --dry
 *   PEXELS_API_KEY=xxx node scripts/upgrade-heroes-pexels.mjs --locations-only
 *   PEXELS_API_KEY=xxx node scripts/upgrade-heroes-pexels.mjs --sites-only
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
const FILL_NULLS = process.argv.includes("--fill-nulls");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isWikimedia(url) {
  return url && url.includes("upload.wikimedia.org");
}

function buildSiteQueries(site, locName) {
  const topSpecies = (site.species || []).slice(0, 2).map((s) => s.commonName || s.name).filter(Boolean);
  const queries = [
    topSpecies[0] ? `${topSpecies[0]} underwater reef` : null,
    `${site.name} scuba diving underwater`,
    locName ? `${locName} reef diving underwater` : null,
    topSpecies[1] ? `${topSpecies[1]} underwater` : null,
  ];
  return queries.filter(Boolean);
}

function buildLocationQueries(loc, topSpecies = []) {
  return [
    topSpecies[0] ? `${topSpecies[0]} underwater reef` : null,
    topSpecies[1] ? `${topSpecies[1]} underwater ocean` : null,
    `${loc.country} coral reef underwater`,
    `tropical reef fish underwater ocean`,
  ].filter(Boolean);
}

async function tryPexels(queries) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 5 });
    await sleep(300);
    const pick = results.find((r) => r.srcWidth >= 2000 && !isUsed(r.url));
    if (pick) return { ...pick, query: q };
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
  const locById = new Map(locations.map((l) => [l.id, l]));

  let siteHits = 0, siteMiss = 0, siteSkip = 0;
  let locHits = 0, locMiss = 0, locSkip = 0;

  if (!LOCS_ONLY) {
    console.log(`\n── Sites (${sites.length}) ──`);
    for (const site of sites) {
      const needsPhoto = FILL_NULLS ? site.heroImageUrl === null : isWikimedia(site.heroImageUrl);
      if (!needsPhoto) { siteSkip++; continue; }
      const locName = locById.get(site.locationId)?.name ?? "";
      const queries = buildSiteQueries(site, locName);
      const pick = await tryPexels(queries);
      if (pick) {
        siteHits++;
        console.log(`[pexels ✓] ${site.slug}  q="${pick.query}"  src=${pick.source}`);
        if (!DRY) {
          if (site.heroImageUrl) markUsed(site.heroImageUrl, null); // free old URL
          site.heroImageUrl = pick.url;
          markUsed(pick.url, site.slug);
        }
      } else {
        siteMiss++;
        console.log(`[pexels ∅] ${site.slug}  (no match for: ${queries[0]})`);
      }
    }
  }

  // Build per-location species index from sites (for fill-nulls mode)
  const locSpecies = new Map();
  for (const site of sites) {
    const sp = (site.species || []).slice(0, 2).map((s) => s.commonName || s.name).filter(Boolean);
    if (sp.length && site.locationId) {
      if (!locSpecies.has(site.locationId)) locSpecies.set(site.locationId, sp);
    }
  }

  if (!SITES_ONLY) {
    console.log(`\n── Locations (${locations.length}) ──`);
    for (const loc of locations) {
      const locNeedsPhoto = FILL_NULLS ? loc.heroImageUrl === null : isWikimedia(loc.heroImageUrl);
      if (!locNeedsPhoto) { locSkip++; continue; }
      const topSpecies = locSpecies.get(loc.id) || [];
      const queries = buildLocationQueries(loc, topSpecies);
      const pick = await tryPexels(queries);
      if (pick) {
        locHits++;
        console.log(`[pexels ✓] ${loc.slug}  q="${pick.query}"  src=${pick.source}`);
        if (!DRY) {
          if (loc.heroImageUrl) markUsed(loc.heroImageUrl, null);
          loc.heroImageUrl = pick.url;
          markUsed(pick.url, loc.slug);
        }
      } else {
        locMiss++;
        console.log(`[pexels ∅] ${loc.slug}  (no match for: ${queries[0]})`);
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
  console.log(`Locations: upgraded=${locHits} | no-match=${locMiss} | skipped=${locSkip}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
