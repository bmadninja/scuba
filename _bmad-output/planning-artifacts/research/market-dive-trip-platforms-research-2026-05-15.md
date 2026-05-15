---
title: Competitive landscape — dive trip planning + booking platforms
date: 2026-05-15
research_type: market
sources: PADI Travel, Bluewater Dive Travel, Divezone, Liveaboard.com, DeeperBlue, Scubaboard, ZuBlu (403 — covered by reputation)
---

# Competitive Landscape — Dive Trip Platforms

## 1. The Players

The space sorts into three archetypes. We sit between them — and that's where the opportunity is.

| Player | Archetype | Primary monetization | Site-level content depth | Booking inventory | Account / community |
|---|---|---|---|---|---|
| **PADI Travel** | Booking-first | Commission on resorts/liveaboards/courses; bundled dive insurance; donation flow to PADI AWARE | Thin — destination *guides*, no per-site species/conditions/depth | 300+ destinations | Save favorites; no logs, reviews, or forum |
| **Liveaboard.com** | Pure booking aggregator | Commission only | None — booking pages only | 22,900 dive trips · 588 ships · 71 countries | Wishlist, recently-viewed, 13K customer reviews on operators |
| **Bluewater Dive Travel** | Concierge agency | Commission via supplier partnerships | Destination pages exist; site-level detail not visible | Curated set; group trips a hero product | None — agency-led, email/phone-first |
| **ZuBlu** | Asia-Pacific booking | Commission, curated | Moderate; trip-focused | Asia + Indian Ocean specialist | Saved trips |
| **Divezone** | Content/SEO | Display ads; "Advertise" link | Hundreds of dive sites; basic — 1-5 star dive + sealife ratings, descriptions, user comments | None — links out | User comments / reviews |
| **DeeperBlue** | Editorial + community | Display ads + merch (apparel) | Editorial articles, guides, gear reviews | None | Active forums; 858K FB / 113K IG; podcast |
| **Scubaboard** | Pure community | Display ads | None — discussion threads only | None | Forums (592 pages on exposure suits alone) |

**Two unfilled vacancies:**
1. **Research-grade depth × booking funnel.** Content sites (Divezone, DeeperBlue) don't sell trips. Booking sites (PADI Travel, Liveaboard.com, Bluewater) don't have site-level depth. Pick the right Maldives liveaboard from PADI and you still don't know which sites it actually visits or what's there.
2. **Skill-level-aware recommendations.** Nobody asks for cert + last-dive recency upfront and tailors the result. Booking platforms assume divers know exactly where they want to go.

## 2. What competitors do well

- **PADI Travel** — bundled dive insurance, donation flow as social proof, brand trust from the cert org. Saved-favorites loop. Trust > content.
- **Liveaboard.com** — sheer inventory + verified customer reviews on operators. UX for picking dates + filtering by departure window is sharp.
- **Bluewater Dive Travel** — concierge model, group trips as a content-led product, magazine-quality trip reports.
- **Divezone** — SEO machine. They rank because they have *pages*, even if shallow.
- **DeeperBlue** — community moat, 30 years of editorial credibility.

## 3. Our differentiators (what we have that they don't)

1. **Site-level depth.** 12-month conditions grid, species reliability tags, depth + skill, site-specific gear extras. None of the booking platforms surface this; the content platforms have it shallower.
2. **Cert + last-dive filters.** Diver-aware from the first interaction. PADI Travel asks where you want to go; we can ask who you *are*.
3. **Two-tier gear logic.** Base kit (Tier A) + site-specific extras (Tier B). Competitors don't make site → gear connections at all.
4. **In-season-now logic baked into surfacing.** Featured section + globe markers respond to the current month. PADI Travel's date picker is a calendar, not a "what's good in May" prompt.
5. **Globe visualization.** Memorable; nobody else has it. Brand asset.

## 4. Where we're behind (prioritized gaps)

### P0 — table-stakes for the category, blocking SEO + first-trip credibility

| Gap | Why it matters | Effort | Notes |
|---|---|---|---|
| **/sites list + search page** | All competitors have a full searchable index. We have 7 sites and no list page. Lose the search-intent traffic. | M | Already in build order. Wire Fuse over the pre-built index from architecture §5. |
| **Volume of seeded sites** | Divezone has hundreds. PADI Travel 300 destinations. Seven is not credible. | L | Scraper (already in architecture §6) — bring up the first 50 sites within the existing 109 locations. |
| **Operator detail pages** | All booking sites have operator pages; ours are just text labels. Big SEO + trust gap. | M | New route `/operators/[slug]`. Schema: name, location, contact, certifications, fleet/dive sites covered, affiliate link. |
| **Schema.org SEO markup** | `TouristAttraction` / `Place` schema on site pages, `LocalBusiness` on operators. Competitors are weak here too — easy win. | S | Add to existing detail page metadata. |
| **Newsletter signup** | Every competitor has one. Cheap retention loop. | S | Pair with our "in season now" angle — monthly digest of best dive months. |

### P1 — revenue / conversion drivers

| Gap | Why | Effort | Notes |
|---|---|---|---|
| **Real-time price + date search** | Liveaboard.com's killer feature. Without it, our booking funnel is "click out, hope". | L | Needs API integration with Liveaboard.com / PADI Travel / Bluewater — most have affiliate APIs. P1 not P0 because affiliate links still convert without it; this just lifts CTR. |
| **"Trip deals" / group trips** | Bluewater + ZuBlu use group trips as inspiration content. High intent. | M | Surface a curated "deals" or "group trips" carousel sourced from partner feeds. |
| **Photo galleries per site** | All editorial competitors have them; we have a single hero. Galleries lift dwell time + SEO. | M | Add `images: string[]` to Site schema. Initially editorial-sourced; later user-submitted. |
| **Comparison view** | "Compare Maldives Manta Point vs. Komodo Manta Alley" — nobody does this well. Differentiator we could own. | M | Side-by-side species, conditions, cost-to-get-there. Natural for a research tool. |

### P2 — engagement / retention

| Gap | Why | Effort | Notes |
|---|---|---|---|
| **User accounts** | Everyone has them. We currently don't. Save favorites is the entry point. | L | Auth via Vercel + Clerk/Auth.js. Don't build before P0/P1 lands. |
| **Reviews on dive sites** | Divezone has comments; ScubaBoard has threads. We have neither. | M | Needs accounts (P2). Trust-light moderation via admin. |
| **Dive log integration** | Untapped — no one has done it well. Aspirational. | XL | Stay aspirational; could import from PADI eLearning / Subsurface. v2+ territory. |

### P3 — content + moat

| Gap | Why | Effort | Notes |
|---|---|---|---|
| **Trip reports / editorial pages** | Bluewater's hero asset. We have none. | M | Long-form content engine; AI-assisted drafts + editorial review. |
| **Currency / locale selector** | Booking platforms have it; we're USD-only. | S | Cheap once pricing matters. |
| **Operator-side "claim listing" workflow** | Lets operators take ownership of their page; potential paid-listing revenue line later. | M | Future business model lever. |

## 5. Recommended next moves (in order)

1. **Ship `/sites` list + search** — closes the biggest navigation/SEO gap and unblocks discovery.
2. **Scrape & seed 50 sites across the top 10 locations** — pushes us past credibility threshold.
3. **Build `/operators/[slug]` route** — operator profiles double our SEO surface area and create a new affiliate landing pattern.
4. **Schema.org markup + sitemap polish** — cheap SEO floor-raise; competitors are weak.
5. **Newsletter signup with "What's in season this month"** — leverages our temporal angle; first retention loop.
6. **Photo galleries on site pages** — every research user expects more than one image.
7. **Site comparison view** — defensible differentiator no one else owns.

Then P2 (accounts → reviews) once content density is real.

## 6. Strategic posture

Compete by **depth + skill-awareness + temporal smartness**, not by inventory. Inventory is a Liveaboard.com / PADI Travel game we will lose if we play it head-on. The win is the user thinking "scubaSeason told me *what's there*, then I clicked their booking link" — content discovery → conversion, not direct booking. Affiliate-link economics are healthier than building a booking platform from scratch.

Two risks to watch:
- **PADI Travel adds site-level depth.** They own the cert pipeline and could fold this in. Mitigate by being the first/best at it, then earning the SEO moat.
- **AI dive trip planner** (ChatGPT / Gemini etc.) replaces the research step entirely. Mitigate by being the structured data source they cite — schema.org markup and clean data become a moat in an LLM-mediated future.
