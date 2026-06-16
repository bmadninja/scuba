#!/usr/bin/env node
/**
 * Enrich sites and locations with 2 additional Pexels photos each, building
 * a heroImages array of up to 3 unique photos per entity.
 *
 * Run:
 *   PEXELS_API_KEY=xxx node scripts/enrich-multi-images.mjs
 *   PEXELS_API_KEY=xxx node scripts/enrich-multi-images.mjs --dry
 *   PEXELS_API_KEY=xxx node scripts/enrich-multi-images.mjs --sites-only
 *   PEXELS_API_KEY=xxx node scripts/enrich-multi-images.mjs --locations-only
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
const TARGET = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchExtra(queries, existing) {
  const existingSet = new Set(existing);
  const extras = [];
  for (const q of queries) {
    if (extras.length >= TARGET - 1) break;
    const results = await pexelsSearch(q, { perPage: 8 });
    await sleep(300);
    for (const r of results) {
      if (extras.length >= TARGET - 1) break;
      if (existingSet.has(r.url)) continue;
      if (isUsed(r.url)) continue;
      if (r.srcWidth < 2000) continue;
      extras.push(r.url);
      existingSet.add(r.url);
    }
  }
  return extras;
}

async function main() {
  if (!process.env.PEXELS_API_KEY) { console.error("PEXELS_API_KEY not set"); process.exit(1); }

  await loadRegistry();
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  let siteHits = 0, siteSkip = 0;
  let locHits = 0, locSkip = 0;

  if (!LOCS_ONLY) {
    console.log(`\n── Sites ──`);
    for (const site of sites) {
      const base = site.heroImageUrl;
      if (!base) { siteSkip++; continue; }

      const existing = site.heroImages?.length ? site.heroImages : [base];
      if (existing.length >= TARGET) { siteSkip++; continue; }

      const loc = locById.get(site.locationId);
      const topSpecies = (site.species || []).slice(1, 4).map((s) => s.commonName || s.name).filter(Boolean);
      const queries = [
        loc ? `${loc.name} ${loc.country} scuba diving reef` : null,
        topSpecies[0] ? `${topSpecies[0]} underwater reef` : null,
        topSpecies[1] ? `${topSpecies[1]} underwater` : null,
        loc ? `${loc.country} coral reef diving underwater` : null,
      ].filter(Boolean);

      const extras = await fetchExtra(queries, existing);
      if (extras.length > 0) {
        siteHits++;
        const updated = [...existing, ...extras].slice(0, TARGET);
        console.log(`[✓] ${site.slug}  +${extras.length}  total=${updated.length}`);
        if (!DRY) {
          site.heroImages = updated;
          extras.forEach((u) => markUsed(u, site.slug));
        }
      } else {
        siteSkip++;
      }
    }
  }

  if (!SITES_ONLY) {
    console.log(`\n── Locations ──`);
    for (const loc of locations) {
      const base = loc.heroImageUrl;
      if (!base) { locSkip++; continue; }

      const existing = loc.heroImages?.length ? loc.heroImages : [base];
      if (existing.length >= TARGET) { locSkip++; continue; }

      const queries = [
        `${loc.name} ${loc.country} scuba diving reef underwater`,
        `${loc.country} coral reef diving`,
        loc.region ? `${loc.region} underwater reef` : null,
      ].filter(Boolean);

      const extras = await fetchExtra(queries, existing);
      if (extras.length > 0) {
        locHits++;
        const updated = [...existing, ...extras].slice(0, TARGET);
        console.log(`[✓] ${loc.slug}  +${extras.length}  total=${updated.length}`);
        if (!DRY) {
          loc.heroImages = updated;
          extras.forEach((u) => markUsed(u, loc.slug));
        }
      } else {
        locSkip++;
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

  console.log(`\nSites:     enriched=${siteHits} | skipped/already-full=${siteSkip}`);
  console.log(`Locations: enriched=${locHits} | skipped/already-full=${locSkip}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
