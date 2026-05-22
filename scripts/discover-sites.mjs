#!/usr/bin/env node
/**
 * Autonomous dive-site discovery agent.
 *
 * Flow:
 *   1. Load existing sites + locations.
 *   2. Ask Claude to pick the highest-value GAP (under-covered location or
 *      missing famous site).
 *   3. Ask Claude (with web_search + web_fetch) to research it and emit a
 *      strict JSON entry matching SiteSchema.
 *   4. Validate, dedupe, confidence-check.
 *   5. Either write to src/data/sites.json (commit) or to
 *      src/data/sites.proposed.json (dry-run).
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   DRY_RUN=1           writes to sites.proposed.json instead of sites.json
 *   MAX_SITES=1         how many new sites to add in one run (default 1)
 *
 * Exits non-zero on validation failure (so CI can skip the PR step).
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SiteSchema, SCHEMA_DESCRIPTION_FOR_LLM } from "./lib/site-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const PROPOSED_PATH = resolve(ROOT, "src/data/sites.proposed.json");

const MODEL = "claude-opus-4-7";
const DRY_RUN = process.env.DRY_RUN === "1";
const MAX_SITES = Number(process.env.MAX_SITES ?? "1");

const client = new Anthropic();

const sites = JSON.parse(readFileSync(SITES_PATH, "utf8"));
const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));

/* ---------- helpers ---------- */

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

function isDuplicate(candidate) {
  for (const s of sites) {
    if (s.id === candidate.id || s.slug === candidate.slug) return `id/slug ${s.id}`;
    if (normalizeName(s.name) === normalizeName(candidate.name) && s.locationId === candidate.locationId)
      return `name match: ${s.name}`;
    if (distanceKm(s, candidate) < 2)
      return `within 2km of ${s.name} (${s.id})`;
  }
  return null;
}

/* ---------- LLM helpers ---------- */

async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens,
    system,
    messages,
    tools,
  });
  return resp;
}

function extractJson(text) {
  if (!text || !text.trim()) throw new Error("Empty response text");
  // Prefer the LAST fenced block (model may include earlier examples)
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)];
  const raw = fences.length ? fences[fences.length - 1][1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");
  return JSON.parse(raw.slice(start, end + 1));
}

function collectText(content) {
  return content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");
}

/* ---------- step 1: pick a gap ---------- */

async function pickGap() {
  const coverage = locations.map((l) => ({
    locationId: l.id,
    name: l.name,
    country: l.country,
    siteCount: sites.filter((s) => s.locationId === l.id).length,
  }));

  const sys = `You are the editorial director of scubaseason.fun, an authoritative dive-site guide.
You decide which dive site to add next based on (a) gaps in existing coverage and (b) editorial importance (famous, frequently-searched, or culturally significant sites).
You will be given coverage stats. Pick ONE site to add. Return strict JSON.`;

  const user = `Existing locations with site counts:
${JSON.stringify(coverage, null, 2)}

Existing site names (for dedup awareness):
${sites.map((s) => `- ${s.name} (${s.locationId})`).join("\n")}

Pick the single best dive site to add next. Prefer locations with siteCount < 2, OR famous missing sites (e.g. SS Thistlegorm, Blue Hole Dahab, Manta Point) within existing locations.

Return JSON: { "locationId": "...", "candidateName": "...", "reasoning": "..." }`;

  const resp = await callClaude({
    system: sys,
    messages: [{ role: "user", content: user }],
    max_tokens: 1000,
  });
  return extractJson(collectText(resp.content));
}

/* ---------- step 2: research + emit entry ---------- */

async function researchSite(gap) {
  const location = locations.find((l) => l.id === gap.locationId);
  if (!location) throw new Error(`Unknown locationId from picker: ${gap.locationId}`);

  const sys = `You are a marine biologist + dive journalist researching a single dive site for publication.
You have web_search and web_fetch tools. Use them aggressively. Cite ≥3 independent sources for key facts.
${SCHEMA_DESCRIPTION_FOR_LLM}`;

  const user = `Research and produce a JSON entry for: "${gap.candidateName}"
Location: ${location.name}, ${location.country} (locationId="${location.id}")
Anchor coordinates (refine using sources): lat=${location.lat}, lng=${location.lng}

Process:
1. Search the web for the dive site name + location.
2. Fetch the top 5-10 most authoritative pages (operator sites, Wikipedia, ReefBase, dive magazines).
3. Cross-reference depth, coordinates, species, season.
4. Find a Wikimedia Commons image of the relevant species or location (search commons.wikimedia.org). If none verified, set heroImageUrl=null.
5. Emit the JSON object. NO commentary. Wrap in \`\`\`json fences.

If you cannot corroborate the site (≥3 sources), respond with: \`\`\`json
{"refuse": true, "reason": "..."}
\`\`\``;

  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 8 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 10 },
  ];

  // Server-side tools loop. web_search / web_fetch execute on Anthropic's side.
  // Between rounds the API returns stop_reason "pause_turn" — we resend the full
  // message history (with the assistant turn appended) to continue.
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
      } catch (err) {
        // Ask the model to emit the JSON explicitly
        messages.push({
          role: "user",
          content:
            "You ended without a JSON block. Emit ONLY the JSON object now (or the refuse object), wrapped in ```json fences. No other text.",
        });
        continue;
      }
    }
    if (resp.stop_reason === "pause_turn" || resp.stop_reason === "tool_use") {
      const clientTool = resp.content.find(
        (c) => c.type === "tool_use" && !["web_search", "web_fetch"].includes(c.name),
      );
      if (clientTool) throw new Error(`Unexpected client tool: ${clientTool.name}`);
      continue;
    }
    if (resp.stop_reason === "max_tokens") {
      messages.push({
        role: "user",
        content: "You hit max_tokens. Skip narration and emit ONLY the JSON object in ```json fences.",
      });
      continue;
    }
    throw new Error(`Unexpected stop_reason: ${resp.stop_reason}`);
  }
  throw new Error(`Tool loop exceeded 20 turns; last stop=${lastResp?.stop_reason}`);
}

/* ---------- step 3: confidence self-review ---------- */

async function selfReview(entry) {
  const sys = `You are a skeptical fact-checker. Score the confidence (0..1) that this dive-site entry is accurate and non-hallucinated.
Return JSON: { "score": 0..1, "issues": ["..."] }
Score <0.8 if: coordinates seem off, species list looks generic, depth range implausible, description vague.`;
  const resp = await callClaude({
    system: sys,
    messages: [{ role: "user", content: "Entry:\n" + JSON.stringify(entry, null, 2) }],
    max_tokens: 800,
  });
  return extractJson(collectText(resp.content));
}

/* ---------- main ---------- */

async function discoverOne() {
  console.log("→ Picking gap...");
  const gap = await pickGap();
  console.log(`  Target: ${gap.candidateName} @ ${gap.locationId}`);
  console.log(`  Reason: ${gap.reasoning}`);

  console.log("→ Researching...");
  const entry = await researchSite(gap);
  if (entry.refuse) {
    console.log(`  Refused: ${entry.reason}`);
    return null;
  }

  console.log("→ Validating schema...");
  const parsed = SiteSchema.safeParse(entry);
  if (!parsed.success) {
    console.error("  Schema errors:", parsed.error.issues);
    return null;
  }

  console.log("→ Dedup check...");
  const dup = isDuplicate(parsed.data);
  if (dup) {
    console.log(`  Skipped: duplicate (${dup})`);
    return null;
  }

  console.log("→ Self-review...");
  const review = await selfReview(parsed.data);
  console.log(`  Score: ${review.score} (issues: ${review.issues?.join("; ") || "none"})`);
  if (review.score < 0.8) {
    console.log("  Rejected: confidence < 0.8");
    return null;
  }

  return parsed.data;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY required");
    process.exit(1);
  }
  const accepted = [];
  for (let i = 0; i < MAX_SITES; i++) {
    try {
      const entry = await discoverOne();
      if (entry) {
        accepted.push(entry);
        sites.push(entry); // so next iteration sees it for dedup
      }
    } catch (err) {
      console.error("Iteration failed:", err.message);
    }
  }
  if (accepted.length === 0) {
    console.log("No sites accepted this run.");
    process.exit(2); // signal to CI: nothing to PR
  }
  const out = DRY_RUN ? PROPOSED_PATH : SITES_PATH;
  const existing = existsSync(out) && DRY_RUN ? JSON.parse(readFileSync(out, "utf8")) : sites;
  const finalArr = DRY_RUN ? [...existing, ...accepted] : sites;
  writeFileSync(out, JSON.stringify(finalArr, null, 2) + "\n");
  console.log(`✓ Wrote ${accepted.length} site(s) to ${out}`);
  // emit for the GH Action
  console.log("ADDED_SITES=" + accepted.map((s) => s.name).join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
