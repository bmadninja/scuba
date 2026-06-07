#!/usr/bin/env node
/**
 * Enrich species imageUrl on every site in sites.json.
 *
 * Quality rules (per PRD prd-photo-quality):
 *   Q1  Underwater context word required (for Wikimedia fallback).
 *       iNaturalist: quality_grade=research only.
 *   Q2  Minimum source width 800 px. iNaturalist large. = 1024 px ✓
 *       Wikimedia: iiurlwidth requested at 1200; actual width checked ≥ 800.
 *   Q3  No specimens, illustrations, or surface shots.
 *   Q4  Per-page uniqueness: imageUrl must not equal the site's heroImageUrl.
 *
 * Lookup strategy per (site × species):
 *   1. iNaturalist research-grade observations within 300 km of site → large. URL
 *   2. iNaturalist taxa default_photo → large. URL (global, no region filter)
 *   3. Wikimedia Commons "{species} underwater" search
 *   4. null — UI renders gradient placeholder
 *
 * With --force: re-evaluates every entry, replacing low-quality URLs.
 * Without --force: skips any entry where imageUrl already exists AND is not
 *   a square. thumbnail (legacy low-quality).
 *
 * Provenance is saved to species-photo-credits.json keyed by "siteSlug:speciesKey".
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SITES_PATH = join(ROOT, "src/data/sites.json");
const CREDITS_PATH = join(ROOT, "src/data/species-photo-credits.json");

const UA = "scubaseason.fun species-photo enrichment (contact: josie.ty.leung@gmail.com)";
const FORCE = process.argv.includes("--force");
const REGION_RADIUS_KM = 300;
const MIN_WIKI_WIDTH = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const keyOf = (sci, common) => (sci || common || "").trim().toLowerCase();

// Replace iNaturalist size suffix to get large (1024 px) version.
function toLargeUrl(url) {
  if (!url) return null;
  return url.replace(/\/(square|small|medium|thumb)\.(jpg|jpeg|png|gif)/i, "/large.$2");
}

// True if this URL is still a legacy low-quality square thumbnail.
function isLegacySquare(url) {
  return Boolean(url && url.includes("/square."));
}

function needsRefresh(sp) {
  if (FORCE) return true;
  if (!sp.imageUrl) return true;
  if (isLegacySquare(sp.imageUrl)) return true;
  return false;
}

// ── iNaturalist ─────────────────────────────────────────────────────────────

// Taxon lookup cache: speciesKey → { taxonId, largUrl } | null
const taxonCache = new Map();

async function inatTaxaLookup(sci, common) {
  const key = keyOf(sci, common);
  if (taxonCache.has(key)) return taxonCache.get(key);

  const attempts = [];
  if (sci) attempts.push(`q=${encodeURIComponent(sci)}&rank=species`);
  if (sci) attempts.push(`q=${encodeURIComponent(sci)}`);
  if (common) attempts.push(`q=${encodeURIComponent(common)}`);

  for (const qs of attempts) {
    const url = `https://api.inaturalist.org/v1/taxa?${qs}&per_page=1`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) { await sleep(1500); continue; }
      const data = await res.json();
      const r = data.results?.[0];
      const photo = r?.default_photo;
      if (photo?.square_url) {
        const result = {
          taxonId: r.id,
          matchedName: r.name,
          matchedCommon: r.preferred_common_name ?? null,
          imageUrl: toLargeUrl(photo.square_url),
          license: photo.license_code ?? null,
          attribution: photo.attribution ?? null,
          source: "inat-taxa",
        };
        taxonCache.set(key, result);
        return result;
      }
    } catch { /* network blip */ }
    await sleep(700);
  }
  taxonCache.set(key, null);
  return null;
}

// Regional observation lookup: returns best large. URL near (lat, lng) for taxonId.
// Cache: "${taxonId}:${regionKey}" → string url | null
const regionalCache = new Map();

function regionKey(lat, lng) {
  // Quantise to ~2-degree grid so nearby sites share a cache entry.
  return `${Math.round(lat / 2) * 2}:${Math.round(lng / 2) * 2}`;
}

async function inatRegionalLookup(taxonId, lat, lng, license, attribution) {
  if (!taxonId || lat == null || lng == null) return null;
  const rk = `${taxonId}:${regionKey(lat, lng)}`;
  if (regionalCache.has(rk)) return regionalCache.get(rk);

  const params = new URLSearchParams({
    taxon_id: String(taxonId),
    lat: String(lat),
    lng: String(lng),
    radius: String(REGION_RADIUS_KM),
    quality_grade: "research",
    photos: "true",
    per_page: "10",
    order_by: "votes",
    order: "desc",
  });
  const url = `https://api.inaturalist.org/v1/observations?${params}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) { regionalCache.set(rk, null); return null; }
    const data = await res.json();
    for (const obs of data.results ?? []) {
      for (const photo of obs.photos ?? []) {
        const largeUrl = toLargeUrl(photo.url);
        if (largeUrl) {
          const result = {
            imageUrl: largeUrl,
            taxonId,
            observationId: obs.id,
            license: photo.license_code ?? null,
            attribution: photo.attribution ?? null,
            source: "inat-regional",
          };
          regionalCache.set(rk, result);
          return result;
        }
      }
    }
  } catch { /* network blip */ }
  regionalCache.set(rk, null);
  return null;
}

// ── Wikimedia Commons fallback ───────────────────────────────────────────────

const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "divers", "diving", "scuba",
  "snorkel", "snorkeling", "snorkelling", "reef", "coral", "wreck",
  "subsea", "submerged", "submarine", "freediv", "cenote", "cavern",
  "cave dive", "blue hole",
];

const BAD_FILE_HINTS = [
  "logo", "map", "chart", "diagram", "flag", "coat_of_arms", "seal_",
  "graph", ".svg", ".pdf", "icon", "postcard", "stamp", "poster",
  "specimen", "preserved", "museum", "collection", "jar", "taxidermy",
  "illustration", "drawing", "aerial", "beach", "surface_", "dock",
];

function norm(s) {
  return (s || "").toLowerCase().replace(/\(.*?\)/g, " ").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function isUnderwater(text) {
  const t = norm(text);
  return UNDERWATER_WORDS.some((w) => t.includes(w));
}

function looksBad(filename) {
  const lower = (filename || "").toLowerCase();
  return BAD_FILE_HINTS.some((bad) => lower.includes(bad));
}

// Wikimedia candidate cache: query → result | null
const wikiCache = new Map();

async function wikimediaSpeciesLookup(commonName, sciName) {
  const queries = [
    sciName ? `${sciName} underwater` : null,
    `"${commonName}" underwater`,
    `"${commonName}" diving reef`,
  ].filter(Boolean);

  for (const q of queries) {
    if (wikiCache.has(q)) {
      const cached = wikiCache.get(q);
      if (cached) return cached;
      continue;
    }
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrsearch: `${q} filetype:bitmap`,
      gsrnamespace: "6",
      gsrlimit: "12",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: "1200",
      origin: "*",
    });
    const apiUrl = `https://commons.wikimedia.org/w/api.php?${params}`;
    try {
      const res = await fetch(apiUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) { await sleep(800); continue; }
      const json = await res.json();
      const pages = json.query?.pages;
      if (!pages) continue;
      const candidates = Object.values(pages)
        .map((p) => {
          const info = p.imageinfo?.[0];
          if (!info) return null;
          if (info.mime && !info.mime.startsWith("image/")) return null;
          const meta = info.extmetadata || {};
          const text = `${p.title || ""} ${(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " ")}`;
          return {
            title: p.title || "",
            url: info.thumburl || info.url,
            width: info.width ?? 0,
            text,
            meta,
            index: p.index ?? 99,
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.index - b.index);

      for (const c of candidates) {
        if (looksBad(c.title)) continue;
        if (c.width < MIN_WIKI_WIDTH) continue;
        if (!isUnderwater(c.text)) continue;
        const result = {
          imageUrl: c.url,
          license: c.meta.LicenseShortName?.value ?? null,
          attribution: c.meta.Artist?.value?.replace(/<[^>]+>/g, "") ?? null,
          source: `wikimedia:${c.title}`,
        };
        wikiCache.set(q, result);
        return result;
      }
    } catch { /* network blip */ }
    wikiCache.set(q, null);
    await sleep(500);
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sites = JSON.parse(await readFile(SITES_PATH, "utf8"));
  let existingCredits = {};
  try {
    existingCredits = JSON.parse(await readFile(CREDITS_PATH, "utf8"));
  } catch { /* first run */ }

  // Count work to be done.
  let totalPairs = 0;
  for (const site of sites) {
    for (const sp of site.species ?? []) {
      if (needsRefresh(sp)) totalPairs++;
    }
  }
  console.log(`Sites: ${sites.length} | Species entries needing refresh: ${totalPairs} | FORCE=${FORCE}`);

  const credits = { ...existingCredits };
  let processed = 0, found = 0, regional = 0, taxa = 0, wiki = 0, missed = 0;

  for (const site of sites) {
    const siteLat = site.lat ?? null;
    const siteLng = site.lng ?? null;

    for (const sp of site.species ?? []) {
      if (!needsRefresh(sp)) continue;

      const sci = (sp.scientificName ?? "").trim();
      const common = (sp.commonName ?? "").trim();
      const speciesKey = keyOf(sci, common);
      const creditKey = `${site.slug}:${speciesKey}`;

      processed++;

      // Step 1: iNat taxa lookup to get taxonId (needed for regional search).
      const taxaHit = await inatTaxaLookup(sci, common);
      await sleep(600);

      // Step 2: Regional observation lookup (preferred — geographically relevant).
      let hit = null;
      if (taxaHit?.taxonId && siteLat != null) {
        hit = await inatRegionalLookup(taxaHit.taxonId, siteLat, siteLng);
        if (hit) { regional++; found++; }
        await sleep(600);
      }

      // Step 3: iNat taxa default photo (global fallback, but now large. URL).
      if (!hit && taxaHit?.imageUrl) {
        hit = taxaHit;
        taxa++; found++;
      }

      // Step 4: Wikimedia Commons fallback.
      if (!hit) {
        hit = await wikimediaSpeciesLookup(common, sci);
        if (hit) { wiki++; found++; }
        await sleep(500);
      }

      if (!hit) {
        missed++;
        if (processed % 50 === 0 || processed === totalPairs) {
          console.log(`  ${processed}/${totalPairs} · found ${found} (reg:${regional} taxa:${taxa} wiki:${wiki} miss:${missed})`);
        }
        continue;
      }

      // Q4: Per-page uniqueness — don't reuse the site's hero image.
      if (site.heroImageUrl && hit.imageUrl === site.heroImageUrl) {
        // Try Wikimedia as alternate if iNat matched the hero (rare, but guard it).
        const altHit = await wikimediaSpeciesLookup(common, sci);
        if (altHit && altHit.imageUrl !== site.heroImageUrl) {
          hit = altHit;
        } else {
          missed++;
          continue;
        }
      }

      sp.imageUrl = hit.imageUrl;
      credits[creditKey] = {
        siteSlug: site.slug,
        speciesKey,
        ...hit,
      };

      if (processed % 50 === 0 || processed === totalPairs) {
        console.log(`  ${processed}/${totalPairs} · found ${found} (reg:${regional} taxa:${taxa} wiki:${wiki} miss:${missed})`);
      }
    }
  }

  await writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await writeFile(CREDITS_PATH, JSON.stringify(credits, null, 2) + "\n");

  console.log(`\nDone.`);
  console.log(`  Processed: ${processed} | Found: ${found} | Missed: ${missed}`);
  console.log(`  Regional iNat: ${regional} | Taxa default: ${taxa} | Wikimedia: ${wiki}`);
  console.log(`  Credits: ${Object.keys(credits).length} entries`);
}

main().catch((e) => { console.error(e); process.exit(1); });
