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
const encounters = readJson("src/data/encounters.json");
const sightings = readJson("src/data/sightings.json");
const reefHealth = readJson("src/data/reef-health.json");
const tripCosts = readJson("src/data/trip-costs.json");
const reefPressure = readJson("src/data/reef-pressure.json");
const locations = readJson("src/data/locations.json");
const sites = readJson("src/data/sites.json");
const locationIds = new Set(locations.map((l) => l.id));
const siteIds = new Set(sites.map((s) => s.id));

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

// --- Encounter provenance (Story 03 AC6) ---------------------------------
for (const e of encounters) {
  if (!Array.isArray(e.sourceIds) || e.sourceIds.length === 0) {
    report("error", "encounter", e.id, "missing source");
  } else {
    for (const sid of e.sourceIds) {
      if (!sourceIds.has(sid)) {
        report("error", "encounter", e.id, `references unknown source "${sid}"`);
      }
    }
  }
  if (!Array.isArray(e.methodologyClaimIds) || e.methodologyClaimIds.length === 0) {
    report("error", "encounter", e.id, "missing method");
  } else {
    for (const mid of e.methodologyClaimIds) {
      if (!methodologyByClaim.has(mid)) {
        report(
          "error",
          "encounter",
          e.id,
          `references unknown methodology "${mid}"`,
        );
      }
    }
  }
  if (!e.limitations || !e.limitations.trim()) {
    report("error", "encounter", e.id, "missing limitation");
  }
}

// --- Sighting evidence provenance (Story 08) -----------------------------
for (const s of sightings) {
  if (!Array.isArray(s.sourceIds) || s.sourceIds.length === 0) {
    report("error", "sighting", s.id, "missing source");
  } else {
    for (const sid of s.sourceIds) {
      if (!sourceIds.has(sid)) {
        report("error", "sighting", s.id, `references unknown source "${sid}"`);
      }
    }
  }
  if (!Array.isArray(s.methodologyClaimIds) || s.methodologyClaimIds.length === 0) {
    report("error", "sighting", s.id, "missing method");
  } else {
    for (const mid of s.methodologyClaimIds) {
      if (!methodologyByClaim.has(mid)) {
        report(
          "error",
          "sighting",
          s.id,
          `references unknown methodology "${mid}"`,
        );
      }
    }
  }
  // AC3: no numeric probability without a methodology calculation. We
  // don't have such a field in the schema by design, but if someone
  // sneaks a "probabilityPercent" in via raw JSON, fail loudly.
  if (Object.prototype.hasOwnProperty.call(s, "probabilityPercent")) {
    report(
      "error",
      "sighting",
      s.id,
      "unsupported numeric probability — schema forbids probabilityPercent without a documented effort denominator",
    );
  }
}

// --- Reef-health provenance (Story 09) -----------------------------------
//
// Hard rules from the PRD:
//   AC2 thermal stress must reference NOAA CRW (or equivalent) sources
//   AC4 projection without methodology = error
//   AC5 records must link to a real site OR location (not both)
//   AC6 validation prevents projection claims without methodology
//
for (const r of reefHealth) {
  if (Boolean(r.locationId) === Boolean(r.siteId)) {
    report(
      "error",
      "reef-health",
      r.id,
      "must reference exactly one of locationId or siteId",
    );
  }
  if (r.locationId && !locationIds.has(r.locationId)) {
    report(
      "error",
      "reef-health",
      r.id,
      `references unknown location "${r.locationId}"`,
    );
  }
  if (r.siteId && !siteIds.has(r.siteId)) {
    report(
      "error",
      "reef-health",
      r.id,
      `references unknown site "${r.siteId}"`,
    );
  }
  if (!Array.isArray(r.methodologyClaimIds) || r.methodologyClaimIds.length === 0) {
    report("error", "reef-health", r.id, "missing method");
  } else {
    for (const mid of r.methodologyClaimIds) {
      if (!methodologyByClaim.has(mid)) {
        report(
          "error",
          "reef-health",
          r.id,
          `references unknown methodology "${mid}"`,
        );
      }
    }
  }

  const checkSources = (label, sids) => {
    if (!Array.isArray(sids) || sids.length === 0) {
      report("error", "reef-health", r.id, `${label} missing source`);
      return;
    }
    for (const sid of sids) {
      if (!sourceIds.has(sid)) {
        report(
          "error",
          "reef-health",
          r.id,
          `${label} references unknown source "${sid}"`,
        );
      }
    }
  };

  if (r.observed) checkSources("observed", r.observed.sourceIds);
  if (r.thermalStress) checkSources("thermalStress", r.thermalStress.sourceIds);

  if (r.projection) {
    checkSources("projection", r.projection.sourceIds);
    if (
      !Array.isArray(r.projection.methodologyClaimIds) ||
      r.projection.methodologyClaimIds.length === 0
    ) {
      report(
        "error",
        "reef-health",
        r.id,
        "projection has no methodologyClaimIds — projections without documented method are forbidden",
      );
    } else {
      for (const mid of r.projection.methodologyClaimIds) {
        if (!methodologyByClaim.has(mid)) {
          report(
            "error",
            "reef-health",
            r.id,
            `projection references unknown methodology "${mid}"`,
          );
        }
      }
    }
  }
}

// --- Trip-cost provenance ------------------------------------------------
for (const t of tripCosts) {
  if (!t.locationId || !locationIds.has(t.locationId)) {
    report("error", "trip-cost", t.id, `references unknown location "${t.locationId}"`);
  }
  if (!Array.isArray(t.sourceIds) || t.sourceIds.length === 0) {
    report("error", "trip-cost", t.id, "missing source");
  } else {
    for (const sid of t.sourceIds) {
      if (!sourceIds.has(sid)) {
        report("error", "trip-cost", t.id, `references unknown source "${sid}"`);
      }
    }
  }
  if (!Array.isArray(t.methodologyClaimIds) || t.methodologyClaimIds.length === 0) {
    report("error", "trip-cost", t.id, "missing method");
  } else {
    for (const mid of t.methodologyClaimIds) {
      if (!methodologyByClaim.has(mid)) {
        report("error", "trip-cost", t.id, `references unknown methodology "${mid}"`);
      }
    }
  }
}

// --- Reef-pressure provenance --------------------------------------------
for (const r of reefPressure) {
  if (!r.locationId || !locationIds.has(r.locationId)) {
    report("error", "reef-pressure", r.id, `references unknown location "${r.locationId}"`);
  }
  if (!Array.isArray(r.methodologyClaimIds) || r.methodologyClaimIds.length === 0) {
    report("error", "reef-pressure", r.id, "missing method");
  } else {
    for (const mid of r.methodologyClaimIds) {
      if (!methodologyByClaim.has(mid)) {
        report("error", "reef-pressure", r.id, `references unknown methodology "${mid}"`);
      }
    }
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
  `Provenance validation: ${sources.length} source(s), ${methodologies.length} methodology note(s), ${encounters.length} encounter(s), ${sightings.length} sighting(s), ${reefHealth.length} reef-health record(s), ${tripCosts.length} trip-cost record(s), ${reefPressure.length} reef-pressure record(s)`,
);
console.log(`  ${errors.length} error(s), ${warnings.length} warning(s)`);

process.exit(errors.length > 0 ? 1 : 0);
