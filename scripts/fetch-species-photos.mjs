#!/usr/bin/env node
// One-off enrichment: look up an iNaturalist default photo for every unique
// species across all dive sites and write `imageUrl` back into sites.json.
// Provenance (taxon id, license, attribution) is saved alongside in
// species-photo-credits.json so we can honour CC attribution requirements.
//
// iNaturalist asks for a descriptive User-Agent and reasonable pacing
// (<60 req/min). We throttle to ~1 req/sec and cache by species key so the
// same animal is only fetched once.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITES_PATH = join(__dirname, "..", "src", "data", "sites.json");
const CREDITS_PATH = join(__dirname, "..", "src", "data", "species-photo-credits.json");
const UA = "scubaseason.fun species-photo enrichment (contact: josie.ty.leung@gmail.com)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const keyOf = (sci, common) => (sci || common || "").trim().toLowerCase();

async function lookup(sci, common) {
  // Prefer an exact scientific-name match at species rank; fall back to a
  // free-text search on whichever name we have.
  const attempts = [];
  if (sci) attempts.push(`q=${encodeURIComponent(sci)}&rank=species`);
  if (sci) attempts.push(`q=${encodeURIComponent(sci)}`);
  if (common) attempts.push(`q=${encodeURIComponent(common)}`);

  for (const qs of attempts) {
    const url = `https://api.inaturalist.org/v1/taxa?${qs}&per_page=1`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) {
        await sleep(1500);
        continue;
      }
      const data = await res.json();
      const r = data.results?.[0];
      const photo = r?.default_photo;
      if (photo?.square_url) {
        return {
          imageUrl: photo.square_url,
          taxonId: r.id,
          matchedName: r.name,
          matchedCommon: r.preferred_common_name ?? null,
          license: photo.license_code ?? null,
          attribution: photo.attribution ?? null,
        };
      }
    } catch {
      // network blip — let the throttle below give it a beat, then next attempt
    }
    await sleep(800);
  }
  return null;
}

async function main() {
  const sites = JSON.parse(await readFile(SITES_PATH, "utf8"));

  // Collect unique species across all sites.
  const uniq = new Map(); // key -> { sci, common }
  for (const site of sites) {
    for (const sp of site.species ?? []) {
      const sci = (sp.scientificName ?? "").trim();
      const common = (sp.commonName ?? "").trim();
      const key = keyOf(sci, common);
      if (key && !uniq.has(key)) uniq.set(key, { sci, common });
    }
  }

  console.log(`Unique species to look up: ${uniq.size}`);
  const credits = {}; // key -> provenance
  let found = 0;
  let i = 0;
  for (const [key, { sci, common }] of uniq) {
    i++;
    const hit = await lookup(sci, common);
    if (hit) {
      credits[key] = hit;
      found++;
    }
    if (i % 25 === 0 || i === uniq.size) {
      console.log(`  ${i}/${uniq.size} processed · ${found} photos found`);
    }
    await sleep(900); // ~1 req/sec overall pacing
  }

  // Apply imageUrl back onto every species entry by key.
  let applied = 0;
  for (const site of sites) {
    for (const sp of site.species ?? []) {
      const key = keyOf((sp.scientificName ?? "").trim(), (sp.commonName ?? "").trim());
      const c = credits[key];
      if (c?.imageUrl) {
        sp.imageUrl = c.imageUrl;
        applied++;
      }
    }
  }

  await writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2) + "\n");

  console.log(`\nDone. ${found}/${uniq.size} species matched a photo.`);
  console.log(`Applied imageUrl to ${applied} species entries across ${sites.length} sites.`);
  console.log(`Credits written to ${CREDITS_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
