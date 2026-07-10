# Reef-State Redesign — Implementation Status (handoff)

_Branch: `claude/reef-state-new-data-molpce` · PR #54 · updated 2026-07-10_

## Done (committed + pushed)

**PRD** (`prd.md`, `addendum.md`, `.decision-log.md`, reviewer + regression reports) — status `final`.

**Engine** — `src/lib/data/reef-state-pillars.ts` (pure, unit-tested) + `getReefStateDetail()` in `src/lib/data/reef-state.ts`. Four pillars: coral (outcome-anchored cover bins), thermal (continuous DHW), fish (per-source percentile: RLS > AGRRA > REEF, 77 sites), fishing (reconciled band + trajectory). Composite → verdict + 3-tier confidence. Invariants preserved (FR-3 floor, FR-4 coral-present-for-Improving, hard heat/coral triggers, thin-evidence guard). `getReefState()` delegates → non-breaking enum.

**UI** — `src/components/reef-state-breakdown.tsx` on the location page (`page.tsx` → `location-page-body.tsx`): per-pillar score bars + notes + confidence tier chip + "Editorially adjusted" note for override sites (FR-12/13/16). Methodology popup copy updated (FR-14, `atlas-info-popup.tsx`).

**Regression** — `scripts/verify-reef-state.ts` (`node --experimental-strip-types`): unit asserts + writes `reef-state-regression.md`. All 3 fish-driven `thriving` overrides classify genuine-exception (compute Not surveyed); `channel-islands` computable. Distribution: 89 Stable / 11 Improving / 21 Declining across 121 surveyed locations.

Verified: `tsc --noEmit` clean; harness green; renders on dev + Vercel preview.

## Not done / next options
1. **Old-vs-new verdict diff** — site-by-site report of which verdicts changed vs the old 3-input model (for Josie to sanity-check the distribution shift before merge).
2. **Listing reef cards** — surface the confidence tier / breakdown on `reef-state-card.tsx` and globe markers (currently location page only).
3. **Merge decision** — Josie reviewing the Vercel preview; nothing merged yet.

## Preview
Vercel branch alias: https://scuba-git-claude-reef-state-new-d-550119-josietyleungs-projects.vercel.app (good page: `/locations/channel-islands-usa`).

## Run locally / verify
- `npm ci` (fresh container has no node_modules)
- `node --experimental-strip-types scripts/verify-reef-state.ts`
- `PORT=3300 npm run dev` → http://localhost:3300/locations/channel-islands-usa
