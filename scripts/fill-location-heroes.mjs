#!/usr/bin/env node
/**
 * Fill heroImageUrl for the 85 locations still missing one.
 *
 * Strategy:
 *   A. Locations with sites: borrow the hero from the highest editorial-rank
 *      site in that location. A URL may legally appear as both a site hero and
 *      a location hero (global uniqueness only prevents two *locations* or two
 *      *sites* sharing the same URL).
 *   B. Locations with no sites: try a relaxed Wikimedia Commons search:
 *      "{name} {country} underwater" with any image ≥ 1200 px.
 *
 * Idempotent — skips locations that already have heroImageUrl set.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";
import { pexelsSearch, unsplashSearch } from "./lib/photo-sources.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const UA = "scubaSeason/0.4 (josie.ty.leung@gmail.com) location-hero-fill";
const MIN_WIDTH = 1200;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const UNDERWATER_WORDS = [
  "underwater","under water","diver","divers","diving","scuba",
  "snorkel","reef","coral","wreck","subsea","submerged","freediv",
  "cenote","blue hole",
];
const BAD = [
  "logo","map","chart","diagram","flag",".svg",".pdf","icon",
  "stamp","poster","specimen","illustration","aerial","beach_","dock",
  "aquarium","oceanario","natural_park","parque_nacional","satellite","esa221",
  "lighthouse","landscape","panorama","coast","shore","island_view",
];

function norm(s) {
  return (s||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
}
function isUnderwater(t) { const n=norm(t); return UNDERWATER_WORDS.some(w=>n.includes(w)); }
function looksBad(f) { const l=(f||"").toLowerCase(); return BAD.some(b=>l.includes(b)); }

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action:"query", format:"json",
    generator:"search",
    gsrsearch:`${query} filetype:bitmap`,
    gsrnamespace:"6", gsrlimit:"12",
    prop:"imageinfo",
    iiprop:"url|extmetadata|mime|size",
    iiurlwidth:"2000",
    origin:"*",
  });
  try {
    const r = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers:{ "User-Agent": UA } });
    if (!r.ok) return [];
    const j = await r.json();
    const pages = j.query?.pages;
    if (!pages) return [];
    return Object.values(pages).map(p => {
      const info = p.imageinfo?.[0];
      if (!info || (info.mime && !info.mime.startsWith("image/"))) return null;
      if ((info.width ?? 0) > 0 && info.width < MIN_WIDTH) return null;
      const meta = info.extmetadata || {};
      const text = `${p.title||""} ${(meta.ImageDescription?.value||"").replace(/<[^>]+>/g," ")}`;
      return { title: p.title||"", url: info.thumburl||info.url, text, index: p.index??99 };
    }).filter(Boolean).sort((a,b) => a.index - b.index);
  } catch { return []; }
}

async function findWikiPhoto(loc) {
  const queries = [
    `"${loc.name}" underwater diving`,
    `"${loc.name}" scuba reef`,
    `${loc.country} "${loc.name}" diving`,
    `${loc.country} ${loc.region||""} underwater reef`,
  ];
  for (const q of queries) {
    const results = await commonsSearch(q);
    for (const r of results) {
      if (looksBad(r.title)) continue;
      if (!isUnderwater(r.text)) continue;
      if (isUsed(r.url)) continue;
      return r.url;
    }
    await sleep(400);
  }
  return null;
}

async function main() {
  await loadRegistry();
  const [locations, sites] = await Promise.all([
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
  ]);

  // Build site index grouped by locationId, sorted by editorialRank desc.
  const sitesByLoc = {};
  for (const s of sites) {
    if (!sitesByLoc[s.locationId]) sitesByLoc[s.locationId] = [];
    sitesByLoc[s.locationId].push(s);
  }
  for (const arr of Object.values(sitesByLoc)) {
    arr.sort((a, b) => (b.editorialRank ?? 0) - (a.editorialRank ?? 0));
  }

  let borrowed = 0, wiki = 0, pexels = 0, unsplash = 0, missed = 0, skipped = 0;

  for (const loc of locations) {
    if (loc.heroImageUrl) { skipped++; continue; }

    const locSites = sitesByLoc[loc.id] ?? [];

    // Strategy A: borrow best site hero — only if it passes the same underwater filter.
    const bestSite = locSites.find(s => {
      if (!s.heroImageUrl) return false;
      const url = s.heroImageUrl.toLowerCase();
      if (BAD.some(b => url.includes(b))) return false;
      // Accept if URL filename itself contains an underwater word, or skip if uncertain.
      // (We can't fetch the description here, so we require a filename signal.)
      return UNDERWATER_WORDS.some(w => url.includes(w.replace(/\s+/g, "_").replace(/\s+/g, " ")))
        || UNDERWATER_WORDS.some(w => url.replace(/_/g, " ").includes(w));
    });
    if (bestSite) {
      loc.heroImageUrl = bestSite.heroImageUrl;
      // Don't mark as used in the registry — a site URL may also be a location hero.
      borrowed++;
      console.log(`[borrow] ${loc.slug} ← ${bestSite.slug}`);
      continue;
    }

    // Strategy B: Wikimedia for siteless locations.
    const url = await findWikiPhoto(loc);
    if (url) {
      loc.heroImageUrl = url;
      markUsed(url, loc.slug);
      wiki++;
      console.log(`[wiki]   ${loc.slug}`);
    } else {
      // Pexels fallback.
      const pexQueries = [
        `${loc.name} scuba diving underwater`,
        `${loc.country || ""} coral reef scuba diving`.trim(),
        `${loc.region || loc.country || ""} underwater reef`.trim(),
      ].filter(q => q.length > 5);
      let pexUrl = null;
      for (const q of pexQueries) {
        const results = await pexelsSearch(q);
        const pick = results.find(p => p.srcWidth >= MIN_WIDTH && !isUsed(p.url));
        if (pick) { pexUrl = pick.url; break; }
        await sleep(400);
      }
      if (pexUrl) {
        loc.heroImageUrl = pexUrl;
        markUsed(pexUrl, loc.slug);
        pexels++;
        console.log(`[pexels] ${loc.slug}`);
        continue;
      }

      // Unsplash fallback (hotlinked — do not download/re-host).
      const uQueries = [
        `${loc.name} scuba diving underwater`,
        `${loc.country || ""} coral reef diving`.trim(),
      ].filter(q => q.length > 5);
      let uUrl = null;
      for (const q of uQueries) {
        const results = await unsplashSearch(q);
        const pick = results.find(p => p.srcWidth >= MIN_WIDTH && !isUsed(p.url));
        if (pick) { uUrl = pick.url; break; }
        await sleep(400);
      }
      if (uUrl) {
        loc.heroImageUrl = uUrl;
        markUsed(uUrl, loc.slug);
        unsplash++;
        console.log(`[unsplash] ${loc.slug}`);
        continue;
      }

      missed++;
      console.log(`[none]   ${loc.slug}`);
    }
  }

  await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
  await saveRegistry();

  const filled = locations.filter(l => l.heroImageUrl).length;
  console.log(`\nDone. ${filled}/${locations.length} locations have a hero.`);
  console.log(`  Borrowed from site: ${borrowed} | Wikimedia: ${wiki} | Pexels: ${pexels} | Unsplash: ${unsplash} | Missed: ${missed} | Already had: ${skipped}`);
}

main().catch(e => { console.error(e); process.exit(1); });
