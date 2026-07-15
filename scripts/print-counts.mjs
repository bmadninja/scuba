#!/usr/bin/env node
/**
 * Print the canonical "verified product facts" numbers as a copy-paste-ready
 * markdown block.
 *
 * Discovery adds ~10 sites/day, so the grants / gtm / product operators keep
 * re-deriving and hand-editing the site / location / species figures every run
 * across multiple prose surfaces. That is make-work and it drifts. Run this
 * script and paste the block instead of hand-deriving:
 *
 *   node scripts/print-counts.mjs
 *
 * Sources (single source of truth):
 *   - src/data/sites.json         → site count (array length)
 *   - src/data/locations.json     → location count (array length)
 *   - src/data/iucn-status.json   → species with an IUCN category, species
 *                                    carrying a known population trend, and
 *                                    threatened species (CR / EN / VU)
 *
 * Dependency-free: Node built-ins only.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

function load(rel) {
  return JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));
}

const sites = load("src/data/sites.json");
const locations = load("src/data/locations.json");
const iucn = load("src/data/iucn-status.json");

// iucn-status.json is an object with a `records` array; each record carries a
// `category` (CR/EN/VU/NT/LC/DD/... ) and a `populationTrend`
// (decreasing/stable/increasing/unknown).
const records = Array.isArray(iucn) ? iucn : iucn.records || [];

const siteCount = sites.length;
const locationCount = locations.length;
const speciesWithCategory = records.filter((r) => r && r.category).length;
const speciesWithTrend = records.filter(
  (r) => r && r.populationTrend && r.populationTrend !== "unknown"
).length;
const threatened = records.filter(
  (r) => r && ["CR", "EN", "VU"].includes(r.category)
).length;

const fmt = (n) => n.toLocaleString("en-US");
const today = new Date().toISOString().slice(0, 10);

const block = `### Verified product facts

- **Dive sites:** ${fmt(siteCount)}
- **Locations:** ${fmt(locationCount)}
- **Species with an IUCN Red List category:** ${fmt(speciesWithCategory)}
- **Species with a known population trend:** ${fmt(speciesWithTrend)}
- **Threatened species (CR / EN / VU):** ${fmt(threatened)}

_Verified ${today} via \`node scripts/print-counts.mjs\`_`;

console.log(block);
