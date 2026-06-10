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

**Positioning gap (the thing to fix):** the homepage leads entirely with reef-health /
climate framing. A diver's "where & when will I see X" job is invisible above the fold
(survives only as one filter facet). We finally have the evidence to make that promise
true (353/356 sites) right as we stopped making it. Recouple the moat to the front door
without diluting grant credibility.

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
  - **Removed in design-lift:** `/plan`, `/dive-in`, `/encounters`. The trip-planning
    funnel (`/plan`) no longer exists — see open decision on whether this is
    intentional.
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
| A (new) | **Recouple the species moat to the homepage** | Helps a species-chasing diver see in 10s that the site answers "where & when will I see X." | We have the evidence (99%) but the homepage no longer makes the promise. Cheap, high leverage on positioning + funnel. |
| ? | **Resolve `/plan` funnel: deliberate removal or regression?** | Helps a researching diver turn evidence into a booked decision. | Blocks ranking everything funnel/revenue. Decide intent before building. |
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

- [ ] **`/plan` funnel removed — deliberate or regression?** The design-lift deleted
      `/plan`, `/dive-in`, `/encounters`. If the booking + gear affiliate funnel is still
      a goal, nothing currently carries it. Resolve before treating "rebuild funnel" as a
      priority. _(Highest-leverage open question right now.)_
- [ ] **Recouple the species moat to the homepage.** Homepage leads only with reef-health
      framing; the "where & when will I see X" job is invisible above the fold despite 99%
      evidence coverage. Scope a cheap fix (hero line + entry point to `/where-to-see`).
- [x] ~~Verify `/plan` itinerary builder completeness~~ — moot; route removed.
- [x] ~~Confirm missing reef-health locations~~ — backfill complete (116/113).
- [ ] Is there a live grant deadline? `docs/grants-charter.md` still does not exist.
      Confirm no deadline is active, or recreate the file. Overrides all modes if a
      deadline is within 14 days.
- [ ] Decide region-of-origin assumption for trip cost ranges (US/EU/AU) — only if the
      trip/cost funnel is rebuilt (see `/plan` decision above).

---

## Tomorrow's focus

Next prioritization slot: do a full re-rank now that both prior top items are done.
Anchor it on the one open question — **is the `/plan` trip funnel's removal deliberate
(atlas-first, monetize later) or collateral damage from the design-lift?** That answer
decides whether the revenue funnel is a priority or a non-goal, and therefore how high
"recouple the species moat to the homepage" sits.

Next positioning slot: stress-test whether a species-chasing diver landing on the
homepage can tell, in 10 seconds, that the site answers "where & when will I see X" —
now that the evidence (99% coverage) finally backs that promise but the hero no longer
makes it.
