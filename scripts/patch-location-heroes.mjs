#!/usr/bin/env node
// One-off: set heroes for specific locations that generic queries miss
import { readFileSync, writeFileSync } from "node:fs";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const TARGETS = [
  { id: "chinhoyi-caves-zimbabwe", queries: ["cave diving underwater blue", "underwater cave blue light", "freshwater cave diving"] },
  { id: "hoi-ha-wan-hong-kong",    queries: ["underwater coral fish", "reef diving fish underwater", "colorful fish reef underwater", "tropical fish school underwater"] },
  { id: "hranice-abyss-czech-republic", queries: ["cave diving underwater blue", "flooded cave diving", "technical cave diving underwater"] },
  { id: "apra-harbor-guam",        queries: ["wreck diving underwater pacific", "shipwreck coral reef underwater", "guam reef diving underwater"] },
  { id: "providenciales-turks-and-caicos", queries: ["turks caicos reef diving underwater", "caribbean wall diving underwater", "reef shark caribbean underwater"] },
  { id: "san-juan-puerto-rico",    queries: ["puerto rico reef diving underwater", "caribbean reef fish underwater", "coral reef diving caribbean"] },
  { id: "socotra-yemen",           queries: ["indian ocean coral reef underwater", "reef fish underwater indian ocean", "coral reef diversity underwater"] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await loadRegistry();
const locations = JSON.parse(readFileSync("src/data/locations.json", "utf8"));
let hits = 0;

for (const t of TARGETS) {
  const loc = locations.find((l) => l.id === t.id);
  if (!loc || loc.heroImageUrl) continue;
  console.log(`→ ${t.id}`);
  let found = null;
  outer: for (const q of t.queries) {
    for (let page = 1; page <= 5; page++) {
      const results = await pexelsSearch(q, { perPage: 15, page });
      await sleep(300);
      found = results.find((r) => r.srcWidth >= 1600 && !isUsed(r.url));
      if (found) { console.log(`  ✓ "${q}" p${page} → ${found.url.slice(0,60)}...`); break outer; }
      if (results.length < 15) break; // no more pages
    }
    console.log(`  ✗ "${q}"`);
  }
  if (found) { loc.heroImageUrl = found.url; markUsed(found.url); hits++; }
}

if (hits) {
  writeFileSync("src/data/locations.json", JSON.stringify(locations, null, 2) + "\n");
  await saveRegistry();
  console.log(`\nPatched ${hits} locations.`);
} else {
  console.log("\nNo locations patched.");
}
