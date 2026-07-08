#!/usr/bin/env node
/**
 * Integrate the two verified published coral datasets that are non-commercial
 * licensed (cleared for use per Josie's call — attribute, do not gate):
 *
 *   1. AIMS LTMP Great Barrier Reef manta-tow series → a real multi-year
 *      coralCoverSeries on the GBR reef-health record. GBR-wide value each year
 *      is the mean of the AIMS Northern/Central/Southern region-wide averages,
 *      for years where all three regions are published (2022–2025). The record's
 *      current/historical coral values and dates are aligned to the series
 *      endpoints so the headline number, the decline sentence, and the chart all
 *      tell the same story. Source figures: .claude/data-research/aims-gbr-coral-series.json
 *
 *   2. GCRMN "Status of Coral Reefs of the World 2020" regional trends →
 *      src/data/coral-cover-regional.json, a display-only backdrop the reef card
 *      draws faintly behind a site's own coral points. Source figures:
 *      .claude/data-research/gcrmn-regional-coral-series.json
 *
 * Idempotent: re-running overwrites only the GBR coral fields and rewrites the
 * regional file. Attribution: aims-ltmp and gcrmn are already in sources.json.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const REEF_HEALTH_PATH = path.join(ROOT, "src/data/reef-health.json");
const REGIONAL_PATH = path.join(ROOT, "src/data/coral-cover-regional.json");
const AIMS_PATH = path.join(ROOT, ".claude/data-research/aims-gbr-coral-series.json");
const GCRMN_PATH = path.join(ROOT, ".claude/data-research/gcrmn-regional-coral-series.json");

function round1(n) {
  return Math.round(n * 10) / 10;
}

// --- AIMS: GBR-wide series from the three region means ----------------------

function buildGbrSeries(aims) {
  const regions = ["northern", "central", "southern"];
  const perYear = new Map(); // year -> [values]
  for (const region of regions) {
    for (const pt of aims.regions[region]) {
      const list = perYear.get(pt.year) ?? [];
      list.push(pt.coralCoverPercent);
      perYear.set(pt.year, list);
    }
  }
  // Only years with all three regions get a clean GBR-wide mean.
  return [...perYear.entries()]
    .filter(([, vals]) => vals.length === regions.length)
    .map(([year, vals]) => ({
      year,
      coralCoverPercent: round1(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))
    .sort((a, b) => a.year - b.year);
}

async function patchGbr(series) {
  const reefHealth = JSON.parse(await fs.readFile(REEF_HEALTH_PATH, "utf8"));
  const rec = reefHealth.find((r) => r.locationId === "great-barrier-reef-australia");
  if (!rec) throw new Error("GBR reef-health record not found");

  const first = series[0];
  const last = series[series.length - 1];

  rec.observed.coralCoverSeries = series;
  rec.observed.coralCoverPercent = last.coralCoverPercent;
  rec.observed.surveyDate = `${last.year}-08-01`;
  rec.observed.historicalCoralCoverPercent = first.coralCoverPercent;
  rec.observed.historicalSurveyDate = `${first.year}-08-01`;
  rec.observed.surveyMethod =
    "AIMS LTMP manta-tow, GBR-wide mean of the Northern, Central and Southern region-wide averages";
  rec.observed.notes =
    "GBR-wide coral cover each year is the mean of the AIMS Long-Term Monitoring Program's three region-wide manta-tow averages (Northern, Central, Southern), for years where all three are published. The 2024 mass bleaching event, the most geographically extensive on record, drove the sharp fall from the 2024 peak.";
  if (!rec.observed.sourceIds.includes("aims-ltmp")) rec.observed.sourceIds.push("aims-ltmp");

  await fs.writeFile(REEF_HEALTH_PATH, JSON.stringify(reefHealth, null, 2) + "\n");
  return { first, last, points: series.length };
}

// --- GCRMN: regional backdrop dataset ---------------------------------------

const REGION_LABELS = {
  "caribbean": "Caribbean",
  "east-asian-seas": "East Asian Seas",
  "etp-eastern-tropical-pacific": "Eastern Tropical Pacific",
  "persga-red-sea-gulf-of-aden": "Red Sea & Gulf of Aden",
  "pacific": "Pacific",
  "ropme-persian-arabian-gulf": "Persian / Arabian Gulf",
  "south-asia": "South Asia",
  "australia": "Australia",
  "brazil": "Brazil",
  "wio-western-indian-ocean": "Western Indian Ocean",
};

// The report gives the Pacific only as "stable ~37% before 1998" (a range) plus
// a single 2019 value. Represent the pre-1998 plateau as a 1998 anchor so the
// region still gets an honest two-point backdrop showing the decline.
const REGION_ANCHOR_OVERRIDES = {
  "pacific": [
    { year: 1998, coralCoverPercent: 37 },
    { year: 2019, coralCoverPercent: 31.3 },
  ],
};

async function buildRegional(gcrmn) {
  const out = [];
  for (const [key, points] of Object.entries(gcrmn.regions)) {
    // Keep only clean single-year points (drop the pre-1998 ranges).
    let series = points
      .filter((p) => typeof p.year === "number" && typeof p.coralCoverPercent === "number")
      .map((p) => ({ year: p.year, coralCoverPercent: p.coralCoverPercent }))
      .sort((a, b) => a.year - b.year);
    if (series.length < 2 && REGION_ANCHOR_OVERRIDES[key]) {
      series = REGION_ANCHOR_OVERRIDES[key];
    }
    if (series.length < 2) continue;
    out.push({
      region: key,
      label: REGION_LABELS[key] ?? key,
      sourceId: "gcrmn",
      series,
      yearRange: [series[0].year, series[series.length - 1].year],
      citation: gcrmn.citation,
    });
  }
  await fs.writeFile(REGIONAL_PATH, JSON.stringify(out, null, 2) + "\n");
  return out;
}

async function main() {
  const [aims, gcrmn] = await Promise.all([
    fs.readFile(AIMS_PATH, "utf8").then(JSON.parse),
    fs.readFile(GCRMN_PATH, "utf8").then(JSON.parse),
  ]);

  const series = buildGbrSeries(aims);
  const gbr = await patchGbr(series);
  console.log(
    `AIMS → GBR series: ${gbr.points} pts ${gbr.first.year}:${gbr.first.coralCoverPercent}% … ${gbr.last.year}:${gbr.last.coralCoverPercent}%`,
  );
  console.log(`  series: ${series.map((p) => `${p.year}:${p.coralCoverPercent}`).join(" ")}`);

  const regional = await buildRegional(gcrmn);
  console.log(`GCRMN → ${regional.length} regions written to coral-cover-regional.json`);
  for (const r of regional) {
    console.log(`  ${r.region.padEnd(30)} ${r.series.length} pts ${r.yearRange[0]}–${r.yearRange[1]}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
