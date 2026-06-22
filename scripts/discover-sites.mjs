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
import { execSync } from "node:child_process";
import { SiteSchema, SCHEMA_DESCRIPTION_FOR_LLM } from "./lib/site-schema.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const PROPOSED_PATH = resolve(ROOT, "src/data/sites.proposed.json");

// Cost-tiered models. The daily scheduled run uses cheap defaults (Sonnet for
// the research write, Haiku for the gap pick + self-review). The blitz workflow
// sets MODEL=claude-opus-4-7, which overrides both tiers back to Opus for the
// big manual push where quality matters more than per-run cost.
const MODEL = process.env.MODEL; // legacy global override (blitz sets this); may be undefined
const MODEL_RESEARCH = process.env.MODEL_RESEARCH ?? MODEL ?? "claude-sonnet-4-6";
const MODEL_LIGHT = process.env.MODEL_LIGHT ?? MODEL ?? "claude-haiku-4-5-20251001";
const DRY_RUN = process.env.DRY_RUN === "1";
const BLITZ = process.env.BLITZ === "1";
const MAX_SITES = Number(process.env.MAX_SITES ?? "1");
const EXHAUSTION_THRESHOLD = Number(process.env.EXHAUSTION_THRESHOLD ?? "5"); // consecutive rejects → exit code 3
const REGION_FOCUS = process.env.REGION_FOCUS; // optional comma-separated region hints for parallel workers

const client = new Anthropic();

// Re-read fresh on each iteration in blitz mode (other workers may have pushed)
function loadSites() {
  return JSON.parse(readFileSync(SITES_PATH, "utf8"));
}
let sites = loadSites();
const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));

function gitCommitPush(newEntry) {
  // Optimistic-lock pattern: fetch latest remote, merge our entry in, commit, push.
  // On push rejection (another worker pushed first), reset and retry with fresh fetch.
  // Avoids rebase entirely — JSON conflicts don't merge cleanly with rebase.
  const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
  const name = newEntry.name.replace(/"/g, "");

  for (let attempt = 0; attempt < 6; attempt++) {
    // 1. Fetch latest remote sites.json without changing working tree
    execSync(`git fetch origin main`, { stdio: "inherit" });
    const remoteSitesRaw = execSync(`git show origin/main:src/data/sites.json`).toString();
    const remoteSites = JSON.parse(remoteSitesRaw);

    // 2. If another worker already pushed this site, skip
    if (remoteSites.some((s) => s.id === newEntry.id)) {
      console.log(`  Already pushed by another worker, skipping commit`);
      // Update local array to reflect remote state
      sites.length = 0;
      sites.push(...remoteSites);
      return;
    }

    // 3. Append our entry to the remote version and write
    remoteSites.push(newEntry);
    writeFileSync(SITES_PATH, JSON.stringify(remoteSites, null, 2) + "\n");
    sites.length = 0;
    sites.push(...remoteSites);

    // 4. Commit on top of remote HEAD
    execSync(`git fetch origin main && git reset --soft origin/main`, { stdio: "inherit" });
    execSync(`git add src/data/sites.json`, { stdio: "inherit" });
    execSync(`${GIT} commit -m "auto: add ${name}"`, { stdio: "inherit" });

    // 5. Try to push
    try {
      execSync(`git push origin HEAD:main`, { stdio: "inherit" });
      return; // success
    } catch (_) {
      // Another worker pushed between our fetch and push — reset and retry
      console.log(`  push retry ${attempt + 1}/6 (concurrent write)...`);
      execSync(`git reset --soft origin/main`, { stdio: "inherit" });
    }
  }
  throw new Error(`git push failed after 6 retries for "${name}"`);
}

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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function callClaude({ system, messages, tools, max_tokens = 8000, model = MODEL_RESEARCH }) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.messages.create({ model, max_tokens, system, messages, tools });
    } catch (err) {
      const isOverloaded = err.status === 529 || err.status === 529;
      const isRateLimit = err.status === 429;
      if ((isOverloaded || isRateLimit) && attempt < 3) {
        const waitMs = (attempt + 1) * 45000; // 45s, 90s, 135s
        console.log(`  API ${err.status} — waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
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

const attemptedSites = new Set(); // tracks "candidateName@locationId" to avoid repeat picks

async function pickGap() {
  const coverage = locations.map((l) => ({
    locationId: l.id,
    name: l.name,
    country: l.country,
    siteCount: sites.filter((s) => s.locationId === l.id).length,
  }));

  // HARD GUARD: never leave a location with zero dive sites. As long as any
  // empty location remains (and we haven't already burned this session's
  // attempts on it), the picker MUST target an empty location — the LLM is not
  // allowed to wander off to add a famous site in an already-covered spot.
  // Only once every location has ≥1 site do we fall back to editorial discretion.
  const emptyLocations = coverage.filter(
    (c) => c.siteCount === 0 && !attemptedSites.has(`__location__${c.locationId}`),
  );

  const sys = `You are the editorial director of scubaseason.fun, an authoritative dive-site guide.
You decide which dive site to add next based on (a) gaps in existing coverage and (b) editorial importance (famous, frequently-searched, or culturally significant sites).
You will be given coverage stats. Pick ONE site to add. Return strict JSON.`;

  const alreadyAttempted = [...attemptedSites].map(k => `- ${k}`).join("\n");

  let user;
  if (emptyLocations.length > 0) {
    // Deterministically lock onto one empty location; the LLM only names the
    // single most notable real dive site within it.
    const target = emptyLocations[0];
    attemptedSites.add(`__location__${target.locationId}`);
    console.log(`  [guard] ${emptyLocations.length} location(s) still have 0 sites — forcing target: ${target.name}`);

    user = `This location currently has ZERO dive sites and MUST be filled:
${JSON.stringify(target, null, 2)}

Existing site names (for dedup awareness):
${sites.map((s) => `- ${s.name} (${s.locationId})`).join("\n")}

${alreadyAttempted ? `Sites already attempted this session (DO NOT pick these again):\n${alreadyAttempted}\n` : ""}
Name the single most notable, real, well documented dive site within "${target.name}, ${target.country}" (locationId="${target.locationId}"). It must be a genuine, named dive site that you can corroborate from web sources — not invented.

Return JSON: { "locationId": "${target.locationId}", "candidateName": "...", "reasoning": "..." }`;
  } else {
    user = `Existing locations with site counts:
${JSON.stringify(coverage, null, 2)}

Existing site names (for dedup awareness):
${sites.map((s) => `- ${s.name} (${s.locationId})`).join("\n")}

${alreadyAttempted ? `Sites already attempted this session (DO NOT pick these again):\n${alreadyAttempted}\n` : ""}
Every location now has at least one site. Pick the single best dive site to add next. Prefer locations with siteCount < 2, OR famous missing sites (e.g. SS Thistlegorm, Blue Hole Dahab, Manta Point) within existing locations.
${REGION_FOCUS ? `\nBIAS YOUR PICK toward these regions/countries: ${REGION_FOCUS}. If no good gap exists there, pick the best gap elsewhere.` : ""}

Return JSON: { "locationId": "...", "candidateName": "...", "reasoning": "..." }`;
  }

  const resp = await callClaude({
    system: sys,
    messages: [{ role: "user", content: user }],
    max_tokens: 1000,
    model: MODEL_LIGHT,
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
    { type: "web_search_20250305", name: "web_search", max_uses: 12 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 15 },
  ];

  // Server-side tools loop. web_search / web_fetch execute on Anthropic's side.
  // Between rounds the API returns stop_reason "pause_turn" — we resend the full
  // message history (with the assistant turn appended) to continue.
  const messages = [{ role: "user", content: user }];
  let lastResp = null;
  for (let i = 0; i < 20; i++) {
    const resp = await callClaude({ system: sys, messages, tools, max_tokens: 20000, model: MODEL_RESEARCH });
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
    model: MODEL_LIGHT,
  });
  return extractJson(collectText(resp.content));
}

/* ---------- final audit: completeness attestation ---------- */

// Required location fields. Numbers (lat/lng) are checked for finiteness rather
// than truthiness so a legitimate 0 (equator / prime meridian) isn't flagged.
const LOCATION_REQUIRED_STRINGS = ["id", "slug", "name", "country", "region", "countryCode", "description"];

function auditLocation(loc) {
  const missing = [];
  for (const f of LOCATION_REQUIRED_STRINGS) {
    if (typeof loc[f] !== "string" || loc[f].trim() === "") missing.push(f);
  }
  if (!Number.isFinite(loc.lat)) missing.push("lat");
  if (!Number.isFinite(loc.lng)) missing.push("lng");
  if (!Array.isArray(loc.bestMonths) || loc.bestMonths.length === 0) missing.push("bestMonths");
  if (typeof loc.heroImageUrl !== "string" || loc.heroImageUrl.trim() === "") missing.push("heroImageUrl");
  return missing;
}

// Re-reads sites fresh so the audit reflects whatever every worker (and other
// sessions) have pushed — not just this process's in-memory copy.
function auditCompleteness() {
  const freshSites = loadSites();
  console.log("\n=== Completeness audit ===");

  const locsWithoutSites = [];
  const locsMissingFields = [];
  for (const loc of locations) {
    const siteCount = freshSites.filter((s) => s.locationId === loc.id).length;
    if (siteCount === 0) locsWithoutSites.push(loc);
    const missing = auditLocation(loc);
    if (missing.length) locsMissingFields.push({ id: loc.id, name: loc.name, missing });
  }

  const sitesInvalid = [];
  for (const s of freshSites) {
    const parsed = SiteSchema.safeParse(s);
    if (!parsed.success) {
      sitesInvalid.push({
        id: s.id ?? "(no id)",
        name: s.name ?? "(no name)",
        issues: parsed.error.issues.slice(0, 6).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`),
      });
    }
  }

  console.log(`Locations: ${locations.length} | Sites: ${freshSites.length}`);
  console.log(`Locations with NO dive site: ${locsWithoutSites.length}`);
  for (const l of locsWithoutSites) console.log(`  ✗ ${l.name} (${l.id})`);
  console.log(`Locations missing required fields: ${locsMissingFields.length}`);
  for (const l of locsMissingFields) console.log(`  ✗ ${l.name} (${l.id}) → ${l.missing.join(", ")}`);
  console.log(`Sites failing schema validation: ${sitesInvalid.length}`);
  for (const s of sitesInvalid) console.log(`  ✗ ${s.name} (${s.id}) → ${s.issues.join("; ")}`);

  const complete = !locsWithoutSites.length && !locsMissingFields.length && !sitesInvalid.length;
  if (complete) {
    console.log("✓ ATTESTATION PASSED: every location has ≥1 dive site and all required fields are populated.");
  } else {
    console.log("⚠ ATTESTATION INCOMPLETE: gaps remain (listed above). The next scheduled run will keep filling them.");
  }
  console.log("=== end audit ===\n");
  return { complete, locsWithoutSites, locsMissingFields, sitesInvalid };
}

/* ---------- main ---------- */

async function discoverOne() {
  console.log("→ Picking gap...");
  const gap = await pickGap();
  console.log(`  Target: ${gap.candidateName} @ ${gap.locationId}`);
  console.log(`  Reason: ${gap.reasoning}`);

  // Record this attempt immediately so it won't be picked again this session
  attemptedSites.add(`${gap.candidateName}@${gap.locationId}`);

  console.log("→ Researching...");
  const entry = await researchSite(gap);
  if (entry.refuse) {
    console.log(`  Refused: ${entry.reason}`);
    return null;
  }

  console.log("→ Validating schema...");
  const parsed = SiteSchema.safeParse(entry);
  if (!parsed.success) {
    console.error("  Schema errors:", parsed.error.issues.slice(0, 5));
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

  console.log(`Mode: ${BLITZ ? "BLITZ (direct push)" : DRY_RUN ? "DRY_RUN" : "PR"} | research: ${MODEL_RESEARCH} | light: ${MODEL_LIGHT} | max: ${MAX_SITES}${REGION_FOCUS ? ` | region: ${REGION_FOCUS}` : ""}`);

  const accepted = [];
  let consecutiveFails = 0;

  for (let i = 0; i < MAX_SITES; i++) {
    console.log(`\n[${i + 1}/${MAX_SITES}] consecutive_fails=${consecutiveFails}`);

    // In blitz, reload sites.json each iteration so we see parallel workers' additions
    if (BLITZ) {
      sites.length = 0;
      sites.push(...loadSites());
    }

    try {
      const entry = await discoverOne();
      if (entry) {
        consecutiveFails = 0;
        accepted.push(entry);
        sites.push(entry); // local dedup for this run

        if (BLITZ) {
          // write + commit + push immediately, don't wait for end of loop
          console.log(`  ↑ committing ${entry.name}...`);
          gitCommitPush(entry); // handles write + fetch + commit + push atomically
          console.log(`  ✓ pushed ${entry.name} → prod`);
        }
      } else {
        consecutiveFails++;
        if (consecutiveFails >= EXHAUSTION_THRESHOLD) {
          console.log(`\n✓ Exhaustion threshold reached (${EXHAUSTION_THRESHOLD} consecutive non-accepts). Done.`);
          break;
        }
      }
    } catch (err) {
      console.error(`  Iteration error: ${err.message}`);
      consecutiveFails++;
      if (consecutiveFails >= EXHAUSTION_THRESHOLD) {
        console.log(`\n✓ Exhaustion threshold reached after errors. Done.`);
        break;
      }
    }
  }

  if (!BLITZ) {
    // Batch write for non-blitz modes
    if (accepted.length === 0) {
      console.log("No sites accepted this run.");
      auditCompleteness();
      process.exit(2); // signal to CI: nothing to PR
    }
    const out = DRY_RUN ? PROPOSED_PATH : SITES_PATH;
    const base = DRY_RUN && existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : sites;
    const finalArr = DRY_RUN ? [...base, ...accepted] : sites;
    writeFileSync(out, JSON.stringify(finalArr, null, 2) + "\n");
    console.log(`\n✓ Wrote ${accepted.length} site(s) to ${out}`);
    console.log("ADDED_SITES=" + accepted.map((s) => s.name).join(", "));
  } else {
    console.log(`\n✓ Blitz complete. Added ${accepted.length} sites.`);
    console.log("ADDED_SITES=" + accepted.map((s) => s.name).join(", "));
    if (accepted.length === 0) {
      auditCompleteness();
      process.exit(2);
    }
  }

  // Final attestation: confirm every location has a dive site and all required
  // fields on locations and sites are populated. Reports gaps but does not fail
  // the run — the daily routine converges over successive runs.
  auditCompleteness();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
