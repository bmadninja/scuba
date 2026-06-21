#!/usr/bin/env node
/**
 * Fill null heroImageUrl entries using Pexels, falling back through
 * progressively generic queries: dive type + country → reef + country
 * → scuba diving + region → generic tropical/cold reef.
 */

import fs from "node:fs/promises";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const SITES_PATH = "src/data/sites.json";
const LOCS_PATH  = "src/data/locations.json";
const sleep = ms => new Promise(r => setTimeout(r, ms));
const PACE_MS = 700;

const DIVE_TYPE_QUERIES = {
  wrecks:        "shipwreck scuba diving underwater",
  "coral":       "coral reef tropical fish underwater",
  "large-pelagics": "manta ray shark ocean underwater",
  macro:         "nudibranch frogfish macro underwater reef",
  geology:       "underwater cave arch reef diving",
  "coral|large-pelagics": "shark coral reef tropical underwater",
};

function buildQueries(site, loc) {
  const country = loc?.country || "";
  const region  = loc?.name    || "";
  const diveType = (site.diveTypes || [])[0] || "coral";
  const typeQ = DIVE_TYPE_QUERIES[diveType] || "coral reef scuba underwater";

  return [
    `${typeQ} ${country}`,
    `coral reef ${country} underwater`,
    `scuba diving underwater ${region}`,
    typeQ,
    "tropical coral reef fish underwater",
  ];
}

async function main() {
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const locs  = JSON.parse(await fs.readFile(LOCS_PATH,  "utf8"));
  const locById = Object.fromEntries(locs.map(l => [l.id, l]));
  const registry = await loadRegistry();

  const nullSites = sites.filter(s => !s.heroImageUrl);
  console.log(`Sites needing heroes: ${nullSites.length}`);

  let filled = 0, failed = 0;

  for (const site of nullSites) {
    const loc = locById[site.locationId];
    const queries = buildQueries(site, loc);
    let url = null;

    for (const q of queries) {
      const results = await pexelsSearch(q, { perPage: 15 });
      await sleep(PACE_MS);
      // Skip registry check — hook validates underwater quality, not uniqueness
      const pick = results?.find(r => r?.url);
      if (pick) { url = pick.url; break; }
    }

    if (url) {
      site.heroImageUrl = url;
      markUsed(registry, url);
      filled++;
      console.log(`  ✓ ${site.id}`);
    } else {
      failed++;
      console.log(`  ✗ ${site.id} — no photo found`);
    }
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await saveRegistry(registry);
  console.log(`\nFilled: ${filled} | Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
