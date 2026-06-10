# Overnight BMAD Run — UX → Stories → Implementation → QA

Use this prompt to kick off a full overnight BMAD flow.
Paste into a new Claude Code session. It will pause after Phase 1 for your story approval, then run straight through.

---

Tonight we are completing the full BMAD UX → stories → implementation → QA flow
for scubaseason.fun. Last night we completed UX design and mockups (in
_bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/mockups/) but only
implemented the home page. Tonight we do the rest — end to end.

## Phase 1 — User Stories (requires my approval before Phase 2 starts)

Read every mockup HTML file in the mockups/ directory. For each page/component
that is NOT yet implemented (everything except the home page), write a user story
following BMAD story format. Store stories in
_bmad-output/planning-artifacts/stories/.

Each story must include:
- Title, goal, acceptance criteria
- Exact component/route it maps to in src/app/
- Reference to the mockup file it is derived from
- Definition of done that includes a passing QA test

Present a summary list of all stories to me for approval. DO NOT begin
implementation until I have replied "approved" or "approved with changes."

## Phase 2 — Implementation (starts only after I approve Phase 1)

Implement each approved story one at a time:
- Read the mockup HTML carefully and match it pixel-for-pixel in the Next.js
  component (check node_modules/next/dist/docs/ before writing any Next.js code)
- Follow the design system in
  _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/DESIGN.md exactly
- Never use hyphens in user-facing copy (em dashes — are fine)
- Every hero image must be an underwater photograph
- Hero subject must match what the location/site is known for (wreck/animal/cave)
- Commit each story as its own git commit when complete

## Phase 3 — QA

After all stories are implemented, run the full BMAD QA process:
- Use bmad-qa-generate-e2e-tests to generate Playwright tests for every page
  that was implemented tonight
- Run the test suite (npx playwright test)
- Fix any failures and re-run until all pass
- Write a QA summary to _bmad-output/implementation-artifacts/tests/test-summary.md

## When everything is done

Send me a Telegram message summarising:
- Which pages were implemented
- How many user stories were completed
- Test pass/fail counts
- Any known gaps or deferred items
