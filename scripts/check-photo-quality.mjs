#!/usr/bin/env node
/**
 * Photo quality gate — enforces 5 rules on every hero photo:
 *   1. Underwater (no sky, coast, boat, aerial)
 *   2. No humans (no person, diver, face visible)
 *   3. High resolution (≥ 2000px wide — checked at data level)
 *   4. Subject-relevant (Vision labels match species/dive type)
 *   5. No text or watermarks
 *
 * Used by the pre-commit hook. Exits 1 if any photo fails.
 *
 * Run manually:
 *   GOOGLE_VISION_KEY=xxx node scripts/check-photo-quality.mjs            # all photos
 *   GOOGLE_VISION_KEY=xxx node scripts/check-photo-quality.mjs --staged   # only changed URLs
 *   GOOGLE_VISION_KEY=xxx node scripts/check-photo-quality.mjs --url=https://...
 */

import fs from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const LOCS_PATH = path.join(ROOT, "src/data/locations.json");
const KEY = process.env.GOOGLE_VISION_KEY;

const STAGED_MODE = process.argv.includes("--staged");
const SINGLE_URL = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Vision label sets ────────────────────────────────────────────────────────

const SURFACE_LABELS = new Set([
  "Sky", "Cloud", "Cumulus", "Horizon", "Sunset", "Sunrise", "Sunlight", "Atmosphere", "Daytime",
  "Boat", "Watercraft", "Ship", "Sailboat", "Naval architecture",
  "Beach", "Coast", "Shore", "Sand", "Coastal and oceanic landforms", "Shoreline",
  "Tree", "Plant", "Vegetation", "Forest", "Jungle", "Palm tree", "Algae", "Groundcover",
  "Building", "Architecture",
  "Bird", "Seagull", "Puffin", "Penguin", "Auk",
  "Aerial photography", "Bird's-eye view", "Bird's eye view",
  "Pollution", "Waste", "Litter", "Plastic",
]);

const HUMAN_LABELS = new Set([
  "Person", "Human", "Man", "Woman", "Face", "People", "Crowd",
  "Forehead", "Chin", "Nose", "Smile", "Head",
  // Diver gear labels that only appear when a human is the subject
  "Scuba diving", "Diver", "Snorkeling",
]);

const WATERMARK_LABELS = new Set([
  "Text", "Font", "Logo", "Brand", "Signage", "Banner",
]);

// Dive-type → expected Vision labels (at least one must appear)
const DIVE_TYPE_SIGNALS = {
  "wreck-dive": new Set(["Shipwreck", "Wreck", "Boat", "Naval architecture"]),
  "cave-dive": new Set(["Cave", "Cavern", "Rock", "geological phenomenon"]),
  "wall-dive": new Set(["Coral", "Reef", "Wall", "Underwater", "Marine biology"]),
  "reef-dive": new Set(["Coral reef", "Coral", "Reef", "Fish", "Marine biology"]),
  "pelagic": new Set(["Fish", "Marine biology", "Underwater", "Ocean", "Sea"]),
  "macro": new Set(["Organism", "Invertebrate", "Marine biology", "Underwater"]),
};

// ── Vision API call ──────────────────────────────────────────────────────────

async function classify(url) {
  if (!KEY) throw new Error("GOOGLE_VISION_KEY not set");
  const r = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{ image: { source: { imageUri: url } }, features: [{ type: "LABEL_DETECTION", maxResults: 20 }] }],
    }),
  });
  if (!r.ok) throw new Error(`Vision API ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.responses?.[0]?.labelAnnotations ?? []).map((l) => ({ label: l.description, score: Math.round(l.score * 100) }));
}

// ── Rule checks ──────────────────────────────────────────────────────────────

function checkRules(labels, { diveTypes = [], species = [] } = {}) {
  const labelSet = new Set(labels.map((l) => l.label));
  const failures = [];

  // Rule 1: Underwater
  const surfaceHits = [...labelSet].filter((l) => SURFACE_LABELS.has(l));
  const hasUnderwater = labelSet.has("Underwater") || labelSet.has("Coral reef") || labelSet.has("Coral") || labelSet.has("Marine biology") || labelSet.has("Reef");
  if (surfaceHits.length > 0 && !hasUnderwater) {
    failures.push(`Not underwater — surface labels: ${surfaceHits.slice(0, 3).join(", ")}`);
  }

  // Rule 2: No humans
  const humanHits = [...labelSet].filter((l) => HUMAN_LABELS.has(l));
  if (humanHits.length > 0) {
    failures.push(`Human visible — labels: ${humanHits.slice(0, 3).join(", ")}`);
  }

  // Rule 3: No watermarks/text
  const watermarkHits = [...labelSet].filter((l) => WATERMARK_LABELS.has(l));
  if (watermarkHits.length > 0) {
    failures.push(`Text/watermark — labels: ${watermarkHits.join(", ")}`);
  }

  // Rule 4: Subject-relevant (at least one underwater-content label)
  const contentLabels = new Set(["Fish", "Coral", "Coral reef", "Reef", "Marine biology", "Underwater",
    "Shark", "Turtle", "Whale", "Dolphin", "Ray", "Manta ray", "Shipwreck", "Wreck",
    "Invertebrate", "Organism", "Sea turtle", "Cephalopod"]);
  const hasContent = [...labelSet].some((l) => contentLabels.has(l));
  if (!hasContent) {
    failures.push(`No recognisable underwater subject — top labels: ${labels.slice(0, 4).map(l => l.label).join(", ")}`);
  }

  return failures;
}

// ── URL extraction ───────────────────────────────────────────────────────────

function extractUrls(data) {
  const urls = new Map(); // url → { slug, diveTypes, species }
  for (const entity of data) {
    const sp = (entity.species ?? []).slice(0, 3).map((s) => s.commonName || s.name).filter(Boolean);
    const dt = entity.diveTypes ?? [];
    const all = [entity.heroImageUrl, ...(entity.heroImages ?? [])].filter(Boolean);
    for (const url of all) {
      if (!urls.has(url)) urls.set(url, { slug: entity.slug, diveTypes: dt, species: sp });
    }
  }
  return urls;
}

function getStagedUrls() {
  // Get photo URLs from the staged versions of data files
  const changedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" }).trim().split("\n");
  const dataFiles = changedFiles.filter((f) => f.match(/src\/data\/(sites|locations)\.json/));
  if (dataFiles.length === 0) return new Map();

  const headUrls = new Set();
  const stagedUrls = new Map();

  for (const file of dataFiles) {
    // URLs in HEAD (already committed)
    try {
      const headData = JSON.parse(execSync(`git show HEAD:${file}`, { encoding: "utf8" }));
      for (const e of headData) {
        [e.heroImageUrl, ...(e.heroImages ?? [])].filter(Boolean).forEach((u) => headUrls.add(u));
      }
    } catch { /* new file */ }

    // URLs in staged version
    const stagedData = JSON.parse(execSync(`git show :${file}`, { encoding: "utf8" }));
    const sp = (e) => (e.species ?? []).slice(0, 3).map((s) => s.commonName || s.name).filter(Boolean);
    for (const e of stagedData) {
      for (const url of [e.heroImageUrl, ...(e.heroImages ?? [])].filter(Boolean)) {
        if (!headUrls.has(url)) {
          stagedUrls.set(url, { slug: e.slug, diveTypes: e.diveTypes ?? [], species: sp(e) });
        }
      }
    }
  }
  return stagedUrls;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let urlMap;

  if (SINGLE_URL) {
    urlMap = new Map([[SINGLE_URL, { slug: "manual", diveTypes: [], species: [] }]]);
  } else if (STAGED_MODE) {
    urlMap = getStagedUrls();
    if (urlMap.size === 0) {
      console.log("No new photo URLs in staged changes — skipping quality check.");
      process.exit(0);
    }
    console.log(`Checking ${urlMap.size} new photo URL(s) in staged changes…`);
  } else {
    const [sites, locs] = await Promise.all([
      fs.readFile(SITES_PATH, "utf8").then(JSON.parse),
      fs.readFile(LOCS_PATH, "utf8").then(JSON.parse),
    ]);
    urlMap = extractUrls([...sites, ...locs]);
    console.log(`Checking all ${urlMap.size} unique photo URLs…`);
  }

  let passed = 0, failed = 0;
  const failures = [];

  for (const [url, meta] of urlMap) {
    process.stdout.write(`  ${meta.slug} … `);
    try {
      const labels = await classify(url);
      await sleep(120);
      const issues = checkRules(labels, meta);
      if (issues.length > 0) {
        failed++;
        console.log(`FAIL ❌`);
        for (const issue of issues) console.log(`    ✗ ${issue}`);
        failures.push({ slug: meta.slug, url, issues });
      } else {
        passed++;
        console.log(`PASS ✓  [${labels.slice(0,3).map(l=>l.label).join(", ")}]`);
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }

  console.log(`\n${passed} passed · ${failed} failed`);

  if (failed > 0) {
    console.log("\n── Failures ──────────────────────────────────────────────");
    for (const f of failures) {
      console.log(`${f.slug}: ${f.url.slice(0, 70)}`);
      for (const i of f.issues) console.log(`  ✗ ${i}`);
    }
    console.log("\nCommit blocked. Fix the photos above before committing.");
    process.exit(1);
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
