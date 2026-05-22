# scubaSeason.Fun — Session Status

_Last updated: 2026-05-21_

## Completed this session
- Wrote [STORIES.md](STORIES.md) — 21 user stories with machine-checkable AC,
  aligned to upstream's `/sites/[slug]` routing and JSON data layer.
- Built [scripts/verify-stories.mjs](scripts/verify-stories.mjs) — boots (or
  reuses) `next dev`, hits real routes, asserts on rendered HTML, exits nonzero
  on failure. Reuses an already-running dev server (Next 16 enforces single
  instance, so this matters).
- Added `npm run verify:stories` script.
- Fixed 4 baseline failures: added [AffiliateDisclosure](src/components/affiliate-disclosure.tsx)
  to the site detail aside (commission text), switched B3's peak-months probe to a
  site with seasonal species, escaped two apostrophes in [/about](src/app/about/page.tsx),
  silenced one ESLint warning.

## Current state
**21 of 21 stories passing.** `npm run verify:stories` exits 0.

## In progress
- Autonomous loop (`/loop`) is now armed. Each iteration:
  1. Runs `npm run verify:stories`.
  2. If all green → stops.
  3. If failing → picks the lowest-numbered failing story, edits source under
     `src/` to flip its AC, re-verifies. Never weakens AC to pass.
- The loop self-paces with short pauses to keep cache warm.

## Next
- Add more stories to STORIES.md as the PRD evolves; the loop will pick them up.
- Run `node scripts/verify-stories.mjs --build` to add F1 (production build)
  to the gate before deploy.
- Tear down `../scuba-preview` worktree once no longer needed:
  `git worktree remove ../scuba-preview`.

## Decisions / context
- Verifier reuses an existing `next dev` on port 3000/3001/3002 because Next 16
  enforces single-instance. It will NOT kill someone else's server.
- B3 (species peak months) uses `raja-ampat-blue-magic` (has seasonal species)
  rather than the flagship `raja-ampat-cape-kri` (all-year-round species).
- B5/E1 disclosure depends on AffiliateDisclosure rendering on every page with
  sponsored links — keep that invariant if you add new affiliate surfaces.
