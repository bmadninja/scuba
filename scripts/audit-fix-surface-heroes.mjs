#!/usr/bin/env node
/**
 * Audit all current OIB hero photos and replace any that show above-water
 * content (boats, beaches, aerial shots, fishermen, etc.) with a better
 * OIB photo or fall back to a Pexels species-first photo.
 *
 * Run:
 *   node scripts/audit-fix-surface-heroes.mjs
 *   node scripts/audit-fix-surface-heroes.mjs --dry
 */

import fs from "node:fs/promises";
import path from "node:path";
import { isUnderwaterOIB } from "./fetch-ocean-image-bank.mjs";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry, REGISTRY_PATH } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const PRISMIC_API = "https://ocean-agency-cms.prismic.io/api/v2";
const PRISMIC_GQL = "https://ocean-agency-cms.prismic.io/graphql";
const CDN = "https://d1qsp4j04beddk.cloudfront.net";
const UA = "scubaseason.fun hero audit (contact: josie.ty.leung@gmail.com)";
const DRY = process.argv.includes("--dry");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOIBCatalogue() {
  const ref = await fetch(PRISMIC_API, { headers: { "User-Agent": UA } })
    .then((r) => r.json())
    .then((d) => d.refs.find((x) => x.id === "master").ref);

  let all = [], cursor = "";
  while (true) {
    const q = `query{allImages(fulltext:"",after:"${cursor}",sortBy:general_weight_DESC,first:100){pageInfo{hasNextPage endCursor}edges{node{name alternative_text _meta{id}}}}}`;
    const data = await fetch(`${PRISMIC_GQL}?query=${encodeURI(q.trim())}`, {
      headers: { "Prismic-Ref": ref, Accept: "application/json", "User-Agent": UA },
    }).then((r) => r.json());
    const result = data.data?.allImages;
    if (!result) break;
    all = all.concat(result.edges.map((e) => e.node).filter((n) => !/\.(mp4|mov|gif)$/i.test(n.name)));
    if (!result.pageInfo.hasNextPage) break;
    cursor = result.pageInfo.endCursor;
    await sleep(400);
  }
  return all;
}

function buildSiteQueries(site, locName) {
  const species = (site.species ?? []).slice(0, 3).map((s) => (s.commonName || s.name || "").toLowerCase()).filter(Boolean);
  return [
    species[0] && species[1] ? `${species[0]} ${species[1]} underwater reef` : null,
    species[0] ? `${species[0]} scuba diving underwater` : null,
    "coral reef scuba diving fish underwater",
    "tropical reef underwater diving colorful fish",
  ].filter(Boolean);
}

async function pexelsFallback(queries, slug) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 40 });
    await sleep(350);
    for (const r of results) {
      if (r.srcWidth < 2000) continue;
      if (isUsed(r.url)) continue;
      return r.url;
    }
  }
  return null;
}

async function main() {
  console.log("Fetching OIB catalogue…");
  const catalogue = await fetchOIBCatalogue();
  console.log(`Got ${catalogue.length} OIB images.`);

  // Build filename → metadata map
  const byFilename = new Map(catalogue.map((img) => [img.name, img]));

  await loadRegistry();
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  // Build pool of underwater OIB photos not yet assigned
  const assignedUrls = new Set([
    ...sites.map((s) => s.heroImageUrl),
    ...locations.map((l) => l.heroImageUrl),
  ].filter(Boolean));

  const underwaterPool = catalogue.filter((img) => {
    const url = `${CDN}/${img.name}`;
    return isUnderwaterOIB(img) && !assignedUrls.has(url);
  });
  console.log(`Underwater OIB pool (unassigned): ${underwaterPool.length}`);

  let fixed = 0, alreadyGood = 0, noReplacement = 0;

  for (const site of sites) {
    const url = site.heroImageUrl;
    if (!url?.includes("cloudfront")) continue;
    const filename = url.split("/").pop();
    const img = byFilename.get(filename);
    if (!img) continue; // unknown, skip

    if (isUnderwaterOIB(img)) { alreadyGood++; continue; }

    // This photo is above water — find a replacement
    console.log(`[BAD] ${site.slug} → "${img.alternative_text?.slice(0, 80)}"`);
    const loc = locById.get(site.locationId);
    const queries = buildSiteQueries(site, loc?.name);

    // Try OIB pool first (best quality)
    let replacement = null;
    for (const candidate of underwaterPool) {
      const cUrl = `${CDN}/${candidate.name}`;
      if (assignedUrls.has(cUrl)) continue;
      replacement = cUrl;
      assignedUrls.add(cUrl);
      underwaterPool.splice(underwaterPool.indexOf(candidate), 1);
      break;
    }

    // Fall back to Pexels species-first
    if (!replacement && process.env.PEXELS_API_KEY) {
      replacement = await pexelsFallback(queries, site.slug);
    }

    if (replacement) {
      console.log(`  → ${replacement.slice(0, 80)}`);
      fixed++;
      if (!DRY) {
        site.heroImageUrl = replacement;
        if (site.heroImages?.length) site.heroImages[0] = replacement;
        markUsed(replacement, site.slug);
      }
    } else {
      console.log(`  → no replacement found`);
      noReplacement++;
    }
  }

  // Same for locations
  for (const loc of locations) {
    const url = loc.heroImageUrl;
    if (!url?.includes("cloudfront")) continue;
    const filename = url.split("/").pop();
    const img = byFilename.get(filename);
    if (!img) continue;

    if (isUnderwaterOIB(img)) { alreadyGood++; continue; }

    console.log(`[BAD] ${loc.slug} → "${img.alternative_text?.slice(0, 80)}"`);
    let replacement = null;
    for (const candidate of underwaterPool) {
      const cUrl = `${CDN}/${candidate.name}`;
      if (assignedUrls.has(cUrl)) continue;
      replacement = cUrl;
      assignedUrls.add(cUrl);
      underwaterPool.splice(underwaterPool.indexOf(candidate), 1);
      break;
    }
    if (replacement) {
      console.log(`  → ${replacement.slice(0, 80)}`);
      fixed++;
      if (!DRY) {
        loc.heroImageUrl = replacement;
        if (loc.heroImages?.length) loc.heroImages[0] = replacement;
        markUsed(replacement, loc.slug);
      }
    } else {
      noReplacement++;
    }
  }

  if (!DRY) {
    await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
    await saveRegistry();
    console.log("\nWrote sites.json, locations.json, used-hero-urls.json.");
  }

  console.log(`\nAlready good: ${alreadyGood} | Fixed: ${fixed} | No replacement: ${noReplacement}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
