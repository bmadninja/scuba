#!/usr/bin/env node
// For each gear item, find a real photograph via Wikimedia Commons.
//
// Strategy (per item, first hit wins):
//   1. Search Commons by the item's brand+model (rare hits, very specific).
//   2. Fall back to a curated category query ("scuba mask", "diving fins").
//
// Writes `imageUrl` into src/data/gear.json. Items that fail both passes get
// imageUrl = null so the UI can render its emoji fallback.
//
// Run: node scripts/fetch-gear-photos.mjs

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const GEAR_PATH = path.join(ROOT, "src/data/gear.json");
const UA = "scubaSeason/0.2 (josie.ty.leung@gmail.com) gear-photo-fetch";

const BAD_HINTS = [
  "logo", "diagram", "map", "chart", ".svg", ".pdf", "icon", "drawing",
  "sketch", "1800s", "1900", "illustrated", "engraving", "painting", "stamp",
  "coin", "patch", "poster", "advertisement", "flag", "coat_of_arms",
];

// Category-level fallback queries — real photos of the equipment type.
// `titleKeywords` MUST appear (case-insensitive) in the file title, otherwise
// the result is rejected as off-topic.
const CATEGORY_RULES = {
  mask:       { queries: ["scuba diving mask", "dive mask underwater"], titleKeywords: ["mask"] },
  snorkel:    { queries: ["snorkel equipment", "snorkel mask"], titleKeywords: ["snorkel"] },
  fins:       { queries: ["scuba diving fins", "swim fins diving"], titleKeywords: ["fin"] },
  boots:      { queries: ["dive boots neoprene", "scuba booties"], titleKeywords: ["boot", "booti"] },
  wetsuit:    { queries: ["wetsuit diving neoprene", "scuba wetsuit"], titleKeywords: ["wetsuit", "wet suit", "diving suit", "neoprene"] },
  drysuit:    { queries: ["drysuit diving", "scuba drysuit"], titleKeywords: ["drysuit", "dry suit"] },
  bcd:        { queries: ["buoyancy compensator scuba", "scuba BCD"], titleKeywords: ["bcd", "buoyancy", "compensator"] },
  regulator:  { queries: ["scuba regulator", "diving regulator first stage"], titleKeywords: ["regulator"] },
  computer:   { queries: ["dive computer wrist", "scuba dive computer"], titleKeywords: ["computer", "console"] },
  light:      { queries: ["diving torch underwater", "scuba dive light"], titleKeywords: ["torch", "light", "lamp"] },
  "reel-smb": { queries: ["surface marker buoy diving", "diving SMB inflated"], titleKeywords: ["smb", "marker buoy", "dsmb", "spool", "reel"] },
  "reef-hook": { queries: ["reef hook diving", "scuba reef hook"], titleKeywords: ["hook"] },
  gloves:     { queries: ["diving gloves neoprene", "scuba gloves"], titleKeywords: ["glove", "guanti"] },
  hood:       { queries: ["diving hood neoprene", "scuba hood neoprene"], titleKeywords: ["hood", "neoprene"] },
  bag:        { queries: ["scuba dive bag", "dive equipment bag"], titleKeywords: ["bag", "luggage"] },
  specialty:  { queries: ["scuba diving equipment"], titleKeywords: ["scuba", "diving", "dive"] },
};

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata|mime|size",
    iiurlwidth: "1200",
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
        return {
          title: p.title || "",
          url: info.thumburl || info.url,
          width: info.thumbwidth || info.width || 0,
          height: info.thumbheight || info.height || 0,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function looksBad(filename) {
  const lower = filename.toLowerCase();
  return BAD_HINTS.some((bad) => lower.includes(bad));
}

async function pickFirst(query, titleKeywords) {
  const results = await commonsSearch(query);
  for (const r of results) {
    if (looksBad(r.title)) continue;
    if (r.width && r.width < 600) continue;
    if (r.width && r.height && r.height > r.width * 1.5) continue;
    if (titleKeywords && titleKeywords.length > 0) {
      const titleLower = r.title.toLowerCase();
      if (!titleKeywords.some((k) => titleLower.includes(k))) continue;
    }
    return { url: r.url, source: `Commons: ${r.title}` };
  }
  return null;
}

async function findPhoto(item) {
  const rule = CATEGORY_RULES[item.category] || { queries: [item.category], titleKeywords: [] };
  // 1) Brand+model name — only accept if title also contains a category keyword.
  const nameHit = await pickFirst(`"${item.name}"`, rule.titleKeywords);
  if (nameHit) return nameHit;
  // 2) Category fallback queries — same title-keyword guard.
  for (const q of rule.queries) {
    const hit = await pickFirst(q, rule.titleKeywords);
    if (hit) return hit;
  }
  return null;
}

async function main() {
  const raw = await fs.readFile(GEAR_PATH, "utf8");
  const gear = JSON.parse(raw);

  let hits = 0;
  let misses = 0;
  for (const item of gear) {
    if (item.imageUrl) {
      console.log(`✓ ${item.id} (already set)`);
      hits++;
      continue;
    }
    const result = await findPhoto(item);
    if (result) {
      item.imageUrl = result.url;
      console.log(`✓ ${item.id} <- ${result.source}`);
      hits++;
    } else {
      item.imageUrl = null;
      console.log(`✗ ${item.id} (no photo)`);
      misses++;
    }
    // Be polite to Wikimedia.
    await new Promise((res) => setTimeout(res, 250));
  }

  await fs.writeFile(GEAR_PATH, JSON.stringify(gear, null, 2) + "\n");
  console.log(`\nDone: ${hits} hits, ${misses} misses`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
