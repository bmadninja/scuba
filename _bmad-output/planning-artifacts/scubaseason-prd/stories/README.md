---
title: Story Index — scubaSeason.Fun MVP
created: 2026-05-22
sharded_from: ../prd.md
architecture_ref: ../architecture.md
ux_ref: ../ux-notes.md
---

# Sharded Stories — Build Order

Stories sharded manually from PRD §3/§5 + architecture §12. The BMAD help manifest advertises BMM module 4 commands, but this Codex session does not expose them as callable slash commands, and the local `~/_bmad/bmm/4-implementation/` skill/task directory is empty. Each story file follows the requested BMAD story shape: Title, Context, Acceptance Criteria, Dev Notes, Tasks, File Pointers, References.

| # | Story | Maps to PRD | Status |
|---|---|---|---|
| 1 | [Schema migration & typed data loaders](01-schema-migration.md) | FR3.1, FR3.2, FR3.5 | Draft |
| 2 | [Site detail page route + template](02-site-detail-page.md) | F1 (FR1.1–FR1.7) | Draft |
| 3 | [Curate 3 flagship sites end-to-end](03-flagship-content.md) | F1 content, FR3.4 | Draft |
| 4 | [Diver profile (cert + recency) + inline banner](04-diver-profile.md) | FR2.1a | Draft |
| 5 | [Filter UX — top bar, URL state, live updates](05-filter-ux.md) | F2 (FR2.1–FR2.5) | Draft |
| 6 | [/sites search + list view](06-sites-list-search.md) | F4 (FR4.1–FR4.4) | Draft |
| 7 | [Location detail pages + globe redesign](07-location-globe.md) | FR3.3, FR3.4, UX §1 | Draft |
| 8 | [Affiliate links, disclosure, click events](08-affiliate-monetization.md) | F5 (FR5.1–FR5.5) | Draft |
| 9 | [Scraper MVP for one source](09-scraper-mvp.md) | FR3.4 pipeline (arch §6) | Draft |
| 10 | [SEO polish: sitemap, metadata, OG, schema.org](10-seo-polish.md) | NFR2, FR1.6, FR1.7 | Draft |

## Recommended start: Story 1

Schema migration is the hard dependency for everything else — current `src/data/sites.json` and `locations.json` exist but need to be verified against the architecture §2 type shape before any UI work assumes the schema. Story 1 also produces the typed loaders (`src/lib/data/*`) that every later story imports.

## Approval Note — Data Provenance Required

Before approving these stories for the SM -> Dev -> QA loop, refresh them against [Data Provenance & Methodology Requirements](../data-provenance-and-methodology.md). Source attribution, confidence, limitations, and calculation methods are first-class product requirements, especially for animal sightings, bucket-list encounters, reef health, climate urgency, and any recommendation surfaced to users.

Also review [Personas, Bucket-List Encounters & Climate Research Addendum](../personas-encounters-climate-research-addendum.md) and [Story Refresh Plan Before Approval](../story-refresh-plan.md). The current shards should be treated as pre-refresh drafts, not yet approved implementation stories.

The refreshed approval queue is now drafted at [Story Index v2](../stories-v2/README.md).

## Notes on the existing repo

The codebase already has partial scaffolding: `src/data/{locations,sites,gear}.json`, `src/app/sites/[slug]`, `src/app/locations/[slug]`, `src/components/{site-card,sites-explorer,planet-globe}.tsx`, `scripts/migrate.ts`, `src/lib/affiliate.ts`. Each story's "Dev Notes" calls out what's already present so the Dev agent audits before writing new code rather than duplicating.
