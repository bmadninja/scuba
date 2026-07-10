# Reef-health pillars — coordination contract

_Shared note between two concurrent workstreams so they do not collide on the reef-state score._
_Owner of this note: fishing-pressure session (2026-07-10). Please read before editing `src/lib/data/reef-state.ts`._

## Why this exists

Two sessions are changing inputs to the same reef-state label (Improving / Stable / Declining):

- **Fish-biomass pillar** (other session) — effort-standardized fish biomass as the "improving" evidence.
- **Fishing-pressure pillar** (this session) — the pressure that drives biomass down; see the full research at
  `_bmad-output/planning-artifacts/research/technical-fishing-pressure-data-for-reef-health-research-2026-07-10.md`.

Both feed `getReefState()` in `src/lib/data/reef-state.ts`. **Neither session should unilaterally rewrite the
scoring weights in that file.** Land data + readers independently; make the scoring change jointly (last section).

## Current shared score (as built, do not silently change)

`getReefState()` today:
- Needs a condition signal (NOAA thermal alert or observed coral cover) or returns `unknown`.
- **Declining** if coral cover < 25% or alert rank ≥ 3.
- **Improving** if cover ≥ 40% (or null), alert rank ≤ 1, `fishingAllowsImproving(effective)` is true, and cover not falling.
- Else **Stable**.

So fishing pressure is already a **gate** on Improving (`fishingAllowsImproving` in `effective-fishing.ts`), never a
trigger for Declining. Fish biomass is currently display-only and does not set the label.

## What the fishing-pressure session is landing (no scoring change)

Data + display only, additive, no edits to `reef-state.ts`:

1. **GFW honesty relabel** — the GFW effort read is now labeled "commercial vessel activity", not bare "fishing
   pressure", because AIS misses small-scale/artisanal fishing (Paolo 2024: ~72–76% of *industrial* vessels alone are
   untracked). Files: `fishing-effort-trend.tsx`, location-page `fishingPill`.
2. **GFW series floored at 2017** — `fetch-fishing-pressure.mjs` now clamps the window start to 2017 (pre-2017 "growth"
   is AIS receiver rollout, not real fishing). Re-run with `GFW_API_TOKEN` set to populate the real multi-year series
   (records currently hold only 2 points).
3. **Reef gravity (universal pressure level)** — new `src/data/reef-gravity.json` + `src/lib/data/reef-gravity.ts`,
   from the published Cinner 2018 / Andrello 2022 open data. This is the honest per-site fishing-pressure level that
   works on every reef, including the artisanal ones GFW is blind to. Banding documented in the reader.
4. **Halpern historical layer** (optional depth) — new `src/data/halpern-fishing.json`, per-site 2003–2013 fishing
   intensity incl. the artisanal layer, for pre-2017 trend context.

## The interface the two pillars share

**Reef gravity is the shared covariate.** In the literature (Cinner 2016/2018/2020, MacNeil 2015, Yeager) reef gravity
is the fishing-pressure predictor in the *same* models that predict fish biomass. So:

- Both pillars must read **one** per-site gravity value from `src/lib/data/reef-gravity.ts`
  (`getReefGravityForLocation(locationId)`). Do not compute two different gravity numbers.
- The biomass pillar interprets high gravity as expected *low* biomass; the pressure pillar interprets high gravity as
  *high* pressure. Same number, opposite sign. Keep it single-sourced.

## The joint scoring change (decide together — NOT yet implemented)

Recommended target, backed by the Mesoamerican Reef Health Index precedent (4 equally weighted indicators, two of them
fishing metrics): move from the current binary gate to a **graded three-pillar score** —
coral cover + fish biomass + fishing pressure, weighted roughly co-equally.

Proposed division of labor so the change is clean:
- **Pressure pillar** provides `fishingPressureLevel(locationId)` from gravity (upgraded to GFW/protection modifiers).
- **Biomass pillar** provides `biomassStanding(locationId)` (fraction of expected/B0).
- One of us, once both readers exist, edits `reef-state.ts` **in a single PR both sessions review**, replacing the
  `fishingAllowsImproving` gate with the graded score. Do not do this piecemeal from two branches.

Open decision for Josie: whether to surface the internal `paper-park` flag (protected on paper + heavy measured GFW
effort). Currently computed but hidden in v1. Surfacing it publicly accuses a specific MPA of failing — an editorial /
reputational call, not a code call. Flagged, not changed.
