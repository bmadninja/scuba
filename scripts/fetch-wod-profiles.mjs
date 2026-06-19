#!/usr/bin/env node
/**
 * NOAA World Ocean Database (WOD) — subsurface temperature ingest.
 *
 * For every location in src/data/locations.json with lat/lng, query NCEI's
 * ERDDAP for nearby CTD profiles in the past five years.  Average the
 * temperature readings into 5 m depth bins (0–40 m), then estimate the
 * thermocline depth as the bin with the steepest temperature gradient.
 *
 * Writes (or overwrites) src/data/wod-thermocline.json — one record per
 * location.  The reef-health UI can read this file to show "warm to Xm,
 * cold below" alongside the existing SST / DHW data from NOAA CRW.
 *
 * Failure mode: leave any existing record untouched, warn, and continue.
 * Exit 1 only if more than 20% of attempted locations fail.
 *
 * No API key required.  NCEI asks for reasonable pacing — 500 ms between
 * requests.  Depth limit 50 m keeps response size small.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOC_PATH = path.join(ROOT, "src/data/locations.json");
const OUT_PATH = path.join(ROOT, "src/data/wod-thermocline.json");

// NCEI ERDDAP — WOD CTD dataset (Conductivity-Temperature-Depth casts).
// Dataset ID verified against https://www.ncei.noaa.gov/erddap/tabledap/
const ERDDAP_BASE = "https://www.ncei.noaa.gov/erddap/tabledap";
const DATASET_ID = "wod_CTD";

const DEPTH_MAX_M = 50;
const BIN_SIZE_M = 5;
const BOX_HALF_DEG = 1.0; // ±1° ≈ 111 km — wide enough to get profiles near small sites
const YEARS_BACK = 5;
const PACE_MS = 500;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_PAUSE_MS = 2_000;
const FAILURE_THRESHOLD = 0.2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query WOD CTD profiles in a bounding box for the past YEARS_BACK years.
 * Returns an array of { depth, temp } rows (raw, unprocessed).
 */
async function fetchProfiles(lat, lng) {
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const latMin = clamp(lat - BOX_HALF_DEG, -90, 90).toFixed(3);
  const latMax = clamp(lat + BOX_HALF_DEG, -90, 90).toFixed(3);
  const lngMin = clamp(lng - BOX_HALF_DEG, -180, 180).toFixed(3);
  const lngMax = clamp(lng + BOX_HALF_DEG, -180, 180).toFixed(3);

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = `${new Date().getFullYear() - YEARS_BACK}-01-01`;

  const constraints = [
    `latitude>=${latMin}`,
    `latitude<=${latMax}`,
    `longitude>=${lngMin}`,
    `longitude<=${lngMax}`,
    `depth<=${DEPTH_MAX_M}`,
    `time>=${startDate}`,
    `time<=${endDate}`,
    `Temperature!=NaN`,
  ].join("&");

  const url = `${ERDDAP_BASE}/${DATASET_ID}.json?depth,Temperature&${constraints}&orderBy("depth")`;

  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "scubaseason.fun wod-thermocline ingest",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || err?.message || String(err);
      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_PAUSE_MS * attempt);
        continue;
      }
      throw new Error(`request failed (${cause})`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) {
      await sleep(RETRY_PAUSE_MS * attempt);
      continue;
    }
    break;
  }

  if (!res.ok) {
    // 404 on ERDDAP often means no data in range, not a real error.
    if (res.status === 404) return [];
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const table = json?.table;
  if (!table?.rows?.length) return [];

  const cols = table.columnNames;
  const iDepth = cols.indexOf("depth");
  const iTemp = cols.indexOf("Temperature");

  return table.rows
    .filter((r) => r[iDepth] != null && r[iTemp] != null)
    .map((r) => ({ depth: r[iDepth], temp: r[iTemp] }));
}

/**
 * Bin raw depth/temp pairs into BIN_SIZE_M metre bins, average each bin.
 * Returns an array of { binDepth, avgTemp } sorted shallow-to-deep.
 */
function binProfiles(rows) {
  const bins = new Map(); // binDepth (m) → [temps]
  for (const { depth, temp } of rows) {
    const bin = Math.floor(depth / BIN_SIZE_M) * BIN_SIZE_M;
    if (!bins.has(bin)) bins.set(bin, []);
    bins.get(bin).push(temp);
  }
  return Array.from(bins.entries())
    .sort(([a], [b]) => a - b)
    .map(([binDepth, temps]) => ({
      binDepth,
      avgTemp: Math.round((temps.reduce((s, t) => s + t, 0) / temps.length) * 10) / 10,
    }));
}

/**
 * Estimate thermocline depth as the bin where dT/dz is steepest (most negative).
 * Returns null if there are fewer than two bins.
 */
function estimateThermocline(binnedProfile) {
  if (binnedProfile.length < 2) return null;
  let maxGrad = 0;
  let thermoclineDepth = null;
  for (let i = 1; i < binnedProfile.length; i++) {
    const dTemp = binnedProfile[i - 1].avgTemp - binnedProfile[i].avgTemp; // positive = cooling with depth
    const dDepth = binnedProfile[i].binDepth - binnedProfile[i - 1].binDepth;
    const grad = dDepth > 0 ? dTemp / dDepth : 0;
    if (grad > maxGrad) {
      maxGrad = grad;
      thermoclineDepth = binnedProfile[i - 1].binDepth;
    }
  }
  return thermoclineDepth;
}

async function main() {
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));

  // Load existing output so we can preserve records for skipped/failed locations.
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  } catch {
    // File doesn't exist yet — start fresh.
  }
  const byLocationId = new Map(existing.map((r) => [r.locationId, r]));

  const fetchedAt = new Date().toISOString();
  const startDate = `${new Date().getFullYear() - YEARS_BACK}-01-01`;
  const endDate = fetchedAt.slice(0, 10);

  let attempted = 0;
  let updated = 0;
  let skipped = 0;
  const failures = [];

  for (const loc of locations) {
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      skipped += 1;
      continue;
    }
    attempted += 1;

    try {
      const rows = await fetchProfiles(loc.lat, loc.lng);
      if (rows.length === 0) {
        console.log(`  ${loc.id.padEnd(40)} → no profiles in range (skipped)`);
        skipped += 1;
        attempted -= 1;
        await sleep(PACE_MS);
        continue;
      }

      const profile = binProfiles(rows);
      const thermoclineDepthM = estimateThermocline(profile);
      const surface = profile[0];
      const at10m = profile.find((b) => b.binDepth === 10);
      const at20m = profile.find((b) => b.binDepth === 20);
      const at30m = profile.find((b) => b.binDepth === 30);

      const record = {
        locationId: loc.id,
        thermoclineDepthM,
        tempAtSurfaceC: surface?.avgTemp ?? null,
        tempAt10mC: at10m?.avgTemp ?? null,
        tempAt20mC: at20m?.avgTemp ?? null,
        tempAt30mC: at30m?.avgTemp ?? null,
        profileCount: rows.length,
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        sourceId: "noaa-wod",
        fetchedAt,
      };

      byLocationId.set(loc.id, record);
      updated += 1;
      console.log(
        `  ${loc.id.padEnd(40)} → thermocline ~${thermoclineDepthM ?? "?"}m  surf=${surface?.avgTemp ?? "?"}°C  profiles=${rows.length}`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }

    await sleep(PACE_MS);
  }

  const output = Array.from(byLocationId.values());
  await fs.writeFile(OUT_PATH, JSON.stringify(output, null, 2) + "\n");

  console.log("");
  console.log(`NOAA WOD ingest complete @ ${fetchedAt}`);
  console.log(`  attempted: ${attempted}`);
  console.log(`  updated:   ${updated}`);
  console.log(`  failed:    ${failures.length}`);
  console.log(`  skipped:   ${skipped} (no coords or no profiles in range)`);

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
