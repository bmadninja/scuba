#!/usr/bin/env node
/**
 * Wave v2.0 — Species richness ingest (iNaturalist).
 *
 * For every location in src/data/locations.json with lat/lng, queries the
 * iNaturalist /v1/observations/species_counts endpoint to get the total
 * number of distinct species recorded within RADIUS_KM of the location
 * centre. Writes results to src/data/species-diversity.json.
 *
 * This is a location-level biodiversity metric — not per-site, not
 * curated. It counts all taxa with research-grade observations in the
 * area (fish, corals, invertebrates, seabirds, etc). For offshore or
 * island locations the vast majority will be marine. For coastal urban
 * sites (e.g. Aqaba, Dubai) some terrestrial inflation is expected.
 *
 * The number is primarily useful for relative comparison across locations
 * ("Raja Ampat: 2800 species vs Roatan: 420 species") rather than as an
 * absolute marine biodiversity count.
 *
 * No API key. Rate limit ~60 req/min; PACE_MS keeps us well under that.
 * Idempotent: re-running updates all records in place.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const OUT_PATH = path.join(ROOT, "src/data/species-diversity.json");

const INAT_BASE = "https://api.inaturalist.org/v1/observations/species_counts";
const USER_AGENT = "scubaseason.fun species-diversity ingest (hello@scubaseason.fun)";

const RADIUS_KM = 30;
const PACE_MS = 1_200;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 4;
const RETRY_PAUSE_MS = 5_000;
// iNaturalist returns 429 with a Retry-After header; we honour it plus a buffer.
const RATE_LIMIT_BACKOFF_MS = 15_000;
const FAILURE_THRESHOLD = 0.2;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSpeciesCount(lat, lng) {
  const url = `${INAT_BASE}?lat=${lat}&lng=${lng}&radius=${RADIUS_KM}&quality_grade=research&per_page=0`;
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || String(err);
      if (attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
      throw new Error(`request failed (${cause})`);
    }
    if (res.status === 429 && attempt <= MAX_RETRIES) {
      const retryAfter = parseInt(res.headers.get("retry-after") ?? "0", 10);
      const wait = (retryAfter > 0 ? retryAfter * 1000 : RATE_LIMIT_BACKOFF_MS);
      process.stdout.write(`  [429 — waiting ${Math.round(wait / 1000)}s]\r`);
      await sleep(wait);
      continue;
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) { await sleep(RETRY_PAUSE_MS); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const data = await res.json();
    return data.total_results ?? 0;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitArg = args.indexOf("--limit");
  const limit = limitArg !== -1 ? Number(args[limitArg + 1]) : (dryRun ? 5 : null);

  console.log("Species richness ingest (iNaturalist)");
  console.log("======================================");
  if (dryRun) console.log("DRY RUN — will not write output");

  const [locationsRaw, existingRaw] = await Promise.all([
    fs.readFile(LOCATIONS_PATH, "utf8"),
    fs.readFile(OUT_PATH, "utf8"),
  ]);

  const locations = JSON.parse(locationsRaw);
  const existing = JSON.parse(existingRaw);
  const byId = new Map(existing.map((r) => [r.locationId, r]));

  const targets = locations
    .filter((l) => typeof l.lat === "number" && typeof l.lng === "number")
    .slice(0, limit ?? locations.length);

  console.log(`\nQuerying ${targets.length} locations (radius ${RADIUS_KM} km)…\n`);

  const fetchedAt = new Date().toISOString().slice(0, 10);
  let attempted = 0;
  let updated = 0;
  let skipped = 0;
  const failures = [];

  for (const loc of targets) {
    const prev = byId.get(loc.id);
    if (prev?.fetchedAt === fetchedAt) {
      skipped++;
      continue;
    }
    attempted++;
    try {
      const count = await fetchSpeciesCount(loc.lat, loc.lng);
      byId.set(loc.id, {
        locationId: loc.id,
        speciesRichness: count,
        radiusKm: RADIUS_KM,
        qualityGrade: "research",
        source: "inaturalist",
        fetchedAt,
      });

      const delta = prev?.fetchedAt !== fetchedAt && prev ? count - prev.speciesRichness : null;
      const deltaStr = delta !== null ? ` (${delta >= 0 ? "+" : ""}${delta} vs prev)` : " (new)";
      console.log(
        `  ${loc.id.padEnd(48)} ${String(count).padStart(5)} species${deltaStr}`,
      );
      updated++;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ id: loc.id, reason });
      console.warn(`  ! ${loc.id}: ${reason}`);
    }
    await sleep(PACE_MS);
  }

  if (!dryRun) {
    const records = Array.from(byId.values()).sort((a, b) =>
      a.locationId.localeCompare(b.locationId),
    );
    await fs.writeFile(OUT_PATH, JSON.stringify(records, null, 2) + "\n");
  }

  console.log("");
  console.log(`Species richness ingest complete @ ${new Date().toISOString()}`);
  console.log(`  attempted: ${attempted}`);
  console.log(`  skipped:   ${skipped} (already fetched today)`);
  console.log(`  updated:   ${updated}`);
  console.log(`  failed:    ${failures.length}`);

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
