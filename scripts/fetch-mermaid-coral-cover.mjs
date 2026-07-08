#!/usr/bin/env node
/**
 * Wave v2.1 — MERMAID benthic + bleaching survey ingest.
 *
 * Fetches open benthic and bleaching survey data from the MERMAID API and
 * writes per-location multi-year coral-cover series into
 * src/data/coral-cover-series.json.
 *
 * This is a display-only dataset for the reef card's coral-cover-over-time
 * chart. It deliberately does NOT write reef-health.json: MERMAID events are
 * matched by proximity (0.5°), so a nearby survey can differ from a location's
 * curated reef-state verdict, and we do not want a proximity match to override
 * a hand-reviewed classification (e.g. Cozumel). The series enriches the chart;
 * the verdict and headline coral number stay on the curated reef-health record.
 *
 * MERMAID (datamermaid.org) is a WCS/GCRMN platform for coral reef
 * monitoring. The /v1/summarysampleevents/ endpoint is fully public —
 * no API token required. Each record includes lat/lon, sample date, and
 * benthic cover percentages by category (Hard coral, Macroalgae, etc.)
 * plus life-history fractions for the coral assemblage.
 *
 * Matching strategy:
 *   For each location in locations.json, all MERMAID survey events within
 *   MATCH_RADIUS_DEG degrees are collected. The most recent event with a
 *   valid Hard coral reading (1–90%) is used as the current observed
 *   condition. If events span ≥2 years, the oldest valid reading is stored
 *   as historicalCoralCoverPercent for trend comparison. Separately, the
 *   most recent nearby event with colonies_bleached data is used to fill
 *   bleachedPercent and mortalityPercent.
 *
 * Idempotency:
 *   Records are keyed by id = "reef-health-{locationId}-mermaid".
 *   Re-running overwrites only those records; all editorial records are
 *   left untouched.
 *
 * No API key. CC BY 4.0. Pace 300ms between page fetches.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SERIES_PATH = path.join(ROOT, "src/data/coral-cover-series.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");

// Locations that sit within the match radius of reef surveys but are NOT coral
// reefs themselves (e.g. inland cenotes). A proximity match there is a false
// positive, so they never get a coral-cover series.
const NON_REEF_LOCATION_IDS = new Set(["cenotes-mexico"]);
function isNonReef(loc) {
  return NON_REEF_LOCATION_IDS.has(loc.id) || /cenote|freshwater|lake\b/i.test(loc.id);
}

const MERMAID_BASE = "https://api.datamermaid.org/v1";
const PAGE_SIZE = 500;
const PACE_MS = 300;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const RETRY_PAUSE_MS = 2_000;
const FAILURE_THRESHOLD = 0.2;

// Valid coral cover range — filters out 0% (rubble/sand sites) and
// implausibly high values that indicate test data or data-entry errors.
const MIN_COVER = 1;
const MAX_COVER = 90;

// Radius within which MERMAID survey events are considered to belong to
// a location. ~55 km at the equator — wide enough to cover a reef system.
const MATCH_RADIUS_DEG = 0.5;

// Minimum year gap between surveys to report a historical baseline.
const MIN_TREND_YEARS = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchPage(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/mermaid-ingest" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || String(err);
      if (attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
      throw new Error(`request failed (${cause}): ${url}`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    return res.json();
  }
}

async function fetchAllSurveyEvents() {
  const events = [];
  let url = `${MERMAID_BASE}/summarysampleevents/?limit=${PAGE_SIZE}`;
  let page = 0;
  while (url) {
    page++;
    process.stdout.write(`  page ${page}…\r`);
    const data = await fetchPage(url);
    events.push(...data.results);
    url = data.next;
    if (url) await sleep(PACE_MS);
  }
  process.stdout.write("\n");
  return events;
}

// ---------------------------------------------------------------------------
// Data extraction
// ---------------------------------------------------------------------------

function getHardCoralCover(event) {
  for (const protocol of ["benthicpit", "benthiclit", "benthicpqt"]) {
    const p = event.protocols?.[protocol];
    if (!p) continue;
    const cover = p.percent_cover_benthic_category_avg?.["Hard coral"];
    if (typeof cover === "number" && cover >= MIN_COVER && cover <= MAX_COVER) {
      return {
        cover: Math.round(cover * 10) / 10,
        protocol,
        macroalgae: p.percent_cover_benthic_category_avg?.["Macroalgae"],
        stressTolerant: p.percent_cover_life_histories_avg?.["stress-tolerant"],
      };
    }
  }
  return null;
}

function methodLabel(protocol) {
  return {
    benthicpit: "benthic PIT (point intercept transect)",
    benthiclit: "benthic LIT (line intercept transect)",
    benthicpqt: "benthic photo quadrat transect",
  }[protocol] ?? protocol;
}

function getBleachingData(event) {
  const b = event.protocols?.colonies_bleached;
  if (!b) return null;
  const bleached = b.percent_bleached_avg;
  const dead = b.percent_dead_avg;
  if (typeof bleached !== "number") return null;
  return {
    bleachedPercent: Math.round(bleached * 10) / 10,
    mortalityPercent: typeof dead === "number" ? Math.round(dead * 10) / 10 : undefined,
  };
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

function isWithinRadius(loc, event) {
  return (
    Math.abs(loc.lat - event.latitude) <= MATCH_RADIUS_DEG &&
    Math.abs(loc.lng - event.longitude) <= MATCH_RADIUS_DEG
  );
}

function buildRecord(locationId, events) {
  const candidates = events
    .map((e) => ({ event: e, coral: getHardCoralCover(e) }))
    .filter((x) => x.coral !== null)
    .sort((a, b) => b.event.sample_date.localeCompare(a.event.sample_date));

  if (candidates.length === 0) return null;

  const newest = candidates[0];
  const oldest = candidates[candidates.length - 1];

  const newestYear = parseInt(newest.event.sample_date.slice(0, 4), 10);
  const oldestYear = parseInt(oldest.event.sample_date.slice(0, 4), 10);
  const hasBaseline = oldest !== newest && newestYear - oldestYear >= MIN_TREND_YEARS;

  // Full multi-year series: one point per survey year, averaging all nearby
  // events in that year so a decade of surveys becomes a real trend line rather
  // than being collapsed to its two endpoints. Every point is an observed value.
  const byYear = new Map();
  for (const c of candidates) {
    const year = parseInt(c.event.sample_date.slice(0, 4), 10);
    const bucket = byYear.get(year) ?? { sum: 0, n: 0 };
    bucket.sum += c.coral.cover;
    bucket.n += 1;
    byYear.set(year, bucket);
  }
  const coralCoverSeries = [...byYear.entries()]
    .map(([year, { sum, n }]) => ({
      year,
      coralCoverPercent: Math.round((sum / n) * 10) / 10,
    }))
    .sort((a, b) => a.year - b.year);
  const surveyYears = coralCoverSeries.length;

  // Find most recent bleaching survey among all nearby events (may differ from benthic event).
  const bleachingEvent = events
    .filter((e) => getBleachingData(e) !== null)
    .sort((a, b) => b.sample_date.localeCompare(a.sample_date))[0];
  const bleaching = bleachingEvent ? getBleachingData(bleachingEvent) : null;

  // A single survey year is not a trend — skip it. The chart needs at least a
  // before/after, and this dataset is purpose-built for the multi-year line.
  if (surveyYears < 2) return null;
  void hasBaseline;
  void oldest;

  const notes =
    `${candidates.length} MERMAID survey events across ${surveyYears} survey years within ${MATCH_RADIUS_DEG}° of this location. ` +
    `Most recent: ${newest.event.site_name} (${newest.event.sample_date}). ` +
    (newest.event.suggested_citation ?? "");

  return {
    locationId,
    sourceId: "mermaid",
    methodologyClaimId: "reef-health-mermaid",
    radiusDeg: MATCH_RADIUS_DEG,
    surveyEventCount: candidates.length,
    surveyYears,
    latest: {
      year: newestYear,
      coralCoverPercent: newest.coral.cover,
      surveyDate: newest.event.sample_date,
    },
    ...(bleaching && {
      bleachedPercent: bleaching.bleachedPercent,
      ...(bleaching.mortalityPercent !== undefined && { mortalityPercent: bleaching.mortalityPercent }),
    }),
    series: coralCoverSeries,
    citation: newest.event.suggested_citation ?? null,
    notes,
    lastReviewedAt: new Date().toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Source + methodology registration
// ---------------------------------------------------------------------------

const MERMAID_SOURCE = {
  id: "mermaid",
  name: "MERMAID (Marine Ecological Research Management Aid)",
  url: "https://datamermaid.org/",
  publisher: "Wildlife Conservation Society (WCS)",
  sourceType: "research-database",
  accessedAt: new Date().toISOString().slice(0, 10),
  license: "CC BY 4.0 (open summary data)",
  notes:
    "Coral reef benthic survey platform used by researchers globally. Open summary data at /v1/summarysampleevents/ — no authentication required. Raw transect data may be restricted per project.",
};

const MERMAID_METHODOLOGY = {
  claimId: "reef-health-mermaid",
  claimType: "reef-health",
  sourceIds: ["mermaid"],
  confidence: "high",
  calculation:
    "Hard coral cover % from percent_cover_benthic_category_avg[\"Hard coral\"] in the MERMAID summarysampleevents endpoint. Benthic PIT preferred over LIT over photo-quadrat when multiple protocols exist. Most recent valid survey event (cover 1–90%) within 0.5° of location centre used as current reading; oldest valid event used as historical baseline when surveys span ≥2 years. When surveys span two or more years, a full coralCoverSeries is built with one point per year, averaging all valid nearby events in that year, so the reef card can draw the real multi-year trend instead of only the two endpoints. Bleaching % and mortality % from colonies_bleached.percent_bleached_avg and percent_dead_avg of the most recent nearby bleaching survey event.",
  limitations:
    "Survey events are matched by proximity (0.5° radius), not by site name — a nearby survey may not perfectly represent the named location. Cover is the mean across all sample units in that event. Bleaching survey may be from a different event or date than the benthic survey. Projects with test or training data may slip through the 1–90% filter.",
  lastReviewedAt: new Date().toISOString().slice(0, 10),
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("MERMAID benthic survey ingest" + (DRY_RUN ? " (dry run — no writes)" : ""));
  console.log("==============================");

  const [locationsRaw, sourcesRaw, methodologiesRaw] =
    await Promise.all([
      fs.readFile(LOCATIONS_PATH, "utf8"),
      fs.readFile(SOURCES_PATH, "utf8"),
      fs.readFile(METHODOLOGIES_PATH, "utf8"),
    ]);

  const locations = JSON.parse(locationsRaw);
  const sources = JSON.parse(sourcesRaw);
  const methodologies = JSON.parse(methodologiesRaw);

  const srcIdx = sources.findIndex((s) => s.id === "mermaid");
  let sourcesDirty = false;
  if (srcIdx === -1) {
    sources.push(MERMAID_SOURCE);
    sourcesDirty = true;
    console.log("+ registered mermaid in sources.json");
  }

  const methIdx = methodologies.findIndex((m) => m.claimId === "reef-health-mermaid");
  let methodologiesDirty = false;
  if (methIdx === -1) {
    methodologies.push(MERMAID_METHODOLOGY);
    methodologiesDirty = true;
    console.log("+ registered reef-health-mermaid in methodologies.json");
  }

  console.log(`\nFetching MERMAID survey events…`);
  const allEvents = await fetchAllSurveyEvents();
  console.log(`  total events: ${allEvents.length}`);

  const benthicEvents = allEvents.filter((e) => getHardCoralCover(e) !== null);
  const bleachingEvents = allEvents.filter((e) => getBleachingData(e) !== null);
  console.log(`  events with valid coral cover: ${benthicEvents.length}`);
  console.log(`  events with bleaching data:    ${bleachingEvents.length}`);

  // Union of all events that have either benthic or bleaching data — passed
  // to buildRecord so it can independently find the best of each type.
  const relevantEvents = allEvents.filter(
    (e) => getHardCoralCover(e) !== null || getBleachingData(e) !== null,
  );

  console.log(`\nMatching ${locations.length} locations (radius ${MATCH_RADIUS_DEG}°)…`);

  let attempted = 0;
  let updated = 0;
  let skippedNonReef = 0;
  let withBleaching = 0;
  const failures = [];
  const newRecords = [];

  for (const loc of locations) {
    attempted++;
    try {
      if (isNonReef(loc)) { skippedNonReef++; continue; }
      const matched = relevantEvents.filter((e) => isWithinRadius(loc, e));
      if (matched.length === 0) continue;

      const record = buildRecord(loc.id, matched);
      if (!record) continue;

      newRecords.push(record);
      updated++;
      if (record.bleachedPercent !== undefined) withBleaching++;

      const bleach = record.bleachedPercent !== undefined ? `  bleached ${record.bleachedPercent}%` : "";
      console.log(
        `  ${loc.id.padEnd(44)} ${record.surveyYears} yrs ${record.series[0].year}–${record.latest.year}  latest ${record.latest.coralCoverPercent}%${bleach}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
  }

  const merged = [...newRecords].sort((a, b) => a.locationId.localeCompare(b.locationId));

  if (DRY_RUN) {
    console.log(`\n[dry run] would write ${merged.length} location series to coral-cover-series.json. No files changed.`);
    return;
  }

  const writes = [fs.writeFile(SERIES_PATH, JSON.stringify(merged, null, 2) + "\n")];
  if (sourcesDirty) writes.push(fs.writeFile(SOURCES_PATH, JSON.stringify(sources, null, 2) + "\n"));
  if (methodologiesDirty) writes.push(fs.writeFile(METHODOLOGIES_PATH, JSON.stringify(methodologies, null, 2) + "\n"));
  await Promise.all(writes);

  console.log("");
  console.log(`MERMAID coral-cover series ingest complete @ ${new Date().toISOString()}`);
  console.log(`  attempted:          ${attempted}`);
  console.log(`  locations with series: ${updated}`);
  console.log(`  with bleaching:     ${withBleaching}`);
  console.log(`  skipped (non-reef): ${skippedNonReef}`);
  console.log(`  failed:             ${failures.length}`);

  if (failures.length > 0) {
    console.warn("\nFailures:");
    for (const f of failures) console.warn(`  - ${f.id}: ${f.reason}`);
  }

  const failureRate = attempted > 0 ? failures.length / attempted : 0;
  if (failureRate > FAILURE_THRESHOLD) {
    console.error(
      `\nFAIL: ${(failureRate * 100).toFixed(1)}% of locations failed — above ${FAILURE_THRESHOLD * 100}% threshold`,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
