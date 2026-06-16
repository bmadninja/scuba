#!/usr/bin/env node
/**
 * Audit all hero photos using Google Cloud Vision API label detection.
 * Flags photos that are clearly above water (sky, boat, beach, aerial)
 * and outputs a report with replacement suggestions.
 *
 * Run:
 *   GOOGLE_VISION_KEY=xxx node scripts/audit-photos-vision.mjs
 *   GOOGLE_VISION_KEY=xxx node scripts/audit-photos-vision.mjs --fix   # auto-replace flagged
 *   GOOGLE_VISION_KEY=xxx node scripts/audit-photos-vision.mjs --limit=50
 *
 * Free tier: 1,000 images/month — enough to cover all sites + locations.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const REPORT_PATH = path.join(ROOT, "src/data/photo-audit-report.json");

const KEY = process.env.GOOGLE_VISION_KEY;
const FIX = process.argv.includes("--fix");
const DRY = process.argv.includes("--dry");
const LIMIT = (() => {
  const a = process.argv.find((a) => a.startsWith("--limit="));
  return a ? parseInt(a.split("=")[1]) : Infinity;
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Labels that strongly indicate above-water content
const SURFACE_LABELS = new Set([
  "Sky", "Cloud", "Horizon", "Sunlight", "Sunrise", "Sunset", "Atmosphere",
  "Boat", "Watercraft", "Vehicle", "Ship", "Sailboat", "Motor vehicle",
  "Beach", "Coast", "Shore", "Sand", "Shoreline",
  "Tree", "Plant", "Vegetation", "Forest", "Jungle", "Palm tree",
  "Building", "Architecture", "House",
  "Bird", "Seagull",
  "Aerial photography", "Bird's eye view",
]);

// Labels that confirm underwater content
const UNDERWATER_LABELS = new Set([
  "Underwater", "Coral reef", "Coral", "Reef", "Marine biology",
  "Organism", "Invertebrate", "Fish", "Marine mammal",
  "Scuba diving", "Diver", "Snorkeling",
  "Wreck", "Shipwreck",
]);

async function classifyImage(imageUrl) {
  const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${KEY}`;
  const body = {
    requests: [{
      image: { source: { imageUri: imageUrl } },
      features: [{ type: "LABEL_DETECTION", maxResults: 15 }],
    }],
  };

  try {
    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const text = await r.text();
      return { error: `HTTP ${r.status}: ${text.slice(0, 200)}` };
    }
    const data = await r.json();
    const labels = (data.responses?.[0]?.labelAnnotations ?? []).map((l) => ({
      label: l.description,
      score: Math.round(l.score * 100),
    }));
    return { labels };
  } catch (e) {
    return { error: e.message };
  }
}

function verdict(labels) {
  if (!labels?.length) return "unknown";
  const labelNames = new Set(labels.map((l) => l.label));

  const surfaceHits = [...labelNames].filter((l) => SURFACE_LABELS.has(l));
  const underwaterHits = [...labelNames].filter((l) => UNDERWATER_LABELS.has(l));

  if (underwaterHits.length > 0 && surfaceHits.length === 0) return "underwater";
  if (surfaceHits.length > 0 && underwaterHits.length === 0) return "surface";
  if (surfaceHits.length > 0 && underwaterHits.length > 0) return "mixed"; // split-level shots
  return "unknown";
}

async function pexelsFallback(species, slug) {
  const queries = [
    species[0] && species[1] ? `${species[0]} ${species[1]} underwater reef` : null,
    species[0] ? `${species[0]} scuba diving underwater` : null,
    "coral reef scuba diving fish underwater",
  ].filter(Boolean);

  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 20 });
    await sleep(350);
    for (const r of results) {
      if (r.srcWidth < 2000 || isUsed(r.url)) continue;
      return r.url;
    }
  }
  return null;
}

async function main() {
  if (!KEY) { console.error("GOOGLE_VISION_KEY not set"); process.exit(1); }

  await loadRegistry();
  const [sites, locations] = await Promise.all([
    fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
    fs.readFile(LOCATIONS_PATH, "utf8").then(JSON.parse),
  ]);

  // Collect all entities to audit (dedupe by URL)
  const entities = [];
  const seenUrls = new Set();

  for (const s of sites) {
    const urls = [s.heroImageUrl, ...(s.heroImages ?? [])].filter(Boolean);
    for (const url of urls) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        entities.push({ type: "site", slug: s.slug, url, site: s, isHero: url === s.heroImageUrl });
      }
    }
  }
  for (const l of locations) {
    const urls = [l.heroImageUrl, ...(l.heroImages ?? [])].filter(Boolean);
    for (const url of urls) {
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        entities.push({ type: "location", slug: l.slug, url, loc: l, isHero: url === l.heroImageUrl });
      }
    }
  }

  const toAudit = entities.slice(0, LIMIT);
  console.log(`Auditing ${toAudit.length} unique photo URLs via Google Vision…\n`);

  const report = { audited: 0, underwater: 0, surface: 0, mixed: 0, unknown: 0, fixed: 0, flagged: [] };

  for (const entity of toAudit) {
    process.stdout.write(`[${report.audited + 1}/${toAudit.length}] ${entity.slug} … `);
    const result = await classifyImage(entity.url);
    await sleep(100);

    if (result.error) {
      console.log(`ERROR: ${result.error}`);
      continue;
    }

    const v = verdict(result.labels);
    report.audited++;
    report[v] = (report[v] ?? 0) + 1;

    const topLabels = result.labels.slice(0, 5).map((l) => `${l.label}(${l.score}%)`).join(", ");

    if (v === "surface") {
      console.log(`SURFACE ❌  [${topLabels}]`);
      report.flagged.push({ slug: entity.slug, type: entity.type, url: entity.url, isHero: entity.isHero, labels: result.labels.slice(0, 8) });

      if (FIX && entity.isHero && !DRY) {
        const species = (entity.site?.species ?? []).slice(0, 3).map((s) => (s.commonName || s.name || "").toLowerCase()).filter(Boolean);
        const replacement = await pexelsFallback(species, entity.slug);
        if (replacement) {
          if (entity.site) {
            entity.site.heroImageUrl = replacement;
            if (entity.site.heroImages?.length) entity.site.heroImages[0] = replacement;
          } else if (entity.loc) {
            entity.loc.heroImageUrl = replacement;
            if (entity.loc.heroImages?.length) entity.loc.heroImages[0] = replacement;
          }
          markUsed(replacement, entity.slug);
          report.fixed++;
          console.log(`  → fixed with Pexels: ${replacement.slice(0, 70)}`);
        }
      }
    } else if (v === "mixed") {
      console.log(`MIXED  ⚠️   [${topLabels}]`);
    } else {
      console.log(`OK ✓       [${topLabels}]`);
    }
  }

  // Save report
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");

  if (FIX && !DRY) {
    await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    await fs.writeFile(LOCATIONS_PATH, JSON.stringify(locations, null, 2) + "\n");
    await saveRegistry();
    console.log("\nWrote updated data files.");
  }

  console.log(`
── Summary ──────────────────────────────
Audited:    ${report.audited}
Underwater: ${report.underwater} ✓
Surface:    ${report.surface} ❌  (above-water, needs fixing)
Mixed:      ${report.mixed} ⚠️   (split-level shots, review manually)
Unknown:    ${report.unknown}
Fixed:      ${report.fixed}

Report saved to src/data/photo-audit-report.json
`);
}

main().catch((e) => { console.error(e); process.exit(1); });
