# Product Charter — scubaseason.fun

_Bootstrapped 2026-05-29 by the product-operator. This file is the single source of
truth for product state, positioning, and the live priority order. Update it whenever
a decision changes._

---

## Positioning (current bet)

> **Updated 2026-06-05.** The `design-lift` homepage pivoted the de-facto positioning
> from "species-chaser trip tool" to "living-ocean reef-health atlas." The statement
> below reconciles the two. See pm-log 2026-06-05 for the full analysis.

**The dive atlas that tells the truth about a reef — both what's living there now and
what state it's in.** scubaseason.fun answers two coupled questions with honest evidence:
(1) _what will I actually see, and when_ — species presence backed by real sighting
records, now covering 99% of sites; and (2) _what shape is this reef in_ — coral health,
thermal stress, and fishing pressure, monitored daily against NOAA's satellite feed.
Generic dive search sells a brochure; we show the evidence. The honest-data framing is
what earns a diver's trust and a grant reviewer's respect alike — the moat is depth and
honesty, not breadth.

The living-ocean atlas is the **brand and grant face**. The species/when depth is the
**diver payoff and revenue funnel**. They are one product, not two — but the homepage
currently renders only the first half (see Positioning gap below).

One sentence test for a new visitor: _"This is the site that tells me the truth about a
reef — both what I'll actually see there and what shape it's in."_

**Positioning gap — STATUS UPDATE 2026-06-10:** _substantially closed at the copy level._
The committed homepage hero now leads with **"Where to dive and what you'll actually
see"** + "A live dive atlas for sightings, reef health, conservation status, and ocean
pressure." The species-chaser job is back in the H1. A large homepage redesign is also
**in flight (staged, uncommitted: 13 files, ~298 insertions, rewriting `page.tsx` and
`atlas-stage.tsx`)** — the hero copy is itself being reworked, so treat the exact wording
as in flux. The remaining gap is no longer the hero; it is the **inbound front door**:
the species-chaser's high-intent _search_ entry points (the `/where-to-see/[species]`
landing pages) were removed. See the new spec and open decision below.

---

## User segments (from PRD personas)

| Segment | Job they hire the site for | Status today |
|---|---|---|
| Curious / first dive | "Is diving for me, and where do I start?" | Served by `/for/[cert]` flow (`/dive-in` removed in design-lift) |
| Returning diver | "Where do I go for my next trip in my window?" | Partially served; trip funnel (`/plan`) was removed |
| Advanced species chaser | "Where and when will I reliably see X?" | Evidence now on 99% of sites — but the homepage no longer leads with this job |
| Pro / tech | Deep conditions, reef state, provenance | Best served today by data depth + reef-state model |

> ~~Most neglected: species chaser on 136 zero-evidence sites~~ — **resolved 2026-06-05**
> (evidence now covers 353/356 sites). New neglect: the species chaser arriving on the
> homepage, where their job is no longer visible above the fold.

<details><summary>Prior "most neglected" note (pre-2026-06-05)</summary>

Most neglected right now: the **species chaser** on the 136 sites that carry no
sighting evidence (see Trust gap below).

</details>

---

## Current state (measured 2026-06-05)

- **356 dive sites**, 113 locations. (Trimmed from 380 — discovery paused as planned.)
- **Sighting evidence: 353/356 sites carry species evidence. Only 3 have ZERO.** The
  36% trust gap from 2026-05-29 is **closed.** This is the big change.
- **Reef health: 116 records / 113 locations — backfill complete.**
- IUCN status: 258 species with category + population trend.
- Fishing pressure (GFW): all 113 locations, refreshed weekly via workflow.
- Species photos: iNaturalist thumbnails on site/species pages, with attribution.
- Routes live: `/`, `/sites`, `/sites/[slug]`, `/sites/[slug]/species/[species]`,
  `/locations/[slug]`, `/where-to-see/[species]`, `/for/[cert]`, `/search`, `/about`,
  `/faq`, `/data`.
  - **Removed (now a confirmed deliberate pattern):** `/plan`, `/dive-in`, `/encounters`,
    **and `/where-to-see/[species]`** — all folded into the atlas. The `/where-to-see`
    pages were built as "Phase 11: SEO landing pages" (commit b2c9166) then deleted in
    checkpoint 3451ce0. **Substrate is fully intact:** `src/data/encounters.json` (11
    marquee encounters), `src/lib/data/encounters.ts`, and `speciesLandingSchema()` in
    `schema-org.ts` (orphaned but present). Restorable in 319 lines. See spec below.
  - **Homepage redesign in flight (2026-06-10):** ~298-insertion staged changeset across
    13 files (`page.tsx`, `atlas-stage.tsx`, `atlas-nav.tsx`, `globals.css`, …). Do not
    edit these files until it lands.
- Homepage rebuilt (`design-lift` branch): living-ocean reef-health atlas framing,
  reef-state model, NOAA live framing, atlas explorer with filter facets incl. wildlife.
- Affiliate surfaces + disclosure shipped; sitemap, robots, OG, JSON-LD shipped.
- Weekly data refresh workflows (IUCN, GFW) running.

> Note: `.planning/STATE.md` is stale. Charter is the truth. Both 2026-05-29 top
> priorities (sighting-evidence backfill, reef-health backfill) are now **done**.

---

## Live priority order (1pm prioritization, 2026-05-29)

Ranked by: (1) grant unblocking, (2) Schmidt Marine + NatGeo credibility,
(3) funnel completion, (4) positioning sharpness.

> **2026-06-05 note:** ranks 1 and 2 are DONE. The list below needs a full re-rank at
> the next prioritization slot. New lead candidate: **recouple the species moat to the
> homepage** (the positioning gap) — and resolve the `/plan` funnel question first,
> since it determines whether "rebuild the funnel" is a priority or a non-goal.

| Rank | Item | User sentence | Why this rank |
|---|---|---|---|
| ~~1~~ ✅ | ~~Close the sighting-evidence gap (136 sites)~~ | — | **DONE.** 353/356 sites now carry evidence; only 3 zero. |
| ~~2~~ ✅ | ~~Finish reef-health backfill (~5 locations)~~ | — | **DONE.** 116 records / 113 locations. |
| A | ~~**Recouple the species moat to the homepage**~~ — _hero copy DONE (2026-06-10)_ | Helps a species-chasing diver see in 10s that the site answers "where & when will I see X." | Hero now leads with "what you'll actually see." Redesign in flight may rework wording. Remaining gap moved to the SEO front door (item A2). |
| A2 (new lead) | **Restore the 11 marquee species-landing SEO pages** (`/where-to-see/[species]`) as atlas entry points | Helps a species-chaser who Googles "where to see hammerheads diving" find us at all, then land in the atlas. | Highest-intent inbound surface; removed in consolidation. Data + schema intact. Spec below. **Blocked on the deliberate-vs-regression decision — Josie's call.** |
| ? | **Resolve consolidation intent: were the 4 route removals deliberate atlas-first strategy, or did SEO funnel get cut as collateral?** | Helps a search-arriving diver find the site and turn evidence into a booked decision. | Now reads deliberate (4 routes, consistent pattern). Blocks ranking everything funnel/revenue/SEO. Decide before A2 is built. |
| 4 | **Coral cover = only 2 data points** → MERMAID API integration | Helps a diver see a real multi-year trend, not a before/after bar. | Schmidt Marine credibility. MERMAID has an open API — no partnership negotiation needed. |

### Accelerate
**#1 — sighting-evidence backfill.** It is the only item that scores on both the moat
(species-chaser depth) and grant credibility (honest evidence). 136 sites is 36% of the
catalog rendering no evidence.

### Cut / defer
**New site discovery (Colab Gemini Blitz).** Stay paused. Evidence has now caught up
(99% coverage at 356 sites), so the original reason to pause (breadth diluting the moat)
is resolved — but there's no reason to resume aggressively either. Depth beats breadth;
only resume discovery if a specific high-demand region is missing.

---

## Open decisions / things to verify

- [ ] **Atlas-first consolidation — deliberate strategy or SEO collateral damage?**
      _(Highest-leverage open question.)_ Four routes now removed and folded into the
      atlas: `/plan`, `/dive-in`, `/encounters`, `/where-to-see/[species]`. The pattern
      reads deliberate, not accidental. The unresolved cost: **an atlas filter facet does
      not rank in search.** "Where to see whale sharks 2026" is a landing-page query; the
      atlas can't capture it. Decide whether the 11 marquee landing pages return as SEO
      entry points that deep-link into the atlas (recommended — see spec). Also: if the
      booking + gear affiliate funnel is still a goal, nothing currently carries it.
- [x] ~~Recouple the species moat to the homepage~~ — **hero DONE 2026-06-10** (H1 now
      "Where to dive and what you'll actually see"). Remaining work is the SEO front door
      (spec below), not the hero.
- [x] ~~Verify `/plan` itinerary builder completeness~~ — moot; route removed.
- [x] ~~Confirm missing reef-health locations~~ — backfill complete (116/113).
- [ ] Is there a live grant deadline? `docs/grants-charter.md` still does not exist.
      Confirm no deadline is active, or recreate the file. Overrides all modes if a
      deadline is within 14 days.
- [ ] Decide region-of-origin assumption for trip cost ranges (US/EU/AU) — only if the
      trip/cost funnel is rebuilt (see `/plan` decision above).

---

## SPEC — Restore marquee species-landing SEO pages (`/where-to-see/[species]`)

_Drafted 2026-06-10 (3pm execution slot). Status: **BLOCKED on the consolidation-intent
decision above.** Do not build until Josie confirms the 11 pages should return. Sized as
a "large" item, hence a spec rather than code — also because the homepage redesign is in
flight on adjacent files._

**User story.** As a species-chasing diver who searches "where to see hammerheads diving"
(or whale sharks, mantas, the sardine run…), I land on a focused page that tells me which
dive sites reliably deliver that encounter and in which months — and from there I drop
straight into the atlas filtered to that animal, so I can act on it.

**Why it's the moat's front door.** These are the highest-intent inbound queries we can
own. The per-site species depth (`/sites/[slug]/species/[species]`) survives, so the moat
has depth — but depth no one can find via search is half a moat. A filter facet inside
the atlas (`?a=…`) cannot rank for these queries; a landing page can. Restoring 11 pages
recovers the inbound funnel without re-fragmenting the product, _if_ each page funnels
into the atlas rather than competing with it.

**Scope:** 11 encounters in `src/data/encounters.json` (sardine-run, hammerhead-schools,
whale-sharks, manta-cleaning-stations, thresher-sharks, great-white-cage-diving, …). No
new data. Small, finite surface.

**Acceptance criteria.**
1. Route `/where-to-see/[species]` renders for each of the 11 encounter slugs; unknown
   slug → 404 (not a soft-empty page).
2. Each page lists the dive sites/locations that carry that encounter, with best-months,
   and links each to its existing `/sites/[slug]` or `/sites/[slug]/species/[species]`.
3. **One clear CTA that deep-links into the atlas pre-filtered to the animal** (the filter
   rail already reads the `?a=` param, e.g. `/?a=<tag>#atlas`) — this is what keeps the
   page an atlas _entry point_, not a competing surface. (Per UI principle: one clear CTA.)
4. `speciesLandingSchema()` (already present in `schema-org.ts`) is wired into the page
   `<head>` as JSON-LD; pages are added to `src/app/sitemap.ts`.
5. Styled in the current Kimi dark-ocean theme (`--atlas-*` tokens), not the pre-rebrand
   look of the 319-line original.
6. Honest-data rule holds: only assert an encounter at a site if real sighting evidence
   backs it; show provenance/attribution consistent with the rest of the site.
7. No hyphens in user-facing copy (em dashes ok); plain language; live-data framing (no
   "last updated" timestamps).

**Technical notes.** Old page recoverable from git (`git show
'8240633:src/app/where-to-see/[species]/page.tsx'`, 319 lines) as a reference — but the
data-layer APIs and theme have changed since, so treat it as a starting point, not a
revert. Reuse `getEncounters()`/equivalent from `src/lib/data/encounters.ts`. Verify the
animal-tag taxonomy used by the atlas filter (`WILDLIFE_TAGS` / `ANIMAL_OPTIONS`) maps
cleanly to encounter slugs so the `?a=` deep-link actually filters — if the mapping is
lossy, add a slug→tag lookup. Run `npx tsc --noEmit` before commit. **Do not start while
the staged homepage redesign is uncommitted** (collision on `atlas-stage.tsx` / nav).

---

## Tomorrow's focus

Next prioritization slot: re-rank around the now-sharpened open question —
**atlas-first consolidation: deliberate strategy, or SEO funnel cut by accident?** Four
routes are gone, the pattern is clearly intentional, and the unresolved cost is inbound
search traffic that no atlas filter can recover. That answer decides whether the
species-landing SEO spec (above) is the next build or a deliberate non-goal — and whether
any surface still carries the booking/gear revenue funnel.

Next positioning slot: the hero now makes the species promise (DONE). Shift the
stress-test from "does the homepage say it" to **"can a diver who arrives from a search
engine find us at all, and once here, act on the promise in one step?"** — i.e. inbound
discoverability + the path from promise to the filtered atlas.

Watch: the staged homepage redesign (13 files) — once it lands, re-verify the hero copy
and the atlas wildlife-facet discoverability, since both are being reworked.
