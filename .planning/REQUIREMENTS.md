# Requirements: scubaSeason.fun — Milestone M2

**Defined:** 2026-05-24
**Core Value:** Help a diver decide where to go next, with honest evidence.

## v2 (M2) Requirements

### Data Backfill — Reef Health

- [ ] **REEF-01**: Reef-health records exist for all 111 locations (currently 12). Each carries observed condition, current thermal stress, and where appropriate a documented projection.
- [ ] **REEF-02**: Every reef-health record carries `divingOutlook` editorial copy so the "What to expect on a dive" card always populates.
- [ ] **REEF-03**: Every reef-health record carries `historicalCoralCoverPercent` + `historicalSurveyDate` so the cover-comparison bars always render.
- [ ] **REEF-04**: A backfill pipeline (script + AI assist) generates draft records from GBIF/OBIS/NOAA-CRW with editorial review checkpoints; output is committable JSON.
- [ ] **REEF-05**: Validator must still pass with 0 errors after backfill.

### Data Backfill — Sighting Evidence

- [ ] **SIGHT-01**: Sighting evidence records exist for all 184 sites (currently 17). Each site has at least one species-level record with last-confirmed date, recent-record count within a proximity radius, and seasonality cluster.
- [ ] **SIGHT-02**: A backfill pipeline (script + GBIF/OBIS API + AI assist) generates draft records keyed off each site's `species[]` list with editorial review.
- [ ] **SIGHT-03**: No record may carry a numeric per-dive probability; validator continues to reject `probabilityPercent`.
- [ ] **SIGHT-04**: Site cards continue to show the highest-signal sighting badge (no card lacks a sighting badge once backfill lands).

### Trip Planner — Itinerary Builder

- [ ] **PLAN-01**: A `/plan` route exists where a visitor picks a location, trip length (days), and certification level.
- [ ] **PLAN-02**: The planner renders a build with: 2–6 dive sites at the location, a recommended operator block, lodging suggestions split by tier, a gear checklist scoped to the picked sites, and a season-fit summary.
- [ ] **PLAN-03**: Planner output is URL-state — copy-paste `/plan?location=raja-ampat-indonesia&days=7&cert=advanced` reproduces the exact build.
- [ ] **PLAN-04**: Planner respects cert level — only surfaces sites at or below the visitor's certification (same minSkillRank rule as the homepage filter).
- [ ] **PLAN-05**: Planner respects climate-stressed/stable visitor preference (optional URL param).
- [ ] **PLAN-06**: Planner output is shareable / printable — the URL is the canonical artefact.

### Trip Planner — Cost Transparency

- [ ] **COST-01**: Per-location trip-cost estimate data layer (`src/data/trip-costs.json` or equivalent) with hand-curated low/mid/upscale ranges for flight (from major US/EU/AU origin region), dive package, lodging per night, and ground logistics.
- [ ] **COST-02**: The planner output includes a "What this trip costs" panel with a per-day and total range derived from selected days + lodging tier.
- [ ] **COST-03**: Cost methodology is documented (sources + last-reviewed date) and appears in the disclosure drawer — no fake precision.
- [ ] **COST-04**: Costs are clearly framed as estimates / bounded ranges, not quotes.

### Trip Planner — Discovery

- [ ] **DISC-01**: Existing site cards on `/sites` link to `/plan?location=…` as a secondary CTA so the planner is discoverable from the catalogue.
- [ ] **DISC-02**: Existing encounter detail pages link to `/plan?location=…&encounter=…` for each listed location so visitors can go from "I want to see sardine run" to "plan the trip" in one click.
- [ ] **DISC-03**: Header nav exposes "Plan a trip" across the site.

## Future Requirements (M3+)

### Mobile UX
- **MOB-01**: `/sites` filter bar uses a bottom-sheet pattern on mobile
- **MOB-02**: Encounter detail responsive polish
- **MOB-03**: Reef-health panel reflows for narrow viewports

### Visual Browsing
- **MAP-01**: Globe component on `/sites` for visual region pick
- **MAP-02**: Per-location reef-health colored on the homepage globe (e.g. red for Alert 1+ locations)

### Sighting Freshness
- **FRESH-01**: Nightly Vercel cron that re-fetches GBIF/OBIS and rebuilds sighting records (replaces hand-curation as data scale grows)

### Diver-Submitted Data
- **UGC-01**: Diver sighting reports with photo verification
- **UGC-02**: Reef-health citizen-science contributions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time flight pricing | API maintenance burden; hand-curated bounded ranges fit the editorial-trust theme |
| Hotel booking | Affiliate hand-off, not direct booking |
| User accounts / saved trips | URL state covers shareability for v2; defer accounts until clear demand |
| Comparison tool (side-by-side trips) | Itinerary builder is the chosen v2 output; comparison defers to M3 |
| Real-time chat / forum | Out of remit |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REEF-01 | Phase 6 | Pending |
| REEF-02 | Phase 6 | Pending |
| REEF-03 | Phase 6 | Pending |
| REEF-04 | Phase 6 | Pending |
| REEF-05 | Phase 6 | Pending |
| SIGHT-01 | Phase 7 | Pending |
| SIGHT-02 | Phase 7 | Pending |
| SIGHT-03 | Phase 7 | Pending |
| SIGHT-04 | Phase 7 | Pending |
| PLAN-01 | Phase 8 | Pending |
| PLAN-02 | Phase 8 | Pending |
| PLAN-03 | Phase 8 | Pending |
| PLAN-04 | Phase 8 | Pending |
| PLAN-05 | Phase 8 | Pending |
| PLAN-06 | Phase 8 | Pending |
| COST-01 | Phase 9 | Pending |
| COST-02 | Phase 9 | Pending |
| COST-03 | Phase 9 | Pending |
| COST-04 | Phase 9 | Pending |
| DISC-01 | Phase 10 | Pending |
| DISC-02 | Phase 10 | Pending |
| DISC-03 | Phase 10 | Pending |

**Coverage:**
- M2 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-24*
*Last updated: 2026-05-24*
