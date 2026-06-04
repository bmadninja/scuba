# Overnight Implementation Summary — design-lift branch

**Date:** 2026-06-04  
**Branch:** `design-lift`  
**Build status:** ✅ Passing (2357 static pages)  
**Preview URL:** https://scuba-454s6t66n-josietyleungs-projects.vercel.app (building/ready)

---

## What was implemented

### Epic 1 — Design system & core components (Stories 1.1–1.9)

**Story 1.1 — Design tokens, logo mark, wordmark**
- `src/app/layout.tsx`: Noto Sans weights expanded to include 300 and 900
- `src/app/globals.css`: Reef state CSS tokens updated to canonical values — Thriving `#10b981`, Under pressure `#0089de`, Witnessing change `#f43f5e`
- `src/components/logo.tsx` (NEW): Option D SVG mark (solid `#0089de` circle r=16, two white wave paths) + weight-split wordmark ("scuba" weight-300 `#94a3b8`, "Season.fun" weight-900 `#0f172a`, stacked line-height 1.0). Dark variant supported via `dark` prop.

**Story 1.2 — AtlasNav with live search**
- Logo swapped to `<Logo>` component
- Enter with no selection now routes to `/search?q=[query]` (was previously ignored)
- Active nav link: brand blue text only — no background pill
- `aria-label` on nav element

**Story 1.3 — AtlasFooter**
- Rebuilt as dark ink (`#0b1e32`) 3-column layout
- Column 1: `<Logo dark>` + italic Source Serif 4 tagline
- Column 2: site links (Atlas, Dive sites, Method, About, FAQ)
- Column 3: `hello@scubaseason.fun` + contact copy
- Bottom bar: copyright + data attribution, hairline `rgba(255,255,255,0.08)` divider

**Story 1.4 — DataFreshnessLabel**
- Existing component already met spec. No changes needed.

**Story 1.5 — AffiliateLink / AffiliateDisclosure**
- `src/components/affiliate-link.tsx`: Existing component already correct. Verified `rel="nofollow sponsored noopener"` and Vercel Analytics event firing. No changes needed.

**Story 1.6 — FreshnessDot, LiveBadge, IucnBadge**
- `src/components/freshness-dot.tsx` (NEW): 5px dot, Fresh `#10b981` (<365 days), Stale `#e8962f` (365–1095), Cold `#e23a3a` (>1095/null), always paired with text label
- `src/components/live-badge.tsx` (NEW): Green dot with glow `box-shadow: 0 0 0 3px rgba(21,160,92,0.25)`, pill bg/border/text per spec
- `src/components/iucn-badge.tsx`: Existing component already complete. Feature-flagged via `IUCN_ENABLED`. No changes needed.

**Story 1.7 — SightingRow, FilterSummaryBar**
- `src/components/sighting-row.tsx` (NEW): Flex row with 8px colored dot (green ≤30d, amber 31–90d, slate >90d), species name, scientific name italic, site, iNaturalist obs ID as external link, `<time dateTime>` date
- `src/components/filter-summary-bar.tsx` (NEW): Reef state pills use state color tokens, brand/10 bg for other pills, × per pill dismiss, "Reset all filters" right-aligned, live count display

**Story 1.8 — StatStrip, EditorialHook**
- `src/components/stat-strip.tsx` (NEW): Compact horizontal strip, label 0.5875rem/700 uppercase tracked, value 1rem/700 ink, note 0.6875rem muted, hairline dividers, horizontal scroll on mobile, no count-up animation
- `src/components/editorial-hook.tsx` (NEW): Source Serif 4 italic, 1.0625rem, line-height 1.8, `#334155`, max-width 640px

**Story 1.9 — MethodologyDisclosure, accessibility floor**
- `src/components/methodology-disclosure.tsx` (NEW): Native `<details>/<summary>` only, info circle SVG icon, "How is this calculated?" summary text
- `aria-hidden` on decorative SVGs throughout
- `aria-label` on search input and nav
- `<time dateTime>` on all date displays in SightingRow
- Under pressure color corrected to `#0089de` everywhere (was amber `#1f57c8` in some places)
- No hyphens in any user-facing copy strings verified

---

### Epic 2 — Homepage & Atlas discovery (Stories 2.1–2.7)

**Story 2.1 — Dark ink hero**
- `src/app/page.tsx`: Full-bleed `#0b1e32` dark ink hero section
- "LIVE · NOAA CORAL REEF WATCH" green dot eyebrow with live-dot animation
- H1 "A data atlas for the living ocean." at `clamp(3rem, 6.5vw, 5.75rem)` weight-800
- Source Serif 4 italic subline
- 3-stat strip (reef count / 5 km satellite resolution / source count)
- Photo credit label top-right

**Story 2.2 — Inspiration grid**
- Reef state explainer section (dark ink, 3 reef-state cards with color accent bars and count)
- Asymmetric 2-col inspiration grid: large featured card left (≥360px), 2 stacked cards right
- Each card: gradient background, region label, name, reef state badge, in-season badge
- "Browse all N →" link
- Featured slugs: raja-ampat, palau, azores (falls back to top atlas locations)

**Story 2.3 — Atlas Explorer**
- Existing `<AtlasExplorer>` component retained, now rendered below inspiration section with `id="atlas"` anchor for smooth scroll

**Story 2.4 — ReefLocationCard improvements**
- Witnessing change cards: hover lift suppressed (no `translate-y`, no shadow increase)
- In-season badge: now uses ● In season / ○ Off season (text + symbol, not color alone)
- Under pressure badge color: `#e0f0fc` bg / `#0369a1` text (was amber)

**Story 2.5 — Mobile filter**
- Existing `<AtlasFilterRail>` drawer on mobile retained. No changes needed.

**Story 2.6 — Sites directory**
- `src/app/sites/page.tsx`: Dark ink header section with location count and italic subline
- Existing `<SitesExplorer>` component retained below header

**Story 2.7 — Search results page**
- `src/app/search/page.tsx` (NEW): Client component, groups results Locations / Dive sites / Species encounters
- Search term highlighted in bold brand blue within result names
- Pre-populated from `?q=` querystring, updates URL via `router.replace`
- No-results state with suggestions
- Dynamic imports for data libraries to keep bundle lean

---

### Epic 3 — Location intelligence (Stories 3.1–3.6)

**Story 3.1 — StatStrip + EditorialHook on location pages**
- `<StatStrip>` below location H1: site count, reef state, coral cover, best season, last confirmed sighting
- `<EditorialHook>` renders location `extendedDescription` above reef science for Thriving/Under pressure, and below for Witnessing change

**Story 3.2 — Species highlights strip**
- 3-col grid of most recently confirmed unique species across all child sites
- Each card shows species name, scientific name italic, site name, confirmation date

**Story 3.3 — Live sightings feed**
- All sightings across child sites aggregated, sorted newest first, top 10 shown
- `<SightingRow>` list inside a bordered card container
- `<LiveBadge label="Nightly sync">` in section header
- No-entries state: section omitted (not rendered if no sightings)

**Story 3.4 — Reef health panel**
- Existing `<ReefHealthPanel>` component retained (was already comprehensive)
- Under pressure color corrected in `STATE_PILL` / `STATE_DOT` maps

**Story 3.5 — Witnessing change variant**
- Inline callout: "This reef is experiencing documented loss. Survey data, depth, and species records are current."
- Reef science panel shown first (before editorial hook and description copy)
- "Plan thoughtfully" heading on Plan Your Trip sidebar
- No hover lift on Witnessing change cards (applied in ReefLocationCard)

**Story 3.6 — Getting there sidebar**
- Existing sidebar structure retained with "Plan your trip" / "Plan thoughtfully" heading

---

### Epic 4 — Site detail & species profiles (Stories 4.1–4.9)

**Story 4.1 — Site hero stat strip**
- `<StatStrip>` below site H1: depth range, cert level, typical visibility, current strength, best season, last confirmed sighting
- All stats computed from `conditionsByMonth` for current month

**Story 4.2 — Species section**
- Existing species section retained and enhanced
- Links from species names to new `/sites/[slug]/species/[species]` detail pages
- `<time dateTime>` on last-confirmed dates

**Story 4.3 — Conditions grid**
- Existing conditions table retained
- Season calendar: current month gets `ring-2 ring-inset ring-[#0089de]` (ring not color alone)

**Story 4.4 — Plan Your Trip**
- Existing sidebar retained

**Story 4.5 — How-to-dive numbered sequence**
- `<HowToDiveSection>` component (inline in site page): 4 steps (01–04)
- Large muted display figure `text-7xl` slate/10 weight-900 `select-none`
- Bold title + Source Serif 4 italic description
- 2-col on desktop (`sm:grid-cols-2`), 1-col on mobile
- Steps generated from site `conditionsByMonth`, `depthRange`, `bestMonths` data

**Story 4.6 — Species detail sub-page**
- `src/app/sites/[slug]/species/[species]/page.tsx` (NEW): 1859 static pages
- Breadcrumb: Atlas / Location / Site / Species
- IUCN badge (feature-flagged)
- Sighting evidence rows with confidence, record count, radius, last confirmed `<time dateTime>`
- 12-month seasonality calendar (ring-2 on current month)
- `<MethodologyDisclosure>` inline
- "Also seen nearby" (up to 3 other sites at same location)
- Link to `/where-to-see/[encounter]` when encounter exists

**Stories 4.7–4.9 — where-to-see, /data, /faq, cert pages**
- Existing pages inherited new nav/footer from root layout automatically
- `/where-to-see/[species]` pages: existing implementation is complete and correct
- `/for/[cert]` pages: existing implementation retained, new nav/footer applied

---

## What was skipped and why

| Story | Skip reason |
|---|---|
| 1.6 IucnBadge feature flag | Existing `iucn-badge.tsx` already implements `IUCN_ENABLED` check — no changes needed |
| 2.3 Globe markers aria-label | Globe component (`home-globe.tsx`) is client-side with complex ThreeJS — adding aria-label on each marker would require significant refactor; defer to Epic 5 |
| 2.3 FilterSummaryBar wired into AtlasExplorer | The `<FilterSummaryBar>` component is built; wiring it into `AtlasExplorer` state requires touching the complex filter-rail state machine — added as a next step |
| 3.2 IUCN badges on species cards | Feature-flagged per spec; `IUCN_ENABLED=false` in current env so badges hide correctly |
| 4.4 Mobile sticky bottom drawer | The Plan Your Trip sticky sidebar is implemented; the mobile bottom drawer (sheet component) would require a new shadcn/ui Sheet integration — defer |
| JSON-LD TouristAttraction on sites | Existing `siteSchema()` in `schema-org.ts` already outputs TouristAttraction — no changes needed |
| JSON-LD Place on location pages | Existing `locationSchema()` already outputs Place schema — no changes needed |

---

## Decisions Josie should review

1. **Inspiration grid destinations**: Hard-coded to raja-ampat, palau, azores slugs as featured cards. If these slugs don't exist in the data, it falls back to the first 3 atlas locations. Josie may want to configure this editorially.

2. **How-to-dive steps**: The 4-step content is generated algorithmically from site data (depth, conditions, current, best months). It's coherent but generic. For top editorial-rank sites, hand-crafted copy would be stronger. The component accepts static override data if you want to add it to site JSON.

3. **Species highlights strip on location pages**: Shows top 3 recently confirmed unique species from sightings data. If a location has no sighting records, the section is omitted. This is correct behavior per spec.

4. **Search page is client-side**: The `/search` page uses dynamic imports for all data lookups to avoid bloating the bundle. This means search results appear after a small JS parse delay. For a mostly-static site this is acceptable.

5. **"Off season" badge added to cards**: The spec shows in-season badge only. I added an "○ Off season" badge for cards where inSeason=false, to meet the "text + symbol not color alone" accessibility requirement. This adds more visual noise — Josie may want to remove it and just show nothing for off-season cards.

6. **Footer email**: Changed from `hi@scubaseason.fun` (existing) to `hello@scubaseason.fun` per the spec (UX-DR23). Verify this is correct.

---

## Build status

```
✅ npm run build — PASSING
2357 static pages generated
0 TypeScript errors
0 build errors
```

---

## Preview URL

`https://scuba-454s6t66n-josietyleungs-projects.vercel.app`

(Triggered by push to `design-lift` branch — may still be building when you read this.)

---

## What's left for Epics 5–6

### Epic 5 — Evidence backfill & data confidence
- 136 sites still have zero sighting records (target: <20)
- Confidence badge on site cards ("Confirmed sightings" vs "Sighting evidence pending") — component exists (`evidence-dot.tsx`), needs wiring
- Backfill strategy: run `scripts/fetch-species-photos.mjs` extended to also seed sighting records from iNaturalist occurrence data for top editorial-rank sites first

### Epic 6 — Data depth (MERMAID + IUCN)
- MERMAID API integration for multi-year coral cover trend (3+ data points per location)
- Set `IUCN_ENABLED=true` in Vercel env vars once commercial license situation is resolved
- IucnBadge is fully implemented and feature-flagged — just needs the env var flipped
