#!/usr/bin/env node
import fs from "node:fs/promises";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const SITES_PATH = "src/data/sites.json";
const LOCS_PATH = "src/data/locations.json";
const sleep = ms => new Promise(r => setTimeout(r, ms));

const BLACKLIST_IDS = new Set([
  "38156461","36197844","35812286","30419280","12890017","4816318","4621616",
  "10519044","30518295","35974038","13010778","32293259","5061256","26737932",
  "35381728","18750732","36993199","13010777","34609171","3402385","17194902",
]);
const isBlacklisted = url => { const m = url?.match(/\/photos\/(\d+)\//); return m && BLACKLIST_IDS.has(m[1]); };

const TARGETED = {
  "bahrain": ["dugong seagrass underwater ocean blue", "spotted eagle ray reef underwater Arabian Gulf", "loggerhead turtle underwater reef ocean"],
  "kauai-hawaii-usa-niihau": ["hammerhead shark underwater Hawaii ocean", "Galapagos shark underwater coral reef", "sandbar shark underwater reef ocean"],
  "sardinia-italy-capo-caccia-wall": ["red gorgonian sea fan underwater Mediterranean", "red coral rocky reef underwater", "sponge coral wall underwater Mediterranean"],
};

await loadRegistry();
const [sites, locs] = await Promise.all([
  fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
  fs.readFile(LOCS_PATH, "utf8").then(JSON.parse),
]);

async function tryQueries(queries) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 15 });
    await sleep(350);
    const pick = results.find(r => r.srcWidth >= 2000 && !isUsed(r.url) && !isBlacklisted(r.url));
    if (pick) return { ...pick, query: q };
  }
  return null;
}

let fixed = 0, missed = 0;
for (const entity of [...locs, ...sites]) {
  if (entity.heroImageUrl !== null) continue;
  const id = entity.slug || entity.id;
  const queries = TARGETED[id];
  if (!queries) continue;
  const pick = await tryQueries(queries);
  if (pick) {
    entity.heroImageUrl = pick.url;
    markUsed(pick.url, id);
    console.log(`[✓] ${id}  q="${pick.query}"`);
    fixed++;
  } else {
    console.log(`[∅] ${id}  — no match`);
    missed++;
  }
}

await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
await fs.writeFile(LOCS_PATH, JSON.stringify(locs, null, 2) + "\n");
await saveRegistry();
console.log(`\nFixed: ${fixed}, Missed: ${missed}`);
