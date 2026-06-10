#!/usr/bin/env node
/**
 * One-time (idempotent) cleanup of legacy rows in src/data/sites.json that
 * predate SiteSchema enforcement in discover-sites.mjs.
 *
 * Applies only SAFE, non-fabricating mechanical fixes:
 *   - species[].scientificName === null  → drop the key (it is optional)
 *   - diveTypes                           → filter to valid enum values
 *   - description.length > 800            → truncate at a sentence/word boundary
 *   - bestMonths === []                   → backfill from the parent location's
 *                                            bestMonths (fallback: all 12 months)
 *
 * Rows that are STILL invalid after mechanical fixes require fabricated facts
 * (e.g. < 2 species, null getThere / editorialRank). Those are NOT patched —
 * they are REMOVED and logged. The guarded discovery routine
 * (scripts/discover-sites.mjs) will re-add them with real, sourced research.
 *
 * Usage:
 *   node scripts/cleanup-site-data.mjs           # write changes
 *   DRY_RUN=1 node scripts/cleanup-site-data.mjs # report only, no write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SiteSchema } from "./lib/site-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const DRY_RUN = process.env.DRY_RUN === "1";

const VALID_DIVE_TYPES = new Set(["large-pelagics", "coral", "geology", "wrecks", "macro"]);

const sites = JSON.parse(readFileSync(SITES_PATH, "utf8"));
const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));
const locById = new Map(locations.map((l) => [l.id, l]));

function truncateAtBoundary(text, max) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  // Prefer the last sentence end; fall back to the last word boundary.
  const lastPeriod = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf(".\n"));
  if (lastPeriod >= max * 0.6) return slice.slice(0, lastPeriod + 1).trim();
  const lastSpace = slice.lastIndexOf(" ");
  return slice.slice(0, lastSpace > 0 ? lastSpace : max).trim();
}

const fixes = []; // human-readable log of what changed
function note(id, msg) {
  fixes.push(`  ~ ${id}: ${msg}`);
}

function applyMechanicalFixes(site) {
  const s = { ...site };

  // 1. species: drop null scientificName
  if (Array.isArray(s.species)) {
    let dropped = 0;
    s.species = s.species.map((sp) => {
      if (sp && sp.scientificName === null) {
        const { scientificName, ...rest } = sp;
        dropped++;
        return rest;
      }
      return sp;
    });
    if (dropped) note(s.id, `dropped ${dropped} null scientificName`);
  }

  // 2. diveTypes: filter to valid enum
  if (Array.isArray(s.diveTypes)) {
    const before = s.diveTypes.length;
    s.diveTypes = s.diveTypes.filter((d) => VALID_DIVE_TYPES.has(d));
    if (s.diveTypes.length !== before) note(s.id, `filtered ${before - s.diveTypes.length} invalid diveTypes`);
  }

  // 3. description: truncate over-long
  if (typeof s.description === "string" && s.description.length > 800) {
    const before = s.description.length;
    s.description = truncateAtBoundary(s.description, 800);
    note(s.id, `truncated description ${before} → ${s.description.length} chars`);
  }

  // 4. bestMonths: backfill empty from parent location
  if (Array.isArray(s.bestMonths) && s.bestMonths.length === 0) {
    const loc = locById.get(s.locationId);
    const fallback = Array.isArray(loc?.bestMonths) && loc.bestMonths.length
      ? [...loc.bestMonths]
      : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    s.bestMonths = fallback;
    note(s.id, `backfilled bestMonths from ${loc?.bestMonths?.length ? "location" : "all-12 fallback"}`);
  }

  return s;
}

const kept = [];
const removed = [];

for (const site of sites) {
  // Skip work if already valid.
  if (SiteSchema.safeParse(site).success) {
    kept.push(site);
    continue;
  }
  const fixed = applyMechanicalFixes(site);
  const parsed = SiteSchema.safeParse(fixed);
  if (parsed.success) {
    kept.push(parsed.data);
  } else {
    removed.push({
      id: fixed.id,
      name: fixed.name,
      locationId: fixed.locationId,
      reasons: parsed.error.issues.slice(0, 4).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
    });
  }
}

console.log("=== site-data cleanup ===");
console.log(`Input rows: ${sites.length}`);
console.log(`\nMechanical fixes applied:\n${fixes.length ? fixes.join("\n") : "  (none)"}`);
console.log(`\nRemoved (unfixable without fabricated facts — discovery will re-add): ${removed.length}`);
for (const r of removed) console.log(`  ✗ ${r.name} (${r.id}) [loc=${r.locationId}] → ${r.reasons.join("; ")}`);
console.log(`\nOutput rows: ${kept.length}  (kept ${kept.length}, removed ${removed.length})`);

// Sanity: every kept row must now pass.
const stillBad = kept.filter((s) => !SiteSchema.safeParse(s).success);
if (stillBad.length) {
  console.error(`\n✗ ABORT: ${stillBad.length} kept rows still invalid — not writing.`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log("\nDRY_RUN=1 — no file written.");
} else {
  writeFileSync(SITES_PATH, JSON.stringify(kept, null, 2) + "\n");
  console.log(`\n✓ Wrote ${kept.length} rows to ${SITES_PATH}`);
}
