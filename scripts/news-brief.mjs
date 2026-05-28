#!/usr/bin/env node
/**
 * Scubaseason Watch — daily news-brief generator.
 *
 * Flow:
 *   1. Load the brief spec (scripts/news-brief-prompt.md).
 *   2. Run Claude with web_search + web_fetch to scan the monitoring list.
 *   3. Extract the brief between <<<BRIEF … BRIEF>>> markers.
 *   4. Write it to docs/news-brief.md (git history is the archive).
 *
 * Env:
 *   ANTHROPIC_API_KEY   required
 *   MODEL               optional, defaults to claude-opus-4-7
 *
 * Exits:
 *   0  brief written
 *   1  hard failure (API error, no brief produced)
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROMPT_PATH = resolve(ROOT, "scripts/news-brief-prompt.md");
const OUT_PATH = resolve(ROOT, "docs/news-brief.md");

const MODEL = process.env.MODEL ?? "claude-opus-4-7";
const client = new Anthropic();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callClaude({ system, messages, tools, max_tokens = 8000 }) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await client.messages.create({ model: MODEL, max_tokens, system, messages, tools });
    } catch (err) {
      const retryable = err.status === 529 || err.status === 429;
      if (retryable && attempt < 3) {
        const waitMs = (attempt + 1) * 45000;
        console.log(`  API ${err.status} — waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
        continue;
      }
      throw err;
    }
  }
}

const collectText = (content) =>
  content.filter((c) => c.type === "text").map((c) => c.text).join("\n");

function extractBrief(text) {
  const m = text.match(/<<<BRIEF\s*([\s\S]*?)\s*BRIEF>>>/);
  if (!m) return null;
  const brief = m[1].trim();
  return brief.startsWith("#") ? brief : null;
}

async function generateBrief() {
  const spec = readFileSync(PROMPT_PATH, "utf8");
  const today = new Date().toISOString().slice(0, 10);

  const system =
    "You are a meticulous dive-news monitoring analyst. You only report items you can corroborate from the named sources. You follow the output format exactly.";
  const user = `Today's date is ${today}. Produce the Scubaseason Watch brief per this spec:\n\n${spec}`;

  const tools = [
    { type: "web_search_20250305", name: "web_search", max_uses: 12 },
    { type: "web_fetch_20250910", name: "web_fetch", max_uses: 12 },
  ];

  // Server-side tool loop: web_search / web_fetch run on Anthropic's side.
  // Between rounds the API returns stop_reason "pause_turn"; resend history to continue.
  const messages = [{ role: "user", content: user }];
  for (let i = 0; i < 24; i++) {
    const resp = await callClaude({ system, messages, tools, max_tokens: 12000 });
    messages.push({ role: "assistant", content: resp.content });
    console.log(`  [turn ${i}] stop=${resp.stop_reason} blocks=${resp.content.map((c) => c.type).join(",")}`);

    if (resp.stop_reason === "end_turn") {
      const brief = extractBrief(collectText(resp.content));
      if (brief) return brief;
      messages.push({
        role: "user",
        content:
          "I don't see the brief wrapped in <<<BRIEF … BRIEF>>> markers. Emit ONLY the brief now, wrapped exactly in those markers.",
      });
      continue;
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
        content: "You hit max_tokens. Skip narration and emit ONLY the brief in <<<BRIEF … BRIEF>>> markers.",
      });
      continue;
    }
    throw new Error(`Unexpected stop_reason: ${resp.stop_reason}`);
  }
  throw new Error("Tool loop exceeded 24 turns without a brief");
}

const brief = await generateBrief();
mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, brief.endsWith("\n") ? brief : brief + "\n", "utf8");
console.log(`BRIEF_WRITTEN=docs/news-brief.md`);
