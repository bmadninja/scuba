#!/usr/bin/env node
/**
 * Guard for a single proposed dive-site entry (used by the Max+Haiku discovery
 * routine, which has no automatic self-review the way the API pipeline does).
 *
 * Runs the SAME checks a human reviewer would:
 *   1. Schema validity (SiteSchema)
 *   2. Duplicate detection (id/slug/name/within 2km of an existing site)
 *   3. Unit + sanity checks that schema-valid-but-wrong data slips through:
 *        - depth in METERS not feet (max ≤ 60, min < max, min ≥ 0)
 *        - lat/lng finite and within ~5° of the location's anchor
 *        - exactly 12 monthly conditions, ≥4 species
 *        - no leftover HTML entities (&amp;, &lt;, …) in text fields
 *
 * Usage:  node scripts/validate-site-entry.mjs path/to/entry.json
 * Exit 0 = safe to commit. Exit 1 = rejected (reasons printed).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SiteSchema } from "./lib/site-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const sites = JSON.parse(readFileSync(resolve(ROOT, "src/data/sites.json"), "utf8"));
const locations = JSON.parse(readFileSync(resolve(ROOT, "src/data/locations.json"), "utf8"));

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/validate-site-entry.mjs <entry.json>");
  process.exit(1);
}

const fail = [];
let entry;
try {
  entry = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`✗ could not parse ${path}: ${e.message}`);
  process.exit(1);
}

/* 1. schema */
const parsed = SiteSchema.safeParse(entry);
if (!parsed.success) {
  for (const i of parsed.error.issues.slice(0, 10)) fail.push(`schema: ${i.path.join(".") || "(root)"} — ${i.message}`);
}

/* 2. dedup */
const distanceKm = (a, b) => {
  const R = 6371, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
for (const s of sites) {
  if (s.id === entry.id || s.slug === entry.slug) fail.push(`duplicate: id/slug clashes with ${s.id}`);
  if (norm(s.name) === norm(entry.name) && s.locationId === entry.locationId) fail.push(`duplicate: name matches ${s.name}`);
  if (Number.isFinite(entry.lat) && Number.isFinite(entry.lng) && distanceKm(s, entry) < 2)
    fail.push(`duplicate: within 2km of ${s.name} (${s.id})`);
}

/* 3. unit + sanity */
const loc = locations.find((l) => l.id === entry.locationId);
if (!loc) fail.push(`sanity: locationId "${entry.locationId}" is not a real location`);

const dr = entry.depthRange || {};
if (!(dr.max <= 60)) fail.push(`sanity: depthRange.max=${dr.max}m implausible (>60m — likely feet mistaken for meters)`);
if (!(dr.min >= 0 && dr.min < dr.max)) fail.push(`sanity: depthRange min/max off (min=${dr.min}, max=${dr.max})`);

if (loc && Number.isFinite(entry.lat) && Number.isFinite(entry.lng)) {
  if (Math.abs(entry.lat - loc.lat) > 5 || Math.abs(entry.lng - loc.lng) > 5)
    fail.push(`sanity: coords (${entry.lat},${entry.lng}) are >5° from ${loc.name} anchor (${loc.lat},${loc.lng})`);
}

if (!Array.isArray(entry.conditionsByMonth) || entry.conditionsByMonth.length !== 12)
  fail.push(`sanity: conditionsByMonth must have exactly 12 entries (got ${entry.conditionsByMonth?.length})`);
if (!Array.isArray(entry.species) || entry.species.length < 4)
  fail.push(`sanity: need ≥4 species (got ${entry.species?.length})`);

const entities = /&(amp|lt|gt|quot|#\d+);/;
for (const [k, v] of Object.entries(entry)) {
  if (typeof v === "string" && entities.test(v)) fail.push(`sanity: HTML entity in "${k}" — decode it (e.g. &amp; → &)`);
}

if (fail.length) {
  console.error(`✗ REJECTED (${entry.name || path}):`);
  for (const f of fail) console.error(`   - ${f}`);
  process.exit(1);
}
console.log(`✓ PASSED: ${entry.name} (${entry.id})`);
process.exit(0);
