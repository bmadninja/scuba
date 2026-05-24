---
story: 13
title: SEO, accessibility, performance, and source discoverability
status: Draft for Approval
type: verification-polish
depends_on: [7, 10, 11, 12]
repo_status: mostly-built
---

# Story 13 — SEO, Accessibility, Performance, and Source Discoverability

## Story

As the operator, I need the expanded source-aware experience to remain crawlable, accessible, fast, and transparent to users and reviewers.

## Context

SEO plumbing mostly exists. The new work adds encounters, methodology sections, climate panels, and richer filters that need verification.

## Acceptance Criteria

- AC1: Sitemap includes site, location, and encounter URLs.
- AC2: Metadata and JSON-LD are accurate and avoid overclaiming.
- AC3: Source/methodology sections are crawlable where appropriate.
- AC4: Interactive filters and persona controls are keyboard-accessible.
- AC5: Site and encounter detail pages meet LCP target after new sections are added.
- AC6: No source/methodology UI hides critical limitations behind inaccessible controls.
- AC7: Build passes and route generation count is stable.

## QA Notes

- Run production build.
- Run keyboard pass on filters/persona controls.
- Spot-check sitemap and robots.
- Verify source links are not noindexed unless intentionally hidden.
