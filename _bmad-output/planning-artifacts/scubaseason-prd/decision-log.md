# Decision Log — scubaSeason.Fun PRD

## 2026-05-15

- **Intent:** Create.
- **Mode:** All-inclusive PRD (small-scope artifact) — chosen because user said "I don't want a 30-day plan, I want it now" but the monetization/compliance dimension warrants a captured doc.
- **Target user:** Confirmed by user — advanced species chasers, not generic divers.
- **Monetization model:** Affiliate links only (booking + gear). No paid placement, no platform-side booking. User-confirmed.
- **Scope locked to 5 features + dataset expansion** (F1-F5 in PRD). Non-goals explicit in §3.
- **Dataset architecture:** Two-tier (Location → Site). Existing 109 JSON entries become Locations; Sites are new.
- **Data store:** JSON files for MVP. Re-evaluate at >500 sites. Decision basis: no current need for CMS, faster iteration on file edits.
- **Affiliate partners — MVP defaults** (assumed pending user confirmation): Booking.com for lodging, Amazon Associates + 1-2 specialty retailers for gear.
- **Analytics:** Vercel Analytics for MVP (cookieless → avoids cookie banner).
- **Build order:** Schema → detail page template → 3 flagship sites curated → filters/search → affiliate layer last (needs accounts).
- **Out of scope for MVP — flagged for future:** user accounts, dive logs, social, in-platform booking, species-level real-time tracking, mobile apps, user-submitted content, trip itinerary builder.
- **Deferred / open questions captured in PRD §9:** dataset source (blocking), affiliate program enrollment (blocking for F5 only), image rights, analytics choice, editorial voice.

## 2026-05-15 (cont.) — Revenue model: dual funnel (booking + gear)

- **Reverted gear-primary framing.** Both booking and gear are co-equal revenue lines.
- **Trip-booking funnel expanded** beyond lodging to include flights/transit + dive operators. Site detail page gets a "Plan Your Trip" section with three sub-blocks: Getting there → Where to stay → Who to dive with.
- **Affiliate partners broadened:** Skyscanner (flights), Booking.com + LiveaboardBookings (lodging), PADI Travel + Bluewater (operators), plus existing gear partners.
- **Non-affiliate operator links allowed** when no affiliate exists — transparency over revenue purity. `isAffiliate: false` items render same UI without disclosure.
- **Success metrics rebalanced** to dual-funnel: neither booking nor gear should be <20% of revenue mix.

## 2026-05-15 (cont.) — Target user broadened (earlier revision)

- **Target user broadened** from "advanced species chasers only" to **full diver spectrum** segmented by cert + recency (Curious → Tech). User-corrected.
- **Filter scheme expanded:** added `Certification level` and `Last dive recency` as first-class filters. First-visit prompt captures both, stored in localStorage.
- **Gear data restructured:** site detail now shows **Layer A** (level-tiered base kit, adapts to user's cert) + **Layer B** (site-specific add-ons). Gear catalogue separated into `gear.json` referenced by ID — enables partner swaps without touching site data.
- **Revenue model clarified:** gear affiliate is **primary** (beginner full-kit purchases drive volume); lodging is secondary. Success metrics rebalanced — gear CTR > 4%, gear ≥ 60% of revenue mix.
- **Affiliate partners:** apply to Amazon Associates + DGX + Divers Direct + Leisure Pro + Scuba.com; use whichever approves first; Amazon as guaranteed fallback.
- **Snorkelers and freedivers explicitly out of scope** (different gear funnel).

## 2026-05-15 (cont.) — Dataset source resolved

- **Dataset source:** Scraped (user-confirmed).
- **Implications surfaced for resolution:**
  - Source sites TBD — likely candidates: Divezone, Deeperblue, Scubaboard, individual operator sites. Each has different ToS posture.
  - One-shot scrape (seed dataset, then hand-maintain) vs ongoing scraper (recurring updates, more fragile).
  - Scraper execution: local Node/Python script vs scheduled job. Vercel cron has 10s timeout — long scrapes need a different host (GitHub Actions, separate worker).
  - Legal posture: respect robots.txt, rate-limit, attribute sources where required, no copyrighted prose verbatim (paraphrase species/conditions).
- **Open follow-ups for user:**
  - Q-scrape-1: Which sources? (lock target list before writing scraper)
  - Q-scrape-2: One-shot seed or ongoing refresh?
  - Q-scrape-3: OK to paraphrase scraped prose via LLM before storing, to avoid copyright?

## 2026-05-15 (cont.) — UX direction locked (Path D)

- **Lightweight UX pass** instead of full UX spec — user explicitly chose path D to unblock implementation quickly.
- **Globe direction: A (Ocean-bright)** — day-Earth texture, coral pins with mask glyph, lighter aquatic gradient.
- **Filter layout: ii (Top bar collapsible)** — chip row + expandable drawer.
- **First-visit cert/recency prompt:** inline banner, not modal.
- **Detail page: y (Two-column dashboard)** — sticky `Plan Your Trip` right column; gear inline in left content column. Claude picked y per user delegation.
- Notes captured in `ux-notes.md` adjacent to PRD.

## 2026-05-15 (cont.) — Architecture pass

- Wrote `architecture.md` covering stack, data model, routes, state management, scraper, affiliate plumbing, build/deploy.
- **Stack locked:** Next.js 16 App Router + JSON-in-git + Vercel + Vercel Analytics. No DB, no auth, no API routes for MVP.
- **Data model:** Location → Site (FK) + shared Gear catalogue (referenced by ID from Site). All three are committed JSON files.
- **Filter state in URL params**, diver profile in localStorage, client-side filtering on a pre-built compact index.
- **Scraper lives outside Next.js runtime** in `scripts/scrape/` — one-shot for MVP, per-source modules, optional LLM paraphrase pass.
- **Affiliate plumbing:** single `<AffiliateLink>` component handles rendering + analytics event + disclosure marker. URLs pre-tagged at JSON write time.
- **Risk register surfaced:** scraper fragility, JSON-scale ceiling, link rot, globe perf with 500+ markers.

## 2026-06-03 — PRD Update pass (sync to current reality)

- **Intent:** Update. PRD was written 2026-05-15 when the site was a landing page concept. Now 356 sites, 10 routes, full data layer live.
- **Reframed positioning:** "reef intelligence platform" — not just a trip planner. Moat = depth + honesty.
- **IA updated** to all 10 live routes.
- **Features restructured:** F1–F5 from original PRD promoted to F1–F8; marked Built vs. In scope next. F6 (cert landing pages) and F7 (affiliate) elevated to named features. F8 (data transparency) added — was not in original PRD.
- **Reef health layer added as core product surface:** NOAA thermal, coral cover, GFW fishing pressure, water quality, reef state classification — these are live features not in the original PRD.
- **User flows added** (UF1–UF4): species chaser, beginner, conservation-curious, returning diver. These were absent from the original PRD.
- **Open questions reset** from original build-blockers (now resolved) to current gaps: sighting evidence backfill (OQ-1), MERMAID API (OQ-2), `/plan` completeness (OQ-3), IUCN licensing (OQ-6).
- **Success metrics updated** to reflect grant/partnership credibility signals alongside affiliate revenue.
- **Breadth pause confirmed** in assumptions: Colab Gemini Blitz paused per PM directive.
- **Addendum** (personas-encounters-climate-research-addendum.md) referenced but not re-ingested — personas now live inline in UF1–UF4 per PRD conventions.

## 2026-06-03 — Finalize pass

- **Reviewer gate:** CONDITIONAL PASS. 9 findings resolved across reconciliation + quality + structural + prose passes.
- **Critical fix:** In-scope-next items now have stub FRs (F9 sighting backfill, F10 MERMAID, F11 homepage positioning) with acceptance criteria.
- **Site count corrected:** 380 throughout (was inconsistently 356 in some sections).
- **UF5 added:** direct SEO cold landing on site detail page — highest-volume acquisition path, was missing.
- **OQ-9 added:** GBIF/OBIS/iNaturalist commercial licensing — more urgent than IUCN (OQ-6), affects entire sighting evidence layer.
- **IUCN clarified:** 258 species have data in dataset; display is feature-flagged pending commercial license. PRD previously conflated data existence with display status.
- **Weekly refresh workflows documented:** FR8.6 added; IUCN + GFW refresh on weekly automated schedule.
- **Success metrics anchored:** industry benchmark context added for CTR targets; acquisition signals added for grant/partnership reviewers.
- **Confidence indicator:** FR9.3 — evidence badge on site cards during backfill. From PM log; now in PRD.
- **Prose standardized:** "species chaser" (noun) / "species-chaser" (compound modifier); DHW, AIS, viz expanded; missing hyphens fixed.
- **§11 Done list trimmed:** cross-reference to §1 to eliminate redundancy.
- **Status set to: final.**

## Outstanding before build

1. ~~Dataset source~~ — RESOLVED (scraped). New sub-questions Q-scrape-1..3 above.
2. User to confirm or override A5/A6 (affiliate partner choice).
3. User to confirm A8 (image sourcing — scraped images carry IP risk; safer to use stock).
