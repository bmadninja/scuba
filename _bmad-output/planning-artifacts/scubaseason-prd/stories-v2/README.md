---
title: Story Index v2 — scubaSeason.Fun Source-Aware Backlog
created: 2026-05-22
status: draft-for-approval
supersedes: ../stories/README.md
---

# Story Index v2 — Source-Aware Backlog

This backlog refreshes the original story shards after:

- Reviewing the current repo, which already has 179 sites, 111 locations, data loaders, site/location routes, affiliate components, sitemap, robots, and OG routes.
- Adding persona flows, bucket-list encounters, animal sighting evidence, and reef/climate storytelling.
- Making source provenance, methodology, confidence, and limitations mandatory product requirements.

Do not treat these as implementation-started stories. They are draft story cards for user approval before entering the SM -> Dev -> QA loop.

## Approval Order

| # | Story | Current repo status | Approval stance |
|---|---|---|---|
| 1 | [Source registry, methodology model, and claim audit](01-source-registry-methodology.md) | Not built | Approve first |
| 2 | [Normalize existing data to source-aware schema](02-source-aware-data-audit.md) | Partially built | Approve after 1 |
| 3 | [Encounter and bucket-list data model](03-encounter-data-model.md) | Not built | New product capability |
| 4 | [Persona intent selector and recommendation framework](04-persona-intent-framework.md) | Not built | New product capability |
| 5 | [Beginner and returning-diver recommendation flow](05-beginner-returning-flow.md) | Not built | Depends on 4 |
| 6 | [Advanced species-chaser flow](06-advanced-species-chaser-flow.md) | Partially represented by filters | Needs new evidence UI |
| 7 | [Bucket-list encounter pages](07-bucket-list-encounter-pages.md) | Not built | Depends on 3 |
| 8 | [Animal sighting evidence and rarity system](08-sighting-evidence-rarity.md) | Not built | Depends on 1, 3 |
| 9 | [Reef health and climate data model](09-reef-health-climate-data-model.md) | Not built | Depends on 1 |
| 10 | [Reef health and climate UI on site/location pages](10-reef-health-climate-ui.md) | Not built | Depends on 9 |
| 11 | [Complete search, filters, and URL state](11-search-filter-url-state.md) | Partially built | Delta story |
| 12 | [Affiliate finalization with editorial independence](12-affiliate-editorial-independence.md) | Partially built | Delta story |
| 13 | [SEO, accessibility, performance, and source discoverability](13-seo-a11y-performance-source-discoverability.md) | Mostly built | Verification/polish |

## Approval Gate For Every Story

Each story must answer:

- What user decision does this support?
- What existing implementation does this modify or preserve?
- What source data supports the claims?
- What methodology or calculation is used?
- What confidence and limitations are shown to users?
- How can a reviewer challenge or update the claim later?
- What must QA verify beyond "page renders"?

## Recommended First Approval

Approve Story 1 first: source registry, methodology model, and claim audit. It gives the rest of the work a trust backbone and prevents later stories from inventing one-off provenance fields.
