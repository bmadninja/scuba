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
  "35381728","18750732","36993199",
]);
const isBlacklisted = url => { const m = url?.match(/\/photos\/(\d+)\//); return m && BLACKLIST_IDS.has(m[1]); };

const TARGETED = {
  "faroe-islands": ["grey seal underwater ocean", "wolffish underwater cold water reef", "cold water nudibranch underwater reef"],
  "fernandina-island-galapagos": ["marine iguana underwater reef", "Galapagos sea lion underwater reef", "sea lion underwater playful ocean"],
  "abrolhos-banks": ["humpback whale underwater ocean", "whale shark underwater reef tropical", "Atlantic goliath grouper reef underwater"],
  "faroe-islands-vestmanna-cliffs": ["plumose anemone underwater reef", "cold water kelp forest underwater", "wolffish underwater rocky reef"],
  "false-bay-roman-rock": ["great white shark underwater ocean", "blue shark underwater ocean", "ragged tooth shark underwater reef"],
  "quirimbas-ilha-do-ibo-pinnacles": ["soft coral sea fan underwater tropical", "tubastrea coral reef underwater", "sea fan coral underwater Indian Ocean"],
  "corsica-lavezzi-islands": ["scorpionfish underwater reef Mediterranean", "red scorpionfish rocky reef underwater", "octopus reef underwater Mediterranean"],
  "mayotte-prony": ["reef manta ray underwater Indian Ocean", "oceanic manta ray ocean underwater", "eagle ray reef underwater tropical"],
  "pohnpei-fsm-ant-atoll": ["grey reef shark coral reef underwater", "blacktip reef shark underwater ocean", "whitetip reef shark coral underwater"],
  "pohnpei-fsm-palikir-pass": ["oceanic manta ray underwater Pacific", "manta ray reef ocean underwater", "hammerhead shark school underwater"],
  "pohnpei-fsm-mwahnd-passage": ["dugong seagrass ocean underwater", "green sea turtle coral reef underwater", "sea turtle swimming reef underwater"],
  "fernandina-island-galapagos-punta-mangle": ["Galapagos sea lion underwater reef", "sea lion underwater playful ocean blue", "flightless cormorant underwater reef"],
  "marmaris-turkey-cleopatra-island-reef": ["dusky grouper rocky reef underwater", "European barracuda school underwater", "loggerhead sea turtle Mediterranean reef"],
  "paraty-ilha-das-cobras": ["moray eel coral reef underwater", "green moray eel reef tropical underwater", "spotted moray eel rocky reef underwater"],
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
