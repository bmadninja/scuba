#!/usr/bin/env node
/**
 * Provenance validator for scubaSeason.Fun.
 *
 * Reports, per claim:
 *   - missing source        (claim's sourceIds is empty or references unknown source)
 *   - missing method        (claim referenced by data but no MethodologyNote)
 *   - missing limitation    (MethodologyNote.limitations blank)
 *   - stale accessedAt      (>365 days old)
 *   - unsupported numeric probability
 *                           (sightingProbability set without a `calculation`
 *                            documenting the effort denominator)
 *
 * Story 1 seeds the registries; later stories attach methodology notes
 * to species, encounters, reef-health, and recommendation claims. The
 * validator runs against whatever provenance exists today and is meant
 * to be run repeatedly as those stories land.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const readJson = (rel) => JSON.parse(readFileSync(resolve(root, rel), "utf8"));

const sources = readJson("src/data/sources.json");
const methodologies = readJson("src/data/methodologies.json");

const sourceIds = new Set(sources.map((s) => s.id));
const methodologyByClaim = new Map(methodologies.map((m) => [m.claimId, m]));

const issues = [];
const report = (severity, area, id, message) =>
  issues.push({ severity, area, id, message });

const STALE_DAYS = 365;
const now = Date.now();
const daysSince = (iso) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now - t) / (1000 * 60 * 60 * 24);
};

// --- Source registry checks ----------------------------------------------
for (const s of sources) {
  if (!s.id) report("error", "source", "(missing id)", "source has no id");
  if (!s.name) report("error", "source", s.id, "source has no name");
  if (!s.sourceType)
    report("error", "source", s.id, "source has no sourceType");
  if (!s.accessedAt) {
    report("error", "source", s.id, "source has no accessedAt");
  } else if (daysSince(s.accessedAt) > STALE_DAYS) {
    report(
      "warn",
      "source",
      s.id,
      `stale accessedAt (${Math.round(daysSince(s.accessedAt))} days old)`,
    );
  }
}

// --- Methodology registry checks -----------------------------------------
for (const m of methodologies) {
  if (!m.claimId)
    report("error", "methodology", "(missing claimId)", "no claimId");
  if (!m.claimType)
    report("error", "methodology", m.claimId, "missing claimType");
  if (!m.confidence)
    report("error", "methodology", m.claimId, "missing confidence");
  if (!Array.isArray(m.sourceIds) || m.sourceIds.length === 0) {
    report("error", "methodology", m.claimId, "missing source");
  } else {
    for (const sid of m.sourceIds) {
      if (!sourceIds.has(sid)) {
        report(
          "error",
          "methodology",
          m.claimId,
          `references unknown source "${sid}"`,
        );
      }
    }
  }
  if (!m.limitations || !m.limitations.trim()) {
    report("error", "methodology", m.claimId, "missing limitation");
  }
  if (m.claimType === "sighting-probability" && !m.calculation) {
    report(
      "error",
      "methodology",
      m.claimId,
      "unsupported numeric probability — sighting-probability claim has no calculation/effort denominator",
    );
  }
  if (!m.lastReviewedAt) {
    report("warn", "methodology", m.claimId, "missing lastReviewedAt");
  }
}

// --- Cross-check: data claims that should have methodology notes ---------
//
// Today the data layer doesn't yet carry per-claim methodology IDs. Once
// later stories land (encounters, reef-health, persona recommendations),
// extend this section to walk those structures and report claims missing
// methodologies. We keep a stub here so the script is wired up and can
// fail fast as soon as a claim type is added without provenance.

const claimsNeedingMethodology = [];
for (const claim of claimsNeedingMethodology) {
  if (!methodologyByClaim.has(claim.id)) {
    report("error", claim.kind, claim.id, "missing method");
  }
}

// --- Output --------------------------------------------------------------
const errors = issues.filter((i) => i.severity === "error");
const warnings = issues.filter((i) => i.severity === "warn");

for (const i of issues) {
  const tag = i.severity === "error" ? "ERROR" : "WARN ";
  console.log(`${tag}  [${i.area}] ${i.id}: ${i.message}`);
}

console.log("");
console.log(
  `Provenance validation: ${sources.length} source(s), ${methodologies.length} methodology note(s)`,
);
console.log(`  ${errors.length} error(s), ${warnings.length} warning(s)`);

process.exit(errors.length > 0 ? 1 : 0);
