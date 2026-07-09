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

Reef state is the single most load-bearing scientific claim scubaSeason makes: a colored dot and one word — **Improving / Stable / Declining / Not surveyed** — that tells a diver what condition a reef is in. Today that verdict is computed from only three inputs (observed coral cover, the worst NOAA thermal alert, and reconciled fishing pressure), while the strongest signal of reef health we actually collect — the **fish community** — is invisible to it. Every fish-biomass and abundance dataset we've added (RLS, REEF, AGRRA, Reef Check, Blue Parks) is flagged "display-only, never a reef-state input." The gap is patched by hand: ~20 locations carry a `manualReefState` override whose justification is almost always fish biomass ("biomass inside the reserve runs seven times higher than the fished reefs outside"). Editors are re-deriving, per site, exactly the signal the algorithm ignores.

This redesign replaces the hard-threshold cascade with an **evidence-weighted, multi-pillar model**. Four pillars — coral, thermal, fish community, and fishing pressure — each score a reef's condition relative to a regional baseline, each carry their own confidence, and combine into one verdict plus an explicit **confidence tier** and a **per-pillar breakdown** the reader can inspect. Fish biomass becomes a first-class pillar, formalizing what the overrides do by hand and letting most of them retire. Species sightings — now live from iNaturalist, GBIF and OBIS — take a supporting role: not a health signal in themselves, but a way to raise confidence, reduce "Not surveyed," and stand in as a coarse fish-community proxy where no transect exists.

The approach is not invented from scratch: it mirrors how established indices score reef condition — the Ocean Health Index's *status + trend + pressures* decomposition rescaled against per-pillar reference points, the Healthy Reefs Initiative Reef Health Index's equal-weight, threshold-binned mean of coral + fish pillars, NOAA Coral Reef Watch's anomaly-against-site-baseline thermal ladder, and the fisheries-standard practice of expressing fish biomass as a fraction of an unfished regional baseline (B/B₀). The outcome the diver sees is unchanged — the same four words. What changes is that the verdict is now defensible, transparent, and consistent with the very charts sitting beside it — and the atlas stops depending on hand-maintained overrides to tell the truth.

## 2. Target User

### 2.1 Jobs To Be Done
- **As a diver planning a trip**, I want a trustworthy one-glance read of whether a reef is healthy or degraded, so I can choose where to dive and set expectations.
- **As a diver comparing sites**, I want reef-state labels that mean the same thing across basins, so a "Stable" Caribbean reef and a "Stable" Coral Triangle reef are genuinely comparable.
- **As a skeptical / scientifically-literate reader**, I want to see *why* a reef got its label — which evidence, how fresh, how confident — so I can trust or challenge it.
- **As the builder-operator (Josie)**, I want the verdict to reflect the fish and coral data we already ingest without me writing a manual override per reserve, so the atlas scales past the ~20 sites I can hand-tune.
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

- **UJ-2. Josie stops writing manual overrides.**
  - **Persona + context:** Josie ingests a new batch of Blue Parks reserves with published fish-biomass evidence.
  - **Entry state:** the ETL has written fish-biomass and regional-benchmark records; no manual override exists for the new sites.
  - **Path:** the fish-community pillar reads the biomass relative to the regional benchmark, the fishing pillar reads the reserve as protected, and the model returns **Improving** on its own.
  - **Climax:** the verdict matches what Josie would have hand-written, with the same cited sources surfaced automatically.
  - **Resolution:** no override needed; the reserve is correct at scale. **Edge case:** where long-term monitoring shows a caveat the data can't express (e.g. sharks declining despite high biomass), Josie can still set an override, and the breakdown flags the verdict as editorially adjusted with its basis.

## 3. Glossary

*Downstream workflows and readers use these terms exactly; no synonyms elsewhere in the PRD.*

- **Reef State** — the derived condition verdict for a location, one of the four **Verdict Labels**. Internal state keys remain `thriving | pressure | change | unknown`; user-facing labels remain Improving / Stable / Declining / Not surveyed.
- **Verdict Label** — the user-facing word: **Improving**, **Stable**, **Declining**, **Not surveyed**.
- **Pillar** — one of four independent evidence dimensions scored per location: **Coral Pillar**, **Thermal Pillar**, **Fish-Community Pillar**, **Fishing Pillar**.
- **Pillar Score** — a pillar's normalized condition read on a common rescaled range, with an attached **Pillar Confidence** (a function of data presence, freshness, and sample support). A pillar with no data has no score and does not vote.
- **Regional Baseline** — the reference value a pillar is normalized against for the reef's biogeographic region/basin, sourced from `coral-cover-regional.json` (coral) and `reef-check-fish-regional.json` (fish), plus published unfished/no-take references for fish biomass. Normalization is relative to baseline, never a global absolute threshold.
- **Verdict Confidence** — the model's overall confidence in the Reef State, expressed as a **Confidence Tier**. Distinct from any single Pillar Confidence.
- **Confidence Tier** — the discrete overall-confidence band attached to a verdict (proposed: *Well-surveyed / Provisional / Sparse*).
- **Pillar Breakdown** — the reader-facing, per-pillar explanation of the verdict: each pillar's read, its freshness, its source, and whether it had data.
- **Fish-Community Pillar** — the pillar scoring fish biomass/abundance relative to the Regional Baseline, drawn from RLS, REEF, AGRRA fish-biomass, Reef Check indicator fish, and Blue Parks evidence.
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

#### FR-4: Never contradict the coral-cover chart
When the Coral Pillar shows a measured decline, the system cannot return Improving.

**Consequences (testable):**
- A reef whose latest observed coral cover is below its paired historical cover does not return Improving under any combination of other pillars. *(Preserves the `coralFalling` gate at `reef-state.ts:106`.)*

**Feature-specific NFRs:**
- Verdict computation runs at build time over all locations within the existing build budget; no per-request computation. [ASSUMPTION: reef-state stays build-time static, consistent with the current `src/data` read-only model.]

### 4.2 Coral Pillar

**Description:** Scores coral condition as **level relative to Regional Baseline** plus **trend from the multi-year series**, replacing the current single-pair `observed vs historical` comparison and the basin-blind absolute thresholds (`<25` = Declining, `>=40` = Improving). Level is normalized against the region's baseline in `coral-cover-regional.json`; trend uses the fuller series in `coral-cover-series.json` / `agrra-reef-series.json` when present. Realizes UJ-1.

**Functional Requirements:**

#### FR-5: Normalize coral cover against the Regional Baseline
The Coral Pillar scores observed cover relative to the baseline for the reef's region, not against a global absolute.

**Consequences (testable):**
- The same absolute coral-cover percentage yields different Coral Pillar Scores in regions with different baselines (e.g. Caribbean vs East Asian Seas per `coral-cover-regional.json`).
- A location with no matching regional baseline falls back to a documented default and lowers Pillar Confidence rather than failing.

#### FR-6: Derive coral trend from the multi-year series when available
The Coral Pillar computes a trend (rising / stable / falling) from the multi-year coral series when present, and falls back to the observed-vs-historical pair otherwise.

**Consequences (testable):**
- Where `coral-cover-series` / `agrra-reef-series` data exists, trend reflects the series slope, not just the two most extreme points.
- The falling-trend read remains consistent with the on-page coral-cover chart (FR-4).

### 4.3 Thermal Pillar

**Description:** Scores heat stress from NOAA Coral Reef Watch, using recent alert **severity and recency/recurrence** rather than only the single worst alert level ever recorded. Consistent with CRW's own model, stress is an anomaly against a per-site baseline, and the alert ladder is anchored to bleaching/mortality outcomes. Realizes UJ-1.

**Functional Requirements:**

#### FR-7: Score thermal stress from CRW alert severity and recency
The Thermal Pillar scores based on CRW alert level weighted by how recent and how recurrent the stress is.

**Consequences (testable):**
- A reef with a severe alert years ago but calm recent seasons scores better than one under a current severe alert. [ASSUMPTION: reef-health records carry enough temporal resolution to distinguish recent from historical stress; confirm in `reef-health.json`.]
- Absence of any thermal reading yields no Thermal Pillar Score (not a zero/positive read).

### 4.4 Fish-Community Pillar

**Description:** The headline addition. Scores the fish community relative to the Regional Baseline, expressing measured biomass/abundance as a fraction of a regional unfished/no-take reference (the fisheries-standard B/B₀ approach) using `reef-check-fish-regional.json` indicator densities and MPA-contrast context, and drawing evidence from Reef Life Survey biomass (`fish-biomass-series.json`), REEF abundance (`reef-fish-abundance-series.json`), AGRRA fish biomass (`agrra-reef-series.json`), Reef Check indicator fish, and Blue Parks peer-reviewed biomass (`blue-parks.json`). This formalizes the exact reasoning the ~20 `manualReefState` overrides encode by hand. Realizes UJ-2.

**Functional Requirements:**

#### FR-8: Score fish community relative to the Regional Baseline
The Fish-Community Pillar normalizes measured biomass/abundance against the region's benchmark (biomass relative to fished-reef and unfished/inside-MPA reference points), not an absolute number.

**Consequences (testable):**
- A reserve with biomass several times the regional fished-reef baseline produces a strongly positive Fish-Community Pillar Score.
- Sites with fish data but no matching regional benchmark fall back to a documented default and reduced Pillar Confidence.

#### FR-9: Combine multiple fish sources by evidence quality
When more than one fish source covers a location, the pillar combines them with a documented precedence/quality order (e.g. peer-reviewed in-situ biomass > volunteer indicator counts), gating on observer-reliability where the source records it.

**Consequences (testable):**
- Source precedence is explicit and testable; adding a lower-quality source never overturns a higher-quality one for the same location.
- The sources that drove the score are captured for the Pillar Breakdown (FR-13) with their `sourceIds`.

#### FR-10: Reproduce the intent of existing manual overrides
For the locations currently carrying a fish-biomass-based `manualReefState`, the Fish-Community Pillar (with the other pillars) reproduces the intended verdict without the override in the majority of cases.

**Consequences (testable):**
- A regression check compares computed verdicts against the current ~20 override values; divergences are enumerated and each is either (a) accepted as a model improvement with rationale, or (b) retained as a genuine editorial override under FR-16.
- Target: the model reproduces the intent of a strong majority of overrides unaided. [ASSUMPTION: exact target set with Josie after the regression run — see Open Questions.]

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
The "How this is calculated" surface describes the multi-pillar model, the Regional Baseline normalization, and the confidence tiers, replacing the current three-input description.

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
- Recent verified sightings raise the Verdict Confidence tier and can move a location from Not-Surveyed to a low-confidence verdict only when at least one true condition pillar is also present. [ASSUMPTION: apex/indicator-species list and how presence maps to the fish proxy to be specified with Josie — see Open Questions.]
- Where used as an apex proxy, sightings are cross-referenced with IUCN status (`iucn-status.json`) and clearly labeled as a proxy in the breakdown.

### 4.8 Override Migration & Governance

**Description:** The redesign retires manual overrides that the Fish-Community Pillar now covers, and preserves a **documented, cited escape hatch** for the genuine exceptions. Realizes UJ-2.

**Functional Requirements:**

#### FR-16: Preserve a cited editorial override path
Editors can still set `manualReefState`, and it supersedes the computed verdict, but only with `manualReefStateBasis` and `manualReefStateSourceIds` present.

**Consequences (testable):**
- `atlas-location.ts` still applies `manualReefState ?? computed`.
- An override without a cited basis is rejected by the provenance validator (`validate-provenance.mjs`).
- The Pillar Breakdown flags an overridden verdict as editorially adjusted and shows the basis.

#### FR-17: Migrate covered overrides off manual maintenance
Overrides whose basis the Fish-Community Pillar now reproduces are removed, leaving only genuine exceptions.

**Consequences (testable):**
- Post-migration, the count of `manualReefState` entries is materially lower than the current ~20, and each remaining one has a documented reason it can't be computed.
- A regression report records, per removed override, that the computed verdict now matches the retired value.

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
- **SM-1: Override reduction.** Count of `manualReefState` entries drops materially from the current ~20, with each remaining override documented as a genuine exception. Validates FR-10, FR-17. *Target set with Josie after the regression run.*
- **SM-2: Verdict/chart consistency.** Zero locations where the reef-state label visibly contradicts its own coral-cover or fish-biomass chart. Validates FR-4, FR-13.
- **SM-3: Coverage lift.** Fewer locations return Not surveyed than under the current model, driven by the Fish-Community Pillar and Sighting confidence — *without* violating the evidence floor. Validates FR-3, FR-8, FR-15.

**Secondary**
- **SM-4: Explainability.** Every non-Not-Surveyed verdict renders a complete four-row Pillar Breakdown with sources. Validates FR-13.
- **SM-5: Confidence signal present.** Every verdict carries a Confidence Tier. Validates FR-12.

**Counter-metrics (do not optimize)**
- **SM-C1: Coverage must not become dishonest.** The drop in Not surveyed (SM-3) must not come from letting sightings or fishing alone manufacture positive labels. Counterbalances SM-3 — if Not-Surveyed falls but low-confidence positive labels spike on thin evidence, that is a regression, not a win.
- **SM-C2: Improving must stay rare and earned.** The share of reefs labeled Improving must not rise simply because the fish pillar is generous; Improving still requires holding/rising coral and protected/low fishing. Counterbalances SM-1/SM-3.

## 8. Open Questions
1. **Override reproduction target (FR-10):** what fraction of the ~20 overrides must the model reproduce unaided before we're comfortable migrating? Decide after the regression run.
2. **Pillar weights & score cutoffs:** exact importance weights per pillar and composite-score-to-label boundaries — first values proposed in the addendum (equal-weight default, cutoffs anchored to published ecological thresholds), to be calibrated against the override regression set.
3. **Apex/indicator proxy (FR-15):** which species constitute the apex/indicator list, and how does presence/probability map to a fish proxy value where no biomass survey exists?
4. **Thermal temporal resolution (FR-7):** does `reef-health.json` carry enough history per location to score recency/recurrence, or do we need a fetch change (which would breach the "no ETL change" non-goal)?
5. **Confidence tier taxonomy (FR-12):** how many tiers and their names/thresholds (proposed: Well-surveyed / Provisional / Sparse).
6. **Regional-baseline coverage:** which regions lack a baseline today, and what's the fallback behavior's effect on confidence? Verify exact fish-biomass reference cutoffs against the latest published report card before hard-coding (the automated source fetch was blocked).

## 9. Assumptions Index
- §4.1 (FR-1 NFR) — Reef-state stays build-time static over `src/data`, consistent with the read-only data model.
- §4.3 (FR-7) — `reef-health.json` has enough temporal resolution to distinguish recent from historical thermal stress.
- §4.4 (FR-10) — The exact override-reproduction target is set with Josie after the regression run.
- §4.7 (FR-15) — The apex/indicator-species list and its mapping to a fish proxy are specified with Josie before that path is enabled.
