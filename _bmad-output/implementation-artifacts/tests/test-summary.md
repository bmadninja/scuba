# Test Automation Summary

Framework: **Playwright** (`@playwright/test`), the project's existing harness.

## Generated Tests (this session)

### E2E — redesigned atlas (`tests/redesign-atlas.spec.ts`)
Covers the live atlas stage on the homepage, which previously had no dedicated
coverage:
- [x] Seasonal split + "Great at other times of year" divider (present in Best
      season sort, absent in flat sorts)
- [x] Sort dropdown (default, Name, Oldest, URL round-trip)
- [x] Month filter (12 month buttons, single + multi-month URL state)
- [x] "Needs fresh eyes" evidence-gap toggle reduces the reef count
- [x] Certification level filter
- [x] Cards / Map (globe) view toggle
- [x] Reef-count `aria-live` region updates after filtering
- [x] Reef-state filter checkboxes + URL persistence
- [x] Empty state

22 tests — all passing (run with `--workers=1`; see perf note below).

### E2E — redesigned location page (`tests/redesign-location.spec.ts`)
Covers the new location detail page + `location-page-body.tsx` (715-line client
body that previously had only a "loads" + "404" smoke test). Fixture: Ari Atoll.
- [x] Reef-condition section renders with the coral-cover chart (SVG `role="img"`)
- [x] Reef-state metric + info trigger present
- [x] "Plan your trip" rail with Best months
- [x] "Where to stay" expander reveals booking links; "Getting there" present
- [x] "What you'll see" species cards with recency line
- [x] Dive-site rows link to `/sites/[slug]` and navigate on click
- [x] Info (i) popup opens a modal dialog and closes (hydration-safe retry)
- [x] **Mobile (390×844):** no horizontal overflow, sections stack, popup works

13 tests — all passing.

### Data integrity — hero photos (`tests/hero-photos.spec.ts`)
Guards the photo rules so the duplicate/fallback bug cannot recur:
- [x] Every hero URL is globally unique across all locations AND sites
- [x] `photo-quality.ts` exports no hardcoded fallback image
- [x] No stored hero matches a known surface/aerial/specimen/satellite pattern
- [x] All hero URLs are absolute https image URLs

4 tests — all passing.

## Hero-photo remediation (done this session)
- Deleted the hardcoded `UNDERWATER_PHOTO_FALLBACK` (one cenote photo that was
  rendering on every reef with a missing/rejected photo — the visible bug).
- Missing photos now render a deterministic ocean-gradient placeholder
  (`src/components/hero-photo.tsx`), never a borrowed/duplicate image.
- Stopped locations borrowing a dive site's photo (`atlas-location.ts`).
- Re-sourced ~96 photos to be globally unique, underwater, good quality
  (>=1200px sites / >=1400px locations), and subject-appropriate — locations are
  sourced by their signature species (what the reef is known for).
  Script: `scripts/dedupe-and-fill-heroes.mjs`.
- 11 niche sites/locations (caves, cenotes, a few remote spots) intentionally
  show the gradient — no acceptable unique underwater photo found, never a dup.

## Coverage
- Atlas stage interactions: covered (new).
- Hero-photo data invariants: covered (new).
- Location/site detail, search, sites explorer: covered by existing specs.

## Pre-existing issues found (out of scope, NOT caused by this work)
1. `homepage.spec.ts:26` "nav has a search box" — the nav search box's
   accessible name does not match `/search reefs/i`. Likely a stale assertion
   after the nav redesign.
2. `epic7.spec.ts` / `epic7-followup.spec.ts` — several tests time out (120s)
   when the suite runs with multiple workers, because the redesigned location
   and site pages are heavy in dev mode (large client bundle + THREE.js globe).
   The pages return HTTP 200 with the expected content; the failures are
   dev-server compile/hydration timeouts, not functional regressions. Mitigation:
   run with `--workers=1`, or add a production-build CI step.

## Next Steps
- Wire `tests/hero-photos.spec.ts` into CI as a hard gate on the photo rules.
- Triage the two pre-existing issues above separately.
