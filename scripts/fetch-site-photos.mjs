#!/usr/bin/env node
/**
 * Assign heroImageUrl to every dive site and every location.
 *
 * Quality rules (per PRD prd-photo-quality):
 *   Q1  Underwater context word required in title/description/categories.
 *   Q2  Minimum source width: sites ≥ 1200 px, locations ≥ 1600 px.
 *   Q3  No specimens, illustrations, surface/aerial shots.
 *   Q5  Global hero uniqueness: a URL can only be claimed by one entity
 *       (site or location). Registry: src/data/used-hero-urls.json.
 *
 * Priority order per site:
 *   1. Wikimedia photo of that specific site (title + location match).
 *   2. Wikimedia photo of the site's most-distinctive species (underwater).
 *   3. null — UI falls back to gradient placeholder.
 *
 * Priority order per location:
 *   1. Wikimedia photo of that specific location (name + country match, underwater).
 *   2. null — atlas-location.ts already borrows from a site hero as fallback.
 *
 * With --force: re-evaluates and potentially replaces every existing heroImageUrl.
 * Without --force: skips entities that already have a non-null heroImageUrl.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

const UA = "scubaSeason/0.4 (josie.ty.leung@gmail.com) site-photo-fetch";
const FORCE = process.argv.includes("--force");
const MIN_SITE_WIDTH = 1200;
const MIN_LOCATION_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Q1 — words that strongly imply an underwater photograph.
const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "divers", "diving", "scuba",
  "snorkel", "snorkeling", "snorkelling", "reef", "coral", "wreck",
  "subsea", "submerged", "submarine", "freediv", "cenote", "cavern",
  "cave dive", "blue hole",
];

// Q3 — reject on these terms in filename / title.
const BAD_FILE_HINTS = [
  "logo", "map", "chart", "diagram", "flag", "coat_of_arms", "seal_",
  "graph", ".svg", ".pdf", "icon", "postcard", "stamp", "poster",
  "specimen", "preserved", "museum", "collection", "jar", "taxidermy",
  "illustration", "drawing", "aerial", "beach_", "dock", "surface_",
  "above_water", "boat_on", "harbour", "harbor",
];

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameTokens(name) {
  const NOISE = new Set([
    "dive", "site", "reef", "wall", "point", "rock", "island", "islands",
    "channel", "wreck", "north", "south", "east", "west", "the",
  ]);
  const cleaned = norm(name).split(" ").filter((t) => t.length >= 3);
  return {
    all: cleaned,
    meaningful: cleaned.filter((t) => !NOISE.has(t)),
  };
}

function isUnderwater(text) {
  const t = norm(text);
  return UNDERWATER_WORDS.some((w) => t.includes(w.replace(/\s+/g, " ")));
}

function looksBad(filename) {
  const lower = (filename || "").toLowerCase();
  return BAD_FILE_HINTS.some((bad) => lower.includes(bad));
}

async function commonsSearch(query, minWidth) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: String(Math.max(minWidth, 2000)),
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) return [];
    const j = await r.json();
    const pages = j.query?.pages;
    if (!pages) return [];
    return Object.values(pages)
      .map((p) => {
        const info = p.imageinfo?.[0];
        if (!info) return null;
        if (info.mime && !info.mime.startsWith("image/")) return null;
        // Q2: enforce minimum source width.
        const srcWidth = info.width ?? 0;
        if (srcWidth > 0 && srcWidth < minWidth) return null;
        const meta = info.extmetadata || {};
        return {
          title: p.title || "",
          url: info.thumburl || info.url,
          srcWidth,
          description: (meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " "),
          objectName: meta.ObjectName?.value || "",
          categories: meta.Categories?.value || "",
          index: p.index ?? 99,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);
  } catch {
    return [];
  }
}

function siteMatchOk(file, name, locationWords) {
  const titleNorm = norm(file.title);
  const haystack = norm(`${file.title} ${file.description} ${file.objectName} ${file.categories}`);
  const { meaningful } = nameTokens(name);

  const titleHasName =
    meaningful.length === 0
      ? titleNorm.includes(norm(name))
      : meaningful.every((tok) => titleNorm.includes(tok));
  if (!titleHasName) return false;

  if (meaningful.length === 0) {
    if (!haystack.includes(norm(name))) return false;
  } else {
    if (!meaningful.every((tok) => haystack.includes(tok))) return false;
  }

  if (!isUnderwater(haystack)) return false;

  if (locationWords.length > 0) {
    const locHit = locationWords.some((w) => w.length >= 4 && haystack.includes(w));
    if (!locHit) return false;
  }
  return true;
}

async function findSitePhoto(name, locationWords) {
  const queries = [
    `"${name}" diving`,
    `"${name}" underwater`,
    `"${name}" scuba`,
    `"${name}" reef`,
    `"${name}" wreck`,
  ];
  for (const q of queries) {
    const results = await commonsSearch(q, MIN_SITE_WIDTH);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!siteMatchOk(r, name, locationWords)) continue;
      if (isUsed(r.url)) continue;
      return { url: r.url, source: `Commons: ${r.title}` };
    }
    await sleep(300);
  }
  return null;
}

// Species fallback for sites: cache candidate list per species.
function speciesMatchOk(file, species) {
  const haystack = norm(`${file.title} ${file.description} ${file.objectName} ${file.categories}`);
  if (!isUnderwater(haystack)) return false;
  const speciesTokens = norm(species)
    .split(" ")
    .filter((t) => t.length >= 4 && !["shark", "fish", "ray"].includes(t));
  const titleOrDesc = norm(`${file.title} ${file.description}`);
  if (speciesTokens.length === 0) return titleOrDesc.includes(norm(species));
  return speciesTokens.every((t) => titleOrDesc.includes(t));
}

const speciesCandidatesCache = new Map();

async function getSpeciesCandidates(species) {
  const key = norm(species);
  if (speciesCandidatesCache.has(key)) return speciesCandidatesCache.get(key);
  const queries = [
    `"${species}" underwater`,
    `"${species}" diving`,
    `"${species}" reef`,
    `"${species}" scuba`,
  ];
  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    const results = await commonsSearch(q, MIN_SITE_WIDTH);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!speciesMatchOk(r, species)) continue;
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      candidates.push({ url: r.url, source: `Commons (species): ${r.title}` });
    }
    await sleep(300);
  }
  speciesCandidatesCache.set(key, candidates);
  return candidates;
}

async function findSpeciesFallback(site) {
  const speciesList = (site.species || [])
    .map((s) => s.commonName || s.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const sp of speciesList) {
    const candidates = await getSpeciesCandidates(sp);
    for (const c of candidates) {
      if (!isUsed(c.url)) return { ...c, source: `${c.source}  [species: ${sp}]` };
    }
  }
  return null;
}

// Location hero: match on location name + country, underwater.
function locationMatchOk(file, loc) {
  const haystack = norm(`${file.title} ${file.description} ${file.objectName} ${file.categories}`);
  if (!isUnderwater(haystack)) return false;
  const { meaningful } = nameTokens(loc.name);
  const titleNorm = norm(file.title);
  const nameOk =
    meaningful.length === 0
      ? titleNorm.includes(norm(loc.name))
      : meaningful.every((tok) => titleNorm.includes(tok));
  if (!nameOk) return false;
  // Country or region must appear somewhere.
  const ctry = norm(loc.country || "");
  const region = norm(loc.region || "");
  const locOk = (ctry && haystack.includes(ctry)) || (region && haystack.includes(region));
  return locOk;
}

async function findLocationPhoto(loc) {
  const queries = [
    `"${loc.name}" diving underwater`,
    `"${loc.name}" scuba reef`,
    `"${loc.country}" "${loc.name}" underwater`,
  ];
  for (const q of queries) {
    const results = await commonsSearch(q, MIN_LOCATION_WIDTH);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!locationMatchOk(r, loc)) continue;
      if (isUsed(r.url)) continue;
      return { url: r.url, source: `Commons: ${r.title}` };
    }
    await sleep(300);
  }
  return null;
}

function locationWordsFor(loc) {
  if (!loc) return [];
  const raw = [loc.name, loc.country, loc.region].filter(Boolean).join(" ");
  const NOISE = new Set(["island", "islands", "sea", "ocean", "national", "park", "reef", "the", "and", "of"]);
  return norm(raw).split(" ").filter((t) => t.length >= 4 && !NOISE.has(t));
}

async function main() {
  await loadRegistry();

  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  // Seed registry with all existing heroes so they count as used.
  for (const s of sites) {
    if (s.heroImageUrl && !isUsed(s.heroImageUrl)) markUsed(s.heroImageUrl, s.slug);
  }
  for (const l of locations) {
    if (l.heroImageUrl && !isUsed(l.heroImageUrl)) markUsed(l.heroImageUrl, l.slug);
  }

  // ── Sites ──────────────────────────────────────────────────────────────
  let siteHits = 0, speciesHits = 0, siteUnmatched = 0;
  console.log(`\n── Sites (${sites.length}) ──`);

  for (const site of sites) {
    if (!FORCE && site.heroImageUrl) continue;

    // Remove old URL from registry so a new one can replace it.
    if (FORCE && site.heroImageUrl) {
      // Don't delete from registry — keep it as "used by prior slug" to avoid
      // re-assigning it elsewhere. Just clear from this site so it can pick fresh.
      delete site.heroImageUrl;
    }

    const locWords = locationWordsFor(locById.get(site.locationId));
    let hit = await findSitePhoto(site.name, locWords);
    if (hit) {
      siteHits++;
      console.log(`[site]    ${site.slug} ← ${hit.source}`);
    } else {
      hit = await findSpeciesFallback(site);
      if (hit) {
        speciesHits++;
        console.log(`[species] ${site.slug} ← ${hit.source}`);
      } else {
        siteUnmatched++;
        console.log(`[none]    ${site.slug}`);
      }
    }
    if (hit) {
      site.heroImageUrl = hit.url;
      markUsed(hit.url, site.slug);
    } else {
      site.heroImageUrl = null;
    }
  }

  // ── Locations ──────────────────────────────────────────────────────────
  let locHits = 0, locUnmatched = 0;
  console.log(`\n── Locations (${locations.length}) ──`);

  for (const loc of locations) {
    if (!FORCE && loc.heroImageUrl) continue;

    if (FORCE && loc.heroImageUrl) {
      delete loc.heroImageUrl;
    }

    const hit = await findLocationPhoto(loc);
    if (hit) {
      locHits++;
      loc.heroImageUrl = hit.url;
      markUsed(hit.url, loc.slug);
      console.log(`[loc]     ${loc.slug} ← ${hit.source}`);
    } else {
      locUnmatched++;
      console.log(`[none]    ${loc.slug}`);
    }
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
  await saveRegistry();

  console.log(`\nSites — site-match: ${siteHits} | species-fallback: ${speciesHits} | none: ${siteUnmatched}`);
  console.log(`Locations — matched: ${locHits} | none: ${locUnmatched}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
