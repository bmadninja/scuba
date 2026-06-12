# Autonomous build mode — walk-away contract

Prepend this block to any task you want Claude to run start-to-finish without
stopping to ask. Then add your actual task below the line.

Why this exists: by default Claude (a) rewrites the prompt and asks you to
confirm before implementing, (b) checks in at phase boundaries, and (c) uses the
AskUserQuestion tool at forks — each of which halts the run. This block cancels
all three so you can step away.

NOTE: this block intentionally OVERRIDES the standing memory rule
"rewrite every implementation request as a clean spec first, confirm, then
implement — no exceptions." In autonomous mode you write the spec to a file and
keep going instead of waiting for sign-off.

---

## Autonomy contract — run to completion without stopping

- Run this task start to finish: spec → user stories/tests → implement → QA loop
  until green. Do NOT stop to confirm, do NOT check in at phase boundaries, do
  NOT ask me to choose, do NOT end a turn with "ready to proceed?". Go dark and
  work until it's done.
- **Do not use the `AskUserQuestion` tool.** At any fork, pick the option that
  best serves the stated goal, append the decision + one-line reasoning to a
  running `DECISIONS.md` at the repo root, and keep going. I review it at the end.
- Honesty/credibility forks (e.g. data isn't truly live, a claim might overstate):
  always choose the honest option — fix the data so the claim is true, or soften
  the copy so it doesn't overstate. Never pick the version that misleads. Log it.
- Skip the "rewrite as a spec and confirm" step. Rewrite the spec inline, write
  it to `SPEC.md`, and proceed in the SAME turn without waiting for sign-off.
- Orchestrate parallel subagents for independent legs (per the standing rule).
- Only surface to me BEFORE the end if you are genuinely blocked by something
  only I can provide: a missing credential/API key, a paid-account action, or a
  destructive/irreversible action (deploy, force-push, data deletion). Taste,
  scope, and design preference are NOT blockers — decide and log.
- Respect all house rules (no hyphens in copy, plain language, info popups not
  page jumps, one clear action, dedupe, live data, underwater hero images).
- Do NOT deploy. Work on a branch.
- When everything is green, THEN report: what shipped, the full `DECISIONS.md`,
  any data-freshness findings, and the test results.

---

## Task

<!-- describe the actual work here -->
