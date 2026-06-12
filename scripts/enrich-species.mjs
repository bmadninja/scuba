#!/usr/bin/env node
/**
 * Species enrichment — adds more species to sites that have fewer than
 * MIN_SPECIES entries, using Claude with web_search.
 *
 * Flow per site:
 *   1. Ask Claude (web_search + web_fetch) to find species at this site.
 *   2. Parse response, dedupe against existing species list.
 *   3. Append new species and write sites.json immediately (crash-safe).
 *
 * After running, re-run fetch-species-photos.mjs to get iNaturalist
 * thumbnails for any newly added species entries.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   MIN_SPECIES=5       enrich sites with fewer than this many species (default 5)
 *   TARGET_SPECIES=8    how many species to aim for per site (default 8)
 *   DRY_RUN=1           print plan only, do not write
 *   SITE_ID=xxx         process a single site by id
 *
 * Usage:
 *   node scripts/enrich-species.mjs                   # enrich all thin sites
 *   SITE_ID=malapascua-monad-shoal node scripts/enrich-species.mjs
 *   DRY_RUN=1 node scripts/enrich-species.mjs         # preview which sites qualify
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");

const MODEL_RESEARCH = process.env.MODEL_RESEARCH ?? "claude-haiku-4-5-20251001";
const MIN_SPECIES = Number(process.env.MIN_SPECIES ?? "5");
const TARGET_SPECIES = Number(process.env.TARGET_SPECIES ?? "8");
const DRY_RUN = process.env.DRY_RUN === "1";
const SITE_ID = process.env.SITE_ID;

const client = new Anthropic();

/* ---------- helpers ---------- */

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callClaude({ system, messages, tools, max_tokens = 4000 }) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.messages.create({
        model: MODEL_RESEARCH,
        max_tokens,
        system,
        messages,
        tools,
      });
    } catch (err) {
      if ((err.status === 529 || err.status === 429) && attempt < 3) {
        const waitMs = (attempt + 1) * 45000;
        console.log(`  API ${err.status} — waiting ${waitMs / 1000}s...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

function collectText(content) {
  return content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

function extractJson(text) {
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  const raw = fences.length ? fences[fences.length - 1][1] : text;
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start !== -1 && end !== -1) return JSON.parse(raw.slice(start, end + 1));
  // fallback: object with species array
  const os = raw.indexOf("{");
  const oe = raw.lastIndexOf("}");
  if (os !== -1 && oe !== -1) {
    const obj = JSON.parse(raw.slice(os, oe + 1));
    if (Array.isArray(obj.species)) return obj.species;
  }
  throw new Error("No JSON array found in response");
}

function normalize(name) {
  return (name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function dedupeSpecies(existing, candidates) {
  const existingNames = new Set([
    ...existing.map((s) => normalize(s.commonName)),
    ...existing.map((s) => normalize(s.scientificName || "")),
  ]);
  return candidates.filter((c) => {
    const cn = normalize(c.commonName);
    const sn = normalize(c.scientificName || "");
    return cn && !existingNames.has(cn) && (sn === "" || !existingNames.has(sn));
  });
}

function validateSpecies(arr) {
  const RELIABILITY = new Set(["year-round", "seasonal", "rare"]);
  return arr.filter((s) => {
    if (!s || typeof s.commonName !== "string" || s.commonName.length < 2) return false;
    if (!RELIABILITY.has(s.reliability)) return false;
    if (s.reliability === "seasonal" && (!Array.isArray(s.bestMonths) || s.bestMonths.length === 0)) return false;
    return true;
  }).map((s) => {
    // strip any extra fields the model may have invented
    const out = {
      commonName: s.commonName,
      reliability: s.reliability,
    };
    if (s.scientificName) out.scientificName = s.scientificName;
    if (s.bestMonths) out.bestMonths = s.bestMonths.map(Number).filter((n) => n >= 1 && n <= 12);
    return out;
  });
}

/* ---------- research ---------- */

async function fetchSpeciesForSite(site) {
  const need = TARGET_SPECIES - site.species.length;
  const existing = site.species.map((s) => s.commonName).join(", ");

  const system = `You are a marine biologist researching species found at a specific dive site.
Use web_search and web_fetch to find real, documented species.
Return ONLY a JSON array of species objects — no prose, no commentary.

Each object must match this shape exactly:
{
  "commonName": string,           // e.g. "Bumphead parrotfish"
  "scientificName": string,       // binomial, e.g. "Bolbometopon muricatum"
  "reliability": "year-round" | "seasonal" | "rare",
  "bestMonths": [1..12]           // required only when reliability="seasonal"
}

Rules:
- Only include species actually documented at this specific site — not just the region.
- No invented or placeholder species. If you cannot find enough, return fewer.
- Do not repeat species already listed.
- Wrap the array in \`\`\`json fences.`;

  const user = `Dive site: "${site.name}"
Location: lat ${site.lat}, lng ${site.lng}
Description: ${site.description.slice(0, 300)}

Already documented species (do NOT repeat these):
${existing}

Find ${need} additional marine species documented at this exact site.
Search for "[site name] marine species", "[site name] dive site species", and operator/magazine pages about the site.`;

  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 5 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 6 },
  ];

  const messages = [{ role: "user", content: user }];

  for (let i = 0; i < 15; i++) {
    const resp = await callClaude({ system, messages, tools, max_tokens: 3000 });
    messages.push({ role: "assistant", content: resp.content });

    if (resp.stop_reason === "end_turn") {
      const text = collectText(resp.content);
      return extractJson(text);
    }
    if (resp.stop_reason === "pause_turn" || resp.stop_reason === "tool_use") {
      const clientTool = resp.content.find(
        (c) => c.type === "tool_use" && !["web_search", "web_fetch"].includes(c.name),
      );
      if (clientTool) throw new Error(`Unexpected client tool: ${clientTool.name}`);
      continue;
    }
    if (resp.stop_reason === "max_tokens") {
      messages.push({ role: "user", content: "Hit max_tokens. Emit ONLY the JSON array now in ```json fences." });
      continue;
    }
    throw new Error(`Unexpected stop_reason: ${resp.stop_reason}`);
  }
  throw new Error("Tool loop exceeded 15 turns");
}

/* ---------- main ---------- */

async function main() {
  let sites = JSON.parse(readFileSync(SITES_PATH, "utf8"));

  let targets = SITE_ID
    ? sites.filter((s) => s.id === SITE_ID)
    : sites.filter((s) => (s.species || []).length < MIN_SPECIES);

  if (targets.length === 0) {
    console.log(SITE_ID
      ? `Site "${SITE_ID}" not found or already has ≥${MIN_SPECIES} species.`
      : `All sites already have ≥${MIN_SPECIES} species. Lower MIN_SPECIES to expand scope.`);
    return;
  }

  console.log(`Enriching ${targets.length} sites (< ${MIN_SPECIES} species each, target ${TARGET_SPECIES})`);
  if (DRY_RUN) {
    targets.forEach((s) => console.log(`  ${s.name} (${s.species.length} species)`));
    console.log("\nDry-run — set DRY_RUN=0 or omit to run.");
    return;
  }

  let enriched = 0;
  let failed = 0;

  for (const site of targets) {
    process.stdout.write(`\n[${enriched + failed + 1}/${targets.length}] ${site.name} (${site.species.length} species) → `);

    try {
      const raw = await fetchSpeciesForSite(site);
      const validated = validateSpecies(raw);
      const fresh = dedupeSpecies(site.species, validated);

      if (fresh.length === 0) {
        console.log("no new species found");
      } else {
        console.log(`+${fresh.length} species`);
        fresh.forEach((s) => console.log(`    + ${s.commonName} (${s.scientificName || "no sci name"}) [${s.reliability}]`));

        // Update in-memory and write immediately (crash-safe)
        const idx = sites.findIndex((s) => s.id === site.id);
        sites[idx] = { ...sites[idx], species: [...sites[idx].species, ...fresh] };
        writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
        enriched++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      failed++;
    }

    // Polite pause between sites to avoid rate limits
    await sleep(1500);
  }

  console.log(`\nDone. Enriched: ${enriched}  Failed: ${failed}`);
  console.log("Run fetch-species-photos.mjs next to get iNaturalist thumbnails for new species.");
}

main().catch((err) => { console.error(err); process.exit(1); });
