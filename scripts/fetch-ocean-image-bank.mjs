#!/usr/bin/env node
/**
 * Fetch all images from the Ocean Image Bank (oceanimagebank.theoceanagency.org)
 * via their Prismic GraphQL API and assign heroImageUrls across all sites and locations.
 *
 * Strategy:
 *   1. Download all ~600 OIB images with metadata.
 *   2. For each site/location, score every OIB image by keyword overlap with:
 *        - Location name / country / region
 *        - Site name
 *        - Signature species common names
 *   3. Assign the highest-scoring unused image to each entity.
 *      Ties broken by OIB editorial weight (order returned by API).
 *   4. Sites are assigned first (more specific), then locations.
 *
 * Run:
 *   node scripts/fetch-ocean-image-bank.mjs
 *   node scripts/fetch-ocean-image-bank.mjs --force   # overwrite existing heroes
 *   node scripts/fetch-ocean-image-bank.mjs --dry     # preview only
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

const PRISMIC_API = "https://ocean-agency-cms.prismic.io/api/v2";
const PRISMIC_GQL = "https://ocean-agency-cms.prismic.io/graphql";
const CDN = "https://d1qsp4j04beddk.cloudfront.net";

const UA = "scubaseason.fun hero enrichment (contact: josie.ty.leung@gmail.com)";
const FORCE = process.argv.includes("--force");
const DRY   = process.argv.includes("--dry");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

// ── Prismic API ───────────────────────────────────────────────────────────────

async function getPrismicRef() {
  const r = await fetch(PRISMIC_API, { headers: { "User-Agent": UA } });
  const d = await r.json();
  return d.refs.find((x) => x.id === "master").ref;
}

async function fetchPage(ref, cursor) {
  const q = `query{
    allImages(fulltext:"",after:"${cursor}",sortBy:general_weight_DESC,first:100){
      totalCount
      pageInfo{hasNextPage endCursor}
      edges{
        node{
          name
          alternative_text
          _meta{id}
          credits{author}
        }
      }
    }
  }`;
  const url = `${PRISMIC_GQL}?query=${encodeURI(q.trim())}`;
  const r = await fetch(url, {
    headers: { "Prismic-Ref": ref, Accept: "application/json", "User-Agent": UA },
  });
  return r.json();
}

async function fetchAllImages() {
  console.log("Fetching Prismic ref…");
  const ref = await getPrismicRef();
  let cursor = "";
  let allImages = [];
  let page = 1;

  while (true) {
    console.log(`  page ${page} (cursor=${cursor || "start"})…`);
    const data = await fetchPage(ref, cursor);
    const result = data.data?.allImages;
    if (!result) { console.error("Unexpected response:", JSON.stringify(data)); break; }

    const images = result.edges.map((e) => e.node).filter((n) => {
      // Skip videos.
      if (/\.(mp4|mov|gif)$/i.test(n.name)) return false;
      return true;
    });
    allImages = allImages.concat(images);
    console.log(`    got ${images.length} images (total so far: ${allImages.length} / ${result.totalCount})`);

    if (!result.pageInfo.hasNextPage) break;
    cursor = result.pageInfo.endCursor;
    page++;
    await sleep(400);
  }

  return allImages;
}

// ── Underwater eligibility filter ────────────────────────────────────────────
// Reject OIB photos whose alt text signals above-water content. This prevents
// surface/aerial/boat shots from being assigned as hero images for dive sites.

const SURFACE_REJECT = [
  /\bboat\b/, /\bvessel\b/, /\bship\b(?!wreck)/, /\bfisherman\b/, /\bfishing\b/,
  /\bbeach\b/, /\bcoastline\b/, /\bshoreline\b/, /\baerial\b/,
  /\bharbou?r\b/, /\bport\b/, /\bpier\b/, /\bdock\b/,
  /\bfrom above\b/, /\bdrone\b/, /\bird.?s.?eye\b/, /\boverhead\b/,
  /\bvillage\b/, /\bmarket\b/, /\bstreet\b/,
];

export function isUnderwaterOIB(img) {
  const text = ((img.alternative_text || "") + " " + (img.name || "")).toLowerCase();
  return !SURFACE_REJECT.some((p) => p.test(text));
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function tokenize(text) {
  return norm(text).split(" ").filter((t) => t.length >= 3);
}

// Noise words that add no discriminative value or cause false cross-geographic matches.
const NOISE = new Set([
  // Common stop words
  "the", "and", "for", "with", "from",
  // Dive jargon (ubiquitous, non-discriminating)
  "dive", "site", "reef", "wall", "point", "rock", "underwater", "coral",
  "fish", "diving", "scuba", "water", "ocean", "marine", "park", "national",
  // Geography generics that appear on many images (cause false matches)
  "island", "islands", "archipelago", "bank", "channel", "passage",
  "north", "south", "east", "west", "great", "southern", "eastern",
  "western", "northern", "lake", "lagoon",
  // Common adjectives
  "blue", "black", "white", "deep", "open",
]);

function meaningful(tokens) {
  return tokens.filter((t) => !NOISE.has(t) && t.length >= 4);
}

// Region groups — if entity keywords include one, penalise images that mention another.
const REGION_GROUPS = [
  ["indonesia", "philippines", "malaysia", "palau", "micronesia", "papua", "solomon", "vanuatu", "fiji", "timor", "sulawesi", "borneo", "bali", "komodo", "raja ampat", "banda", "coral triangle", "pacific", "indo pacific"],
  ["maldives", "thailand", "myanmar", "cambodia", "vietnam", "lanka", "india", "andaman", "indian ocean", "mozambique", "tanzania", "kenya", "seychelles", "comoros", "mauritius", "red sea", "egypt", "oman", "djibouti"],
  ["caribbean", "bahamas", "cayman", "belize", "honduras", "costa rica", "colombia", "cuba", "mexico", "bonaire", "curacao", "aruba", "barbados", "trinidad", "jamaica", "dominican", "puerto rico", "virgin islands", "saint lucia"],
  ["mediterranean", "croatia", "italy", "spain", "malta", "greece", "cyprus", "turkey", "france"],
  ["atlantic", "azores", "canary", "cape verde", "portugal", "scotland", "norway", "uk", "ireland", "iceland", "florida", "bermuda"],
  ["galapagos", "ecuador", "peru", "chile", "cocos", "costa rica pacific"],
  ["australia", "new zealand", "great barrier reef", "ningaloo", "lord howe"],
  ["japan", "korea", "china", "taiwan", "okinawa"],
  ["antarctica", "arctic", "polar", "svalbard"],
];

function regionOf(text) {
  const t = norm(text);
  for (let i = 0; i < REGION_GROUPS.length; i++) {
    if (REGION_GROUPS[i].some((w) => t.includes(w))) return i;
  }
  return -1; // unknown/neutral
}

function scoreImage(img, keywords) {
  const haystack = norm(`${img.alternative_text} ${img.name}`);
  let score = 0;
  for (const kw of keywords) {
    if (haystack.includes(kw)) score += kw.length; // longer match = higher value
  }
  return score;
}

// Minimum score to consider any image a match.
const MIN_SCORE = 6;

function buildKeywords(entity, locById) {
  const loc = locById?.get(entity.locationId);
  const raw = [
    entity.name,
    loc?.name,
    loc?.country,
    loc?.region,
    ...(entity.species || []).slice(0, 5).map((s) => s.commonName || s.name).filter(Boolean),
  ].filter(Boolean);

  const all = raw.flatMap((s) => tokenize(s));
  return [...new Set(meaningful(all))];
}

function buildLocationKeywords(loc, locSites) {
  const raw = [
    loc.name,
    loc.country,
    loc.region,
    ...locSites.flatMap((s) =>
      (s.species || []).slice(0, 3).map((sp) => sp.commonName || sp.name).filter(Boolean)
    ).slice(0, 6),
  ].filter(Boolean);
  const all = raw.flatMap((s) => tokenize(s));
  return [...new Set(meaningful(all))];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  await loadRegistry();
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);

  const locById = new Map(locations.map((l) => [l.id, l]));
  const sitesByLoc = new Map();
  for (const s of sites) {
    if (!sitesByLoc.has(s.locationId)) sitesByLoc.set(s.locationId, []);
    sitesByLoc.get(s.locationId).push(s);
  }

  // Seed registry from existing heroes.
  for (const s of sites) if (s.heroImageUrl && !isUsed(s.heroImageUrl)) markUsed(s.heroImageUrl, s.slug);
  for (const l of locations) if (l.heroImageUrl && !isUsed(l.heroImageUrl)) markUsed(l.heroImageUrl, l.slug);

  console.log("\nDownloading Ocean Image Bank catalogue…");
  const oibImages = await fetchAllImages();
  console.log(`\nTotal usable OIB images: ${oibImages.length}`);

  // Track which OIB URLs we've already assigned this run (independent of registry).
  const assignedUrls = new Set();

  function pickBest(keywords, entityRegion = -1) {
    let best = null, bestScore = 0;
    for (const img of oibImages) {
      const url = `${CDN}/${img.name}`;
      if (assignedUrls.has(url)) continue;
      if (isUsed(url)) continue;
      if (!isUnderwaterOIB(img)) continue;
      let score = scoreImage(img, keywords);
      if (score < MIN_SCORE) continue;
      // Penalise cross-region mismatches.
      if (entityRegion >= 0) {
        const imgRegion = regionOf(img.alternative_text);
        if (imgRegion >= 0 && imgRegion !== entityRegion) score = Math.floor(score * 0.3);
      }
      if (score > bestScore) { bestScore = score; best = img; }
    }
    if (!best || bestScore < MIN_SCORE) return null;
    return { url: `${CDN}/${best.name}`, img: best, score: bestScore };
  }

  // ── Sites ──────────────────────────────────────────────────────────────────
  let siteHits = 0, siteSkip = 0, siteMiss = 0;
  console.log(`\n── Sites (${sites.length}) ──`);

  for (const site of sites) {
    if (!FORCE && site.heroImageUrl) { siteSkip++; continue; }

    const kw = buildKeywords(site, locById);
    const loc = locById.get(site.locationId);
    const entityRegion = regionOf(`${loc?.country ?? ""} ${loc?.region ?? ""} ${loc?.name ?? ""}`);
    const pick = pickBest(kw, entityRegion);
    if (pick) {
      siteHits++;
      const author = pick.img.credits?.[0]?.author ?? "Ocean Image Bank";
      const credit = `${author} / Ocean Image Bank`;
      if (!DRY) {
        site.heroImageUrl = pick.url;
        assignedUrls.add(pick.url);
        markUsed(pick.url, site.slug);
      }
      console.log(`[oib ✓] ${site.slug}  score=${pick.score}  alt="${pick.img.alternative_text}"  credit="${credit}"`);
    } else {
      siteMiss++;
      console.log(`[oib ∅] ${site.slug}  (no OIB match for kw: ${kw.slice(0,4).join(", ")})`);
    }
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  let locHits = 0, locSkip = 0, locMiss = 0;
  console.log(`\n── Locations (${locations.length}) ──`);

  for (const loc of locations) {
    if (!FORCE && loc.heroImageUrl) { locSkip++; continue; }

    const kw = buildLocationKeywords(loc, sitesByLoc.get(loc.id) ?? []);
    const locRegion = regionOf(`${loc.country ?? ""} ${loc.region ?? ""} ${loc.name ?? ""}`);
    const pick = pickBest(kw, locRegion);
    if (pick) {
      locHits++;
      const author = pick.img.credits?.[0]?.author ?? "Ocean Image Bank";
      const credit = `${author} / Ocean Image Bank`;
      if (!DRY) {
        loc.heroImageUrl = pick.url;
        assignedUrls.add(pick.url);
        markUsed(pick.url, loc.slug);
      }
      console.log(`[oib ✓] ${loc.slug}  score=${pick.score}  alt="${pick.img.alternative_text}"  credit="${credit}"`);
    } else {
      locMiss++;
      console.log(`[oib ∅] ${loc.slug}  (no OIB match for kw: ${kw.slice(0,4).join(", ")})`);
    }
  }

  if (!DRY) {
    await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
    await saveRegistry();
    console.log("\nWrote sites.json, locations.json, used-hero-urls.json.");
  } else {
    console.log("\n[dry run] no files written.");
  }

  console.log(`\nSites:     hits=${siteHits} | skipped=${siteSkip} | no-match=${siteMiss}`);
  console.log(`Locations: hits=${locHits} | skipped=${locSkip} | no-match=${locMiss}`);
  console.log(`OIB images used: ${assignedUrls.size} / ${oibImages.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
