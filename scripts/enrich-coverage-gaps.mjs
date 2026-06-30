#!/usr/bin/env node
/**
 * Targeted enrichment for coverage-gaps.json — adds famous missing sites
 * to sites.json using Haiku (20x cheaper than Sonnet) with web research.
 *
 * Unlike discover-sites.mjs (which picks gaps autonomously), this script
 * works from the pre-ranked coverage-gaps.json list — no "pick a gap" LLM
 * call needed, so cost is purely the research step.
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   DRY_RUN=1           print JSON but do not write files
 *   MAX_SITES=3         how many to process per run (default 3)
 *   MODEL_RESEARCH      override research model (default: claude-haiku-4-5-20251001)
 *   MODEL_LIGHT         override self-review model (default: claude-haiku-4-5-20251001)
 *
 * Usage:
 *   node scripts/enrich-coverage-gaps.mjs
 *   MAX_SITES=10 node scripts/enrich-coverage-gaps.mjs
 *   DRY_RUN=1 node scripts/enrich-coverage-gaps.mjs
 */

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { SiteSchema, SCHEMA_DESCRIPTION_FOR_LLM } from "./lib/site-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const GAPS_PATH = resolve(ROOT, "src/data/coverage-gaps.json");

const MODEL_RESEARCH = process.env.MODEL_RESEARCH ?? "claude-haiku-4-5-20251001";
const MODEL_LIGHT = process.env.MODEL_LIGHT ?? "claude-haiku-4-5-20251001";
const DRY_RUN = process.env.DRY_RUN === "1";
const MAX_SITES = Number(process.env.MAX_SITES ?? "3");

const client = new Anthropic();

function loadSites() {
  return JSON.parse(readFileSync(SITES_PATH, "utf8"));
}

const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));
const gaps = JSON.parse(readFileSync(GAPS_PATH, "utf8"));

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
  const start =
    raw.indexOf("[") !== -1 && (raw.indexOf("[") < (raw.indexOf("{") === -1 ? Infinity : raw.indexOf("{")) )
      ? raw.indexOf("[")
      : raw.indexOf("{");
  const end = raw.lastIndexOf(start === raw.indexOf("[") ? "]" : "}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(raw.slice(start, end + 1));
}

function collectText(content) {
  return content.filter((c) => c.type === "text").map((c) => c.text).join("\n");
}

const distanceKm = (a, b) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

const normalizeName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function isDuplicate(candidate, sites) {
  for (const s of sites) {
    if (s.id === candidate.id || s.slug === candidate.slug) return `id/slug ${s.id}`;
    if (normalizeName(s.name) === normalizeName(candidate.name) && s.locationId === candidate.locationId)
      return `name match: ${s.name}`;
    if (distanceKm(s, candidate) < 2) return `within 2km of ${s.name}`;
  }
  return null;
}

// ── Resolve locationId for a gap entry ────────────────────────────────────────

function resolveLocationId(gap) {
  // 1. Explicit mapping from coverage-gaps.json
  if (gap.ourLocationId) return gap.ourLocationId;

  // 2. Match by country + region name substring
  const country = gap.country?.toLowerCase().trim();
  const region = gap.region?.toLowerCase().trim();

  const byCountry = locations.filter((l) => l.country?.toLowerCase() === country);
  if (!byCountry.length) return null;
  if (byCountry.length === 1) return byCountry[0].id;

  // Try region match
  if (region) {
    const byRegion = byCountry.find(
      (l) =>
        l.region?.toLowerCase().includes(region) ||
        region.includes(l.region?.toLowerCase() ?? "") ||
        l.name?.toLowerCase().includes(region) ||
        region.includes(l.name?.toLowerCase() ?? ""),
    );
    if (byRegion) return byRegion.id;
  }

  // Fall back to first in country (least bad)
  return byCountry[0].id;
}

// ── Research step (mirrors discover-sites.mjs researchSite) ───────────────────

async function researchSite(gap, locationId) {
  const location = locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`locationId not found: ${locationId}`);

  const sys = `You are a marine biologist and dive journalist researching a single dive site for publication on scubaseason.fun.
You have web_search and web_fetch tools. Use them aggressively — fetch operator sites, Wikipedia, dive magazines, and scientific sources.
Cite at least 3 independent sources for key facts (depth, coordinates, species).
${SCHEMA_DESCRIPTION_FOR_LLM}`;

  const user = `Research and produce a complete JSON entry for: "${gap.name}"
Location: ${location.name}, ${location.country} (locationId="${locationId}")
Region hint: ${gap.region || location.region}
Anchor coordinates (refine using sources): lat=${location.lat}, lng=${location.lng}

Known aliases: ${gap.aliases?.join(", ") || "none"}
Source count: ${gap.sourceCount} (mentioned across ${gap.sourceCount} authoritative dive guides)

Process:
1. Search for the site name + location + "dive site".
2. Fetch the top 5+ most authoritative pages (Wikipedia, operator sites, dive magazines, PADI, etc.).
3. Cross-reference depth, exact coordinates, species sightings, and best seasons.
4. Search Wikimedia Commons for an underwater photo of this site or a key species found there.
5. Emit ONLY the JSON object. Wrap in \`\`\`json fences. No commentary.

If you cannot corroborate the site with ≥3 independent sources, respond with:
\`\`\`json
{"refuse": true, "reason": "..."}
\`\`\``;

  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 10 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 12 },
  ];

  const messages = [{ role: "user", content: user }];
  let lastResp = null;

  for (let i = 0; i < 20; i++) {
    const resp = await callClaude({ system: sys, messages, tools, max_tokens: 16000 });
    lastResp = resp;
    messages.push({ role: "assistant", content: resp.content });
    console.log(`  [turn ${i}] stop=${resp.stop_reason} blocks=${resp.content.map((c) => c.type).join(",")}`);

    if (resp.stop_reason === "end_turn") {
      const text = collectText(resp.content);
      try {
        return extractJson(text);
      } catch (_) {
        messages.push({
          role: "user",
          content: "Emit ONLY the JSON object in ```json fences. No other text.",
        });
        continue;
      }
    }
    if (resp.stop_reason === "pause_turn" || resp.stop_reason === "tool_use") continue;
    if (resp.stop_reason === "max_tokens") {
      messages.push({
        role: "user",
        content: "Skip narration. Emit ONLY the JSON object in ```json fences.",
      });
      continue;
    }
    throw new Error(`Unexpected stop_reason: ${resp.stop_reason}`);
  }
  throw new Error(`Tool loop exceeded 20 turns; last stop=${lastResp?.stop_reason}`);
}

// ── Self-review ────────────────────────────────────────────────────────────────

async function selfReview(entry) {
  const sys = `You are a skeptical fact-checker for a dive guide website.
Score confidence (0..1) that this dive-site entry is accurate and non-hallucinated.
Return JSON: { "score": 0..1, "issues": ["..."] }
Score <0.8 if: coordinates off, species list generic, depth implausible, description vague or marketing-speak.`;
  const resp = await callClaude({
    system: sys,
    messages: [{ role: "user", content: JSON.stringify(entry, null, 2) }],
    max_tokens: 600,
    model: MODEL_LIGHT,
  });
  return extractJson(collectText(resp.content));
}

// ── Git commit ─────────────────────────────────────────────────────────────────

function gitCommit(siteName) {
  const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
  execSync(`git add src/data/sites.json`, { stdio: "inherit" });
  execSync(`${GIT} commit -m "auto: fill gaps — add ${siteName.replace(/"/g, "")}"`, { stdio: "inherit" });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required");
    process.exit(1);
  }

  console.log(`research=${MODEL_RESEARCH} | light=${MODEL_LIGHT} | max=${MAX_SITES} | dry=${DRY_RUN}`);

  let sites = loadSites();
  const existingNames = new Set(sites.map((s) => normalizeName(s.name)));

  // Sort gaps by priority (highest first), skip already-present sites
  const queue = gaps
    .slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .filter((g) => !existingNames.has(normalizeName(g.name)));

  console.log(`Queue: ${queue.length} gaps remaining (${gaps.length - queue.length} already in sites.json)`);

  let accepted = 0;

  for (const gap of queue) {
    if (accepted >= MAX_SITES) break;

    const locationId = resolveLocationId(gap);
    if (!locationId) {
      console.log(`\n⚠ Skipping "${gap.name}" — no matching location found (country: ${gap.country})`);
      continue;
    }

    console.log(`\n[${accepted + 1}/${MAX_SITES}] ${gap.name} (${gap.country}) → ${locationId}`);

    try {
      console.log("→ Researching...");
      const entry = await researchSite(gap, locationId);

      if (entry.refuse) {
        console.log(`  Refused: ${entry.reason}`);
        continue;
      }

      console.log("→ Validating schema...");
      const parsed = SiteSchema.safeParse(entry);
      if (!parsed.success) {
        console.error("  Schema errors:", parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`));
        continue;
      }

      console.log("→ Dedup check...");
      const dup = isDuplicate(parsed.data, sites);
      if (dup) {
        console.log(`  Skipped: duplicate (${dup})`);
        continue;
      }

      console.log("→ Self-review...");
      const review = await selfReview(parsed.data);
      console.log(`  Score: ${review.score} | issues: ${review.issues?.join("; ") || "none"}`);
      if (review.score < 0.8) {
        console.log("  Rejected: confidence < 0.8");
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY_RUN] Would add: ${parsed.data.name}`);
        console.log(JSON.stringify(parsed.data, null, 2));
      } else {
        sites = loadSites(); // re-read to avoid stomping concurrent changes
        sites.push(parsed.data);
        writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
        gitCommit(parsed.data.name);
        console.log(`  ✓ Added and committed: ${parsed.data.name}`);
      }

      accepted++;
    } catch (err) {
      console.error(`  Error processing "${gap.name}": ${err.message}`);
    }
  }

  console.log(`\nDone. Added ${accepted} sites.`);
  if (queue.length - accepted > 0) {
    console.log(`Run again to process the next batch (${queue.length - accepted} gaps remain).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
