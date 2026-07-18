#!/usr/bin/env node
/**
 * Build reef-health records from AGRRA for CURRENTLY-UNSURVEYED locations only.
 *
 * This is the "close the coverage gap with real data" companion to
 * fetch-agrra-reef-trends.mjs. That script produces DISPLAY-ONLY trend charts
 * (agrra-reef-series.json) and deliberately never touches reef-health.json,
 * because a proximity composite must not override a HAND-CURATED verdict.
 *
 * This script targets the opposite case: locations that today have NO
 * reef-health record at all and therefore render "Not surveyed". For those
 * there is no curated verdict to contradict, so a real AGRRA proximity/national
 * composite — honestly labelled as a nearby-survey composite, not an on-site
 * survey — is strictly more informative than a blank. It becomes the location's
 * reef-health record and drives getReefState().
 *
 * INVARIANT PRESERVED: every number written is a real AGRRA survey value
 * (LCAVG live-coral cover, pooled per survey year). Nothing is estimated,
 * modelled, or mis-attributed. This is NOT backfill-reef-health-new-locs.mjs
 * (which fabricates regional-average cover and is barred).
 *
 * Guardrails:
 *   - Writes a record ONLY where none exists for that locationId. Never
 *     overwrites or edits a curated record.
 *   - Requires >= MIN_TREND_YEARS distinct AGRRA coral survey years in scope.
 *   - Proximity first (<= MATCH_RADIUS_DEG); national composite only as a gated
 *     fallback within the location's own-country footprint.
 *   - Uses its own methodology claim `reef-health-agrra-composite`, which
 *     states plainly that for these previously-unsurveyed locations the nearby
 *     AGRRA composite IS the reef-state basis (unlike reef-health-agrra, which
 *     is display-only).
 *   - Leaves thermalStress empty; the daily NOAA CRW job (fetch-reef-health)
 *     fills it on its next run.
 *
 * Usage:
 *   node scripts/build-reef-health-from-agrra.mjs --dry-run   # print, no writes
 *   node scripts/build-reef-health-from-agrra.mjs             # write records
 *
 * License: AGRRA non-commercial + attribution (see fetch-agrra-reef-trends.mjs).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const REEF_HEALTH_PATH = path.join(ROOT, "src/data/reef-health.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");

const AGRRA_LAYER =
  "https://services8.arcgis.com/C2yYpahRgrVlBqfg/arcgis/rest/services/BaseBySite/FeatureServer/0";
const OUT_FIELDS = "SITEYEARMO,SITELATITU,SITELONGIT,LCAVG,FBIOMASS,COUNTRYNAM,SITENAME";
const PAGE_SIZE = 2000;
const PACE_MS = 300;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_PAUSE_MS = 2_000;

const NO_DATA = 0; // keep only LCAVG >= 0 (drops AGRRA's -999 sentinel)
const MATCH_RADIUS_DEG = 0.75; // ~83 km proximity scope
const FALLBACK_RADIUS_DEG = 1.5; // national-composite footprint gate
const MIN_TREND_YEARS = 3; // real trend needs >= 3 survey years

const NON_REEF_LOCATION_IDS = new Set(["cenotes-mexico"]);
function isNonReef(loc) {
  return NON_REEF_LOCATION_IDS.has(loc.id) || /cenote|freshwater|lake\b/i.test(loc.id);
}

const COUNTRY_ALIASES = {
  "Antigua and Barbuda": "Antigua & Barbuda",
  "Saint Kitts and Nevis": "St. Kitts & Nevis",
  "Saint Vincent and the Grenadines": "St. Vincent & Grenadines",
  "The Bahamas": "Bahamas",
};
const agrraCountryName = (c) => COUNTRY_ALIASES[c] ?? c;

const AGRRA_CITATION =
  "Kramer, P.R., Roth, L., and Lang, J. AGRRA Database (Atlantic and Gulf Rapid Reef Assessment). Ocean Research & Education Foundation. www.agrra.org.";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Fetch (copied from fetch-agrra-reef-trends.mjs; AGRRA stays self-contained) ──
async function fetchJson(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/agrra-reef-health" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || String(err);
      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_PAUSE_MS);
        continue;
      }
      throw new Error(`request failed (${cause}): ${url}`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) {
      await sleep(RETRY_PAUSE_MS);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    const data = await res.json();
    if (data.error)
      throw new Error(`ArcGIS error: ${JSON.stringify(data.error).slice(0, 200)}`);
    return data;
  }
}

async function fetchAllSites() {
  const sites = [];
  let offset = 0;
  for (let page = 1; ; page++) {
    process.stdout.write(`  page ${page}…\r`);
    const url =
      `${AGRRA_LAYER}/query?where=${encodeURIComponent("1=1")}` +
      `&outFields=${encodeURIComponent(OUT_FIELDS)}` +
      `&returnGeometry=false&resultOffset=${offset}` +
      `&resultRecordCount=${PAGE_SIZE}&f=json`;
    const data = await fetchJson(url);
    const rows = (data.features ?? []).map((f) => f.attributes);
    sites.push(...rows);
    if (!data.exceededTransferLimit || rows.length === 0) break;
    offset += rows.length;
    await sleep(PACE_MS);
  }
  process.stdout.write("\n");
  return sites.filter(
    (r) =>
      typeof r.SITELATITU === "number" &&
      typeof r.SITELONGIT === "number" &&
      typeof r.SITEYEARMO === "number",
  );
}

// ── Series building (per survey year mean of LCAVG) ──
function coralPoints(rows) {
  const byYear = new Map();
  for (const r of rows) {
    const v = r.LCAVG;
    if (typeof v !== "number" || v < NO_DATA) continue;
    const b = byYear.get(r.SITEYEARMO) ?? { sum: 0, n: 0 };
    b.sum += v;
    b.n += 1;
    byYear.set(r.SITEYEARMO, b);
  }
  return [...byYear.entries()]
    .map(([year, { sum, n }]) => ({ year, coralCoverPercent: Math.round((sum / n) * 10) / 10 }))
    .sort((a, b) => a.year - b.year);
}

const withinRadius = (loc, r, deg) =>
  Math.abs(loc.lat - r.SITELATITU) <= deg && Math.abs(loc.lng - r.SITELONGIT) <= deg;

function nearestSameCountryDeg(loc, sites, countryName) {
  let best = Infinity;
  for (const r of sites) {
    if (r.COUNTRYNAM !== countryName) continue;
    const d = Math.hypot(loc.lat - r.SITELATITU, loc.lng - r.SITELONGIT);
    if (d < best) best = d;
  }
  return best;
}

// Build a reef-health record (or null) for one uncovered location.
function buildReefHealthRecord(loc, sites) {
  const near = sites.filter((r) => withinRadius(loc, r, MATCH_RADIUS_DEG));
  let scope = "proximity";
  let scopeRows = near;
  let coral = coralPoints(near);
  let country = null;

  if (coral.length < MIN_TREND_YEARS) {
    const cn = agrraCountryName(loc.country);
    const inFootprint = nearestSameCountryDeg(loc, sites, cn) <= FALLBACK_RADIUS_DEG;
    if (inFootprint) {
      const countryRows = sites.filter((r) => r.COUNTRYNAM === cn);
      const countryCoral = coralPoints(countryRows);
      if (countryCoral.length >= MIN_TREND_YEARS) {
        scope = "country";
        scopeRows = countryRows;
        coral = countryCoral;
        country = cn;
      }
    }
  }

  if (coral.length < MIN_TREND_YEARS) return null;

  const first = coral[0];
  const latest = coral[coral.length - 1];
  const km = Math.round(MATCH_RADIUS_DEG * 111);

  const surveyMethod =
    scope === "proximity"
      ? `AGRRA rapid reef assessment — pooled mean of ${scopeRows.length} site-surveys at AGRRA stations within ~${km} km of the location (nearby-survey composite, not an on-site survey)`
      : `AGRRA rapid reef assessment — ${country} national composite (pooled mean of ${scopeRows.length} site-surveys; no AGRRA station lies within ~${km} km of the location)`;

  const notes =
    `No on-site reef survey exists for this location, so its reef-state is based on the nearest AGRRA ` +
    `${scope === "proximity" ? `stations (within ~${km} km)` : `${country} national`} composite: ` +
    `${coral.length} survey years, ${first.year}–${latest.year}. Live-coral cover is the pooled per-year ` +
    `mean of LCAVG across every AGRRA site in scope. This is real survey data from nearby reefs standing in ` +
    `for an unsurveyed location, not a modelled or estimated value. ${AGRRA_CITATION}`;

  return {
    id: `reef-health-${loc.id}-agrra`,
    locationId: loc.id,
    observed: {
      surveyDate: `${latest.year}-01-01`,
      surveyMethod,
      coralCoverPercent: latest.coralCoverPercent,
      historicalCoralCoverPercent: first.coralCoverPercent,
      historicalSurveyDate: `${first.year}-01-01`,
      sourceIds: ["agrra"],
      notes,
      coralCoverSeries: coral.map((p) => ({
        year: p.year,
        coralCoverPercent: p.coralCoverPercent,
      })),
    },
    // thermalStress intentionally omitted — the daily NOAA CRW job fills it.
    methodologyClaimIds: ["reef-health-agrra-composite"],
    lastReviewedAt: new Date().toISOString().slice(0, 10),
    // Provenance breadcrumbs for the guard / review (mirrors agrra-reef-series):
    _match: { type: scope, ...(scope === "proximity" ? { radiusDeg: MATCH_RADIUS_DEG } : { country }), surveyEventCount: scopeRows.length, coralSurveyYears: coral.length },
  };
}

// Coral-only label preview (thermal + fishing not yet known for these locs).
function coralOnlyLabel(cover, before) {
  if (cover < 25) return "Declining";
  if (cover >= 40 && !(before !== null && cover < before)) return "Improving?"; // gated later by heat+fishing
  return "Stable";
}

function upsertAgrraCompositeMethodology(methodologies) {
  const today = new Date().toISOString().slice(0, 10);
  const note = {
    claimId: "reef-health-agrra-composite",
    claimType: "reef-health",
    sourceIds: ["agrra"],
    confidence: "medium",
    calculation:
      "For locations with no on-site reef survey, live-coral cover % is the pooled per-survey-year mean of LCAVG from the AGRRA Data Explorer BaseBySite FeatureServer, filtered to >= 0 to drop the -999 no-data sentinel. Scope is proximity first — every AGRRA site within 0.75° (~83 km) of the location centre — falling back to the location's own-country national composite only when proximity yields fewer than three survey years AND the nearest same-country AGRRA site is within 1.5°. The latest survey year sets the headline coral-cover number and the earliest sets the historical baseline; a record is created only when the series spans at least three survey years. Thermal stress is added separately by the daily NOAA CRW job.",
    limitations:
      "Unlike an on-site survey, these values are a nearby AGRRA composite matched to the location centre, so they describe the surrounding reef area rather than the exact dive site, and the annual mean pools every surveyed station in scope. They are used to give an otherwise-unsurveyed location a real, honestly-sourced reef-state instead of leaving it blank; a location's record is upgraded to a curated on-site survey whenever one becomes available. Every number is a real AGRRA survey value — none is modelled or estimated. Confidence is medium (not high) precisely because the survey is near the location, not at it.",
    lastReviewedAt: today,
  };
  const idx = methodologies.findIndex((m) => m.claimId === "reef-health-agrra-composite");
  if (idx === -1) {
    methodologies.push(note);
    return "registered";
  }
  if (JSON.stringify(methodologies[idx]) !== JSON.stringify(note)) {
    methodologies[idx] = note;
    return "updated";
  }
  return "unchanged";
}

// ── Main ──
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("AGRRA → reef-health record builder (unsurveyed locations only)" + (DRY_RUN ? " — DRY RUN, no writes" : ""));
  console.log("=".repeat(70));

  const [reefHealthRaw, locationsRaw] = await Promise.all([
    fs.readFile(REEF_HEALTH_PATH, "utf8"),
    fs.readFile(LOCATIONS_PATH, "utf8"),
  ]);
  const reefHealth = JSON.parse(reefHealthRaw);
  const locations = JSON.parse(locationsRaw);

  const coveredLocationIds = new Set(
    reefHealth.filter((r) => r.locationId).map((r) => r.locationId),
  );
  const uncovered = locations.filter(
    (l) => !coveredLocationIds.has(l.id) && !isNonReef(l),
  );
  console.log(`locations: ${locations.length} total, ${coveredLocationIds.size} covered, ${uncovered.length} uncovered (candidates)\n`);

  console.log("Fetching AGRRA BaseBySite survey sites…");
  const sites = await fetchAllSites();
  console.log(`  usable site-surveys: ${sites.length}\n`);

  const newRecords = [];
  let proximity = 0;
  let countryComposite = 0;
  const preview = [];

  for (const loc of uncovered) {
    const rec = buildReefHealthRecord(loc, sites);
    if (!rec) continue;
    const m = rec._match;
    if (m.type === "proximity") proximity++;
    else countryComposite++;
    const o = rec.observed;
    const label = coralOnlyLabel(o.coralCoverPercent, o.historicalCoralCoverPercent);
    preview.push({
      loc: loc.id,
      country: loc.country,
      type: m.type,
      years: m.coralSurveyYears,
      span: `${o.coralCoverSeries[0].year}–${o.coralCoverSeries.at(-1).year}`,
      cover: `${o.historicalCoralCoverPercent}%→${o.coralCoverPercent}%`,
      label,
    });
    delete rec._match; // strip breadcrumb before it would be written
    newRecords.push(rec);
  }

  preview.sort((a, b) => a.loc.localeCompare(b.loc));
  console.log("Would create reef-health records for:");
  console.log("  " + "location".padEnd(40) + "match".padEnd(11) + "yrs  span".padEnd(14) + "coral(old→new)".padEnd(16) + "coral-only label");
  for (const p of preview) {
    console.log(
      "  " +
        p.loc.padEnd(40) +
        p.type.padEnd(11) +
        String(p.years).padEnd(5) +
        p.span.padEnd(12) +
        p.cover.padEnd(16) +
        p.label,
    );
  }

  const labelCounts = preview.reduce((a, p) => ((a[p.label] = (a[p.label] || 0) + 1), a), {});
  console.log("");
  console.log(`NEW records that would be created: ${newRecords.length}`);
  console.log(`  proximity matches:  ${proximity}`);
  console.log(`  country composites: ${countryComposite}`);
  console.log(`  coral-only label preview: ${JSON.stringify(labelCounts)}`);
  console.log(`  (final label also folds in NOAA heat + fishing once thermalStress lands)`);
  console.log(`  reef-health.json would grow ${reefHealth.length} → ${reefHealth.length + newRecords.length}`);

  if (DRY_RUN) {
    console.log("\n── Sample full record (first) ─────────────────────────────");
    console.log(JSON.stringify(newRecords[0], null, 2));
    console.log("\n[dry run] no files written.");
    return;
  }

  // ── Write path ──
  const [sourcesRaw, methodologiesRaw] = await Promise.all([
    fs.readFile(SOURCES_PATH, "utf8"),
    fs.readFile(METHODOLOGIES_PATH, "utf8"),
  ]);
  const sources = JSON.parse(sourcesRaw);
  const methodologies = JSON.parse(methodologiesRaw);

  // agrra source is already registered by fetch-agrra-reef-trends.mjs; only add
  // it if somehow absent (belt-and-braces, non-destructive).
  if (!sources.some((s) => s.id === "agrra")) {
    console.warn("! agrra source not found in sources.json — run fetch-agrra-reef-trends.mjs first.");
    process.exit(1);
  }
  const methodStatus = upsertAgrraCompositeMethodology(methodologies);

  const merged = [...reefHealth, ...newRecords];
  await fs.writeFile(REEF_HEALTH_PATH, JSON.stringify(merged, null, 2) + "\n");
  if (methodStatus !== "unchanged")
    await fs.writeFile(METHODOLOGIES_PATH, JSON.stringify(methodologies, null, 2) + "\n");

  console.log(`\nWrote ${newRecords.length} new reef-health records (${methodStatus} methodology claim).`);
  console.log(`reef-health.json: ${reefHealth.length} → ${merged.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
