---
story: 2
title: Site detail page route + template
status: Draft
epic: F1 — Dive Site Detail Page
prd_refs: [FR1.1, FR1.2, FR1.3, FR1.4, FR1.5, FR1.6, FR1.7]
arch_refs: ["§3 Routes", "§12 step 3"]
ux_refs: ["§4 Detail Page — Layout y"]
depends_on: [1]
---

# Story 2 — Site detail page route + template

## Story

As an advanced diver researching a site, I need a structured `/sites/[slug]` page that renders Overview, Species, Conditions, Season Calendar, Plan-Your-Trip, Gear (Tier A + B), Related Sites — so I can evaluate fit in one screen of focused research.

## Context

This is the first visible proof of the product repositioning: the site moves from a globe landing page into depth-first research pages. It should work with thin seed data from Story 1, then become compelling once Story 3 adds flagship content.

## Acceptance Criteria

- AC1: Route `/sites/[slug]` is generated for every Site in `sites.json` via `generateStaticParams` (FR1.6).
- AC2: Page renders sections in the exact order: Hero strip → Overview → Species & What You'll See → Conditions (12-month grid) → Season Calendar → Plan Your Trip (sticky right column) → Gear Tier A (level-tiered) → Gear Tier B (site-specific) → Related Sites (FR1.1).
- AC3: Desktop layout matches UX §4 Layout y: 2-column grid (1.5fr left / 1fr right), right column sticky on scroll, hero is a row strip (not full-bleed), gear inline in left column.
- AC4: Mobile collapses to single column; Plan-Your-Trip becomes a sticky bottom button opening a drawer (UX §4).
- AC5: Species section renders common name + scientific name + reliability tag + best months + depth range from `Site.species` (FR1.2).
- AC6: Conditions section renders a 12-column grid with water temp range, viz range, current strength, suit recommendation (FR1.3).
- AC7: Gear Tier A is filtered by the user's `diverProfile.cert` from `localStorage` (defaults to "show all" if unset). Tier B renders `Site.siteSpecificGear` unconditionally (FR1.4).
- AC8: Plan-Your-Trip has three sub-blocks (Getting there / Where to stay / Who to dive with) reading from `Site.getThere`, `Site.lodging`, `Site.operators` (FR1.5). Story 8 wires the affiliate component; this story can stub with plain `<a>` tags.
- AC9: Dynamic `<title>` and OG metadata per site (FR1.7) — story 10 handles full schema.org polish; this story must at minimum set `metadata.title` and `metadata.description` from `Site` fields.
- AC10: Page is a Server Component reading typed data via `getSiteBySlug` from Story 1. Only the user-profile-aware Gear Tier A and the sticky-on-scroll behavior need client components.

## Dev Notes

- `src/app/sites/[slug]/page.tsx` likely already exists — audit and refactor rather than recreate.
- `src/components/site-card.tsx` exists for list view; do not couple detail page to it.
- Use `@base-ui/react` for sticky / drawer primitives per architecture §1 stack lock.
- Server components by default (architecture §4). Mark only `'use client'` where needed (gear filter, sticky scroll if measured-based).
- Related Sites query: same `locationId` OR overlapping `species[].commonName`. Cap at 4.

## Tasks

- [ ] Audit existing `src/app/sites/[slug]/page.tsx`; list what already works
- [ ] Implement two-column layout shell with sticky right column
- [ ] Build Overview, Species, Conditions, Season Calendar section components in `src/components/site-detail/`
- [ ] Build Plan-Your-Trip block (stub affiliate styling — Story 8 finishes)
- [ ] Build Gear Tier A (client component reading `useDiverProfile()` — depends on Story 4 hook; until then, hard-code to show "all levels")
- [ ] Build Gear Tier B and Related Sites
- [ ] Wire `generateStaticParams` + `generateMetadata`
- [ ] Mobile QA: single column + sticky bottom Plan Trip drawer

## File Pointers

- Modify/create: `src/app/sites/[slug]/page.tsx`
- Create: `src/components/site-detail/{overview,species,conditions,season-calendar,plan-trip,gear-tier-a,gear-tier-b,related-sites,hero-strip}.tsx`
- Reference: `src/lib/data/sites.ts`, `src/lib/data/gear.ts` (Story 1)

## References

- PRD §5 F1, §4 IA
- Architecture §3 Routes, §4 State, §12 step 3
- UX §4 Detail Page Layout y
