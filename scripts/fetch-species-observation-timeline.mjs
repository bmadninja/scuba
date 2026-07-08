#!/usr/bin/env node
/**
 * Species observation timeline ingest (iNaturalist).
 *
 * Turns the static "N species recorded" stat into a real, dated, growing
 * record. For each location it calls the iNaturalist observations histogram
 * (yearly buckets, research-grade, within the location radius) and stores the
 * per-year count of research-grade observations. The reef card renders this as
 * a cumulative accumulation line: the scientific record of this reef growing
 * over time.
 *
 * Every point is a real dated count from iNaturalist — nothing is modelled.
 *
 * Endpoint: /v1/observations/histogram (public, no key). Radius reuses the same
 * value species-diversity.json used for the location, else DEFAULT_RADIUS_KM.
 *
 * Idempotent + resumable: a location refreshed within --max-age-days is skipped
 * unless --force. Per-request retry honours iNaturalist's Retry-After on 429.
 *
 * Flags: --dry-run, --limit N, --force, --max-age-days N, --radius KM.
 * License: iNaturalist research-grade observation metadata, CC-attributed.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUT_PATH = path.join(ROOT, "src/data/species-observation-timeline.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const DIVERSITY_PATH = path.join(ROOT, "src/data/species-diversity.json");

const INAT_HISTOGRAM = "https://api.inaturalist.org/v1/observations/histogram";
const DEFAULT_RADIUS_KM = 30;
const PACE_MS = 1200;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 3;
const FAILURE_THRESHOLD = 0.25;
// Ignore years before this: iNaturalist has sparse, unreliable early records and
// the growth story lives in the last ~15 years.
const MIN_YEAR = 2010;

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const LIMIT = numArg("--limit", Infinity);
const MAX_AGE_DAYS = numArg("--max-age-days", 30);
const RADIUS_OVERRIDE = numArg("--radius", null);

function numArg(flag, dflt) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? Number(args[i + 1]) : dflt;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function daysBetween(a, b) {
  return Math.abs(new Date(a) - new Date(b)) / 86_400_000;
}

async function fetchHistogram(lat, lng, radiusKm) {
  const url =
    `${INAT_HISTOGRAM}?lat=${lat}&lng=${lng}&radius=${radiusKm}` +
    `&quality_grade=research&date_field=observed&interval=year`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/species-timeline" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      if (attempt <= MAX_RETRIES) { await sleep(1500 * attempt); continue; }
      throw new Error(`request failed: ${err?.name || err}`);
    }
    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const retry = Number(res.headers.get("retry-after")) || 5;
      await sleep((retry + 1) * 1000);
      continue;
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) { await sleep(1500 * attempt); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.results?.year ?? {};
  }
}

function toYearly(histogram) {
  return Object.entries(histogram)
    .map(([date, count]) => ({ year: Number(date.slice(0, 4)), count }))
    .filter((p) => Number.isFinite(p.year) && p.year >= MIN_YEAR && p.count > 0)
    .sort((a, b) => a.year - b.year);
}

async function main() {
  console.log("Species observation timeline ingest (iNaturalist)" + (DRY_RUN ? " — dry run" : ""));
  console.log("=================================================");

  const locations = JSON.parse(await fs.readFile(LOCATIONS_PATH, "utf8"));
  const diversity = JSON.parse(await fs.readFile(DIVERSITY_PATH, "utf8"));
  const radiusByLoc = new Map(diversity.map((d) => [d.locationId, d.radiusKm]));

  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  } catch {
    /* first run */
  }
  const byLoc = new Map(existing.map((r) => [r.locationId, r]));
  const today = new Date().toISOString().slice(0, 10);

  const targets = locations
    .filter((l) => typeof l.lat === "number" && typeof l.lng === "number")
    .slice(0, LIMIT === Infinity ? undefined : LIMIT);

  let attempted = 0, updated = 0, skipped = 0, empty = 0;
  const failures = [];

  for (const loc of targets) {
    const prev = byLoc.get(loc.id);
    if (!FORCE && prev?.fetchedAt && daysBetween(prev.fetchedAt, today) < MAX_AGE_DAYS) {
      skipped++;
      continue;
    }
    attempted++;
    const radiusKm = RADIUS_OVERRIDE ?? radiusByLoc.get(loc.id) ?? DEFAULT_RADIUS_KM;
    try {
      const hist = await fetchHistogram(loc.lat, loc.lng, radiusKm);
      const yearly = toYearly(hist);
      if (yearly.length < 2) { empty++; await sleep(PACE_MS); continue; }
      const total = yearly.reduce((a, p) => a + p.count, 0);
      const record = {
        locationId: loc.id,
        radiusKm,
        source: "inaturalist",
        qualityGrade: "research",
        yearlyObservations: yearly,
        totalObservations: total,
        firstYear: yearly[0].year,
        lastYear: yearly[yearly.length - 1].year,
        fetchedAt: today,
      };
      byLoc.set(loc.id, record);
      updated++;
      if (updated % 20 === 0) console.log(`  … ${updated} updated (${loc.id}: ${total} obs)`);
      await sleep(PACE_MS);
    } catch (err) {
      failures.push({ id: loc.id, reason: err.message });
      console.warn(`  ! ${loc.id}: ${err.message}`);
      await sleep(PACE_MS);
    }
  }

  const merged = [...byLoc.values()].sort((a, b) => a.locationId.localeCompare(b.locationId));

  console.log(`\nattempted ${attempted} · updated ${updated} · skipped(fresh) ${skipped} · sparse ${empty} · failed ${failures.length}`);

  if (DRY_RUN) {
    console.log("[dry run] no file written");
    for (const r of merged.slice(0, 5)) {
      console.log(`  ${r.locationId}: ${r.yearlyObservations.map((p) => p.year + ":" + p.count).join(" ")}`);
    }
    return;
  }

  const failRate = attempted > 0 ? failures.length / attempted : 0;
  if (failRate > FAILURE_THRESHOLD) {
    console.error(`FAIL: ${(failRate * 100).toFixed(0)}% failed, above ${FAILURE_THRESHOLD * 100}% — not writing`);
    process.exit(1);
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`Wrote ${merged.length} location timelines to species-observation-timeline.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
