---
story: 5
title: Filter UX — top bar, URL state, live updates
status: Draft
epic: F2 — Filter UX
prd_refs: [FR2.1, FR2.2, FR2.3, FR2.4, FR2.5]
arch_refs: ["§4 State Management", "§5 Filter & Search"]
ux_refs: ["§2 Filter UX — Layout ii"]
depends_on: [1, 4]
---

# Story 5 — Filter UX — top bar, URL state, live updates

## Story

As a diver browsing, I want a top-bar collapsible filter that updates the globe and list live, syncs to the URL so I can share or back-button, and shows my active filters as removable chips.

## Context

The filters are the main interaction model across both the landing page and `/sites`. They must honor the diver profile from Story 4, preserve shareable URL state, and support the product's skill-aware recommendations without adding a global store.

## Acceptance Criteria

- AC1: Collapsed default state: top bar with `[Filter ▾]` button + chip row of active filters (UX §2).
- AC2: Expanded state: drawer slides down, showing facets in this order — When (month), Cert (segmented), Last dive (segmented), Region (select), Trip style (select), Dive types (multi-checkbox), Species (typeahead, only when cert >= advanced per FR2.1).
- AC3: All filter state lives in URL params (FR2.2): `month`, `cert`, `recency`, `region`, `tripStyle`, `diveTypes`, `species`. Shareable URL reproduces state on load.
- AC4: Changes apply live on toggle on desktop; mobile shows an Apply button (UX §2 safety net).
- AC5: Active filter chips render persistently above results; clicking ✕ removes that filter and updates URL.
- AC6: Empty state on no-match: "No sites match — clear [last filter]" (FR2.3).
- AC7: Globe markers + list update without full page reload (FR2.4). Use `router.replace` for URL writes and `useSearchParams` for reads.
- AC8: Multi-select within a facet = OR; across facets = AND (FR2.5). Tooltip documents this.
- AC9: Diver profile from Story 4 pre-fills cert + recency on first render but is overridable.
- AC10: Cert filter logic from arch §5: shows sites where `Site.skillLevel <= user cert` (Tech can dive OW sites).

## Dev Notes

- Filter state is the URL. No Redux, no Zustand, no Context for filter state.
- Build-time index per arch §5: emit `src/data/_index.json` with compact site subset (id, slug, name, lat, lng, bestMonths, skillLevel, diveTypes, speciesNames, regionId). Client filters this index, not the full sites.json.
- `src/components/sites-explorer.tsx` exists — audit and refactor; do not duplicate.
- Species typeahead: client-side fuzzy match (`fuse.js`) over the species index.

## Tasks

- [ ] Add build step to emit `src/data/_index.json`
- [ ] Create `src/lib/filters.ts`: URL ↔ filter state, applyFilters(index, state) returning matching site IDs
- [ ] Create `src/components/filters/top-bar.tsx` (collapsed + expanded)
- [ ] Create `src/components/filters/chip-row.tsx`, `src/components/filters/facets/{month,cert,recency,region,trip-style,dive-types,species}.tsx`
- [ ] Wire globe + list to consume filtered IDs
- [ ] Mobile: sticky bottom Filter button + full-screen sheet

## File Pointers

- Create: `src/lib/filters.ts`, `src/components/filters/*`, build step for `src/data/_index.json`
- Modify: `src/components/sites-explorer.tsx`, `src/app/page.tsx`

## References

- PRD §5 F2
- Architecture §4, §5
- UX §2 Layout ii
