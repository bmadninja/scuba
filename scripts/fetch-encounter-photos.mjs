#!/usr/bin/env node
/**
 * Add a heroImageUrl to each encounter in src/data/encounters.json.
 *
 * Quality rules (per PRD prd-photo-quality):
 *   Q1  Underwater context word required.
 *   Q2  Minimum source width ≥ 1600 px.
 *   Q3  No specimens, illustrations, surface/aerial shots.
 *   Q5  Global hero uniqueness — shares used-hero-urls.json registry with
 *       fetch-site-photos.mjs to prevent cross-entity hero duplication.
 *
 * Strategy:
 *   1. Reuse a verified site hero when the encounter directly maps to a known site.
 *   2. Query Wikimedia Commons with a targeted species/subject query.
 *   3. null — UI falls back to a gradient placeholder.
 *
 * With --force: re-evaluates every encounter, replacing existing URLs.
 * Without --force: skips any encounter where heroImageUrl is already set.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const ENC_PATH = path.join(ROOT, "src/data/encounters.json");
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const UA = "scubaSeason/0.4 (josie.ty.leung@gmail.com) encounter-photo-fetch";
const FORCE = process.argv.includes("--force");
const MIN_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Q1 — underwater context words.
const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "diving", "scuba", "reef", "coral",
  "subsea", "submerged", "shark", "manta", "ray", "fish", "cuttlefish",
  "ocean", "marine",
];

// Q3 — reject on these terms.
const BAD = [
  "logo", "map", "diagram", "flag", "graph", ".svg", ".pdf", "icon",
  "stamp", "poster", "drawing", "illustration", "specimen", "preserved",
  "museum", "jar", "taxidermy", "aerial", "beach_", "dock", "surface_",
];

const SITE_PREFERENCE = {
  "sardine-run": "moalboal-sardine-run",
  "hammerhead-schools": "wolf-galapagos-shark-bay",
  "whale-sharks": "ningaloo-whale-shark",
  "manta-cleaning-stations": "kona-manta-heaven",
  "thresher-sharks": "malapascua-monad-shoal",
  "mandarin-fish-dusk-spawning": "mabul-paradise-reef",
};

const SEARCH_QUERIES = {
  "great-white-cage-diving": "Carcharodon carcharias underwater",
  "mobula-ray-aggregations": "Mobula ray Sea of Cortez",
  "blackwater-diving": "Larva pelagic ocean night dive",
  "coral-spawning": "Coral spawning Acropora",
  "giant-cuttlefish-aggregation": "Sepia apama giant cuttlefish",
};

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "12",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: String(Math.max(MIN_WIDTH, 2000)),
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
        if (srcWidth > 0 && srcWidth < MIN_WIDTH) return null;
        const meta = info.extmetadata || {};
        const text = `${p.title || ""} ${(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " ")}`.toLowerCase();
        return {
          title: p.title || "",
          url: info.thumburl || info.url,
          srcWidth,
          text,
          index: p.index ?? 99,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);
  } catch {
    return [];
  }
}

function acceptable(candidate) {
  const lowerTitle = candidate.title.toLowerCase();
  if (BAD.some((b) => lowerTitle.includes(b))) return false;
  return UNDERWATER_WORDS.some((w) => candidate.text.includes(w));
}

async function pickPhoto(query) {
  const results = await commonsSearch(query);
  for (const r of results) {
    if (!acceptable(r)) continue;
    if (isUsed(r.url)) continue;
    return r.url;
  }
  return null;
}

async function main() {
  await loadRegistry();

  const encounters = JSON.parse(await fs.readFile(ENC_PATH, "utf8"));
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const siteById = new Map(sites.map((s) => [s.id, s]));

  // Seed registry with existing encounter heroes.
  for (const e of encounters) {
    if (e.heroImageUrl && !isUsed(e.heroImageUrl)) markUsed(e.heroImageUrl, e.slug);
  }

  let hits = 0, misses = 0;

  for (const e of encounters) {
    if (e.heroImageUrl && !FORCE) {
      console.log(`SKIP  ${e.slug}`);
      continue;
    }

    // Clear old URL from this entry (registry retains it as used-by-prior).
    if (FORCE && e.heroImageUrl) delete e.heroImageUrl;

    let url = null;

    // Step 1: borrow from a preferred site's hero.
    const sitePref = SITE_PREFERENCE[e.slug];
    if (sitePref) {
      const s = siteById.get(sitePref);
      if (s?.heroImageUrl && !isUsed(s.heroImageUrl)) {
        url = s.heroImageUrl;
        console.log(`SITE  ${e.slug} ← ${sitePref}`);
      }
    }

    // Step 2: Wikimedia search.
    if (!url) {
      const q = SEARCH_QUERIES[e.slug] ?? `${e.speciesScientific ?? e.speciesCommon ?? e.name} underwater`;
      url = await pickPhoto(q);
      if (url) console.log(`WIKI  ${e.slug} :: ${q}`);
      else { console.log(`MISS  ${e.slug}`); misses++; }
    }

    if (url) {
      e.heroImageUrl = url;
      markUsed(url, e.slug);
      hits++;
    }

    await sleep(400);
  }

  await fs.writeFile(ENC_PATH, JSON.stringify(encounters, null, 2) + "\n");
  await saveRegistry();
  console.log(`\nWrote ${encounters.length} encounters. Hits: ${hits} | Misses: ${misses}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
