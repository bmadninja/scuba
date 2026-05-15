---
title: scubaSeason.Fun — PRD
created: 2026-05-15
updated: 2026-05-15
status: draft
intent: create
mode: all-inclusive (small-scope, single artifact)
---

# scubaSeason.Fun — PRD

## 1. Context & Why

scubaSeason.Fun is a research platform for **advanced scuba divers who chase specific species and conditions** — not a generic trip planner. Today the site is a single landing page: a 3D globe of 109 dive *locations* with a multi-criteria filter (month, trip style, skill level, dive types) and an "Explore Dive Sites" CTA that goes nowhere.

The PRD covers the next build: turn the landing page into a navigable research tool with **dive-site-level depth** (not just locations), and introduce **monetization** via affiliate links for booking and gear.

**Why now:** the dataset is the moat. Generic dive search exists; species-chaser-grade depth does not. Monetization is bolted on once the depth exists — affiliate revenue is the funding mechanism for further dataset expansion, not the product itself.

## 2. Target User

**The full diver spectrum, segmented by certification + recency.** Site adapts its recommendations (and gear funnel) to the user's self-declared level. This broadens monetization — beginners need a *full kit purchase*, advanced divers need *specialty add-ons*; both are good affiliate revenue.

**Segments:**

| Segment | Cert | Last dive | What they need from us | Gear funnel |
|---|---|---|---|---|
| Curious | none yet | never dived | Where to *try diving*: resort destinations with discover-scuba programs | Mask/snorkel/swim gear (low ticket, broad appeal) |
| Beginner | Open Water | last dive 0-2 yrs | First-trip destinations: easy conditions, good viz, reputable shops | **Full starter kit** (mask, fins, boots, dive computer entry) — highest ticket, highest intent |
| Returning | OW/AOW | last dive 2+ yrs ago | Refresher-friendly sites, ops with refresher courses | Gear refresh + computer upgrade |
| Intermediate | AOW + 20-100 dives | active | Variety: drift, night, deeper sites | BCD/regulator upgrade, exposure suit |
| Advanced | Rescue/DM/tech + 100+ dives | active | Species-specific, conditions-specific destinations | Specialty: reef hooks, SMBs, dive lights, tech accessories |
| Pro/Tech | Instructor/tech | active | Niche: caves, deep, rebreather-friendly ops | Specialty + tech-grade replacements |

**Key UX principle:** the site asks the user their cert + last-dive recency on first visit (or filter selection), and *everything else adapts* — site recommendations, gear blocks, lodging suggestions. A "Curious" user shopping a Maldives liveaboard is a mismatch; an "Advanced" user shown a starter mask is a mismatch. Both lose trust and clicks.

**Not the target:** snorkelers, free-divers (different gear funnel, different content — explicit non-goal for v1).

## 3. Scope

### In scope (this build)
1. **Dive site detail pages** — one URL per dive site, deep content
2. **Better filter UX** — usable on the landing page and search results
3. **Dataset expansion** — locations → dive sites within locations
4. **Search & list view** — non-globe path to find sites
5. **Affiliate monetization** — booking (hotels/liveaboards) + site-specific gear recommendations

### Non-Goals (this build)
- `[NON-GOAL for MVP]` User accounts, dive logs, social features, reviews
- `[NON-GOAL for MVP]` Booking *through* the platform — only affiliate links out
- `[NON-GOAL for MVP]` Mobile apps (responsive web only)
- `[NON-GOAL for MVP]` User-submitted content / community contributions
- `[v2 — out of MVP]` Species-level tracking ("I want to see X in the next 30 days, where do I go?") — depends on real-time sighting data, no source yet
- `[v2 — out of MVP]` Trip itinerary builder

## 4. Information Architecture

```
/                       Landing — globe + filters + featured sites
/sites                  Search/list — all sites with filters
/sites/[slug]           Dive site detail page
/locations/[slug]       Location overview (e.g. /locations/maldives) — list of sites within
/about                  About + affiliate disclosure
```

**Key shift from today:** today the 109 JSON entries are *locations* labeled as sites (e.g., "Ari Atoll, Maldives" is one row). The new model is **two levels**: Location (Maldives — Ari Atoll) contains multiple Sites (Manta Point, Fish Head, Maaya Thila, etc.).

## Revenue Model (clarified)

**Two co-equal revenue lines: trip-booking affiliate AND gear affiliate.** The product supports the full plan-a-dive-trip funnel end-to-end; we earn at multiple points along the way.

**Trip-booking funnel** (full path to actually getting underwater):
- **Flights / transit** — flight search affiliate (Skyscanner, Kiwi, WayAway) or transfer services
- **Lodging** — resorts, dive hotels, liveaboards (Booking.com, Agoda, LiveaboardBookings.com, Bluewater Travel)
- **Dive operators** — the actual dive shop / boat for the day (PADI Travel, Bluewater, direct operator affiliates where they exist)
- Each shows up on the site detail page in a "Plan your trip" block — flights to nearest hub, lodging options, recommended operators

**Gear funnel** (parallel — surfaces when the user is preparing, not just booking):
- Tier A: level-appropriate base kit (per FR1.4)
- Tier B: site-specific add-ons
- Amazon Associates + dive specialty retailers per FR5.2

**Why both:** different users monetize at different points. A beginner planning a first trip clicks booking *and* gear (full kit purchase). An advanced diver visiting Komodo already has gear but books a liveaboard + may grab a reef hook. Booking is lumpier per click but higher dollar; gear is more frequent but smaller tickets. We don't pick — we capture both.

## 5. Features & Functional Requirements

### F1 — Dive Site Detail Page (`/sites/[slug]`)

Single page per dive site, depth-first content for the species chaser.

- **FR1.1** Page renders these sections in order: Overview, Species & What You'll See, Conditions (depth/viz/current/temp by season), Season Calendar, **Plan Your Trip** (flights → lodging → dive operator), Required & Recommended Gear, Related Sites.
- **FR1.2** Species section lists target species with: scientific + common name, sighting reliability (`year-round` / `seasonal` / `rare`), best months, depth range. `[ASSUMPTION: species data is hand-curated initially, ~5-15 species per top site]`
- **FR1.3** Conditions section shows month-by-month conditions grid (12 columns): water temp range, viz range, current strength, recommended exposure suit.
- **FR1.4** Gear section is **two-layered**:
  - **Layer A — Level-tiered base kit** (changes with user's declared cert): Curious → snorkel set; Beginner → starter scuba kit; Intermediate → upgrade picks; Advanced → specialty.
  - **Layer B — Site-specific add-ons** (constant per site): e.g., "Komodo: reef hook required, 5mm wetsuit, SMB with reel."
  - Each item: name, why-needed (one sentence), price range, affiliate link. Layer A is the volume driver; Layer B is the trust driver.
- **FR1.5** Plan Your Trip section has three sub-blocks, each with affiliate links (see F5.1):
  - **Getting there** — nearest airport(s), typical routing from major hubs, flight-search affiliate link prefilled with destination, ground/boat transfer notes
  - **Where to stay** — 2-4 hand-picked lodging options (resort / liveaboard / budget) with booking affiliate links
  - **Who to dive with** — 2-4 recommended dive operators with affiliate links where available, plain links where not (still useful for the user, transparent that not all are monetized)
- **FR1.6** Page is statically generated (`generateStaticParams`) for SEO. All site URLs in sitemap.
- **FR1.7** Page metadata: dynamic `<title>` and OG image per site (replaces current default "Create Next App").

### F2 — Filter UX

Filters live on `/` (above the globe results) and `/sites` (left rail or top bar).

- **FR2.1** Filter set:
  - **When** (month)
  - **Region** (continent/ocean)
  - **Certification level** — `Never dived` / `Open Water` / `Advanced Open Water` / `Rescue` / `Divemaster+` / `Tech (TDI/PADI Tec)`
  - **Last dive recency** — `Never` / `Within 6 months` / `6-24 months ago` / `2+ years ago` (drives refresher suggestions)
  - **Trip style** (day boat / resort / liveaboard / dive school destination)
  - **Dive types** (large pelagics / coral / macro / wrecks / geology / blackwater)
  - **Target species** (typeahead — only surfaces for AOW+ to avoid overwhelming beginners; progressive disclosure)
- **FR2.1a** First-visit prompt (dismissible): "What's your cert + last dive?" Stored in `localStorage` and pre-fills filters site-wide. Skippable — defaults to "show me everything." Re-editable from a persistent header chip.
- **FR2.2** Filters are URL-state — `/sites?month=11&species=thresher-shark&skill=advanced` is shareable and back-button-safe.
- **FR2.3** Applied filters render as removable chips above results. Empty state when no match: "No sites match — clear [filter]".
- **FR2.4** Filter changes update globe markers and list **without full page reload**.
- **FR2.5** Multi-select within a facet uses OR; across facets uses AND. Document this in a tooltip — divers don't read tooltips but tech-cert users do.

### F3 — Dataset Expansion (Locations → Sites)

The dataset evolves from 109 location rows to a two-tier schema.

- **FR3.1** New schema: `Location` (country/region container) and `Site` (specific dive site with coords). Migration: existing 109 entries become Locations; each gets 3-10 child Sites added over time.
- **FR3.2** Dataset stays as JSON files in `src/data/` for MVP (`locations.json`, `sites.json`). `[ASSUMPTION: no CMS, no DB. Re-evaluate at >500 sites or when non-engineers need to edit.]`
- **FR3.3** Globe markers now represent **Locations** (clustering); zooming/clicking reveals child Sites on a secondary view or location page.
- **FR3.4** Seed expansion: hand-curate child sites for the top **10 destination locations first** (Maldives, Raja Ampat, Komodo, Galápagos, Cocos, Socorro, Palau, Red Sea — Egypt, Sipadan, Philippines — Tubbataha). Rest of the catalogue stays location-only until expanded.
- **FR3.5** Each Site row: `id`, `slug`, `locationId`, `name`, `lat`, `lng`, `depthRange`, `skillLevel`, `diveTypes[]`, `species[]`, `conditionsByMonth{}`, `gear[]`, `lodging[]`, `notes`.

### F4 — Search & List View (`/sites`)

- **FR4.1** All sites in a card grid, default-sorted by editorial priority `[ASSUMPTION: an `editorialRank` field on Site, hand-set]`.
- **FR4.2** Free-text search across site name, location, country, species (common + scientific). Client-side fuzzy match (`fuse.js` or similar) on MVP scale; revisit at >500 sites.
- **FR4.3** Each card shows: site name, location, hero image, top 3 species icons, best-months strip, "Detail →".
- **FR4.4** Pagination or infinite scroll — pick one. `[ASSUMPTION: pagination, 24 per page, for SEO crawlability]`.

### F5 — Affiliate Monetization

Two affiliate surfaces. **Disclosure is non-negotiable** — FTC requires it; species-chaser audience will sniff out hidden affiliations and lose trust.

- **FR5.1 Trip-booking links** (full funnel — flights, lodging, operators):
  - **Flights:** Skyscanner / WayAway affiliate, deep-link to nearest airport(s). `[ASSUMPTION: Skyscanner for MVP — biggest catalogue, decent commission, easy approval]`
  - **Lodging:** Booking.com (general) + LiveaboardBookings.com or Bluewater Travel (liveaboard specialist). `[ASSUMPTION: Booking.com for MVP, add liveaboard partner when Top 10 destinations are curated]`
  - **Dive operators:** PADI Travel + Bluewater where available; plain (non-affiliate) links to direct operators when no affiliate exists — transparency outweighs revenue purity.
  - Data model: each Site row has `getThere[]`, `lodging[]`, `operators[]` arrays; each item `{partner, productId, url, label, isAffiliate}`. The `isAffiliate: false` items render the same UI without disclosure markers.
- **FR5.2 Gear links — PRIMARY revenue line.** Two-layered per FR1.4. Partners:
  - **Amazon Associates** — broad coverage, fast approval, beginner kit volume play (low margin, high conversion)
  - **Dive specialty retailers** (DGX, Divers Direct, Leisure Pro, Scuba.com) — higher commissions on specialty/tech gear, slower approval. `[ASSUMPTION: apply to all four, use whichever approves first; Amazon as fallback]`
  - Gear catalogue is a separate data file (`src/data/gear.json`) — each gear item has `{id, name, level[], category, partners: [{partner, productId, url, commission}], priceRange}`. Sites *reference* gear by ID. This lets one gear item appear on many sites and one partner swap update everywhere.
- **FR5.3 Disclosure.** Every page with affiliate links shows "Some links earn us a commission" near the link block. Full disclosure policy at `/about`.
- **FR5.4 Link tracking.** All outbound affiliate clicks fire a client-side event (`gear_click`, `lodging_click`) with `{site_id, partner, product_id}`. `[ASSUMPTION: Vercel Analytics or Plausible — your choice. No Google Analytics unless you want to.]`
- **FR5.5 No paid placement in MVP.** Recommendations are editorial. Affiliate ≠ ranking influence. This is a trust constraint, not just a product one.

## 6. Non-Functional Requirements

- **NFR1 — Performance.** Site detail pages: LCP < 2.0s on 4G. Statically generated, image-optimized via Next.js `<Image>`.
- **NFR2 — SEO.** Every site page indexable, unique title/description/OG, sitemap.xml, schema.org `TouristAttraction` or `Place` markup with geo coords.
- **NFR3 — Accessibility.** WCAG AA on text contrast and keyboard nav. Globe has a non-3D fallback (list view).
- **NFR4 — Mobile.** Responsive, usable one-handed on phone. Globe degrades to map or list on small screens (3D globe on mobile is awkward).
- **NFR5 — Compliance.** FTC affiliate disclosure visible on every page with affiliate links. Cookie banner only if analytics use cookies that require it. `[ASSUMPTION: Vercel Analytics is cookieless → no banner needed]`.

## 7. Tech Notes (lives in addendum normally — kept here for all-inclusive doc)

- Stack stays as is: Next.js 16 App Router, React 19, Tailwind v4, shadcn, react-globe.gl, JSON data.
- Routing: App Router with `generateStaticParams` for `/sites/[slug]` and `/locations/[slug]`.
- Data: JSON files for MVP. Schema migration script `scripts/migrate-locations.ts` converts current `scuba-seasons.json` into `locations.json` + empty-children `sites.json`.
- Images: hosted on Vercel or external CDN. `[ASSUMPTION: you'll source images — Unsplash/Pexels for free, or you have your own. Image rights flagged as an open question.]`
- Affiliate links: stored on Site rows as `{ partner, productId, url, label }[]` so partner swaps are data-only, no code changes.

## 8. Success Metrics

**Leading indicators (week 1-4):**
- % sessions setting cert/recency (signals the segmentation lever is working) > 25%
- Site detail page sessions / total sessions > 30%
- Median session depth > 2 pages

**Lagging indicators (month 2+):**
- Gear affiliate CTR > 4%
- Booking affiliate CTR > 5% (lodging + flights + operators combined)
- At least one converted gear sale/week AND one converted booking/month by month 2
- Revenue diversification: neither line is <20% of total affiliate revenue (validates the dual-funnel thesis — if one collapses, reconsider)

**Counter-metrics — do NOT optimize:**
- Time on site (longer ≠ better for a research tool; can mean confusion)
- Total page views (incentivizes thin content)
- Affiliate revenue per session (incentivizes pushing weak recommendations)

## 9. Open Questions (must answer before build)

These are the irreducible unknowns. Tagged `[ASSUMPTION]` above where I made a guess.

1. **Dataset expansion source — SCRAPED (resolved 2026-05-15).** Sub-questions still open:
   - Q-scrape-1: Which source sites? `[blocking — locks scraper target list]`
   - Q-scrape-2: One-shot seed scrape, or ongoing refresh schedule?
   - Q-scrape-3: OK to LLM-paraphrase scraped prose before storing, to sidestep copyright on description text?
2. **Affiliate programs.** Which ones do you already have accounts with, vs. which need application? Booking.com and Amazon Associates auto-approve quickly; specialty programs can take weeks. `[blocking for F5 — but non-blocking for F1-F4]`
3. **Image sourcing.** Do you have rights to dive site imagery, or do we use stock/Unsplash + attribution? `[non-blocking — can ship with stock, swap later]`
4. **Analytics.** Vercel Analytics (built-in, cookieless, basic) or Plausible (better but $9/mo)? `[non-blocking — Vercel Analytics for MVP]`
5. **Editorial voice for site copy.** Who writes the "Overview" and "Species" prose per site — you, AI-assisted, or a freelancer? Voice consistency matters for the species-chaser audience. `[non-blocking — can start with AI-drafted + your review]`

## 10. Build Order (when ready)

Roughly the sequence I'd code in. Not a 30-day plan — more like a "here's the dependency chain":

1. Schema migration (FR3.1, FR3.2, FR3.5) — must come first
2. Site detail page route + template (F1) — even with thin data, gets the URL structure live
3. Hand-curate 3 flagship sites end-to-end (Manta Point Maldives, Komodo Batu Bolong, Galápagos Darwin's Arch) — proves the content shape
4. Filter URL state + search page (F2, F4)
5. Globe + landing page update (FR3.3, FR3.4)
6. Affiliate links + disclosure (F5) — last because needs accounts
7. SEO/sitemap/metadata polish (NFR2)

## 11. Assumptions Index

- A1 (FR1.2): Species data hand-curated, 5-15 species per top site
- A2 (FR3.2): JSON files, no CMS/DB for MVP
- A3 (FR4.1): `editorialRank` field, hand-set
- A4 (FR4.4): Pagination over infinite scroll
- A5 (FR5.1): Booking.com as MVP lodging partner
- A6 (FR5.2): Amazon Associates + 1-2 specialty dive retailers
- A7 (FR5.4): Vercel Analytics, cookieless
- A8 (Tech Notes): You source images
- A9 (NFR5): No cookie banner needed if cookieless analytics

## 12. Notes for PM

- `[NOTE FOR PM]` Species-chaser positioning is the riskiest bet. If after 4 weeks of detail pages live the analytics show the audience skewing casual/beginner (high bounce on detail pages, traffic from "best dive resorts" search terms), reconsider positioning before doubling down on monetization.
- `[NOTE FOR PM]` "I want it now" + 5 features + dataset expansion is a tension. Build order in §10 sequences this — F1+F3 first gives you a usable depth product even before monetization (F5) is wired.
- `[NOTE FOR PM]` Telegram/Squish coordination is on you to orchestrate; this PRD assumes a single implementer (me, codex, you, or any combination) reading from one source of truth.
