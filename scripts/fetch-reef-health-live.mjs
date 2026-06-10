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

// NOAA CRW 5 km daily product, via the NOAA CoastWatch central ERDDAP.
//
// History: we used to hit coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW —
// one dataset holding all variables. NOAA deprecated it; it now 302-redirects
// to PacIOOS (pae-paha.pacioos.hawaii.edu), which is unreachable from GitHub's
// runners (UND_ERR_CONNECT_TIMEOUT on every call). The central CoastWatch node
// IS reachable, but it splits CRW into one dataset per variable, so we query
// three datasets per location and stitch them together.
const ERDDAP_BASE = "https://coastwatch.noaa.gov/erddap/griddap";

// One CRW variable per dataset on the central node. BAA here is the 7-day-max
// Bleaching Alert Area (the daily-current BAA isn't published separately on
// this node) — it drives the alert level and is the standard CRW alert metric.
const DATASETS = {
  baa: { id: "noaacrwbaa7dDaily", variable: "bleaching_alert_area" },
  dhw: { id: "noaacrwdhwDaily", variable: "degree_heating_week" },
  ssta: { id: "noaacrwsstanomalyDaily", variable: "sea_surface_temperature_anomaly" },
};

// Hard ceiling per request. Without this a hung/unreachable upstream lets the
// whole job stall for ~20 min before the failure threshold trips.
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 1;
const RETRY_PAUSE_MS = 1_500;

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
 * Query one CRW dataset for the nearest non-null cell to `lat`/`lng` within a
 * small box (so land-masked pixels fall through to a wet neighbour). Returns
 * { value, time, lat, lng } or null when every pixel in the box is masked.
 * Throws on network/HTTP failure so the caller can count it as a hard failure.
 */
async function fetchVar(dataset, lat, lng) {
  // Clamp the box to the grid's valid range — a point near a pole or the
  // antimeridian (e.g. Fiji at 179.89°E) would otherwise push lngMax past
  // 180° and ERDDAP answers 404.
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const latMin = clamp(lat - BOX_HALF_DEG, -90, 90).toFixed(4);
  const latMax = clamp(lat + BOX_HALF_DEG, -90, 90).toFixed(4);
  const lngMin = clamp(lng - BOX_HALF_DEG, -180, 180).toFixed(4);
  const lngMax = clamp(lng + BOX_HALF_DEG, -180, 180).toFixed(4);

  // ERDDAP griddap query: var[(time)][(latMin):1:(latMax)][(lngMin):1:(lngMax)]
  // "last" picks the most recent published timestep.
  const dims = `[(last)][(${latMin}):1:(${latMax})][(${lngMin}):1:(${lngMax})]`;
  const url = `${ERDDAP_BASE}/${dataset.id}.json?${encodeURI(dataset.variable + dims)}`;

  // ERDDAP under load returns transient 5xx; one retry after a short pause
  // keeps a busy-server moment from flaking an otherwise-healthy location.
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "scubaseason.fun reef-health ingest" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      // Surface the underlying cause — bare undici "fetch failed" hides whether
      // it was a timeout, DNS, TLS or connection reset.
      const cause = err?.cause?.code || err?.name || err?.message || String(err);
      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_PAUSE_MS);
        continue;
      }
      throw new Error(`request failed (${cause}) :: ${dataset.id}`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) {
      await sleep(RETRY_PAUSE_MS);
      continue;
    }
    break;
  }
  if (res.status >= 300 && res.status < 400) {
    throw new Error(`unexpected redirect ${res.status} → ${res.headers.get("location")} :: ${dataset.id} may have moved`);
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${dataset.id}`);
  }
  const json = await res.json();
  // griddap .json → { table: { columnNames: [time, latitude, longitude, <var>], rows: [...] } }
  const table = json?.table;
  if (!table?.rows?.length) return null;
  const cols = table.columnNames;
  const iTime = cols.indexOf("time");
  const iLat = cols.indexOf("latitude");
  const iLng = cols.indexOf("longitude");
  const iVal = cols.indexOf(dataset.variable);

  let best = null;
  let bestDist = Infinity;
  for (const row of table.rows) {
    const value = row[iVal];
    if (value == null) continue; // NaN/land mask comes back as null
    const d = (row[iLat] - lat) ** 2 + (row[iLng] - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = { value, time: row[iTime], lat: row[iLat], lng: row[iLng] };
    }
  }
  return best;
}

/**
 * Stitch the three per-variable CRW datasets into one reading for a point.
 * BAA is required (it sets the alert level); DHW and SSTA are best-effort and
 * fall back to defaults if their dataset has no wet pixel in the box.
 */
async function fetchPoint(lat, lng) {
  const baa = await fetchVar(DATASETS.baa, lat, lng);
  if (!baa) {
    throw new Error("no valid BAA pixel within bounding box (land-masked)");
  }
  await sleep(PACE_MS);
  const dhw = await fetchVar(DATASETS.dhw, lat, lng);
  await sleep(PACE_MS);
  const ssta = await fetchVar(DATASETS.ssta, lat, lng);

  return {
    time: baa.time,
    lat: baa.lat,
    lng: baa.lng,
    baa: Math.round(baa.value),
    dhw: dhw?.value,
    ssta: ssta?.value,
  };
}

function isoDay(iso) {
  // "2026-05-25T12:00:00Z" → "2026-05-25"
  return typeof iso === "string" ? iso.slice(0, 10) : iso;
}

async function main() {
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
