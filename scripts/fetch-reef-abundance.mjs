#!/usr/bin/env node
/**
 * REEF Volunteer Fish Survey Project — effort-aware fish-abundance ingest.
 *
 * Builds per-location, per-year fish-abundance series into
 * src/data/reef-fish-abundance-series.json from the REEF (Reef Environmental
 * Education Foundation) public Geographic Area Report.
 *
 * Why REEF, and why this is not just an observation count:
 *   REEF divers use the Roving Diver Technique (RDT): on every survey they log
 *   each species seen with a log-scaled abundance category — Single (1), Few (2,
 *   2–10), Many (3, 11–100), Abundant (4, >100). REEF also logs the NUMBER OF
 *   SURVEYS, so its two published statistics are already effort-standardised:
 *     - %SF (sighting frequency) = surveys that recorded a species / total surveys
 *     - DEN (density score) = mean abundance category across surveys that recorded it
 *   A rising density is therefore fish-seen-per-survey going up, not more divers
 *   showing up — the exact signal a raw observation count cannot separate.
 *
 * The community abundance index we chart, per year:
 *     densityIndex = Σ(%SF · DEN) / Σ(%SF)   over all species reported that year
 *   i.e. the sighting-frequency-weighted mean density across the fish community
 *   (bounded 1–4). Weighting by %SF keeps a single incidental "Abundant" sighting
 *   of a rare species from dominating the whole-reef read. We store the count of
 *   Species-&-Abundance (SA) surveys behind each year as the visible effort
 *   denominator.
 *
 * DISPLAY-ONLY, exactly like coral-cover-series.json:
 *   This is a relative abundance index at REEF-zone resolution, recorded by
 *   volunteer divers — NOT biomass, and NOT a per-site value. It powers the reef
 *   card's fish-abundance-over-time chart and NEVER feeds the reef-state verdict
 *   or any headline number.
 *
 * Scope — regions where REEF coverage is strong (TWA/Caribbean, US, TEP). Each
 * zone below was checked to carry enough multi-year Species-&-Abundance surveys
 * to form an honest trend. REEF coverage is thin in the Mediterranean and
 * Indo-Pacific, so no Med/Indo-Pacific site is included; sites whose nearest
 * REEF zone was too sparse (e.g. Malpelo, 11 surveys; Providencia, 41) are
 * deliberately left out rather than charted on weak data.
 *
 * Data access reality (documented 2026-07): REEF publishes NO JSON/CSV data API
 * and NO GBIF/OBIS dataset. The only machine-readable output is the Geographic
 * Area Report's CSV export, which DOES honour start_date/end_date, so a per-year
 * series is built by querying one calendar-year window per year:
 *   GET https://www.reef.org/db/reports/geo/export
 *       ?region_code=<REGION>&zones=<ZONE>&format_type=chart&group_type=species
 *       &language=common&start_date=YYYY-01-01&end_date=YYYY-12-31
 * License: REEF data is copyrighted, non-commercial use only (cleared for our
 * non-commercial use; attribute per REEF's required citation, providers may ask).
 *
 * Idempotent: rewrites reef-fish-abundance-series.json in full each run and
 * registers the source + methodology note if missing. Nothing else is touched.
 *
 * Pace 350ms between requests. Usage: node scripts/fetch-reef-abundance.mjs [--dry-run]
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SERIES_PATH = path.join(ROOT, "src/data/reef-fish-abundance-series.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");

// Vetted map: atlas locationId → the REEF geographic zone that contains it.
// reefRegion is REEF's own top-level grouping. All are in-scope Blue Park sites
// in strong-REEF regions (TWA/US/TEP). Survey counts noted are all-years totals
// confirmed against the report on 2026-07-08.
const ZONE_MAP = [
  { locationId: "exuma-cays-bahamas",        region: "TWA", zone: "4209", reefRegion: "TWA", zoneName: "The Exuma Islands" },
  { locationId: "cuba-jardines-de-la-reina", region: "TWA", zone: "5104", reefRegion: "TWA", zoneName: "Archipiélago de los Jardines de la Reina" },
  { locationId: "socorro-mexico",            region: "TEP", zone: "53",   reefRegion: "TEP", zoneName: "Revillagigedo Islands" },
  { locationId: "cocos-costa-rica",          region: "TEP", zone: "6510", reefRegion: "TEP", zoneName: "Cocos Island" },
  { locationId: "darwin-galapagos-ecuador",  region: "TEP", zone: "7101", reefRegion: "TEP", zoneName: "Darwin Island (Galápagos)" },
  { locationId: "wolf-galapagos-ecuador",    region: "TEP", zone: "7102", reefRegion: "TEP", zoneName: "Wolf Island (Galápagos)" },
  { locationId: "channel-islands-usa",       region: "PAC", zone: "4202", reefRegion: "PAC", zoneName: "Northern Channel Islands" },
];

const REEF_BASE = "https://www.reef.org/db/reports/geo/export";
const FIRST_YEAR = 1993; // REEF Volunteer Fish Survey Project began 1993 (TWA)
const CURRENT_YEAR = new Date().getUTCFullYear();
const PACE_MS = 350;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_PAUSE_MS = 2_000;

// Honesty gates: a year needs enough Species-&-Abundance surveys to give a
// stable community density, and a location needs enough qualifying years to
// draw a real trend rather than noise.
const MIN_SA_SURVEYS_PER_YEAR = 10;
const MIN_YEARS = 3;
// Trend deadband on the 1–4 density scale, applied to the fitted change across
// the whole series (slope × span).
const TREND_DEADBAND = 0.15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- CSV -------------------------------------------------------------------

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else q = false;
      } else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/**
 * From one year's export CSV, pull the SA-survey effort count and the
 * sighting-frequency-weighted community mean density (all surveyors).
 * Returns null when the year has no Species-&-Abundance surveys.
 */
function analyzeYear(csv) {
  const lines = csv.split(/\r?\n/);
  let speciesHeader = -1;
  let saSurveys = null;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^TOTALS,/.test(l)) {
      // Zone sub-table TOTALS row: TOTALS,,ExpertSA,ExpertSO,NoviceSA,NoviceSO,BottomTime
      const c = parseCsvLine(l);
      const expertSA = parseInt(c[2], 10) || 0;
      const noviceSA = parseInt(c[4], 10) || 0;
      saSurveys = expertSA + noviceSA;
    }
    if (/^Rank,/.test(l)) speciesHeader = i;
  }

  if (!saSurveys || saSurveys <= 0 || speciesHeader < 0) return null;

  // Species rows: Rank,SpeciesID,Species,Family,totSF,totDEN,exSF,exDEN,novSF,novDEN
  let sfSum = 0;
  let sfDenSum = 0;
  let speciesCount = 0;
  for (let i = speciesHeader + 1; i < lines.length; i++) {
    const c = parseCsvLine(lines[i]);
    if (c.length < 6 || !/^\d+$/.test(c[0].trim())) continue;
    const sf = parseFloat(c[4]); // Total %SF (all surveyors)
    const den = parseFloat(c[5]); // Total DEN (all surveyors)
    if (!isFinite(sf) || !isFinite(den) || sf <= 0) continue;
    sfSum += sf;
    sfDenSum += sf * den;
    speciesCount++;
  }
  if (sfSum <= 0) return null;

  return {
    saSurveys,
    speciesCount,
    densityIndex: Math.round((sfDenSum / sfSum) * 100) / 100,
  };
}

// --- Fetch -----------------------------------------------------------------

async function fetchYear(region, zone, year) {
  const url =
    `${REEF_BASE}?region_code=${region}&zones=${zone}` +
    `&format_type=chart&group_type=species&language=common` +
    `&start_date=${year}-01-01&end_date=${year}-12-31`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/reef-abundance-ingest (non-commercial; contact hello@scubaseason.fun)" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || String(err);
      if (attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
      throw new Error(`request failed (${cause}): ${url}`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    return res.text();
  }
}

// --- Trend -----------------------------------------------------------------

function computeTrend(series) {
  // Least-squares slope of densityIndex over year; classify by change across the
  // series against a deadband.
  const n = series.length;
  const xs = series.map((p) => p.year);
  const ys = series.map((p) => p.densityIndex);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const span = xs[n - 1] - xs[0];
  const change = slope * span;
  if (change > TREND_DEADBAND) return "rising";
  if (change < -TREND_DEADBAND) return "falling";
  return "stable";
}

// --- Source + methodology registration -------------------------------------

const REEF_SOURCE = {
  id: "reef",
  name: "REEF Volunteer Fish Survey Project",
  url: "https://www.reef.org/db/reports/geo",
  publisher: "Reef Environmental Education Foundation (REEF)",
  sourceType: "citizen-science",
  accessedAt: new Date().toISOString().slice(0, 10),
  license:
    "Copyright REEF; non-commercial use only (cleared for Scuba Season's non-commercial use; commercial reuse requires REEF's written permission). Cite per REEF's required format.",
  notes:
    "Roving Diver Technique fish surveys by trained volunteer divers. Public Geographic Area Report (reef.org/db/reports/geo) publishes effort-standardised sighting frequency (%SF) and density (DEN, 1–4) per species per geographic zone; its CSV export honours a start_date/end_date window, so a per-year series is built one calendar year at a time. No JSON data API and no GBIF/OBIS dataset exist. Strong coverage in the Tropical Western Atlantic/Caribbean, US, and Tropical Eastern Pacific; thin in the Mediterranean and Indo-Pacific.",
};

const REEF_METHODOLOGY = {
  claimId: "reef-fish-abundance",
  claimType: "reef-health",
  sourceIds: ["reef"],
  confidence: "medium",
  calculation:
    "Per REEF geographic zone and calendar year, the community abundance index is the sighting-frequency-weighted mean density across all reported species: Σ(%SF·DEN)/Σ(%SF), where %SF is a species' sighting frequency (surveys recording it / total surveys) and DEN is its density score (mean of the Roving Diver Technique abundance categories Single=1, Few=2, Many=3, Abundant=4 across surveys recording it), bounded 1–4. Only years with at least 10 Species-&-Abundance surveys are kept, and a location needs at least 3 such years to publish a series. The number of surveys behind each year is stored and shown as the effort denominator. Trend is the sign of the least-squares slope of the index over years, with a 0.15 (on the 1–4 scale) deadband.",
  limitations:
    "This is a RELATIVE abundance index from volunteer surveys, not biomass and not a fish count. It is recorded at REEF geographic-zone resolution (a zone can span many dive sites), so it never represents a single site and never feeds the reef-state verdict — it is a display-only trend. Density categories are log-scaled and coarse (four bins). Observer skill varies between volunteers; this index pools expert and novice surveyors. Survey effort is uneven across years and zones, so sparse years are dropped rather than shown. Scoped to regions where REEF coverage is strong (Tropical Western Atlantic/Caribbean, US, Tropical Eastern Pacific); not applied where REEF coverage is thin (Mediterranean, Indo-Pacific).",
  lastReviewedAt: new Date().toISOString().slice(0, 10),
};

// --- Main ------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("REEF fish-abundance ingest" + (DRY_RUN ? " (dry run — no writes)" : ""));
  console.log("==========================");
  console.log(`Years ${FIRST_YEAR}–${CURRENT_YEAR}, ${ZONE_MAP.length} in-scope zones\n`);

  const nowIso = new Date().toISOString().slice(0, 10);
  const records = [];

  for (const entry of ZONE_MAP) {
    process.stdout.write(`${entry.locationId} (${entry.region}/${entry.zone} ${entry.zoneName})\n`);
    const series = [];
    for (let year = FIRST_YEAR; year <= CURRENT_YEAR; year++) {
      let csv;
      try {
        csv = await fetchYear(entry.region, entry.zone, year);
      } catch (err) {
        console.warn(`  ! ${year}: ${err instanceof Error ? err.message : String(err)}`);
        await sleep(PACE_MS);
        continue;
      }
      const a = analyzeYear(csv);
      await sleep(PACE_MS);
      if (!a) continue;
      if (a.saSurveys < MIN_SA_SURVEYS_PER_YEAR) continue;
      series.push({ year, densityIndex: a.densityIndex, surveyCount: a.saSurveys });
    }

    if (series.length < MIN_YEARS) {
      console.log(`  → skipped: only ${series.length} qualifying year(s) (need ${MIN_YEARS})\n`);
      continue;
    }

    series.sort((a, b) => a.year - b.year);
    const latest = series[series.length - 1];
    const totalSurveyCount = series.reduce((s, p) => s + p.surveyCount, 0);
    const trend = computeTrend(series);

    const record = {
      locationId: entry.locationId,
      sourceId: "reef",
      methodologyClaimId: "reef-fish-abundance",
      reefZoneCode: entry.zone,
      reefZoneName: entry.zoneName,
      reefRegion: entry.reefRegion,
      totalSurveyCount,
      surveyYears: series.length,
      latest: {
        year: latest.year,
        densityIndex: latest.densityIndex,
        surveyCount: latest.surveyCount,
      },
      trend,
      series,
      citation: `REEF. ${CURRENT_YEAR}. Reef Environmental Education Foundation Volunteer Fish Survey Project Database. World Wide Web electronic publication. www.REEF.org, retrieved ${nowIso}. Geographic zone ${entry.zone} (${entry.zoneName}).`,
      notes: `${totalSurveyCount} REEF Species-&-Abundance surveys across ${series.length} survey years in REEF zone ${entry.zone} (${entry.zoneName}, ${entry.reefRegion}). Community abundance index = sighting-frequency-weighted mean density (1–4). Display-only; never a reef-state input.`,
      fetchedAt: nowIso,
      lastReviewedAt: nowIso,
    };
    records.push(record);
    console.log(
      `  → ${series.length} yrs ${series[0].year}–${latest.year}  latest ${latest.densityIndex} (${latest.surveyCount} surveys)  trend ${trend}\n`,
    );
  }

  records.sort((a, b) => a.locationId.localeCompare(b.locationId));

  if (DRY_RUN) {
    console.log(`[dry run] would write ${records.length} location series. Sample:`);
    for (const r of records) {
      console.log(`  ${r.locationId.padEnd(30)} ${r.series.map((p) => `${p.year}:${p.densityIndex}`).join(" ")}`);
    }
    return;
  }

  // Register source + methodology if missing.
  const [sourcesRaw, methodologiesRaw] = await Promise.all([
    fs.readFile(SOURCES_PATH, "utf8"),
    fs.readFile(METHODOLOGIES_PATH, "utf8"),
  ]);
  const sources = JSON.parse(sourcesRaw);
  const methodologies = JSON.parse(methodologiesRaw);

  const writes = [fs.writeFile(SERIES_PATH, JSON.stringify(records, null, 2) + "\n")];

  if (!sources.some((s) => s.id === "reef")) {
    sources.push(REEF_SOURCE);
    writes.push(fs.writeFile(SOURCES_PATH, JSON.stringify(sources, null, 2) + "\n"));
    console.log("+ registered reef in sources.json");
  }
  if (!methodologies.some((m) => m.claimId === "reef-fish-abundance")) {
    methodologies.push(REEF_METHODOLOGY);
    writes.push(fs.writeFile(METHODOLOGIES_PATH, JSON.stringify(methodologies, null, 2) + "\n"));
    console.log("+ registered reef-fish-abundance in methodologies.json");
  }

  await Promise.all(writes);
  console.log(`\nWrote ${records.length} location series to reef-fish-abundance-series.json @ ${new Date().toISOString()}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
