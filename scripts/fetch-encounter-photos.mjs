#!/usr/bin/env node
/**
 * Add a heroImageUrl to each encounter in src/data/encounters.json.
 *
 * Strategy:
 *  1. Reuse a verified site photo when the encounter directly maps to a
 *     known site (e.g. sardine-run → moalboal-sardine-run).
 *  2. Otherwise query Wikimedia Commons for the species/subject and
 *     pick the first reasonable underwater photo (mirrors the rules in
 *     fetch-site-photos.mjs).
 *  3. Leave the field null if nothing acceptable found — UI falls back
 *     to a gradient placeholder.
 *
 * Idempotent: re-running keeps any URL already on disk unless --force
 * is passed.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const ENC_PATH = path.join(ROOT, "src/data/encounters.json");
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const UA = "scubaSeason/0.3 (josie.ty.leung@gmail.com) encounter-photo-fetch";
const FORCE = process.argv.includes("--force");

const UNDERWATER_WORDS = [
  "underwater", "under water", "diver", "diving", "scuba", "reef", "coral",
  "subsea", "submerged", "shark", "manta", "ray", "fish", "cuttlefish",
  "ocean", "marine",
];

const BAD = [
  "logo", "map", "diagram", "flag", "graph", ".svg", ".pdf", "icon",
  "stamp", "poster", "drawing", "illustration", "specimen", "preserved",
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
    iiprop: "url|extmetadata|mime",
    iiurlwidth: "2000",
    origin: "*",
  });
  const url = `https://commons.wikimedia.org/w/api.php?${params}`;
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
      const text = `${p.title || ""} ${(meta.ImageDescription?.value || "").replace(/<[^>]+>/g, " ")}`.toLowerCase();
      return {
        title: p.title || "",
        url: info.thumburl || info.url,
        text,
        index: p.index ?? 99,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}

function acceptable(candidate) {
  const lowerTitle = candidate.title.toLowerCase();
  if (BAD.some((b) => lowerTitle.includes(b))) return false;
  return UNDERWATER_WORDS.some((w) => candidate.text.includes(w));
}

async function pickPhoto(query) {
  const results = await commonsSearch(query);
  for (const r of results) {
    if (acceptable(r)) return r.url;
  }
  // No "last resort" — a MISS is better than a specimen-on-white or
  // surface shot. Hero rule: every encounter photo must be underwater.
  // See ~/.claude/projects/.../memory/feedback_hero_must_be_underwater.md
  return null;
}

async function main() {
  const encounters = JSON.parse(await fs.readFile(ENC_PATH, "utf8"));
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const siteById = new Map(sites.map((s) => [s.id, s]));

  for (const e of encounters) {
    if (e.heroImageUrl && !FORCE) {
      console.log(`SKIP  ${e.slug} (already set)`);
      continue;
    }

    let url = null;
    const sitePref = SITE_PREFERENCE[e.slug];
    if (sitePref) {
      const s = siteById.get(sitePref);
      if (s?.heroImageUrl) {
        url = s.heroImageUrl;
        console.log(`SITE  ${e.slug} ← ${sitePref}`);
      }
    }
    if (!url) {
      const q = SEARCH_QUERIES[e.slug] ?? `${e.speciesScientific ?? e.speciesCommon ?? e.name} underwater`;
      url = await pickPhoto(q);
      if (url) console.log(`WIKI  ${e.slug} :: ${q}`);
      else console.log(`MISS  ${e.slug}`);
    }
    if (url) e.heroImageUrl = url;
  }

  await fs.writeFile(ENC_PATH, JSON.stringify(encounters, null, 2) + "\n");
  console.log(`\nWrote ${encounters.length} encounters.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
