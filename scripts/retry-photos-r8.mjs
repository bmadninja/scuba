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
  "32768858","36287237","4717847","33968347","35974035",
]);
const isBlacklisted = url => { const m = url?.match(/\/photos\/(\d+)\//); return m && BLACKLIST_IDS.has(m[1]); };

const TARGETED = {
  "flores-riung-17-islands": ["dugong seagrass underwater Indian Ocean", "sea turtle swimming reef Indonesian waters", "coral reef tropical fish Indonesia underwater"],
  "almeria-arrecife-de-las-sirenas": ["seahorse underwater Mediterranean reef", "posidonia seagrass meadow fish underwater", "Mediterranean sea horse underwater reef"],
  "fethiye-gocek-sarsala-bay": ["loggerhead turtle underwater Mediterranean reef", "sea turtle underwater Turkish reef", "Mediterranean moray eel rocky reef underwater"],
  "inhambane-bar-reef": ["whale shark underwater ocean Mozambique", "manta ray underwater Indian Ocean reef", "coral reef fish tropical underwater Indian Ocean"],
  "eyjafjordur-dettifoss-wreck": ["cod fish underwater cold water kelp", "Atlantic wolffish underwater rocky reef", "lumpsucker fish cold water underwater reef"],
  "gorgona-island-el-planchon": ["hammerhead shark school underwater Pacific", "whale shark open ocean underwater", "blacktip reef shark school coral underwater"],
  "paracas-roja-piedra": ["sea lion underwater Pacific ocean", "Humboldt penguin underwater ocean", "South American sea lion reef underwater"],
  "naxos-greece-apollonas-reef": ["barracuda school Mediterranean underwater", "amberjack Mediterranean reef underwater", "dentex Mediterranean reef underwater"],
  "naxos-greece-paros-channel": ["pelagic fish Mediterranean blue water", "greater amberjack open water underwater", "swordfish underwater blue ocean Mediterranean"],
  "lefkada-greece-sivota-bay": ["octopus rocky reef Mediterranean underwater", "Mediterranean sea horse underwater", "scorpionfish Mediterranean rocky reef"],
  "lefkada-greece-lefkada-blue-cave": ["sea cave underwater Mediterranean fish", "Mediterranean blue cave fish underwater", "underwater sea cave grouper Mediterranean"],
  "trinidad-caroni-mangrove-dive": ["tarpon underwater Caribbean reef", "snook fish underwater mangrove reef", "Caribbean reef fish underwater tropical"],
  "los-testigos-isla-reef": ["Caribbean reef shark underwater coral", "barracuda school Caribbean reef underwater", "Caribbean reef fish tropical underwater"],
  "los-testigos-el-banco-seamount": ["scalloped hammerhead shark school underwater", "hammerhead shark deep water underwater", "schooling hammerhead sharks underwater Pacific"],
  "los-testigos-north-channel": ["spotted eagle ray Caribbean underwater reef", "eagle ray school reef underwater", "stingray Caribbean reef underwater"],
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
