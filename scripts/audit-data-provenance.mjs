#!/usr/bin/env node
/**
 * Data provenance audit (Story 02).
 *
 * Walks the existing site/location/gear dataset and counts which claims
 * carry source/methodology references and which are editorial-only.
 * Writes a human-readable report to:
 *   _bmad-output/implementation-artifacts/data-audit/source-coverage-report.md
 *
 * This is a *read-only* audit. It does not rewrite or delete any data.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const readJson = (rel) => JSON.parse(readFileSync(resolve(root, rel), "utf8"));

const sources = readJson("src/data/sources.json");
const methodologies = readJson("src/data/methodologies.json");
const sites = readJson("src/data/sites.json");
const locations = readJson("src/data/locations.json");
const gear = readJson("src/data/gear.json");
const locationDetails = readJson("src/data/location-details.json");

const sourceIds = new Set(sources.map((s) => s.id));
const methodologyIds = new Set(methodologies.map((m) => m.claimId));

const has = (arr) => Array.isArray(arr) && arr.length > 0;
const allKnownSources = (ids) =>
  has(ids) && ids.every((id) => sourceIds.has(id));
const allKnownMethods = (ids) =>
  has(ids) && ids.every((id) => methodologyIds.has(id));

const tally = () => ({
  total: 0,
  withSources: 0,
  withMethodology: 0,
  unknownSourceRefs: 0,
  unknownMethodologyRefs: 0,
});

const recordTally = (t, record) => {
  t.total += 1;
  if (has(record.sourceIds)) {
    t.withSources += 1;
    if (!allKnownSources(record.sourceIds)) t.unknownSourceRefs += 1;
  }
  if (has(record.methodologyClaimIds)) {
    t.withMethodology += 1;
    if (!allKnownMethods(record.methodologyClaimIds)) t.unknownMethodologyRefs += 1;
  }
};

const siteTally = tally();
const locationTally = tally();
const gearTally = tally();
const speciesTally = tally();

const claimFlags = [];

for (const s of sites) {
  recordTally(siteTally, s);

  for (const sp of s.species ?? []) {
    recordTally(speciesTally, sp);
    // AC4: anything that looks like rarity/seasonality without methodology
    if (sp.reliability === "rare" && !has(sp.methodologyClaimIds)) {
      claimFlags.push({
        kind: "species-rarity-without-methodology",
        site: s.slug,
        species: sp.commonName,
      });
    }
    if (has(sp.bestMonths) && !has(sp.methodologyClaimIds)) {
      claimFlags.push({
        kind: "species-seasonality-without-methodology",
        site: s.slug,
        species: sp.commonName,
      });
    }
  }

  // AC4: conditionsByMonth implies temp/visibility/current claims
  if (has(s.conditionsByMonth) && !has(s.methodologyClaimIds)) {
    claimFlags.push({
      kind: "conditions-by-month-without-methodology",
      site: s.slug,
    });
  }
}

for (const loc of locations) recordTally(locationTally, loc);
for (const g of gear) recordTally(gearTally, g);

const pct = (n, d) => (d === 0 ? "0%" : `${Math.round((n / d) * 100)}%`);

const lines = [];
lines.push("---");
lines.push("title: scubaSeason.Fun — Source Coverage Report");
lines.push(`generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push("status: audit");
lines.push("story: Story 02 — Normalize existing data to source-aware schema");
lines.push("---");
lines.push("");
lines.push("# Source Coverage Report");
lines.push("");
lines.push("This is a read-only audit of the current dataset against the");
lines.push("Story 01 source/methodology registries. Existing data is preserved.");
lines.push("");
lines.push("## Registry size");
lines.push("");
lines.push(`- Sources: **${sources.length}**`);
lines.push(`- Methodology notes: **${methodologies.length}**`);
lines.push("");
lines.push("## Dataset coverage");
lines.push("");
lines.push("| Entity | Total | With sourceIds | With methodologyClaimIds | Unknown source refs | Unknown methodology refs |");
lines.push("|---|---:|---:|---:|---:|---:|");
const row = (label, t) =>
  `| ${label} | ${t.total} | ${t.withSources} (${pct(t.withSources, t.total)}) | ${t.withMethodology} (${pct(t.withMethodology, t.total)}) | ${t.unknownSourceRefs} | ${t.unknownMethodologyRefs} |`;
lines.push(row("Sites", siteTally));
lines.push(row("Locations", locationTally));
lines.push(row("Gear", gearTally));
lines.push(row("Species entries (across all sites)", speciesTally));
lines.push("");
lines.push(`Location-details records on disk: ${locationDetails.length} (narrative copy, no claim audit applied).`);
lines.push("");
lines.push("## Editorial-only / unsourced claim flags");
lines.push("");
lines.push("Fields that *look* like probability, rarity, seasonality, reef condition,");
lines.push("or climate urgency but lack a methodology reference. These are not");
lines.push("automatic rewrites — they are review candidates.");
lines.push("");

const flagSummary = {};
for (const f of claimFlags) {
  flagSummary[f.kind] = (flagSummary[f.kind] ?? 0) + 1;
}
if (Object.keys(flagSummary).length === 0) {
  lines.push("_None._");
} else {
  lines.push("| Flag | Count |");
  lines.push("|---|---:|");
  for (const [kind, count] of Object.entries(flagSummary)) {
    lines.push(`| \`${kind}\` | ${count} |`);
  }
}
lines.push("");
lines.push("## Schema drift findings");
lines.push("");
lines.push("- `Site.getThere` is a free-text string. Earlier architecture notes");
lines.push("  expected a structured link array. Flagged for later normalization,");
lines.push("  not rewritten in this audit.");
lines.push("- `SpeciesEntry.reliability` (`year-round` / `seasonal` / `rare`) is");
lines.push("  editorial confidence today. Later stories should attach a");
lines.push("  MethodologyNote whenever this becomes user-facing as a probability.");
lines.push("- Discovery script outputs (`scripts/discover-sites.mjs`) merged");
lines.push("  records without durable source records. Preserved as-is; sourceIds");
lines.push("  remain empty until backfilled.");
lines.push("");
lines.push("## Next actions");
lines.push("");
lines.push("1. Backfill `sourceIds` on locations and sites as encounter/reef-health");
lines.push("   stories land (do not bulk-rewrite preemptively).");
lines.push("2. Treat any new claim added without a methodologyClaimId as a CI");
lines.push("   failure once validate-provenance is wired to a hook.");
lines.push("3. Affiliate fields (`lodging`, `operators`, gear `partners`) remain");
lines.push("   separate from editorial provenance per AC6.");
lines.push("");

const outDir = resolve(root, "_bmad-output/implementation-artifacts/data-audit");
mkdirSync(outDir, { recursive: true });
const outPath = resolve(outDir, "source-coverage-report.md");
writeFileSync(outPath, lines.join("\n"));

console.log(`Wrote ${outPath}`);
console.log(
  `Sites=${siteTally.total} Locations=${locationTally.total} Gear=${gearTally.total} Species=${speciesTally.total}`,
);
console.log(`Claim flags: ${claimFlags.length}`);
