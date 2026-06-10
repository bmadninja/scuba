#!/usr/bin/env node
/**
 * Generates operators + lodging data for dive sites that have neither.
 * Reads src/data/sites.json, patches in-place, writes back atomically.
 *
 * Usage:  node scripts/generate-missing-affiliate-data.mjs [--dry-run] [--limit N]
 *
 * Env:    ANTHROPIC_API_KEY  (required)
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const SITES_PATH = join(__dir, "../src/data/sites.json");
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT_ARG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1], 10) : Infinity;
const CONCURRENCY = 8; // parallel API calls

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── helpers ──────────────────────────────────────────────────────────────────

function priceLevel(n) {
  if (n < 1 || n > 4) return null;
  return n;
}

/**
 * Determine whether a site is remote / liveaboard-only based on its location
 * and description. Remote sites skip hotel suggestions.
 */
function isRemote(site) {
  const text = `${site.name} ${site.description ?? ""}`.toLowerCase();
  const keywords = [
    "remote", "offshore", "oceanic", "open ocean", "seamount", "atoll",
    "uninhabited", "no permanent", "liveaboard only",
  ];
  return keywords.some((k) => text.includes(k));
}

function buildPrompt(site) {
  const remote = isRemote(site);
  const locationHint = site.location
    ? `Located at: ${site.location}.`
    : `Approximate coordinates: ${site.lat?.toFixed(4)}, ${site.lng?.toFixed(4)}.`;

  return `You are a dive-travel data compiler. Generate realistic affiliate data for this dive site.

Site name: ${site.name}
${locationHint}
Description: ${site.description ?? "(none)"}

Return ONLY a JSON object with this exact schema — no prose, no markdown fences:

{
  "operators": [
    {
      "partner": "string (e.g. DiveBooker, PADI Travel, direct)",
      "label": "string (dive centre name)",
      "url": "string (full https URL to the booking page or dive centre website)",
      "isAffiliate": true|false
    }
    // 2-4 operators
  ],
  "lodging": [
    {
      "partner": "string (e.g. Booking.com, LiveaboardBookings, direct)",
      "label": "string (property name)",
      "url": "string (full https URL)",
      "isAffiliate": true|false,
      "priceLevel": 1|2|3|4,
      "kind": "hotel"|"liveaboard"
    }
    // ${remote ? "2-3 liveaboards only — no hotels (remote/offshore site)" : "2-3 hotels + 0-1 liveaboards if applicable"}
  ]
}

Rules:
- Use REAL property/operator names that exist near this dive site.
- For operators: prefer DiveBooker (isAffiliate:true) or PADI Travel (isAffiliate:true) links when they exist; otherwise use the operator's direct site (isAffiliate:false).
- For lodging: prefer Booking.com links (isAffiliate:true). For liveaboards use LiveaboardBookings.com (isAffiliate:false) or the vessel's direct site.
- URLs must be plausible and specific (hotel page, not homepage).
- priceLevel: 1=budget/homestay, 2=mid-range, 3=upscale, 4=luxury/liveaboard.
- ${remote ? "This is a remote/offshore site — only include liveaboards in lodging." : "Include hotels near the dive site's nearest town/island."}
- Output only the raw JSON object.`;
}

async function generateForSite(site) {
  const prompt = buildPrompt(site);
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0]?.text ?? "";
  // Strip any accidental fences
  const jsonStr = text.replace(/^```(?:json)?\n?/m, "").replace(/```$/m, "").trim();
  const data = JSON.parse(jsonStr);

  // Validate / sanitise
  const operators = (data.operators ?? [])
    .filter((o) => o.label && o.url && o.url.startsWith("http"))
    .slice(0, 4)
    .map((o) => ({
      partner: String(o.partner ?? "direct"),
      label: String(o.label),
      url: String(o.url),
      isAffiliate: Boolean(o.isAffiliate),
    }));

  const lodging = (data.lodging ?? [])
    .filter((l) => l.label && l.url && l.url.startsWith("http"))
    .slice(0, 6)
    .map((l) => ({
      partner: String(l.partner ?? "direct"),
      label: String(l.label),
      url: String(l.url),
      isAffiliate: Boolean(l.isAffiliate),
      priceLevel: priceLevel(Number(l.priceLevel)),
      kind: l.kind === "liveaboard" ? "liveaboard" : "hotel",
    }));

  return { operators, lodging };
}

// ── concurrency pool ──────────────────────────────────────────────────────────

async function runPool(tasks, concurrency) {
  const results = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────

const sites = JSON.parse(readFileSync(SITES_PATH, "utf8"));
const emptySites = sites
  .filter((s) => !s.lodging?.length && !s.operators?.length)
  .slice(0, LIMIT);

console.log(
  `Found ${emptySites.length} sites without operators/lodging.${DRY_RUN ? " (DRY RUN)" : ""}`
);

if (DRY_RUN) {
  console.log("Sample prompt for first site:\n");
  console.log(buildPrompt(emptySites[0]));
  process.exit(0);
}

let done = 0;
let errors = 0;

const tasks = emptySites.map((site) => async () => {
  try {
    const result = await generateForSite(site);
    done++;
    process.stdout.write(
      `\r[${done}/${emptySites.length}] ${site.name.slice(0, 40).padEnd(40)}`
    );
    return { slug: site.slug, ...result };
  } catch (err) {
    done++;
    process.stdout.write(
      `\r[${done}/${emptySites.length}] ERR ${site.name.slice(0, 36).padEnd(36)}`
    );
    return { slug: site.slug, error: err.message };
  }
});

const results = await runPool(tasks, CONCURRENCY);
console.log("\n");

// Patch sites.json
const slugMap = new Map(results.map((r) => [r.slug, r]));
let patched = 0;

for (const site of sites) {
  const result = slugMap.get(site.slug);
  if (!result) continue;
  if (result.error) {
    console.error(`Error for ${site.slug}: ${result.error}`);
    errors++;
    continue;
  }
  site.operators = result.operators;
  site.lodging = result.lodging;
  patched++;
}

writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2), "utf8");
console.log(`Patched ${patched} sites. Errors: ${errors}.`);
console.log("sites.json updated.");
