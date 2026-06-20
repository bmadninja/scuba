#!/usr/bin/env node
/**
 * Fetch real species sighting probability from iNaturalist.
 *
 * For each species at each dive site, queries iNat for research-grade
 * observations within 20 km. Aggregates by month and stores:
 *   - inatObsCount: total observations found
 *   - monthlyObs: [jan, feb, ..., dec] raw counts
 *   - monthlyProbability: [0.17, 0.26, ...] — fraction of sightings in each month
 *
 * Also updates bestMonths and reliability based on real data (if ≥ MIN_OBS).
 *
 * Rate: 500ms between requests. Skips species already enriched unless --force.
 * Usage: node scripts/fetch-species-probability.mjs [--force] [--site <siteId>]
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const RADIUS_KM = 20;
const PER_PAGE = 200;
const PACE_MS = 600;
const MIN_OBS = 5; // below this, keep existing reliability/bestMonths
const INAT_BASE = "https://api.inaturalist.org/v1";

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const SITE_FILTER = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchInat(taxonName, lat, lng) {
  const params = new URLSearchParams({
    taxon_name: taxonName,
    lat: lat.toFixed(4),
    lng: lng.toFixed(4),
    radius: RADIUS_KM,
    quality_grade: "research",
    per_page: PER_PAGE,
    fields: "observed_on",
    order_by: "observed_on",
  });
  const url = `${INAT_BASE}/observations?${params}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "scubaseason.fun species-probability/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`iNat ${res.status} for ${taxonName}`);
  const json = await res.json();
  return json.results || [];
}

function aggregateByMonth(observations) {
  const counts = new Array(12).fill(0);
  for (const obs of observations) {
    const date = obs.observed_on;
    if (!date) continue;
    const month = parseInt(date.split("-")[1], 10) - 1; // 0-indexed
    if (month >= 0 && month < 12) counts[month]++;
  }
  return counts;
}

function toMonthlyProbability(monthlyObs) {
  const total = monthlyObs.reduce((a, b) => a + b, 0);
  if (total === 0) return new Array(12).fill(0);
  return monthlyObs.map((n) => Math.round((n / total) * 1000) / 1000);
}

function deriveBestMonths(monthlyObs) {
  const total = monthlyObs.reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const mean = total / 12;
  // months above mean (1-indexed)
  return monthlyObs
    .map((n, i) => ({ month: i + 1, n }))
    .filter(({ n }) => n >= mean * 0.8 && n > 0)
    .sort((a, b) => b.n - a.n)
    .map(({ month }) => month);
}

function deriveReliability(monthlyObs) {
  const total = monthlyObs.reduce((a, b) => a + b, 0);
  if (total === 0) return "rare";
  const nonZeroMonths = monthlyObs.filter((n) => n > 0).length;
  if (nonZeroMonths >= 10) return "year-round";
  if (nonZeroMonths >= 5) return "seasonal";
  return "rare";
}

async function main() {
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));

  let siteCount = 0;
  let speciesAttempted = 0;
  let speciesEnriched = 0;
  let speciesSkipped = 0;
  let apiErrors = 0;

  for (const site of sites) {
    if (SITE_FILTER && site.id !== SITE_FILTER) continue;
    if (!site.species?.length) continue;
    if (typeof site.lat !== "number" || typeof site.lng !== "number") continue;

    siteCount++;
    let siteEnriched = 0;

    for (const sp of site.species) {
      if (!sp.scientificName) continue;

      // Skip if already enriched (unless --force)
      if (!FORCE && sp.inatObsCount !== undefined) {
        speciesSkipped++;
        continue;
      }

      speciesAttempted++;
      try {
        const observations = await fetchInat(sp.scientificName, site.lat, site.lng);
        const monthlyObs = aggregateByMonth(observations);
        const total = monthlyObs.reduce((a, b) => a + b, 0);

        sp.inatObsCount = total;
        sp.monthlyObs = monthlyObs;
        sp.monthlyProbability = toMonthlyProbability(monthlyObs);

        if (total >= MIN_OBS) {
          sp.bestMonths = deriveBestMonths(monthlyObs);
          sp.reliability = deriveReliability(monthlyObs);
        }

        siteEnriched++;
        speciesEnriched++;

        const label = `${site.name} / ${sp.commonName}`;
        console.log(`  ✓ ${label.padEnd(60)} obs=${total}`);
      } catch (err) {
        apiErrors++;
        console.error(`  ✗ ${site.name} / ${sp.commonName}: ${err.message}`);
      }

      await sleep(PACE_MS);
    }

    if (siteEnriched > 0) {
      // Write after each site so progress is never lost
      await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    }

    const pct = ((siteCount / sites.filter((s) => s.species?.length).length) * 100).toFixed(1);
    console.log(
      `[${pct}%] ${site.name} — enriched ${siteEnriched} species | total enriched: ${speciesEnriched}`
    );
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");

  console.log("\n=== Done ===");
  console.log(`Sites processed:   ${siteCount}`);
  console.log(`Species attempted: ${speciesAttempted}`);
  console.log(`Species enriched:  ${speciesEnriched}`);
  console.log(`Species skipped:   ${speciesSkipped} (already had data)`);
  console.log(`API errors:        ${apiErrors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
