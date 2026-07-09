#!/usr/bin/env node
/**
 * Reef Check indicator-fish ingest + integrity check.
 *
 * WHAT THIS INGESTS
 *   Two display-only datasets that put an effort-standardised FISH signal beside
 *   coral cover on the reef-health panel. Fish abundance responds to fishing and
 *   protection (coral is heat-driven), so this is our independent "protection
 *   works" read for the Marine Conservation Institute / Blue Parks partnership.
 *
 *     1. src/data/reef-check-fish-regional.json
 *        Reef Check's regional indicator-fish density trends (individuals per
 *        100 m² on standardised belt transects), Indo-Pacific and Atlantic,
 *        1997–2001, plus the inside-vs-outside-MPA contrast. Regional means only.
 *        Source: Hodgson, G. & Liebeler, J. (2002), The Global Coral Reef Crisis:
 *        Trends and Solutions 1997–2001, Reef Check Foundation, UCLA.
 *
 *     2. src/data/fish-abundance-series.json
 *        Real per-site indicator-fish abundance where a citable record exists.
 *        Currently Tubbataha: target-fish biomass endpoints (2018→2024) per
 *        monitored station from Saving Philippine Reefs (CCEF), corroborated by
 *        the Tubbataha Management Office. NOT Reef Check — different program,
 *        method and unit (per 500 m²); never merged with the Reef Check series.
 *
 * WHY THIS SCRIPT DOES NOT FETCH
 *   Reef Check publishes regional/global TREND REPORTS openly, but its raw
 *   site-level survey data is REQUEST-ONLY via the Global Reef Tracker
 *   (https://www.reefcheck.org/global-reef-tracker/, rcinfo@reefcheck.org).
 *   There is no open bulk download and no public API; per-site histories are
 *   viewable on the Aqualink partner platform but not exported as a documented
 *   time series. The numeric values here were therefore transcribed by hand from
 *   the primary PDFs (verified against the report text), exactly like the GCRMN
 *   regional coral trends in coral-cover-regional.json. Both datasets are curated,
 *   not scraped — so the job of this script is to GUARD them: verify every source
 *   and methodology id resolves, every value is in range, and nothing has drifted
 *   into a fabricated or self-contradictory state. Run it after any hand-edit.
 *
 *   If Reef Check later grants raw-data access, add the fetch here and write the
 *   normalised per-taxon series into reef-check-fish-regional.json; keep the
 *   validation below as the acceptance gate.
 *
 * Exits non-zero on any integrity failure so CI catches a bad edit.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const REGIONAL_PATH = path.join(ROOT, "src/data/reef-check-fish-regional.json");
const SERIES_PATH = path.join(ROOT, "src/data/fish-abundance-series.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

function fail(errors, msg) {
  errors.push(msg);
}

async function main() {
  const [regional, series, sources, methodologies, locations] = await Promise.all([
    readJson(REGIONAL_PATH),
    readJson(SERIES_PATH),
    readJson(SOURCES_PATH),
    readJson(METHODOLOGIES_PATH),
    readJson(LOCATIONS_PATH),
  ]);

  const sourceIds = new Set(sources.map((s) => s.id));
  const claimIds = new Set(methodologies.map((m) => m.claimId));
  const locationIds = new Set(locations.map((l) => l.id));
  const errors = [];

  // --- Reef Check regional benchmark ---------------------------------------
  const basins = new Set();
  for (const r of regional) {
    const tag = `regional[${r.basin}]`;
    if (basins.has(r.basin)) fail(errors, `${tag}: duplicate basin`);
    basins.add(r.basin);
    if (!sourceIds.has(r.sourceId)) fail(errors, `${tag}: unknown sourceId "${r.sourceId}"`);
    if (r.sourceId !== "reef-check") fail(errors, `${tag}: regional benchmark must cite reef-check`);
    if (!Array.isArray(r.indicators) || r.indicators.length === 0) fail(errors, `${tag}: no indicators`);
    if (!/reef check/i.test(r.method)) fail(errors, `${tag}: method should name the Reef Check protocol`);
    if (!r.mpaContrast || !/protected area/i.test(r.mpaContrast)) fail(errors, `${tag}: missing MPA contrast statement`);
    for (const ind of r.indicators ?? []) {
      const t = `${tag} ${ind.taxon}`;
      for (const k of ["startDensity", "endDensity"]) {
        const v = ind[k];
        if (typeof v !== "number" || v < 0 || v > 1000) fail(errors, `${t}: ${k} out of range (${v})`);
      }
      const wentUp = ind.endDensity >= ind.startDensity;
      if (wentUp && ind.direction !== "up") fail(errors, `${t}: direction "${ind.direction}" contradicts values ${ind.startDensity}→${ind.endDensity}`);
      if (!wentUp && ind.direction !== "down") fail(errors, `${t}: direction "${ind.direction}" contradicts values ${ind.startDensity}→${ind.endDensity}`);
      if (ind.startYear < 1996 || ind.endYear > 2002) fail(errors, `${t}: years outside the 1997–2001 report window`);
    }
  }

  // --- Per-site indicator-fish series --------------------------------------
  for (const rec of series) {
    const tag = `series[${rec.locationId}]`;
    if (!locationIds.has(rec.locationId)) fail(errors, `${tag}: unknown locationId`);
    if (!sourceIds.has(rec.sourceId)) fail(errors, `${tag}: unknown sourceId "${rec.sourceId}"`);
    for (const sid of rec.secondarySourceIds ?? []) {
      if (!sourceIds.has(sid)) fail(errors, `${tag}: unknown secondary sourceId "${sid}"`);
    }
    if (!claimIds.has(rec.methodologyClaimId)) fail(errors, `${tag}: unknown methodologyClaimId "${rec.methodologyClaimId}"`);
    if (rec.sourceId === "reef-check") fail(errors, `${tag}: per-site series must NOT be attributed to Reef Check (per-100 m² protocol)`);
    if (!Array.isArray(rec.stations) || rec.stations.length === 0) fail(errors, `${tag}: no stations`);
    let up = 0;
    for (const st of rec.stations ?? []) {
      const t = `${tag} ${st.station}`;
      for (const k of ["startValue", "endValue"]) {
        const v = st[k];
        if (typeof v !== "number" || v <= 0 || v > 100000) fail(errors, `${t}: ${k} out of range (${v})`);
      }
      if (st.endYear <= st.startYear) fail(errors, `${t}: endYear must be after startYear`);
      if (st.endValue >= st.startValue) up += 1;
    }
    if (rec.stationsTotal !== rec.stations.length) fail(errors, `${tag}: stationsTotal ${rec.stationsTotal} != ${rec.stations.length} stations`);
    if (rec.stationsUp !== up) fail(errors, `${tag}: stationsUp ${rec.stationsUp} != counted ${up}`);
    if (!rec.caveat) fail(errors, `${tag}: missing honest caveat`);
  }

  if (errors.length) {
    console.error(`\n✗ Reef Check fish integrity check FAILED (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("✓ Reef Check fish datasets pass integrity checks.");
  console.log(`  regional basins : ${regional.map((r) => r.basin).join(", ")}`);
  console.log(`  per-site series : ${series.map((s) => s.locationId).join(", ") || "(none)"}`);
  console.log(`  sources present : reef-check, ${series[0]?.sourceId ?? "spr-ccef"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
