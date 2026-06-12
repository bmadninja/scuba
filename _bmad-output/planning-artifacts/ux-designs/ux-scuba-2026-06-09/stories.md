# User Stories — UX clarity overhaul (ux-scuba-2026-06-09)

Source: `.decision-log.md` + mockups in `.working/` (`atlas.html`, `location-florida-keys-slim-v2.html`, `dive-site-looe-key.html`, `species-looe-key.html`, `method.html`).
Personas: **Diver** (plans real trips), **Researcher / contributor** (cares about reef state, gaps, logging), **First-timer** (zero science background — the brief's primary user).

House rules apply to every story (see Cross-cutting CC-7): no hyphens in user-facing copy (em dashes fine), plain language only, live data with no update timestamps, deduplicate, one clear CTA, in-place explanations are (i) popups not page jumps, links that leave to Method name the Method page in their text.

Acceptance-criteria style: Given / When / Then where useful, otherwise checklist. Each story tags the test cases that cover it (see `test-cases.md`).

---

## Surface A — Home atlas (`atlas.html`)

### A1 — Hero
**As a** first-timer, **I want** a clear hero that states what the site is, **so that** I understand it in one read before scrolling.
- Hero region renders a real underwater photograph (not gradient/illustration) behind the headline.
- Eyebrow reads "Live data" with a pulsing dot; no other eyebrow text.
- H1: "Find where to dive, and where the ocean needs eyes." Subline names the platform in plain language (live coral health, heat, fishing pressure). No hyphens in copy.
- Hero contains no stats strip that duplicates data shown below (dedupe rule).
- Below the hero the page scrolls to the atlas (filters left, results right). Covers: E2E-A1, CC.

### A2 — Filter rail: structure and collapsible sections
**As a** diver, **I want** filters grouped into labelled, collapsible sections, **so that** I can narrow reefs without being overwhelmed.
- Rail shows sections: When · What do you want to see? · Region · Reef state · Evidence gaps · Certification level.
- Each section is an expand/collapse control; open by default; toggling hides/shows its body and rotates the caret.
- A "Reset" control clears all filters back to defaults. Covers: E2E-A2, E2E-A2b.

### A3 — Month grid ("When")
**As a** diver, **I want** to pick the months I can travel, **so that** reefs in season for those months come first.
- "When" body renders 12 month cells (Jan–Dec).
- The current month is visually marked as "now".
- Clicking a month toggles it on/off; multiple months may be selected.
- With no month selected, sort falls back to the current month. Covers: E2E-A3, UNIT-sort.

### A4 — Wildlife taxonomy multi-select ("What do you want to see?")
**As a** diver, **I want** to pick animals from grouped categories, **so that** I only see reefs where those animals were actually recorded.
- Taxonomy renders categories (Sharks & rays, Turtles, Marine mammals, Fish & critters, Reef & wrecks) each expandable to leaf chips.
- Leaves are multi-select; selecting a leaf updates that category's count badge; badge hides at zero.
- An "endangered only" toggle is available and filters to endangered species.
- A reef matches if it has at least one selected leaf; with nothing selected all reefs pass the species filter. Covers: E2E-A4, UNIT-filter.

### A5 — Region filter (continent mapping)
**As a** diver, **I want** to filter by world region, **so that** I see reefs near where I can travel.
- Region body lists the continent buckets (Asia, Oceania, Indian Ocean, Americas, Atlantic & Mediterranean) as checkboxes.
- Each reef's source region maps to one continent bucket (e.g. Caribbean→Americas, Red Sea→Indian Ocean, Coral Triangle→Asia, Great Barrier→Oceania).
- With no region checked all reefs pass; checking one or more keeps only reefs in those buckets. Covers: E2E-A5, UNIT-continent.

### A6 — Reef state filter + (i) explainer
**As a** researcher, **I want** to filter by reef state with an explanation of what the labels mean, **so that** I can find reefs in a given condition without misreading the labels as a ranking.
- Reef state shows three checkboxes: Thriving, Under pressure, Witnessing change; all on by default.
- The section header has an (i) button opening a popup that defines all three states (Thriving = near its natural baseline, not perfect; Under pressure = below baseline but still holds; Witnessing change = heavy recent loss, diving documents what remains) and states it is not a ranking.
- The popup ends with a link naming the Method page. Covers: E2E-A6, E2E-A11, UNIT-reefstate.

### A7 — Evidence gaps ("Needs fresh eyes") + (i)
**As a** researcher, **I want** to find reefs with no recent diver records, **so that** I can dive them and put them back on the map.
- Evidence gaps section has a single "Needs fresh eyes" checkbox.
- Its (i) popup explains the phrase (never "no data"), why logging matters, and links naming the Method page.
- When on, only reefs flagged needs-fresh-eyes remain. Covers: E2E-A7, E2E-A11.

### A8 — Certification level filter + (i)
**As a** first-timer, **I want** to filter by my comfort level, **so that** I only see reefs whose sites suit me.
- Certification section lists Beginner, Open water, Advanced, Technical as checkboxes.
- Its (i) popup explains the levels in plain words.
- With no level checked all reefs pass; checking one keeps reefs at that level. Covers: E2E-A8, E2E-A11.

### A9 — Live result count
**As a** diver, **I want** the result count to update as I filter, **so that** I get instant feedback.
- A "N reefs" count sits above the results.
- Any filter change updates the count to the number of matching reefs in the same interaction (no submit button). Covers: E2E-A9, UNIT-filter.

### A10 — In-season-first sort + "other times of year" divider
**As a** diver, **I want** in-season reefs first, **so that** I can act on them now and still plan off-season trips.
- Results are split: reefs in season for the selected months (or current month if none) appear first; the rest appear below a divider labelled for other times of year.
- The sort note reads "Sorted by in season first".
- If every matching reef is in season, no divider renders. Covers: E2E-A10, UNIT-sort.

### A11 — Every filter has an (i) explainer popup → Method
**As a** first-timer, **I want** an explanation on each filter, **so that** I understand the science without leaving the page.
- When, What to see, Reef state, Evidence gaps, Certification level each expose an (i) button.
- Clicking an (i) opens a popup; pressing Escape, clicking the close control, or clicking the backdrop closes it.
- Each popup that points off-page links to the Method page with the Method page named in the link text. Covers: E2E-A11, CC-4.

### A12 — Place-only cards
**As a** diver, **I want** clean place cards, **so that** the grid reads as destinations, not data dumps.
- Each card shows region eyebrow + place name over a photo; the whole card is a single link to that location page.
- Cards do not stack reef-state/heat/coral stats on the photo (dedupe; state lives in the popup/Method).
- Hover lifts the card. Covers: E2E-A12, E2E-A13.

### A13 — Cards / Map toggle
**As a** diver, **I want** to switch between a card grid and a map, **so that** I can browse the way I prefer.
- A Cards/Map toggle sits by the results header; Cards is active by default.
- Selecting Map hides the grid and shows the globe view; selecting Cards reverses it.
- The active button is visually marked. Covers: E2E-A13.

### A14 — 3D globe (desktop) with mobile fallback
**As a** diver on desktop, **I want** a rotating globe lit by my matches, **so that** I can see results geographically; **as a** mobile user **I want** a usable fallback.
- In Map view a globe renders reef dots colored by reef state.
- Filtering dims non-matching dots and keeps matches lit (globe reflects the live match set).
- Clicking a lit dot with a real destination navigates to that location page.
- On small viewports the experience degrades gracefully (cards remain the primary view; globe is not required to interact). Covers: E2E-A13, E2E-A14, CC-1, CC-6.

### A15 — Nav search box
**As a** diver, **I want** a search box in the nav, **so that** I can jump straight to a known reef, site, or species.
- Nav exposes a search entry; submitting a query routes to the search results surface.
- Search returns location, site, and species results and an empty state for no matches. Covers: E2E-A15 (extends `search.spec.ts`).

---

## Surface B — Location page (`location-florida-keys-slim-v2.html`)

### B1 — Slim, deduplicated layout
**As a** first-timer, **I want** the location page to lead with one plain condition sentence and not repeat itself, **so that** it is not overwhelming.
- Page opens with a generic editorial intro of the place, then a single "Reef condition" block.
- No stat strip; each signal (heat, coral, fishing, reef state) appears once.
- One heading each: Reef condition · What you'll see · Dive sites · Gear. Covers: E2E-B1.

### B2 — Match-context bar (arriving from search)
**As a** diver who filtered, **I want** a check row confirming this reef matches, **so that** I trust the result.
- When arrived from a filtered search, a bar shows green check rows (month in season, species seen recently, suits your level) with an "Edit search" link back.
- No "Matches your search" label; checks only. Covers: E2E-B2.

### B3 — Plain-language reef condition + decline chart
**As a** first-timer, **I want** the reef's condition in plain words with one trend chart, **so that** I grasp it without jargon.
- Lead sentence states the change in plain language (coral lost since a year, current heat, fishing status).
- A coral-cover decline chart shows the historical drop and a dashed projection; shown once.
- Heat is described plainly ("warmer than usual"), with no alert jargon and no timestamp. Covers: E2E-B3, CC-7.

### B4 — Reef-state hero pill + (i)
**As a** researcher, **I want** the reef state shown once with an explainer, **so that** I read it correctly.
- Hero shows one state pill (e.g. "Under pressure"); subtitle is "Country · Region", not a repeat of the place name.
- Clicking the pill (and the reef-state (i) in the condition block) opens the state popup ending with a Method link. Covers: E2E-B4, E2E-B8.

### B5 — Heat & fishing (i) popups
**As a** first-timer, **I want** popups that explain heat and fishing protection, **so that** I understand the labels.
- Heat (i) popup shows usual vs current temp, explains sustained heat vs one hot day, credits NOAA Coral Reef Watch, links Method.
- Fishing (i) popup explains protection types (Banned/Limited/Open/Patrolled), links Method. Covers: E2E-B8.

### B6 — Species ordered by recency + IUCN spelled out
**As a** diver, **I want** species ordered by how recently they were seen with plain conservation labels, **so that** I know what's around now.
- Species cards are ordered most-recent-first; each shows a spelled-out IUCN label (Least concern / Vulnerable / Endangered, never bare codes in body copy).
- A section-level (i) opens the IUCN explainer (all tiers + risk) ending with a Method link. Covers: E2E-B6, E2E-B8.

### B7 — Simplified dive sites list
**As a** diver, **I want** a compact site list, **so that** I can scan and click into a site.
- Each site row shows name · species · depth only and links to that dive site page. Covers: E2E-B7.

### B8 — Gear inline, two layers
**As a** diver, **I want** the full kit list inline in two layers, **so that** I know what to bring without leaving the page.
- Gear shows a basic-kit group and a site-specific group; items are links with a small external-link affordance; no repeated "Shop" buttons, no rental line. Covers: E2E-B9.

### B9 — One clear CTA: trip card + operators popup
**As a** diver, **I want** a single sticky trip CTA, **so that** I'm not torn between competing buttons.
- Sidebar trip card shows best months (mini season grid with current month marked) and water temp.
- Primary CTA "See dive operators →" opens an on-page operators popup; each operator links to its own booking site; copy states no booking/commission (nonprofit).
- "Getting there" and "Where to stay" are expandable dropdowns inside the trip card. Covers: E2E-B10, E2E-B11.

---

## Surface C — Dive site page (`dive-site-looe-key.html`)

### C1 — Same system, breadcrumb to location
**As a** diver, **I want** the dive site page to match the location system and link back up, **so that** navigation is consistent.
- Opens with a generic intro; breadcrumb links Atlas / Location / this site.
- One clear CTA (operators popup); "Getting there" dropdown; gear two layers. Covers: E2E-C1, E2E-C5.

### C2 — Plain-labelled conditions grid + (i)
**As a** first-timer, **I want** conditions in plain words, **so that** I understand them without dive jargon.
- Conditions grid shows Depth, Current, Visibility, Water (spelled out, no "vis").
- A conditions (i) popup explains each. Covers: E2E-C2.

### C3 — Encounter odds per species + (i)
**As a** diver, **I want** my chance of seeing each animal, **so that** I have realistic expectations.
- Each species row shows a chance label (Almost always / Very likely / Likely / Sometimes / Rare), a likelihood bar, a frequency line, and where to find it.
- A section (i) explains how chances are worked out (research-grade iNaturalist via GBIF, "a guide not a promise") and links Method.
- A "See all species recorded here →" link goes to the species list page. Covers: E2E-C3, E2E-C6.

### C4 — Contribute platforms + Method how-to
**As a** contributor, **I want** to know how to log what I see, **so that** my photos enter the public record.
- Contribute block lists iNaturalist, CoralWatch, Reef Check with a one-liner each; each opens a short popup.
- A "how submitting and verifying works on the Method page →" link is present. Covers: E2E-C4.

---

## Surface D — Species list page (`species-looe-key.html`)

### D1 — Full list, most-likely-first
**As a** diver, **I want** every recorded species ordered most likely first, **so that** I see the realistic headline animals.
- Breadcrumb: Atlas / Location / Site / All species.
- Rows show name, spelled-out IUCN, where, chance label, likelihood bar, frequency, ordered by likelihood. Covers: E2E-D1, E2E-D2.

### D2 — Type filter pills with counts + empty state
**As a** diver, **I want** to filter species by type, **so that** I can focus (e.g. just sharks).
- Pills: All / Fish / Sharks & rays / Turtles / Invertebrates, each with a live count.
- Selecting a pill filters the list and updates the visible count; selecting a type with no members shows an empty state. Covers: E2E-D2, E2E-D3.

### D3 — (i) popups for chances and IUCN
**As a** first-timer, **I want** explainers for chances and IUCN, **so that** I understand the labels.
- Heading (i) opens IUCN explainer; "How chances work" opens the chances popup; both link Method. Covers: E2E-D4.

---

## Surface E — Method page (`method.html`)

### E1 — Keystone explainer with jump-nav
**As a** researcher, **I want** one page that explains everything other popups link to, **so that** I can verify the methodology.
- Sticky jump-nav anchors: states, signals, chances, verify, labels, contribute, gaps, research.
- Sections cover the 3 reef states, the 4 source signals (NOAA heat, Reef Check coral, Global Fishing Watch, iNaturalist sightings) each credited with cadence, likelihood logic, the verify pipeline, IUCN tiers, contributing, honest gaps, and research contact (hello@scubaseason.fun).
- Every "…on the Method page →" link from other surfaces resolves to a real anchor here. Covers: E2E-E1, E2E-E2, CC-2.

---

## Cross-cutting stories

### CC-1 — Responsive (mobile / tablet / desktop)
**As a** user on any device, **I want** the layouts to adapt, **so that** every surface is usable.
- Atlas: 3-column grid on desktop, 2 on tablet, 1 on mobile; filter rail moves from sticky sidebar to stacked on narrow widths.
- Location/dive-site: two-column on desktop collapses to single column with the trip card de-stickied on narrow widths.
- No horizontal scroll at 375px / 768px / 1280px. Covers: E2E-CC1.

### CC-2 — All links resolve
**As a** user, **I want** every link to go somewhere real, **so that** I never hit a dead end.
- Nav, breadcrumb, footer, card, and popup Method links resolve (no silent dead "#" in production). Covers: E2E-CC2.

### CC-3 — Accessibility: keyboard + focus + contrast + reduced motion
**As a** keyboard or assistive-tech user, **I want** to operate every control, **so that** the site is usable for me.
- All filters, toggles, (i) buttons, and modals are reachable and operable by keyboard; focus is visible; Escape closes modals.
- (i) buttons expose an accessible name (e.g. aria-label "More information").
- Color is not the only signal for reef state (text label always present).
- The rotating globe respects `prefers-reduced-motion` (rotation paused/reduced). Covers: E2E-CC3, E2E-CC4.

### CC-4 — Info popups open/close and link to Method
**As a** user, **I want** consistent popup behaviour everywhere, **so that** explanations feel the same.
- On every surface, (i) opens a popup; backdrop click, close button, and Escape all close it; off-page links name the Method page. Covers: E2E-A11, E2E-B8, E2E-C2, E2E-C3, E2E-D4, CC-4.

### CC-5 — Empty states
**As a** diver, **I want** a clear message when nothing matches, **so that** I know to widen my search.
- Atlas with an impossible filter combination shows "No reefs match… remove a filter to widen the search."
- Species list with an empty type shows "No species of this type recorded here yet." Covers: E2E-CC5, UNIT-filter.

### CC-6 — Globe reduced-motion / fallback
(See A14, CC-3.) The globe must not be the only path to results and must honour reduced-motion. Covers: E2E-A14, E2E-CC4.

### CC-7 — House rules: no hyphens, plain language, live data no timestamps
**As a** first-timer, **I want** plain, consistent copy, **so that** I trust and understand the site.
- No hyphen characters in user-facing copy on the redesigned surfaces (em dashes allowed).
- No update timestamps on live-data displays (heat, coral, sightings).
- Reef state copy never says "perfect/pristine"; uses "near its natural baseline". Covers: E2E-CC7, UNIT-reefstate.
