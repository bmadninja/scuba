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

const ERDDAP_BASE =
  "https://coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW.json";

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
 * Query ERDDAP for the most recent valid (non-NaN) cell within a small
 * box around `lat`/`lng`. We request the last 24 hours of data — the
 * product publishes once per day — and ask for all four variables on a
 * tiny lat/lng box so land-masked pixels can fall through to a neighbour.
 */
async function fetchPoint(lat, lng) {
  const latMin = (lat - BOX_HALF_DEG).toFixed(4);
  const latMax = (lat + BOX_HALF_DEG).toFixed(4);
  const lngMin = (lng - BOX_HALF_DEG).toFixed(4);
  const lngMax = (lng + BOX_HALF_DEG).toFixed(4);

  // ERDDAP griddap query syntax: var[(timeStart):1:(timeEnd)][(latMin):1:(latMax)][(lngMin):1:(lngMax)]
  // "last" picks the most recent published timestep.
  const dims = `[(last)][(${latMin}):1:(${latMax})][(${lngMin}):1:(${lngMax})]`;
  const query = `CRW_BAA${dims},CRW_DHW${dims},CRW_SSTANOMALY${dims}`;
  const url = `${ERDDAP_BASE}?${query}`;

  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "scubaseason.fun reef-health ingest" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${url}`);
  }
  const json = await res.json();
  // ERDDAP responds in tabledap-style for griddap .json:
  // { table: { columnNames: [...], columnTypes: [...], rows: [[time, lat, lng, baa, dhw, ssta], ...] } }
  const table = json?.table;
  if (!table?.rows?.length) {
    throw new Error("empty response");
  }
  const cols = table.columnNames;
  const iTime = cols.indexOf("time");
  const iLat = cols.indexOf("latitude");
  const iLng = cols.indexOf("longitude");
  const iBaa = cols.indexOf("CRW_BAA");
  const iDhw = cols.indexOf("CRW_DHW");
  const iSsta = cols.indexOf("CRW_SSTANOMALY");

  // Pick the cell nearest (lat, lng) that has a non-null BAA. NaN comes
  // back as null in JSON; land pixels have null for all reef variables.
  let best = null;
  let bestDist = Infinity;
  for (const row of table.rows) {
    const baa = row[iBaa];
    if (baa == null) continue;
    const cellLat = row[iLat];
    const cellLng = row[iLng];
    const d = (cellLat - lat) ** 2 + (cellLng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = {
        time: row[iTime],
        lat: cellLat,
        lng: cellLng,
        baa: Math.round(baa),
        dhw: row[iDhw],
        ssta: row[iSsta],
      };
    }
  }
  if (!best) {
    throw new Error("no valid pixel within bounding box (land-masked)");
  }
  return best;
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
