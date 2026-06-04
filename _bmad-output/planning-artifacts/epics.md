---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
inputDocuments:
  - _bmad-output/planning-artifacts/scubaseason-prd/prd.md
  - _bmad-output/planning-artifacts/scubaseason-prd/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/.decision-log.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-03/review-accessibility.md
session2Update:
  date: 2026-06-04
  scope: 10 homepage/location/site refinements from the Session 2 UX update
  appendedEpic: "Epic 7: Session 2 UX Refinements"
  stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories", "step-04-final-validation"]
---

# scubaSeason.Fun - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for scubaSeason.Fun, decomposing the requirements from the PRD (final, 2026-06-04), Architecture, DESIGN.md (final, 2026-06-04), and EXPERIENCE.md (final, 2026-06-04) into implementable stories. The UX design is the primary source for all UI implementation — every component, state, and flow described here traces to a finalized spec.

---

## Requirements Inventory

### Functional Requirements

FR1: The home page must display an interactive 3D globe with location markers colored by reef state (Thriving / Under pressure / Witnessing change) and in/out-of-season status.
FR2: The home page must include a filter rail supporting: reef condition, month range, skill level (cumulative), region, thermal heat level, animal tags (Sharks, Mantas, Turtles, Whales, Dolphins, Dugongs), freshness toggle, and sort options.
FR3: All filter state must persist in URL querystring via router.replace so filtered views are shareable and back-button-safe.
FR4: Location cards must display name, reef state badge, in-season badge, hero image, freshness line (thermal dot + survey dot with age), coral cover, and best season.
FR5: The globe and card grid must update live on filter change without a full page reload.
FR6: On mobile, the filter rail must collapse to a "Filters" button that opens a full-height left drawer; the globe must degrade to a list/card view.
FR7: Each site detail page must contain: Overview, Species & What You'll See, 12-month Conditions grid, Reef Health snapshot, Plan Your Trip (sticky sidebar desktop / bottom drawer mobile), Gear, and Related Sites sections.
FR8: The species section on site detail must merge curated species with sighting evidence showing: common name, scientific name, IUCN badge (feature-flagged), reliability, last confirmed date (in <time> element), 24-month rolling record count, proximity radius, iNaturalist photo with attribution.
FR9: The 12-month conditions grid must show water temp range, visibility range, and current strength per month, color-coded by current level, with the current month highlighted via ring-2 (not color alone).
FR10: The reef health section on site detail must link to the parent location reef state and display DHW thermal stress where present.
FR11: The gear section must present two layers: Layer A (cert-level base kit adapting to the site's cert floor) and Layer B (site-specific add-ons per site).
FR12: Plan Your Trip must appear as a sticky sidebar on desktop and a bottom-drawer CTA on mobile, covering Getting There, Where to Stay, and Who to Dive With, all affiliate-tracked via AffiliateLink component.
FR13: Wreck data must be displayed on site detail when wreck records exist (vessel name, type, sunk date, depth range, history).
FR14: Site detail pages must use generateStaticParams for static generation and include JSON-LD TouristAttraction schema.
FR15: Every quantitative claim on site and location detail pages must link inline to its source and methodology claim ID via <details>/<summary> disclosure.
FR16: Location pages must include a reef health panel: coral cover % (current vs historical with bars), bleached %, mortality %, DHW from NOAA nightly, survey date and method with DataFreshnessLabel.
FR17: Location pages must include a fishing pressure panel showing GFW AIS-tracked fishing hours within 50km with artisanal fishing blind spot caveat.
FR18: Location pages must display water quality events (severity, worst months, microplastics level, diving impact) when records exist.
FR19: Location pages must include a card grid of all child dive sites, each site card in-season aware.
FR20: Location pages must include a Plan Your Trip sidebar with Getting There, tiered lodging options, and dive operators, all via AffiliateLink.
FR21: Location pages must include a general gear section and JSON-LD Place schema.
FR22: The sites directory must display all sites in a card grid sorted by default editorial rank.
FR23: The sites directory must support free-text fuzzy search (fuse.js) across site name, location, country, and species (common and scientific names).
FR24: The sites directory must support the same filter controls as the Atlas home with URL-state persistence.
FR25: Each site card must show name, location, hero image, skill level badge, best months, dive types, confidence dot and "Sighting evidence pending" fallback when no records exist (never blank).
FR26: The system must provide one species explorer page per curated encounter for all 11 encounters at /where-to-see/[species].
FR27: Each species explorer page must show: hero, IUCN badge (feature-flagged), ethics note, best months strip, top 6 sites by editorial score, all atlas locations grouped by region (primary / secondary / emerging / closed).
FR28: All affiliate links must use the AffiliateLink component which fires Vercel Analytics events with site_id + partner + product_id context.
FR29: Affiliate disclosure must appear adjacent to all affiliate link blocks; full policy at /about. Non-affiliate operator links permitted as plain links.
FR30: /data page must document what is live (NOAA nightly), what is a snapshot, and what cannot be seen.
FR31: /faq page must document how each metric is calculated (coral cover methodology, DHW formula, reef state thresholds, sighting evidence 24-month window).
FR32: Per-claim source citations and methodology IDs must appear inline on site and location detail pages.
FR33: Data freshness labels must appear on every panel showing survey age; IUCN and GFW data refreshed weekly via automated workflows.
FR34: All 380 sites must have at least 1 sighting evidence record. Current gap: 136 sites. Backfill priority: editorial rank descending.
FR35: A visual evidence confidence badge must distinguish "Confirmed sightings on record" vs "No sighting records yet" on site cards and site detail hero.
FR36: MERMAID open API must be integrated to retrieve multi-year coral cover records per location, replacing the two-data-point comparison with a trend series (at least 3 data points for at least 5 locations).
FR37: A first-time visitor must be able to articulate the site's value proposition within 10 seconds without scrolling.
FR38: A search results page at /search?q= must group results by type (Locations / Sites / Species), handle no-results with suggestions, and support query refinement without page reload.
FR39: A species detail sub-route (/{location}/{site}/species/[slug]) must show species profile, sighting evidence at that site, 12-month seasonality, and links to the cross-atlas /where-to-see page.
FR40: The Witnessing change location variant must: promote reef science above copy, show honest label, render Plan Your Trip in muted style, and suppress hover lift on cards.
FR41: Cert-level landing pages (/for/[cert]) must exist for all 6 levels, each showing cert-filtered site grid, cert-appropriate copy, safety notes, and Layer A gear.

### Non-Functional Requirements

NFR1: Site detail pages LCP < 2.0s on 4G. Statically generated, images via Next.js <Image> with priority on hero only.
NFR2: Every page indexable with unique title / description / OG metadata. Sitemap covers all 380 sites, 113 locations, 11 encounters, 6 cert pages. JSON-LD schema.org per page type.
NFR3: WCAG AA on text contrast and keyboard nav. Globe has non-globe fallback. All interactive elements reachable by Tab in DOM order.
NFR4: Fully responsive. Globe degrades to list on mobile. Plan Your Trip becomes bottom drawer. Filters collapse to sheet. Stat strip scrolls horizontally.
NFR5: Every quantitative claim traceable to source + methodology. No headline stat without cited confidence level or caveat.
NFR6: FTC affiliate disclosure on every page with affiliate links. Vercel Analytics cookieless. TypeScript strict throughout.

### Additional Requirements (Architecture)

- Stack is locked: Next.js 16 App Router (Turbopack), React 19, Tailwind v4, shadcn/ui, TypeScript strict, Vercel hosting.
- Data is static JSON in src/data/ (locations.json, sites.json, gear.json). No database. Loaded at build time.
- Pre-built _index.json at build time for client-side filtering/search (compact subset: id, slug, name, lat, lng, bestMonths, skillLevel, diveTypes, speciesNames[], regionId).
- Search via fuse.js client-side. Weighted: name 3x, species 2x, location 1x.
- Filter state in URL querystring via router.replace (not push — back button must return to prior page, not prior filter state).
- Server components by default; globe, filter drawer, search input are client components ('use client').
- No global store. Diver profile (cert + recency) in localStorage via useDiverProfile() hook.
- Static generation: generateStaticParams on /sites/[slug] and /locations/[slug]. Full static build.
- Sitemap generates dynamically from JSON on every build.
- Data update flow: edit JSON → npm run build → commit → push → Vercel rebuild (~2-3 min).
- AffiliateLink stores affiliate tag in URL at JSON-write time; component renders rel="nofollow sponsored noopener".
- Codebase already exists — stories extend and refactor the live site, not greenfield.

### UX Design Requirements

UX-DR1: AtlasNav global search — dropdown max 8 results, keyboard nav (ArrowDown/Up/Enter/Escape), result rows show location name + country + reef state pill, closes on outside mousedown or navigation, input clears on navigation. Enter with no result selected routes to /search?q=.
UX-DR2: AtlasFilterRail — 7 filter groups per EXPERIENCE.md §4.2. Certification cumulative logic (Advanced shows Advanced + OW + Beginner). URL sync via router.replace. Active filter summary bar appears below filter strip when any non-default filter is active.
UX-DR3: ReefLocationCard — 4:3 hero image, reef state + in-season badge overlay top-left, skill badge bottom-right, image scale 1.02 on hover (500ms), freshness line (thermal green dot always + survey dot by age), lift 3px on hover. Witnessing change variant: no hover lift, no shadow increase.
UX-DR4: SiteCard — fixed h-44 image, confidence dot + species name + "last confirmed [relative time]", "Sighting evidence pending" fallback when no records, in-season pill uses ●/○ character plus text (not color alone).
UX-DR5: DataFreshnessLabel — Live (green dot), Snapshot (amber dot, appends "(N years ago)" when >2 years), Presence (slate dot). text-[10.5px] font-semibold uppercase tracking. Entire pill links to /data.
UX-DR6: IucnBadge — inline flat badge, renders IUCN abbreviation. Feature-flagged pending commercial license.
UX-DR7: Methodology disclosure — native <details>/<summary> only. Never modal. Always inline at point of claim. Info circle icon + "How is this calculated?" summary.
UX-DR8: AffiliateLink component — rel="nofollow sponsored noopener", fires Vercel Analytics event, shows commission indicator when isAffiliate: true.
UX-DR9: Search results page — results grouped Locations > Sites > Species. Category pill + name + metadata + reef state pill per row. No-results: heading + suggestions. Input pre-populated, re-submit updates without page reload.
UX-DR10: Active filter summary bar — colored pills with × dismiss, "Reset all filters" right, live count, chip ordering: reef state > cert > region > month > thermal > wildlife > fresh-only, wraps (no truncation).
UX-DR11: Live sightings feed — green ≤30 days, amber 31-90 days, slate >90 days. Entry: dot + species + site + iNaturalist obs ID (linked) + <time dateTime>. No-entries state with iNaturalist link. DataFreshnessLabel live variant in header. Nightly sync only — no real-time streaming.
UX-DR12: Stat strip — 6 stats (label/value/note), hairline dividers, {colors.surface} background, horizontal scroll on mobile, static values (no count-up).
UX-DR13: How-to-dive section — 4 steps numbered 01-04. Large muted display figure (text-7xl, {colors.muted}/30), bold title, Source Serif 4 italic description. 2-col desktop, 1-col mobile.
UX-DR14: Witnessing change state pattern — reef science leads, honest label, muted CTA heading, no card hover lift. Under pressure does NOT suppress CTAs — only Witnessing change does.
UX-DR15: Accessibility floor — all 14 requirements per EXPERIENCE.md §8: aria-hidden decorative, aria-label search/globe, aria-pressed filters, <time dateTime> timestamps, alt attributes, text + symbol for confidence/in-season indicators, visible focus rings, WCAG AA contrast.
UX-DR16: URL-driven state — no state in cookies or localStorage except FirstVisitBanner dismissal. All filter state and routes in URL. Shareable, server-renderable.
UX-DR17: Weight-split wordmark — "scuba" Noto Sans weight 300, #94a3b8 light / rgba(255,255,255,0.3) dark, tracking 0.08em. "Season.fun" Noto Sans weight 900, #0f172a light / #fff dark, tracking -0.05em. Stacked, line-height 1.0. No color on .fun.
UX-DR18: Option D logo mark — SVG viewBox 0 0 36 36, solid #0089de circle r=16, primary white wave path (stroke-width 2, opacity 1.0), secondary wave (rgba(255,255,255,0.4), stroke-width 1.5). No outline ring.
UX-DR19: Reef state color tokens — Thriving #10b981, Under pressure #0089de (brand blue — NOT amber), Witnessing change #f43f5e. Non-negotiable.
UX-DR20: Species detail page — hero + IUCN badge, breadcrumb, sighting evidence rows, seasonality calendar (ring-2 current month), methodology <details>, "Also seen nearby," link to /where-to-see.
UX-DR21: No hyphens in any user-facing copy strings. Em dashes (—) are fine. Reword compound adjectives.
UX-DR22: Dark ink hero — full-bleed #0b1e32, position:absolute nav treatment on homepage hero. Ink sections used on homepage, sites catalogue page header.
UX-DR23: AtlasFooter — dark ink #0b1e32, 3-column grid (logo+tagline / links / contact), hairline rgba(255,255,255,0.08) divider, copyright + data attribution bottom bar. No newsletter capture.
UX-DR24: FreshnessDot — Fresh #10b981 (<1 year), Stale #e8962f (1-3 years), Cold #e23a3a (>3 years / null). 5px circle. Always paired with text label.
UX-DR25: StatStrip — label 0.5875rem/700/0.12em tracked uppercase muted, value 1rem/700 ink, note 0.6875rem muted. Background {colors.surface}. Hairline border-r between items.
UX-DR26: LiveBadge — green dot with box-shadow glow 0 0 0 3px rgba(21,160,92,0.25), pill rgba(21,160,92,0.1) bg, border rgba(21,160,92,0.2), text #15804d, 0.75rem/700.
UX-DR27: SightingRow — flex row: 8px dot, flex:1 info (species name 0.875rem/600, meta 0.75rem muted, source IBM Plex Mono 0.6875rem #94a3b8), right-aligned date 0.75rem muted.
UX-DR28: FilterSummaryBar — reef state pills use state color token, other filters use {colors.brand}/10 bg + {colors.brand} text, × per pill, "Reset all" right, live count.
UX-DR29: EditorialHook — Source Serif 4 serif, 1.0625rem, line-height 1.8, color #334155, max-width 640px. On location pages above reef science section.

### FR Coverage Map

| FR | Epic | Summary |
|---|---|---|
| FR1–6 | Epic 2 | Globe, filter rail, URL state, cards, mobile |
| FR7–15 | Epic 4 | Site detail: species, conditions, gear, plan, wreck, SEO |
| FR16–21 | Epic 3 | Location: reef health, fishing, water quality, sites, plan, SEO |
| FR22–25 | Epic 2 | Sites directory: search, filter, cards |
| FR26–27 | Epic 4 | Species explorer pages (extend existing 11) |
| FR28–30 | Epic 1 | AffiliateLink, disclosure, non-affiliate links |
| FR31–33 | Epic 1 | Data transparency, freshness labels, inline citations |
| FR34–35 | Epic 5 | Evidence backfill + confidence badge |
| FR36 | Epic 6 | MERMAID multi-year coral cover |
| FR37–38 | Epic 2 | Homepage clarity + search results page |
| FR39 | Epic 4 | Species detail sub-page |
| FR40 | Epic 3 | Witnessing change variant |
| FR41 | Epic 4 | Cert-level landing pages |
| NFR1–2 | Epics 4, 2 | Performance + SEO |
| NFR3–4 | Epics 1, 2 | Accessibility + mobile |
| NFR5–6 | Epic 1 | Data integrity + compliance |
| All UX-DRs | Epics 1–4 | Components in Epic 1, applied in Epics 2–4 |

## Session 2 — UX Refinement Requirements (2026-06-04)

These UX Design Requirements capture the delta introduced by the Session 2 UX update (decision log D06–D18 + accessibility review). They modify behavior specified in Epics 1–4 and are decomposed in **Epic 7** below. Two items are open build-time decisions, flagged inline.

| ID | Requirement | Decision log | Touches |
|---|---|---|---|
| UX-DR-S2-1 | **Location card photo overlay reduced to one signal.** Only the reef-state badge sits on the card photo (top-left). The in-season and skill/cert indicators move OFF the photo into a body meta row beneath the title. In-season chip uses mark + text (●/text), not color alone. | D06 | `reef-location-card.tsx` |
| UX-DR-S2-2 | **Expand the wildlife filter to a categorised taxonomy.** Replace the 6 flat tags with named sub-groups (Sharks & rays / Marine mammals / Reptiles & pelagics / Macro & critters) holding individual encounter tags. Requires expanding the `animalTags` derivation in `atlas-location.ts` so every new tag maps to species actually present at sites. Cross-group selection is OR logic. | D07 | `atlas-filter-rail.tsx`, `atlas-location.ts` |
| UX-DR-S2-3 | **🔶 OPEN — Wildlife-tag data-coverage pass.** Every proposed tag must resolve to ≥1 location in the live data or be dropped (no empty filters). Run a coverage check against `atlas-location.ts` derivation to finalize the tag list before the taxonomy ships. | D07 | `atlas-location.ts` (investigation) |
| UX-DR-S2-4 | **🔶 OPEN — Filter layout choice (A vs B).** Two approved layouts: A horizontal sticky bar with category dropdowns; B left rail with collapsible groups (wildlife as nested sub-groups). Both inherit the same behavior/taxonomy/a11y. Pick one to implement (B is closest to current code; A is more photo-forward). | D08 | `atlas-filter-rail.tsx`, `atlas-explorer.tsx` |
| UX-DR-S2-5 | **Sticky filter, scrolling results.** The filter surface is sticky/pinned and scrolls independently; only the results list scrolls. Layout A bar pins to top on scroll; Layout B rail is `position: sticky` with its own overflow. | D09 | `atlas-explorer.tsx`, `atlas-filter-rail.tsx` |
| UX-DR-S2-6 | **Render real underwater photos on location hero + homepage inspiration cards.** Replace CSS gradients with the borrowed underwater site photo (already computed in `atlas-location.ts:105` via `isUnderwaterQualityPhoto`). Photo matches the location (borrowed from its own sites); underwater-only; gradient is base/letterbox only. Informative alt names the location. | D10 | `page.tsx`, `locations/[slug]/page.tsx`, `atlas-location.ts` |
| UX-DR-S2-7 | **Rebuild the location "Plan your trip" block.** Getting there leads; then "Where to stay" and "Operators" as two adjacent equal-weight peer groups (no dominant dark operators panel). Liveaboard covering diving → combined "stay + dive" row, suppresses redundant operator. Drop the hardcoded generic-PADI "See trip options" button. Operators only when backed by a real/affiliate URL. Section-level disclosure, not per-item badges. **Location page only.** | D11, D17 | `locations/[slug]/page.tsx` |
| UX-DR-S2-8 | **Gear section on the LOCATION page only.** Layer A basic kit for the location (region water temp + skill); Layer B site-specific add-ons aggregated from `siteSpecificGear`, grouped by site name, each linking down to its site. Quiet "Shop →" links, no per-item affiliate badge, section-level disclosure. **Remove gear from the dive-site page entirely.** | D12, D18 | `locations/[slug]/page.tsx`, `sites/[slug]/page.tsx` |
| UX-DR-S2-9 | **Re-sequence the dive-site detail page.** Centre column About-first: About → What you'll see → Conditions (incl. the relocated NOAA thermal/live panel) → How to dive. Sidebar = orient only: Depth profile → Part of [location] (links up to plan + gear). Remove from sidebar: operators/booking, the standalone thermal panel, and the duplicate bottom "Planning a trip?" block. | D13, D17, D18 | `sites/[slug]/page.tsx` |
| UX-DR-S2-10 | **Filter-control accessibility.** Real focusable controls (native checkbox / `aria-pressed`). Layout A dropdown triggers: `aria-expanded` + `aria-controls` + `aria-haspopup`, Escape closes + returns focus. Layout B: native `<details>`. Mobile drawer: focus trap + `aria-modal` + background `inert`, focus returns to trigger. Count badges carry visually-hidden text ("2 active filters"). Result count in `aria-live="polite"`/`role="status"`. | a11y review (BLOCK 1–4) | `atlas-filter-rail.tsx` |
| UX-DR-S2-11 | **Contrast + link semantics.** Active chip/tag/button tinted text `#0089de` → `#1d5d90` (AA on brand tint). AffiliateLink accessible name includes "(opens in new tab)" + self-describing destination; decorative `→` `aria-hidden`. Gear layers as `<ul>/<li>`; leading emoji `aria-hidden`. Hero/inspiration `<img>` informative alt naming the location. | a11y review (FLAG-1/3/4/5, NOTE-3) | `atlas-filter-rail.tsx`, `affiliate-link.tsx`, gear + hero render sites |

**Traceability:** UX-DR-S2-1→9 map to the 10 user-reported issues (Issues 7 & 8 both land in UX-DR-S2-7). UX-DR-S2-10/11 bundle the accessibility-review findings folded into the spines. The two 🔶 OPEN items are surfaced as explicit stories in Epic 7.

### Epic 7 story sequence & coverage (approved 2026-06-04)

| Story | Covers | Gated by |
|---|---|---|
| 7.1 — 🔶 Decision: filter layout A (bar) vs B (rail) | S2-4 | — (decide first) |
| 7.2 — 🔶 Wildlife-tag coverage pass (finalize tags in `atlas-location.ts`) | S2-3 | — (investigation) |
| 7.3 — Categorised wildlife filter taxonomy | S2-2 | 7.1, 7.2 |
| 7.4 — Sticky filter, scrolling results | S2-5 | 7.1 |
| 7.5 — Filter-control accessibility | S2-10, S2-11 (filter) | 7.1, 7.3 |
| 7.6 — Location card: single-signal photo + body meta row | S2-1 | — |
| 7.7 — Real underwater photos (location hero + inspiration grid) | S2-6, S2-11 (alt) | — |
| 7.8 — Location "Plan your trip" rebuild | S2-7, S2-11 (links) | — |
| 7.9 — Gear section on location page (remove from site) | S2-8 | — |
| 7.10 — Dive-site re-sequence (About first; sidebar orient-only) | S2-9 | 7.9 |

## Epic List

### Epic 1: Design System & Core Components
Every page delivers a coherent, intentional design language. Shared components are built once and used everywhere — users experience consistency from nav to footer on every route.
**FRs covered:** FR28, FR29, FR30, FR31, FR32, FR33, NFR3, NFR5, NFR6, UX-DR1 (AtlasNav search), UX-DR5 (DataFreshnessLabel), UX-DR6 (IucnBadge skeleton), UX-DR7 (Methodology disclosure), UX-DR8 (AffiliateLink), UX-DR11 (SightingRow), UX-DR12 (StatStrip), UX-DR13 (HowToDive), UX-DR15 (accessibility floor), UX-DR17–19 (logo/wordmark/tokens), UX-DR21 (no hyphens), UX-DR23 (AtlasFooter), UX-DR24–29 (FreshnessDot, LiveBadge, FilterSummaryBar, EditorialHook)

### Epic 2: Homepage & Atlas Discovery
A first-time visitor understands what the site is within 10 seconds. Susan discovers remarkable reefs by browsing on her phone without touching a filter. Search results, active filter state, and the full mobile experience are complete.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR22, FR23, FR24, FR25, FR37, FR38, NFR1, NFR4

### Epic 3: Location Intelligence
A diver researching a region gets a complete picture — editorial context, species aggregated across all sites, live sightings feed, thermal status, getting-there logistics. Witnessing change locations tell the honest story first.
**FRs covered:** FR16, FR17, FR18, FR19, FR20, FR21, FR35, FR40, NFR2

### Epic 4: Site Detail & Species Profiles
A diver arriving cold on a site page from Google gets a complete dive briefing — conditions, species with evidence, numbered dive sequence, and a linkable species detail sub-page. Cert landing pages are current.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR26, FR27, FR39, FR41, NFR1, NFR2

### Epic 5: Evidence Backfill & Data Confidence
The species-chaser promise becomes honest — zero-evidence site count drops below 20 (from 136), and every site card clearly signals whether confirmed sighting records exist.
**FRs covered:** FR34, FR35

### Epic 6: Data Depth — MERMAID & IUCN
Reef health shows a trend, not just a snapshot. Coral cover displays multi-year trajectory via MERMAID. IUCN conservation status badges go live (non-commercial use — no license blocker).
**FRs covered:** FR36, UX-DR6 (IucnBadge activate), NFR2

### Epic 7: Session 2 UX Refinements
The 10 homepage/location/site refinements from the Session 2 UX update land: a cleaner card photo, a much richer categorised wildlife filter that stays put while results scroll, real underwater photos on locations, a clearer location planning block, gear consolidated onto the location page, and a re-sequenced dive-site page that reads as "the dive." Accessibility-review findings ship with the changes. Two open build-time decisions (filter layout, wildlife-tag coverage) are resolved first.
**Requirements covered:** UX-DR-S2-1 … UX-DR-S2-11

---

## Epic 1: Design System & Core Components

Every page delivers a coherent, intentional design language. Shared components are built once and used everywhere — users experience consistency from nav to footer on every route.

### Story 1.1: Design tokens, logo mark, and wordmark

As a developer,
I want the Tailwind config and global CSS to define the Option D logo mark, weight-split wordmark, and all reef state / freshness color tokens,
So that every component shares a single visual source of truth with no hardcoded overrides.

**Acceptance Criteria:**

**Given** the Tailwind config and globals.css are updated
**When** any component references a reef state color
**Then** Thriving resolves to `#10b981`, Under pressure to `#0089de`, Witnessing change to `#f43f5e`

**Given** Noto Sans is loaded
**When** font weight 300 or 900 is referenced
**Then** those weights render correctly (both added to the Google Fonts import)

**Given** the `<Logo>` component renders on a light background
**When** it is visible
**Then** it shows the Option D SVG mark (solid `#0089de` circle r=16, primary white wave stroke-width 2 opacity 1.0, secondary wave rgba(255,255,255,0.4) stroke-width 1.5, viewBox 0 0 36 36) adjacent to the stacked wordmark ("scuba" weight 300 `#94a3b8` tracking 0.08em, "Season.fun" weight 900 `#0f172a` tracking -0.05em, line-height 1.0, no color on .fun)

**Given** the `<Logo dark>` prop is passed
**When** it renders on a dark background
**Then** "scuba" is `rgba(255,255,255,0.3)` and "Season.fun" is `#fff`

**Given** any user-facing string in the codebase
**When** rendered
**Then** it contains no hyphen characters in compound adjectives — em dashes (—) are acceptable

---

### Story 1.2: AtlasNav with live search dropdown

As a visitor,
I want a sticky navigation bar with a live search dropdown,
So that I can reach any location directly from any page.

**Acceptance Criteria:**

**Given** any page renders
**When** the nav is visible
**Then** AtlasNav is sticky, shows `<Logo>`, three nav links (Atlas `/`, Method `/data`, About `/about`), and a search input — active link is brand blue text only, no underline or background pill

**Given** the user types ≥1 character in the search input
**When** results match
**Then** a dropdown renders with max 8 results; each row shows location name, country, and a reef-state pill

**Given** the dropdown is open
**When** the user presses ArrowDown / ArrowUp
**Then** the selection cursor moves through results, wrapping at both ends

**Given** a result is highlighted and the user presses Enter
**When** the navigation fires
**Then** the browser navigates to `/locations/[slug]` and the input clears

**Given** the user presses Escape or clicks outside the search widget
**When** the event fires
**Then** the dropdown closes

**Given** the user presses Enter with no highlighted result
**When** the Enter key fires
**Then** the user is routed to `/search?q=[query]`

**Given** the search input renders
**When** a screen reader announces it
**Then** it reads "Search reefs" via `aria-label`

---

### Story 1.3: AtlasFooter component

As a visitor,
I want a consistent footer with contact info and navigation links,
So that I can reach methodology, about, and contact from any page.

**Acceptance Criteria:**

**Given** any page renders
**When** the user scrolls to the bottom
**Then** AtlasFooter appears with a dark ink (`#0b1e32`) background

**Given** the footer renders
**When** inspected
**Then** three columns: (1) `<Logo dark>` + tagline in Source Serif 4 italic; (2) links to Atlas, Method, About; (3) `hello@scubaseason.fun` mailto + contact note

**Given** the bottom bar renders
**When** visible
**Then** shows `© 2026 scubaSeason.fun` + data attribution line; no newsletter form, no social links, no upsell

---

### Story 1.4: DataFreshnessLabel component

As a visitor,
I want data age labels that distinguish live satellite feeds from years-old field surveys,
So that I can calibrate my trust in any number without hunting for a footnote.

**Acceptance Criteria:**

**Given** `<DataFreshnessLabel variant="live" source="NOAA CRW" date={today} />` renders
**When** visible
**Then** shows green dot (`#10b981`), "Live · NOAA CRW · updated [date]" at 10.5px font-semibold uppercase tracked; entire pill links to `/data`

**Given** `<DataFreshnessLabel variant="snapshot" date="2021-03-01" />` renders
**When** visible
**Then** shows amber dot; appends "(N years ago)" when survey is >2 years old

**Given** `<DataFreshnessLabel variant="presence" source="iNaturalist" />` renders
**When** visible
**Then** shows slate dot and "Presence data · iNaturalist · no population trend"

**Given** any DataFreshnessLabel renders
**When** keyboard-focused
**Then** a visible focus ring appears

---

### Story 1.5: AffiliateLink and AffiliateDisclosure components

As a visitor,
I want affiliate links to be clearly labeled and fire analytics events,
So that I know when I'm clicking a commercial link and the site can track performance.

**Acceptance Criteria:**

**Given** `<AffiliateLink isAffiliate={true}>` wraps a URL
**When** it renders
**Then** the anchor has `rel="nofollow sponsored noopener"`, `target="_blank"`, and a visible commission indicator

**Given** a visitor clicks an affiliate link
**When** the click fires
**Then** Vercel Analytics receives the correct event (`gear_click` / `lodging_click` / `operator_click` / `flight_click`) with `{ site_id, partner, product_id }`

**Given** `<AffiliateLink isAffiliate={false}>`
**When** it renders
**Then** no commission indicator appears and no analytics event fires — renders as a plain external link

**Given** a page section contains affiliate links
**When** it renders
**Then** `<AffiliateDisclosure>` appears at the bottom of that section

---

### Story 1.6: FreshnessDot, LiveBadge, and IucnBadge components

As a visitor,
I want data currency and conservation status communicated with consistent visual indicators,
So that I can scan any panel and instantly understand how current the data is and what a species' status means.

**Acceptance Criteria:**

**Given** `<FreshnessDot days={200} />`
**When** visible
**Then** renders amber dot (`#e8962f`, 5px circle) — Fresh green (`#10b981`) <365 days, Stale amber 365–1095, Cold red (`#e23a3a`) >1095 or null — always paired with a text label

**Given** `<LiveBadge label="Updated tonight" />`
**When** visible
**Then** renders `#10b981` dot with glow `box-shadow: 0 0 0 3px rgba(21,160,92,0.25)`, pill bg `rgba(21,160,92,0.1)`, border `rgba(21,160,92,0.2)`, text `#15804d`, 0.75rem/700

**Given** `<IucnBadge status="VU" />` and `IUCN_ENABLED === true`
**When** visible
**Then** renders flat amber chip "VU" with `#fde8cc` bg and `#9a3412` text

**Given** `IUCN_ENABLED === false`
**When** any `<IucnBadge>` renders
**Then** renders nothing — no layout shift

---

### Story 1.7: SightingRow and FilterSummaryBar components

As a visitor,
I want species sighting records and active filter state in a scannable format,
So that I can assess evidence quality at a glance and remove individual filters without resetting everything.

**Acceptance Criteria:**

**Given** `<SightingRow>` with a <30-day observation
**When** visible
**Then** shows green 8px dot, species common name (0.875rem/600 `#0f172a`), site + meta (0.75rem muted), iNaturalist obs ID as external link, date in `<time dateTime="[ISO]">`

**Given** `<FilterSummaryBar>` with a Thriving reef state filter active
**When** visible
**Then** Thriving pill uses `#10b981` token; other filter pills use brand/10 bg + brand text; each pill has an × dismiss; "Reset all filters" link is right-aligned; live count "Showing N locations" renders

**Given** the × on a filter pill is clicked
**When** the event fires
**Then** only that filter value is removed; all others remain; URL updates via `router.replace`

**Given** chips overflow one line
**When** rendered
**Then** they wrap to a second line in order: reef state → cert → region → month → thermal → wildlife → fresh-only

---

### Story 1.8: StatStrip and EditorialHook components

As a visitor,
I want key facts in a compact horizontal strip and an honest editorial paragraph before data,
So that I orient immediately on any detail page and understand the voice alongside the numbers.

**Acceptance Criteria:**

**Given** `<StatStrip stats={[...6 items]} />`
**When** visible
**Then** each stat shows label (0.5875rem/700/0.12em tracked uppercase muted), value (1rem/700 ink), optional note (0.6875rem muted); hairline right borders between items; `{colors.surface}` background

**Given** `<StatStrip>` on mobile (<768px)
**When** the user swipes
**Then** strip scrolls horizontally, no visible scrollbar, all 6 stats accessible

**Given** any stat value
**When** page loads
**Then** value is static — no count-up animation

**Given** `<EditorialHook text="..." />`
**When** visible
**Then** renders in Source Serif 4, 1.0625rem, line-height 1.8, `#334155`, max-width 640px

---

### Story 1.9: Methodology disclosure and accessibility floor

As a user relying on assistive technology,
I want all data claims to have inline expandable methodology disclosures and all interactive elements to meet WCAG AA,
So that I can understand how every number is calculated and navigate fully by keyboard.

**Acceptance Criteria:**

**Given** `<MethodologyDisclosure>` wraps a data claim
**When** visible
**Then** uses native `<details>/<summary>` only — no JS, no modal; summary shows info circle icon (14px muted) + "How is this calculated?"

**Given** any decorative SVG, dot, or sparkline
**When** rendered
**Then** has `aria-hidden="true"`

**Given** any globe marker
**When** rendered
**Then** has `aria-label="[location name] — [reef state]"`

**Given** any filter checkbox
**When** toggled
**Then** has `aria-pressed` reflecting state

**Given** any date display ("last confirmed", survey date)
**When** rendered
**Then** wrapped in `<time dateTime="[ISO 8601]">`

**Given** any text on any surface
**When** contrast is measured
**Then** meets WCAG AA: 4.5:1 small text, 3:1 large text

---

## Epic 2: Homepage & Atlas Discovery

A first-time visitor understands what the site is within 10 seconds. Susan discovers remarkable reefs by browsing on her phone without touching a filter. Search results, active filter state, and the full mobile experience are complete.

### Story 2.1: Dark ink hero with stat strip and positioning copy

As a first-time visitor,
I want an above-the-fold homepage that immediately communicates what the site is,
So that I understand the evidence-first, species-chaser value proposition within 10 seconds without scrolling.

**Acceptance Criteria:**

**Given** a visitor loads `/`
**When** the page renders above the fold
**Then** they see: dark ink hero (`#0b1e32`) with a full-bleed gradient, "LIVE · NOAA CORAL REEF WATCH" green dot eyebrow, large H1, italic serif subline, and `<StatStrip>` with 6 stats (47 reefs tracked / 5 km satellite resolution / 38 data sources)

**Given** the hero renders
**When** inspected
**Then** a photo credit label appears top-right in small muted uppercase

**Given** 3 people unfamiliar with the site view the homepage for 10 seconds
**When** asked to describe the primary use case
**Then** all 3 can describe it as an evidence-based dive research tool (verified manually)

---

### Story 2.2: Featured destinations inspiration grid

As a casual browser like Susan,
I want to see remarkable dive destinations above the filter explorer,
So that I can discover something worth visiting without interacting with a filter.

**Acceptance Criteria:**

**Given** the visitor scrolls past the hero
**When** the inspiration section is visible
**Then** it shows an asymmetric 2-column grid: one large featured card (≥380px tall) left, two stacked cards right — each with gradient image, location name, region, reef state badge, in-season badge, italic hook line

**Given** any inspiration card is clicked
**When** the click fires
**Then** the user navigates to `/locations/[slug]`

**Given** the "Browse all [N] →" link renders
**When** clicked
**Then** it smooth-scrolls to the Atlas Explorer section

---

### Story 2.3: Atlas Explorer — globe, filter rail, and card grid

As a diver,
I want to explore all atlas locations via a 3D globe and filterable card grid,
So that I can find destinations by reef state, season, skill level, region, or wildlife.

**Acceptance Criteria:**

**Given** the Atlas Explorer section renders
**When** visible
**Then** shows 3D globe (markers colored by reef state token), AtlasFilterRail on left (7 filter groups), `<ReefLocationCard>` grid on right

**Given** a globe marker is clicked
**When** the click fires
**Then** the corresponding card receives `ring-2 ring-[#0089de] ring-offset-2` and scrolls into view

**Given** a filter changes
**When** the change fires
**Then** URL updates via `router.replace`, card grid re-renders, `<FilterSummaryBar>` appears

**Given** filters produce zero results
**When** the grid renders
**Then** no cards; active filter chips with × dismissals; "Reset all filters" link; no illustration

**Given** a URL with filter querystring params is loaded
**When** the page renders
**Then** filter rail, globe, and card grid reflect those params

---

### Story 2.4: ReefLocationCard with freshness and season state

As a visitor browsing the atlas,
I want location cards to show reef state, season status, and data freshness at a glance,
So that I can assess whether a destination is worth clicking into before reading anything else.

**Acceptance Criteria:**

**Given** a `<ReefLocationCard>` renders
**When** visible
**Then** shows: 4:3 hero image, reef state badge + in-season badge top-left, skill badge bottom-right, name, country, 2-line hook, freshness line (thermal green dot always + survey dot by age)

**Given** the card's reef state is "Witnessing change"
**When** hovered
**Then** card does NOT lift or increase shadow

**Given** reef state is "Thriving" or "Under pressure"
**When** hovered
**Then** card lifts 3px and shadow increases

**Given** the in-season badge renders
**When** visible
**Then** uses ●/○ character AND text "In season" / "Off season" — not color alone

---

### Story 2.5: Mobile filter drawer and globe degradation

As Susan on her phone,
I want the filter and browse experience to work on a small screen,
So that I can discover and narrow results without a desktop layout.

**Acceptance Criteria:**

**Given** viewport <768px
**When** Atlas Explorer renders
**Then** globe is replaced by card grid; "Filters" button appears above grid; filter rail is hidden

**Given** the user taps "Filters" on mobile
**When** the tap fires
**Then** a full-height left drawer opens with all 7 filter groups

**Given** the drawer is open
**When** the user taps backdrop or in-drawer "Done" button
**Then** the drawer closes

**Given** active filters are set on mobile
**When** `<FilterSummaryBar>` renders
**Then** it appears below the "Filters" button row — not inside the drawer

---

### Story 2.6: Sites directory with search and active filter state

As a diver,
I want to search and filter all dive sites in a catalogue view,
So that I can find a site by name, species, or location without using the globe.

**Acceptance Criteria:**

**Given** the visitor loads `/sites`
**When** the page renders
**Then** dark ink header with title + search input; sticky filter chip strip below; 3-col (desktop) / 1-col (mobile) site card grid

**Given** the visitor types in search
**When** ≥1 character is entered
**Then** fuse.js filters across site name, location, country, species — no page reload

**Given** the "Thriving" chip is activated
**When** clicked
**Then** chip highlights, others deselect, `<FilterSummaryBar>` appears, grid shows Thriving sites only

**Given** each `<SiteCard>` renders
**When** visible
**Then** shows name, location, gradient image, skill badge, best months, dive types, and either confidence dot + last-confirmed OR "Sighting evidence pending" — never blank

---

### Story 2.7: Search results page

As a visitor,
I want a full search results page at `/search?q=`,
So that I can see all matches across locations, sites, and species.

**Acceptance Criteria:**

**Given** `/search?q=manta` is loaded
**When** the page renders
**Then** results grouped: Locations, then Sites, then Species; each section has a count badge; search input pre-populated

**Given** each result row renders
**When** visible
**Then** shows category pill, primary name with matching term bolded in brand blue, secondary metadata, reef state pill

**Given** no results across all types
**When** no-results state renders
**Then** "No results for 'query'" heading + "Try searching for a location name, species common name, or a country"

**Given** the visitor edits the query and presses Enter
**When** submitted
**Then** results update without full page reload; URL updates to `/search?q=[new query]`

---

## Epic 3: Location Intelligence

A diver researching a region gets a complete picture — editorial context, species across all sites, live sightings, honest degraded-reef framing.

### Story 3.1: Location page stat strip and editorial hook

As a diver arriving on a location page,
I want a quick-facts strip and an honest editorial paragraph before any data,
So that I orient immediately and understand what makes this place worth or not worth the trip.

**Acceptance Criteria:**

**Given** `/locations/[slug]` renders
**When** visible below the hero
**Then** `<StatStrip>` shows: dive site count, reef state (colored by token), coral cover % + year, species tracked, best season, last confirmed sighting with species name

**Given** the editorial hook renders
**When** visible
**Then** `<EditorialHook>` appears above reef science — Source Serif 4 italic, max-width 640px, no marketing superlatives

**Given** a `heroImageUrl` exists
**When** the hero renders
**Then** a photo credit label appears top-right in small muted uppercase

---

### Story 3.2: Species highlights strip across all sites

As a diver researching a region,
I want to see which notable species have been recently confirmed anywhere in this location,
So that I can assess whether the wildlife I want to see is actually here right now.

**Acceptance Criteria:**

**Given** the species strip renders
**When** visible
**Then** shows a 3-col grid of species cards — each with gradient image, common name, scientific name italic, IUCN badge (feature-flagged), freshness dot + "N days ago · [site name]"

**Given** a species card is clicked
**When** the click fires
**Then** navigates to `/{location}/{site}/species/[slug]`

**Given** no sighting data exists for the location
**When** the strip renders
**Then** section is omitted entirely — no empty-state illustration

---

### Story 3.3: Live sightings feed

As a diver planning a trip,
I want a chronological feed of recent iNaturalist observations across all sites at this location,
So that I know what was actually seen recently — not just what's claimed editorially.

**Acceptance Criteria:**

**Given** the sightings feed renders
**When** visible
**Then** shows bordered `<SightingRow>` list sorted newest first, with `<DataFreshnessLabel variant="live">` header showing last sync date

**Given** a sighting is <30 days old / 31–90 days / >90 days
**When** the dot renders
**Then** shows green / amber / slate respectively

**Given** the iNaturalist obs ID renders
**When** clicked
**Then** opens `inaturalist.org/observations/[id]` in a new tab

**Given** no sightings exist
**When** the feed renders
**Then** "No recent sightings recorded. Be the first — submit via iNaturalist." with iNaturalist project link

---

### Story 3.4: Reef health panel with coral cover bars and fishing pressure

As a conservation-curious diver,
I want a reef health panel with coral cover trend and fishing pressure,
So that I can understand what the data actually says about this reef's condition.

**Acceptance Criteria:**

**Given** a location has coral cover records
**When** the reef health panel renders
**Then** two bars: decade-ago with `<DataFreshnessLabel snapshot>` and most recent with year; bars colored by reef state token; trend note renders

**Given** fishing pressure data exists
**When** the panel renders
**Then** shows GFW level badge + `<DataFreshnessLabel>` + artisanal fishing blind spot caveat

**Given** water quality event records exist for the location
**When** the water quality panel renders
**Then** shows severity level, worst months, microplastics level, and a note on diving impact — with `<DataFreshnessLabel snapshot>` and `<MethodologyDisclosure>`

**Given** either data type is absent
**When** the panel renders
**Then** that specific panel is omitted — no empty bar, no placeholder

**Given** reef science panels render
**When** visible
**Then** each has a `<MethodologyDisclosure>` "How is this calculated?" `<details>/<summary>`

---

### Story 3.5: Witnessing change variant — honest degraded-reef framing

As a diver visiting a location in documented decline,
I want the page to tell the honest story first,
So that I make an informed decision about whether to go.

**Acceptance Criteria:**

**Given** a location's reef state is "Witnessing change"
**When** the page renders
**Then** reef science panel appears ABOVE the editorial hook and descriptive copy

**Given** reef state is "Witnessing change"
**When** `PlanYourTripBlock` renders
**Then** primary heading reads "Plan thoughtfully" — operator and lodging links still present

**Given** reef state is "Witnessing change"
**When** the honest label renders
**Then** reads "This reef is experiencing documented loss. Survey data, depth, and species records are current." — inline callout, not a banner

**Given** reef state is "Under pressure"
**When** `PlanYourTripBlock` renders
**Then** full prominence — no muted heading, no suppressed CTAs

**Given** a "Witnessing change" card renders on any grid
**When** hovered
**Then** no lift animation, no shadow increase

---

### Story 3.6: Getting there sidebar and Plan Your Trip

As a diver ready to book,
I want logistics information in the sidebar,
So that I can start planning from the same page without navigating away.

**Acceptance Criteria:**

**Given** a location page renders
**When** the sidebar is visible
**Then** contains: thermal status card (LiveBadge or bleaching alert badge), season calendar (12 cells, current month `ring-2`), "Getting there" card (nearest hub, transfer, live-aboard note), `PlanYourTripBlock` (lodging + operators via `<AffiliateLink>`)

**Given** the season calendar renders
**When** current month cell is visible
**Then** it has `ring-2 ring-brand` — ring is the indicator, not color alone

**Given** the location page renders
**When** the dive sites section is visible
**Then** a card grid of all child `<SiteCard>` items renders, each in-season aware and linking to `/sites/[slug]`

**Given** the location page renders
**When** the gear section is visible
**Then** a general gear section for the location conditions is present (e.g. wetsuit recommendation for water temp), with `<AffiliateLink>` items using `gear_click` events

**Given** the page `<head>` is inspected
**When** rendered
**Then** `<script type="application/ld+json">` block with `@type: "Place"` is present

---

## Epic 4: Site Detail & Species Profiles

A cold SEO arrival on a site page gets a complete dive briefing and can reach a booking decision without ever visiting the atlas.

### Story 4.1: Site detail hero, stat strip, and orientation

As a visitor arriving cold from search,
I want the site detail page to orient me immediately,
So that I understand the site, location, and current status within 3 seconds.

**Acceptance Criteria:**

**Given** a visitor loads `/sites/[slug]`
**When** the page renders
**Then** shows: breadcrumb (Atlas / Location / Site), reef state pill, in-season badge, H1 (site name), italic subtitle (type · location · depth range · certification), photo credit top-right

**Given** the stat strip renders below the hero
**When** visible
**Then** shows: depth range, certification, typical visibility, current strength + note, best season + note, last confirmed sighting in green

**Given** Lighthouse runs on 4G
**When** performance is measured
**Then** LCP < 2.0s (hero uses `<Image priority>`, page is statically generated)

---

### Story 4.2: Species section with sighting evidence

As a species-chaser like Rafa,
I want to see confirmed sighting records with specific dates and counts,
So that I can assess evidence quality before deciding to book.

**Acceptance Criteria:**

**Given** a site has sighting evidence
**When** the species section renders
**Then** each species card shows: gradient image, common name, scientific name italic, IUCN badge (feature-flagged), reliability label, best months chips, confidence dot + record count + radius + "Last confirmed [date]" in `<time dateTime>`

**Given** a confidence dot renders
**When** visible
**Then** always paired with a text label — never dot alone

**Given** the section header renders
**When** visible
**Then** `<DataFreshnessLabel>` appears top-right showing survey method and date

**Given** a site has NO sighting evidence
**When** the species section renders
**Then** "Sighting evidence pending" — no species grid, no broken state

**Given** the site has a parent location with reef state data
**When** the reef science stamp renders on the site detail page
**Then** an inline banner shows coral cover %, fishing pressure level, DHW thermal stress — each linking to the parent `/locations/[slug]` page; banner only renders when `coralCover` or `fishingPressure` data exists

---

### Story 4.3: 12-month conditions grid and gear section

As a diver checking timing,
I want a month-by-month conditions grid and site-specific gear recommendations,
So that I can confirm whether my travel window is viable and what I need to pack.

**Acceptance Criteria:**

**Given** the conditions section renders
**When** visible
**Then** 12-cell season calendar with current month `ring-2` (not color alone); best months cells in a distinct tint

**Given** the conditions table renders
**When** visible
**Then** shows month × (water temp / visibility / current); current month column highlighted; current strength color-coded (none / mild / moderate / strong)

**Given** the gear section renders
**When** visible
**Then** Layer A shows cert-level base kit adapted to site cert floor and water temp; Layer B shows site-specific add-ons with one-sentence reason each

**Given** a Layer A gear item has an affiliate link
**When** rendered
**Then** uses `<AffiliateLink>` with `gear_click` event type

---

### Story 4.4: Plan Your Trip sticky sidebar and wreck data

As a diver ready to book,
I want a persistent planning panel and any relevant wreck information,
So that I can get to booking without losing my place in the site briefing.

**Acceptance Criteria:**

**Given** the site detail page on desktop
**When** the user scrolls
**Then** `PlanYourTripBlock` stays sticky in the right column — Getting There, Where to Stay, Who to Dive With

**Given** the page on mobile
**When** scrolled
**Then** a sticky bottom "Plan this trip" button appears; tapping opens a drawer with the same content

**Given** the site has wreck records
**When** the wreck section renders
**Then** shows vessel name, type, sunk date, depth range, history paragraph

**Given** the page `<head>` is inspected
**When** rendered
**Then** `<script type="application/ld+json">` with `@type: "TouristAttraction"` is present

---

### Story 4.5: How-to-dive numbered sequence

As a diver planning their first visit to this site,
I want a numbered sequence explaining how to dive it well,
So that I know when to arrive, where to position, and what to do to maximize my chances.

**Acceptance Criteria:**

**Given** the "How to dive this site" section renders
**When** visible
**Then** shows 4 steps (01–04): large muted display figure (text-7xl, {colors.muted}/30, `select-none`), bold title, Source Serif 4 italic description

**Given** the section on desktop
**When** visible
**Then** steps 01–02 left, 03–04 right (2-col grid)

**Given** the section on mobile
**When** visible
**Then** all 4 steps in single column

**Given** step descriptions contain compound adjectives
**When** rendered
**Then** no hyphen characters — em dashes used

---

### Story 4.6: Species detail sub-page

As a visitor wanting to know more about a specific species at this site,
I want a dedicated species profile page,
So that I can see the full sighting evidence, seasonality, and conservation context.

**Acceptance Criteria:**

**Given** a visitor navigates to `/{location}/{site}/species/[slug]`
**When** the page renders
**Then** shows: hero image with credit, breadcrumb (Atlas / Location / Site / Species), IUCN badge in hero (feature-flagged), H1 (common name), italic scientific name, description paragraph

**Given** the sighting evidence section renders
**When** visible
**Then** shows `<SightingRow>` items sorted by recency; `<DataFreshnessLabel>` shows sync date; `<MethodologyDisclosure>` for confidence calculation

**Given** the 12-month seasonality calendar renders
**When** visible
**Then** months with observation records highlighted; current month `ring-2`

**Given** "Also seen nearby" renders
**When** visible
**Then** shows up to 3 other sites at the same location where the species has records

**Given** "See all [species] sites" link renders
**When** clicked
**Then** navigates to `/where-to-see/[species]`

---

### Story 4.7: Cert-level landing pages

As a beginner like Priya landing on `/for/open-water`,
I want a page that frames my experience level back to me and shows only appropriate sites,
So that I don't waste time on sites beyond my certification.

**Acceptance Criteria:**

**Given** `/for/open-water` renders
**When** the page loads
**Then** shows cert-level heading, cert-specific copy (depth limits, realistic expectations), DAN safety link, and a `<SiteCard>` grid filtered to sites where `skillLevel <= open-water`

**Given** all 6 cert pages exist
**When** navigating to each
**Then** `/for/never-dived`, `/for/advanced`, `/for/rescue`, `/for/divemaster`, `/for/tech` each render with cert-appropriate copy and correctly filtered grid

**Given** cert filter logic runs
**When** `/for/advanced` is loaded
**Then** cumulative logic applies: shows Advanced + OW + Beginner-accessible sites

**Given** Layer A gear renders on a cert page
**When** visible
**Then** items match the cert level and water temperature

---

### Story 4.8: Species encounter pages — extend the 11 curated encounters

As a diver searching for a specific animal encounter,
I want a dedicated page for each curated species encounter showing where and when to find it,
So that I can plan a trip around a specific species with ranked site recommendations and honest evidence.

**Acceptance Criteria:**

**Given** a visitor navigates to `/where-to-see/[species]` (e.g. `/where-to-see/whale-sharks`)
**When** the page renders
**Then** shows: hero image, encounter name (H1), IUCN badge (feature-flagged), ethics note (if applicable), best months strip

**Given** the top sites section renders
**When** visible
**Then** shows the top 6 sites ranked by editorial score; each as a `<SiteCard>` with confidence dot foregrounded

**Given** the all-regions section renders
**When** visible
**Then** all atlas locations where the species has a record are grouped by region into Primary / Secondary / Emerging / Closed categories, each with a reef state pill

**Given** all 11 curated encounter pages exist
**When** navigating to any `/where-to-see/[slug]`
**Then** the page renders with correct species data, site rankings, and ethics notes

**Given** the page `<head>` is inspected
**When** rendered
**Then** a `<script type="application/ld+json">` block with appropriate species schema is present

---

### Story 4.9: Data transparency and FAQ pages

As a data-literate visitor or grant reviewer,
I want the `/data` and `/faq` pages to clearly explain what is live, what is a snapshot, and how every metric is calculated,
So that I can trust the numbers on every other page and understand exactly where they come from.

**Acceptance Criteria:**

**Given** a visitor loads `/data`
**When** the page renders
**Then** it documents: (1) what is live — NOAA nightly thermal data; (2) what is a snapshot — coral cover surveys, fishing pressure, IUCN; (3) what cannot be seen — site-level ocean acidification, artisanal fishing, fish biomass trends; (4) a sources table with name, type, update cadence, coverage for all 38+ sources

**Given** a visitor loads `/faq`
**When** the page renders
**Then** it documents how each metric is calculated: coral cover methodology, DHW formula, reef state thresholds (Thriving / Under pressure / Witnessing change), sighting evidence 24-month rolling window

**Given** any `<DataFreshnessLabel>` pill on any page
**When** clicked
**Then** it navigates to `/data` — the pill is the entry point to the full transparency reference

**Given** both pages render
**When** inspected
**Then** they use the new AtlasNav, AtlasFooter, and design system components from Epic 1

---

## Epic 5: Evidence Backfill & Data Confidence

### Story 5.1: Evidence backfill — close the zero-evidence gap

As a species chaser,
I want every site on the atlas to have at least one confirmed sighting record,
So that the species-chaser promise is honest across the full catalogue.

**Acceptance Criteria:**

**Given** the backfill process runs
**When** complete
**Then** the count of sites with zero sighting evidence records is < 20 (from current 136)

**Given** the backfill prioritizes sites
**When** processing
**Then** sites are processed in `editorialRank` descending order

**Given** a sighting record is added to a site
**When** the build runs
**Then** the site's species section renders the new record with correct confidence dot, date, and iNaturalist obs ID

**Given** any backfilled sighting record in `sightings.json`
**When** inspected
**Then** it includes: `siteId`, `species` (common + scientific), `observedAt` (ISO date), `source`, `obsId`, `confidence` (confirmed / likely / presence)

---

### Story 5.2: Evidence confidence badge on site cards and detail hero

As a species chaser browsing the atlas,
I want site cards to signal whether confirmed sightings exist,
So that I can distinguish well-evidenced sites from data-sparse ones during the backfill period.

**Acceptance Criteria:**

**Given** a site card renders and the site has ≥1 sighting record
**When** visible
**Then** sighting row shows filled confidence dot + species name + "Last confirmed [relative time]"

**Given** a site card renders and the site has 0 sighting records
**When** visible
**Then** sighting row shows muted outlined dot + "Sighting evidence pending" — never blank

**Given** a site detail hero with ≥1 sighting record
**When** visible
**Then** "Confirmed sightings on record" badge in hero meta strip

**Given** a site detail hero with 0 sighting records
**When** visible
**Then** "No sighting records yet" badge in hero meta strip — honestly labeled, not hidden

---

## Epic 6: Data Depth — MERMAID & IUCN

### Story 6.1: MERMAID multi-year coral cover integration

As a conservation researcher like Mia,
I want to see a multi-year coral cover trend on location pages,
So that I can understand whether a reef is recovering, stable, or in long-term decline.

**Acceptance Criteria:**

**Given** the MERMAID API integration runs at build time
**When** records are fetched
**Then** records are written to location reef health data with `source: "MERMAID"`, `surveyDate`, `coverPercent`, `method` fields

**Given** a location has ≥3 MERMAID data points
**When** the reef health panel renders
**Then** a time-series trend display renders instead of the two-bar comparison

**Given** a location has <3 data points
**When** the panel renders
**Then** falls back to two-bar before/after comparison — no broken state

**Given** at least 5 locations have been populated with MERMAID data
**When** the build completes
**Then** those 5 location pages show the multi-year trend

**Given** any MERMAID data point's `<DataFreshnessLabel>` renders
**When** visible
**Then** shows "Snapshot · MERMAID · surveyed [date]" with correct freshness dot

---

### Story 6.2: IUCN badge activation

As a conservation-curious visitor,
I want to see IUCN Red List conservation status on species throughout the site,
So that I understand the conservation context of what I'm about to dive with.

**Acceptance Criteria:**

**Given** `IUCN_ENABLED` is set to `true`
**When** any `<IucnBadge>` renders
**Then** shows correct abbreviation with color: LC green, NT amber-light, VU amber, EN orange, CR red

**Given** `IUCN_ENABLED === true` and a species has IUCN data
**When** species card renders on any page
**Then** badge is visible and correctly colored

**Given** `IUCN_ENABLED === true` and a species has no IUCN record
**When** the species card renders
**Then** no badge renders — no broken state, no "Unknown" placeholder

**Given** IUCN data is >7 days old
**When** the automated weekly workflow runs
**Then** `iucn.json` is updated and the build is triggered Design System & Core Components

Every page delivers a coherent, intentional design language. Shared components are built once and used everywhere — users experience consistency from nav to footer on every route.

### Story 1.1: Design tokens, logo mark, and wordmark

As a developer,
I want the Tailwind config and global CSS to define the Option D logo mark, weight-split wordmark, and all reef state / freshness color tokens,
So that every component shares a single visual source of truth with no hardcoded overrides.

**Acceptance Criteria:**

**Given** the Tailwind config and globals.css are updated
**When** any component references a reef state color
**Then** Thriving resolves to `#10b981`, Under pressure to `#0089de`, Witnessing change to `#f43f5e`

**Given** Noto Sans is loaded
**When** font weight 300 or 900 is referenced
**Then** those weights render correctly (both added to the Google Fonts import)

**Given** the `<Logo>` component renders on a light background
**When** it is visible
**Then** it shows the Option D SVG mark (solid `#0089de` circle r=16, primary white wave stroke-width 2 opacity 1.0, secondary wave rgba(255,255,255,0.4) stroke-width 1.5, viewBox 0 0 36 36) adjacent to the stacked wordmark ("scuba" weight 300 `#94a3b8` tracking 0.08em, "Season.fun" weight 900 `#0f172a` tracking -0.05em, line-height 1.0, no color on .fun)

**Given** the `<Logo dark>` prop is passed
**When** it renders on a dark background
**Then** "scuba" is `rgba(255,255,255,0.3)` and "Season.fun" is `#fff`

**Given** any user-facing string in the codebase
**When** rendered
**Then** it contains no hyphen characters in compound adjectives — em dashes (—) are acceptable

---

### Story 1.2: AtlasNav with live search dropdown

As a visitor,
I want a sticky navigation bar with a live search dropdown,
So that I can reach any location directly from any page.

**Acceptance Criteria:**

**Given** any page renders
**When** the nav is visible
**Then** AtlasNav is sticky, shows `<Logo>`, three nav links (Atlas `/`, Method `/data`, About `/about`), and a search input — active link is brand blue text only, no underline or background pill

**Given** the user types ≥1 character in the search input
**When** results match
**Then** a dropdown renders with max 8 results; each row shows location name, country, and a reef-state pill

**Given** the dropdown is open
**When** the user presses ArrowDown / ArrowUp
**Then** the selection cursor moves through results, wrapping at both ends

**Given** a result is highlighted and the user presses Enter
**When** the navigation fires
**Then** the browser navigates to `/locations/[slug]` and the input clears

**Given** the user presses Escape or clicks outside the search widget
**When** the event fires
**Then** the dropdown closes

**Given** the user presses Enter with no highlighted result
**When** the Enter key fires
**Then** the user is routed to `/search?q=[query]`

**Given** the search input renders
**When** a screen reader announces it
**Then** it reads "Search reefs" via `aria-label`

---

### Story 1.3: AtlasFooter component

As a visitor,
I want a consistent footer with contact info and navigation links,
So that I can reach methodology, about, and contact from any page.

**Acceptance Criteria:**

**Given** any page renders
**When** the user scrolls to the bottom
**Then** AtlasFooter appears with a dark ink (`#0b1e32`) background

**Given** the footer renders
**When** inspected
**Then** three columns: (1) `<Logo dark>` + tagline in Source Serif 4 italic; (2) links to Atlas, Method, About; (3) `hello@scubaseason.fun` mailto + contact note

**Given** the bottom bar renders
**When** visible
**Then** shows `© 2026 scubaSeason.fun` + data attribution line; no newsletter form, no social links, no upsell

---

### Story 1.4: DataFreshnessLabel component

As a visitor,
I want data age labels that distinguish live satellite feeds from years-old field surveys,
So that I can calibrate my trust in any number without hunting for a footnote.

**Acceptance Criteria:**

**Given** `<DataFreshnessLabel variant="live" source="NOAA CRW" date={today} />` renders
**When** visible
**Then** shows green dot (`#10b981`), "Live · NOAA CRW · updated [date]" at 10.5px font-semibold uppercase tracked; entire pill links to `/data`

**Given** `<DataFreshnessLabel variant="snapshot" date="2021-03-01" />` renders
**When** visible
**Then** shows amber dot; appends "(N years ago)" when survey is >2 years old

**Given** `<DataFreshnessLabel variant="presence" source="iNaturalist" />` renders
**When** visible
**Then** shows slate dot and "Presence data · iNaturalist · no population trend"

**Given** any DataFreshnessLabel renders
**When** keyboard-focused
**Then** a visible focus ring appears

---

### Story 1.5: AffiliateLink and AffiliateDisclosure components

As a visitor,
I want affiliate links to be clearly labeled and fire analytics events,
So that I know when I'm clicking a commercial link and the site can track performance.

**Acceptance Criteria:**

**Given** `<AffiliateLink isAffiliate={true}>` wraps a URL
**When** it renders
**Then** the anchor has `rel="nofollow sponsored noopener"`, `target="_blank"`, and a visible commission indicator

**Given** a visitor clicks an affiliate link
**When** the click fires
**Then** Vercel Analytics receives the correct event (`gear_click` / `lodging_click` / `operator_click` / `flight_click`) with `{ site_id, partner, product_id }`

**Given** `<AffiliateLink isAffiliate={false}>`
**When** it renders
**Then** no commission indicator appears and no analytics event fires — renders as a plain external link

**Given** a page section contains affiliate links
**When** it renders
**Then** `<AffiliateDisclosure>` appears at the bottom of that section

---

### Story 1.6: FreshnessDot, LiveBadge, and IucnBadge components

As a visitor,
I want data currency and conservation status communicated with consistent visual indicators,
So that I can scan any panel and instantly understand how current the data is and what a species' status means.

**Acceptance Criteria:**

**Given** `<FreshnessDot days={200} />`
**When** visible
**Then** renders amber dot (`#e8962f`, 5px circle) — Fresh green (`#10b981`) <365 days, Stale amber 365–1095, Cold red (`#e23a3a`) >1095 or null — always paired with a text label

**Given** `<LiveBadge label="Updated tonight" />`
**When** visible
**Then** renders `#10b981` dot with glow `box-shadow: 0 0 0 3px rgba(21,160,92,0.25)`, pill bg `rgba(21,160,92,0.1)`, border `rgba(21,160,92,0.2)`, text `#15804d`, 0.75rem/700

**Given** `<IucnBadge status="VU" />` and `IUCN_ENABLED === true`
**When** visible
**Then** renders flat amber chip "VU" with `#fde8cc` bg and `#9a3412` text

**Given** `IUCN_ENABLED === false`
**When** any `<IucnBadge>` renders
**Then** renders nothing — no layout shift

---

### Story 1.7: SightingRow and FilterSummaryBar components

As a visitor,
I want species sighting records and active filter state in a scannable format,
So that I can assess evidence quality at a glance and remove individual filters without resetting everything.

**Acceptance Criteria:**

**Given** `<SightingRow>` with a <30-day observation
**When** visible
**Then** shows green 8px dot, species common name (0.875rem/600 `#0f172a`), site + meta (0.75rem muted), iNaturalist obs ID as external link, date in `<time dateTime="[ISO]">`

**Given** `<FilterSummaryBar>` with a Thriving reef state filter active
**When** visible
**Then** Thriving pill uses `#10b981` token; other filter pills use brand/10 bg + brand text; each pill has an × dismiss; "Reset all filters" link is right-aligned; live count "Showing N locations" renders

**Given** the × on a filter pill is clicked
**When** the event fires
**Then** only that filter value is removed; all others remain; URL updates via `router.replace`

**Given** chips overflow one line
**When** rendered
**Then** they wrap to a second line in order: reef state → cert → region → month → thermal → wildlife → fresh-only

---

### Story 1.8: StatStrip and EditorialHook components

As a visitor,
I want key facts in a compact horizontal strip and an honest editorial paragraph before data,
So that I orient immediately on any detail page and understand the voice alongside the numbers.

**Acceptance Criteria:**

**Given** `<StatStrip stats={[...6 items]} />`
**When** visible
**Then** each stat shows label (0.5875rem/700/0.12em tracked uppercase muted), value (1rem/700 ink), optional note (0.6875rem muted); hairline right borders between items; `{colors.surface}` background

**Given** `<StatStrip>` on mobile (<768px)
**When** the user swipes
**Then** strip scrolls horizontally, no visible scrollbar, all 6 stats accessible

**Given** any stat value
**When** page loads
**Then** value is static — no count-up animation

**Given** `<EditorialHook text="..." />`
**When** visible
**Then** renders in Source Serif 4, 1.0625rem, line-height 1.8, `#334155`, max-width 640px

---

### Story 1.9: Methodology disclosure and accessibility floor

As a user relying on assistive technology,
I want all data claims to have inline expandable methodology disclosures and all interactive elements to meet WCAG AA,
So that I can understand how every number is calculated and navigate fully by keyboard.

**Acceptance Criteria:**

**Given** `<MethodologyDisclosure>` wraps a data claim
**When** visible
**Then** uses native `<details>/<summary>` only — no JS, no modal; summary shows info circle icon (14px muted) + "How is this calculated?"

**Given** any decorative SVG, dot, or sparkline
**When** rendered
**Then** has `aria-hidden="true"`

**Given** any globe marker
**When** rendered
**Then** has `aria-label="[location name] — [reef state]"`

**Given** any filter checkbox
**When** toggled
**Then** has `aria-pressed` reflecting state

**Given** any date display ("last confirmed", survey date)
**When** rendered
**Then** wrapped in `<time dateTime="[ISO 8601]">`

**Given** any text on any surface
**When** contrast is measured
**Then** meets WCAG AA: 4.5:1 small text, 3:1 large text

---

## Epic 7: Session 2 UX Refinements

The 10 homepage/location/site refinements from the Session 2 UX update (decision log D06–D18, accessibility review). Modifies surfaces from Epics 2–4; stands alone. Stories are ordered so the two open build-time decisions (7.1, 7.2) resolve before the filter work they gate, and gear leaves the site page (7.9) before the site re-sequence (7.10). Source of truth: DESIGN.md + EXPERIENCE.md (final 2026-06-04).

### Story 7.1: Decide and record the filter layout (A vs B)

As the product owner,
I want one filter layout chosen and recorded,
So that the filter stories build against a single target without rework.

**Acceptance Criteria:**

**Given** the two approved layouts (A horizontal bar, B left rail) in EXPERIENCE.md §4.2 and mockups `filter-layout-A-horizontal-bar.html` / `filter-layout-B-left-rail.html`
**When** a layout is chosen
**Then** the decision is recorded in the UX decision log and EXPERIENCE.md §4.2 marks the chosen layout as selected, retaining the other as the rejected alternative

**Given** the current implementation is already a left rail
**When** the choice is weighed
**Then** the decision notes migration cost explicitly (B ≈ minimal churn, A = restructure plus globe relayout)

**Given** this decision is open
**When** filter stories 7.3–7.5 are scheduled
**Then** none of them start until 7.1 is closed

> Decision/doc story — no production code beyond the spine/log update.

---

### Story 7.2: Wildlife-tag data-coverage pass

As a developer,
I want every proposed wildlife tag verified against live data,
So that no filter option ever returns zero locations.

**Acceptance Criteria:**

**Given** the proposed taxonomy (Sharks & rays / Marine mammals / Reptiles & pelagics / Macro & critters and their tags, EXPERIENCE.md §4.2)
**When** the `animalTags` derivation in `atlas-location.ts` is extended and run
**Then** each candidate tag maps to ≥1 location via species actually present at that location's sites

**Given** a candidate tag resolves to 0 locations
**When** the list is finalized
**Then** that tag is dropped from the shipped taxonomy and the drop is logged

**Given** the pass is complete
**When** handing off to Story 7.3
**Then** the finalized tag list and per-tag location counts are recorded

**Given** the change
**When** building
**Then** it remains build-time only (data shape unchanged beyond the expanded `animalTags`)

---

### Story 7.3: Categorised wildlife filter taxonomy

As a diver,
I want to filter locations by a rich set of categorised wildlife encounters,
So that I can find where to see specific animals.

**Acceptance Criteria:**

**Given** the finalized tag list (7.2) and chosen layout (7.1)
**When** the wildlife facet renders
**Then** tags appear under named sub-groups (Sharks & rays / Marine mammals / Reptiles & pelagics / Macro & critters), replacing the 6 flat tags

**Given** the user selects tags across multiple sub-groups
**When** results compute
**Then** matching is OR logic on the derived `animalTags`

**Given** a sub-group has active selections
**When** it renders
**Then** its header shows an active-count badge

**Given** a wildlife filter changes
**When** state updates
**Then** the `a` querystring param updates via `router.replace`, default omitted, and the view is shareable

**Given** mobile
**When** the filter drawer opens
**Then** the taxonomy renders as collapsible sub-groups

---

### Story 7.4: Sticky filter, scrolling results

As a diver,
I want the filter to stay in place while I scroll results,
So that I can refine without losing the controls.

**Acceptance Criteria:**

**Given** Layout A
**When** the user scrolls
**Then** the filter bar pins to the top of the viewport and only the results grid scrolls beneath it

**Given** Layout B
**When** the user scrolls
**Then** the rail is `position: sticky` with its own overflow (`max-height: calc(100vh - …)`) and the results grid scrolls beside it

**Given** long result content
**When** scrolling
**Then** the filter surface never scrolls away with the cards (corrects the prior behavior where the card-grid scroll moved the filter)

---

### Story 7.5: Filter-control accessibility

As a keyboard or screen-reader user,
I want fully operable, announced filter controls,
So that I can filter without a mouse.

**Acceptance Criteria:**

**Given** any filter option
**When** focused
**Then** it is a real control (native `<input type="checkbox">` or `<button aria-pressed>`), reachable by Tab and togglable by Space/Enter

**Given** a Layout A dropdown trigger
**When** rendered
**Then** it has `aria-expanded` + `aria-controls` + `aria-haspopup`; Escape closes and returns focus to the trigger; opening moves focus into the panel

**Given** Layout B facet and wildlife sub-groups
**When** rendered
**Then** they use native `<details>/<summary>`

**Given** the mobile filter drawer is open
**When** navigating by keyboard
**Then** focus is trapped within it, `aria-modal="true"` + a label are set, the background is `inert`; Done/backdrop close returns focus to the "Filters" trigger

**Given** an active-count badge
**When** announced
**Then** it carries visually-hidden text (e.g. "2 active filters"), never a bare digit

**Given** a filter toggles
**When** results change
**Then** the "Showing N locations" count sits in an `aria-live="polite"` / `role="status"` region

**Given** any active chip/tag/button tinted text
**When** rendered
**Then** it uses `#1d5d90` (not `#0089de`) for AA on the brand tint, and each chip `×` has an accessible label

---

### Story 7.6: Location card — single-signal photo + body meta row

As a casual browser,
I want a clean card photo with status in the body,
So that the image isn't cluttered.

**Acceptance Criteria:**

**Given** a ReefLocationCard
**When** rendered
**Then** only the reef-state badge overlays the photo (top-left); no skill badge and no in-season badge on the photo

**Given** the card body
**When** rendered
**Then** a meta row beneath the title/country shows the skill/cert chip and, when `inSeason`, an in-season chip

**Given** the in-season chip
**When** rendered
**Then** it uses a `●`/text mark plus label (not color alone)

**Given** a Witnessing change card
**When** rendered
**Then** the quietness rules (no hover lift, no cheerful animation) are unchanged

---

### Story 7.7: Real underwater photos on location hero + inspiration grid

As a diver,
I want real underwater photos that match each place,
So that the product feels authentic, not decorative.

**Acceptance Criteria:**

**Given** a location detail hero
**When** rendered
**Then** it shows the borrowed underwater site photo (`atlas-location.ts` via `isUnderwaterQualityPhoto`), not a bare gradient; the gradient is at most a base/letterbox layer under the photo

**Given** the homepage inspiration grid cards ("Worth going for")
**When** rendered
**Then** each shows the borrowed underwater photo, not a CSS gradient

**Given** no underwater-passing site photo exists
**When** falling back
**Then** the order is location `heroImageUrl` → first underwater-passing site photo → any site photo → `underwaterPhotoUrl()` placeholder

**Given** any hero/inspiration `<img>`
**When** rendered
**Then** its `alt` is informative and names the location (never `alt=""`)

**Given** hero content sits over the photo
**When** rendered
**Then** it stays within the dark overlay band (local scrim if needed) so white text holds 4.5:1

---

### Story 7.8: Location "Plan your trip" rebuild

As a trip planner,
I want clear getting-there plus equal accommodation and operators,
So that I know how to get there and what to book.

**Acceptance Criteria:**

**Given** the Plan your trip block (location page only)
**When** rendered
**Then** Getting there leads — structured `getThereStructured` when present (nearest hub → transfer → optional liveaboard note), else the `getThere` text

**Given** the booking section
**When** rendered
**Then** "Where to stay" and "Operators" appear as two adjacent labeled equal-weight peer groups, same row treatment, neither using the old dark `#0b1e32` dominant panel

**Given** a liveaboard lodging that covers diving
**When** rendered
**Then** it shows as a combined "stay + dive" row under Where to stay and suppresses a redundant separate operator

**Given** an operator backed only by a template/generic-search URL
**When** rendering operators
**Then** it is not shown, and the hardcoded generic-PADI "See trip options" button is removed

**Given** no real/affiliate operator and no dive-capable lodging
**When** rendered
**Then** only Getting there + accommodation show; no invented operators and no generic-search button

**Given** commercial links in the block
**When** rendered
**Then** disclosure is a single section-level line (no per-row affiliate badge), and each `AffiliateLink` accessible name includes "(opens in new tab)" + the destination; the decorative `→` is `aria-hidden`

**Given** a Witnessing change location
**When** rendered
**Then** the muted "Plan thoughtfully" treatment applies, links retained, text held ≥4.5:1

**Given** a dive-site page
**When** rendered
**Then** this block does NOT appear there

---

### Story 7.9: Gear section on the location page (removed from site)

As a diver,
I want gear consolidated on the location page,
So that I see basic kit plus what specific sites demand in one place.

**Acceptance Criteria:**

**Given** a location page
**When** rendered
**Then** a Gear section shows Layer A basic kit for the location (region water temp + skill) as a `<ul>`

**Given** site-specific add-ons exist
**When** Layer B renders
**Then** it aggregates `siteSpecificGear` across the location's sites, grouped by site name, each group linking down to its site (e.g. "Blue Corner — reef hook for strong current")

**Given** a site with no `siteSpecificGear`
**When** Layer B renders
**Then** that site does not appear and no empty heading shows

**Given** gear shop links
**When** rendered
**Then** they are quiet "Shop →" links (`AffiliateLink`, Amazon), with no per-item affiliate badge and one section-level disclosure line

**Given** a dive-site page
**When** rendered
**Then** it has NO gear section; the sidebar "Part of [location]" card links up to the location where gear lives

**Given** each gear item
**When** rendered
**Then** the leading emoji/icon is `aria-hidden` and the text name + reason carry the meaning (Layer A as `<li>`)

**Given** Layer A's wetsuit recommendation
**When** water-temperature data is wrong or absent
**Then** the recommendation is correct or omitted — never a misleading thickness

---

### Story 7.10: Dive-site re-sequence (About first, sidebar orient-only)

As a cold SEO arrival,
I want the dive-site page to read as the dive,
So that I'm oriented before I hit the data.

**Acceptance Criteria:**

**Given** the dive-site centre column
**When** rendered
**Then** the order is About this site (first) → What you'll see → Conditions → How to dive

**Given** the Conditions section
**When** rendered
**Then** it includes the NOAA thermal/live panel (DHW + SST anomaly + status with the live `DataFreshnessLabel`), relocated from the sidebar

**Given** the right sidebar
**When** rendered
**Then** it contains only Depth profile → Part of [location] (orient only); no operators/booking, no standalone thermal panel, and no duplicate bottom "Planning a trip?" block

**Given** depth / skill / season meta
**When** rendered
**Then** it appears once in the meta badges row, not duplicated in the sidebar

**Given** gear placement
**When** this story is built
**Then** Story 7.9 has already moved gear to the location page (this story removes it from the site flow)

---

## Epic 7 — coverage check

| UX-DR | Story | Covered |
|---|---|---|
| S2-1 | 7.6 | ✅ |
| S2-2 | 7.3 | ✅ |
| S2-3 | 7.2 | ✅ |
| S2-4 | 7.1 | ✅ |
| S2-5 | 7.4 | ✅ |
| S2-6 | 7.7 | ✅ |
| S2-7 | 7.8 | ✅ |
| S2-8 | 7.9 | ✅ |
| S2-9 | 7.10 | ✅ |
| S2-10 | 7.5 | ✅ |
| S2-11 | 7.5 (filter), 7.7 (alt), 7.8 (links) | ✅ |

All 11 Session 2 UX-DRs covered by at least one story.
