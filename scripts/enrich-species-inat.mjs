#!/usr/bin/env node
/**
 * Free species enrichment via iNaturalist — no Claude API needed.
 *
 * For every dive site with fewer than MIN_SPECIES species, queries the
 * iNaturalist /v1/observations/species_counts endpoint to discover the
 * most-observed marine species within RADIUS_KM. For each new species,
 * fetches monthly observation breakdown and a photo URL, then writes
 * the full enriched entry directly into sites.json.
 *
 * One script replaces three (enrich-species + fetch-species-photos +
 * fetch-species-probability) for the thin-site case.
 *
 * Env / flags:
 *   MIN_SPECIES=5        enrich sites below this threshold (default 5)
 *   TARGET_SPECIES=8     aim for this many per site (default 8)
 *   RADIUS_KM=20         search radius around site centre (default 20)
 *   DRY_RUN=1            print plan, do not write
 *   SITE_ID=xxx          process a single site by id
 *
 * Rate: 700 ms between requests. No API key required.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const MIN_SPECIES   = Number(process.env.MIN_SPECIES   ?? "5");
const TARGET_SPECIES = Number(process.env.TARGET_SPECIES ?? "8");
const RADIUS_KM     = Number(process.env.RADIUS_KM     ?? "20");
const DRY_RUN       = process.env.DRY_RUN === "1";
const SITE_ID       = process.env.SITE_ID ?? null;

const INAT_BASE  = "https://api.inaturalist.org/v1";
const USER_AGENT = "scubaseason.fun species-enrichment/1.0 (hello@scubaseason.fun)";
const PACE_MS    = 700;
const TIMEOUT_MS = 20_000;

// Iconic taxa IDs for marine-relevant groups
const MARINE_TAXON_IDS = [
  47178,  // Actinopterygii (ray-finned fish)
  47273,  // Elasmobranchii (sharks & rays)
  47459,  // Cephalopoda (octopus, squid)
  47549,  // Echinodermata (sea stars, urchins)
  47534,  // Cnidaria (corals, jellyfish, anemones)
  47115,  // Mollusca (nudibranchs, shells, clams)
  47187,  // Malacostraca (crabs, lobsters, shrimp)
  26036,  // Reptilia (sea turtles)
  3,      // Aves limit: sea birds seen by divers — skipped below if not relevant
].join(",");

// Skip purely terrestrial common names
const SKIP_KEYWORDS = /\b(bird|hawk|gull|tern|booby|frigat|pelican|heron|egret|cormorant|land crab|fiddler|tree|frog|gecko|iguana)\b/i;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function inatGet(endpoint, params) {
  const url = `${INAT_BASE}${endpoint}?${new URLSearchParams(params)}`;
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      if (attempt < 4) { await sleep(2000 * attempt); continue; }
      throw err;
    }
    if (res.status === 429) {
      const wait = parseInt(res.headers.get("retry-after") ?? "15", 10) * 1000;
      await sleep(wait + 2000);
      continue;
    }
    if (res.status >= 500 && attempt < 4) { await sleep(3000 * attempt); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  }
}

async function fetchTopSpecies(lat, lng) {
  const data = await inatGet("/observations/species_counts", {
    lat,
    lng,
    radius: RADIUS_KM,
    quality_grade: "research",
    taxon_ids: MARINE_TAXON_IDS,
    per_page: 30,
    order: "desc",
    order_by: "count",
  });
  return data.results ?? [];
}

async function fetchMonthlyObs(taxonId, lat, lng) {
  const data = await inatGet("/observations", {
    taxon_id: taxonId,
    lat,
    lng,
    radius: RADIUS_KM,
    quality_grade: "research",
    per_page: 200,
    fields: "observed_on",
    order_by: "observed_on",
  });
  const counts = new Array(12).fill(0);
  for (const obs of data.results ?? []) {
    const m = obs.observed_on ? new Date(obs.observed_on).getUTCMonth() : null;
    if (m !== null) counts[m]++;
  }
  const total = counts.reduce((a, b) => a + b, 0);
  const prob = counts.map((c) => (total > 0 ? parseFloat((c / total).toFixed(3)) : 0));
  const best = [...prob.keys()].sort((a, b) => prob[b] - prob[a]).slice(0, 6).map((i) => i + 1);
  return { total, counts, prob, best };
}

async function fetchPhoto(taxonId) {
  const data = await inatGet("/observations", {
    taxon_id: taxonId,
    quality_grade: "research",
    per_page: 1,
    order_by: "votes",
    fields: "photos",
  });
  const photos = data.results?.[0]?.photos ?? [];
  if (!photos.length) return null;
  return photos[0].url?.replace("/square.", "/large.") ?? null;
}

function deriveReliability(prob) {
  const peak = Math.max(...prob);
  const nonZero = prob.filter((p) => p > 0).length;
  if (nonZero >= 9) return "year-round";
  if (nonZero >= 5) return "seasonal";
  return "rare";
}

async function main() {
  const raw = await fs.readFile(SITES_PATH, "utf8");
  const sites = JSON.parse(raw);

  let targets = sites.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number" && (s.species?.length ?? 0) < MIN_SPECIES
  );
  if (SITE_ID) targets = targets.filter((s) => s.id === SITE_ID);

  console.log(`\niNaturalist species enrichment`);
  console.log(`==============================`);
  console.log(`Sites to enrich: ${targets.length}  (< ${MIN_SPECIES} species, target ${TARGET_SPECIES})`);
  if (DRY_RUN) console.log("DRY RUN — no writes\n");
  else console.log("");

  let enriched = 0;
  let skipped = 0;
  let speciesAdded = 0;

  for (let i = 0; i < targets.length; i++) {
    const site = targets[i];
    const siteIndex = sites.indexOf(site);
    const existing = new Set((site.species ?? []).map((s) => s.scientificName?.toLowerCase()));
    const need = TARGET_SPECIES - (site.species?.length ?? 0);

    process.stdout.write(`[${i + 1}/${targets.length}] ${site.name} (${site.species?.length ?? 0} species)`);

    if (need <= 0) { skipped++; process.stdout.write(" → already at target\n"); continue; }

    let topSpecies;
    try {
      topSpecies = await fetchTopSpecies(site.lat, site.lng);
      await sleep(PACE_MS);
    } catch (err) {
      process.stdout.write(` → ERROR fetching species: ${err.message}\n`);
      continue;
    }

    const candidates = topSpecies.filter((r) => {
      const name = r.taxon?.preferred_common_name ?? r.taxon?.name ?? "";
      return !existing.has(r.taxon?.name?.toLowerCase()) && !SKIP_KEYWORDS.test(name);
    });

    let added = 0;
    for (const result of candidates) {
      if (added >= need) break;

      const taxon = result.taxon;
      if (!taxon?.name) continue;

      const commonName = taxon.preferred_common_name
        ? taxon.preferred_common_name.replace(/\b\w/g, (c) => c.toUpperCase())
        : taxon.name;

      let monthly, photo;
      try {
        monthly = await fetchMonthlyObs(taxon.id, site.lat, site.lng);
        await sleep(PACE_MS);
        photo = await fetchPhoto(taxon.id);
        await sleep(PACE_MS);
      } catch (err) {
        process.stdout.write(`\n  ! ${taxon.name}: ${err.message}`);
        continue;
      }

      const entry = {
        commonName,
        scientificName: taxon.name,
        reliability: deriveReliability(monthly.prob),
        ...(photo ? { imageUrl: photo } : {}),
        inatObsCount: monthly.total,
        monthlyObs: monthly.counts,
        monthlyProbability: monthly.prob,
        bestMonths: monthly.best,
      };

      if (!DRY_RUN) {
        if (!sites[siteIndex].species) sites[siteIndex].species = [];
        sites[siteIndex].species.push(entry);
        existing.add(taxon.name.toLowerCase());
        await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
      }

      added++;
      speciesAdded++;
      process.stdout.write(`\n  + ${commonName} (${taxon.name}) [${monthly.total} obs]`);
    }

    if (added === 0) {
      process.stdout.write(" → no new species found\n");
      skipped++;
    } else {
      enriched++;
      process.stdout.write(`\n  → added ${added} species\n`);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Sites enriched: ${enriched}`);
  console.log(`  Sites skipped:  ${skipped}`);
  console.log(`  Species added:  ${speciesAdded}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
