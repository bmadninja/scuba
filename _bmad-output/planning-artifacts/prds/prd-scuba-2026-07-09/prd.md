---
title: Reef-State Model Redesign
status: draft
created: 2026-07-09
updated: 2026-07-09
author: Josie
---

# PRD: Reef-State Model Redesign
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the builder-operator (Josie) and any downstream agent implementing the change; it also serves the editorial reviewers who currently maintain reef-state by hand. It specifies **what the reef-state verdict must consume, output, and expose** after the redesign — capabilities, not code. It is Glossary-anchored: features are grouped with globally-numbered FRs nested under them, assumptions are tagged `[ASSUMPTION]` inline and indexed in §9. The scoring mechanics that are genuinely implementation (exact pillar weights, score-to-band cutoffs, formula shapes) live in `addendum.md` alongside source-data field references and the comparable-index research that grounds them, so this document stays about requirements. It builds on the existing code: `src/lib/data/reef-state.ts` (`getReefState`), `src/lib/data/effective-fishing.ts`, and the `src/data/*.json` feeds catalogued in `sources.json`.

## 1. Vision

Reef state is the single most load-bearing scientific claim scubaSeason makes: a colored dot and one word — **Improving / Stable / Declining / Not surveyed** — that tells a diver what condition a reef is in. Today that verdict is computed from only three inputs (observed coral cover, the worst NOAA thermal alert, and reconciled fishing pressure), while the strongest signal of reef health we actually collect — the **fish community** — is invisible to it. Every fish-biomass and abundance dataset we've added (RLS, REEF, AGRRA, Reef Check, Blue Parks) is flagged "display-only, never a reef-state input." The gap is patched by hand: **4** locations carry a true `manualReefState` override — three of them (`torre-guaceto-italy`, `abrolhos-banks`, `chumbe-island-tanzania`) forced to **thriving** purely on fish-biomass evidence the algorithm can't see ("biomass inside the reserve runs several times higher than the fished reefs outside") — and a further **10** records carry a documented fish-biomass *basis* without (yet) overriding the verdict, latent cases the editors have already reasoned through by hand. Editors are re-deriving, per site, exactly the signal the algorithm ignores.

This redesign replaces the hard-threshold cascade with an **evidence-weighted, multi-pillar model**. Four pillars — coral, thermal, fish community, and fishing pressure — each score a reef's condition, each carry their own confidence, and combine into one verdict plus an explicit **confidence tier** and a **per-pillar breakdown** the reader can inspect. Fish biomass becomes a first-class pillar for the **77 of 355 locations that have structured survey data** (Reef Life Survey biomass, REEF abundance, AGRRA) — that is where the redesign adds the most: verdicts that reflect the fish community, normalized against a reference, on roughly a fifth of the atlas that today ignores it. Species sightings — now live from iNaturalist, GBIF and OBIS — take a supporting role: not a health signal in themselves, but a way to raise confidence and reduce "Not surveyed."

A scope reality this PRD is honest about, surfaced by a data audit during drafting: the model does **not** auto-retire the existing overrides. The three fish-driven `thriving` overrides (`torre-guaceto-italy`, `abrolhos-banks`, `chumbe-island-tanzania`) cannot be computed, for two independent reasons — their fish-biomass evidence lives only in prose literature citations, not in any structured field the pillar can read; and two of them carry *moderate* measured GFW effort that the preserved fishing gate (correctly) blocks from Improving. These are exactly the cases the cited-override mechanism exists for, and they remain honest, sourced exceptions. The redesign's win is coverage and trustworthiness on the majority of the atlas, not the retirement of a handful of hand-tuned reserves.

The approach is not invented from scratch: it mirrors how established indices score reef condition — the Ocean Health Index's *status + trend + pressures* decomposition rescaled against per-pillar reference points, the Healthy Reefs Initiative Reef Health Index's equal-weight, threshold-binned mean of coral + fish pillars, NOAA Coral Reef Watch's anomaly-against-site-baseline thermal ladder, and the fisheries-standard practice of expressing fish biomass as a fraction of an unfished regional baseline (B/B₀). The outcome the diver sees is unchanged — the same four words. What changes is that the verdict is now defensible, transparent, and consistent with the very charts sitting beside it — and the atlas stops depending on hand-maintained overrides to tell the truth.

## 2. Target User

### 2.1 Jobs To Be Done
- **As a diver planning a trip**, I want a trustworthy one-glance read of whether a reef is healthy or degraded, so I can choose where to dive and set expectations.
- **As a diver comparing sites**, I want reef-state labels that mean the same thing across basins, so a "Stable" Caribbean reef and a "Stable" Coral Triangle reef are genuinely comparable.
- **As a skeptical / scientifically-literate reader**, I want to see *why* a reef got its label — which evidence, how fresh, how confident — so I can trust or challenge it.
- **As the builder-operator (Josie)**, I want the verdict to reflect the structured fish and coral data we already ingest (the 77 sites with survey series) automatically, so I only hand-write an override for the genuine exceptions where the evidence isn't machine-readable.
- **As an editor**, I want a documented escape hatch for the rare reef where published evidence genuinely overrides the computed signal, without that being the default maintenance path.

### 2.2 Non-Users (v1)
- Researchers seeking raw survey data — we present a derived verdict with provenance, not a data-download product.
- Site operators / dive shops wanting to influence their reef's rating — the verdict is evidence-driven and not submission-editable.

### 2.3 Key User Journeys

- **UJ-1. Maya reads a reef card and trusts the dot.**
  - **Persona + context:** Maya, an Advanced Open Water diver comparing three Indonesian sites for a July trip, cares about seeing healthy coral and big fish.
  - **Entry state:** unauthenticated, on a location page, scanning reef cards.
  - **Path:** she sees a green **Improving** dot on Raja Ampat; taps the "How this is calculated" disclosure; sees four pillar rows — coral cover above its regional baseline and rising, thermal stress low, fish community well above the Indo-Pacific benchmark, fishing protected — each with a freshness note and source.
  - **Climax:** the fish-community row explains the strong rating she'd otherwise have doubted; the breakdown matches the biomass chart lower on the page.
  - **Resolution:** she trusts the label and books the trip. **Edge case:** on a reef with only a coral reading and no fish data, the breakdown shows the fish pillar as "no data" and the verdict carries a **Provisional** confidence chip rather than silently implying full evidence.

- **UJ-2. Josie gets a correct verdict on a structured-data reserve without a hand override.**
  - **Persona + context:** Josie ingests a batch of sites that have Reef Life Survey biomass series (e.g. the 57 RLS locations).
  - **Entry state:** the ETL has written `fish-biomass-series.json` records; low/protected measured fishing; no manual override.
  - **Path:** the Fish-Community Pillar reads the RLS biomass against its reference, the Fishing Pillar reads low/protected effort, coral and thermal pillars fill in, and the model returns the right verdict on its own with a full breakdown.
  - **Climax:** the verdict reflects the fish community — which the old three-input model ignored entirely — and matches the biomass chart on the page.
  - **Resolution:** no override needed for a structured-data site. **Edge case (the honest limit):** for a reserve whose fish evidence is *only* in published literature (`torre-guaceto-italy`, `abrolhos-banks`, `chumbe-island-tanzania`), the Fish Pillar has no input and/or the fishing gate blocks Improving; Josie keeps a cited `manualReefState`, and the breakdown flags the verdict as editorially adjusted with its basis. Migrating these would require a new task to ingest per-site biomass from the cited studies (see §8).

## 3. Glossary

*Downstream workflows and readers use these terms exactly; no synonyms elsewhere in the PRD.*

- **Reef State** — the derived condition verdict for a location, one of the four **Verdict Labels**. Internal state keys remain `thriving | pressure | change | unknown`; user-facing labels remain Improving / Stable / Declining / Not surveyed.
- **Verdict Label** — the user-facing word: **Improving**, **Stable**, **Declining**, **Not surveyed**.
- **Pillar** — one of four independent evidence dimensions scored per location: **Coral Pillar**, **Thermal Pillar**, **Fish-Community Pillar**, **Fishing Pillar**.
- **Pillar Score** — a pillar's normalized condition read on a common rescaled range, with an attached **Pillar Confidence** (a function of data presence, freshness, and sample support). A pillar with no data has no score and does not vote.
- **Reference Anchor** — the value a pillar's raw reading is scored against. Per the research grounding (§addendum), the anchor is chosen deliberately *per pillar*: the **Coral Pillar** uses biologically/outcome-anchored cover thresholds (e.g. AGRRA/Reef Health Index bins) that travel across regions because they are tied to reef function, with the `coral-cover-regional.json` series used as *trend/context*, not as the "healthy" bar; the **Fish-Community Pillar** uses reference-relative normalization (measured biomass/abundance against a program or MPA-contrast reference) where one exists. The `coral-cover-regional.json` series is a degraded recent-status trend — it is explicitly **not** used as the definition of a healthy reef (avoiding shifting-baseline error).
- **Verdict Confidence** — the model's overall confidence in the Reef State, expressed as a **Confidence Tier**. Distinct from any single Pillar Confidence.
- **Confidence Tier** — the discrete overall-confidence band attached to a verdict (proposed: *Well-surveyed / Provisional / Sparse*).
- **Pillar Breakdown** — the reader-facing, per-pillar explanation of the verdict: each pillar's read, its freshness, its source, and whether it had data.
- **Fish-Community Pillar** — the pillar scoring fish biomass/abundance against a Reference Anchor, drawn from the structured survey series: RLS biomass, REEF abundance, and AGRRA fish. (Blue Parks award tier and Reef Check regional indicator densities are *context*, not per-site pillar inputs — see Protection Signal.)
- **Protection Signal** — MPAtlas status and Blue Parks award tier (`blue-parks.json`: an award `level`, not biomass). Feeds the Fishing Pillar as a protection modifier; never counted as a fish-biomass reading (which would double-count protection).
- **Effective Fishing** — the reconciled human-pressure read (GFW measured effort × MPAtlas protection) from `effective-fishing.ts`; values `protected | low | moderate | high | very-high | paper-park | unknown`.
- **Sighting Signal** — supporting information derived from live species sightings (iNaturalist/GBIF/OBIS) and per-site monthly sighting probability; feeds Verdict Confidence and, where flagged, an apex/indicator proxy — never a Pillar Score on its own.
- **Manual Override** — an editorial `manualReefState` value in `reef-pressure.json` that supersedes the computed Reef State, requiring a cited basis (`manualReefStateBasis`, `manualReefStateSourceIds`).
- **Not Surveyed** — the verdict returned when total evidence is below the minimum floor; the model never infers a positive label from the absence of data.

## 4. Features

### 4.1 Evidence-Weighted Verdict Engine

**Description:** The core of the redesign. `getReefState` is replaced by a pipeline that (a) computes up to four **Pillar Scores** each with a **Pillar Confidence**, (b) rescales each pillar to a common range and combines the available pillars into a composite condition read weighted by pillar importance and pillar confidence, (c) maps the composite to a **Verdict Label**, and (d) emits an overall **Verdict Confidence** tier. Pillars with no data are omitted from the weighting rather than counted as neutral or positive. "Bad-direction" inputs (heat stress, fishing pressure) are inverted so all pillar scores point the same way before combining. The engine preserves the two non-negotiable invariants the current code holds: the verdict must never contradict the charts on the same page (a reef with falling coral cover cannot read Improving), and the absence of bad news is never evidence of health. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-1: Compute a composite verdict from available pillars
The system computes Reef State from the set of Pillars that have data for a location, weighting each pillar's contribution by its configured importance and its Pillar Confidence.

**Consequences (testable):**
- Given all four pillars present, the verdict is a deterministic function of the four Pillar Scores and their confidences.
- Given only a subset of pillars with data, absent pillars contribute zero weight (neither positive nor negative) and the verdict is computed from the present subset.
- The function is pure and unit-testable in isolation from the data layer (mirrors the existing `effective-fishing.ts` boundary).
- Re-running on unchanged inputs yields an identical verdict (deterministic; no time-of-day dependence except documented freshness decay).

#### FR-2: Emit the four Verdict Labels with unchanged public vocabulary
The system outputs one of `thriving | pressure | change | unknown`, surfaced as Improving / Stable / Declining / Not surveyed, preserving the existing `STATE_TEXT`, `STATE_COLOR`, and `STATE_DEF` contracts consumed across the UI.

**Consequences (testable):**
- Existing consumers (`reef-state-badge`, `reef-health-badge`, `sites-globe`, `explore-page`, `filter-bar`) render without changes to the label/color enum.
- `STATE_DEF` copy is updated to describe the multi-pillar basis but the four keys are unchanged.

#### FR-3: Enforce the "no positive label from absence of data" floor
The system returns **Not surveyed** whenever total available evidence weight is below a defined floor, rather than defaulting to any positive label.

**Consequences (testable):**
- A location with no Coral, Thermal, or Fish pillar data returns Not surveyed even if the Fishing pillar reads protected.
- Fishing pressure alone (a human-pressure input, not a condition survey) can never lift a location out of Not surveyed. *(Preserves current `reef-state.ts:88` behavior.)*

#### FR-4: Improving requires present, non-falling coral evidence
The system may return Improving only when the Coral Pillar has data and that data is not declining. Absence of coral data cannot satisfy the Improving gate.

**Consequences (testable):**
- A reef whose latest observed coral cover is below its paired/series-derived historical cover does not return Improving under any combination of other pillars. *(Preserves the `coralFalling` gate at `reef-state.ts:106`.)*
- A reef with **no** coral reading cannot return Improving even if Fish and Fishing pillars are strongly positive — it resolves to Stable or Not surveyed. *(Closes the coral-absent → Improving hole; e.g. `torre-guaceto-italy` with zero reef-health records cannot be computed to Improving, which is why it stays a cited override.)*
- Improving still additionally requires `fishingAllowsImproving(effective)` (FR-11), so a site in the *moderate* GFW band (e.g. `abrolhos-banks` 301h, `chumbe-island-tanzania` 352h) cannot reach Improving regardless of its fish score.

**Feature-specific NFRs:**
- Verdict computation runs at build time over all locations within the existing build budget; no per-request computation. [ASSUMPTION: reef-state stays build-time static, consistent with the current `src/data` read-only model.]

### 4.2 Coral Pillar

**Description:** Scores coral condition as **level against biologically-anchored cover thresholds** plus **trend from the multi-year series**. Level uses outcome-anchored bins (Reef Health Index / AGRRA style — e.g. very-good ≥40%, … critical <5%) that are tied to reef function and therefore travel across regions, replacing the current basin-blind `<25`/`>=40` gates *without* substituting a shifting regional mean for "healthy." The `coral-cover-regional.json` series is used only to **contextualise expectation and inform trend**, never as the definition of healthy (a degraded ~15% Caribbean mean must not let a collapsed reef read as "at baseline = good"). Trend uses the fuller series in `coral-cover-series.json` / `agrra-reef-series.json` when present, else the observed-vs-historical pair. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Score coral level against biologically-anchored thresholds, with regional context
The Coral Pillar scores observed cover against outcome-anchored bins (not a global-mean-relative "healthy"), and uses the regional series for trend/context only.

**Consequences (testable):**
- A reef at 15% cover reads as degraded regardless of a degraded regional mean of ~15% (no shifting-baseline reward). *(Directly closes the adversarial FR-5 finding.)*
- The Coral Pillar Score is consistent with `STATE_DEF.thriving` ("at or above its long-term baseline"): the anchor is the functional/long-term reference, not the recent regional status trend.
- A location with no coral reading yields no Coral Pillar Score (not a zero/positive read).

#### FR-6: Derive coral trend from the multi-year series when available
The Coral Pillar computes a trend (rising / stable / falling) from the multi-year coral series when present, and falls back to the observed-vs-historical pair otherwise.

**Consequences (testable):**
- Where `coral-cover-series` / `agrra-reef-series` data exists, trend reflects the series slope, not just the two most extreme points.
- The falling-trend read remains consistent with the on-page coral-cover chart (FR-4).

### 4.3 Thermal Pillar

**Description:** Scores heat stress from NOAA Coral Reef Watch. **Data finding (resolved):** `reef-health.json` holds a single *current* thermal snapshot per location (nightly overwrite) with no per-site history, so cross-season *recurrence* cannot be scored without an ETL change (deferred, non-goal for MVP). It does carry a continuous **Degree Heating Weeks (DHW)** value for 120/121 records, so the v1 pillar scores on **continuous DHW magnitude** — already an anomaly against CRW's per-site baseline and anchored to bleaching/mortality outcomes — instead of the coarse worst-ever ordinal `alertLevel`. Realizes UJ-1.

**Functional Requirements:**

#### FR-7: Score thermal stress from continuous current DHW
The Thermal Pillar scores from the current Degree Heating Weeks value (continuous), falling back to the ordinal `alertLevel` where DHW is absent.

**Consequences (testable):**
- Two reefs at different DHW magnitudes but the same ordinal alert band receive different Thermal Pillar Scores.
- Absence of any thermal reading (no DHW and no `alertLevel`) yields no Thermal Pillar Score (not a zero/positive read).
- **Deferred (v2, requires ETL change):** accumulating thermal snapshots over time to score recency/recurrence. Logged so it is not silently dropped.

### 4.4 Fish-Community Pillar

**Description:** The headline addition, scoped honestly to where structured data exists — the **77 locations** (57 RLS, 7 REEF, 18 AGRRA; union) with a per-site fish survey series. Each source is normalized **within its own metric** to a common `0..1` (the sources are unit-heterogeneous: RLS `biomassKgPerHa` and `abundancePer500m2`, REEF zone sighting-frequency/abundance, AGRRA biomass — they cannot share one formula), scored against the best available reference for that source (its program/regional distribution, or an MPA/fished-vs-protected contrast where the source provides one). `reef-check-fish-regional.json` (volunteer indicator *densities* per 100 m², 1997–2001 global survey) is coarse **context**, not the per-site normalizer. A rigorous B/B₀-against-unfished-baseline read is *not* attempted, because the per-site unfished baselines it needs are not in the data (documented limitation). The **44 sites** in the current overrides/basis set that lack any structured series are out of this pillar's reach — see §4.8. Realizes UJ-2.

**Functional Requirements:**

#### FR-8: Score fish community per-source against a documented reference, normalized to a common range
The Fish-Community Pillar scores only locations with a structured fish series, normalizing each source within its own metric to `0..1` against a documented reference, then combining per FR-9.

**Consequences (testable):**
- Every fish input is rescaled to `0..1` before combination; no raw kg/ha, abundance, or density value is averaged directly across sources.
- A site with no structured fish series produces **no** Fish-Community Pillar Score (it does not fall back to a benchmark it has no data for).
- The reference and unit used for each source are recorded for the Pillar Breakdown; where only a relative (MPA-contrast/trend) read is possible, it is labeled as such, not presented as an absolute biomass level.

#### FR-9: Combine multiple fish sources by evidence quality
When more than one fish source covers a location, the pillar combines them with a documented precedence/quality order (e.g. peer-reviewed in-situ biomass > volunteer indicator counts), gating on observer-reliability where the source records it.

**Consequences (testable):**
- Source precedence is explicit and testable; adding a lower-quality source never overturns a higher-quality one for the same location.
- The sources that drove the score are captured for the Pillar Breakdown (FR-13) with their `sourceIds`.

#### FR-10: Classify every override as computable or genuine-exception (regression diff)
A regression harness computes the new verdict for each override/basis location and classifies it, rather than presuming any target retirement rate. *(Data audit finding: the 3 fish-driven `thriving` overrides are known to be non-computable — see below — so this FR is about honest classification, not a migration quota.)*

**Consequences (testable):**
- The harness computes verdicts for the 4 override locations + 10 basis-annotated records and diffs against current/documented values; each is labeled **computable** (the model reproduces the intent → the override can retire) or **genuine-exception** (must remain a cited override), with the reason recorded.
- The 3 fish-driven `thriving` overrides are pre-classified **genuine-exception** and the classification must confirm *why*: `torre-guaceto-italy` has no coral/thermal/fish-series data at all (→ Not surveyed, and no coral → FR-4 blocks Improving); `abrolhos-banks` (301h) and `chumbe-island-tanzania` (352h) sit in the *moderate* GFW band so FR-11 blocks Improving. Their biomass evidence exists only as prose literature citations, not structured fields.
- Run the diff before agreeing any acceptable-divergence set. *(Decision: diff first.)*

### 4.5 Fishing Pillar

**Description:** Extends the existing reconciled `effective` read with **trajectory** — whether measured pressure is rising or falling over the multi-year GFW series — and keeps MPAtlas/Blue Parks protection as a modifier. Reuses `effective-fishing.ts` (`reconcile`, `fishingAllowsImproving`, `fishingTrend`). As a pressure input, its score is inverted before combination (FR-1).

**Functional Requirements:**

#### FR-11: Score fishing from effective band and trajectory
The Fishing Pillar scores from the reconciled Effective Fishing band and the multi-year effort trajectory.

**Consequences (testable):**
- A protected reef with falling effort scores better than an equally-protected reef with rising effort.
- `paper-park` (protected on paper, heavy measured effort) can never contribute a positive read. *(Preserves `reconcile` semantics.)*
- The existing `fishingAllowsImproving` gate is honored: only protected/low/unknown effective states permit an Improving verdict.

### 4.6 Verdict Confidence & Pillar Breakdown

**Description:** Every verdict carries an explicit **Confidence Tier** and a reader-inspectable **Pillar Breakdown** — the transparency surface that makes the label trustworthy and is what lets overrides retire. Surfaced in `src/app/locations/[slug]/how-calculated.tsx` and on reef cards. Realizes UJ-1.

**Functional Requirements:**

#### FR-12: Emit a Verdict Confidence tier with every verdict
The system attaches a Confidence Tier reflecting how much evidence (pillar count, freshness, sample support) backs the verdict.

**Consequences (testable):**
- A four-pillar, freshly-surveyed reef reports a higher tier than a single-pillar, stale one.
- The tier is available to the UI as a discrete value for a chip/badge next to the label.

#### FR-13: Expose a per-pillar breakdown
For each location the system exposes each pillar's read, its data-freshness, its contributing sources, and whether it had data.

**Consequences (testable):**
- The breakdown lists all four pillars; pillars with no data render as "no data," not omitted silently.
- Each pillar row references the `sourceIds` / `methodologyClaimIds` that produced it, consistent with the existing provenance system.
- The breakdown's coral and fish rows agree in direction with the coral-cover and fish-biomass charts on the same page (no visible contradiction).

#### FR-14: Update the methodology copy
The "How this is calculated" surface describes the multi-pillar model, the per-pillar Reference Anchor normalization, and the confidence tiers, replacing the current three-input description.

**Consequences (testable):**
- `how-calculated.tsx` and `methodologies.json` claims reflect the four pillars and confidence model.
- No methodology claim asserts an input the engine does not actually use.

### 4.7 Sighting Signals (Supporting)

**Description:** Live species sightings (iNaturalist/GBIF/OBIS via `sightings.json`) and per-site monthly sighting probability take a **supporting** role only: they raise Verdict Confidence, can lift a reef out of Not surveyed, and — where flagged — provide a coarse apex/indicator-species proxy for the Fish-Community Pillar where no biomass survey exists. Presence is never treated as health on its own.

**Functional Requirements:**

#### FR-15: Use Sighting Signal for confidence and coverage, not as a health score
Sighting Signals contribute to Verdict Confidence and to the Not-Surveyed floor, and may supply an apex/indicator proxy, but never constitute a Pillar Score by themselves.

**Consequences (testable):**
- A reef with rich recent sightings but no coral/thermal/fish survey still does not receive a positive Verdict Label from sightings alone (FR-3 holds).
- Recent verified sightings raise the Verdict Confidence tier and can move a location from Not-Surveyed to a low-confidence verdict only when at least one true condition pillar is also present.
- The apex/indicator list ships as a small, conservative set referred to by **common names only** (no scientific/Latin names) — e.g. reef sharks, groupers, Napoleon wrasse, bumphead parrotfish, large jacks/trevally. It is refined post-launch.
- Where used as an apex proxy, sightings are cross-referenced with IUCN status (`iucn-status.json`) and clearly labeled as a proxy in the breakdown.

### 4.8 Override Migration & Governance

**Description:** The redesign retires only overrides the model can genuinely reproduce, and preserves a **documented, cited escape hatch** for the exceptions — which, per the data audit, currently include all 3 fish-driven `thriving` overrides. This section is about correct classification and governance, not a retirement count. Realizes UJ-2.

**Functional Requirements:**

#### FR-16: Preserve a cited editorial override path
Editors can still set `manualReefState`, and it supersedes the computed verdict, but only with `manualReefStateBasis` and `manualReefStateSourceIds` present.

**Consequences (testable):**
- `atlas-location.ts` still applies `manualReefState ?? computed`.
- An override without a cited basis is rejected by the provenance validator (`validate-provenance.mjs`).
- The Pillar Breakdown flags an overridden verdict as editorially adjusted and shows the basis.

#### FR-17: Remove only overrides classified computable; document the rest
Overrides the FR-10 diff classifies **computable** are removed; every **genuine-exception** override stays with a documented reason.

**Consequences (testable):**
- Only overrides whose computed verdict matches the retired value are removed; a regression report records the match per removal.
- Each retained override names its exception reason — e.g. `channel-islands-usa` held at `pressure` (recovery hasn't held under warming); `torre-guaceto-italy` (no structured condition data); `abrolhos-banks` / `chumbe-island-tanzania` (moderate GFW effort blocks Improving; biomass evidence literature-only).
- **It is an acceptable outcome that zero overrides are removed in v1** — the redesign's value is the 77 structured-data sites, not override retirement (§SM-1).

## 5. Non-Goals (Explicit)

- **Not** changing the four Verdict Labels, their colors, or the diver-facing vocabulary.
- **Not** turning reef-state into a per-request or real-time computation — it stays build-time static over `src/data`.
- **Not** exposing a raw numeric 0–100 reef score to end users (the composite score is internal; users see label + confidence + breakdown). [NON-GOAL for MVP — a public numeric score could be a v2 consideration.]
- **Not** making reef-state editable by site operators or via user submissions.
- **Not** re-architecting the ETL feeds themselves — this consumes the existing ingested JSON, it does not change how data is fetched.
- **Not** building new charts; the breakdown reuses existing chart data and the provenance system.

## 6. MVP Scope

### 6.1 In Scope
- The Evidence-Weighted Verdict Engine (§4.1) with all four pillars (§4.2–4.5).
- Regional-baseline normalization for coral and fish (FR-5, FR-8).
- Verdict Confidence tier and Pillar Breakdown (§4.6).
- Sighting Signals in the supporting role (§4.7).
- Override migration with the cited escape hatch retained (§4.8), including the regression report.
- Updated methodology copy (FR-14).

### 6.2 Out of Scope for MVP
- A public numeric reef score — deferred; users get label + tier + breakdown.
- Apex/indicator-species proxy tuning beyond a first documented list — the proxy ships behind a conservative default and is refined post-launch. [NOTE FOR PM: the apex-proxy is the most speculative pillar-adjacent piece; safe to ship minimal.]
- Automated per-pillar weight learning/calibration — weights are hand-set (equal-weight default, documented as a policy choice) in the addendum for v1.
- Back-filling regional baselines for regions not yet in `coral-cover-regional.json` / `reef-check-fish-regional.json` — those sites use documented fallbacks and lower confidence.

## 7. Success Metrics

*Each SM cross-references the FR(s) it validates.*

**Primary**
- **SM-1: Fish-pillar coverage & impact.** The Fish-Community Pillar contributes to the verdict on the ~77 structured-fish-data locations, and every override is classified computable/genuine-exception with a recorded reason. *Override retirement is not itself a target — zero removals is an acceptable v1 result.* Validates FR-8, FR-10, FR-17.
- **SM-2: Verdict/chart consistency.** Zero locations where the reef-state label or a Pillar Breakdown row visibly contradicts its own coral-cover **or fish-biomass/abundance** chart (the coral **and** fish rows must agree in direction with their charts). Validates FR-4, FR-13.
- **SM-3: Coverage lift.** Fewer locations return Not surveyed than under the current model, driven by the Fish-Community Pillar and Sighting confidence — *without* violating the evidence floor. Validates FR-3, FR-8, FR-15.

**Secondary**
- **SM-4: Explainability.** Every non-Not-Surveyed verdict renders a complete four-row Pillar Breakdown with sources. Validates FR-13.
- **SM-5: Confidence signal present.** Every verdict carries a Confidence Tier. Validates FR-12.

**Counter-metrics (do not optimize)**
- **SM-C1: Coverage must not become dishonest.** The drop in Not surveyed (SM-3) must not come from letting sightings or fishing alone manufacture positive labels. Counterbalances SM-3 — if Not-Surveyed falls but low-confidence positive labels spike on thin evidence, that is a regression, not a win.
- **SM-C2: Improving must stay rare and earned.** The share of reefs labeled Improving must not rise simply because the fish pillar is generous; Improving still requires *present*, holding/rising coral (FR-4) and protected/low fishing (FR-11). Counterbalances SM-1/SM-3.

## 8. Resolved Decisions & Remaining Questions

**Resolved (2026-07-09, Josie):**
1. **Override diff (FR-10):** *Run the regression diff first, then classify* — no retirement target. Diff scope: the 4 true overrides + 10 basis-annotated records. *(Reframed after the data audit: the 3 fish-driven `thriving` overrides are non-computable, so this is classification, not a quota.)*
2. **Pillar weights & score cutoffs (FR-1):** **Equal importance weights** as the documented default; coral level uses outcome-anchored (biologically-tied) cover thresholds, not a regional-mean-relative "healthy" (FR-5); calibrated against the regression set.
3. **Apex/indicator proxy (FR-15):** ship a **small conservative list, common names only** (no scientific names); refine post-launch.
4. **Thermal (FR-7):** confirmed by data — no per-site thermal history exists, so v1 scores on **continuous current DHW**, not recurrence. Recurrence deferred to a v2 ETL change.
5. **Confidence tier taxonomy (FR-12):** **three tiers — Well-surveyed / Provisional / Sparse.**
6. **Regional-baseline coverage (FR-5, FR-8):** confirmed — coral baselines cover **10 regions** (`coral-cover-regional.json`); fish benchmarks cover **2 basins only** (`indo-pacific`, `atlantic`), so fish normalization is basin-coarse in v1. Uncovered regions/basins use a documented fallback + lower confidence. Verify exact fish-biomass reference cutoffs against the latest published report card before hard-coding (automated source fetch was blocked).

**Reopened / new decisions for Josie (surfaced by the reviewer gate):**
- **Q-A (scope, needs a call): literature-biomass reserves.** The 3 fish-driven `thriving` overrides can't be computed because their biomass evidence is prose-only. Two paths: **(i)** keep them as cited `manualReefState` exceptions (cheap, honest, zero new work — the recommended default), or **(ii)** add an ETL/extraction task that captures per-site biomass from the cited studies into a structured field so the Fish Pillar can read them (scope expansion; would still hit the FR-11 fishing gate for abrolhos/chumbe, so only `torre-guaceto` could plausibly flip). *Which path?*
- **Q-B (methodology): fish reference definition.** With no per-site unfished baseline in the data, is per-source relative normalization + MPA-contrast (FR-8) acceptable for v1, or is a proper B/B₀ ingestion a launch blocker? *(Recommend: accept relative-for-v1, note the limitation.)*
- **Q-C:** whether the 2-basin fish context and coral outcome-anchored bins need finer calibration before launch (assess after the diff).

## 9. Assumptions Index
*(All prior draft assumptions resolved by the 2026-07-09 data investigation and Josie's decisions above.)*
- §4.1 (FR-1 NFR) — Reef-state stays build-time static over `src/data`, consistent with the read-only data model. *(Standing assumption; unchanged.)*
