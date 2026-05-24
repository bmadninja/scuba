---
story: 1
title: Source registry, methodology model, and claim audit
status: Draft for Approval
type: foundational
depends_on: []
repo_status: not-built
refs:
  - ../data-provenance-and-methodology.md
  - ../personas-encounters-climate-research-addendum.md
---

# Story 1 — Source Registry, Methodology Model, and Claim Audit

## Story

As the product owner, I need a source registry, methodology registry, and claim audit report so every recommendation, sighting, climate statement, and bucket-list claim can show where it came from and how confidence was derived.

## Context

The current repo has substantial data, but source provenance is not yet a first-class schema. This story creates the trust layer that all later stories must use.

## Acceptance Criteria

- AC1: Add source and methodology types to the data layer, including `DataSource`, `MethodologyNote`, `ClaimType`, and confidence levels.
- AC2: Add file-based registries for MVP: `src/data/sources.json` and `src/data/methodologies.json`.
- AC3: Add typed loaders for sources and methodologies.
- AC4: Add validation that reports claims without sources or methodology notes.
- AC5: The validation report distinguishes missing source, missing method, missing limitation, stale `accessedAt`, and unsupported numeric probability.
- AC6: Seed initial source records for NOAA Coral Reef Watch, Allen Coral Atlas, GCRMN, AIMS, Reef Life Survey, GBIF, OBIS, DAN, and PADI.
- AC7: Document the math rules in code-adjacent docs so future reviewers can fine-tune them.
- AC8: No UI claims are changed in this story except where needed to avoid broken data references.

## Dev Notes

- Existing `src/lib/data/types.ts` is the likely home for shared source/methodology types.
- Keep the registry file-based for MVP. No database or admin UI yet.
- The validation script should be runnable locally and later in CI.

## File Pointers

- Modify: `src/lib/data/types.ts`
- Create: `src/data/sources.json`, `src/data/methodologies.json`
- Create: `src/lib/data/sources.ts`, `src/lib/data/methodologies.ts`
- Create: `scripts/validate-provenance.mjs`

## QA Notes

- Run build.
- Run provenance validation.
- Confirm at least seeded source records load through typed accessors.
- Confirm numeric probability claims cannot pass without a denominator/methodology note.
