#!/usr/bin/env node
/**
 * Localize Ocean Image Bank hero photos at display resolution.
 *
 * Problem: heroes sourced by fetch-ocean-image-bank.mjs point at
 * d1qsp4j04beddk.cloudfront.net — OIB's *preview* CDN, which serves every file
 * at 750px wide. Full-bleed heroes upscale that ~2.7x and look blurry.
 *
 * OIB's download CDN (d2zmi9say0r1yj.cloudfront.net) serves the full-res
 * original (~4000px, ~10MB) under the same filename. Hotlinking those would
 * tank page loads, so instead we:
 *   1. Collect every unique OIB filename referenced by locations.json/sites.json.
 *   2. Download the full-res original (falling back to the 750px preview if a
 *      file is missing from the download CDN).
 *   3. Resize with sharp to two self-hosted WebP variants:
 *        public/heroes/<base>-1920.webp   (heroes)
 *        public/heroes/<base>-800.webp    (cards/thumbnails)
 *   4. Rewrite heroImageUrl / heroImages entries to /heroes/<base>-1920.webp.
 *      resizePhotoUrl() in src/lib/photo-quality.ts swaps -1920 → -800 for
 *      small targets.
 *   5. Save photographer credits (from OIB's Prismic API) to
 *      src/data/hero-photo-credits.json keyed by original filename.
 *
 * Run:
 *   node scripts/localize-oib-heroes.mjs          # full run
 *   node scripts/localize-oib-heroes.mjs --dry    # report what would change
 */

import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const CREDITS_PATH = path.join(ROOT, "src/data/hero-photo-credits.json");
const HEROES_DIR = path.join(ROOT, "public/heroes");

const PREVIEW_CDN = "https://d1qsp4j04beddk.cloudfront.net";
const FULLRES_CDN = "https://d2zmi9say0r1yj.cloudfront.net";
const PRISMIC_API = "https://ocean-agency-cms.prismic.io/api/v2";
const PRISMIC_GQL = "https://ocean-agency-cms.prismic.io/graphql";

const UA = "scubaseason.fun hero enrichment (contact: josie.ty.leung@gmail.com)";
const DRY = process.argv.includes("--dry");
const CONCURRENCY = 6;
const HERO_WIDTH = 1920;
const CARD_WIDTH = 800;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function oibFilename(url) {
  if (typeof url !== "string" || !url.startsWith(`${PREVIEW_CDN}/`)) return null;
  return decodeURIComponent(url.slice(PREVIEW_CDN.length + 1));
}

function baseName(filename) {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

function localHeroUrl(filename) {
  return `/heroes/${baseName(filename)}-${HERO_WIDTH}.webp`;
}

// ── Download + resize ─────────────────────────────────────────────────────────

async function fetchImage(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.status === 403 || r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      const type = r.headers.get("content-type") || "";
      if (!type.startsWith("image/")) return null;
      return buf;
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1500 * attempt);
    }
  }
  return null;
}

async function processOne(filename, stats) {
  const base = baseName(filename);
  const heroOut = path.join(HEROES_DIR, `${base}-${HERO_WIDTH}.webp`);
  const cardOut = path.join(HEROES_DIR, `${base}-${CARD_WIDTH}.webp`);

  // Skip work already done (idempotent re-runs)
  const exists = await fs
    .access(heroOut)
    .then(() => true)
    .catch(() => false);
  if (exists) {
    stats.skipped++;
    return true;
  }

  const encoded = encodeURIComponent(filename);
  let buf = await fetchImage(`${FULLRES_CDN}/${encoded}`);
  let source = "full-res";
  if (!buf) {
    // Fall back to the 750px preview — still worth self-hosting for cards,
    // and no worse than today for heroes.
    buf = await fetchImage(`${PREVIEW_CDN}/${encoded}`);
    source = "preview";
  }
  if (!buf) {
    stats.failed.push(filename);
    return false;
  }

  const img = sharp(buf, { failOn: "none" }).rotate();
  const meta = await img.metadata();
  if (source === "full-res" && (meta.width ?? 0) < 1000) source = "small-original";

  await img
    .clone()
    .resize({ width: HERO_WIDTH, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toFile(heroOut);
  await img
    .clone()
    .resize({ width: CARD_WIDTH, withoutEnlargement: true })
    .webp({ quality: 70 })
    .toFile(cardOut);

  stats.done++;
  stats.bySource[source] = (stats.bySource[source] || 0) + 1;
  if (stats.done % 25 === 0)
    console.log(`  ${stats.done} converted (${stats.skipped} skipped, ${stats.failed.length} failed)`);
  return true;
}

async function runPool(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

// ── Credits from Prismic ──────────────────────────────────────────────────────

async function fetchCredits() {
  try {
    const refRes = await fetch(PRISMIC_API, { headers: { "User-Agent": UA } });
    const refJson = await refRes.json();
    const ref = refJson.refs.find((x) => x.id === "master").ref;

    const credits = {};
    let cursor = "";
    while (true) {
      const q = `query{
        allImages(fulltext:"",after:"${cursor}",first:100){
          pageInfo{hasNextPage endCursor}
          edges{node{name credits{author}}}
        }
      }`;
      const r = await fetch(`${PRISMIC_GQL}?query=${encodeURI(q.trim())}`, {
        headers: { "Prismic-Ref": ref, Accept: "application/json", "User-Agent": UA },
      });
      const d = await r.json();
      const page = d?.data?.allImages;
      if (!page) break;
      for (const { node } of page.edges) {
        const author = node.credits?.[0]?.author;
        if (node.name && author) credits[node.name] = author;
      }
      if (!page.pageInfo.hasNextPage) break;
      cursor = page.pageInfo.endCursor;
      await sleep(200);
    }
    return credits;
  } catch (err) {
    console.warn(`Credits fetch failed (non-fatal): ${err.message}`);
    return {};
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const locations = JSON.parse(await fs.readFile(LOCATIONS_PATH, "utf8"));

  // Collect unique OIB filenames across heroImageUrl and heroImages[]
  const filenames = new Set();
  const collect = (url) => {
    const f = oibFilename(url);
    if (f) filenames.add(f);
  };
  for (const entity of [...sites, ...locations]) {
    collect(entity.heroImageUrl);
    for (const u of entity.heroImages || []) collect(u);
  }

  console.log(`OIB preview-CDN heroes referenced: ${filenames.size} unique files`);
  if (DRY) {
    for (const f of [...filenames].slice(0, 10)) console.log(`  ${f} → ${localHeroUrl(f)}`);
    console.log("  … (--dry, stopping before download)");
    return;
  }

  await fs.mkdir(HEROES_DIR, { recursive: true });

  const stats = { done: 0, skipped: 0, failed: [], bySource: {} };
  await runPool([...filenames], (f) => processOne(f, stats));

  console.log(
    `\nConverted ${stats.done}, skipped ${stats.skipped} (already local), failed ${stats.failed.length}`,
  );
  console.log(`Sources: ${JSON.stringify(stats.bySource)}`);
  if (stats.failed.length) console.log(`Failed files:\n  ${stats.failed.join("\n  ")}`);

  // Rewrite data URLs — only for files that were actually produced
  const converted = new Set(
    [...filenames].filter((f) => !stats.failed.includes(f)),
  );
  let rewrites = 0;
  const rewrite = (url) => {
    const f = oibFilename(url);
    if (f && converted.has(f)) {
      rewrites++;
      return localHeroUrl(f);
    }
    return url;
  };
  for (const entity of [...sites, ...locations]) {
    if (entity.heroImageUrl) entity.heroImageUrl = rewrite(entity.heroImageUrl);
    if (entity.heroImages)
      entity.heroImages = entity.heroImages.map((u) => rewrite(u));
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
  console.log(`Rewrote ${rewrites} hero URLs in sites.json + locations.json`);

  // Photographer credits (OIB terms require attribution)
  console.log("Fetching photographer credits from OIB…");
  const allCredits = await fetchCredits();
  const used = {};
  for (const f of converted) {
    if (allCredits[f]) used[f] = allCredits[f];
  }
  await fs.writeFile(CREDITS_PATH, JSON.stringify(used, null, 2) + "\n");
  console.log(`Saved ${Object.keys(used).length} credits to hero-photo-credits.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
