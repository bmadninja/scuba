#!/usr/bin/env node
/**
 * Wave v2.2 — LIVE species-sightings ingest (iNaturalist, GBIF fallback).
 *
 * Replaces the synthetic snapshot from backfill-sightings.mjs with real,
 * continuously-refreshed observation data. For every site in
 * src/data/sites.json (lat/lng live directly on each site record) and
 * every species at that site with a scientificName, query the
 * iNaturalist research-grade observations API within a geographic radius
 * over the last N months and compute:
 *
 *   - lastConfirmedAt:   most recent research-grade observation date
 *                        (YYYY-MM-DD), or null if none in window.
 *   - recentRecordCount: number of research-grade observations in window.
 *   - seasonalityMonths: months (1-12) where observations cluster
 *                        (derived from the observation-month histogram).
 *   - verified:          true when at least one research-grade record was
 *                        found by a live source this run.
 *   - obsId:             iNaturalist id of the most-recent observation
 *                        (deep-links to the source).
 *
 *   iNaturalist:  https://api.inaturalist.org/v1/observations
 *                 No API key. Rate limit ~60 req/min, <10k/day; we pace
 *                 PACE_MS between calls to stay well under.
 *   GBIF fallback: https://api.gbif.org/v1/occurrence/search
 *                 No API key. Used only when iNaturalist returns zero
 *                 records for a species/site, to confirm presence and a
 *                 last-seen date from a second source.
 *
 * Preserved as-is (idempotent, like backfill-sightings):
 *   - Any existing record carrying notes (hand-curated annotation) keeps
 *     its curated lastConfirmedAt / recentRecordCount untouched; only the
 *     live `verified` + `fetchedAt` provenance is refreshed.
 *   - confidence, proximityRadiusKm, methodologyClaimIds, and the
 *     gbif/obis/iucn etc. sourceIds set carry forward; we additively
 *     credit `inaturalist`/`gbif` on records we touched live.
 *   - Records for species without a scientificName (can't be queried)
 *     are passed through verbatim.
 *
 * Graceful failure (matches fetch-reef-health-live.mjs): a per-species
 * fetch error leaves that record's previous values untouched and logs a
 * warning. If more than FAILURE_THRESHOLD of attempted live queries
 * fail, exit non-zero so a broken run never silently degrades the data.
 *
 * Flags:
 *   --dry-run        fetch a SMALL sample, print results, DO NOT write.
 *   --limit N        cap the number of sites processed (default: all;
 *                    default 2 under --dry-run).
 *   --months N       observation window in months (default 24).
 *   --radius N       fallback geo radius (km) when a record has none
 *                    (default 25).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const SIGHT_PATH = path.join(ROOT, "src/data/sightings.json");

const INAT_BASE = "https://api.inaturalist.org/v1/observations";
const INAT_HIST = "https://api.inaturalist.org/v1/observations/histogram";
const GBIF_BASE = "https://api.gbif.org/v1/occurrence/search";

const USER_AGENT = "scubaseason.fun sightings ingest (hello@scubaseason.fun)";

// iNaturalist allows ~60 req/min unauthenticated. Each species does up to
// 2 iNat calls (observations + histogram). 1500ms gives ~40 req/min with
// headroom for the histogram call, staying clear of normal_throttling.
const PACE_MS = 1500;
const FAILURE_THRESHOLD = 0.2;
const DEFAULT_MONTHS = 24;
const DEFAULT_RADIUS_KM = 25;
// A month is counted as "in season" when it holds at least this share of
// the busiest month's observations.
const SEASONALITY_FRACTION = 0.25;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const args = { dryRun: false, limit: null, months: DEFAULT_MONTHS, radius: DEFAULT_RADIUS_KM };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a === "--months") args.months = Number(argv[++i]);
    else if (a === "--radius") args.radius = Number(argv[++i]);
  }
  if (args.dryRun && args.limit == null) args.limit = 2;
  return args;
}

/** ISO date N months ago, as YYYY-MM-DD, for the iNat `d1` lower bound. */
function windowStart(months) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url, retries = 3) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });
    if (res.status === 429 && attempt <= retries) {
      await sleep(PACE_MS * (2 ** attempt)); // 3s, 6s, 12s
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.json();
  }
}

/**
 * iNaturalist research-grade observations for one binomial within a geo
 * radius and time window. Returns { count, lastDate, obsId } or null when
 * the species can't be queried.
 */
async function fetchInat(scientificName, lat, lng, radiusKm, d1) {
  const params = new URLSearchParams({
    taxon_name: scientificName,
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusKm),
    quality_grade: "research",
    order_by: "observed_on",
    order: "desc",
    d1,
    per_page: "1",
  });
  const json = await fetchJson(`${INAT_BASE}?${params.toString()}`);
  const count = Number(json?.total_results ?? 0);
  const top = json?.results?.[0];
  const lastDate = top?.observed_on_details?.date ?? top?.observed_on ?? null;
  const obsId = top?.id ?? null;
  return { count, lastDate, obsId };
}

/**
 * Monthly histogram of research-grade observations for one binomial in
 * the radius. Returns months (1-12) clustering above SEASONALITY_FRACTION
 * of the peak month. Best-effort: returns [] on any failure.
 */
async function fetchSeasonality(scientificName, lat, lng, radiusKm) {
  try {
    const params = new URLSearchParams({
      taxon_name: scientificName,
      lat: String(lat),
      lng: String(lng),
      radius: String(radiusKm),
      quality_grade: "research",
      date_field: "observed",
      interval: "month_of_year",
    });
    const json = await fetchJson(`${INAT_HIST}?${params.toString()}`);
    const hist = json?.results?.month_of_year ?? {};
    const counts = Object.entries(hist).map(([m, c]) => [Number(m), Number(c)]);
    const peak = counts.reduce((max, [, c]) => Math.max(max, c), 0);
    if (peak === 0) return [];
    return counts
      .filter(([, c]) => c >= peak * SEASONALITY_FRACTION)
      .map(([m]) => m)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/**
 * GBIF fallback: confirm presence + a last-seen year/date for a binomial
 * near a point. GBIF geo filtering uses a WKT bounding polygon; we use a
 * simple lat/lng box approximating the radius. Returns { count, lastDate }
 * or null. Best-effort.
 */
async function fetchGbif(scientificName, lat, lng, radiusKm, months) {
  try {
    const dLat = radiusKm / 111;
    const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180) || 1);
    const yearMin = new Date().getUTCFullYear() - Math.ceil(months / 12);
    const params = new URLSearchParams({
      scientificName,
      hasCoordinate: "true",
      decimalLatitude: `${(lat - dLat).toFixed(4)},${(lat + dLat).toFixed(4)}`,
      decimalLongitude: `${(lng - dLng).toFixed(4)},${(lng + dLng).toFixed(4)}`,
      year: `${yearMin},${new Date().getUTCFullYear()}`,
      limit: "1",
    });
    const json = await fetchJson(`${GBIF_BASE}?${params.toString()}`);
    const count = Number(json?.count ?? 0);
    const rec = json?.results?.[0];
    let lastDate = null;
    if (rec?.eventDate) lastDate = String(rec.eventDate).slice(0, 10);
    else if (rec?.year) {
      const mm = String(rec.month ?? 1).padStart(2, "0");
      const dd = String(rec.day ?? 1).padStart(2, "0");
      lastDate = `${rec.year}-${mm}-${dd}`;
    }
    return { count, lastDate };
  } catch {
    return null;
  }
}

function idSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const d1 = windowStart(args.months);

  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const existing = JSON.parse(await fs.readFile(SIGHT_PATH, "utf8"));

  // Index existing records by id so we can preserve hand-curated values.
  const existingById = new Map();
  for (const r of existing) existingById.set(r.id, r);

  const fetchedAt = new Date().toISOString();
  let attempted = 0;
  let verifiedCount = 0;
  let viaGbif = 0;
  let preservedCurated = 0;
  const failures = [];
  const out = [];
  const seenIds = new Set();

  const targetSites = args.limit != null ? sites.slice(0, args.limit) : sites;

  console.log(
    `LIVE sightings ingest — window since ${d1}, ${targetSites.length} site(s)` +
      (args.dryRun ? " [DRY RUN — no write]" : ""),
  );

  for (const site of targetSites) {
    if (typeof site.lat !== "number" || typeof site.lng !== "number") continue;
    for (const species of site.species ?? []) {
      const sci = species.scientificName;
      const common = species.commonName;
      const id = `${site.id}-${idSlug(sci || common)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const prev = existingById.get(id);

      // Can't query without a binomial — pass any existing record through.
      if (!sci) {
        if (prev) out.push(prev);
        continue;
      }

      const radiusKm = prev?.proximityRadiusKm ?? args.radius;
      attempted += 1;
      try {
        let { count, lastDate, obsId } = await fetchInat(
          sci,
          site.lat,
          site.lng,
          radiusKm,
          d1,
        );
        let source = "inaturalist";
        await sleep(PACE_MS);

        // iNat empty → try GBIF as a second presence source.
        if (count === 0) {
          const gbif = await fetchGbif(sci, site.lat, site.lng, radiusKm, args.months);
          await sleep(PACE_MS);
          if (gbif && gbif.count > 0) {
            count = gbif.count;
            lastDate = gbif.lastDate;
            source = "gbif";
            viaGbif += 1;
          }
        }

        const seasonality =
          source === "inaturalist" && count > 0
            ? await fetchSeasonality(sci, site.lat, site.lng, radiusKm)
            : prev?.seasonalityMonths ?? [];
        if (source === "inaturalist" && count > 0) await sleep(PACE_MS);

        const verified = count > 0;
        if (verified) verifiedCount += 1;

        // Hand-curated record (has notes): keep curated numbers, refresh
        // only the live provenance flags.
        const isCurated = Boolean(prev?.notes);
        if (isCurated) preservedCurated += 1;

        const sourceIds = Array.from(
          new Set([...(prev?.sourceIds ?? ["gbif", "obis"]), source]),
        );

        const record = {
          id,
          siteId: site.id,
          speciesCommon: common,
          speciesScientific: sci,
          lastConfirmedAt: isCurated
            ? prev.lastConfirmedAt
            : verified
              ? lastDate
              : (prev?.lastConfirmedAt ?? null),
          recentRecordCount: isCurated
            ? prev.recentRecordCount
            : verified
              ? count
              : (prev?.recentRecordCount ?? 0),
          proximityRadiusKm: radiusKm,
          seasonalityMonths:
            seasonality.length > 0 ? seasonality : (prev?.seasonalityMonths ?? []),
          confidence: prev?.confidence ?? confidenceFromCount(count),
          sourceIds,
          methodologyClaimIds: prev?.methodologyClaimIds ?? [
            "sighting-occurrence-cluster",
          ],
          verified,
          source: "sightings-live",
          fetchedAt,
          ...(prev?.notes ? { notes: prev.notes } : {}),
          ...(obsId && source === "inaturalist" ? { obsId } : prev?.obsId ? { obsId: prev.obsId } : {}),
        };
        out.push(record);

        console.log(
          `  ${site.id.slice(0, 28).padEnd(28)} ${sci.slice(0, 26).padEnd(26)} ` +
            `→ ${verified ? "VERIFIED" : "no-record"} ` +
            `count=${String(count).padEnd(4)} last=${lastDate ?? "—"} ` +
            `via=${source}${seasonality.length ? ` months=[${seasonality.join(",")}]` : ""}`,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        failures.push({ id, reason });
        if (prev) out.push(prev); // keep previous values on failure
        console.warn(`  ! ${id}: ${reason}`);
        await sleep(PACE_MS);
      }
    }
  }

  // Carry through any existing records we never visited (sites outside the
  // --limit slice), so a partial run is still idempotent and lossless.
  if (args.limit != null) {
    for (const r of existing) {
      if (!seenIds.has(r.id)) out.push(r);
    }
  } else {
    // Full run: preserve records whose species no longer appear in
    // sites.json but were on file (e.g. removed scientificName).
    for (const r of existing) {
      if (!seenIds.has(r.id) && !out.some((o) => o.id === r.id)) out.push(r);
    }
  }

  console.log("");
  console.log(`Sightings live ingest @ ${fetchedAt}`);
  console.log(`  attempted (live queries): ${attempted}`);
  console.log(`  verified:                 ${verifiedCount}`);
  console.log(`  confirmed via GBIF:       ${viaGbif}`);
  console.log(`  curated preserved:        ${preservedCurated}`);
  console.log(`  failed:                   ${failures.length}`);
  console.log(`  records out:              ${out.length}`);

  const failureRate = attempted > 0 ? failures.length / attempted : 0;
  if (failureRate > FAILURE_THRESHOLD) {
    console.error(
      `\nFAIL: ${(failureRate * 100).toFixed(1)}% of live queries failed — ` +
        `above ${FAILURE_THRESHOLD * 100}% threshold. Not writing.`,
    );
    process.exit(1);
  }

  if (args.dryRun) {
    console.log("\n[DRY RUN] Sample records (not written):");
    console.log(JSON.stringify(out.slice(0, 5), null, 2));
    return;
  }

  await fs.writeFile(SIGHT_PATH, JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote ${out.length} records to src/data/sightings.json`);
}

function confidenceFromCount(count) {
  if (count >= 30) return "high";
  if (count >= 5) return "medium";
  return "low";
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
