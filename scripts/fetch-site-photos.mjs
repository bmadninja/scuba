#!/usr/bin/env node
// Every dive site gets an UNDERWATER photo. Priority order:
//   1. A Wikimedia Commons photo of THAT specific site (verified by title+location).
//   2. A Wikimedia Commons photo of the site's signature SPECIES (its first / most
//      distinctive marine animal). E.g. a Cuba shark dive with no site photo gets
//      a generic Caribbean-reef-shark underwater photo.
//   3. null — UI shows a neutral underwater placeholder.
//
// Hard rule: an image is only accepted if its title / description / categories
// contain an UNDERWATER context word. Above-water lead images (towns, ports,
// dive boats on the surface) are rejected.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

const UA = "scubaSeason/0.3 (josie.ty.leung@gmail.com) site-photo-fetch";

// Words that strongly imply an underwater photograph. "Ocean", "sea", "marine"
// are deliberately excluded — they admit aerial / surface shots.
const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "divers", "diving", "scuba",
  "snorkel", "snorkeling", "snorkelling", "reef", "coral", "wreck",
  "subsea", "submerged", "submarine", "freediv", "cenote", "cavern",
  "cave dive", "blue hole",
];

const BAD_FILE_HINTS = [
  "logo", "map", "chart", "diagram", "flag", "coat_of_arms", "seal_",
  "graph", ".svg", ".pdf", "icon", "postcard", "stamp", "poster",
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

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "2000",
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
        const meta = info.extmetadata || {};
        return {
          title: p.title || "",
          url: info.thumburl || info.url,
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
  const { meaningful, all } = nameTokens(name);

  // Site name must appear in TITLE (not just description).
  const titleHasName =
    meaningful.length === 0
      ? titleNorm.includes(norm(name))
      : meaningful.every((tok) => titleNorm.includes(tok));
  if (!titleHasName) return false;

  // All meaningful tokens (or full phrase) must appear in haystack too.
  if (meaningful.length === 0) {
    if (!haystack.includes(norm(name))) return false;
  } else {
    if (!meaningful.every((tok) => haystack.includes(tok))) return false;
  }

  // Must be UNDERWATER.
  if (!isUnderwater(haystack)) return false;

  // Must mention location (kills generic-name collisions).
  if (locationWords.length > 0) {
    const locHit = locationWords.some((w) => w.length >= 4 && haystack.includes(w));
    if (!locHit) return false;
  }
  return true;
}

async function findSitePhoto(name, locationWords, usedUrls) {
  const queries = [
    `"${name}" diving`,
    `"${name}" underwater`,
    `"${name}" scuba`,
    `"${name}" reef`,
    `"${name}" wreck`,
  ];
  for (const q of queries) {
    const results = await commonsSearch(q);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!siteMatchOk(r, name, locationWords)) continue;
      if (usedUrls.has(r.url)) continue;
      return { url: r.url, source: `Commons: ${r.title}` };
    }
  }
  return null;
}

// --- Species fallback ----------------------------------------------------

// Verify a candidate species photo: must be underwater, must name the species.
function speciesMatchOk(file, species) {
  const haystack = norm(`${file.title} ${file.description} ${file.objectName} ${file.categories}`);
  if (!isUnderwater(haystack)) return false;
  // Drop the most-noisy filler so e.g. "reef shark" matches "Caribbean reef shark"
  // and "Grey reef shark" equally.
  const speciesTokens = norm(species)
    .split(" ")
    .filter((t) => t.length >= 4 && !["shark", "fish", "ray"].includes(t));
  // Need at least the distinctive part of the species name in the title or desc.
  const titleOrDesc = norm(`${file.title} ${file.description}`);
  if (speciesTokens.length === 0) {
    // Pure-noise species like just "Shark" — require full phrase.
    return titleOrDesc.includes(norm(species));
  }
  return speciesTokens.every((t) => titleOrDesc.includes(t));
}

// Cache the full ordered candidate LIST per species so we can pick a fresh
// one each time a species repeats. The species-fallback dedupe rule: the same
// photo must never appear on two different sites.
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
    const results = await commonsSearch(q);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!speciesMatchOk(r, species)) continue;
      if (seen.has(r.url)) continue;
      seen.add(r.url);
      candidates.push({ url: r.url, source: `Commons (species): ${r.title}` });
    }
  }
  speciesCandidatesCache.set(key, candidates);
  return candidates;
}

async function findSpeciesPhoto(species, usedUrls) {
  const candidates = await getSpeciesCandidates(species);
  for (const c of candidates) {
    if (!usedUrls.has(c.url)) return c;
  }
  return null;
}

async function findFallbackPhoto(site, usedUrls) {
  // Try species in order of distinctiveness. Heuristic: longer / more-specific
  // names tend to be more visually distinctive (e.g. "Scalloped hammerhead"
  // beats "Shark"). Stable tie-break by original order.
  const species = (site.species || [])
    .map((s) => s.commonName || s.name)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  for (const sp of species) {
    const hit = await findSpeciesPhoto(sp, usedUrls);
    if (hit) return { ...hit, source: `${hit.source}  [species: ${sp}]` };
  }
  return null;
}

// --- Main ----------------------------------------------------------------

function locationWordsFor(loc) {
  if (!loc) return [];
  const raw = [loc.name, loc.country, loc.region].filter(Boolean).join(" ");
  const NOISE = new Set([
    "island", "islands", "sea", "ocean", "national", "park", "reef",
    "the", "and", "of",
  ]);
  return norm(raw)
    .split(" ")
    .filter((t) => t.length >= 4 && !NOISE.has(t));
}

async function main() {
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  let siteHits = 0, speciesHits = 0, unmatched = 0;
  const usedUrls = new Set();

  for (const site of sites) {
    const locWords = locationWordsFor(locById.get(site.locationId));
    let hit = await findSitePhoto(site.name, locWords, usedUrls);
    if (hit) {
      siteHits++;
      console.log(`[site]    ${site.slug} ← ${hit.source}`);
    } else {
      hit = await findFallbackPhoto(site, usedUrls);
      if (hit) {
        speciesHits++;
        console.log(`[species] ${site.slug} ← ${hit.source}`);
      } else {
        unmatched++;
        console.log(`[none]    ${site.slug}`);
      }
    }
    if (hit) usedUrls.add(hit.url);
    site.heroImageUrl = hit ? hit.url : null;
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  console.log(
    `\nDone. Site-specific: ${siteHits} | Species fallback: ${speciesHits} | No photo: ${unmatched} | Total: ${sites.length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
