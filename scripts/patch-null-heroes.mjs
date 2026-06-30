#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
const sites = JSON.parse(readFileSync("src/data/sites.json", "utf8"));
const locations = JSON.parse(readFileSync("src/data/locations.json", "utf8"));
const locMap = Object.fromEntries(locations.map((l) => [l.id, l]));
let patched = 0;
for (const s of sites) {
  if ((s.notes || "").startsWith("Added via free-API") && !s.heroImageUrl) {
    const hero = locMap[s.locationId]?.heroImageUrl;
    if (hero) { s.heroImageUrl = hero; patched++; console.log("patched:", s.name); }
    else console.log("no location hero for:", s.name, s.locationId);
  }
}
writeFileSync("src/data/sites.json", JSON.stringify(sites, null, 2) + "\n");
console.log("Done. Patched:", patched);
