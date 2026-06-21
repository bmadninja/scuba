---
# Scuba Season — Redesign Build Spec
**Branch:** redesign/scuba-season-2026-06-20
**Date:** 2026-06-20
**Epics doc:** _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-19/epics.md

## What this build does
Full visual redesign of scubaseason.fun — light editorial aesthetic, Source Serif 4 + IBM Plex Sans typography, yellow (#F6C700) CTAs, photo-led pages. Six epics, 36 stories. No data changes — src/data/ is read-only throughout.

## Stack
Next.js 16.2.1, React 19, Tailwind v4, shadcn/ui, TypeScript strict, Vercel hosting.

## Build order
Epic 1 (design foundation) → Epic 2 (homepage) → Epic 3 (explore) → Epic 4 (location/site pages) → Epic 5 (upload wizard) → Epic 6 (method/about) → QA

## Global constraints
- src/data/ is strictly read-only
- All UI: mobile-first, 375px minimum
- No hyphens in copy, no contractions, digits not words
- Yellow = CTAs only; health colors = reef state only
- No icons in the UI
---
