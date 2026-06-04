# Product Charter — scubaseason.fun

_Bootstrapped 2026-05-29 by the product-operator. This file is the single source of
truth for product state, positioning, and the live priority order. Update it whenever
a decision changes._

---

## Positioning (current bet)

**Species chaser grade depth that generic dive search can't match.** scubaseason.fun
helps a diver decide where to go next, with honest evidence: when a species actually
shows up, what the reef looks like now versus a decade ago, and what the trip really
costs. The moat is depth and honesty, not breadth.

One sentence test for a new visitor: _"This is the site that tells me the truth about
when and where I'll actually see the thing I'm diving for."_

---

## User segments (from PRD personas)

| Segment | Job they hire the site for | Status today |
|---|---|---|
| Curious / first dive | "Is diving for me, and where do I start?" | Served by `/dive-in`, `/for` flows |
| Returning diver | "Where do I go for my next trip in my window?" | Partially served |
| Advanced species chaser | "Where and when will I reliably see X?" | Core moat segment — needs evidence on every site |
| Pro / tech | Deep conditions, reef state, provenance | Best served today by data depth |

Most neglected right now: the **species chaser** on the 136 sites that carry no
sighting evidence (see Trust gap below).

---

## Current state (measured 2026-05-29)

- **380 dive sites**, 113 locations. (Up from 179 in the v2 backlog — breadth has more
  than doubled.)
- **Sighting evidence: 244/380 sites have ≥1 record. 136 sites (36%) have ZERO.**
- **Reef health: 114 records; ~5 locations still missing** a record.
- IUCN status: 258 species with category + population trend.
- Fishing pressure (GFW): all 113 locations, refreshed weekly via workflow.
- Routes live: `/`, `/sites`, `/locations`, `/encounters`, `/plan`, `/dive-in`,
  `/for`, `/where-to-see`, `/about`, `/faq`, `/data`.
- Affiliate surfaces + disclosure shipped; sitemap, robots, OG, JSON-LD shipped.
- Weekly data refresh workflows (IUCN, GFW) running.

> Note: `.planning/STATE.md` is stale (says M2 Phase 6 at 0%). Reality: reef-health is
> ~96% backfilled; the live gap is **sighting evidence (Phase 7)**.

---

## Live priority order (1pm prioritization, 2026-05-29)

Ranked by: (1) grant unblocking, (2) Schmidt Marine + NatGeo credibility,
(3) funnel completion, (4) positioning sharpness.

| Rank | Item | User sentence | Why this rank |
|---|---|---|---|
| 1 | **Close the sighting-evidence gap (136 sites)** | Helps the species chaser trust that every site shows real evidence of what they'll see. | Hits credibility AND the core moat at once. A famous site with no evidence is the worst trust failure we have. |
| 2 | **Finish reef-health backfill (~5 locations)** | Helps any diver see honest reef state everywhere, no blank panels. | Cheap to finish; removes "No survey on file" placeholders that read as gaps to a grant reviewer. |
| 3 | **Trip planner funnel completeness (`/plan`, Phases 8–10)** | Helps a researching diver turn evidence into a booked decision. | Funnel completion = the revenue path. Verify how complete `/plan` actually is. |
| 4 | **Coral cover = only 2 data points** → MERMAID API integration | Helps a diver see a real multi-year trend, not a before/after bar. | Schmidt Marine credibility. MERMAID has an open API — no partnership negotiation needed. |
| 5 | **Homepage 10-second positioning clarity** | Helps a first-time visitor articulate what's special in one sentence. | Positioning sharpness; lower urgency than trust holes. |

### Accelerate
**#1 — sighting-evidence backfill.** It is the only item that scores on both the moat
(species-chaser depth) and grant credibility (honest evidence). 136 sites is 36% of the
catalog rendering no evidence.

### Cut / defer
**New site discovery (Colab Gemini Blitz).** Pause adding sites until evidence catches
up. We doubled to 380 sites while 36% carry no sighting evidence — breadth is actively
diluting the moat. The PM principle is explicit: depth beats breadth. Adding site #381
makes the trust gap worse, not better. Resume discovery only after the zero-evidence
count is near zero.

---

## Open decisions / things to verify

- [ ] Verify `/plan` itinerary builder completeness against Phase 8–10 success criteria.
- [ ] Confirm the ~5 missing reef-health locations are real gaps vs. an id-keying
      mismatch in the data.
- [ ] Is there a live grant deadline? `docs/grants-charter.md` does not exist — the
      charter assumed by the operator task is missing. Need to recreate it or confirm
      no deadline is active.
- [ ] Decide region-of-origin assumption for trip cost ranges (US/EU/AU) — Phase 9.

---

## Tomorrow's focus

9am positioning check should stress-test whether the homepage communicates the
species-chaser-evidence promise within 10 seconds, given that 36% of sites can't yet
back that promise with data.
