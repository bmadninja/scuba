# PM Log — scubaseason.fun

Running log of product insights, decisions, and open questions. Newest at top.

---

## 2026-06-11 ~10:55pm — Reflection (late catch-up run; fired well after the 5pm slot)

**Why this run matters: I caught the charter telling a comforting lie.** The charter
records the homepage positioning gap as **DONE** — "the hero now makes the species
promise" — because the *committed* H1 reads "Where to dive and what you'll actually see."
That is still what is live on prod. But the staged, in-flight redesign (the 13-file
changeset, still uncommitted a full day after 2026-06-10) **replaces the text hero with a
new `HeroCarousel` component** (`src/components/hero-carousel.tsx`, untracked), and its
lead slide H1 is:

> **"Know the reef before you dive."**
> _Live health status, species sightings, and conservation data for every site._

Slide 2 is a reef-health testimonial ("Komodo and Raja Ampat are both thriving").

**This is a quiet regression on the single thing the charter celebrated.** The new hero
leads with the *atlas/grant wrapper* (know the reef, health status) and demotes the
*species-chaser job* — our hard-won 99%-coverage moat — to **one noun in a list of three**
in the subhead. The exact failure mode the 2026-06-05 positioning analysis named ("a diver
who wants to decide a trip lands on what reads as a climate dashboard") is being re-built,
not fixed. The gap was never closed; it was closed *in the committed copy* and is reopening
*in the staged copy* the moment this redesign lands.

**Biggest open question right now (changed):** not the consolidation-intent question (still
open, still Josie's call) — it is now **"is the carousel hero the intended direction, or
drift?"** If Josie wants the species promise above the fold, slide 1 needs to lead with the
"what you'll actually see / where & when" job, and "know the reef" becomes slide 2. If she
wants reef-health-first as the deliberate grant face, then the charter's "positioning gap
DONE" entry is simply wrong and the species moat has no front door at all (atlas facet does
not rank, `/where-to-see` pages still removed) — which makes the A2 SEO restore *more*
urgent, not less.

**Assumption I am least confident in:** that the staged redesign is "in flight" and
progressing. It has sat uncommitted for 24h+ with no new commits touching it. It may be
stalled, parked, or abandoned mid-thought. Either way it is now a process risk: staged work
this large rots (merge conflicts, stale context) and it is the explicit blocker on the A2
SEO-restore build. If it is not landing soon, the right move may be to either land it or
shelve it on a branch — not leave 298 insertions floating in the index.

**Did anything change the product's trajectory today?** No code shipped (correct — not a
3pm slot). But this finding changes what the *next* positioning slot must do: stop trusting
the charter's "DONE" and read the actual staged hero.

**Minor flags (not central):** the slide-2 testimonial ("Diver, Hong Kong") reads like a
placeholder or a real quote from Josie's circle — confirm it is real and approved before it
ships, since fabricated social proof undercuts the honest-data moat. Brand string renders
as "ScubaSeason" (camel-case) in the testimonial — check that matches the intended
lowercase "scubaseason.fun" wordmark.

**Grant status:** `docs/grants-charter.md` still does not exist. No grant deadline can be
confirmed, so no override applies. This file has been flagged absent since the 2026-05-29
bootstrap; either there is genuinely no active grant cycle, or the file needs recreating.
Carrying this forward unresolved is itself a risk if a Schmidt Marine / NatGeo deadline is
real and untracked.

**Data I still want (unchanged, now louder):** search-referrer analytics. Whether inbound
visitors arrive on species/"where to see X" queries or reef-health/bleaching queries is the
single signal that settles slide 1's copy. We are choosing the hero's lead job blind.

**Tomorrow's 9am positioning check should:** open `src/components/hero-carousel.tsx` first
(not the committed `page.tsx`), judge slide 1 against the species-chaser job, and decide
whether "Know the reef before you dive" is the intended front door or drift to correct.

---

## 2026-06-10 3:03pm — Execution (slot fired; session spanned the date boundary)

**Decision: do not write code this slot. Write a spec instead.** Two findings made
unilateral code the wrong move, and the disciplined call was to surface a decision
rather than presuppose it.

**Finding 1 — the homepage is being actively reworked right now.** The lead priority
item ("recouple the species moat to the homepage") was already half-done since I last
looked: the committed hero (HEAD) leads with **"Where to dive and what you'll actually
see"** + "A live dive atlas for sightings, reef health, conservation status, and ocean
pressure." That is the species-chaser job restored to the H1 — gap A is substantially
closed at the copy level. _And_ there is a large **uncommitted, staged redesign in
flight**: 13 files, ~298 insertions, including an 88-line rewrite of `page.tsx` (the
current hero H1 is being removed) and a 303-line rework of `atlas-stage.tsx`. Writing
code on that surface would collide with work a human/agent is mid-stream on. Off-limits.

**Finding 2 — the real moat regression is the removed species-landing SEO pages.** The
`/where-to-see/[species]` route — built deliberately as "Phase 11: SEO landing pages —
species, month, cert" (commit b2c9166) — was deleted in a checkpoint commit (3451ce0),
part of a consistent pattern that also removed `/plan`, `/dive-in`, `/encounters`:
the redesign is **consolidating everything into the atlas**. But the substrate is fully
intact: `src/data/encounters.json` (11 marquee bucket-list encounters: sardine-run,
hammerhead-schools, whale-sharks, manta-cleaning-stations, thresher-sharks, great-white,
…), `src/lib/data/encounters.ts`, and the orphaned-but-present `speciesLandingSchema()`
in `schema-org.ts`. The old page is 319 lines, recoverable from git.

**Why this matters strategically.** Those 11 pages are the single highest-intent inbound
SEO surface we have — people literally Google "where to see hammerheads diving." The
per-site species depth (`/sites/[slug]/species/[species]`) still exists, so the moat's
_depth_ survives; what was cut is the moat's _front door for search traffic_. Losing 11
high-intent landing pages is a real funnel cost. But the removal is plausibly a
**deliberate** atlas-first consolidation, not an accident — so I will not restore it by
fiat during an autonomous run with no human present. That is Josie's strategy call.

**What I did instead:** wrote a decision brief + restore spec into the charter (acceptance
criteria + technical notes, scoped to the 11 encounters and the existing dark theme), and
reconciled the charter with reality (hero already changed; redesign in flight; route
removal confirmed deliberate-pattern; data substrate intact).

**Open question carried into 5pm/tomorrow:** the atlas-first consolidation is now an
explicit, repeated pattern (4 routes removed, all folding into the atlas). The strategy
question is no longer "was `/plan` removal accidental?" — it reads deliberate. The real
question is: **does an atlas-only architecture sacrifice inbound SEO that no atlas filter
can replace?** A filter facet does not rank for "where to see whale sharks 2026"; a
landing page does. Decide whether the 11 marquee pages come back as SEO entry points that
deep-link _into_ the atlas (best of both) — that is the spec I wrote.

## 2026-06-05 4:07pm — Positioning & Strategy

_(Run fired against the 9am positioning slot but the session spanned a pause across
the date boundary; clock read 4:07pm Fri at write time. Delivered as positioning
analysis because that is the work done and it surfaced the single most important
product fact right now — the positioning has silently pivoted.)_

**Headline: the product's de-facto positioning has changed, and the charter is stale.**
The `design-lift` branch (Epic 1–4, shipped since the last run) rebuilt the homepage.
The charter's stated bet is _"species chaser grade depth that generic dive search can't
match."_ The homepage now sells something different:

- **H1:** "A data atlas for the living ocean."
- **Subline:** "Ongoing science and daily monitoring — not a one-time write-up."
- **Eyebrow:** "Live · NOAA Coral Reef Watch."
- **Hero stats:** Reefs tracked · 5 km satellite resolution · Data sources.
- **Below fold:** reef states (Thriving / Under pressure / Witnessing change),
  "what a reef is actually doing right now," thermal re-check nightly, "0 marketing
  adjectives."

A first-time visitor concludes in 10 seconds: **this is a scientific reef-health /
climate-monitoring atlas** — NOAA-adjacent, conservation-grade. They do _not_ conclude
"this tells me where and when I'll actually see the animal I'm diving for." The
species-chaser job — the charter's stated moat — is now invisible above the fold. It
survives only as one of six filter facets ("animals") in the atlas explorer, well
below the fold.

**The deep irony:** the evidence moat finally became real, right as the homepage
stopped leading with it. Measured today:
- **Sighting evidence: 353/356 sites carry species evidence. Only 3 have zero.** The
  charter's #1 priority (136 zero-evidence sites, 36%) is **essentially closed.**
- **Reef health: 116 records across 113 locations — backfill complete** (charter #2 done).
- Site count trimmed 380 → **356** (consistent with the "pause discovery" call).
- Routes changed: `/plan`, `/dive-in`, `/encounters` **removed**; `/for/[cert]`,
  `/sites/[slug]/species/[species]`, `/where-to-see/[species]`, `/search` added.

**Is the pivot wrong? No — but it's half-finished.** The living-ocean-atlas framing is
genuinely grant-optimized: Schmidt Marine (ocean conservation data/tech) and NatGeo
reward "rigorous monitoring atlas" far more than "find where to see hammerheads." The
design-lift made the homepage credible to a grant reviewer. That is a defensible,
probably correct move given grants are the forcing function.

**But two products are now fighting and only one is legible:**
- (A) _Living-ocean reef-health atlas_ — grant credibility. Fully rendered on the homepage.
- (B) _Species-chaser trip-decision tool_ — the diver's actual job + the booking/gear
  revenue funnel. Now buried. `/plan` (the funnel) was deleted outright.

The honest synthesis is that it should be **both**: the honest-data atlas is the
credibility _wrapper_; the species/when depth is the diver _payoff_. They don't
conflict — but the homepage currently delivers only the wrapper. A diver who wants to
decide a trip lands on what reads as a climate dashboard, and there's no longer a
`/plan` funnel to convert them.

**Biggest positioning gap (claim vs. deliver):** we now have the evidence to make the
species-chaser promise true (99% coverage), but the homepage no longer makes that
promise at all. We under-sell our strongest, hardest-won asset.

**Recommended direction (not built today — this is the positioning call):** keep the
living-ocean atlas as the brand and grant face, but make the diver's "where & when will
I actually see X" job legible above the fold — one line in/under the hero and one clear
entry point into the wildlife / `/where-to-see` path. This costs little and re-couples
the moat to the front door without diluting grant credibility. Revised positioning
statement drafted into the charter.

**Open question carried forward:** Is the deletion of `/plan` a deliberate strategy
call (atlas-first, monetize later) or collateral damage from the design-lift? If the
booking + gear affiliate funnel is still a goal, something has to carry it — and right
now nothing does. Need to confirm intent before treating "rebuild the trip funnel" as a
priority vs. a regression.

**Data I'd still want:** search analytics — are inbound visitors arriving on
species/where-to-see queries (job B) or on reef-health/bleaching queries (job A)? That
single signal would settle which job to lead with.

---

## 2026-05-29 1:03pm — Prioritization (bootstrap run)

**Context:** First product-operator run. `docs/product-charter.md`, `docs/pm-log.md`,
and `docs/grants-charter.md` did not exist. Bootstrapped the charter and this log from
the real repo state (STORIES.md, STATE.md, BMAD v2 backlog, data-strategy memory) and
from measured data, rather than from the assumed-present files.

**Headline finding — breadth has outrun depth.** Site count grew from 179 (v2 backlog,
2026-05-22) to **380** today, but sighting evidence did not keep pace:

- 244/380 sites have ≥1 sighting record.
- **136 sites (36%) have ZERO sighting evidence.**
- Reef health: 114 records; ~5 locations still missing.

A species chaser — our core moat segment — can land on a famous site and see no
evidence of what they'd see there. That is the single worst trust failure on the site,
and it's getting worse with every new site the Colab blitz adds.

**Prioritization call:**
- **Accelerate:** sighting-evidence backfill (Phase 7). Only item that scores on both
  the moat (species-chaser depth) and grant credibility (honest evidence).
- **Cut / defer:** new site discovery (Colab Gemini Blitz). Pause until the
  zero-evidence count is near zero. Per the PM principle "the moat is depth, not
  breadth" — adding site #381 makes the trust gap worse.

Full ranked list now lives in `docs/product-charter.md`.

**Surprises:**
- `.planning/STATE.md` is stale (claims M2 Phase 6 at 0%; reef-health is actually ~96%
  backfilled). The planning docs and reality have diverged. Charter is now the truth.
- `docs/grants-charter.md` is absent despite being a required read for this task. No
  live grant deadline could be confirmed. Flagged in charter open decisions.

**Open question carried forward:** If the homepage promises species-chaser-grade
evidence but 36% of sites can't back it, is the honest near-term move to (a) backfill
fast, or (b) visibly mark which sites have confirmed evidence so the promise stays true
even before backfill completes? Leaning toward doing both — a confidence indicator on
site cards is cheap and keeps the site honest during backfill.

**Data I'd want but don't have:** search analytics (which sites/species users actually
look for — would tell me which of the 136 zero-evidence sites to backfill first), and
whether any are high-traffic.
