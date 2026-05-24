---
title: scubaSeason.Fun — Story Refresh Plan Before Approval
created: 2026-05-22
status: draft
purpose: Turn research addenda into an approvable SM -> Dev -> QA story queue
---

# Story Refresh Plan Before Approval

## 1. Why Refresh

The existing story shards are directionally useful but no longer approval-ready because:

- The repo is already ahead of several stories.
- New persona and bucket-list requirements add product scope.
- Source provenance, methodology, confidence, and limitations must be first-class.
- Climate/reef-health claims need careful data separation.

The next step is not implementation. It is a story rewrite pass.

## 2. Story Status

| Existing Story | Keep / Revise / Replace | Reason |
|---|---|---|
| 01 Schema migration & typed data loaders | Revise | Existing data model exists, but needs provenance, methodology, encounter, reef-health, and source types. |
| 02 Site detail page route + template | Revise | Page exists, but needs sources/methodology display and reef-health section. Decide whether to accept current page layout or realign to PRD UX. |
| 03 Curate 3 flagship sites | Replace | Dataset now has 179 sites; story should become flagship quality/provenance audit. |
| 04 Diver profile banner | Revise | Keep profile work, but expand from filters to persona intent paths. |
| 05 Filter UX | Revise | Existing filters are partial; add persona-aware recommendations and URL-state completion. |
| 06 /sites search + list view | Revise | Existing page works partially; complete URL state, pagination, source-aware ranking labels if used. |
| 07 Location pages + globe redesign | Revise | Existing route/globe exist; add climate/reef-health signals and provenance where location-level claims appear. |
| 08 Affiliate monetization | Revise | Keep editorial independence separate from data confidence and recommendation evidence. |
| 09 Scraper MVP | Replace or split | Current discovery pipeline differs from source-specific scrape/normalize/merge. Need source ingestion with provenance first. |
| 10 SEO polish | Revise | Mostly built; add structured source/methodology pages only where useful and avoid SEO overclaiming. |

## 3. New Stories To Add

### New Story A — Persona Intent Selector & Recommendation Paths

Goal:

Let users start from intent, not only filters.

Personas:

- Learn to dive / get certified
- Returning diver
- Advanced species chaser
- Bucket-list planner

Must include:

- Recommendation explanation
- Source/methodology display where recommendation claims appear
- Safety limitations for beginner/returning flows

### New Story B — Encounter / Bucket-List Data Model

Goal:

Add `Encounter` data for species, migrations, aggregations, cage dives, blackwater, coral spawning, etc.

Must include:

- Encounter schema
- Encounter-location mapping
- Source IDs and methodology IDs
- Difficulty and ethics notes
- Confidence/limitations

### New Story C — Bucket-List Experience Pages

Goal:

Create pages like `/encounters/sardine-run`, `/encounters/hammerhead-schools`, `/encounters/great-white-cage-diving`.

Must include:

- Best months
- Best locations/sites
- Difficulty and required experience
- Sighting confidence or occurrence evidence
- Conservation/ethics notes
- Sources & methodology section

### New Story D — Animal Sighting Evidence & Rarity System

Goal:

Show last confirmed sighting, chance band, elusiveness, and confidence without fake precision.

Must include:

- Probability only when effort denominator exists
- Occurrence-only fallback display
- Recent record count and source quality
- "Hardest to spot" ranking methodology

### New Story E — Reef Health & Climate Data Model

Goal:

Store current thermal stress, observed reef condition, and projections separately.

Must include:

- NOAA CRW fields for DHW / alert / hotspot / SST anomaly
- Observed survey fields for coral cover / bleaching / mortality
- Projection fields only with method/source
- Source and methodology IDs

### New Story F — Reef Health & Climate UI On Site Pages

Goal:

Show climate/reef-health context visually and responsibly.

Must include:

- Thermal stress card
- Observed condition card
- Timeline of recent bleaching/survey events
- Methodology and limitations drawer
- Responsible travel / conservation CTA

### New Story G — Source Registry & Methodology Admin Surface

Goal:

Make source/methodology records easy to review and fine-tune.

MVP can be file-based, not full admin UI.

Must include:

- `sources.json`
- `methodologies.json`
- Validation script for missing source links
- Reviewer notes field
- Report of claims missing provenance

## 4. Recommended New Build Order

1. Source registry + methodology data model
2. Audit/normalize existing site/location/gear data against source requirements
3. Encounter data model
4. Persona intent selector and recommendation framework
5. Beginner / returning diver flow
6. Advanced species-chaser flow
7. Bucket-list encounter pages
8. Animal sighting evidence and rarity system
9. Reef health/climate data model
10. Reef health/climate UI on site pages
11. Complete filter/search URL state and list UX
12. Affiliate finalization with editorial-independence guardrails
13. SEO/accessibility/performance verification

## 5. Approval Gate

Before a story is approved, it must answer:

- What user decision does this story support?
- What data source supports each recommendation or factual claim?
- Is there a calculation? If yes, what is it?
- Is there a confidence label? How is it derived?
- What limitation is shown to users?
- How can a reviewer update or challenge the source/math later?
- Does the story modify existing built work or create new work?

## 6. Immediate Recommendation

Approve no current story yet.

Next action should be:

1. Rewrite Story 1 into "Source registry, methodology model, and existing-data audit."
2. Add Encounter and Persona stories.
3. Rewrite remaining stories as completion/delta stories against the current repo.

Only then start the SM -> Dev -> QA loop.
