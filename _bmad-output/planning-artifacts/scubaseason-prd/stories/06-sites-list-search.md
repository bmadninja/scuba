---
story: 6
title: /sites search + list view
status: Draft
epic: F4 — Search & List
prd_refs: [FR4.1, FR4.2, FR4.3, FR4.4]
arch_refs: ["§3 Routes", "§5 Search"]
depends_on: [1, 5]
---

# Story 6 — /sites search + list view

## Story

As a diver who doesn't want to spin a 3D globe, I need a `/sites` page with a card grid, free-text search across name/location/country/species, and the same filter bar — so I can find sites linearly.

## Context

The list view is the accessible, SEO-friendly counterpart to the globe. It closes a competitive table-stakes gap from the market research and gives users a fast path into detail pages.

## Acceptance Criteria

- AC1: `/sites` renders a card grid, default-sorted by `editorialRank` desc (FR4.1).
- AC2: Top search input does free-text fuzzy search across site name (3×), species common+scientific (2×), location (1×) — `fuse.js` over the build-time index (FR4.2, arch §5).
- AC3: Card shows: site name, location, hero placeholder (or image if set), top 3 species icons/labels, best-months strip, "Detail →" link (FR4.3).
- AC4: Pagination: 24 per page with numbered page links (FR4.4, PRD A4 — pagination over infinite scroll for SEO).
- AC5: Filter bar from Story 5 is mounted on `/sites` with state-driven results.
- AC6: Empty state matches Story 5 AC6.

## Dev Notes

- `src/components/site-card.tsx` exists — reuse, don't duplicate.
- Page is a Server Component for the shell + initial render; search/filter interactions client-side.
- Pagination uses URL param `page=N`. SSR renders the right slice.

## Tasks

- [ ] Build `src/app/sites/page.tsx` shell with filter bar mounted
- [ ] Add search input + Fuse setup against `_index.json`
- [ ] Card grid + pagination
- [ ] Connect to URL-driven filter state from Story 5

## File Pointers

- Create/modify: `src/app/sites/page.tsx`
- Reference: `src/components/site-card.tsx`, `src/lib/filters.ts` (Story 5)

## References

- PRD §5 F4, §11 A3
- Architecture §3, §5
