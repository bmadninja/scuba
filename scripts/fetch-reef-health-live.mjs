#!/usr/bin/env node
/**
 * Wave v2.0 — NOAA Coral Reef Watch live ingest.
 *
 * For every location in src/data/locations.json with lat/lng, query NOAA
 * CRW's public ERDDAP endpoint for the latest CRW_BAA / CRW_DHW /
 * CRW_SSTANOMALY at that point. Map the BAA integer (0–4) to the alert
 * string used elsewhere in the site, and overwrite ONLY the
 * `thermalStress` block on the matching reef-health record.
 *
 * Preserved as-is: observed.*, divingOutlook, methodologyClaimIds,
 * lastReviewedAt — those are scaffolding/snapshot data and stay until a
 * later wave brings real survey ingestion online.
 *
 * Failure mode: leave the existing thermalStress value untouched, log a
 * warning, and exit 0 — unless more than 20% of attempts failed.
 *
 * No API key. Public domain. Pace 250ms between requests.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOC_PATH = path.join(ROOT, "src/data/locations.json");
const RH_PATH = path.join(ROOT, "src/data/reef-health.json");

// NOAA CRW 5 km daily product, via PacIOOS ERDDAP (pae-paha.pacioos.hawaii.edu).
//
// History:
//   v1: coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW — deprecated, now
//       302-redirects to PacIOOS.
//   v2: coastwatch.noaa.gov/erddap/griddap/noaacrwbaa7dDaily (+ dhw + ssta) —
//       three separate datasets per variable. Broke 2026-06-16: all three
//       dataset IDs returned 404 ("Currently unknown datasetID").
//   v3 (current): PacIOOS dhw_5km — all CRW variables in one dataset, and
//       PacIOOS connectivity from GitHub Actions runners is confirmed working.
const ERDDAP_BASE = "https://pae-paha.pacioos.hawaii.edu/erddap/griddap";
const DATASET_ID = "dhw_5km";

// PacIOOS variable names (differ from the deprecated coastwatch.noaa.gov names).
const VARS = {
  baa: "CRW_BAA_7D_MAX",
  dhw: "CRW_DHW",
  ssta: "CRW_SSTANOMALY",
};

// Hard ceiling per request. Without this a hung/unreachable upstream lets the
// whole job stall for ~20 min before the failure threshold trips.
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const RETRY_PAUSE_MS = 2_000; // doubles each attempt: 2s, 4s, 8s

const BAA_TO_ALERT = {
  0: "no-stress",
  1: "watch",
  2: "warning",
  3: "alert-1",
  4: "alert-2",
};

const ALERT_TO_DHW_DEFAULT = {
  "no-stress": 0.3,
  watch: 1.5,
  warning: 3.0,
  "alert-1": 6.0,
  "alert-2": 8.5,
};

// Half-width of the bounding box (degrees) used as a land-mask fallback
// region. ~0.15° ≈ 16 km, ~3 cells either side of the requested point on
// the 5 km grid.
const BOX_HALF_DEG = 0.15;
const PACE_MS = 250;
const FAILURE_THRESHOLD = 0.2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Query PacIOOS dhw_5km for all three CRW variables in a single request for
 * the nearest non-null cell to `lat`/`lng` within a small bounding box (so
 * land-masked pixels fall through to a wet neighbour).
 * Returns { time, lat, lng, baa, dhw, ssta } or throws on network/HTTP failure.
 */
async function fetchPoint(lat, lng) {
  // Clamp the box to the grid's valid range — a point near the antimeridian
  // (e.g. Fiji at 179.89°E) would otherwise push lngMax past 180° and ERDDAP 404s.
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const latMin = clamp(lat - BOX_HALF_DEG, -90, 90).toFixed(4);
  const latMax = clamp(lat + BOX_HALF_DEG, -90, 90).toFixed(4);
  const lngMin = clamp(lng - BOX_HALF_DEG, -180, 180).toFixed(4);
  const lngMax = clamp(lng + BOX_HALF_DEG, -180, 180).toFixed(4);

  const dims = `[(last)][(${latMin}):1:(${latMax})][(${lngMin}):1:(${lngMax})]`;
  const varList = `${VARS.baa}${dims},${VARS.dhw}${dims},${VARS.ssta}${dims}`;
  const url = `${ERDDAP_BASE}/${DATASET_ID}.json?${encodeURI(varList)}`;

  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "scubaseason.fun reef-health ingest" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || err?.message || String(err);
      if (attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS * (2 ** (attempt - 1))); continue; }
      throw new Error(`request failed (${cause})`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS * (2 ** (attempt - 1))); continue; }
    break;
  }
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`unexpected redirect ${res.status} → ${res.headers.get("location")} :: dataset may have moved`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const table = json?.table;
  if (!table?.rows?.length) throw new Error("no valid pixel within bounding box (land-masked)");

  const cols = table.columnNames;
  const iTime = cols.indexOf("time");
  const iLat  = cols.indexOf("latitude");
  const iLng  = cols.indexOf("longitude");
  const iBaa  = cols.indexOf(VARS.baa);
  const iDhw  = cols.indexOf(VARS.dhw);
  const iSsta = cols.indexOf(VARS.ssta);

  let best = null;
  let bestDist = Infinity;
  for (const row of table.rows) {
    if (row[iBaa] == null) continue; // land-masked
    const d = (row[iLat] - lat) ** 2 + (row[iLng] - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = {
        time: row[iTime],
        lat: row[iLat],
        lng: row[iLng],
        baa: Math.round(row[iBaa]),
        dhw: row[iDhw],
        ssta: row[iSsta],
      };
    }
  }
  if (!best) throw new Error("no valid BAA pixel within bounding box (land-masked)");
  return best;
}

function isoDay(iso) {
  // "2026-05-25T12:00:00Z" → "2026-05-25"
  return typeof iso === "string" ? iso.slice(0, 10) : iso;
}

async function preflight() {
  // Quick reachability check before committing to 113 locations.
  // If PacIOOS is completely unreachable, exit 0 (no-op) rather than
  // grinding through MAX_RETRIES × timeout per location for 2+ hours.
  const testUrl = `${ERDDAP_BASE}/${DATASET_ID}.das`;
  try {
    const res = await fetch(testUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "scubaseason.fun reef-health ingest" },
    });
    if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    const cause = err?.cause?.code || err?.name || err?.message || String(err);
    console.warn(`NOAA CRW preflight failed (${cause}) — skipping run, data unchanged.`);
    process.exit(0);
  }
}

async function main() {
  await preflight();
  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  const reefHealth = JSON.parse(await fs.readFile(RH_PATH, "utf8"));
  const byLocationId = new Map();
  for (const r of reefHealth) {
    if (r.locationId) byLocationId.set(r.locationId, r);
  }

  const fetchedAt = new Date().toISOString();
  let attempted = 0;
  let updated = 0;
  let skipped = 0;
  const failures = [];

  for (const loc of locations) {
    const record = byLocationId.get(loc.id);
    if (!record) continue; // no reef-health row to update
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      skipped += 1;
      continue;
    }
    attempted += 1;
    try {
      const cell = await fetchPoint(loc.lat, loc.lng);
      const alert = BAA_TO_ALERT[cell.baa];
      if (!alert) {
        failures.push({ id: loc.id, reason: `unknown BAA ${cell.baa}` });
        continue;
      }
      const dhw =
        typeof cell.dhw === "number" && Number.isFinite(cell.dhw)
          ? Math.round(cell.dhw * 10) / 10
          : ALERT_TO_DHW_DEFAULT[alert];
      const ssta =
        typeof cell.ssta === "number" && Number.isFinite(cell.ssta)
          ? Math.round(cell.ssta * 10) / 10
          : undefined;

      const prev = record.thermalStress ?? { sourceIds: ["noaa-crw"] };
      record.thermalStress = {
        ...prev,
        asOf: isoDay(cell.time),
        alertLevel: alert,
        degreeHeatingWeeks: dhw,
        ...(ssta !== undefined ? { sstAnomalyC: ssta } : {}),
        sourceIds: Array.from(new Set([...(prev.sourceIds ?? []), "noaa-crw"])),
        source: "noaa-crw-live",
        fetchedAt,
      };
      updated += 1;
      console.log(
        `  ${loc.id.padEnd(40)} → ${alert.padEnd(9)} DHW=${String(dhw).padEnd(4)} SSTA=${ssta ?? "—"}  (cell ${cell.lat.toFixed(3)},${cell.lng.toFixed(3)})`,
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
    await sleep(PACE_MS);
  }

  await fs.writeFile(RH_PATH, JSON.stringify(reefHealth, null, 2) + "\n");

  console.log("");
  console.log(`NOAA CRW ingest complete @ ${fetchedAt}`);
  console.log(`  attempted: ${attempted}`);
  console.log(`  updated:   ${updated}`);
  console.log(`  failed:    ${failures.length}`);
  console.log(`  skipped:   ${skipped} (no lat/lng)`);

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
