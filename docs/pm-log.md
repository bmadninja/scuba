# PM Log — scubaseason.fun

Running log of product insights, decisions, and open questions. Newest at top.

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
