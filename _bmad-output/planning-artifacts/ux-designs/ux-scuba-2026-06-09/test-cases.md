# Test Cases — UX clarity overhaul (ux-scuba-2026-06-09)

Maps to `stories.md`. Conventions match existing `tests/*.spec.ts`:
- `import { test, expect } from '@playwright/test';`
- `const GOTO = { waitUntil: 'domcontentloaded' } as const;`
- `baseURL` http://localhost:3000, chromium only, `reuseExistingServer`.
- For client-hydrated controls (filters, modals), `await page.waitForLoadState('networkidle')` before interacting, and use role/text/`aria-label` selectors as in `recent-changes.spec.ts`.
- Modal/(i) selector pattern from `recent-changes.spec.ts`: `page.getByRole('button', { name: 'More information' })` (production InfoTooltip) — mockups use an `i` button with `aria-label`; assert against whichever the implementation ships, keeping the role/name pattern.

Each case is tagged **[NEW]** (net-new file/spec) or **[EXT]** (extends an existing spec file, named).
Routes assumed for production: home `/` (embeds atlas), location `/locations/[slug]`, dive site `/sites/[slug]`, species list `/sites/[slug]/species` (or location species list), method `/method`, search `/search`. Where a route is uncertain, the case targets the embedded component on `/`.

---

## 1. Playwright E2E

### Home atlas — `tests/atlas.spec.ts` [NEW] (extends `homepage.spec.ts` for hero/nav)

**E2E-A1 — Hero (A1).**
- goto `/`. Assert `getByRole('region', { name: 'Hero' })` visible (matches `homepage.spec.ts`).
- Assert live-data eyebrow text `/live data/i` visible.
- Assert hero contains an `img` (underwater photo) OR a background-image element; assert no reef-state stat numbers inside the hero region.

**E2E-A2 — Filter rail sections render & collapse (A2).** [partly EXT of `recent-changes.spec.ts` "Atlas filter rail"]
- goto `/`, networkidle. For each label in `['When','Region','Reef state','Evidence gaps','Certification level']` plus `/what do you want to see/i`, assert a section header is visible.
- Click the "When" section summary; assert its body (month grid) toggles hidden, click again, visible.

**E2E-A2b — Reset clears filters (A2).**
- Select a month and a species leaf; click Reset; assert count returns to the all-reefs total and selected controls are cleared.

**E2E-A3 — Month grid (A3).**
- Assert 12 month cells `['Jan'..'Dec']` present (pattern from `recent-changes.spec.ts` 12-month grid test).
- Assert exactly one cell carries the "now"/current-month marker (class or aria-current).
- Click "Mar"; assert it becomes selected (toggled class/state).

**E2E-A4 — Wildlife taxonomy multi-select + count (A4).** [EXT of `epic7.spec.ts` 7.3]
- Assert categories `/sharks.*rays|turtles|marine mammals|fish|reef/i` visible.
- Expand a category, click a leaf; assert the category count badge shows `1`; click a second leaf; badge shows `2`.
- Toggle the "endangered only" control; assert the result count changes (or stays consistent with endangered set).

**E2E-A5 — Region filter narrows results (A5).**
- Record baseline count. Check "Americas"; assert count decreases and every visible card belongs to an Americas region (e.g. assert a known non-Americas reef name is absent).

**E2E-A6 — Reef state filter (A6).**
- Assert three state checkboxes Thriving / Under pressure / Witnessing change present, all on.
- Uncheck "Thriving"; assert count drops and no card shows a Thriving pill.

**E2E-A7 — Needs fresh eyes (A7).**
- Check "Needs fresh eyes"; assert count drops to only fresh-eyes reefs; uncheck restores.

**E2E-A8 — Certification level (A8).**
- Check "Beginner"; assert count changes; uncheck restores baseline.

**E2E-A9 — Live result count (A9).**
- Assert a `N reefs` count element. Apply any single filter; assert the count text updates without any submit/apply button click.

**E2E-A10 — In-season-first sort + divider (A10).**
- Assert sort note `/in season first/i`.
- Select a month that puts some reefs off-season; assert a divider labelled `/other times of year/i` renders, and that at least one card appears before it (in season) and one after.
- Select a month where all match → assert no divider.

**E2E-A11 — Every filter (i) opens popup + Method link (A11, CC-4).**
- For each of When / What to see / Reef state / Evidence gaps / Certification level: click its (i) (`getByRole('button', { name: /more information|how this works|what this means/i }`)), assert popup text visible, assert a link naming the Method page (`getByRole('link', { name: /method page/i })`) present, then Escape closes the popup.

**E2E-A12 — Place-only cards link out (A12).** [EXT of `homepage.spec.ts` featured-destination test]
- Assert a card shows a place name + region eyebrow over a photo and is a link.
- Click the Florida Keys (or first real) card; assert URL navigates to its `/locations/...` page.
- Assert no numeric reef-state/coral stat is overlaid on the card photo.

**E2E-A13 — Cards / Map toggle (A13, A14).**
- Assert Cards button is active by default and grid visible, globe hidden.
- Click "Map"; assert grid hidden and globe view visible; Map button active.
- Click "Cards"; assert reverse.

**E2E-A14 — Globe reflects matches + mobile fallback (A14, CC-6).**
- In Map view, apply a filter; assert the live match set drives the globe (assert `window.__lastMatches`/equivalent equals visible-card count, or that a non-match reef name is not in the match set).
- Set viewport 375×800; assert cards remain usable and no horizontal overflow; globe interaction is not required to reach a result.

**E2E-A15 — Nav search (A15).** [EXT of `search.spec.ts`]
- From `/`, use the nav search; submit "palau"; assert navigation to `/search` (or results overlay) and a `/palau/i` result link visible. (Reuse `search.spec.ts` assertions for the results page itself.)

### Location page — `tests/location-slim.spec.ts` [NEW] (some [EXT] of `epic7.spec.ts`, `recent-changes.spec.ts`)

**E2E-B1 — Slim layout, one heading each (B1).**
- goto a location page, networkidle. Assert headings/labels Reef condition, What you'll see, Dive sites, Gear each appear exactly once (`toHaveCount(1)` on the label text).
- Assert no separate "stat strip" duplicating reef state + coral + season (assert the page does not render the same reef-state value twice). Extends `recent-changes.spec.ts` "sightings feed removed" dedupe intent.

**E2E-B2 — Match-context bar (B2).**
- Arrive with filter context (query param or from atlas). Assert a check row with `/in season|seen recently|your level/i` and an `/edit search/i` link. Assert the literal label "Matches your search" is absent (`toHaveCount(0)`).

**E2E-B3 — Plain reef condition + decline chart, no timestamp (B3, CC-7).**
- Assert lead sentence text present (plain words, e.g. `/warmer than usual|lost .* coral/i`).
- Assert a coral-cover chart element (svg with `role="img"` and an aria-label mentioning coral cover) renders once.
- Assert no update-timestamp text (`/updated|as of|ago/i`) attached to the heat/coral display. (Sightings "seen N days ago" is allowed on species cards; scope this assertion to the condition block.)

**E2E-B4 — Reef-state hero pill once (B4).**
- Assert exactly one hero state pill; assert subtitle is `Country · Region` form and does not repeat the H1 place name.

**E2E-B5/B8 — Heat, fishing, state, IUCN (i) popups → Method (B4,B5,B6,CC-4).** [EXT of `recent-changes.spec.ts` InfoTooltip tests]
- For each (i): heat, fishing, reef state, IUCN — click, assert explainer text visible, assert a Method-named link, Escape/backdrop closes. Heat popup asserts NOAA Coral Reef Watch credit; fishing popup asserts protection types.

**E2E-B6 — Species ordered by recency, IUCN spelled out (B6).**
- Assert species cards show spelled-out labels `/least concern|vulnerable|endangered/i` (not bare `EN`/`VU` in body).
- Assert DOM order of species follows recency (first card's "seen N days ago" ≤ later cards) — evaluate the order in-page.

**E2E-B7 — Simplified site rows (B7).**
- Assert each dive-site row shows name + species + depth and links to a `/sites/...` page; click one → navigates.

**E2E-B9 — Gear two layers inline (B8).** [EXT of `epic7.spec.ts` 7.9]
- Assert a basic-kit group and a site-specific group label; assert gear items are links; assert no "rental" line and no repeated "Shop" button.

**E2E-B10 — One CTA → operators popup (B9).**
- Assert a single primary CTA `/see dive operators/i` in the trip card. Click it; assert an operators popup with at least one operator linking to its own site; assert copy `/don.t book|no commission/i`.

**E2E-B11 — Trip card season + getting there (B9).**
- Assert trip card shows best months with a mini season grid marking the current month; assert "Getting there" and "Where to stay" are expandable and reveal content on toggle.

### Dive site page — `tests/dive-site.spec.ts` [NEW] (some [EXT] of `epic7.spec.ts` 7.10)

**E2E-C1 — Same system + breadcrumb (C1).**
- goto a dive site. Assert breadcrumb links Atlas → location → site; click the location crumb → navigates to `/locations/...`.

**E2E-C2 — Conditions grid plain labels + (i) (C2).** [EXT of `epic7.spec.ts` conditions grid]
- Assert Depth, Current, Visibility, Water labels present; assert the word "vis" is NOT used as a label (`getByText(/\bvis\b/).toHaveCount(0)` within the conditions block).
- Click conditions (i); assert explainer popup; Method link; Escape closes.

**E2E-C3 — Encounter odds per species + (i) (C3).**
- Assert each species row has a chance label `/almost always|very likely|likely|sometimes|rare/i`, a likelihood bar element, a frequency line, and a "where" line.
- Click the chances (i); assert text `/research grade|guide, not a promise/i` and a Method link.

**E2E-C4 — Contribute platforms + Method how-to (C4).**
- Assert iNaturalist, CoralWatch, Reef Check each present with a one-liner; click one → popup; assert a `/method page/i` "how submitting works" link.

**E2E-C5 — See all species link (C3).**
- Assert "See all species recorded here →" link; click → navigates to the species list page.

**E2E-C6 — Site detail order preserved (C1).** [EXT of `epic7.spec.ts` 7.10]
- Re-assert Overview/intro appears before species section in DOM (reuse existing evaluate pattern) and sidebar "plan your trip"/operators CTA present.

### Species list page — `tests/species-list.spec.ts` [NEW]

**E2E-D1 — List most-likely-first + breadcrumb (D1).**
- goto species list. Assert breadcrumb Atlas / location / site / All species.
- Assert rows are ordered by descending likelihood (evaluate bar widths or chance rank in-page: first ≥ last).

**E2E-D2 — Type filter pills + count (D2).**
- Assert pills All / Fish / Sharks & rays / Turtles / Invertebrates each with a numeric count.
- Click "Sharks & rays"; assert the visible count matches the pill count and only shark/ray rows show.

**E2E-D3 — Empty state (D2, CC-5).**
- If a type has zero members (or via a forced filter), assert `/no species of this type recorded here/i` empty state shows and the list is hidden.

**E2E-D4 — Chances + IUCN (i) (D3).**
- Click heading IUCN (i) → IUCN explainer + Method link. Click "How chances work" → chances popup + Method link. Escape closes each.

### Method page — `tests/method.spec.ts` [NEW]

**E2E-E1 — Method page sections (E1).**
- goto `/method`. Assert jump-nav anchors/sections present: states, signals (NOAA, Reef Check, Global Fishing Watch, iNaturalist), chances, verify, labels, contribute, gaps, research.
- Assert contact `hello@scubaseason.fun` present.

**E2E-E2 — Method anchors resolve from popups (E1, CC-2).**
- From a location page, open the reef-state (i), click its Method link; assert URL lands on `/method` at the expected anchor (e.g. `#states`) and that section is visible.

### Cross-cutting — `tests/cross-cutting.spec.ts` [NEW]

**E2E-CC1 — Responsive viewports (CC-1).**
- For each of `/`, a location, a dive site: set viewport 375×800, 768×1024, 1280×900; assert `main` visible and assert no horizontal overflow (`document.documentElement.scrollWidth <= clientWidth + 1`).

**E2E-CC2 — All links resolve (CC-2).**
- On `/`, a location, a dive site, method: collect nav/breadcrumb/footer links; assert no production link has `href="#"` or empty; spot-check key links (Method, Atlas, About, mailto hello@scubaseason.fun) return non-404.

**E2E-CC3 — Keyboard & focus on filters/modals (CC-3).**
- On `/`: Tab to a filter (i) button; press Enter/Space; assert popup opens; press Escape; assert closed and focus returns to a sensible element.
- Assert (i) buttons expose an accessible name (role button with name `/more information|how this works/i`).

**E2E-CC4 — Reduced-motion globe (CC-3, CC-6).**
- Launch context with `reducedMotion: 'reduce'`; goto `/`, switch to Map; assert the globe is present but rotation is paused/reduced (assert a flag the implementation sets, e.g. globe `data-reduced-motion="true"` or that the rAF rotation delta is 0). Marked as a guard test — exact assertion depends on implementation hook.

**E2E-CC5 — Atlas empty state (CC-5).**
- On `/`, apply a filter combination with no matches; assert `/no reefs match/i` and `/remove a filter/i` message; assert grid otherwise empty.

**E2E-CC7 — House rules copy (CC-7).**
- On the redesigned surfaces, assert no hyphen `-` appears inside visible user-facing text nodes of key copy regions (scope to hero, section labels, lead text, popups — exclude URLs/slugs/code). Implement as an in-page text scan over those regions.
- Assert reef-state copy never contains `/perfect|pristine/i`.

---

## 2. Unit tests — `src/lib/data/__tests__/*` [NEW]

Target the real helpers in `src/lib/data/reef-state.ts` and the atlas filter/sort logic (mirroring the mockup's `matched()`/`update()`; extract to a tested module when implemented).

**UNIT-reefstate — `getReefState` classification (A6, CC-7).** [NEW]
- coralCover < 25 OR alertRank ≥ 3 → `"change"`.
- coralCover ≥ 40, alert ≤ watch(1), fishing low/unknown → `"thriving"`.
- moderate cover / warm seasons / fishing not low → `"pressure"`.
- Assert `STATE_TEXT` maps thriving→"Thriving", pressure→"Under pressure", change→"Witnessing change".
- Assert `STATE_COLOR.pressure === '#0089de'` (blue, per DESIGN.md; not amber).
- Assert `STATE_DEF` copy contains "near its natural baseline" and never "perfect"/"pristine".

**UNIT-sort — in-season-first sort (A3, A10).** [NEW]
- Given reefs with `bestMonths` (peakMonths) and a selected month set, the sort returns in-season reefs first, off-season after, each group stably ordered (alpha in mockup).
- With no month selected, the fallback uses the current month.
- Assert the divider is only emitted when the off-season group is non-empty.

**UNIT-filter — atlas filter logic (A4, A5, A6, A7, A8, A9, CC-5).** [NEW]
- Species: empty selection passes all; non-empty keeps reefs having ≥1 selected leaf.
- Region: empty passes all; selection keeps reefs whose continent ∈ selection.
- Reef state: keeps reefs whose state ∈ selected states.
- Needs-fresh-eyes: when on, keeps only `eyes` reefs.
- Cert: empty passes all; selection keeps matching levels.
- Combined filters AND together; impossible combo → empty array (drives empty state).
- Result count equals filtered length.

**UNIT-continent — region→continent mapping (A5).** [NEW]
- Assert mapping: Caribbean→Americas, Atlantic→Atlantic & Mediterranean, Red Sea→Indian Ocean, Indian Ocean→Indian Ocean, Coral Triangle→Asia, Pacific→Oceania, Great Barrier→Oceania.
- Unknown region falls back to itself (no crash).

**UNIT-bestmonths — `bestMonthsText` (B11, supporting).** [NEW, optional]
- 12 months → "Year round"; contiguous range → "Apr–Oct"; empty → "—". (Note: helper currently emits an en/em-style dash inside a non-user data string; confirm house-rule scope excludes this internal label or reword.)

---

## Coverage notes
- **Net-new files:** `tests/atlas.spec.ts`, `tests/location-slim.spec.ts`, `tests/dive-site.spec.ts`, `tests/species-list.spec.ts`, `tests/method.spec.ts`, `tests/cross-cutting.spec.ts`, and `src/lib/data/__tests__/{reef-state,atlas-filter,atlas-sort}.test.ts`.
- **Extensions:** `homepage.spec.ts` (hero/nav/cards), `recent-changes.spec.ts` (filter rail, InfoTooltip, dedupe), `epic7.spec.ts` (taxonomy 7.3, gear 7.9, conditions grid, site order 7.10), `search.spec.ts` (nav search), `epic7-followup.spec.ts` (clickable species, species detail).
- **Selector reuse:** keep `getByRole('button', { name: 'More information' })`, `waitForLoadState('networkidle')` before client clicks, `{ waitUntil: 'domcontentloaded' }` for nav-only assertions, and `force: true` clicks under sticky headers — all per existing specs.
