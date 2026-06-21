---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - _bmad-output/planning-artifacts/scubaseason-prd/prd.md
  - _bmad-output/planning-artifacts/prds/feature-sighting-submission-2026-06-15.md
  - _bmad-output/planning-artifacts/scubaseason-prd/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-19/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-19/EXPERIENCE.md
---

# Scuba Season — Epic Breakdown

## Global Implementation Constraints

These two constraints apply to **every story in every epic** without exception. They override any individual story scope.

### 1. Data Files Are Read-Only

`src/data/` is strictly read-only throughout this entire redesign project. No story may modify:

- Locations (count, names, slugs, reef health classifications, season windows, heat levels)
- Dive sites (count, names, slugs, depth, conditions, wreck data, gear/operator/lodging affiliate links)
- Species (lists, common names, sighting probabilities, last-confirmed dates, iNaturalist photo data)
- Reef health inputs (coral cover %, bleaching %, DHW, GFW fishing hours, water quality events)
- Any computed values or source citations

Stories in this project change **how data is displayed** — not the data itself. If a story's implementation requires touching a JSON file in `src/data/`, that is out of scope and must be flagged.

The only data written by this project is new sighting submissions sent to the iNaturalist API (Epic 5) — these do not touch `src/data/`.

### 2. All UI Stories Must Be Mobile-First Responsive

Every story that produces UI output must render correctly at a minimum viewport width of **375px**. This means:

- Multi-column layouts collapse to single column on mobile
- Sticky sidebars become bottom-drawers or stacked sections on mobile
- Touch targets are minimum 44×44px
- Horizontal scroll (filmstrip, mosaic, filter bar) uses native touch scroll on mobile
- No content is hidden or clipped on mobile that is essential on desktop
- Maps that render on desktop degrade to list view on mobile (< 1024px)

When a story does not include an explicit mobile AC, this global constraint still applies and must be verified during implementation.

---

## Overview

This document inventories every requirement extracted from the main PRD, the sighting-submission feature PRD, the architecture document, and the UX design files (DESIGN.md + EXPERIENCE.md). It is the authoritative single list that drives epic design and story authoring. The FR Coverage Map and Epic List sections are stubs to be filled in the epic design step.

---

## Requirements Inventory

### Functional Requirements

**FR1** — Interactive 3D globe on the Explore page — location markers colored by reef state and season.

**FR2** — Filter rail — reef condition, month, skill, region, heat, animal tags, freshness toggle, and sort controls.

**FR3** — Filters are URL-state — shareable and back-button-safe.

**FR4** — Location cards show name, reef state badge, season indicators, heat level, and survey age.

**FR5** — Globe and card grid update live on filter change.

**FR6** — Mobile — globe degrades to list; filter rail collapses to "Filter (N)" sticky button that opens a full-screen sheet.

**FR7** — Dive site detail page sections — Overview, Species, 12-month Conditions grid, Reef Health, Plan Your Trip, Gear, Related Sites.

**FR8** — Species section — common name, IUCN badge (feature-flagged), reliability score, last confirmed date, 24-month record count, iNaturalist photo with attribution.

**FR9** — 12-month conditions grid — water temp, visibility, current strength, color-coded per cell.

**FR10** — Plan Your Trip sticky sidebar (desktop) / bottom-drawer CTA (mobile) — flights, lodging, operators, affiliate-tracked.

**FR11** — Wreck data displayed when site has wreck records — vessel name, type, sunk date, depth, history.

**FR12** — Static generation for SEO + JSON-LD TouristAttraction schema per dive site.

**FR13** — Methodology and source citations inline on site and location detail pages.

**FR14** — Location page — reef health panel: coral cover %, bleached %, thermal stress (DHW), survey date, diving outlook.

**FR15** — Location page — fishing pressure panel: GFW AIS-tracked fishing hours within 50 km, with artisanal caveats.

**FR16** — Location page — water quality events panel when present.

**FR17** — Location page — card grid of child dive sites.

**FR18** — Location page — JSON-LD Place schema.

**FR19** — Sites directory — card grid of all sites, free-text search, filter controls, URL-state.

**FR20** — Species explorer — one page per curated encounter, top 6 sites ranked, all atlas locations by region, best months, ethics notes, JSON-LD.

**FR21** — Cert-level landing pages — 6 cert levels, intro copy, safety warnings, filtered locations, cert-appropriate gear recommendations.

**FR22** — Affiliate link tracking — Vercel Analytics events for gear_click, lodging_click, operator_click, flight_click with site_id context.

**FR23** — Affiliate disclosure on every page with affiliate links; full policy at /about.

**FR24** — Data transparency — /method page documents live vs snapshot vs unknown data.

**FR25** — Per-claim source and methodology citations; 63-entry source registry.

**FR26** — Data freshness labels on every data panel.

**FR27** — Sighting evidence backfill — all 380 sites must have at least 1 sighting record; current gap is 136 sites (FR9.1–9.2).

**FR28** — Evidence confidence indicator on site cards — "Confirmed sightings" vs "No sighting records yet" badge.

**FR29** — MERMAID API integration — multi-year coral cover trend (at least 3 data points) on location pages.

**FR30** — Homepage 10-second clarity — value proposition legible above the fold without scrolling.

**FR31** — Sighting submission entry point — "Upload a sighting" yellow CTA button in top nav linking to /upload.

**FR32** — Sighting submission entry point — upload nudge card (yellow border) on every dive site page.

**FR33** — Pre-dive brief card on dive site page — "Planning to dive here?" with capture guidance and expandable methodology section.

**FR34** — 3-step upload wizard: Step 1 Site (search autocomplete, auto-advance on select), Step 2 Sighting (photo + species chips + details), Step 3 Submit (sign-in gate + review + submit).

**FR35** — Site pre-filled in wizard when arriving from a dive site page; free-text search available when arriving from /upload directly.

**FR36** — Photo upload — drag-drop or choose file; accepts JPEG, PNG, HEIC (converted server-side to JPEG), WebP; up to 10 photos per sighting; 20 MB per photo; EXIF date auto-reads to pre-fill date field.

**FR37** — Species input — multi-select chips (pre-populated common species for the site) + text autocomplete (queries iNaturalist taxon API, up to 6 results, common and scientific name); "Not sure" always valid; up to 8 species per submission.

**FR38** — Backend splits multi-species submission into separate iNaturalist observations (1 observation per taxon) to comply with iNat data model; UX shows one unified form.

**FR39** — Mandatory fields: at least 1 photo, at least 1 site. All other fields optional.

**FR40** — Category selector — Fish or marine life / Coral / Not sure. Selecting Coral reveals depth and bleaching score fields inline.

**FR41** — Bleaching score — shown only when Coral is selected; options: Healthy / Pale / Bleached / Dead; required for CoralWatch routing.

**FR42** — Depth field (metres), sea temperature field (°C), notes (280 chars) — all optional for non-coral; depth required for CoralWatch routing.

**FR43** — Identity gate at Step 3 — guest path (submit under ScubaSeason account) vs sign-in via iNaturalist OAuth or email.

**FR44** — Platform routing — iNaturalist (all submissions, real-time), GBIF (auto via iNat, ~24h), OBIS (auto via iNat, ~24h), iSeahorse (conditional: Hippocampus spp. only, auto-tag), CoralWatch (conditional: Coral + depth + bleaching score, no timing shown to user).

**FR45** — Seahorse auto-detection — if selected taxon is Hippocampus genus, iSeahorse tag added automatically and shown as a badge in the form.

**FR46** — No Reef Check integration — out of scope; requires certified EcoDiver.

**FR47** — Broadcast confirmation screen — heading "Your sighting is on its way!"; staggered platform rows with check mark (iNat, GBIF, OBIS, plus iSeahorse if triggered, plus CoralWatch if triggered); no timing language shown; "Find your observation on iNaturalist" link; "Submit another sighting" and "Back to [site]" ghost buttons.

**FR48** — "Submit another sighting" resets wizard to Step 1 keeping site context.

**FR49** — iNaturalist submission sequence — POST /observations, POST /observation_photos per photo, POST /project_observations if seahorse (project_id=871).

**FR50** — Error handling — store submission locally on iNat API failure; retry 3 times with exponential backoff; on all retries failed: Telegram alert + show user "We will resubmit your photo within 24 hours".

**FR51** — CoralWatch queue — Coral + depth + bleaching score submissions written to queue; weekly manual batch export; Telegram summary on completion.

**FR52** — Telegram ops alerts — on successful iNat submission, on failed iNat submission, on weekly CoralWatch batch completion or failure.

**FR53** — Homepage dual CTA — "Explore reefs" (ghost, white border) and "Upload a sighting" (yellow) side by side in hero; stack vertically on mobile with yellow first.

**FR54** — Homepage layout — full-viewport photo hero → StatStrip → reef-state trio → featured-reef drag-scroll mosaic → species filmstrip → citizen-science 50/50 split → method strip → footer. Globe moves to Explore page only.

**FR55** — Explore page — sticky map (42% width) + scrollable card grid (58%) + filter pill bar sticky below nav.

**FR56** — Location detail — coral projection chart (solid historical line + dashed projection to 2031, inline SVG, "Today" marker).

**FR57** — Sighting field journal on dive site page — field-journal style log of submitted sightings; empty state with Upload CTA.

---

### Non-Functional Requirements

**NFR1** — Performance — site detail pages LCP < 2.0s on 4G; statically generated; images served via Next.js Image component.

**NFR2** — SEO — every page indexable; unique title, description, and OG tags; sitemap covers all 380 sites, 113 locations, 11 encounters, 6 cert pages; JSON-LD schema.org per page type.

**NFR3** — Accessibility — WCAG 2.1 AA; keyboard navigation on all interactive elements; focus-visible ring (#F6C700 on light, #FFFFFF on dark contexts); screen reader support; alt text on all photography; prefers-reduced-motion respected for all animations.

**NFR4** — Mobile responsive — responsive web; globe/map degrades to list on small screens; Plan Your Trip becomes sticky bottom button opening a drawer; filters collapse to a sheet; minimum supported width 375px.

**NFR5** — Data integrity — every quantitative claim (coral cover %, DHW, sighting count) traceable to source and methodology; no headline stat without cited confidence level or caveat.

**NFR6** — Compliance — FTC affiliate disclosure on every page with affiliate links; Vercel Analytics cookieless; no cookie banner required.

**NFR7** — Browser support — last 2 versions of Chrome, Firefox, Safari, Edge; no IE; no polyfill burden for CSS custom properties or IntersectionObserver.

---

### Additional Requirements (from Architecture)

- Stack locked: Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Tailwind v4, shadcn/ui + @base-ui/react.
- Hosting: Vercel (static build; rebuild on data change acceptable).
- Data: Static JSON files in src/data/ (no database); two top-level files: locations.json + sites.json; sightings stored in separate JSON.
- Globe: react-globe.gl (three.js peer dep already wired) — kept for Explore page only.
- Search: fuse.js for fuzzy client-side search on /sites.
- Analytics: Vercel Analytics (cookieless, zero-config).
- Fonts: Source Serif 4 + IBM Plex Sans via next/font/google; IBM Plex Mono as secondary font-face.
- No ISR/revalidation — full static build; sighting submission API routes are the only serverless functions.
- iNaturalist API account: scubaseason / josie@scubaseason.fun; eligible for full API registration approximately 2026-08-15; fallback to manual queue until then.
- Telegram alerts: credentials from ~/.openclaw/openclaw.json .channels.telegram; chat_id 1289833065.

---

### UX Design Requirements

**UX-DR1** — Full color token replacement — remove all dark mode tokens (#030712, #00d4ff cyan, --atlas-* dark variables); implement light system: --color-paper #FFFFFF, --color-brand-yellow #F6C700, --color-ink #0E1C28, --color-ocean #0E4F6E, --color-hairline #E7E6E2, --color-footer #14191E, health tokens (#2E7D5B / #B98A2E / #C0412B).

**UX-DR2** — Typography — implement Source Serif 4 (display/headings weight 300 italic + 400), IBM Plex Sans (body/UI weight 300–500), IBM Plex Mono (data/labels/eyebrows weight 400–500); remove Space Grotesk and Inter.

**UX-DR3** — TopNav component — sticky; transparent state over photo heroes (logo + links white); solid state (scrollY > 60px, white bg + hairline border, logo + links ink); Upload CTA yellow button always rightmost; mobile: hamburger opens drawer with Upload as full-width yellow button at bottom; transition 200ms.

**UX-DR4** — StatStrip component — homepage only; yellow 1.5px top and bottom rules; 4–5 stat cells; IBM Plex Mono stat values with counter animation (easeOutExpo, 1200ms, IntersectionObserver trigger); reduced motion: show final value immediately.

**UX-DR5** — ReefStateCard component — 3-column photo cards; full-bleed photo with bottom gradient; reef health badge and location name bottom-anchored; hover: photo scale 1.03; links to Location detail.

**UX-DR6** — SpeciesFilmstrip component — auto-scroll 1px/frame; pause on hover/focus; common names only, no IUCN, no scientific names; sighting odds in IBM Plex Mono 500 18px; reduced motion: no auto-scroll.

**UX-DR7** — ReefCard (Explore grid) — photo top (180px), card body: location name (Source Serif 4 400 22px), region/country (Mono 11px), reef health badge, 2 data points; hover: border ink; selected (map active): border yellow 2px; 3-col desktop, 2-col tablet, 1-col mobile.

**UX-DR8** — UploadCTA — 3 contexts: (1) nav button, (2) homepage 50/50 split section, (3) dive site nudge card (yellow 1.5px border); all link to /upload.

**UX-DR9** — SightingLog (field journal) — on dive site page; per-entry: diver avatar + name + date + species tags + conditions + photo thumbnail; empty state with yellow Upload button; "Load more" ghost button.

**UX-DR10** — CoralProjectionChart — inline SVG; solid historical line + dashed projection (stroke-dasharray 4 4); "Today" marker; data point hover tooltips; confidence band at 10% opacity; accessible role="img" + aria-label + hidden table fallback.

**UX-DR11** — Footer — #14191E only dark surface; white wordmark; nav links + hello@scubaseason.fun; mission line; CC BY-NC + data attribution; 64px padding; always dark regardless of page.

**UX-DR12** — ReefHealthBadge — IBM Plex Mono 500 11px uppercase; 3px 8px padding; 2px border-radius; 1px solid currentColor; transparent bg on white, rgba(255,255,255,0.12) on photos; 3 states only (Improving / Stable / Declining); no Unknown badge; aria-label="Reef health: [state]".

**UX-DR13** — BroadcastConfirmation screen — replaces wizard on submit; heading "Your sighting is on its way!" (Source Serif 4 300 italic); staggered platform rows (0/400/800/1200ms delay); check mark character in #2E7D5B; "Find your observation on iNaturalist" ocean-blue link; 2 ghost buttons; no yellow on this screen; reduced motion: all rows appear immediately.

**UX-DR14** — FilterPill — fully rounded (border-radius 100px); resting: white bg / ink-2 text / hairline border; active: ink bg / white text; hover resting: ink border; "Clear all" ocean-blue text link when any active; filter bar sticky below nav (top: 64px); horizontal scroll if overflows.

**UX-DR15** — Upload wizard step indicator — 3 circles (28px); completed: ink bg / white check; current: yellow bg / ink number; upcoming: white / hairline border / muted text; connector lines turn ink when step completed; step labels IBM Plex Mono 11px below circles.

**UX-DR16** — Scroll reveals — IntersectionObserver adds .on class to .reveal elements; opacity 0 to 1 + translateY 20px to 0; 500ms ease; staggered .d1–.d4 (0/80/160/240ms delay); prefers-reduced-motion: skip animation, show immediately.

**UX-DR17** — Drag-scroll mosaic — homepage featured reefs; cursor grab/grabbing on mousedown; mousedown/mousemove scroll tracking; touch: native scroll.

**UX-DR18** — Nav transparent-to-solid transition — scrollY > 60px threshold; background 200ms ease; logo + links color switch white to ink.

**UX-DR19** — WCAG AA compliance — all contrast ratios verified (#0E1C28 on #FFFFFF = 17.5:1; CTA text #0E1C28 on #F6C700 = 9.3:1; footer #C8CDD1 on #14191E = 7.0:1); focus ring 2px solid #F6C700 outline-offset 2px on all interactive elements; upload wizard: focus moves programmatically to step heading on advance; species filmstrip keyboard navigable with arrow keys; aria-live="polite" on broadcast confirmation rows.

**UX-DR20** — No icons, no emoji anywhere in the UI — type and photography only; no icon set to install or maintain.

**UX-DR21** — 404 page — Source Serif 4 italic heading "This reef is off the map."; yellow "Explore all reefs" button.

**UX-DR22** — Homepage coral section completely new — remove current dark globe-centric hero; implement photo hero + dual CTA + StatStrip + ReefStateCard trio + drag-scroll mosaic + SpeciesFilmstrip + 50/50 citizen-science split + method strip.

---

### FR Coverage Map

FR1: Epic 3 — Globe on Explore page, location markers by reef state
FR2: Epic 3 — Filter rail (condition, month, skill, region, heat, animal tags)
FR3: Epic 3 — URL-state filters
FR4: Epic 3 — Location cards (name, reef state, season, heat, survey age)
FR5: Epic 3 — Live globe + card grid update on filter change
FR6: Epic 3 — Mobile: globe degrades to list, filters collapse to sheet
FR7: Epic 4 — Dive site detail page sections
FR8: Epic 4 — Species section (name, reliability, last confirmed, record count, iNat photo)
FR9: Epic 4 — 12-month conditions grid
FR10: Epic 4 — Plan Your Trip sticky sidebar / mobile drawer
FR11: Epic 4 — Wreck data display
FR12: Epic 4 — Static generation + JSON-LD TouristAttraction schema
FR13: Epic 4 — Methodology + source citations inline
FR14: Epic 4 — Location reef health panel
FR15: Epic 4 — Location fishing pressure panel
FR16: Epic 4 — Location water quality events panel
FR17: Epic 4 — Location child sites card grid
FR18: Epic 4 — Location JSON-LD Place schema
FR19: Epic 3 — Sites directory (card grid, free-text search, filters, URL-state)
FR20: Epic 6 — Species explorer (/where-to-see/[species])
FR21: OUT OF SCOPE — Cert-level landing pages excluded from rebrand
FR22: Epic 6 — Affiliate link tracking (Vercel Analytics events)
FR23: Epic 6 — Affiliate disclosure on pages with affiliate links
FR24: Epic 6 — Method page (/method) — live vs snapshot vs unknown
FR25: Epic 6 — Source registry + per-claim methodology citations
FR26: Epic 4 — Data freshness labels on all data panels
FR27: SPLIT — FR27a (data backfill: 136 sites) is OUT OF SCOPE for this redesign (blocked by Global Constraint #1 — data files are read-only; must be a separate data project). FR27b (evidence confidence badge on site cards) is covered by Epic 3 → Story 3.4.
FR28: Epic 4 — Sighting evidence backfill (136 zero-evidence sites)
FR29: Epic 4 — MERMAID API integration (multi-year coral cover trend)
FR30: Epic 2 — Homepage 10-second value proposition clarity
FR31: Epic 5 — Upload CTA in nav + /upload route
FR32: Epic 5 — Upload nudge card on dive site pages
FR33: Epic 5 — Pre-dive brief card on dive site page
FR34: Epic 5 — 3-step upload wizard (Site → Sighting → Submit)
FR35: Epic 5 — Site pre-fill when arriving from dive site page
FR36: Epic 5 — Photo upload (JPEG/PNG/HEIC/WebP, 10 photos, 20MB, EXIF)
FR37: Epic 5 — Species multi-select chips + iNat taxon autocomplete
FR38: Epic 5 — Backend splits multi-species into separate iNat observations
FR39: Epic 5 — Required fields: 1 photo + 1 site minimum
FR40: Epic 5 — Category selector (Fish / Coral / Not sure)
FR41: Epic 5 — Bleaching score field (Coral only; required for CoralWatch)
FR42: Epic 5 — Depth, temperature, notes fields
FR43: Epic 5 — Identity gate at Step 3 (guest vs iNat OAuth vs email)
FR44: Epic 5 — Platform routing (iNat, GBIF, OBIS, iSeahorse, CoralWatch)
FR45: Epic 5 — Seahorse auto-detection and iSeahorse auto-tag
FR46: Epic 5 — No Reef Check (out of scope, requires certified EcoDiver)
FR47: Epic 5 — Broadcast confirmation screen
FR48: Epic 5 — Submit another sighting resets wizard keeping site context
FR49: Epic 5 — iNaturalist submission API sequence
FR50: Epic 5 — Error handling + retry logic + Telegram alerts
FR51: Epic 5 — CoralWatch weekly queue + batch job
FR52: Epic 5 — Telegram ops alerts (success/failure/weekly batch)
FR53: Epic 2 — Homepage dual CTA (Explore reefs + Upload a sighting)
FR54: Epic 2 — Homepage layout (hero → stats → reef-state trio → mosaic → filmstrip → 50/50 → method strip → footer)
FR55: Epic 4 — Explore page layout (map 42% sticky + card grid 58%)
FR56: Epic 4 — Coral projection chart on location pages
FR57: Epic 4 — Sighting field journal on dive site pages

UX-DR1: Epic 1 — Full color token replacement (dark→light system)
UX-DR2: Epic 1 — Typography (Source Serif 4 / IBM Plex Sans / IBM Plex Mono)
UX-DR3: Epic 1 — TopNav component (transparent/solid states, mobile drawer)
UX-DR4: Epic 2 — StatStrip component with counter animation
UX-DR5: Epic 2 — ReefStateCard component (3-col photo cards)
UX-DR6: Epic 3 — ReefCard component (Explore grid)
UX-DR7: Epic 3 — ReefCard visual spec
UX-DR8: Epics 2+4+5 — UploadCTA (3 contexts: homepage 50/50, dive site nudge, nav button)
UX-DR9: Epic 4 — SightingLog field journal component
UX-DR10: Epic 4 — CoralProjectionChart (inline SVG)
UX-DR11: Epic 1 — Footer (dark surface, #14191E)
UX-DR12: Epic 1 — ReefHealthBadge component
UX-DR13: Epic 5 — BroadcastConfirmation screen
UX-DR14: Epic 3 — FilterPill component and filter bar
UX-DR15: Epic 5 — Upload wizard step indicator
UX-DR16: Epic 1 — Scroll reveal animations (IntersectionObserver)
UX-DR17: Epic 2 — Species filmstrip auto-scroll
UX-DR18: Epic 1 — Nav transparent→solid transition
UX-DR19: Epic 1 — WCAG AA compliance across all components
UX-DR20: Epic 1 — No icons, no emoji (enforced at design system level)
UX-DR21: Epic 1 — 404 page
UX-DR22: Epic 2 — Replace dark globe-centric homepage with new editorial layout

---

## Epic List

### Epic 1: Design System & Navigation Foundation
Every page renders the new light editorial identity — white backgrounds, yellow CTAs, Source Serif 4 type stack, updated nav and footer. This is the prerequisite all other epics build on.
**FRs covered:** UX-DR1, UX-DR2, UX-DR3, UX-DR11, UX-DR12, UX-DR16, UX-DR18, UX-DR19, UX-DR20, UX-DR21, NFR3, NFR4, NFR7

### Epic 2: Homepage — Discover Scuba Season
A first-time visitor understands both value props (research + upload) within 10 seconds and has two clear paths: Explore reefs or Upload a sighting. Globe removed from homepage.
**FRs covered:** FR30, FR53, FR54, UX-DR4, UX-DR5, UX-DR8 (50/50 context), UX-DR17, UX-DR22, NFR2

### Epic 3: Explore & Discover Reefs
Users browse all reef locations on a live map + card grid, filter by health/region/season/depth, and find dive destinations that match their goals.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR19, FR27, UX-DR7, UX-DR14, NFR2, NFR4

### Epic 4: Research a Reef & Plan Your Dive
Users deep-dive into a specific location or site — read reef health trajectory, see species sighting odds, check conditions, and plan their trip end-to-end.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR17, FR18, FR26, FR28, FR29, FR55, FR56, FR57, UX-DR9, UX-DR10, UX-DR8 (nudge card context), NFR1, NFR5

### Epic 5: Upload a Sighting — Citizen Science
Divers submit observations from their dives in under 2 minutes, automatically routed to iNaturalist, GBIF, OBIS, iSeahorse (conditional), and CoralWatch (conditional). Backend API partially built — this epic rebuilds the UX to the approved 3-step wizard design.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50, FR51, FR52, UX-DR13, UX-DR15, NFR3, NFR4

### Epic 6: Method & About Pages
Users understand the data methodology and read the founder story — both in the new visual identity. Cert-level landing pages are out of scope for this rebrand.
**FRs covered:** FR20, FR22, FR23, FR24, FR25, NFR2, NFR6

---

## Epic 1: Design System & Navigation Foundation

Every page renders the new light editorial identity — white backgrounds, yellow CTAs, Source Serif 4 type stack, updated nav and footer. This is the prerequisite all other epics build on.

### Story 1.1: Light Mode Color Token System

As a site visitor,
I want every page to render in the new light editorial color system,
So that I immediately perceive Scuba Season as a professional, trustworthy reef atlas.

**Acceptance Criteria:**

**Given** globals.css exists with existing dark-mode tokens
**When** the new token system is applied
**Then** all existing dark-mode tokens (--atlas-*, bg #030712, cyan #00d4ff) are removed and replaced with: --color-paper: #FFFFFF; --color-brand-yellow: #F6C700; --color-ink: #0E1C28; --color-footer: #14191E; --color-ocean: #0E4F6E; --color-hairline: #E7E6E2; --color-ink-2: #4A5568; --color-improving: #2E7D5B; --color-stable: #B98A2E; --color-declining: #C0412B
**And** body background is --color-paper and body text is --color-ink on all pages

**Given** Tailwind v4 config
**When** updated
**Then** brand-yellow (#F6C700) is registered as a Tailwind color alias and cyan is removed from the palette

**Given** any health-colored element
**When** rendered
**Then** ONLY the 3 health tokens (improving/stable/declining) are used for reef state — no other colors used for that purpose

**Given** any yellow element
**When** rendered
**Then** yellow (#F6C700) is used ONLY for interactive/CTA elements, never for decorative use

### Story 1.2: Typography — Source Serif 4 + IBM Plex Sans + IBM Plex Mono

As a site visitor,
I want headings in an editorial serif font and body copy in a clean sans,
So that Scuba Season reads like a serious editorial publication.

**Acceptance Criteria:**

**Given** next/font/google configuration
**When** the app builds
**Then** Source Serif 4 (weight 300, 400; style normal, italic), IBM Plex Sans (weight 300, 400, 500), and IBM Plex Mono (weight 400, 500) are loaded and cached by Next.js font subsetting

**Given** any h1 element
**When** rendered
**Then** it uses Source Serif 4 weight 300 italic

**Given** h2 and h3 elements
**When** rendered
**Then** they use Source Serif 4 weight 400 normal

**Given** body copy (p, li)
**When** rendered
**Then** IBM Plex Sans weight 300–400 is used

**Given** data labels, eyebrow text (uppercase 11px), stat values
**When** rendered
**Then** IBM Plex Mono is used

**Given** Space Grotesk and Inter font imports (from previous rebrand)
**When** the build runs
**Then** they are removed from next/font config and the font bundle

### Story 1.3: TopNav Component

As a site visitor,
I want a navigation bar that is transparent over hero photos and solid when I scroll,
So that I can always read navigation without it competing with the photography.

**Acceptance Criteria:**

**Given** the nav on any page with scrollY = 0
**When** rendered
**Then** nav background is transparent; logo and all links are white

**Given** the nav
**When** scrollY exceeds 60px
**Then** nav background transitions to white with 1px --color-hairline bottom border; logo and links switch to --color-ink; transition is 200ms ease

**Given** the nav on any page
**When** rendered
**Then** links are: Explore → /explore, Method → /method, About → /about; rightmost element is a yellow "Upload a sighting" button linking to /upload

**Given** mobile viewport < 768px
**When** rendered
**Then** nav links are hidden and a hamburger icon is shown at right

**Given** the hamburger icon
**When** clicked
**Then** a full-width drawer slides in from the right containing nav links and a full-width yellow "Upload a sighting" button at bottom

**Given** the Upload button
**When** rendered in nav or drawer
**Then** background is --color-brand-yellow, text is --color-ink, border-radius is 2px — never ghost or white

**Given** keyboard navigation
**When** Tab reaches any nav element
**Then** focus ring (2px solid #F6C700, outline-offset 2px) is visible

### Story 1.4: Footer Component

As a site visitor,
I want a consistent dark footer on every page with key links and a mission line,
So that every page has a coherent closing that reinforces the brand.

**Acceptance Criteria:**

**Given** any page (including pages with white backgrounds)
**When** the footer renders
**Then** background is #14191E (--color-footer) — always dark regardless of page context

**Given** the footer
**When** rendered
**Then** it contains: ScubaSeason wordmark (white), nav links (Explore, Method, About), contact link hello@scubaseason.fun, one-line mission statement, CC BY-NC license notice, data attribution line

**Given** the footer
**When** rendered
**Then** top and bottom padding is 64px

**Given** footer links
**When** hovered
**Then** color transitions to --color-brand-yellow

**Given** footer secondary text (non-link)
**When** rendered
**Then** color is rgba(255,255,255,0.65); wordmark is white

**Given** keyboard navigation
**When** Tab reaches footer links
**Then** focus ring (2px solid #F6C700) is visible

### Story 1.5: ReefHealthBadge Component

As a site visitor,
I want reef health status displayed as a consistent badge anywhere on the site,
So that I can immediately read reef state at a glance on any card or page.

**Acceptance Criteria:**

**Given** a reef in Improving state
**When** the badge renders
**Then** text is "Improving" in --color-improving (#2E7D5B); 1px solid currentColor border; transparent background on white surfaces

**Given** a reef in Stable state
**When** the badge renders
**Then** text is "Stable" in --color-stable (#B98A2E)

**Given** a reef in Declining state
**When** the badge renders
**Then** text is "Declining" in --color-declining (#C0412B)

**Given** a reef with no state data
**When** the badge renders
**Then** no badge is shown — do not render an "Unknown" badge

**Given** the badge on a photo (dark background)
**When** rendered
**Then** background is rgba(255,255,255,0.12)

**Given** any ReefHealthBadge
**When** rendered
**Then** text is IBM Plex Mono 500 11px uppercase; padding 3px 8px; border-radius 2px; aria-label="Reef health: [state]" is set

### Story 1.6: Scroll Reveal Animations + Nav Scroll Transition

As a site visitor,
I want content to elegantly appear as I scroll,
So that the page feels dynamic and crafted without being distracting.

**Acceptance Criteria:**

**Given** any element with class .reveal
**When** it enters the viewport via IntersectionObserver
**Then** class .on is added; opacity transitions 0→1 and translateY transitions 20px→0; duration 500ms ease

**Given** elements with .d1, .d2, .d3, .d4 delay classes
**When** revealed
**Then** animation delays are 0ms, 80ms, 160ms, 240ms respectively (staggered children)

**Given** prefers-reduced-motion: reduce is set
**When** any .reveal element enters the viewport
**Then** element appears at final position immediately — no animation, no delay

**Given** the IntersectionObserver callback
**When** an element is revealed
**Then** the observer disconnects from that element to prevent re-triggering on scroll back up

### Story 1.7: 404 Page

As a site visitor who hits a broken link,
I want a friendly 404 page in the new design,
So that I am not stranded.

**Acceptance Criteria:**

**Given** any route that does not match an existing page
**When** Next.js not-found.tsx renders
**Then** heading is "This reef is off the map." in Source Serif 4 300 italic

**Given** the 404 page
**When** rendered
**Then** it contains a yellow "Explore all reefs" button linking to /explore

**Given** the 404 page
**When** rendered
**Then** it uses the new light color system (white background, --color-ink text)

---

## Epic 2: Homepage — Discover Scuba Season

A first-time visitor understands both value props (research + upload) within 10 seconds and has two clear paths: Explore reefs or Upload a sighting. Globe removed from homepage.

### Story 2.1: Homepage Hero + Dual CTA

As a first-time visitor,
I want to immediately understand what Scuba Season is and have two clear action paths,
So that I can decide whether to explore reefs or submit a sighting.

**Acceptance Criteria:**

**Given** the homepage
**When** rendered
**Then** the hero occupies 100vh with a full-bleed underwater photograph background loaded via Next.js Image with priority=true

**Given** the hero
**When** rendered
**Then** it contains: eyebrow text in IBM Plex Mono 11px uppercase, an H1 headline in Source Serif 4 300 italic, and two CTA buttons

**Given** the dual CTAs
**When** rendered
**Then** "Explore reefs" is a ghost button (white border, white text) linking to /explore; "Upload a sighting" is yellow (#F6C700) with --color-ink text linking to /upload; both are side by side on desktop

**Given** mobile viewport < 640px
**When** rendered
**Then** CTAs stack vertically with yellow "Upload a sighting" first (top)

**Given** the existing dark homepage (src/app/page.tsx)
**When** replaced
**Then** the 3D globe in the hero is removed; the new photo hero replaces it

**Given** the TopNav over the hero
**When** rendered
**Then** it uses its transparent state (white links on photo)

### Story 2.2: StatStrip Component

As a site visitor scrolling past the hero,
I want to see key impact numbers,
So that I immediately grasp the scale and credibility of Scuba Season's data.

**Acceptance Criteria:**

**Given** the StatStrip
**When** it enters the viewport via IntersectionObserver
**Then** counter animations start for each stat value

**Given** a counter animation
**When** triggered
**Then** the number counts from 0 to final value over 1200ms using easeOutExpo curve

**Given** the StatStrip
**When** rendered
**Then** it has a 1.5px --color-brand-yellow top border and 1.5px --color-brand-yellow bottom border

**Given** stat values
**When** rendered
**Then** they use IBM Plex Mono 500; labels beneath use IBM Plex Sans 300

**Given** prefers-reduced-motion: reduce
**When** set
**Then** final stat values appear immediately with no counting animation

**Given** the StatStrip
**When** rendered
**Then** stat values have aria-label attributes with the final number for screen readers (not the animated partial value)

### Story 2.3: ReefStateCard Trio

As a site visitor,
I want to see three example reefs representing different health states,
So that I understand the reef state concept visually before exploring.

**Acceptance Criteria:**

**Given** the ReefStateCard section
**When** rendered on desktop
**Then** 3 cards are displayed in a row, each linking to a /locations/[slug] page

**Given** mobile viewport
**When** rendered
**Then** cards stack vertically at full width

**Given** each ReefStateCard
**When** rendered
**Then** it shows: full-bleed underwater photo with bottom gradient overlay (transparent → rgba(14,28,40,0.7)); ReefHealthBadge anchored bottom-left over the photo; location name in Source Serif 4 below

**Given** a card photo
**When** hovered
**Then** photo scales to 1.03 over 300ms ease

**Given** the 3 cards
**When** selected for the homepage
**Then** one represents Improving, one Stable, one Declining — demonstrating the full health spectrum

### Story 2.4: Featured Reef Drag-Scroll Mosaic

As a site visitor,
I want to browse a horizontal mosaic of featured reefs,
So that I discover diverse dive destinations without clicking into individual pages.

**Acceptance Criteria:**

**Given** the mosaic container
**When** rendered
**Then** it shows a horizontal row of varied-width reef cards that overflows the viewport; container has overflow-x: auto

**Given** the mosaic on desktop
**When** the user clicks and drags horizontally
**Then** the container scrolls horizontally; cursor changes to grab on hover and grabbing on mousedown

**Given** the drag interaction
**When** mousedown is pressed
**Then** isDragging is tracked; mousemove calculates delta and scrolls the container; mouseup clears drag state

**Given** the mosaic on touch devices
**When** the user swipes
**Then** native horizontal scroll is used (no JS drag handler on touch)

**Given** each mosaic card
**When** rendered
**Then** it shows: full-bleed underwater photo, location name, ReefHealthBadge; clicking navigates to /locations/[slug]

### Story 2.5: SpeciesFilmstrip Auto-Scroll

As a site visitor,
I want to see a scrolling strip of species with sighting odds,
So that I feel the diversity of marine life Scuba Season tracks.

**Acceptance Criteria:**

**Given** the SpeciesFilmstrip
**When** rendered
**Then** it auto-scrolls at 1px/frame via requestAnimationFrame

**Given** the filmstrip
**When** hovered or when a child element receives focus
**Then** auto-scroll pauses

**Given** the filmstrip
**When** pointer leaves or focus moves away
**Then** auto-scroll resumes

**Given** each species tile
**When** rendered
**Then** it shows: common name (IBM Plex Sans 500), sighting odds percentage (IBM Plex Mono 500 18px), iNaturalist photo thumbnail with photographer attribution beneath; IUCN codes and scientific names are NOT shown

**Given** prefers-reduced-motion: reduce
**When** set
**Then** auto-scroll is disabled; filmstrip renders as a static horizontally scrollable row

**Given** keyboard navigation
**When** arrow keys are pressed while filmstrip is focused
**Then** scroll position adjusts by one tile width

### Story 2.6: Citizen Science 50/50 Split + Method Strip

As a site visitor,
I want to see a section that clearly explains the upload value proposition,
So that I understand I can contribute my dive photos to science.

**Acceptance Criteria:**

**Given** the 50/50 section on desktop (≥768px)
**When** rendered
**Then** left half is a large underwater photo; right half contains copy and a yellow "Upload a sighting" CTA

**Given** mobile viewport
**When** rendered
**Then** photo stacks above copy and CTA at full width

**Given** the 50/50 copy
**When** rendered
**Then** it explains the citizen science angle in plain language (no jargon, no hyphenated compounds, no contractions) — diver submits → reaches iNat + GBIF + OBIS + iSeahorse + CoralWatch

**Given** the method strip below the 50/50 section
**When** rendered
**Then** it is a full-width dark (#14191E) strip with a one-liner about the 63-source data methodology and a "Learn more" ghost link to /method

**Given** the method strip
**When** rendered
**Then** it uses white text on --color-footer background

---

## Epic 3: Explore & Discover Reefs

Users browse all reef locations on a live map + card grid, filter by health/region/season/depth, and find dive destinations that match their goals.

### Story 3.1: FilterPill Component + Filter Bar

As an explorer,
I want to filter reefs using pills that update the URL,
So that I can share my filtered view and use the browser back button.

**Acceptance Criteria:**

**Given** the filter bar
**When** rendered
**Then** it is sticky below the nav (top: 64px); white background with 1px hairline bottom border; horizontally scrollable if pills overflow (scrollbar hidden)

**Given** a FilterPill in resting state
**When** rendered
**Then** white background, --color-ink-2 text, 1px --color-hairline border, border-radius 100px

**Given** a FilterPill in active state
**When** rendered
**Then** --color-ink background, white text, no border

**Given** a FilterPill in resting state
**When** hovered
**Then** border color transitions to --color-ink

**Given** any filter is active
**When** rendered
**Then** a "Clear all" text link in --color-ocean appears at the right end of the filter bar

**Given** a FilterPill
**When** clicked
**Then** filter state updates and the URL updates via pushState with query params (no page reload)

**Given** keyboard navigation
**When** Tab reaches a FilterPill
**Then** focus ring (2px solid #F6C700, outline-offset 2px) is visible

### Story 3.2: ReefCard Component

As an explorer,
I want location cards that show health status and key data at a glance,
So that I can quickly compare reefs.

**Acceptance Criteria:**

**Given** a ReefCard
**When** rendered
**Then** it shows: photo top (180px height, object-cover), location name (Source Serif 4 400 22px), region/country (IBM Plex Mono 11px), ReefHealthBadge, 2 key data points

**Given** a ReefCard in resting state
**When** rendered
**Then** border is 1px --color-hairline

**Given** a ReefCard
**When** hovered
**Then** border transitions to --color-ink

**Given** a ReefCard that is selected (corresponding map marker is active)
**When** rendered
**Then** border is 2px solid #F6C700

**Given** cards in a grid on desktop (≥1024px)
**When** rendered
**Then** 3 columns

**Given** cards on tablet (768–1023px)
**When** rendered
**Then** 2 columns

**Given** cards on mobile (<768px)
**When** rendered
**Then** 1 column

**Given** a card photo
**When** rendered
**Then** Next.js Image is used with object-cover; alt text is the location name

**Given** a ReefCard
**When** clicked
**Then** navigates to /locations/[slug]

### Story 3.3: Explore Page — Map + Card Grid Layout

As an explorer,
I want a split view with a map on one side and a card grid on the other,
So that I can see where reefs are geographically while browsing details.

**Acceptance Criteria:**

**Given** the Explore page at desktop (≥1024px)
**When** rendered
**Then** layout is: filter bar full-width sticky at top; below that: 42% sticky map (left) + 58% scrollable card grid (right)

**Given** mobile viewport (<1024px)
**When** rendered
**Then** map is not rendered; only the card grid is shown with filter bar above

**Given** the map
**When** rendered
**Then** the existing react-globe.gl (or adapted flat map) shows location markers colored by reef health state

**Given** a map marker
**When** clicked
**Then** the corresponding ReefCard in the grid scrolls into view and receives the selected (yellow border) state

**Given** a ReefCard
**When** hovered
**Then** the corresponding map marker pulses or highlights

**Given** the Explore page
**When** rendered
**Then** page has unique SEO title, description, and OG tags (NFR2)

### Story 3.4: URL-State Filters + Evidence Confidence Badges

As an explorer,
I want my filtered state in the URL and to see which sites have confirmed sightings,
So that I can share links and assess data quality at a glance.

**Acceptance Criteria:**

**Given** any active filter
**When** the URL is copied and shared
**Then** loading that URL reproduces the same filter state and active pill states

**Given** the browser back button
**When** pressed after applying a filter
**Then** the previous filter state is restored

**Given** a location card that has confirmed sighting records
**When** rendered
**Then** a "Confirmed sightings" indicator is visible on the card

**Given** a location with no sighting records
**When** rendered
**Then** a subtle "No sighting records yet" indicator is shown (does not use error/declining colors)

**Given** multiple filters active simultaneously
**When** applied
**Then** cards show the intersection (AND logic); count updates in real time

**Given** the "Clear all" link
**When** clicked
**Then** all filter params are removed from the URL and all pills return to resting state

### Story 3.5: Mobile Responsive — List View + Filter Sheet

As a mobile user,
I want to browse reefs without a map and have filters accessible as a full-screen sheet,
So that I can use Scuba Season comfortably on my phone.

**Acceptance Criteria:**

**Given** viewport < 1024px
**When** the Explore page loads
**Then** map is not rendered; only the card grid is shown (saves render budget)

**Given** mobile viewport
**When** rendered
**Then** a "Filter (N)" sticky button is visible at the bottom of the viewport (or below the filter bar); N reflects count of active filters

**Given** the "Filter (N)" button
**When** tapped
**Then** a full-screen filter sheet slides up from the bottom

**Given** the filter sheet
**When** open
**Then** all available filter pills are shown in a scrollable list; a yellow "Apply filters" button is at the bottom

**Given** the filter sheet "Apply filters" button
**When** tapped
**Then** the sheet closes and the card grid updates with selected filters

**Given** the filter sheet
**When** dismissed via back gesture or close button
**Then** the sheet closes without applying any changes made in the sheet

---

## Epic 4: Research a Reef & Plan Your Dive

Users deep-dive into a specific location or site — read reef health trajectory, see species sighting odds, check conditions, and plan their trip end-to-end.

### Story 4.1: Location Page Rebrand + Reef Health Panel

As a reef researcher,
I want to see a location's reef health data in the new light design,
So that I can read coral cover, bleaching, and thermal stress clearly.

**Acceptance Criteria:**

**Given** any /locations/[slug] page
**When** rendered
**Then** it uses the new light color system (white background, --color-ink text, Source Serif 4 headings, IBM Plex Sans body)

**Given** the location hero
**When** rendered
**Then** TopNav is in its transparent state; location name uses Source Serif 4 over the hero photo

**Given** the reef health panel
**When** rendered
**Then** it shows: coral cover %, bleached %, degree heating weeks (DHW), survey date, and a plain-language "diving outlook" sentence

**Given** each data point in the reef health panel
**When** rendered
**Then** a data freshness label shows source name + approximate date (e.g., "MERMAID · 2024")

**Given** the child dive sites section
**When** rendered
**Then** it shows a card grid of /sites/[slug] using the ReefCard component

**Given** the location page
**When** rendered
**Then** JSON-LD Place schema is present in the page head

### Story 4.2: CoralProjectionChart Component

As a reef researcher,
I want to see a coral cover trend chart with a projection to 2031,
So that I understand the reef's trajectory, not just its current state.

**Acceptance Criteria:**

**Given** a location with 2 or more MERMAID data points
**When** the CoralProjectionChart renders
**Then** it shows a solid line for historical coral cover data

**Given** the chart
**When** rendered
**Then** a dashed line (stroke-dasharray: 4 4) extends from the last known data point to 2031 as a projection

**Given** the chart
**When** rendered
**Then** a vertical "Today" marker line is shown at the current year position

**Given** a data point on the chart
**When** hovered
**Then** a tooltip shows year + coral cover % value

**Given** the projection band
**When** rendered
**Then** a confidence band (10% opacity fill) surrounds the dashed projection line

**Given** the chart
**When** rendered
**Then** it has role="img" aria-label="Coral cover trend for [Location Name]" and a visually hidden HTML table containing the same data as a screen reader fallback

**Given** a location with fewer than 2 MERMAID data points or no MERMAID data
**When** rendering
**Then** the chart is not shown; a DataNote component explains the data gap

### Story 4.3: Location Page — Fishing Pressure + Water Quality Panels

As a reef researcher,
I want to see fishing pressure and water quality data on a location page,
So that I understand human pressures on the reef.

**Acceptance Criteria:**

**Given** a location with GFW fishing pressure data
**When** the panel renders
**Then** it shows AIS-tracked fishing hours within 50km in plain language (e.g., "340 hours of industrial fishing detected in the past 12 months")

**Given** the fishing pressure panel
**When** rendered
**Then** it includes a caveat that artisanal and small-scale fishing is not tracked by AIS

**Given** a location with water quality event data
**When** rendered
**Then** a water quality events panel is shown

**Given** a location with no water quality event data
**When** rendered
**Then** the water quality panel is not shown (not an empty state — just absent)

**Given** all data panels
**When** rendered
**Then** they include a data freshness label (source name + date)

### Story 4.4: Dive Site Page Rebrand + Overview + Conditions Grid

As a diver planning a trip,
I want to see a dive site's overview and 12-month conditions in the new design,
So that I can pick the right month to dive.

**Acceptance Criteria:**

**Given** any /sites/[slug] page
**When** rendered
**Then** it uses the new light color system

**Given** the site hero
**When** rendered
**Then** it is an underwater photo; TopNav is in transparent state; site name is in Source Serif 4 below the hero

**Given** the 12-month conditions grid
**When** rendered
**Then** it shows water temperature (°C), visibility (m), and current strength for each of 12 months; cells are color-coded (favorable/neutral/challenging)

**Given** a site with wreck data
**When** rendered
**Then** a wreck section shows vessel name, type, sunk date, depth, and history

**Given** the site page
**When** rendered
**Then** JSON-LD TouristAttraction schema is in the page head

**Given** each data section on the site page
**When** rendered
**Then** a data freshness label appears showing source + date

**Given** the dive site page
**When** rendered
**Then** an upload nudge card (1.5px solid --color-brand-yellow border) is visible below the reef health summary section; it reads "Dived here recently?" and contains a "Submit a sighting" CTA linking to /upload?site=[slug]

**Given** the dive site page
**When** rendered
**Then** a pre-dive brief card is visible ("Planning to dive [Site Name]?") with photography guidance (what to capture, how to capture it) and a "How does this work?" expandable/modal link explaining platform routing

### Story 4.5: Species Section on Dive Site Page

As a diver,
I want to see which species have been sighted at a dive site with sighting odds,
So that I can anticipate what I might encounter.

**Acceptance Criteria:**

**Given** a dive site page
**When** the species section renders
**Then** it shows species tiles with: common name, sighting odds (e.g., "74% chance"), last confirmed date, 24-month observation count, iNaturalist photo thumbnail

**Given** a species tile
**When** rendered
**Then** IUCN codes and scientific names are NOT shown — common names only

**Given** a species photo
**When** rendered
**Then** photographer credit and CC license attribution is shown beneath the thumbnail

**Given** species data
**When** rendered
**Then** species are ordered by sighting probability, highest first

**Given** a species with no iNaturalist photo available
**When** rendered
**Then** a placeholder is shown (no broken image)

### Story 4.6: SightingLog Field Journal Component

As a diver reading a site page,
I want to see recent sightings submitted by other divers,
So that I understand what has actually been spotted here recently.

**Acceptance Criteria:**

**Given** a dive site page with submitted sightings
**When** the SightingLog renders
**Then** it shows per-entry: diver name (or "Anonymous"), date, species tags, conditions (depth, temp if recorded), photo thumbnail

**Given** the SightingLog
**When** rendered
**Then** entries are ordered newest first

**Given** more than 5 entries
**When** rendered
**Then** a "Load more" ghost button appears; clicking it loads the next 5 entries

**Given** a site with no submitted sightings
**When** the SightingLog empty state renders
**Then** it shows "No sightings recorded here yet." and a yellow "Upload the first sighting" button linking to /upload?site=[slug]

**Given** a sighting photo thumbnail
**When** rendered
**Then** it has alt text with species name or "Underwater photo"

### Story 4.7: Plan Your Trip Section

As a trip planner,
I want easy links to flights, lodging, and dive operators for a site,
So that I can start booking directly from the site page.

**Acceptance Criteria:**

**Given** the Plan Your Trip section on desktop
**When** rendered
**Then** it is a sticky sidebar on the right side of the dive site detail layout

**Given** the Plan Your Trip section on mobile
**When** rendered
**Then** a sticky "Plan my trip" button is anchored at the bottom of the viewport; tapping it opens a bottom-drawer with the full plan section content

**Given** the section
**When** rendered
**Then** it contains affiliate-tracked links for: flights, lodging, dive operators

**Given** any affiliate link
**When** clicked
**Then** a Vercel Analytics event fires with the correct event name (gear_click / lodging_click / operator_click / flight_click) and site_id context

**Given** the section
**When** rendered
**Then** an FTC affiliate disclosure statement is visible (NFR6)

---

## Epic 5: Upload a Sighting — Citizen Science

Divers submit observations from their dives in under 2 minutes, automatically routed to iNaturalist, GBIF, OBIS, iSeahorse (conditional), and CoralWatch (conditional). Backend API partially built — this epic rebuilds the UX to the approved 3-step wizard design.

### Story 5.1: Upload Wizard Layout + Step Indicator

As a diver starting the upload flow,
I want to see a clear 3-step wizard progress indicator,
So that I know how much effort is required before I commit.

**Acceptance Criteria:**

**Given** the /upload page
**When** rendered
**Then** it shows the 3-step wizard layout with the step indicator at the top

**Given** the step indicator on Step 1
**When** rendered
**Then** Step 1 circle is yellow (#F6C700) with --color-ink text; Steps 2 and 3 are white with 1px hairline border and muted text; connector lines are hairline

**Given** a completed step
**When** rendered
**Then** its circle has --color-ink background with white text; connector line to next step turns --color-ink

**Given** each step circle
**When** rendered
**Then** it is 28px diameter

**Given** step labels
**When** rendered
**Then** they use IBM Plex Mono 11px below each circle: "Dive site" / "Your sighting" / "Submit"

**Given** the wizard
**When** a step advances
**Then** focus moves programmatically to the step heading (h2) for screen reader accessibility

**Given** mobile viewport
**When** rendered
**Then** the wizard is single-column, full-width

### Story 5.2: Step 1 — Site Search + Auto-Advance

As a diver,
I want to find my dive site by typing and have the wizard advance automatically when I select it,
So that site selection feels effortless.

**Acceptance Criteria:**

**Given** Step 1 of the upload wizard
**When** rendered
**Then** it shows a search input labeled "Where did you dive?"

**Given** the search input
**When** the user types 2 or more characters
**Then** it queries the site list (fuse.js against sites.json) and shows up to 8 matching results with site name + location

**Given** a result in the dropdown
**When** selected
**Then** after a 300ms delay the wizard auto-advances to Step 2 with the site name visible as a confirmation

**Given** the user arriving at /upload with a site query param (e.g., /upload?site=[slug])
**When** the wizard loads
**Then** Step 1 is pre-filled with the site name and the wizard auto-advances to Step 2 on mount

**Given** the search input
**When** no results match the query
**Then** "Site not listed — continue anyway" option appears; clicking it advances to Step 2 with no pre-filled site

**Given** the wizard in reset mode (after "Submit another sighting")
**When** Step 1 loads
**Then** the site from the previous submission is pre-populated

### Story 5.3: Step 2 — Photo Upload with EXIF Reading + HEIC Conversion

As a diver,
I want to upload my dive photos including iPhone HEIC files,
So that I can use photos exactly as they come off my camera or phone.

**Acceptance Criteria:**

**Given** the photo upload area in Step 2
**When** rendered
**Then** it shows a drag-and-drop zone and a "Choose files" button

**Given** a JPEG, PNG, WebP, or HEIC file
**When** uploaded
**Then** it is accepted and shown as a thumbnail with a remove button

**Given** a HEIC file
**When** uploaded
**Then** it is accepted client-side and queued for server-side conversion to JPEG before iNaturalist submission

**Given** a RAW file (.ARW, .CR2, .NEF, or similar)
**When** dropped or selected
**Then** it is rejected client-side with the message "Please export as JPEG before uploading"

**Given** a file larger than 20 MB
**When** selected
**Then** it is rejected client-side with a file size error message before any upload begins

**Given** an uploaded photo with EXIF date data
**When** processed client-side
**Then** the date field in Step 2 details is pre-filled with the EXIF date

**Given** up to 10 photos
**When** uploaded
**Then** all are accepted and shown in a thumbnail grid with individual remove buttons

**Given** an 11th photo
**When** dropped or selected
**Then** it is rejected with "Maximum 10 photos per sighting"

### Story 5.4: Step 2 — Category Selector + Species Chips + Coral Fields

As a diver,
I want to categorize my sighting and optionally tag species using chips,
So that my data is routed to the right scientific databases.

**Acceptance Criteria:**

**Given** Step 2
**When** rendered
**Then** three large category tap targets are shown: "Fish or marine life" / "Coral" / "Not sure / something else"

**Given** "Coral" selected
**When** rendered
**Then** two additional fields appear inline: Depth (metres, number input) and Bleaching score (single-select: Healthy / Pale / Bleached / Dead)

**Given** "Fish or marine life" or "Not sure" selected
**When** rendered
**Then** coral-specific fields (depth, bleaching score) are hidden

**Given** the species text input
**When** the user types 2 or more characters
**Then** the iNaturalist taxon API is queried and up to 6 results are shown with common name + scientific name

**Given** a taxon result
**When** selected
**Then** a species chip is added to the form

**Given** a selected taxon in genus Hippocampus
**When** chip is added
**Then** a "+ iSeahorse" badge appears next to the chip

**Given** up to 8 species chips
**When** rendered
**Then** all are shown; a 9th selection attempt is rejected with a message

**Given** a species chip
**When** its remove button is clicked
**Then** the chip is removed and the iSeahorse badge disappears if it was triggered by that species

### Story 5.5: Step 3 — Identity Gate + Review + Submit

As a diver,
I want to review my sighting and choose whether to sign in before submitting,
So that I understand what will happen to my data before committing.

**Acceptance Criteria:**

**Given** Step 3
**When** rendered
**Then** it shows a sighting summary: site name, category, species (if entered), depth (if entered), date, photo thumbnails (first 3 shown)

**Given** Step 3
**When** rendered
**Then** it shows the platform routing list: always iNaturalist, GBIF, OBIS; conditionally iSeahorse (if Hippocampus selected); conditionally CoralWatch (if Coral + depth + bleaching score provided)

**Given** the identity gate
**When** rendered
**Then** two options are shown: "Submit as guest (via Scuba Season)" and "Sign in with iNaturalist"

**Given** guest path selected and Submit clicked
**When** submitted
**Then** submission proceeds under the ScubaSeason iNaturalist account without any per-user OAuth

**Given** "Sign in with iNaturalist" clicked
**When** clicked
**Then** iNaturalist OAuth flow opens; on return, user identity is confirmed and submission proceeds

**Given** the Submit button
**When** clicked
**Then** a loading state is shown and the button is disabled to prevent double-submit

**Given** a successful submission
**When** completed
**Then** the wizard transitions to the BroadcastConfirmation screen

**Given** the user attempts to submit
**When** fewer than 1 photo has been uploaded OR no site has been selected
**Then** the Submit button is disabled and an inline validation message identifies the missing required field

### Story 5.6: BroadcastConfirmation Screen

As a diver who just submitted a sighting,
I want to see which platforms received my sighting with a satisfying staggered reveal,
So that I feel the impact of my contribution.

**Acceptance Criteria:**

**Given** a successful submission
**When** the BroadcastConfirmation renders
**Then** heading is "Your sighting is on its way!" in Source Serif 4 300 italic

**Given** the platform rows
**When** they appear
**Then** they stagger at 0 / 400 / 800 / 1200ms delays: iNaturalist ✓, GBIF ✓, OBIS ✓

**Given** iSeahorse was triggered (Hippocampus species submitted)
**When** rows appear
**Then** iSeahorse ✓ is appended after OBIS

**Given** CoralWatch was triggered (Coral + depth + bleaching score provided)
**When** rows appear
**Then** "CoralWatch (weekly batch)" ✓ is appended last

**Given** the checkmark characters
**When** rendered
**Then** they use --color-improving (#2E7D5B) — never yellow (#F6C700)

**Given** the confirmation screen
**When** rendered
**Then** NO yellow (#F6C700) is used anywhere on this screen

**Given** the confirmation screen
**When** rendered
**Then** it contains: "Find your observation on iNaturalist" link in --color-ocean; "Submit another sighting" ghost button (resets wizard to Step 1 with site context); "Back to [site name]" ghost button

**Given** prefers-reduced-motion: reduce
**When** set
**Then** all platform rows appear simultaneously without stagger

**Given** the confirmation aria-live region
**When** rows appear staggered
**Then** aria-live="polite" announces each platform name as it appears

### Story 5.7: iNaturalist API Submission Sequence

As the system,
I want to submit sightings to the iNaturalist API in the correct sequence,
So that observations appear on iNaturalist with photos and optional project tags.

**Acceptance Criteria:**

**Given** a completed submission
**When** the /api/submit-sighting API route is called
**Then** it executes in order: POST /observations → POST /observation_photos for each photo → POST /project_observations if taxon is Hippocampus (project_id=871)

**Given** a matched taxon_id from the species autocomplete
**When** the observation is posted
**Then** taxon_id is included in the POST /observations payload

**Given** an unmatched free-text species
**When** the observation is posted
**Then** species text is included in the description field; the internal record is flagged as needs_review

**Given** photo GPS from EXIF
**When** processed
**Then** lat/lon are NOT taken from EXIF; dive site lat/lon from the sites.json record is used for all observations

**Given** a HEIC photo in the upload
**When** the API route processes it
**Then** sharp (or equivalent server-side library) converts HEIC to JPEG before upload to iNaturalist

**Given** a successful iNaturalist submission
**When** completed
**Then** a Telegram alert is sent to chat_id 1289833065: "✅ New sighting submitted — [Site Name] · [Category] · [Species or Unknown] · iNat observation: [URL]"

**Given** a submission with multiple species chips selected
**When** the API route processes it
**Then** it creates one separate iNaturalist observation per taxon — not one observation with multiple taxa; this backend split is transparent to the user who sees one unified form

### Story 5.8: Error Handling, Retry Logic + CoralWatch Queue

As an operator,
I want failed submissions to be retried automatically and coral sightings queued for CoralWatch,
So that no diver contribution is lost and CoralWatch receives its weekly data.

**Acceptance Criteria:**

**Given** an iNaturalist API failure (5xx or network error)
**When** the submission is attempted
**Then** it is retried up to 3 times with exponential backoff: 1s, 2s, 4s delays

**Given** all 3 retries exhausted
**When** all fail
**Then** the submission is stored locally with failed status; user sees "We will resubmit your photo within 24 hours"; Telegram alert fires: "❌ Sighting submission FAILED — [Site Name] · Error: [message] · Stored for manual review"

**Given** a Coral submission with category=Coral AND depth AND bleaching score provided
**When** submitted to iNaturalist
**Then** a CoralWatch queue record is written with all required fields mapped from the submission

**Given** a Coral submission missing depth OR bleaching score
**When** submitted
**Then** it goes to iNaturalist only; CoralWatch queue record is NOT written; no error is shown to the user

**Given** the CoralWatch queue
**When** the weekly batch job runs (Mondays)
**Then** all pending records are processed; records are marked submitted; Telegram batch summary fires: "🪸 CoralWatch weekly batch complete · [N] records submitted · [M] pending next week"

**Given** the CoralWatch batch job fails
**When** the batch runs
**Then** records remain as pending; Telegram failure alert fires: "❌ CoralWatch batch FAILED · [N] records stuck in queue · Manual intervention required"

---

## Epic 6: Method & About Pages

Users understand the data methodology and read the founder story — both in the new visual identity. Cert-level landing pages are out of scope for this rebrand.

### Story 6.1: Method Page Rebrand + Data Transparency Content

As a reef researcher,
I want to read how Scuba Season's data is sourced and what each source's freshness status is,
So that I can assess the reliability of what I am seeing.

**Acceptance Criteria:**

**Given** the /method page
**When** rendered
**Then** it uses the new light design system (Source Serif 4 headings, IBM Plex Sans body, white background, --color-ink text)

**Given** the data sources section
**When** rendered
**Then** it lists all sources with: source name, what it measures, status (live / scheduled / snapshot), and approximate refresh cadence

**Given** each data source entry
**When** rendered
**Then** it links to the source's website

**Given** the page
**When** rendered
**Then** methodology citations are explained in plain language — no IUCN codes, no jargon, no hyphenated compounds

**Given** the page
**When** rendered
**Then** it has a unique SEO title, description, and OG tags

### Story 6.2: About Page Rebrand (Preserve Founder Voice)

As a visitor wanting to understand who built Scuba Season,
I want to read Josie's story in her own voice,
So that I understand the human behind the data.

**Acceptance Criteria:**

**Given** the /about page
**When** rendered
**Then** it uses the new light design system for layout, nav, and footer

**Given** the /about page content
**When** rendered
**Then** the existing text and Josie's first-person voice is preserved exactly — no rewording, no shortening, no simplification

**Given** the /about page
**When** rendered
**Then** it is intentionally text-heavy; this is an explicit design exception and must not be flagged as a UI issue

**Given** the about page
**When** rendered
**Then** the full FTC affiliate disclosure text is present on this page

**Given** the about page
**When** rendered
**Then** it has a unique SEO title, description, and OG tags

### Story 6.3: Species Explorer Pages Rebrand

As a diver interested in a specific marine species,
I want to read where to find that species in the new design,
So that I can plan a dive around a specific encounter.

**Acceptance Criteria:**

**Given** any /where-to-see/[species] page
**When** rendered
**Then** it uses the new light design system

**Given** the species page
**When** rendered
**Then** it shows: top 6 dive sites ranked for that encounter, all atlas locations by region where the species appears, best months, ethics notes

**Given** species names throughout the page
**When** rendered
**Then** common name only is used in headings and body copy — no IUCN codes, no scientific names in user-facing text

**Given** the species page
**When** rendered
**Then** JSON-LD schema is present in the page head

**Given** the species page
**When** rendered
**Then** SEO title, description, and OG tags reference the species common name
