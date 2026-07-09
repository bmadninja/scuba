#!/usr/bin/env node
/**
 * Wave — Reef Life Survey (RLS) fish-biomass time-series ingest.
 *
 * Builds a per-location, multi-year reef-fish-biomass series (kilograms per
 * hectare) from the Reef Life Survey global Method 1 (M1) fish-transect
 * dataset, served open by the IMOS Australian Ocean Data Network (AODN)
 * geoserver. Writes src/data/fish-biomass-series.json.
 *
 * WHY FISH BIOMASS: fish biomass is the reef metric that actually responds to
 * protection. Coral cover is largely heat driven, so a warming-driven coral
 * decline can sit right next to a fishing-recovery success. This series is the
 * honest, effort-standardized "protection works" benchmark — every RLS M1
 * transect is the same fixed survey area, so year-to-year change reflects the
 * reef and not how much anyone looked.
 *
 * DISPLAY ONLY: exactly like the MERMAID coral-cover series, this is a chart
 * dataset and NOT a reef-state input. Surveys are matched by proximity (0.5°),
 * so a nearby transect can differ from a location's curated reef-state verdict.
 * We never let a proximity match override a hand-reviewed classification. The
 * series enriches the fish-biomass-over-time chart; the verdict stays on the
 * curated reef-pressure / reef-health record.
 *
 * METHOD:
 *   1. Fetch the compact RLS survey list (imos:ep_survey_list_public_data,
 *      ~34k rows, one per survey). Keep surveys whose methods include M1.
 *   2. For each location, gather M1 surveys within MATCH_RADIUS_DEG. A location
 *      with >= MIN_TREND_YEARS distinct survey years is a target.
 *   3. For each target, pull the raw M1 rows (imos:ep_m1_public_data) inside its
 *      bounding box. For each survey, sum fish biomass across all species and
 *      size classes per 250 m² transect block, convert to kg/ha, and average
 *      across the survey's blocks (robust to 1- vs 2-block surveys). A year's
 *      value is the mean survey density across all M1 surveys in radius that
 *      year. Every point is an observed value; nothing is projected.
 *
 * Idempotency: the whole file is rewritten each run from the current AODN data.
 *
 * Open data, CC BY 4.0. Attribution: Reef Life Survey (reeflifesurvey.com),
 * data served by IMOS AODN. Pace between location pulls.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SERIES_PATH = path.join(ROOT, "src/data/fish-biomass-series.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");

const AODN_OWS = "https://geoserver-portal.aodn.org.au/geoserver/ows";
const SURVEY_LIST_LAYER = "imos:ep_survey_list_public_data";
const M1_LAYER = "imos:ep_m1_public_data";

const PACE_MS = 500;
const REQUEST_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 3;
const RETRY_PAUSE_MS = 4_000;
const FAILURE_THRESHOLD = 0.2;

// Radius within which RLS surveys are considered to belong to a location.
// ~55 km at the equator — matches the MERMAID coral-cover ingest.
const MATCH_RADIUS_DEG = 0.5;

// A single survey year is not a trend — the chart needs at least a before/after.
const MIN_TREND_YEARS = 2;

// An RLS M1 transect block is 50 m x 5 m = 250 m². Grams per block -> kg/ha:
//   (g / 250 m²) * (10000 m²/ha) / (1000 g/kg) = g * 0.04
const BLOCK_AREA_M2 = 250;
const G_PER_BLOCK_TO_KG_PER_HA = (10_000 / BLOCK_AREA_M2) / 1000; // 0.04
// Two blocks make one standard 500 m² transect — used to express abundance.
const BLOCKS_PER_TRANSECT = 2;

const TODAY = new Date().toISOString().slice(0, 10);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Fetch + minimal quote-aware CSV parsing
// ---------------------------------------------------------------------------

async function fetchCsv(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/rls-ingest (hello@scubaseason.fun)" },
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

// Parse a CSV string into an array of row objects. Handles double-quoted fields
// containing commas and escaped quotes ("") — enough for the AODN CSV output.
function parseCsv(text) {
  const rows = [];
  let field = "";
  let record = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      record.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      if (field !== "" || record.length > 0) { record.push(field); rows.push(record); record = []; field = ""; }
    } else field += c;
  }
  if (field !== "" || record.length > 0) { record.push(field); rows.push(record); }
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i] ?? ""; });
    return o;
  });
}

function surveyHasM1(methods) {
  return (methods || "").split(",").map((t) => t.trim()).includes("1");
}

// ---------------------------------------------------------------------------
// Scope: which locations have >= MIN_TREND_YEARS of nearby M1 surveys
// ---------------------------------------------------------------------------

async function fetchSurveyList() {
  const props = "survey_id,site_code,latitude,longitude,survey_date,program,methods";
  const url =
    `${AODN_OWS}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature` +
    `&typeName=${encodeURIComponent(SURVEY_LIST_LAYER)}&outputFormat=csv` +
    `&PROPERTYNAME=${encodeURIComponent(props)}`;
  const rows = parseCsv(await fetchCsv(url));
  return rows
    .filter((r) => surveyHasM1(r.methods) && r.latitude && r.longitude && r.survey_date)
    .map((r) => ({
      lat: Number(r.latitude),
      lng: Number(r.longitude),
      year: Number(r.survey_date.slice(0, 4)),
      program: r.program || "",
    }));
}

function isWithinRadius(loc, pt) {
  return (
    Math.abs(loc.lat - pt.lat) <= MATCH_RADIUS_DEG &&
    Math.abs(loc.lng - pt.lng) <= MATCH_RADIUS_DEG
  );
}

// ---------------------------------------------------------------------------
// Biomass aggregation from raw M1 rows
// ---------------------------------------------------------------------------

async function fetchM1ForBox(loc) {
  const minLon = loc.lng - MATCH_RADIUS_DEG;
  const minLat = loc.lat - MATCH_RADIUS_DEG;
  const maxLon = loc.lng + MATCH_RADIUS_DEG;
  const maxLat = loc.lat + MATCH_RADIUS_DEG;
  const props = "survey_id,site_code,latitude,longitude,survey_date,block,biomass,total,species_name,program";
  const cql = `BBOX(geom,${minLon},${minLat},${maxLon},${maxLat})`;
  const url =
    `${AODN_OWS}?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature` +
    `&typeName=${encodeURIComponent(M1_LAYER)}&outputFormat=csv` +
    `&PROPERTYNAME=${encodeURIComponent(props)}` +
    `&CQL_FILTER=${encodeURIComponent(cql)}`;
  return parseCsv(await fetchCsv(url));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Reduce raw M1 rows (already filtered to within radius) into a yearly series.
function buildRecord(locationId, rows) {
  // Group rows by survey, then by block.
  const surveys = new Map(); // survey_id -> { date, site, program, blocks: Map<block,{g,count,species:Set}> }
  for (const r of rows) {
    const sid = r.survey_id;
    let s = surveys.get(sid);
    if (!s) {
      s = { date: r.survey_date, site: r.site_code, program: r.program || "", blocks: new Map() };
      surveys.set(sid, s);
    }
    const block = r.block || "1";
    let b = s.blocks.get(block);
    if (!b) { b = { g: 0, count: 0 }; s.blocks.set(block, b); }
    b.g += num(r.biomass);
    b.count += num(r.total);
    if (r.species_name) (s.species ??= new Set()).add(r.species_name);
  }

  // Per-survey standing biomass density (kg/ha) = mean over blocks of g*0.04.
  // Abundance per standard 500 m² transect = mean block count * 2.
  const perYear = new Map(); // year -> { densities:[], abund:[], rich:[], sites:Set, programs:Set, latestDate }
  for (const s of surveys.values()) {
    const blocks = [...s.blocks.values()];
    if (blocks.length === 0) continue;
    const density =
      blocks.reduce((a, b) => a + b.g * G_PER_BLOCK_TO_KG_PER_HA, 0) / blocks.length;
    const abundance =
      (blocks.reduce((a, b) => a + b.count, 0) / blocks.length) * BLOCKS_PER_TRANSECT;
    const richness = s.species ? s.species.size : 0;
    const year = Number(s.date.slice(0, 4));
    let y = perYear.get(year);
    if (!y) { y = { densities: [], abund: [], rich: [], sites: new Set(), programs: new Set(), latestDate: s.date }; perYear.set(year, y); }
    y.densities.push(density);
    y.abund.push(abundance);
    y.rich.push(richness);
    if (s.site) y.sites.add(s.site);
    if (s.program) y.programs.add(s.program);
    if (s.date > y.latestDate) y.latestDate = s.date;
  }

  const years = [...perYear.keys()].sort((a, b) => a - b);
  if (years.length < MIN_TREND_YEARS) return null;

  const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const series = years.map((year) => {
    const y = perYear.get(year);
    return {
      year,
      biomassKgPerHa: Math.round(mean(y.densities) * 10) / 10,
      surveyCount: y.densities.length,
    };
  });

  const allSites = new Set();
  const allPrograms = new Set();
  let surveyEventCount = 0;
  for (const y of perYear.values()) {
    surveyEventCount += y.densities.length;
    y.sites.forEach((s) => allSites.add(s));
    y.programs.forEach((p) => allPrograms.add(p));
  }

  const latestYear = years[years.length - 1];
  const ly = perYear.get(latestYear);
  const programs = [...allPrograms].sort();
  const km = Math.round(MATCH_RADIUS_DEG * 111);
  const programLabel = programs.join(" + ") || "RLS";

  return {
    locationId,
    sourceId: "rls",
    methodologyClaimId: "fish-biomass-rls",
    radiusDeg: MATCH_RADIUS_DEG,
    surveyEventCount,
    surveyYears: years.length,
    siteCount: allSites.size,
    programs,
    latest: {
      year: latestYear,
      biomassKgPerHa: Math.round(mean(ly.densities) * 10) / 10,
      abundancePer500m2: Math.round(mean(ly.abund)),
      speciesRichness: Math.round(mean(ly.rich) * 10) / 10,
      surveyDate: ly.latestDate,
    },
    series,
    citation:
      "Reef Life Survey (RLS). Fish biomass from Method 1 transects, served by the Integrated Marine Observing System (IMOS) Australian Ocean Data Network. " +
      "Edgar GJ, Stuart-Smith RD (2014) Systematic global assessment of reef fish communities by the Reef Life Survey program. Scientific Data 1:140007. " +
      `Retrieved ${TODAY} from https://reeflifesurvey.com.`,
    notes:
      `${surveyEventCount} RLS ${programLabel} M1 fish transects across ${years.length} survey years ` +
      `within ${km} km of this location, ${allSites.size} survey sites. ` +
      `Standing fish biomass in kg/ha; most recent survey ${ly.latestDate}.`,
    lastReviewedAt: TODAY,
  };
}

// ---------------------------------------------------------------------------
// Source + methodology registration
// ---------------------------------------------------------------------------

const RLS_SOURCE = {
  id: "rls",
  name: "Reef Life Survey (RLS)",
  url: "https://reeflifesurvey.com/",
  publisher: "Reef Life Survey Foundation / IMAS, University of Tasmania (via IMOS AODN)",
  sourceType: "scientific-survey",
  accessedAt: TODAY,
  license: "CC BY 4.0",
  notes:
    "Global standardized reef-fish visual census (Method 1 fish transects). Open data served by the IMOS Australian Ocean Data Network (AODN) geoserver — no authentication required. Publishes per-species biomass, abundance and species richness per survey. Attribution required.",
};

const RLS_METHODOLOGY = {
  claimId: "fish-biomass-rls",
  claimType: "reef-health",
  sourceIds: ["rls"],
  confidence: "high",
  calculation:
    "Standing reef-fish biomass from Reef Life Survey Method 1 (M1) underwater visual transects, served by the IMOS AODN geoserver (imos:ep_m1_public_data). For each M1 survey, fish biomass is summed across all species and size classes within each 50 m x 5 m (250 m²) transect block, converted to a density in kilograms per hectare (grams per block x 0.04), and averaged across the survey's blocks so the figure is robust to whether one or two blocks were surveyed. A location's value for a year is the mean survey density across all M1 surveys within 0.5° (~55 km) of the location centre in that year, so a run of surveys becomes a real trend line. Every point is an observed value; nothing is projected. Latest-year abundance and species richness are the mean fish count per standard 500 m² transect and the mean distinct fish species per transect.",
  limitations:
    "Surveys are matched by proximity (0.5° radius), not by exact dive site, so nearby transects may not perfectly represent the named location. This is a DISPLAY-ONLY trend chart and never sets the reef-state label. RLS coverage is uneven: strong on temperate, Mediterranean and long-running Australian reefs, but sparse or absent across much of the tropical Indo-Pacific, and many reefs are surveyed only once (no trend, so no chart). Biomass is estimated from visual size-class to weight conversions and can spike when a single large school or big-bodied fish is recorded on a transect. Volunteer (RLS) and professional (ATRC and partner) M1 surveys are pooled by shared method.",
  lastReviewedAt: TODAY,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(process.argv[limitArg + 1]) : null;

async function main() {
  console.log("Reef Life Survey fish-biomass ingest" + (DRY_RUN ? " (dry run — no writes)" : ""));
  console.log("=====================================");

  const [locationsRaw, sourcesRaw, methodologiesRaw] = await Promise.all([
    fs.readFile(LOCATIONS_PATH, "utf8"),
    fs.readFile(SOURCES_PATH, "utf8"),
    fs.readFile(METHODOLOGIES_PATH, "utf8"),
  ]);
  const locations = JSON.parse(locationsRaw).filter(
    (l) => typeof l.lat === "number" && typeof l.lng === "number",
  );
  const sources = JSON.parse(sourcesRaw);
  const methodologies = JSON.parse(methodologiesRaw);

  let sourcesDirty = false;
  if (!sources.some((s) => s.id === "rls")) {
    sources.push(RLS_SOURCE);
    sourcesDirty = true;
    console.log("+ registered rls in sources.json");
  }
  let methodologiesDirty = false;
  if (!methodologies.some((m) => m.claimId === "fish-biomass-rls")) {
    methodologies.push(RLS_METHODOLOGY);
    methodologiesDirty = true;
    console.log("+ registered fish-biomass-rls in methodologies.json");
  }

  console.log("\nFetching RLS survey list…");
  const surveys = await fetchSurveyList();
  console.log(`  ${surveys.length} M1 surveys with coordinates`);

  // Scope: locations with >= MIN_TREND_YEARS distinct nearby M1 survey years.
  const targets = [];
  for (const loc of locations) {
    const near = surveys.filter((s) => isWithinRadius(loc, s));
    if (near.length === 0) continue;
    const years = new Set(near.map((s) => s.year));
    if (years.size >= MIN_TREND_YEARS) targets.push({ loc, years: years.size });
  }
  targets.sort((a, b) => b.years - a.years);
  const scoped = LIMIT ? targets.slice(0, LIMIT) : targets;
  console.log(`  ${targets.length} locations have >= ${MIN_TREND_YEARS} survey years` +
    (LIMIT ? ` (limited to ${scoped.length})` : ""));

  console.log(`\nPulling M1 biomass for ${scoped.length} locations (radius ${MATCH_RADIUS_DEG}°)…`);
  const records = [];
  const failures = [];
  let attempted = 0;
  for (const { loc } of scoped) {
    attempted++;
    try {
      const rows = await fetchM1ForBox(loc);
      const inRadius = rows.filter(
        (r) => r.latitude && r.longitude &&
          isWithinRadius(loc, { lat: Number(r.latitude), lng: Number(r.longitude) }),
      );
      const record = buildRecord(loc.id, inRadius);
      if (!record) {
        console.log(`  ${loc.id.padEnd(40)} — no biomass series`);
        await sleep(PACE_MS);
        continue;
      }
      records.push(record);
      const first = record.series[0];
      const last = record.latest;
      const arrow = last.biomassKgPerHa > first.biomassKgPerHa ? "↑" : last.biomassKgPerHa < first.biomassKgPerHa ? "↓" : "→";
      console.log(
        `  ${loc.id.padEnd(40)} ${record.surveyYears} yrs ${first.year}-${last.year}  ` +
        `${first.biomassKgPerHa} ${arrow} ${last.biomassKgPerHa} kg/ha  (${record.surveyEventCount} surveys, ${record.programs.join("+")})`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
    await sleep(PACE_MS);
  }

  records.sort((a, b) => a.locationId.localeCompare(b.locationId));

  if (DRY_RUN) {
    console.log(`\n[dry run] would write ${records.length} location series to fish-biomass-series.json. No files changed.`);
    return;
  }

  const writes = [fs.writeFile(SERIES_PATH, JSON.stringify(records, null, 2) + "\n")];
  if (sourcesDirty) writes.push(fs.writeFile(SOURCES_PATH, JSON.stringify(sources, null, 2) + "\n"));
  if (methodologiesDirty) writes.push(fs.writeFile(METHODOLOGIES_PATH, JSON.stringify(methodologies, null, 2) + "\n"));
  await Promise.all(writes);

  console.log("");
  console.log(`RLS fish-biomass series ingest complete @ ${new Date().toISOString()}`);
  console.log(`  attempted:             ${attempted}`);
  console.log(`  locations with series: ${records.length}`);
  console.log(`  failed:                ${failures.length}`);
  if (failures.length > 0) {
    console.warn("\nFailures:");
    for (const f of failures) console.warn(`  - ${f.id}: ${f.reason}`);
  }

  const failureRate = attempted > 0 ? failures.length / attempted : 0;
  if (failureRate > FAILURE_THRESHOLD) {
    console.error(`\nFAIL: ${(failureRate * 100).toFixed(1)}% of locations failed — above ${FAILURE_THRESHOLD * 100}% threshold`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
