---
story: 11
title: Complete search, filters, and URL state
status: Draft for Approval
type: delta
depends_on: [4]
repo_status: partially-built
---

# Story 11 — Complete Search, Filters, and URL State

## Story

As a diver browsing sites, I need filters and search to be shareable, back-button safe, and aligned with persona intent.

## Context

The current `/sites` page has simple in-component search and filters. This story completes the missing URL-state and richer facets.

## Acceptance Criteria

- AC1: Filters read/write URL params for month, cert, recency, region, trip style, dive types, species, encounter, and page.
- AC2: Existing search/list UI remains functional during migration.
- AC3: Species/encounter search can connect to encounter data.
- AC4: Active chips are removable.
- AC5: Empty state suggests clearing a specific filter.
- AC6: Pagination is URL-driven.
- AC7: Any ranking or recommendation label explains source/methodology if it implies confidence.

## QA Notes

- Verify copy/paste URL reproduces state.
- Verify browser back button works.
- Verify current simple filters are not regressed.
