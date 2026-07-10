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
 * It ALSO pulls, from the same provider, a monthly sea-surface-temperature
 * history (CRW CoralTemp monthly, `CRW_sst_v3_1_monthly` on the OceanWatch
 * ERDDAP) and derives, per location:
 *   - `sstSeries`: compact [{ month: "YYYY-MM", sstC }] over the trailing
 *     10 whole years (monthly cadence keeps reef-health.json bounded)
 *   - `sstCurrentC`: the most recent monthly SST
 *   - `sstClimatologyC`: the usual SST for the current season (the mean of
 *     the current calendar month across that window)
 * These feed the "water temperature over time" chart and the Heat modal's
 * "around X°C now vs the usual Z°C" line. They are SHOWN, NOT SCORED —
 * reef state (see src/lib/data/reef-state.ts) still reads coral condition
 * and the bleaching alert only; a warming trend never moves a verdict.
 *
 * The monthly enrichment is additive and best-effort: a failure to fetch it
 * for a location leaves any prior SST fields intact, logs a warning, and is
 * NOT counted toward the run's failure threshold — so the daily BAA/DHW/
 * anomaly logic and its failure mode below are wholly undisturbed.
 *
 * Preserved as-is: observed.*, divingOutlook, methodologyClaimIds,
 * lastReviewedAt — those are scaffolding/snapshot data and stay until a
 * later wave brings real survey ingestion online.
 *
 * Failure mode (daily read): leave the existing thermalStress value
 * untouched, log a warning, and exit 0 — unless more than 20% of attempts
 * failed.
 *
 * Flags:
 *   --sst-only   Only add/refresh the monthly SST fields; do NOT touch the
 *                latest-day alertLevel/DHW/anomaly. Used to backfill the
 *                temperature history without disturbing the live daily read
 *                (and so keep reef-state verdicts byte-identical).
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

// ── Monthly SST history (NOAA CRW CoralTemp monthly) ─────────────────────────
// A different grid from the daily product above: 0.05° resolution, longitude on
// a 0–360° axis (NOT −180–180), and the variable is `sea_surface_temperature`
// in °C. Verified reachable + 1985→present on 2026-07-10.
const MONTHLY_BASE = "https://oceanwatch.pifsc.noaa.gov/erddap/griddap";
const MONTHLY_DATASET = "CRW_sst_v3_1_monthly";
const MONTHLY_VAR = "sea_surface_temperature";
// Trailing window stored per location. 120 months = 10 whole years — enough to
// read warming-vs-stable, small enough to keep the JSON bounded, and a fixed
// per-location cap regardless of how far back the dataset runs.
const SERIES_MONTHS = 120;

// This dataset's longitude axis is 0–360°; site coords are −180–180.
function toLng360(lng) {
  return ((lng % 360) + 360) % 360;
}

// Minimal retrying JSON GET for the monthly ERDDAP, mirroring fetchPoint's
// network handling. Kept separate so the monthly path can never alter the
// daily read's control flow or failure accounting.
async function monthlyFetchJson(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
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
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.json();
  }
}

/**
 * Fetch the trailing monthly SST series for the wet cell nearest `lat`/`lng`.
 * Two requests: (1) latest month over a small box to locate a non-land cell,
 * (2) the trailing SERIES_MONTHS at that fixed cell. Returns
 * `{ months: [{ month, sstC }], cell: { lat, lng } }`, contiguous month by
 * month (a masked/gap month carries `sstC: null` so the index stays aligned),
 * or throws.
 */
async function fetchMonthlySeries(lat, lng) {
  const lng360 = toLng360(lng);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const latMin = clamp(lat - BOX_HALF_DEG, -89.97, 89.97).toFixed(4);
  const latMax = clamp(lat + BOX_HALF_DEG, -89.97, 89.97).toFixed(4);
  const lngMin = clamp(lng360 - BOX_HALF_DEG, 0.03, 359.97).toFixed(4);
  const lngMax = clamp(lng360 + BOX_HALF_DEG, 0.03, 359.97).toFixed(4);

  // 1) Locate the nearest wet cell from the most recent month.
  const boxDims = `[(last)][(${latMin}):1:(${latMax})][(${lngMin}):1:(${lngMax})]`;
  const boxUrl = `${MONTHLY_BASE}/${MONTHLY_DATASET}.json?${encodeURI(MONTHLY_VAR + boxDims)}`;
  const boxJson = await monthlyFetchJson(boxUrl);
  const bt = boxJson?.table;
  if (!bt?.rows?.length) throw new Error("no monthly pixel within bounding box (land-masked)");
  const bc = bt.columnNames;
  const biLat = bc.indexOf("latitude");
  const biLng = bc.indexOf("longitude");
  const biVal = bc.indexOf(MONTHLY_VAR);
  let cell = null;
  let bestDist = Infinity;
  for (const row of bt.rows) {
    if (row[biVal] == null) continue; // land-masked
    const d = (row[biLat] - lat) ** 2 + (row[biLng] - lng360) ** 2;
    if (d < bestDist) { bestDist = d; cell = { lat: row[biLat], lng: row[biLng] }; }
  }
  if (!cell) throw new Error("no wet monthly pixel within bounding box");

  await sleep(PACE_MS);

  // 2) Pull the trailing window at that fixed cell. Index arithmetic
  //    (`last-N:1:last`) gives exactly SERIES_MONTHS points and never 404s on
  //    an out-of-range date the way an explicit end-date can.
  const serDims = `[last-${SERIES_MONTHS - 1}:1:last][(${cell.lat})][(${cell.lng})]`;
  const serUrl = `${MONTHLY_BASE}/${MONTHLY_DATASET}.json?${encodeURI(MONTHLY_VAR + serDims)}`;
  const serJson = await monthlyFetchJson(serUrl);
  const st = serJson?.table;
  if (!st?.rows?.length) throw new Error("empty monthly series");
  const sc = st.columnNames;
  const siTime = sc.indexOf("time");
  const siVal = sc.indexOf(MONTHLY_VAR);
  const months = [];
  for (const row of st.rows) {
    const v = row[siVal];
    months.push({
      month: String(row[siTime]).slice(0, 7),
      sstC: typeof v === "number" && Number.isFinite(v) ? Math.round(v * 10) / 10 : null,
    });
  }
  if (months.filter((m) => m.sstC !== null).length < 2) throw new Error("monthly series too short");
  return { months, cell };
}

/**
 * Compact the contiguous monthly array into the stored shape
 * `{ start: "YYYY-MM", monthlyC: [n | null, …] }` — a start month plus one
 * value per following month. Far smaller than an array of {month, sstC}
 * objects while keeping full monthly fidelity (index i ⇒ start + i months).
 */
function compactSeries(months) {
  return { start: months[0].month, monthlyC: months.map((m) => m.sstC) };
}

/**
 * Derive the scalars the Heat modal needs from a monthly series:
 *   - sstCurrentC: the most recent monthly value
 *   - sstClimatologyC: the "usual for the season" — the mean of the current
 *     calendar month across the stored window
 */
function summariseSeries(months) {
  const observed = months.filter((m) => m.sstC !== null);
  const last = observed[observed.length - 1];
  const mm = last.month.slice(5, 7); // "06"
  const sameMonth = observed.filter((m) => m.month.slice(5, 7) === mm).map((m) => m.sstC);
  const climatology = sameMonth.reduce((a, b) => a + b, 0) / sameMonth.length;
  return {
    sstCurrentC: last.sstC,
    sstClimatologyC: Math.round(climatology * 10) / 10,
  };
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
  // --sst-only: refresh just the monthly SST fields, leaving the latest-day
  // alertLevel/DHW/anomaly (and reef-state verdicts) exactly as they are.
  const sstOnly = process.argv.includes("--sst-only");

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
  // Monthly SST is tracked separately and NEVER gates the exit code — see
  // the failure-mode note in the header.
  let sstUpdated = 0;
  const sstFailures = [];

  for (const loc of locations) {
    const record = byLocationId.get(loc.id);
    if (!record) continue; // no reef-health row to update
    if (typeof loc.lat !== "number" || typeof loc.lng !== "number") {
      skipped += 1;
      continue;
    }
    attempted += 1;

    // Monthly SST enrichment — additive, best-effort, and NON-gating. Runs in
    // both modes; a failure here never counts toward the daily failure rate.
    let sstFields = null;
    try {
      const monthly = await fetchMonthlySeries(loc.lat, loc.lng);
      sstFields = { sstSeries: compactSeries(monthly.months), ...summariseSeries(monthly.months) };
      sstUpdated += 1;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      sstFailures.push({ id: loc.id, reason });
      console.warn(`  ~ ${loc.id}: monthly SST unavailable (${reason})`);
    }

    // --sst-only: write just the SST fields, leaving the daily read untouched.
    if (sstOnly) {
      if (sstFields) {
        const prev = record.thermalStress ?? { sourceIds: ["noaa-crw"] };
        record.thermalStress = { ...prev, ...sstFields };
        console.log(
          `  ${loc.id.padEnd(40)} → SST now=${sstFields.sstCurrentC}°C usual=${sstFields.sstClimatologyC}°C (${sstFields.sstSeries.monthlyC.length} mo)`,
        );
      }
      await sleep(PACE_MS);
      continue;
    }

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
        ...(sstFields ?? {}),
        sourceIds: Array.from(new Set([...(prev.sourceIds ?? []), "noaa-crw"])),
        source: "noaa-crw-live",
        fetchedAt,
      };
      updated += 1;
      console.log(
        `  ${loc.id.padEnd(40)} → ${alert.padEnd(9)} DHW=${String(dhw).padEnd(4)} SSTA=${ssta ?? "—"}${sstFields ? ` SST=${sstFields.sstCurrentC}°C` : ""}  (cell ${cell.lat.toFixed(3)},${cell.lng.toFixed(3)})`,
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
  console.log(`NOAA CRW ingest complete @ ${fetchedAt}${sstOnly ? " (--sst-only)" : ""}`);
  console.log(`  attempted:   ${attempted}`);
  if (!sstOnly) {
    console.log(`  updated:     ${updated}`);
    console.log(`  failed:      ${failures.length}`);
  }
  console.log(`  sst updated: ${sstUpdated}`);
  console.log(`  sst failed:  ${sstFailures.length} (non-gating)`);
  console.log(`  skipped:     ${skipped} (no lat/lng)`);

  // Monthly SST never gates the run. In --sst-only mode there is no daily read,
  // so there is nothing to threshold — exit 0.
  if (sstOnly) return;

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
