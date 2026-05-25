# Roadmap: scubaSeason.fun — Milestone M2

**Defined:** 2026-05-24
**Core Value:** Help a diver decide where to go next, with honest evidence.

M1 (BMAD v2 backlog) shipped phases 1–5 informally; M2 begins phase numbering at **6** and continues sequentially.

## Milestone Goal

Turn the source-aware data layer from M1 into (a) universal coverage so every location/site reflects honest evidence, and (b) a trip-planning funnel that turns research into a decision.

## Phases

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 6 | Reef-health backfill | Every location has reef-health data + diving outlook | REEF-01..05 | 5 |
| 7 | Sighting evidence backfill | Every site has at least one sighting record | SIGHT-01..04 | 4 |
| 8 | Trip planner — itinerary builder | `/plan` route stitches site + lodging + operator + gear | PLAN-01..06 | 5 |
| 9 | Trip planner — cost transparency | Bounded cost ranges per location with documented sources | COST-01..04 | 4 |
| 10 | Planner discovery + integration | Planner is reachable from `/sites`, `/encounters`, header nav | DISC-01..03 | 3 |

**5 phases · 22 requirements · all covered ✓**

---

## Phase 6: Reef-health backfill

**Goal:** Every one of the 111 locations renders a populated `ReefHealthPanel` with verdict, cover bars, alert, and diving outlook. Validator stays green.

**Requirements:** REEF-01, REEF-02, REEF-03, REEF-04, REEF-05

**Success criteria:**
1. `reef-health.json` has ≥ 1 record for every locationId in `locations.json`
2. Every record carries `divingOutlook` and `historicalCoralCoverPercent`/`historicalSurveyDate`
3. `npm run validate:provenance` reports 0 errors
4. A backfill script (`scripts/backfill-reef-health.mjs`) exists and is documented — re-runnable
5. Spot-check 5 random location pages: each renders the panel (not the "No survey on file" placeholder)

**Notes:** AI-assisted draft generation pulling from NOAA CRW, GBIF, OBIS, Allen Coral Atlas + region-specific monitoring (AIMS, NCRMP, GCRMN, AGRRA). Editorial review checkpoint before commit.

---

## Phase 7: Sighting evidence backfill

**Goal:** Every dive site card renders a sighting badge. Every site detail page renders the Sightings Evidence section.

**Requirements:** SIGHT-01, SIGHT-02, SIGHT-03, SIGHT-04

**Success criteria:**
1. `sightings.json` has ≥ 1 record for every siteId in `sites.json` (184 sites)
2. Backfill pipeline (`scripts/backfill-sightings.mjs`) is committed and re-runnable
3. Validator passes — no `probabilityPercent` slips in
4. Spot-check 10 random site cards: every one shows a confidence dot + species + last-confirmed line

**Notes:** Pipeline reads each site's `species[]`, queries GBIF/OBIS for those species within a proximity radius, builds a draft record per site. AI-assisted naming and notes; deterministic recordCount/seasonality from API output.

---

## Phase 8: Trip planner — itinerary builder

**Goal:** Visitors can land on `/plan?location=…&days=7&cert=advanced` and get a complete buildable trip.

**Requirements:** PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06

**Success criteria:**
1. `/plan` route exists, statically generates per location (111 pages or one dynamic page)
2. Builds a coherent trip from existing data: site picks, operator block, lodging tiers, gear list, season fit
3. URL is the canonical state — copy-paste reproduces the exact build
4. Cert level gates which sites surface (re-uses minSkillRank rule)
5. Output is printable / shareable; no JavaScript required to read the trip once loaded

**Notes:** Static-friendly — the planner reads URL params and renders deterministic JSX. No backend.

---

## Phase 9: Trip planner — cost transparency

**Goal:** Every trip output includes a bounded cost panel with documented sources.

**Requirements:** COST-01, COST-02, COST-03, COST-04

**Success criteria:**
1. `src/data/trip-costs.json` carries per-location ranges for flight, dive package, lodging, ground logistics
2. Planner renders a "What this trip costs" panel with per-day + total ranges
3. Methodology drawer documents sources and last-reviewed date
4. Cost figures are framed as bounded estimates, never quotes — language audit confirms

**Notes:** Hand-curated by region. Re-use the methodology pattern from M1 (source IDs + limitations).

---

## Phase 10: Planner discovery + integration

**Goal:** Planner is one click away from every relevant browsing surface.

**Requirements:** DISC-01, DISC-02, DISC-03

**Success criteria:**
1. Site cards include a secondary CTA linking to `/plan?location=…`
2. Encounter detail pages link to `/plan?location=…&encounter=…` for each listed location
3. Header nav exposes "Plan a trip" on every page

---

## Build order

Strictly sequential — each phase depends on the previous:

1. **Phase 6** first — reef-health data is referenced by the planner's season-fit logic
2. **Phase 7** before Phase 8 — sighting badges appear on the planner's site picks
3. **Phase 8** before Phase 9 — cost panel mounts inside the planner
4. **Phase 9** before Phase 10 — discovery links should land on the fully-built planner

---

*Roadmap defined: 2026-05-24*
