---
story: 4
title: Persona intent selector and recommendation framework
status: Draft for Approval
type: new-capability
depends_on: [1, 2]
repo_status: not-built
---

# Story 4 — Persona Intent Selector and Recommendation Framework

## Story

As a visitor, I need to choose what kind of diver journey I am on so the site recommends next steps instead of only making me manipulate filters.

## Context

Filters are useful when users know what they want. Beginners and bucket-list planners often start with intent, not facets.

## Acceptance Criteria

- AC1: Add user intent options: learn to dive, return to diving, chase a species, plan a bucket-list experience.
- AC2: Store the selected intent locally and reflect it in recommendations.
- AC3: Recommendation logic returns an explanation, confidence, and source/methodology references for each recommendation group.
- AC4: Framework can power both homepage modules and `/sites` or future `/encounters` experiences.
- AC5: The UI must allow users to change intent without clearing all filters.
- AC6: No recommendation may hide its limitations.

## Dev Notes

- This extends, but does not replace, the future diver profile hook.
- Keep recommendation rules deterministic and inspectable for MVP.

## File Pointers

- Create: `src/lib/recommendations/personas.ts`
- Create: `src/lib/hooks/use-diver-intent.ts`
- Create: `src/components/persona-intent/*`

## QA Notes

- Verify each persona produces different recommendation copy.
- Verify recommendations cite sources/methodology when making factual claims.
