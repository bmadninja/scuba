#!/usr/bin/env node
/**
 * Autonomous gap-filler for existing dive sites.
 *
 * Fills missing data in this priority order per run:
 *   1. Lodging — locations with sites but no hotel/liveaboard entries
 *   2. Operators — locations with sites but no dive operator entries
 *   3. Species photos — species entries missing an imageUrl
 *
 * One location (or one species batch) is filled per run to keep cost low.
 * Mirrors the daily-cron pattern of discover-sites.mjs.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   DRY_RUN=1           prints patch JSON but does not write files
 *   GAP_TYPE            force a specific gap type: lodging | operators | species
 *   MAX_SPECIES=10      max species to patch per run (default 10)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");

const MODEL_RESEARCH = process.env.MODEL_RESEARCH ?? "claude-haiku-4-5-20251001";
const MODEL_LIGHT = process.env.MODEL_LIGHT ?? "claude-haiku-4-5-20251001";
const DRY_RUN = process.env.DRY_RUN === "1";
const FORCE_GAP_TYPE = process.env.GAP_TYPE; // lodging | operators | species
const MAX_SPECIES = Number(process.env.MAX_SPECIES ?? "10");

const client = new Anthropic();

function loadSites() {
  return JSON.parse(readFileSync(SITES_PATH, "utf8"));
}
const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));

// ── Helpers ────────────────────────────────────────────────────────────────────

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callClaude({ system, messages, tools, max_tokens = 8000, model = MODEL_RESEARCH }) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.messages.create({ model, max_tokens, system, messages, tools });
    } catch (err) {
      const retry = err.status === 529 || err.status === 429;
      if (retry && attempt < 3) {
        const waitMs = (attempt + 1) * 45000;
        console.log(`  API ${err.status} — waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

function extractJson(text) {
  if (!text?.trim()) throw new Error("Empty response");
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  const raw = fences.length ? fences[fences.length - 1][1] : text;
  const start = raw.indexOf("[") !== -1 && (raw.indexOf("[") < raw.indexOf("{") || raw.indexOf("{") === -1)
    ? raw.indexOf("[")
    : raw.indexOf("{");
  const end = raw.lastIndexOf(start === raw.indexOf("[") ? "]" : "}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(start, end + 1));
}

function collectText(content) {
  return content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

// Tool-use loop for web_search / web_fetch (same pattern as discover-sites)
async function toolLoop({ system, user, max_tokens = 10000, maxTurns = 15 }) {
  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 6 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 8 },
  ];
  const messages = [{ role: "user", content: user }];
  let last = null;

  for (let i = 0; i < maxTurns; i++) {
    const resp = await callClaude({ system, messages, tools, max_tokens });
    last = resp;
    messages.push({ role: "assistant", content: resp.content });
    console.log(`  [turn ${i}] stop=${resp.stop_reason}`);

    if (resp.stop_reason === "end_turn") {
      const text = collectText(resp.content);
      try { return extractJson(text); } catch (_) {
        messages.push({ role: "user", content: "Emit ONLY the JSON now, in ```json fences. No other text." });
        continue;
      }
    }
    if (resp.stop_reason === "pause_turn" || resp.stop_reason === "tool_use") continue;
    if (resp.stop_reason === "max_tokens") {
      messages.push({ role: "user", content: "Skip narration. Emit ONLY the JSON in ```json fences." });
      continue;
    }
    throw new Error(`Unexpected stop_reason: ${resp.stop_reason}`);
  }
  throw new Error(`Tool loop exceeded ${maxTurns} turns`);
}

// ── Gap detection ──────────────────────────────────────────────────────────────

function findGaps() {
  const sites = loadSites();
  const sitesByLoc = {};
  for (const s of sites) {
    sitesByLoc[s.locationId] = sitesByLoc[s.locationId] || [];
    sitesByLoc[s.locationId].push(s);
  }

  // Lodging gaps: locations with ≥1 site but no lodging on any site
  const lodgingGaps = [];
  for (const loc of locations) {
    const locSites = sitesByLoc[loc.id] || [];
    if (!locSites.length) continue;
    const lodging = locSites.flatMap((s) => s.lodging || []);
    if (!lodging.length) lodgingGaps.push({ loc, primarySite: locSites[0] });
  }

  // Operator gaps: same pattern
  const operatorGaps = [];
  for (const loc of locations) {
    const locSites = sitesByLoc[loc.id] || [];
    if (!locSites.length) continue;
    const ops = locSites.flatMap((s) => s.operators || []);
    if (!ops.length) operatorGaps.push({ loc, primarySite: locSites[0] });
  }

  // Species photo gaps
  const speciesGaps = [];
  for (const site of sites) {
    for (const sp of site.species || []) {
      if (!sp.imageUrl?.trim()) {
        speciesGaps.push({ site, species: sp });
      }
    }
  }

  return { lodgingGaps, operatorGaps, speciesGaps, sites };
}

// ── Lodging fill ───────────────────────────────────────────────────────────────

async function fillLodging(loc, primarySite) {
  console.log(`→ Filling lodging for ${loc.name}, ${loc.country}`);

  const system = `You are a travel researcher for a dive travel website.
Find 2-4 real hotels or liveaboards near this dive destination.
Return a JSON array of lodging objects. Each must have:
  partner: booking platform name (e.g. "Booking.com") or hotel brand
  label: exact hotel/vessel name
  url: DIRECT booking page URL — never a search results page
  isAffiliate: false
  priceLevel: 1 (budget) | 2 (mid-range) | 3 (upscale) | 4 (luxury)
  kind: "hotel" | "liveaboard" | "resort"

Cover at least 2 price tiers if possible. Use Booking.com where available.
Booking.com URL format: https://www.booking.com/hotel/[2-letter-country-code]/[hotel-slug].html
NEVER return search result URLs like booking.com/searchresults or /search?
If it is a liveaboard-only destination, return liveaboard entries from liveaboard.com.`;

  const user = `Destination: ${loc.name}, ${loc.country}
Nearest dive site: ${primarySite.name} (lat ${primarySite.lat}, lng ${primarySite.lng})

Find 2-4 real hotels or liveaboards divers use when visiting this destination.
Search for them, verify the URLs are direct property pages, then return the JSON array.`;

  const result = await toolLoop({ system, user });
  if (!Array.isArray(result)) throw new Error("Expected array from lodging research");
  return result.filter((l) => l.url && l.label && !l.url.includes("searchresults") && !l.url.includes("/search?"));
}

// ── Operator fill ──────────────────────────────────────────────────────────────

async function fillOperators(loc, primarySite) {
  console.log(`→ Filling operators for ${loc.name}, ${loc.country}`);

  const system = `You are a dive travel researcher.
Find 1-3 real dive operators/dive centres at this destination.
Return a JSON array of operator objects. Each must have:
  partner: operator name or booking platform
  label: exact operator/dive centre name
  url: direct website URL (their own site, not a directory listing)
  isAffiliate: false

Only include operators with verifiable websites.`;

  const user = `Destination: ${loc.name}, ${loc.country}
Nearest dive site: ${primarySite.name}

Search for dive operators/dive centres at this destination, verify their websites exist, return the JSON array.`;

  const result = await toolLoop({ system, user });
  if (!Array.isArray(result)) throw new Error("Expected array from operator research");
  return result.filter((o) => o.url && o.label);
}

// ── Species photo fill ─────────────────────────────────────────────────────────

async function fillSpeciesPhotos(batch) {
  console.log(`→ Finding photos for ${batch.length} species entries`);

  const items = batch.map((g) => ({
    siteId: g.site.id,
    commonName: g.species.commonName,
    scientificName: g.species.scientificName || null,
  }));

  const system = `You are a marine biology photo researcher.
For each species entry, find a real underwater photo URL from iNaturalist open data or Wikimedia Commons.

iNaturalist format: https://inaturalist-open-data.s3.amazonaws.com/photos/PHOTOID/large.jpg
Wikimedia format: https://upload.wikimedia.org/wikipedia/commons/...

Rules:
- Photo MUST be an underwater photograph of the actual species
- For "Schooling X" entries, find a photo of the individual species (not a school)
- NEVER fabricate photo IDs — only return URLs you have verified exist
- If no underwater photo is available, omit that entry from the results

Return a JSON array:
[{ "siteId": "...", "commonName": "...", "imageUrl": "..." }, ...]`;

  const user = `Find underwater photo URLs for these species:
${JSON.stringify(items, null, 2)}

Search iNaturalist for each species by scientific name, verify the photo URL returns a real image, then return the array.`;

  const result = await toolLoop({ system, user, max_tokens: 8000 });
  if (!Array.isArray(result)) throw new Error("Expected array from species photo research");
  return result.filter((r) => r.siteId && r.commonName && r.imageUrl?.startsWith("http"));
}

// ── Git commit/push (optimistic lock, same as discover-sites) ──────────────────

function gitCommitPush(description) {
  const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
  for (let attempt = 0; attempt < 6; attempt++) {
    execSync(`git fetch origin main`, { stdio: "inherit" });

    // Re-apply our in-memory patch on top of the freshest remote
    const remoteSitesRaw = execSync(`git show origin/main:src/data/sites.json`).toString();
    const remoteSites = JSON.parse(remoteSitesRaw);

    // Write current in-memory state (already patched) back
    // We need to replay the patch onto remoteSites to avoid clobbering concurrent writes
    const currentSites = loadSites();
    writeFileSync(SITES_PATH, JSON.stringify(currentSites, null, 2) + "\n");

    execSync(`git fetch origin main && git reset --soft origin/main`, { stdio: "inherit" });
    execSync(`git add src/data/sites.json`, { stdio: "inherit" });
    execSync(`${GIT} commit -m "auto: fill gaps — ${description}"`, { stdio: "inherit" });

    try {
      execSync(`git push origin HEAD:main`, { stdio: "inherit" });
      return;
    } catch (_) {
      console.log(`  push retry ${attempt + 1}/6 (concurrent write)...`);
      execSync(`git reset --soft origin/main`, { stdio: "inherit" });
    }
  }
  throw new Error(`git push failed after 6 retries`);
}

// ── Apply patch to in-memory sites array ──────────────────────────────────────

function applyLodgingPatch(sites, primarySiteId, lodging) {
  const site = sites.find((s) => s.id === primarySiteId);
  if (!site) throw new Error(`Site not found: ${primarySiteId}`);
  site.lodging = lodging;
  return site.name;
}

function applyOperatorsPatch(sites, primarySiteId, operators) {
  const site = sites.find((s) => s.id === primarySiteId);
  if (!site) throw new Error(`Site not found: ${primarySiteId}`);
  site.operators = operators;
  return site.name;
}

function applySpeciesPhotoPatches(sites, patches) {
  let applied = 0;
  for (const p of patches) {
    const site = sites.find((s) => s.id === p.siteId);
    if (!site) continue;
    const sp = site.species?.find((s) => s.commonName === p.commonName);
    if (!sp) continue;
    sp.imageUrl = p.imageUrl;
    applied++;
  }
  return applied;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const { lodgingGaps, operatorGaps, speciesGaps, sites } = findGaps();

  console.log(`\nGap summary:`);
  console.log(`  Lodging gaps:  ${lodgingGaps.length} locations`);
  console.log(`  Operator gaps: ${operatorGaps.length} locations`);
  console.log(`  Species photo gaps: ${speciesGaps.length} entries\n`);

  if (!lodgingGaps.length && !operatorGaps.length && !speciesGaps.length) {
    console.log("✓ No gaps found — all data complete.");
    process.exit(0);
  }

  // Determine which gap type to address this run
  let gapType = FORCE_GAP_TYPE;
  if (!gapType) {
    if (lodgingGaps.length) gapType = "lodging";
    else if (operatorGaps.length) gapType = "operators";
    else gapType = "species";
  }

  console.log(`→ Addressing gap type: ${gapType}`);

  let description = "";

  if (gapType === "lodging") {
    const { loc, primarySite } = lodgingGaps[0];
    const lodging = await fillLodging(loc, primarySite);
    if (!lodging.length) {
      console.log("  No valid lodging found, skipping.");
      process.exit(2);
    }
    console.log(`  Found ${lodging.length} lodging entries`);
    if (DRY_RUN) {
      console.log("DRY RUN:", JSON.stringify(lodging, null, 2));
      process.exit(0);
    }
    applyLodgingPatch(sites, primarySite.id, lodging);
    writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    description = `lodging for ${loc.name}`;

  } else if (gapType === "operators") {
    const { loc, primarySite } = operatorGaps[0];
    const operators = await fillOperators(loc, primarySite);
    if (!operators.length) {
      console.log("  No valid operators found, skipping.");
      process.exit(2);
    }
    console.log(`  Found ${operators.length} operator entries`);
    if (DRY_RUN) {
      console.log("DRY RUN:", JSON.stringify(operators, null, 2));
      process.exit(0);
    }
    applyOperatorsPatch(sites, primarySite.id, operators);
    writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    description = `operators for ${loc.name}`;

  } else {
    // Species photos — fill a batch of MAX_SPECIES per run
    const batch = speciesGaps.slice(0, MAX_SPECIES);
    const patches = await fillSpeciesPhotos(batch);
    if (!patches.length) {
      console.log("  No photos found, skipping.");
      process.exit(2);
    }
    if (DRY_RUN) {
      console.log("DRY RUN:", JSON.stringify(patches, null, 2));
      process.exit(0);
    }
    const applied = applySpeciesPhotoPatches(sites, patches);
    writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    console.log(`  Applied ${applied} species photo patches`);
    description = `${applied} species photos`;
  }

  console.log(`\n→ Committing: ${description}`);
  gitCommitPush(description);
  console.log(`✓ Done: ${description}`);

  // Re-check remaining gaps
  const after = findGaps();
  console.log(`\nRemaining gaps: lodging=${after.lodgingGaps.length} operators=${after.operatorGaps.length} species=${after.speciesGaps.length}`);
  const totalRemaining = after.lodgingGaps.length + after.operatorGaps.length + after.speciesGaps.length;
  if (totalRemaining === 0) {
    console.log("✓ All gaps closed.");
  } else {
    console.log(`⏳ ${totalRemaining} gaps remain — next scheduled run will continue.`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
