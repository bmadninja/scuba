#!/usr/bin/env node
/**
 * Repairs the trivial formatting quirks Haiku reliably emits, so the guard
 * (validate-site-entry.mjs) rejects only genuinely bad data — not good sites
 * with a float temperature or a stray null. Mutates the entry file in place.
 *
 * Fixes:
 *   - round waterTempC / visibilityM / depthRange to integers
 *   - drop null/empty bestMonths (schema wants the key absent, not null)
 *   - decode common HTML entities (&amp; → &, &#39; → ', …)
 *   - force slug === id (catalog convention)
 *
 * Usage:  node scripts/normalize-site-entry.mjs path/to/entry.json
 * It only repairs shape; it never invents facts. Always run the guard afterward.
 */
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
if (!path) { console.error("usage: node scripts/normalize-site-entry.mjs <entry.json>"); process.exit(1); }

const e = JSON.parse(readFileSync(path, "utf8"));

const decode = (s) =>
  typeof s === "string"
    ? s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
       .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    : s;

const roundRange = (r) => { if (r && typeof r === "object") { r.min = Math.round(r.min); r.max = Math.round(r.max); } };

// text fields
for (const k of Object.keys(e)) if (typeof e[k] === "string") e[k] = decode(e[k]);

// slug convention
if (e.id) e.slug = e.id;

// these are populated by separate systems — force empty (agents over-fill them)
for (const k of ["lodging", "operators", "gearIds", "siteSpecificGear"]) e[k] = [];

// depth
roundRange(e.depthRange);

// species: drop null/empty bestMonths, decode names
if (Array.isArray(e.species)) {
  for (const sp of e.species) {
    sp.commonName = decode(sp.commonName);
    if (sp.scientificName) sp.scientificName = decode(sp.scientificName);
    if (sp.bestMonths == null || (Array.isArray(sp.bestMonths) && sp.bestMonths.length === 0)) delete sp.bestMonths;
  }
}

// monthly conditions: integer temps + visibility
if (Array.isArray(e.conditionsByMonth)) {
  for (const c of e.conditionsByMonth) {
    roundRange(c.waterTempC);
    roundRange(c.visibilityM);
    if (c.suitRecommendation) c.suitRecommendation = decode(c.suitRecommendation);
  }
}

writeFileSync(path, JSON.stringify(e, null, 2) + "\n");
console.log(`normalized ${e.name || path}`);
