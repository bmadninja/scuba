#!/usr/bin/env node
/**
 * Build the CREMP / SECREMP stony-coral cover series from the raw FWC point-count
 * export.
 *
 * Source: CREMP_Cover_to_2025.csv, sent by Lindsay Huebner (Assistant Research
 * Scientist, Coral Program, FWC Fish & Wildlife Research Institute) on
 * 2026-08-03. Covers the Florida Keys (monitoring began 1996), the Dry Tortugas
 * and Southeast Florida (the latter run by Nova Southeastern University under
 * the sister SECREMP project).
 *
 * Why a separate file (not coral-cover-series.json):
 *   coral-cover-series.json is fully overwritten by the MERMAID ingest each run,
 *   the same reason AGRRA has its own file. CREMP writes cremp-reef-series.json
 *   (per location) and cremp-site-series.json (per dive site).
 *
 * DISPLAY-ONLY, like every other trend series: it draws the coral-cover chart
 * and never feeds the reef-state verdict or the headline coral number.
 *
 * Aggregation
 *   ID_Percent_Cover in the raw file is a FRACTION (0.1866 = 18.66%).
 *   stony coral cover for a station-year = sum of ID_Percent_Cover over rows
 *   where ID_Group === "Stony_Coral". A station-year that was surveyed but has
 *   no stony-coral rows is a real zero, not missing data.
 *   station-year -> mean across a site's stations -> mean across sites.
 *
 * Only sites with a continuous record (>= MIN_YEAR_COVERAGE of the scope's
 * survey years) are pooled, so a falling trend is never an artifact of sites
 * being added to the programme part way through.
 *
 * A reef is identified by its numeric `Site` id, never by Subregion + Site_Name:
 * the five Palm Beach reefs were relabelled from subregion PBC to PB in 2025, so
 * name-keying would split each of them into two short, discontinuous records.
 *
 * Deterministic and offline: reads the committed CSV, writes JSON. No network.
 *
 * Usage: node scripts/build-cremp-coral-series.mjs [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = path.join(ROOT, "data/cremp/CREMP_Cover_to_2025.csv");
const LOCATION_OUT = path.join(ROOT, "src/data/cremp-reef-series.json");
const SITE_OUT = path.join(ROOT, "src/data/cremp-site-series.json");

const SOURCE_ID = "cremp";
const METHODOLOGY_CLAIM_ID = "reef-health-cremp";
const ACCESSED_AT = "2026-08-05";

/** A site must carry at least this share of the scope's survey years to count. */
const MIN_YEAR_COVERAGE = 0.95;

const CITATION =
  "Florida Fish and Wildlife Conservation Commission, Fish and Wildlife Research Institute. " +
  "Coral Reef Evaluation and Monitoring Project (CREMP), 1996-2025. Southeast Florida sites " +
  "surveyed by Nova Southeastern University under SECREMP. Data provided by Lindsay Huebner, " +
  "August 2026. https://myfwc.com/research/habitat/coral/cremp/";

// ─── Scopes ──────────────────────────────────────────────────────────────────
// CREMP subregion codes: UK/MK/LK = Upper/Middle/Lower Keys, DT = Dry Tortugas.
// SECREMP: PBC + PB = Palm Beach, BC = Broward, DC = Dade (Miami), MC = Martin.

const LOCATION_SCOPES = [
  {
    locationId: "florida-keys-usa",
    subregions: ["UK", "MK", "LK"],
    programme: "CREMP",
    scopeLabel: "Florida Keys",
  },
  {
    locationId: "dry-tortugas-usa",
    subregions: ["DT"],
    programme: "CREMP",
    scopeLabel: "Dry Tortugas",
  },
  {
    locationId: "southeast-florida-usa",
    subregions: ["PBC", "PB", "BC", "DC", "MC"],
    programme: "SECREMP",
    scopeLabel: "Southeast Florida",
  },
];

// Dive sites where a CREMP site is the SAME reef, not a nearby one. Hand-checked
// against the CREMP site list; only exact reef-name matches are listed, so the
// chart on a dive-site page can honestly say "this reef" rather than "nearby".
// Molasses and Looe Key are each monitored as a shallow and a deep station set;
// both are pooled, which is how CREMP reports the reef.
const SITE_SCOPES = [
  {
    siteId: "florida-keys-molasses-reef",
    siteName: "Molasses Reef",
    crempSites: ["Molasses Shallow", "Molasses Deep"],
  },
  {
    siteId: "florida-keys-looe-key",
    siteName: "Looe Key Reef",
    crempSites: ["Looe Key Shallow", "Looe Key Deep"],
  },
  {
    siteId: "dry-tortugas-texas-rock",
    siteName: "Texas Rock",
    crempSites: ["Texas Rock"],
  },
];

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** Minimal RFC 4180 reader: handles quoted fields and escaped quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;
const round1 = (n) => Math.round(n * 10) / 10;

// ─── Aggregation ─────────────────────────────────────────────────────────────

/**
 * @returns `stationYears`, one entry per surveyed station-year carrying its
 *   stony coral cover as a percent (a station surveyed with no stony-coral rows
 *   is a real 0), and `sites`, the reef id -> {name, subregions} index.
 */
function readStationCover(rows) {
  const cover = new Map();
  const meta = new Map();
  const sites = new Map();
  for (const r of rows) {
    const year = Number(r.Year);
    if (!Number.isFinite(year)) continue;
    const key = `${r.Site}|${r.Station}|${year}`;
    if (!meta.has(key)) {
      meta.set(key, { siteId: r.Site, station: r.Station, year });
      cover.set(key, 0);
    }
    if (!sites.has(r.Site)) sites.set(r.Site, { name: r.Site_Name, subregions: new Set() });
    sites.get(r.Site).subregions.add(r.Subregion);
    if (r.ID_Group !== "Stony_Coral") continue;
    const fraction = Number(r.ID_Percent_Cover);
    if (!Number.isFinite(fraction)) continue;
    cover.set(key, cover.get(key) + fraction * 100);
  }
  const stationYears = [...meta.values()].map((m) => ({
    ...m,
    coverPercent: cover.get(`${m.siteId}|${m.station}|${m.year}`),
  }));
  return { stationYears, sites };
}

/**
 * Pool one scope (a set of CREMP reefs) into a year-by-year series.
 * @param match (siteId, site) => boolean, where site is {name, subregions}
 */
function buildSeries({ stationYears, sites }, match) {
  const inScope = stationYears.filter((p) => match(p.siteId, sites.get(p.siteId)));
  if (inScope.length === 0) return null;

  const scopeYears = [...new Set(inScope.map((p) => p.year))].sort((a, b) => a - b);

  // Reefs carrying a continuous record across the scope's survey years.
  const yearsBySite = new Map();
  for (const p of inScope) {
    if (!yearsBySite.has(p.siteId)) yearsBySite.set(p.siteId, new Set());
    yearsBySite.get(p.siteId).add(p.year);
  }
  const threshold = Math.ceil(scopeYears.length * MIN_YEAR_COVERAGE);
  const continuousSites = new Set(
    [...yearsBySite.entries()]
      .filter(([, years]) => years.size >= threshold)
      .map(([site]) => site),
  );
  // A scope too young or too patchy for a continuous panel keeps every site
  // rather than charting nothing; the note records which happened.
  const usedSites =
    continuousSites.size >= 2 ? continuousSites : new Set(yearsBySite.keys());
  const continuousPanel = usedSites === continuousSites;

  const pooled = inScope.filter((p) => usedSites.has(p.siteId));

  const byYear = new Map();
  for (const p of pooled) {
    if (!byYear.has(p.year)) byYear.set(p.year, new Map());
    const bySite = byYear.get(p.year);
    if (!bySite.has(p.siteId)) bySite.set(p.siteId, []);
    bySite.get(p.siteId).push(p.coverPercent);
  }
  const series = [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, bySite]) => ({
      year,
      coralCoverPercent: round1(mean([...bySite.values()].map(mean))),
    }));
  if (series.length < 2) return null;

  const stations = new Set(pooled.map((p) => `${p.siteId}|${p.station}`));

  return {
    series,
    siteCount: usedSites.size,
    stationCount: stations.size,
    surveyEventCount: pooled.length,
    surveyYears: series.length,
    totalSitesInScope: yearsBySite.size,
    continuousPanel,
  };
}

// ─── Build ───────────────────────────────────────────────────────────────────

const dryRun = process.argv.includes("--dry-run");

const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
console.log(`Read ${rows.length.toLocaleString()} rows from ${path.relative(ROOT, CSV_PATH)}`);

const station = readStationCover(rows);

const locationRecords = [];
for (const scope of LOCATION_SCOPES) {
  // A reef is in scope if any of its subregion labels match — Palm Beach reefs
  // carry both PBC (to 2024) and PB (2025).
  const built = buildSeries(station, (_siteId, site) =>
    [...site.subregions].some((s) => scope.subregions.includes(s)),
  );
  if (!built) {
    console.warn(`  ! no series for ${scope.locationId}`);
    continue;
  }
  const first = built.series[0];
  const latest = built.series[built.series.length - 1];
  const panelNote = built.continuousPanel
    ? `Pooled from the ${built.siteCount} of ${built.totalSitesInScope} ${scope.scopeLabel} sites monitored in every survey year, so the trend is not an artifact of sites joining the programme later.`
    : `Pooled from all ${built.siteCount} ${scope.scopeLabel} sites on record.`;
  locationRecords.push({
    locationId: scope.locationId,
    sourceId: SOURCE_ID,
    methodologyClaimId: METHODOLOGY_CLAIM_ID,
    programme: scope.programme,
    matchType: "monitored-sites",
    scopeLabel: scope.scopeLabel,
    subregions: scope.subregions,
    siteCount: built.siteCount,
    stationCount: built.stationCount,
    surveyEventCount: built.surveyEventCount,
    surveyYears: built.surveyYears,
    continuousPanel: built.continuousPanel,
    latest: { year: latest.year, coralCoverPercent: latest.coralCoverPercent },
    series: built.series,
    citation: CITATION,
    notes:
      `Stony coral cover from ${scope.programme} point-count surveys at fixed stations, ` +
      `${first.year} to ${latest.year}: ${first.coralCoverPercent}% to ${latest.coralCoverPercent}%. ` +
      `${panelNote} ${built.stationCount} stations, ` +
      `${built.surveyEventCount.toLocaleString()} station-surveys.`,
    lastReviewedAt: ACCESSED_AT,
  });
  console.log(
    `  ${scope.locationId}: ${built.surveyYears} yrs, ${first.year} ${first.coralCoverPercent}% -> ${latest.year} ${latest.coralCoverPercent}% (${built.siteCount}/${built.totalSitesInScope} sites)`,
  );
}

const siteRecords = [];
for (const scope of SITE_SCOPES) {
  const built = buildSeries(station, (_siteId, site) => scope.crempSites.includes(site.name));
  if (!built) {
    console.warn(`  ! no series for ${scope.siteId}`);
    continue;
  }
  const first = built.series[0];
  const latest = built.series[built.series.length - 1];
  siteRecords.push({
    siteId: scope.siteId,
    sourceId: SOURCE_ID,
    methodologyClaimId: METHODOLOGY_CLAIM_ID,
    programme: "CREMP",
    matchType: "same-reef",
    crempSites: scope.crempSites,
    stationCount: built.stationCount,
    surveyEventCount: built.surveyEventCount,
    surveyYears: built.surveyYears,
    latest: { year: latest.year, coralCoverPercent: latest.coralCoverPercent },
    series: built.series,
    citation: CITATION,
    notes:
      `Stony coral cover measured on this reef by CREMP, ${first.year} to ${latest.year}: ` +
      `${first.coralCoverPercent}% to ${latest.coralCoverPercent}%. Pooled from the ` +
      `${scope.crempSites.join(" and ")} station sets, ${built.stationCount} fixed stations, ` +
      `${built.surveyEventCount.toLocaleString()} station-surveys.`,
    lastReviewedAt: ACCESSED_AT,
  });
  console.log(
    `  ${scope.siteId}: ${built.surveyYears} yrs, ${first.year} ${first.coralCoverPercent}% -> ${latest.year} ${latest.coralCoverPercent}%`,
  );
}

if (dryRun) {
  console.log("\n[dry run] no files written.");
} else {
  fs.writeFileSync(LOCATION_OUT, `${JSON.stringify(locationRecords, null, 2)}\n`);
  fs.writeFileSync(SITE_OUT, `${JSON.stringify(siteRecords, null, 2)}\n`);
  console.log(
    `\nWrote ${locationRecords.length} location series -> ${path.relative(ROOT, LOCATION_OUT)}`,
  );
  console.log(`Wrote ${siteRecords.length} site series -> ${path.relative(ROOT, SITE_OUT)}`);
}
