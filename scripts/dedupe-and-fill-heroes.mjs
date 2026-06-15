#!/usr/bin/env node
/**
 * Dedupe + fill hero photos so EVERY location and EVERY site has a globally
 * unique, underwater, subject-appropriate hero. No shared fallback image, and
 * no two entities (site or location) ever share a URL.
 *
 * Rules honored:
 *   - Underwater only (context word required in title/description/categories).
 *   - Good quality (min source width; reject specimens/surface/aerial/maps).
 *   - Globally unique (one URL → one entity, across sites AND locations).
 *   - Subject-appropriate: a reef is shown by what it's known for. Sites match
 *     by name then by their signature species; locations match by name+country,
 *     then by their signature species, then by region reef imagery.
 *
 * Sites are authoritative (their photos are most subject-specific). When two
 * sites share a URL, the first keeps it and the rest are re-sourced. Locations
 * never keep a URL that any site uses — they always get their own.
 *
 * Idempotent-ish: an entity is left alone if its current URL is unique and
 * passes the underwater check. Run with --dry to preview without writing.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";
import { pexelsSearch, unsplashSearch } from "./lib/photo-sources.mjs";

// Mirror of src/lib/photo-quality.ts REJECTED_SURFACE_PHOTO_PATTERNS — keep in sync.
const REJECTED_SURFACE_PHOTO_PATTERNS = [
  "a_beautiful_view_of_pigeon_island", "beached_transport", 'bianca_c", genova',
  "burning_guadalcanal", "copernicus", "daedalus_reef_lighthouse",
  "dive_site_1000_steps_curacao", "hirokawa_maru_and_kinugawa_maru_burning",
  "isladeroca", "mnemba_atoll", "petit_piton", "precontinent_ii_-_frontansicht",
  "shinkoku_maru-1941", "the_great_blue_hole_in_belize", "agujero_azul",
];
function isUnderwaterQualityPhoto(url) {
  if (!url) return false;
  let fn = "";
  try {
    const parts = new URL(url).pathname.split("/");
    fn = decodeURIComponent(parts[parts.length - 1] || parts[parts.length - 2] || "")
      .toLowerCase().replace(/^\d+px-/, "").replace(/\s+/g, "_");
  } catch { return false; }
  return !REJECTED_SURFACE_PHOTO_PATTERNS.some((p) => fn.includes(p));
}

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");

const UA = "scubaSeason/0.5 (josie.ty.leung@gmail.com) hero-dedupe-fill";
const DRY = process.argv.includes("--dry");
const MIN_SITE_WIDTH = 1200;
const MIN_LOCATION_WIDTH = 1400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "divers", "diving", "scuba",
  "snorkel", "snorkeling", "snorkelling", "reef", "coral", "wreck",
  "subsea", "submerged", "submarine", "freediv", "cenote", "cavern",
  "cave dive", "blue hole", "school of", "shoal",
];
const BAD_FILE_HINTS = [
  "logo", "map", "chart", "diagram", "flag", "coat_of_arms", "seal_",
  "graph", ".svg", ".pdf", ".tif", ".tiff", ".png", "icon", "postcard",
  "stamp", "poster", "banner", "specimen", "preserved", "museum",
  "collection", "jar", "taxidermy", "illustration", "drawing", "bulletin",
  "aerial", "satellite", "sentinel", "_esa", "esa2", "esa5", "panoramio",
  "beach", "_dock", "surface_", "above_water", "boat", "boats", "harbour",
  "harbor", "lighthouse", "_burning", "copernicus", "airport", "seaplane",
  "fisherman", "battlefield", "observatory", "decompression", "dive_center",
  "dive_centre", "dive center", "dive centre", "all-seeing", "kravana",
  "el_gran_roque", "on_our_way", "tour_of_its", "ruined_cities",
  // Historical scans / very old uploads are rarely real underwater photos.
  "_1919", "_1920", "_1921", "january_1920",
];

function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function isUnderwater(text) {
  const t = norm(text);
  return UNDERWATER_WORDS.some((w) => t.includes(w.replace(/\s+/g, " ")));
}
function looksBad(filename) {
  const lower = (filename || "").toLowerCase();
  return BAD_FILE_HINTS.some((bad) => lower.includes(bad));
}

// Filename (decoded) from a Commons upload/thumb URL, for the keep-decision.
function fileFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "")
      .toLowerCase()
      .replace(/^\d+px-/, "");
  } catch {
    return "";
  }
}

// A currently-stored URL is good enough to keep only if it passes BOTH the
// runtime quality gate and the stricter sourcing blocklist.
function keepable(url) {
  return Boolean(url) && isUnderwaterQualityPhoto(url) && !looksBad(fileFromUrl(url));
}

async function commonsSearch(query, minWidth) {
  const params = new URLSearchParams({
    action: "query", format: "json", generator: "search",
    gsrsearch: `${query} filetype:bitmap`, gsrnamespace: "6", gsrlimit: "20",
    prop: "imageinfo", iiprop: "url|extmetadata|mime|size",
    iiurlwidth: String(Math.max(minWidth, 2000)), origin: "*",
  });
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": UA },
    });
    if (!r.ok) return [];
    const j = await r.json();
    const pages = j.query?.pages;
    if (!pages) return [];
    return Object.values(pages)
      .map((p) => {
        const info = p.imageinfo?.[0];
        if (!info) return null;
        if (info.mime && !info.mime.startsWith("image/")) return null;
        const srcWidth = info.width ?? 0;
        if (srcWidth > 0 && srcWidth < minWidth) return null;
        const meta = info.extmetadata || {};
        return {
          title: p.title || "",
          url: info.thumburl || info.url,
          haystack: norm(
            `${p.title || ""} ${(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " ")} ${meta.ObjectName?.value || ""} ${meta.Categories?.value || ""}`,
          ),
          index: p.index ?? 99,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);
  } catch {
    return [];
  }
}

function freshUnderwaterPick(results) {
  for (const r of results) {
    if (looksBad(r.title)) continue;
    if (!isUnderwater(r.haystack)) continue;
    if (!isUnderwaterQualityPhoto(r.url)) continue;
    if (isUsed(r.url)) continue;
    return r;
  }
  return null;
}

async function searchQueries(queries, minWidth) {
  for (const q of queries) {
    const pick = freshUnderwaterPick(await commonsSearch(q, minWidth));
    if (pick) return { url: pick.url, source: `Commons: ${pick.title}  (q='${q}')` };
    await sleep(280);
  }
  return null;
}

// Signature species for an entity: the species whose common name is the longest
// (proxy for most specific / least generic) and not a bland catch-all.
function signatureSpecies(speciesList) {
  const GENERIC = new Set(["reef fish", "fish", "coral", "hard coral", "soft coral"]);
  return (speciesList || [])
    .map((s) => s.commonName || s.name)
    .filter(Boolean)
    .filter((n) => !GENERIC.has(n.toLowerCase()))
    .sort((a, b) => b.length - a.length);
}

async function fillSite(site, locName) {
  const queries = [
    `"${site.name}" diving`,
    `"${site.name}" underwater`,
    `"${site.name}" reef`,
  ];
  let hit = await searchQueries(queries, MIN_SITE_WIDTH);
  if (hit) return hit;
  // Signature-species fallback.
  for (const sp of signatureSpecies(site.species).slice(0, 4)) {
    hit = await searchQueries(
      [`"${sp}" underwater`, `"${sp}" diving reef`],
      MIN_SITE_WIDTH,
    );
    if (hit) return { url: hit.url, source: `${hit.source} [species: ${sp}]` };
  }

  // Pexels fallback.
  const pexQueries = [
    `${site.name} scuba diving underwater`,
    ...signatureSpecies(site.species).slice(0, 2).map(sp => `${sp} underwater reef`),
  ];
  for (const q of pexQueries) {
    const results = await pexelsSearch(q);
    const pick = results.find(p => p.srcWidth >= MIN_SITE_WIDTH && !isUsed(p.url));
    if (pick) return { url: pick.url, source: pick.source };
    await sleep(350);
  }

  // Unsplash fallback (hotlinked — do not re-host).
  const uQueries = [
    `${site.name} scuba diving underwater`,
    `${locName} coral reef diving underwater`.trim(),
  ].filter(q => q.length > 5);
  for (const q of uQueries) {
    const results = await unsplashSearch(q);
    const pick = results.find(p => p.srcWidth >= MIN_SITE_WIDTH && !isUsed(p.url));
    if (pick) return { url: pick.url, source: pick.source };
    await sleep(350);
  }

  return null;
}

async function fillLocation(loc, locSites) {
  // Species-FIRST for locations. Commons photos that match a location *name*
  // are overwhelmingly topside shots (islands, beaches, airports, boats), so we
  // lead with the location's signature species — a real underwater animal photo
  // of what the reef is known for — which is exactly the product rule.
  const species = signatureSpecies(locSites.flatMap((s) => s.species || [])).slice(0, 6);
  for (const sp of species) {
    const hit = await searchQueries(
      [`"${sp}" underwater`, `"${sp}" diving reef`, `"${sp}" scuba`],
      MIN_LOCATION_WIDTH,
    );
    if (hit) return { url: hit.url, source: `${hit.source} [species: ${sp}]` };
  }
  // Then try the location name (helps cenotes/wrecks with no reef species).
  let hit = await searchQueries(
    [`"${loc.name}" diving underwater`, `"${loc.name}" ${loc.country} reef wreck`],
    MIN_LOCATION_WIDTH,
  );
  if (hit) return hit;
  // Last resort: region/country reef imagery.
  hit = await searchQueries(
    [`${loc.region || loc.country} coral reef underwater`, `${loc.country} reef diving scuba`],
    MIN_LOCATION_WIDTH,
  );
  if (hit) return hit;

  // Pexels fallback.
  const pexLocQueries = [
    `${loc.name} scuba diving underwater`,
    `${loc.country || ""} coral reef diving`.trim(),
    `${loc.region || loc.country || ""} underwater reef`.trim(),
  ].filter(q => q.length > 5);
  for (const q of pexLocQueries) {
    const results = await pexelsSearch(q);
    const pick = results.find(p => p.srcWidth >= MIN_LOCATION_WIDTH && !isUsed(p.url));
    if (pick) return { url: pick.url, source: pick.source };
    await sleep(350);
  }

  // Unsplash fallback (hotlinked — do not re-host).
  const uLocQueries = [
    `${loc.name} scuba diving underwater`,
    `${loc.country || ""} coral reef scuba`.trim(),
  ].filter(q => q.length > 5);
  for (const q of uLocQueries) {
    const results = await unsplashSearch(q);
    const pick = results.find(p => p.srcWidth >= MIN_LOCATION_WIDTH && !isUsed(p.url));
    if (pick) return { url: pick.url, source: pick.source };
    await sleep(350);
  }

  return null;
}

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

  // ── Resolve site URLs first (authoritative). Keep first claimant; re-source
  // any site sharing an already-claimed URL or missing/non-underwater. ───────
  const claimed = new Set();
  const reportSite = [];
  for (const site of sites) {
    const u = site.heroImageUrl;
    const ok = keepable(u) && !claimed.has(u);
    if (ok) {
      claimed.add(u);
      if (!isUsed(u)) markUsed(u, site.slug);
      continue;
    }
    // Needs a fresh, unique photo.
    if (u) delete site.heroImageUrl;
    const locName = locById.get(site.locationId)?.name ?? "";
    const hit = DRY ? null : await fillSite(site, locName);
    if (hit) {
      site.heroImageUrl = hit.url;
      claimed.add(hit.url);
      markUsed(hit.url, site.slug);
      reportSite.push(`[site ✓] ${site.slug} ← ${hit.source}`);
    } else {
      site.heroImageUrl = null;
      reportSite.push(`[site ∅] ${site.slug} (gradient placeholder)`);
    }
  }

  // ── Locations: never reuse a site URL or another location URL. ────────────
  const reportLoc = [];
  for (const loc of locations) {
    const u = loc.heroImageUrl;
    const ok = keepable(u) && !claimed.has(u);
    if (ok) {
      claimed.add(u);
      if (!isUsed(u)) markUsed(u, loc.slug);
      continue;
    }
    if (u) delete loc.heroImageUrl;
    const hit = DRY ? null : await fillLocation(loc, sitesByLoc.get(loc.id) ?? []);
    if (hit) {
      loc.heroImageUrl = hit.url;
      claimed.add(hit.url);
      markUsed(hit.url, loc.slug);
      reportLoc.push(`[loc ✓] ${loc.slug} ← ${hit.source}`);
    } else {
      loc.heroImageUrl = null;
      reportLoc.push(`[loc ∅] ${loc.slug} (gradient placeholder)`);
    }
  }

  console.log("── Sites re-sourced ──");
  reportSite.forEach((l) => console.log(l));
  console.log("\n── Locations re-sourced ──");
  reportLoc.forEach((l) => console.log(l));

  const siteNull = reportSite.filter((l) => l.includes("∅")).length;
  const locNull = reportLoc.filter((l) => l.includes("∅")).length;
  console.log(
    `\nSites touched: ${reportSite.length} (still empty: ${siteNull}) | Locations touched: ${reportLoc.length} (still empty: ${locNull})`,
  );

  if (DRY) {
    console.log("\n[dry run] no files written.");
    return;
  }
  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
  await saveRegistry();
  console.log("\nWrote sites.json, locations.json, used-hero-urls.json.");
}

main().catch((e) => { console.error(e); process.exit(1); });
