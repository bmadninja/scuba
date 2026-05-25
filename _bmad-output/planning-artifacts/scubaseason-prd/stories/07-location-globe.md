---
story: 7
title: Location detail pages + globe redesign (Direction A)
status: Draft
epic: F3 + Landing UX
prd_refs: [FR3.3, FR3.4]
arch_refs: ["§3 Routes", "§11 Risks"]
ux_refs: ["§1 Globe — Direction A"]
depends_on: [1, 3]
---

# Story 7 — Location detail pages + globe redesign

## Story

As a diver browsing the globe, I need ocean-bright styling per UX direction A, and clicking a country pin to take me to a `/locations/[slug]` page listing its child sites — so location → site navigation is real, not a dead-end.

## Context

The globe remains the memorable brand asset, but its markers now represent Locations rather than individual sites. This story makes the visual direction match the locked UX notes and turns globe exploration into real navigation.

## Acceptance Criteria

- AC1: `/locations/[slug]` renders for every Location (generateStaticParams): hero, description, list of child sites (cards from Story 6), bestMonths overall.
- AC2: Globe Direction A applied: ocean-bright daytime Earth texture, teal-tinted oceans, coral country highlight (`rgba(255,167,138,0.45)`), pins as drop-pin + mask glyph, atmosphere `#a8e6ff` α 0.18, background gradient `#0a3d5c → #0f2a4a`, auto-rotate `0.2` (UX §1).
- AC3: In-season pins filled coral; out-of-season pins outlined coral on white at 60% opacity (still visible).
- AC4: Clicking a pin routes to `/locations/[slug]`; selected pin scales 1.4× with white outline + outer glow.
- AC5: Globe degrades to map or list on small screens (NFR4).
- AC6: Globe markers are Locations (clustering), not individual Sites (FR3.3).

## Dev Notes

- `src/components/planet-globe.tsx` and `src/components/planet-globe-panel.tsx` exist — audit and refactor toward direction A.
- `src/app/locations/[slug]/page.tsx` likely exists; verify before recreating.
- Mask glyph: custom SVG inline (UX §1).
- Marker clustering: at globe-wide zoom, group markers within 5° (architecture §11 risk).

## Tasks

- [ ] Audit existing globe components
- [ ] Replace earth texture + tint oceans teal
- [ ] Implement drop-pin SVG with mask glyph; in-season vs out-of-season variants
- [ ] Apply atmosphere/background/auto-rotate per UX §1
- [ ] Implement clustering at low zoom
- [ ] Build/refine `/locations/[slug]` page rendering child sites
- [ ] Mobile fallback (list view) — wire to NFR3 (a11y) and NFR4

## File Pointers

- Modify: `src/components/planet-globe.tsx`, `src/components/planet-globe-panel.tsx`, `src/app/locations/[slug]/page.tsx`, `src/app/page.tsx`
- Reference: `src/lib/scuba-globe.ts`

## References

- PRD §5 F3
- Architecture §11
- UX §1
