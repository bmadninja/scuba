#!/usr/bin/env node
/**
 * Evidence coverage validator — FR48 gate.
 *
 * Counts sites in sites.json that have no matching siteId entry in
 * sightings.json (sites with zero sighting evidence).
 *
 * A site is considered "covered" when at least one sightings.json entry
 * references its id AND that entry has recentRecordCount > 0.
 *
 * Exit 0 (PASS) when zero-evidence count < 20.
 * Exit 1 (FAIL) when zero-evidence count >= 20.
 *
 * Usage:
 *   node scripts/validate-evidence-coverage.mjs
 *   npm run validate:evidence
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const sites = JSON.parse(readFileSync(resolve(root, "src/data/sites.json"), "utf8"));
const sightings = JSON.parse(readFileSync(resolve(root, "src/data/sightings.json"), "utf8"));

// A site counts as "covered" if at least one sightings record has
// recentRecordCount > 0 — a record with count 0 is a placeholder, not evidence.
const coveredSiteIds = new Set(
  sightings
    .filter((s) => typeof s.recentRecordCount === "number" && s.recentRecordCount > 0)
    .map((s) => s.siteId),
);

const zeroEvidence = sites.filter((s) => !coveredSiteIds.has(s.id));
const count = zeroEvidence.length;
const THRESHOLD = 20;

if (count >= THRESHOLD) {
  console.error(
    `FAIL: ${count} site${count === 1 ? "" : "s"} have zero sighting evidence (threshold: <${THRESHOLD})`,
  );
  if (zeroEvidence.length <= 20) {
    for (const s of zeroEvidence) {
      console.error(`  • ${s.id}`);
    }
  }
  process.exit(1);
} else {
  console.log(
    `PASS: ${count} site${count === 1 ? "" : "s"} have zero sighting evidence (threshold: <${THRESHOLD})`,
  );
  process.exit(0);
}
