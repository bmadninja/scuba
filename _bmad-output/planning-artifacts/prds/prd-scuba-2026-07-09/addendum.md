# Addendum — Reef-State Model Redesign

Technical depth that belongs downstream (architecture / implementation), not in the PRD narrative. Nothing here is a requirement; it is the proposed *how* and the evidence behind it, for the implementing agent and the architecture step.

---

## A. Proposed scoring mechanics (starting values — calibrate against the override regression set)

**Common scale.** Rescale every Pillar Score to `0..1` (0 = regionally degraded, 1 = at/above regional reference), with a separate `pillarConfidence ∈ 0..1`. Invert pressure/bad pillars (thermal, fishing) so 1 always means "good."

**Composite.** `condition = Σ(wᵢ · cᵢ · sᵢ) / Σ(wᵢ · cᵢ)` over pillars with data, where `wᵢ` = pillar importance, `cᵢ` = pillar confidence, `sᵢ` = pillar score. Equal importance weights are the defensible default (OHI/RHI precedent — see §C); document any deviation as a policy choice, not a hidden constant.

**Label mapping (proposed, to calibrate):**
- `Not surveyed` — total evidence weight `Σ(wᵢ·cᵢ)` below floor, OR no coral/thermal/fish pillar present (FR-3).
- `Declining` — low composite, OR hard triggers preserved from today: severe recent thermal alert (rank ≥ 3) OR coral far below regional baseline.
- `Improving` — high composite AND coral holding/rising (FR-4 gate) AND `fishingAllowsImproving` true.
- `Stable` — everything else.

The hard triggers stay as guardrails so a strong fish pillar can never paper over a bleached/collapsing reef.

**Confidence tier (proposed):** `Well-surveyed` (≥3 pillars, fresh), `Provisional` (1–2 pillars or aging), `Sparse` (single stale pillar or sighting-lifted). Freshness reuses the existing `freshness()` thresholds (fresh ≤2y, stale ≤4y, cold beyond).

## B. Per-pillar normalization + source-field map

| Pillar | Primary inputs (fields) | Baseline / reference | Notes |
|---|---|---|---|
| **Coral** | `reef-health.json` `observed.coralCoverPercent`, `historicalCoralCoverPercent`, `surveyDate`; trend from `coral-cover-series.json`, `agrra-reef-series.json` | `coral-cover-regional.json` per-region series (e.g. Caribbean baseline ~15%, East Asian Seas ~33%) | Replaces absolute `<25`/`>=40`. Trend = series slope, fallback to observed-vs-historical pair. |
| **Thermal** | `reef-health.json` `thermalStress.alertLevel` (+ any DHW/asOf history) | CRW anomaly-vs-site-MMM model is already baked into alertLevel | Weight by recency/recurrence, not worst-ever. Confirm temporal depth exists (Open Q4). |
| **Fish** | `fish-biomass-series.json` (RLS), `reef-fish-abundance-series.json` (REEF), `agrra-reef-series.json` (AGRRA fish), `reef-check-fish-regional.json` indicators, `blue-parks.json` | Regional fished-reef + unfished/no-take reference → express as **B/B₀ ratio** | Precedence: peer-reviewed in-situ biomass > volunteer indicator counts. Gate on observer reliability where recorded. |
| **Fishing** | `fishing-pressure.json` GFW hours + `series`; MPAtlas `mpaStatus` | `effective-fishing.ts` `reconcile()` bands; `fishingTrend()` for trajectory | Reuse as-is; add trajectory. `paper-park` never positive. |

**Sighting Signal** (support only): `sightings.json` `lastConfirmedAt`, `recentRecordCount`, `verified`, `confidence`; per-site `monthlyProbability[12]` in `sites.json`; apex/indicator cross-ref via `iucn-status.json`.

**B/B₀ anchor values (from research, verify before hard-coding):** unfished reference B₀ ≈ 1,000–1,200 kg/ha (fishery) up to ~1,900 kg/ha (ecological, large mobile species included); healthy target ≈ ≥0.5 B₀, collapse < 0.25 B₀ (McClanahan et al. 2011/2018). Use as category-cutoff anchors for the fish pillar rather than arbitrary quantiles.

## C. Comparable-index research grounding

Established frameworks reviewed to keep the model defensible:

1. **Ocean Health Index** — most transferable template. Total = weighted mean of goal scores, each = *status + likely future state* (future = status modified by trend[0.67], pressures, resilience), all rescaled 0–100 vs a per-goal reference point. Equal weights globally but explicitly tunable. → Our `status + trend + pressure` decomposition and rescale-before-combine come from here.
2. **Healthy Reefs Initiative Reef Health Index (Mesoamerican Reef)** — closest analog: unweighted mean of four 1–5 sub-scores (live coral cover, fleshy macroalgae [inverted], herbivorous fish biomass, commercial fish biomass), threshold-binned. Labels Critical/Poor/Fair/Good/Very good. → Validates equal-weight 4-pillar mean and inverting "bad" indicators. *Caveat: exact fish-biomass g/100 m² cutoffs must be verified from the latest report card PDF (source returned 403 to automated fetch).*
3. **NOAA Coral Reef Watch** — DHW as anomaly vs per-site Maximum Monthly Mean; ordinal ladder (Watch→Warning→Alert 1[≥4 DHW]→Alert 2[≥8], 2023 expansion adds Alert 3–5) anchored to mortality outcomes. → Our thermal pillar; supports anomaly-vs-baseline and outcome-anchored bins.
4. **AGRRA** — standardized *collection protocol* feeding the RHI scoring layer. → Architectural cue: keep the raw data (protocol) layer separate from the scoring layer so methodology can evolve without re-collecting.
5. **Reef Check / EcoDiver** — compact functional indicator set; certified-diver data-quality gating before scoring. → Our source-precedence + observer-reliability gate (FR-9).
6. **Fish biomass B/B₀** — express standing biomass as fraction of unfished baseline from old no-take/remote reefs; anchor cutoffs on ecological thresholds. → §B fish normalization.

**Citable sources:** agrra.org; coralreefwatch.noaa.gov (5km methodology); reefcheck.org (EcoDiver protocol); Halpern et al. 2012 + oceanhealthindex.org/methodology; healthyreefs.org (RHI / MAR report cards); McClanahan et al. 2011 *PNAS* (critical thresholds/tangible targets), McClanahan et al. 2018 *Fish & Fisheries* (biomass baselines).

## D. Implementation surface (for the architecture step)

- Core: replace `getReefState(locationId): ReefState` in `src/lib/data/reef-state.ts` with a pillar pipeline returning `{ state, confidenceTier, pillars: PillarBreakdown[] }`. Keep a pure, data-layer-free scoring module (mirror `effective-fishing.ts`) for unit tests.
- Preserve `STATE_TEXT` / `STATE_COLOR` / `STATE_DEF` enums (FR-2); extend `STATE_DEF` copy.
- Override application stays at `atlas-location.ts:214` (`manualReefState ?? computed`).
- Breakdown consumed by `how-calculated.tsx`, `reef-state-card.tsx`, `reef-state-badge.tsx`.
- Add a regression harness (extend `scripts/verify-fishing-model.ts` pattern) that computes verdicts for the ~20 override sites and diffs against current `manualReefState` values → produces the FR-10/FR-17 report.
- Provenance: every pillar row carries `sourceIds` / `methodologyClaimIds`; `validate-provenance.mjs` enforces cited overrides (FR-16).
