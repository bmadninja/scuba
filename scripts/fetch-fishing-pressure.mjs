#!/usr/bin/env node
/**
 * Wave v2.2 — Global Fishing Watch apparent-fishing-effort ingest.
 *
 * For every location in src/data/locations.json with lat/lng, query the
 * GFW 4Wings API for apparent fishing hours within RADIUS_KM, one call per
 * year across a SERIES_YEARS window, and write the full per-year series to
 * src/data/fishing-pressure.json. The series powers a display-only
 * effort-trend sparkline on each location page; a falling trend near a
 * protected reef is a "pressure easing" signal (context, not proof of
 * enforcement). `current` (latest year) and `historical` (4 years back) are
 * kept alongside it for the effort band and reef-state model.
 *
 * Incremental: years already on file are reused, and only missing years plus
 * the latest ALWAYS_REFRESH years (which GFW may still revise) are re-fetched.
 * So the first run backfills the whole window and steady-state runs make just
 * a couple of calls per location.
 *
 *   docs:   https://globalfishingwatch.org/our-apis/documentation
 *   token:  register at https://globalfishingwatch.org/our-apis/ for a
 *           free non-commercial token and set GFW_API_TOKEN in
 *           .env.local (gitignored).
 *
 * If GFW_API_TOKEN is unset, the script logs a warning and exits 0 —
 * it does NOT modify fishing-pressure.json. This lets `npm run build`
 * succeed without credentials.
 *
 * Pace: 3s between API calls; keeps well under the GFW free-tier rate limit.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOC_PATH = path.join(ROOT, "src/data/locations.json");
const OUT_PATH = path.join(ROOT, "src/data/fishing-pressure.json");

const TOKEN = process.env.GFW_API_TOKEN;
const RADIUS_KM = 50;
// Length of the effort-trend window, in years (override with GFW_SERIES_YEARS).
const SERIES_YEARS = Number(process.env.GFW_SERIES_YEARS) || 6;
// The latest N years are always re-fetched — GFW revises recent years as more
// AIS data lands. Earlier years, once on file, are treated as final.
const ALWAYS_REFRESH = 2;
// 3s between API calls keeps us under ~40 req/min on the GFW free tier.
const PACE_MS = 3000;
// GFW 4Wings dataset for apparent fishing effort.
const DATASET = "public-global-fishing-effort:latest";
const API_BASE = "https://gateway.api.globalfishingwatch.org/v3/4wings/report";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Build a square bounding-box GeoJSON Polygon (close to RADIUS_KM
// half-width). GFW 4Wings reports accept a raw Polygon under `geojson`,
// not a Feature.
function bboxPolygon(lat, lng, radiusKm) {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const minLng = lng - dLng;
  const maxLng = lng + dLng;
  return {
    type: "Polygon",
    coordinates: [
      [
        [minLng, minLat],
        [maxLng, minLat],
        [maxLng, maxLat],
        [minLng, maxLat],
        [minLng, minLat],
      ],
    ],
  };
}

async function reportHours(lat, lng, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const params = new URLSearchParams({
    "spatial-resolution": "LOW",
    "temporal-resolution": "YEARLY",
    "datasets[0]": DATASET,
    "date-range": `${startDate},${endDate}`,
    format: "JSON",
  });
  const url = `${API_BASE}?${params.toString()}`;
  const body = {
    geojson: bboxPolygon(lat, lng, RADIUS_KM),
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  // Response shape: { entries: [{ <datasetKey>: [{ hours|value, ... }] }] }
  // The datasetKey can resolve to a versioned slug even if we requested
  // ":latest", so pick the first key on the first entry rather than
  // matching by literal slug.
  const firstEntry = json?.entries?.[0] ?? {};
  const rows = Object.values(firstEntry).flat().filter(Boolean);
  let hours = 0;
  for (const e of rows) hours += Number(e?.hours ?? e?.value ?? 0) || 0;
  return Math.round(hours);
}

async function main() {
  if (!TOKEN) {
    console.warn(
      "GFW_API_TOKEN not set — skipping fishing-pressure ingest.\n" +
        "  Register at https://globalfishingwatch.org/our-apis/ and add\n" +
        "  GFW_API_TOKEN=... to .env.local to enable.",
    );
    return;
  }

  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  const existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  const now = new Date();
  const currentYear = now.getUTCFullYear() - 1; // last fully published year
  const baselineYear = currentYear - 4;
  const startYear = currentYear - (SERIES_YEARS - 1);
  const windowYears = [];
  for (let y = startYear; y <= currentYear; y += 1) windowYears.push(y);
  const fetchedAt = now.toISOString();

  // Prior per-year values, so we only re-fetch what we must.
  const prevByLoc = new Map((existing.records ?? []).map((r) => [r.locationId, r]));

  const records = [];
  let attempted = 0;
  let succeeded = 0;
  let apiCalls = 0;
  const failures = [];

  for (const loc of locations) {
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") continue;
    attempted += 1;

    // Seed from what we already have (series + the legacy current/historical
    // points), keeping only years inside the current window.
    const seriesMap = new Map();
    const prev = prevByLoc.get(loc.id);
    if (prev) {
      for (const p of prev.series ?? []) seriesMap.set(p.year, p.fishingHours);
      if (prev.historical) seriesMap.set(prev.historical.year, prev.historical.fishingHours);
      if (prev.current) seriesMap.set(prev.current.year, prev.current.fishingHours);
    }
    for (const y of [...seriesMap.keys()]) {
      if (y < startYear || y > currentYear) seriesMap.delete(y);
    }

    // Fetch missing years, and always re-fetch the latest ALWAYS_REFRESH years.
    const toFetch = windowYears.filter(
      (y) => !seriesMap.has(y) || y > currentYear - ALWAYS_REFRESH,
    );

    try {
      for (const y of toFetch) {
        try {
          const hours = await reportHours(loc.lat, loc.lng, y);
          apiCalls += 1;
          seriesMap.set(y, hours);
          await sleep(PACE_MS);
        } catch (err) {
          // The latest year is required; anything older can be skipped so a
          // single bad year does not drop the whole location.
          if (y === currentYear) throw err;
          console.warn(`    · ${loc.id} ${y}: ${err instanceof Error ? err.message : err}`);
        }
      }

      if (!seriesMap.has(currentYear)) {
        throw new Error(`no ${currentYear} value`);
      }

      const series = [...seriesMap.entries()]
        .map(([year, fishingHours]) => ({ year, fishingHours }))
        .sort((a, b) => a.year - b.year);
      const current = { year: currentYear, fishingHours: seriesMap.get(currentYear) };
      const historical = seriesMap.has(baselineYear)
        ? { year: baselineYear, fishingHours: seriesMap.get(baselineYear) }
        : { year: series[0].year, fishingHours: series[0].fishingHours };

      records.push({
        locationId: loc.id,
        radiusKm: RADIUS_KM,
        current,
        historical,
        series,
        fetchedAt,
        source: "global-fishing-watch",
      });
      succeeded += 1;
      console.log(
        `  ${loc.id.padEnd(40)} → ${series
          .map((p) => `${p.fishingHours}h(${p.year})`)
          .join(" ")}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
  }

  const out = {
    ...existing,
    lastBuiltAt: fetchedAt.slice(0, 10),
    radiusKm: RADIUS_KM,
    records,
  };
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("");
  console.log(`GFW fishing-pressure ingest complete @ ${fetchedAt}`);
  console.log(`  window:    ${startYear}–${currentYear} (${SERIES_YEARS}y)`);
  console.log(`  attempted: ${attempted}`);
  console.log(`  succeeded: ${succeeded}`);
  console.log(`  failed:    ${failures.length}`);
  console.log(`  api calls: ${apiCalls}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
