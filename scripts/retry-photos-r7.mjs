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
  "35381728","18750732","36993199","13010777",
]);
const isBlacklisted = url => { const m = url?.match(/\/photos\/(\d+)\//); return m && BLACKLIST_IDS.has(m[1]); };

const TARGETED = {
  // locations
  "sainte-marie-island-madagascar": ["humpback whale underwater ocean blue", "whale tail underwater ocean", "sperm whale underwater ocean blue"],
  "milos-greece": ["Mediterranean moray eel reef underwater", "Mediterranean grouper rocky reef underwater", "scorpionfish Mediterranean rocky reef"],
  // sites
  "abu-dhabi-uae-delma-island-reef": ["dugong seagrass ocean underwater blue", "green sea turtle underwater reef coral", "spotted eagle ray underwater reef"],
  "kauai-hawaii-usa-niihau": ["Hawaiian monk seal underwater reef", "hammerhead shark underwater Hawaii", "galapagos shark underwater reef Hawaii"],
  "lanai-hawaii-usa-second-cathedral": ["spinner dolphin lava cave underwater", "Hawaiian lava tube underwater fish", "tropical fish lava cave underwater"],
  "amami-islands-setouchi-whale-shark-channel": ["whale shark underwater blue ocean", "whale shark open ocean underwater", "whale shark reef underwater blue"],
  "amami-islands-yoro-reef": ["soft coral reef underwater tropical", "brain coral reef fish underwater", "colorful reef fish tropical underwater"],
  "sainte-marie-island-la-buse-reef": ["parrotfish coral reef underwater tropical", "moray eel reef coral underwater", "reef fish coral underwater tropical"],
  "milos-greece-kleftiko": ["sea cave underwater Mediterranean fish", "underwater rock arch Mediterranean sea", "Mediterranean cave reef fish underwater"],
  "sardinia-italy-capo-testa": ["posidonia seagrass fish underwater Mediterranean", "Mediterranean sea bass reef underwater", "scorpionfish rocky reef underwater"],
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
