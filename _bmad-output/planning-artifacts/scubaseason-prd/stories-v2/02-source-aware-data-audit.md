---
story: 2
title: Normalize existing data to source-aware schema
status: Draft for Approval
type: data-audit
depends_on: [1]
repo_status: partially-built
---

# Story 2 — Normalize Existing Data To Source-Aware Schema

## Story

As the editor, I need the existing 179-site and 111-location dataset audited against the source-aware schema so we can preserve useful work while identifying which claims are verified, inferred, or editorial.

## Context

The repo is ahead of the original schema-migration story. This is not a rebuild. It is an audit and normalization pass that protects existing data while adding provenance.

## Acceptance Criteria

- AC1: Current `locations.json`, `sites.json`, `gear.json`, and `location-details.json` continue to build.
- AC2: Each site and location can reference source IDs and methodology IDs where claims are made.
- AC3: The audit produces a report with counts for sourced, unsourced, stale, and editorial-only claims.
- AC4: The audit flags fields that look like probability, rarity, seasonality, reef condition, or climate urgency but lack methodology.
- AC5: Existing 179 sites are not deleted or mass rewritten without explicit review.
- AC6: Existing affiliate data remains separate from editorial confidence data.
- AC7: Build passes after the schema additions.

## Dev Notes

- Current `Site.getThere` is a string, while the earlier architecture expected link arrays. Treat that as a schema-drift finding, not an automatic rewrite.
- Existing discovery scripts may have added data without durable source records; preserve but flag.

## File Pointers

- Modify: `src/data/sites.json`, `src/data/locations.json`, `src/data/location-details.json` only as needed
- Create: `_bmad-output/implementation-artifacts/data-audit/source-coverage-report.md`
- Reference: `scripts/discover-sites.mjs`, `scripts/lib/site-schema.mjs`

## QA Notes

- Verify counts before/after.
- Verify no existing route count drops.
- Verify audit report is understandable to non-engineering reviewers.
