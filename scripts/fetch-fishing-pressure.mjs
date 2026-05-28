#!/usr/bin/env node
/**
 * Wave v2.1 — Global Fishing Watch apparent-fishing-effort ingest.
 *
 * For every location in src/data/locations.json with lat/lng, query the
 * GFW 4Wings API for apparent fishing hours within RADIUS_KM, for the
 * current year and 4 years ago (for trend). Writes to
 * src/data/fishing-pressure.json.
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
 * Pace: 3s between locations (each does 2 API calls; keeps under GFW free tier).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOC_PATH = path.join(ROOT, "src/data/locations.json");
const OUT_PATH = path.join(ROOT, "src/data/fishing-pressure.json");

const TOKEN = process.env.GFW_API_TOKEN;
const RADIUS_KM = 50;
// Each location makes 2 API calls (current + baseline year). 3s between
// locations keeps us under ~40 req/min on the GFW free tier.
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
  const fetchedAt = now.toISOString();

  const records = [];
  let attempted = 0;
  let succeeded = 0;
  const failures = [];

  for (const loc of locations) {
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") continue;
    attempted += 1;
    try {
      const currentHours = await reportHours(loc.lat, loc.lng, currentYear);
      await sleep(PACE_MS);
      let historical;
      try {
        const baselineHours = await reportHours(
          loc.lat,
          loc.lng,
          baselineYear,
        );
        historical = { year: baselineYear, fishingHours: baselineHours };
      } catch {
        historical = undefined;
      }
      records.push({
        locationId: loc.id,
        radiusKm: RADIUS_KM,
        current: { year: currentYear, fishingHours: currentHours },
        ...(historical ? { historical } : {}),
        fetchedAt,
        source: "global-fishing-watch",
      });
      succeeded += 1;
      console.log(
        `  ${loc.id.padEnd(40)} → ${currentHours}h (${currentYear})${
          historical ? `, ${historical.fishingHours}h (${historical.year})` : ""
        }`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
    await sleep(PACE_MS);
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
  console.log(`  attempted: ${attempted}`);
  console.log(`  succeeded: ${succeeded}`);
  console.log(`  failed:    ${failures.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
