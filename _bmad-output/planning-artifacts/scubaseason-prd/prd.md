---
title: scubaSeason.Fun — PRD
created: 2026-05-15
updated: 2026-06-03
status: final
finalized_by: John (bmad-agent-pm) via bmad-prd
intent: update
---

# scubaSeason.Fun — PRD

## 1. Context & Why

scubaSeason.fun is a **reef intelligence platform for divers** — not a generic trip planner. The moat is depth and honesty: when a species actually shows up, what the reef looks like now versus a decade ago, what the fishing pressure is, and what the trip really costs. No dive search tool gives you that at scale.

**One-sentence test for a new visitor:** _"This is the site that tells me the truth about when and where I'll actually see the thing I'm diving for."_

**Current state (June 2026):**

- **380 dive sites** across **113 locations** — fully navigable with species, conditions, reef health, and trip planning data on every page.
- **10 live routes:** home atlas, sites directory, site detail, location detail, species explorer, cert-level landing pages, `/faq`, `/data`, `/about`, sitemap.
- **Sighting evidence:** 442 records across 244 sites. **136 sites (36%) still have zero sighting evidence** — the single largest trust gap for the species-chaser audience.
- **Reef health:** nightly NOAA thermal stress integration (live), coral cover snapshots, fishing pressure (GFW, refreshed weekly), water quality events. Reef state classified as Thriving / Under pressure / Witnessing change.
- **Affiliate monetization:** live — lodging, operators, gear links with Vercel Analytics tracking.
- **Data transparency:** `/data` and `/faq` document exactly what's live, what's a snapshot, and what we can't see.

**Why this PRD now:** the product exists and is navigable. The gaps are evidence depth (136 zero-evidence sites), polish (user flows not documented, homepage positioning), and completeness for grant/partnership credibility (Schmidt Marine, NatGeo).

---

## 2. Target Users

**The full diver spectrum, segmented by certification + recency.** The core moat segment is the **advanced species chaser** — the diver asking "where and when will I reliably see a hammerhead?" Evidence quality is their filter. Beginners are also served and represent higher affiliate revenue per visit (full kit purchases).

| Segment | Cert | What they need | Primary flow |
|---|---|---|---|
| Curious / first-timer | none | Where to try diving; safe beginner destinations | `/for/never-dived`, cert-level landing |
| Beginner | Open Water | First-trip destinations; easy conditions; starter gear | `/for/open-water`, site cards filtered by skill |
| Returning | OW/AOW, 2+ yrs ago | Refresher-friendly sites; conditions briefing | Site detail conditions grid |
| Intermediate | AOW + 20-100 dives | Variety: drift, night, deeper | Filter by dive type + skill |
| **Advanced / species chaser** | Rescue/DM/tech + 100+ dives | Species evidence, reef state, conditions depth | **Core target** — `/where-to-see/[species]`, site detail species section |
| Pro / Tech | Instructor/tech | Niche conditions, data provenance, methodology | `/data`, site detail full conditions grid |
| Conservation-curious | any cert | Reef health trends, what's at risk | Location reef-health panel, IUCN badges, `/faq` |

**Not the target (v1):** snorkelers, free-divers (different gear funnel, different content).

**Key positioning constraint:** the species-chaser promise ("honest evidence") fails if 36% of sites show no sighting data. Evidence backfill is a product integrity issue before it is a feature request. No site should promise what it can't back with data.

---

## 3. Scope

### Live (built)

1. **Reef atlas home** — interactive 3D globe, filterable by condition, season, skill, region, heat, animal tags
2. **Dive site detail pages** — species evidence, 12-month conditions, reef health, Plan Your Trip (flights / lodging / operators), gear
3. **Location pages** — reef health snapshot, coral cover, fishing pressure, water quality, sites within
4. **Sites directory** — searchable, filterable card grid
5. **Species explorer** (`/where-to-see/[species]`) — 11 curated bucket-list encounters
6. **Cert-level landing pages** (`/for/[cert]`) — 6 cert levels, filtered sites + gear
7. **Affiliate monetization** — lodging, operators, gear with Vercel Analytics tracking
8. **Data transparency** — `/data`, `/faq`, per-claim source + methodology links; IUCN + GFW data refreshed weekly via automated workflows
9. **SEO foundation** — sitemap, JSON-LD schema, OG metadata

### In scope (next)

1. **Sighting evidence backfill** — close the 136 zero-evidence sites gap (Phase 7 priority)
2. **Evidence confidence indicator on site cards** — visually mark which sites have confirmed sighting records during backfill, so the species-chaser promise stays honest before 100% coverage is reached
3. **Reef health backfill** — ~5 locations still missing a reef-health record
4. **MERMAID API integration** — multi-year coral cover trend (currently 2 data points only)
5. **Trip planner completeness** — verify and finish the trip-planning funnel (OQ-3; `/plan` route referenced in implementation roadmap)
6. **Homepage 10-second clarity** — species-chaser evidence promise legible in first glance

### Non-Goals (v1)

- User accounts, dive logs, social features, reviews
- Booking *through* the platform — affiliate links out only
- Mobile apps (responsive web only)
- User-submitted sighting data / community contributions (sourced from GBIF/OBIS/iNat)
- Real-time operator availability or pricing
- Species taxonomy explorer beyond the 11 curated encounters
- Trip itinerary builder (deferred — verify `/plan` completeness first)

---

## 4. Information Architecture

```
/                           Home — 3D globe atlas, filter rail, location cards
/sites                      Sites directory — searchable/filterable card grid
/sites/[slug]               Dive site detail — species, conditions, reef health, gear, Plan Trip
/locations/[slug]           Location overview — reef state, coral cover, fishing pressure, site list
/where-to-see/[species]     Species explorer — where/when/how likely to see a specific animal
/for/[cert]                 Cert-level landing — filtered sites + gear for diver level
/about                      About, editorial independence, affiliate disclosure
/faq                        Data methodology FAQ — how metrics are calculated, data sources
/data                       Data transparency — what's live, what's a snapshot, what's missing
```

**Two-tier data model:** Location (geographic container, 113 records) → Site (individual dive site, 380 records). Sites belong to one Location. Globe markers represent Locations; clicking surfaces child Sites.

**Supporting data layers (not separate routes — power the detail pages):**
- Sighting evidence (442 records, GBIF/OBIS/iNaturalist — CC-licensed; see OQ-9 on commercial licensing)
- Reef health (116 records, NOAA nightly thermal live + survey snapshots)
- Fishing pressure (Global Fishing Watch, refreshed weekly via automated workflow)
- IUCN conservation status (258 species have data in the dataset; display is feature-flagged pending commercial license — see OQ-6)
- Water quality events (23 records)
- Wreck data (30 records, linked to sites)
- Gear catalogue (32 items, referenced by ID across sites)
- Methodology + source registry (63 sources, per-claim citations)

---

## 5. User Flows

### UF1 — Species Chaser: Planning a trip to see a specific animal

**Protagonist:** Rafa, 34, Divemaster, has 200+ dives, specifically wants to see whale sharks.

1. Lands on `scubaseason.fun` via search ("best places to see whale sharks diving")
2. Hits `/where-to-see/whale-sharks` — sees top 6 sites ranked by evidence quality, primary/secondary/emerging regions, best months, difficulty rating, ethics notes
3. Clicks through to a primary region (e.g. Ningaloo, Western Australia) → `/locations/ningaloo`
4. Reads reef state (Thriving / Under pressure), coral cover trend, fishing pressure
5. Clicks into a specific site → `/sites/navy-pier-exmouth`
6. Reads species section: whale shark sighting reliability = "seasonal," best months April–June, last confirmed date, iNat record count
7. Checks 12-month conditions grid: water temp, viz, current strength for April
8. Uses sticky **Plan Your Trip** panel: books flights via Skyscanner affiliate link, picks a liveaboard via LiveaboardBookings
9. Reads site-specific gear block: "3mm shortie, SMB with reel, wide-angle lens"
10. Leaves with a flight tab open and a clear go/no-go decision for April

**Success signal:** affiliate click on lodging or operator; session depth > 3 pages; session time 4–8 min.

---

### UF2 — Beginner: Planning a first real dive trip

**Protagonist:** Priya, 26, just got Open Water certified, wants a "safe first real trip."

1. Lands on home atlas via Instagram link ("best beginner dive destinations")
2. Sees filter rail — clicks "Skill: Beginner"
3. Globe dims non-beginner-safe locations; location cards show only beginner-appropriate sites with condition badge (Thriving preferred)
4. Alternatively navigates to `/for/open-water` from the nav — sees curated beginner-safe sites, starter gear block, safety notes (DAN link)
5. Clicks a location (e.g. Maldives) → `/locations/maldives` — reads season, trip duration, conditions
6. Clicks a site → `/sites/banana-reef` — reads depth range (5–18m), skill level badge, species section (mantas, reef sharks)
7. Gear section shows **Layer A** (cert-level base kit: BCD, reg, wetsuit appropriate for water temp) + **Layer B** (site-specific: "no reef hook needed, current is mild")
8. Books via affiliate link. Clicks Amazon Associates link for BCD
9. Leaves with operator and gear cart open

**Success signal:** gear affiliate click (Layer A — highest ticket value for beginners); lodging click.

---

### UF3 — Conservation-curious: Understanding reef health

**Protagonist:** Mia, 41, Advanced diver, cares about reef degradation, wants to know "how bad is it, really?"

1. Lands on `/faq` or `/data` via Google ("is the Great Barrier Reef dying diving")
2. Reads `/data` — understands what's live (NOAA nightly), what's a snapshot (coral cover surveys), what we can't see (site-level ocean acidification)
3. Navigates to home atlas — filters by "Witnessing change" reef state
4. Globe highlights locations in decline — clicks one (e.g. Great Barrier Reef)
5. Reads location page: coral cover 14% (was 28% in 2016), bleaching %, DHW (Degree Heating Weeks) thermal stress, fishing pressure, water quality events
6. Clicks into a specific site — reads diving outlook note and methodology claim links (AIMS LTMP, GBRMPA sources)
7. Shares the location page URL with a dive club WhatsApp group

**Success signal:** `/faq` or `/data` → location page session (conservation-to-trip funnel); social share (organic acquisition).

---

### UF4 — Returning diver: Picking a destination after a 3-year break

**Protagonist:** James, 38, AOW, last dove 3 years ago, "I want somewhere easy to shake off the rust."

1. Lands on home, applies filter "Last dive: 2+ years ago" + month filter for his travel window (January)
2. Sees locations where January is in-season AND conditions are calm
3. Clicks `/for/advanced-open-water` — sees diver profile copy: "You've got the cert, maybe just a refresher dive to knock the cobwebs off."
4. Reads refresher tips inline; sees sites tagged "Refresher-friendly" (calm entry, good visibility, trustworthy operators)
5. Clicks into a site, reads conditions grid for January, books an operator with "refresh course available" note

**Success signal:** operator affiliate click; page views > 4 (browsing multiple sites).

---

### UF5 — Direct SEO landing: arriving cold on a site or species page

**Protagonist:** Alex, any cert, Googles "best time to dive Komodo" and lands directly on `/sites/batu-bolong` — has never seen the atlas.

1. Lands on site detail page cold — no prior context, no filter state
2. Hero strip orients immediately: site name, location, reef state badge, in-season indicator
3. Overview paragraph gives a 3-sentence pitch: what makes the site worth the trip
4. Species section answers the search intent: what they'll see, reliability, best months
5. Conditions grid answers "best time": month-by-month at a glance
6. Plan Your Trip sidebar is visible on first scroll — Getting there, Where to stay, Who to dive with
7. Related Sites at the bottom keeps them in the product if this site doesn't fit

**Success signal:** affiliate click within the session; related site click (signals product stickiness from a cold entry). This is the highest-volume acquisition path — SEO ranking on site + species queries.

**Design implication:** the site detail page must be fully self-contained. A cold visitor who never sees the atlas must be able to orient, trust the data, and reach a booking decision from a single page.

---

## 6. Features & Functional Requirements

### F1 — Reef Atlas Home (`/`)

**Status: Built**

- **FR1.1** Interactive 3D globe (react-globe.gl / Three.js). Location markers colored by reef state and in/out-of-season status.
- **FR1.2** Filter rail: reef condition (Thriving / Under pressure / Witnessing change), month range, skill level, region, thermal heat level, animal tags (Sharks, Mantas, Turtles, Whales, Dolphins, Dugongs), freshness toggle, sort options.
- **FR1.3** Filters are URL-state — shareable, back-button-safe.
- **FR1.4** Location cards show: name, reef state badge, season indicators, heat level, survey age (data freshness label).
- **FR1.5** Globe and card grid update live on filter change, no full reload.
- **FR1.6** Mobile: globe degrades to map/list. Filter rail collapses to bottom sticky "Filter (N)" button → full-screen sheet.

**Open:** First-visit cert/recency prompt (banner pre-filling filters, stored in localStorage) — was designed in UX notes, **not confirmed built** (see OQ-4). FR1.2 lists "Last dive" recency as a filter; verify this is implemented before closing OQ-4.

---

### F2 — Dive Site Detail Page (`/sites/[slug]`)

**Status: Built**

- **FR2.1** Page sections: Overview, Species & What You'll See, 12-month Conditions grid, Reef Health snapshot, Plan Your Trip (sticky sidebar), Gear (inline in content column), Related Sites.
- **FR2.2** Species section merges curated species list with sighting-evidence records: common + scientific name, IUCN badge (when enabled), reliability (year-round / seasonal / rare), last confirmed date, 24-month rolling record count, proximity radius, iNaturalist photo + attribution.
- **FR2.3** Conditions grid: 12 columns (months), water temp range, visibility range, current strength. Color-coded per current level.
- **FR2.4** Reef health on site page: links to parent location reef state; DHW thermal stress if applicable.
- **FR2.5** Gear section — two-layered:
  - **Layer A (cert-level base kit):** adapts to the site's cert-level floor (e.g., "Advanced: 5mm wetsuit, computer with nitrox").
  - **Layer B (site-specific add-ons):** constant per site (e.g., "reef hook required at Castle Rock — strong current").
- **FR2.6** Plan Your Trip sticky sidebar (desktop) / bottom-drawer CTA (mobile): Getting there → Where to stay → Who to dive with. All affiliate-tracked.
- **FR2.7** Wreck data displayed when site has associated wreck records: vessel name, type, sunk date, depth range, history.
- **FR2.8** Static generation (`generateStaticParams`) for SEO. JSON-LD `TouristAttraction` schema per site.
- **FR2.9** Methodology + source citations inline — every quantitative claim links to source + methodology claim IDs.

---

### F3 — Location Page (`/locations/[slug]`)

**Status: Built**

- **FR3.1** Reef health panel: coral cover % (current vs. historical), bleached %, mortality %, thermal stress (DHW from NOAA nightly), survey date + method, diving outlook note.
- **FR3.2** Fishing pressure panel: Global Fishing Watch (GFW) visible AIS (Automatic Identification System)-tracked fishing hours within 50km, with caveats on artisanal fishing blind spots.
- **FR3.3** Water quality events (when present): severity, worst months, microplastics level, diving impact.
- **FR3.4** Sites within location: card grid of child dive sites.
- **FR3.5** Plan Your Trip sidebar: Getting there, lodging options (tier-badged $–$$$$), dive operators.
- **FR3.6** Gear section (general for the location/conditions).
- **FR3.7** JSON-LD `Place` schema per location.

---

### F4 — Sites Directory (`/sites`)

**Status: Built**

- **FR4.1** Card grid of all 380 sites, default-sorted by editorial rank.
- **FR4.2** Free-text search across site name, location, country, species (common + scientific).
- **FR4.3** Filter controls matching the atlas home filter set.
- **FR4.4** Each card: site name, location, hero image, skill level, best months, dive types.
- **FR4.5** URL-state filters — shareable.

---

### F5 — Species Explorer (`/where-to-see/[species]`)

**Status: Built — 11 encounters**

- **FR5.1** One page per curated bucket-list encounter (sardine run, whale shark, great white cage, manta ray, etc.).
- **FR5.2** Hero section: encounter name, conservation status (IUCN badge when enabled), short description.
- **FR5.3** Top 6 sites ranked by editorial score.
- **FR5.4** All atlas locations grouped by region: primary / secondary / emerging / closed status.
- **FR5.5** Best months, difficulty rating, required experience level.
- **FR5.6** Ethics notes (cetacean distancing, touch-nothing) + conservation notes.
- **FR5.7** Links back to site detail pages for each listed site.
- **FR5.8** JSON-LD species schema.

**Gap:** 11 encounters covers only the highest-profile species. The 136 zero-evidence sites represent the more urgent gap — evidence backfill serves the species chaser on any site, not just the curated 11.

---

### F6 — Cert-Level Landing Pages (`/for/[cert]`)

**Status: Built — 6 cert levels**

- **FR6.1** One page per certification level: never-dived, open-water, advanced, rescue, divemaster, tech.
- **FR6.2** Intro copy specific to cert level: training requirements, depth limits, realistic expectations.
- **FR6.3** Safety warnings for beginners (DAN medical guidance link).
- **FR6.4** Filtered locations: sites whose skill floor matches or is below that cert.
- **FR6.5** Cert-appropriate gear recommendations from gear catalogue.
- **FR6.6** Methodology explanation: how sites are matched to certs.

---

### F7 — Affiliate Monetization

**Status: Built**

- **FR7.1** `AffiliateLink` component wraps all monetized links — fires Vercel Analytics event (gear_click, lodging_click, operator_click, flight_click) with site_id, partner, product_id context.
- **FR7.2** Affiliate disclosure: "Some links earn us a commission" adjacent to link blocks; full policy at `/about`.
- **FR7.3** Non-affiliate operator links allowed (plain links, no disclosure marker) when no affiliate partner exists — transparency over revenue purity.
- **FR7.4** No paid placement. Recommendations are editorial. Affiliate ≠ ranking influence.
- **FR7.5** Analytics: Vercel Analytics (cookieless) — no cookie banner required.

---

### F8 — Data Transparency

**Status: Built**

- **FR8.1** `/data` page documents: what's live (NOAA nightly), what's a snapshot (coral cover, fishing, IUCN), what we can't see (site-level ocean acidification, artisanal fishing, fish biomass trends).
- **FR8.2** `/faq` documents how each metric is calculated: coral cover projection methodology, DHW formula, reef state thresholds, sighting evidence 24-month window.
- **FR8.3** Per-claim source + methodology citations on site and location detail pages.
- **FR8.4** 63-entry source registry (`sources.json`), per-methodology claim IDs (`methodologies.json`).
- **FR8.5** Data freshness labels on every panel showing survey age.
- **FR8.6** IUCN + GFW data refreshed weekly via automated workflows; `/data` page reflects last-refreshed timestamp.

---

### F9 — Sighting Evidence Backfill *(In scope — next)*

**Status: Not started**

- **FR9.1** All 380 sites must have at least 1 sighting evidence record. Current gap: 136 sites at zero.
- **FR9.2** Backfill priority order: by editorial rank descending (highest-ranked zero-evidence sites first), since no traffic data exists to prioritize by demand.
- **FR9.3** Evidence confidence indicator on site cards and site detail hero: visual badge distinguishing "Confirmed sightings on record" vs. "No sighting records yet." Badge persists until a site reaches ≥1 confirmed record. Keeps the species-chaser promise honest during backfill.
- **FR9.4** Acceptance criteria: zero-evidence site count < 20 (from current 136). Measured via `sightings.json` record count per site.

---

### F10 — MERMAID Coral Cover Integration *(In scope — next)*

**Status: Not started**

- **FR10.1** Integrate MERMAID open API to retrieve multi-year coral cover survey records per location.
- **FR10.2** Location reef health panel displays a time-series trend (≥3 data points) rather than a before/after comparison.
- **FR10.3** Acceptance criteria: at least 5 locations show a multi-year coral cover trend with ≥3 MERMAID data points. No partnership negotiation required — MERMAID API is open.

---

### F11 — Homepage Positioning Clarity *(In scope — next)*

**Status: Not started**

- **FR11.1** A first-time visitor must be able to articulate the site's value proposition within 10 seconds, without scrolling.
- **FR11.2** Above-the-fold copy explicitly communicates: (a) this is evidence-first, not editorial; (b) the species-chaser use case; (c) the reef health intelligence layer.
- **FR11.3** Acceptance criteria: heuristic audit by 3 people unfamiliar with the site — all 3 can correctly describe the site's primary use case after viewing the homepage for 10 seconds.

---

## 7. Non-Functional Requirements

- **NFR1 — Performance.** Site detail pages: LCP < 2.0s on 4G. Statically generated, image-optimized via Next.js `<Image>`.
- **NFR2 — SEO.** Every page indexable, unique title/description/OG. Sitemap includes all 380 sites, 113 locations, 11 encounters, 6 cert pages. JSON-LD schema.org markup per page type.
- **NFR3 — Accessibility.** WCAG AA on text contrast and keyboard nav. Globe has non-globe fallback (list view / `/sites`).
- **NFR4 — Mobile.** Responsive. Globe degrades to list on small screens. Plan Your Trip becomes sticky bottom button → drawer. Filters collapse to sheet.
- **NFR5 — Data integrity.** Every quantitative claim (coral cover %, DHW, sighting count) traceable to source + methodology. No headline stat without a cited confidence level or caveat.
- **NFR6 — Compliance.** FTC affiliate disclosure on every page with affiliate links. Vercel Analytics is cookieless — no cookie banner needed.

---

## 8. Revenue Model

**Two co-equal revenue lines: trip-booking affiliate + gear affiliate.**

**Trip-booking funnel** (flights → lodging → operator):
- **Flights:** Skyscanner / WayAway affiliate deep-linked to nearest hub
- **Lodging:** Booking.com (general) + LiveaboardBookings.com (liveaboard specialist)
- **Operators:** PADI Travel + Bluewater where available; plain links where not — transparency over revenue
- Surfaces in the "Plan Your Trip" sticky sidebar on site + location detail pages

**Gear funnel** (cert-appropriate base kit + site-specific add-ons):
- **Amazon Associates** — broad coverage, fast approval, beginner kit volume
- **Dive specialty retailers** (DGX, Divers Direct, Leisure Pro, Scuba.com) — higher commissions on specialty gear
- Gear catalogue in `gear.json`, referenced by ID from site records — one partner swap updates everywhere
- Surfaces in gear section on site detail pages + cert-level landing pages

**Why both lines:** a beginner planning a first trip clicks booking *and* gear (full kit purchase — highest ticket, highest intent). An advanced species chaser booking Komodo already has gear but books a liveaboard + may add a reef hook. Gear is higher frequency, booking is higher dollar per click — both captured.

**Counter to avoid:** do not optimize for affiliate revenue per session. Weak recommendations erode the trust moat.

---

## 9. Success Metrics

**Leading indicators (week 1–4 post full launch):**
- Sessions reaching a site detail page / total sessions > 30% *(baseline: 0% today — site detail pages are new as primary entry)*
- Median session depth > 2 pages *(travel/research sites typically 2.5–4 pages; 2 is the floor for a research tool)*
- % sessions setting a skill/cert filter > 20%
- Time-to-first affiliate click < 90 seconds on site detail pages

**Lagging indicators (month 2+):**
- Gear affiliate CTR > 4% *(industry benchmark for travel-adjacent affiliate sites: 2–6%; 4% is achievable with strong product-fit recommendations)*
- Booking affiliate CTR > 5% *(Booking.com and liveaboard affiliates in travel niche: 3–8% CTR; 5% is realistic with a high-intent audience)*
- At least 1 converted gear sale/week + 1 converted booking/month by month 2
- Revenue diversification: neither line < 20% of total affiliate revenue

**Acquisition signals (for grant/partnership reviewers):**
- Organic search impressions growing month-over-month (Google Search Console)
- At least 3 ranking positions in top 10 for target species/site queries by month 3
- At least 1 inbound link from a dive publication or conservation organization by month 3

**Grant/partnership credibility signals:**
- Zero-evidence site count < 20 (from current 136)
- Reef health coverage: 100% of locations have at least one reef-health record
- Data page bounce rate < 40% (signals researchers engaging, not bouncing)

**Counter-metrics — do NOT optimize:**
- Time on site (longer ≠ better for a research tool; can signal confusion)
- Total page views (incentivizes thin content)
- Affiliate revenue per session (incentivizes pushing weak recommendations)

---

## 10. Open Questions

| # | Question | Status | Blocking? |
|---|---|---|---|
| OQ-1 | **Sighting evidence backfill order** — no search analytics to prioritize by traffic. Defaulting to editorial rank order (FR9.2). | Open | Blocks moat integrity |
| OQ-2 | **MERMAID API integration** — coral cover has only 2 data points today. Open API, no partnership negotiation needed. | Open | Blocks Schmidt Marine credibility story |
| OQ-3 | **Trip planner completeness** — the full booking funnel (flights → lodging → operator, with cost estimates) has not been verified end-to-end against what's currently built on the site. | Open | Blocks funnel revenue path |
| OQ-4 | **First-visit cert/recency prompt + "Last dive" filter** — designed (UX notes: inline banner, localStorage), not confirmed built. UF4 step 1 depends on "Last dive: 2+ years ago" filter in FR1.2; verify current implementation. | Open | Non-blocking for content; blocks UF4 personalization path |
| OQ-5 | **Homepage 10-second positioning** — does a cold visitor immediately understand "evidence-first dive research"? Needs heuristic audit (see FR11.3). | Open | Non-blocking; affects organic conversion |
| OQ-6 | **IUCN display licensing** — 258 species have IUCN data in the dataset; display is feature-flagged pending a commercial license (~$0–$5k/yr). Must be resolved before any grant application highlighting species conservation. | Open | Non-blocking now; blocks grant applications |
| OQ-7 | **Grant deadline** — `docs/grants-charter.md` does not exist; no confirmed live deadline. | Open | Affects priority urgency |
| OQ-8 | **Region-of-origin for trip cost ranges** — US / EU / AU? Affects which lodging and flight options to surface first. | Open | Blocks Phase 9 trip cost display |
| OQ-9 | **GBIF/OBIS/iNaturalist commercial licensing** — sighting data carries CC non-commercial default licenses. An affiliate-monetized site needs per-source license verification or a data use agreement. More urgent than OQ-6 — affects the entire sighting evidence layer. | Open — legal check needed | Potentially blocks affiliate monetization on sightings-backed pages |

---

## 11. Build Order (current + next)

**Done:** All routes, data layers, affiliate tracking, and SEO foundation listed in §1 and §3 (Live) are shipped. No open implementation work on built features.

**Now (priority order):**
1. **Sighting evidence backfill** — 136 zero-evidence sites (F9, OQ-1). Largest trust gap, blocks species-chaser moat.
2. **Evidence confidence indicator on site cards** — (FR9.3) keeps the promise honest during backfill.
3. **Reef health backfill** — ~5 missing locations. Cheap to finish; removes blank panels.
4. **MERMAID API integration** — multi-year coral cover trend (F10, OQ-2).
5. **`/plan` funnel audit** — verify Phase 8–10 completeness (OQ-3).
6. **Homepage positioning audit** — 10-second clarity test (F11, OQ-5).
7. **GBIF/OBIS/iNat licensing check** (OQ-9) — legal review before scaling affiliate monetization.

---

## 12. Assumptions Index

| ID | Assumption | Status |
|---|---|---|
| A1 | Species data curated, 5–15 species per top site | Resolved — 380 sites have curated species; 244 have sighting evidence records |
| A2 | JSON files, no CMS/DB for MVP | Confirmed — all data in `src/data/` JSON files |
| A3 | `editorialRank` field, hand-set | Confirmed — field present on site records |
| A4 | Pagination over infinite scroll | Resolved — sites directory uses card grid |
| A5 | Booking.com as MVP lodging partner | Active — Booking.com + LiveaboardBookings live |
| A6 | Amazon Associates + specialty dive retailers | Active — gear catalogue with partner fields |
| A7 | Vercel Analytics, cookieless | Confirmed — wired in root layout |
| A8 | Image sourcing (Unsplash/own) | Resolved — iNaturalist CC-licensed photos for species; hero images sourced separately |
| A9 | No cookie banner (cookieless analytics) | Confirmed |
| A10 | Scraper for dataset expansion | Resolved — data curated via Colab blitz; 380 sites reached. **Paused** per PM directive: backfill evidence on existing sites before adding new ones |

---

## 13. Notes for PM

- `[NOTE FOR PM]` **The trust gap is the product gap.** 136 zero-evidence sites means the species-chaser promise is broken for 36% of the catalog. Every other priority (homepage polish, MERMAID, `/plan`) sits behind this.
- `[NOTE FOR PM]` **Breadth is paused.** The Colab Gemini Blitz added sites faster than evidence — 380 sites, 36% with nothing to show. Per product charter: do not add site #381 until the zero-evidence count is near zero.
- `[NOTE FOR PM]` **Grant credibility requires honesty, not perfection.** Schmidt Marine and NatGeo reviewers will respect a `/data` page that says "here's what we can't see yet" over a site that overclaims. The data transparency layer is a feature, not an apology.
- `[NOTE FOR PM]` **IUCN licensing is the only speciation risk.** Without a commercial IUCN license, the species conservation status layer stays feature-flagged. This is a low-cost fix ($0–$5k/yr for a small publisher) but needs to be actioned before any grant application that highlights species conservation.
- `[NOTE FOR PM]` **GBIF/OBIS/iNat licensing (OQ-9) may be the bigger risk.** If the sighting evidence layer is considered commercial use by any of these providers, the entire evidence moat could be legally constrained. Get a legal opinion before scaling affiliate monetization on sightings-backed pages.
