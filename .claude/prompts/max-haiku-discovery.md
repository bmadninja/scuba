# Max + Haiku dive-site discovery routine

You are a scheduled, autonomous dive-site discovery pass for scubaseason.fun. You run on **Claude Max credit using Haiku subagents** — NOT the paid API. Work only in `/Users/josietyleung/github/scuba` and only touch `src/data/sites.json` as described. Keep it cheap and bounded. Do not deploy, do not push to prod beyond the normal data commit, do not ask the user anything (this is autonomous).

## Procedure

1. **Sync main:**
   `cd /Users/josietyleung/github/scuba && git fetch origin main -q && git checkout origin/main -- src/data/sites.json src/data/locations.json`

2. **Find gaps:** `node scripts/find-site-gaps.mjs 8`
   This prints up to 8 target locations (empty locations first, then thin ones). **If it prints `[]`, the catalog is caught up — stop now, this run is a cheap no-op. Do not invent work.**

3. **Research each target with a Haiku subagent** (one per target, run them in parallel). For each, use the Agent tool with `model: "haiku"`, `subagent_type: "general-purpose"`. Give the agent:
   - the location `id`, `name`, `country`, and anchor `lat`/`lng`
   - the location's `existingSites` list with the instruction: **pick a DIFFERENT, notable dive site not in that list** (for thin locations you are adding variety, not duplicating what exists)
   - the schema contract: run `node -e 'import("./scripts/lib/site-schema.mjs").then(m=>console.log(m.SCHEMA_DESCRIPTION_FOR_LLM))'` and paste it in
   - these rules, stated explicitly:
     - **Depth is in METERS, never feet.** A dive site's max depth is almost never >60m.
     - Coordinates may be approximate near the anchor — do NOT refuse just because exact GPS is proprietary.
     - 4+ species; **exactly 12** `conditionsByMonth` entries (months 1..12); `bestMonths` required on any species marked `seasonal`.
     - Leave `lodging`, `operators`, `gearIds`, `siteSpecificGear` as empty arrays; `heroImageUrl: null`.
     - Decode HTML entities (write `&`, not `&amp;`).
     - If the site cannot be corroborated by 3+ independent sources, return exactly `{"refuse": true, "reason": "..."}`.
   - instruction: final message must be ONLY the raw JSON object (or refuse object).

4. **Normalize + guard each returned entry** (skip refusals):
   a. Write the raw JSON to a temp file under the scratchpad dir.
   b. `node scripts/normalize-site-entry.mjs <tempfile>` — auto-repairs the quirks Haiku reliably emits (float temps → int, null `bestMonths` → dropped, HTML entities decoded, `slug` = `id`). This keeps good sites from being discarded over trivial formatting.
   c. `node scripts/validate-site-entry.mjs <tempfile>` — if it exits non-zero, **SKIP this entry** (log the printed reasons). This catches schema errors, duplicates, feet/meters depth bugs, and out-of-range coordinates.
   d. **Fact-check:** spawn a second `model: "haiku"` subagent as a skeptical fact-checker. Give it the entry JSON and ask for `{"score": 0..1, "issues": [...]}` — score <0.8 if coordinates look off, species look generic, depth implausible, or description vague. If `score < 0.8`, **SKIP this entry.**

5. **Commit the survivors:** append every entry that PASSED the guard AND scored ≥0.8 to `src/data/sites.json` (keep 2-space indent + trailing newline), then:
   `git add src/data/sites.json && git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot" commit -m "data: add <names> (Max+Haiku discovery)" && git fetch origin main -q && git rebase origin/main -q && git push origin main -q`
   (If nothing survived, do not commit.)

6. **Done.** Print a one-line summary (how many added, names; how many skipped and why). No Telegram needed — the 8am/5pm "Dive site count" routine surfaces additions.

## Guardrails (hard rules)
- **Haiku subagents only** (`model: "haiku"`). This must stay on Max credit and cheap.
- **Max 8 new sites per run** (spawn the 8 research subagents in parallel; runs are 5h apart so a batch this size fits inside one Max window). If you notice throttling/rate-limit errors, finish the sites you have and stop early rather than hammering.
- **Never commit** an entry that fails `validate-site-entry.mjs` or scores <0.8.
- If `find-site-gaps.mjs` returns `[]`, do nothing and exit.
