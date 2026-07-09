# Addendum — Reef-State Model Redesign

Technical depth that belongs downstream (architecture / implementation), not in the PRD narrative. Nothing here is a requirement; it is the proposed *how* and the evidence behind it, for the implementing agent and the architecture step.

---

## A. Proposed scoring mechanics (starting values — calibrate against the override regression set)

**Common scale.** Rescale every Pillar Score to `0..1` per its own reference (coral: outcome-anchored cover bins; fish: per-source reference/contrast; thermal: DHW severity; fishing: effective band), with a separate `pillarConfidence ∈ 0..1`. Invert pressure/bad pillars (thermal, fishing) so 1 always means "good." **No raw cross-unit averaging** — each source is normalized before it enters the mean.

**Composite.** `condition = Σ(wᵢ · cᵢ · sᵢ) / Σ(wᵢ · cᵢ)` over pillars with data, where `wᵢ` = pillar importance, `cᵢ` = pillar confidence, `sᵢ` = pillar score. Equal importance weights are the defensible default (OHI/RHI precedent — see §C); document any deviation as a policy choice, not a hidden constant. **Guard against thin-evidence distortion:** when only 1–2 pillars have data the composite is capped to non-extreme labels and the confidence tier drops (a single generous pillar must not alone drive Improving/Declining).

**Label mapping (proposed, to calibrate):**
- `Not surveyed` — total evidence weight `Σ(wᵢ·cᵢ)` below floor, OR no coral/thermal/fish condition pillar present (FR-3). Sightings/apex-proxy alone never clear this floor.
- `Declining` — low composite, OR hard triggers preserved from today: severe recent thermal (DHW high / alert rank ≥ 3) OR coral in the critical outcome-anchored bin.
- `Improving` — high composite AND **coral pillar present and holding/rising** (FR-4 gate — coral-absent cannot qualify) AND `fishingAllowsImproving` true (FR-11).
- `Stable` — everything else.

The hard triggers and the coral-present Improving gate stay as guardrails so a strong fish pillar can never paper over a bleached, collapsing, or unsurveyed-for-coral reef.

**Confidence tier (confirmed, 3 tiers):** `Well-surveyed` (≥3 pillars, fresh), `Provisional` (1–2 pillars or aging), `Sparse` (single stale pillar or sighting-lifted). Freshness reuses the existing `freshness()` thresholds (fresh ≤2y, stale ≤4y, cold beyond).

**Data findings (2026-07-09 investigation):**
- **Thermal:** `reef-health.json` is a *current snapshot* per location (nightly overwrite), 0 locations with >1 thermal `asOf` → no recurrence history. But continuous `degreeHeatingWeeks` present on 120/121 records → score on continuous DHW in v1; recurrence needs a v2 ETL change that accumulates snapshots.
- **Overrides:** only **4** true `manualReefState` values exist (not ~20): `channel-islands-usa` (pressure) + `torre-guaceto-italy` / `abrolhos-banks` / `chumbe-island-tanzania` (thriving, fish-biomass-driven). A further **10** records carry `manualReefStateBasis` context without overriding.
- **CRITICAL correction (superseding the earlier diff summary):** the 3 `thriving` overrides have **0** entries in any structured fish-series file (`fish-biomass-series`, `reef-fish-abundance-series`, `agrra-reef-series`). Their only structured datum is a Blue Parks award *level* (not biomass). Their biomass evidence exists solely as prose `manualReefStateBasis` citations. Furthermore `abrolhos-banks` (301 GFW h → *moderate*) and `chumbe-island-tanzania` (352 h → *moderate*) are blocked from Improving by `fishingAllowsImproving`, and `torre-guaceto-italy` has **no** reef-health/fishing/fish record at all. → **None of the 3 can be computed; all remain cited overrides.** `channel-islands-usa` is the only override site with real fish-series data (RLS+REEF), and it is *retained* at `pressure`.
- **Fish-pillar coverage:** structured per-site fish series exist for **77 / 355** locations (RLS 57, REEF 7, AGRRA 18; union). This is the pillar's real reach. Units are heterogeneous (RLS kg/ha + abundance/500 m²; REEF zone frequency; AGRRA biomass) → normalize per-source, never average raw.
- **Blue Parks:** `blue-parks.json` = award `{level, year, parkName}` — a **protection** signal for the Fishing Pillar, not biomass for the Fish Pillar.
- **Baseline coverage:** coral = 10 regions; fish regional *context* = **2 basins only** (indo-pacific, atlantic). Coral "healthy" is outcome-anchored, not regional-mean-relative (avoids shifting-baseline).

## B. Per-pillar normalization + source-field map

| Pillar | Primary inputs (fields) | Baseline / reference | Notes |
|---|---|---|---|
| **Coral** | `reef-health.json` `observed.coralCoverPercent`, `historicalCoralCoverPercent`, `surveyDate`; trend from `coral-cover-series.json`, `agrra-reef-series.json` | **Outcome-anchored cover bins** (RHI/AGRRA style, e.g. ≥40 very-good … <5 critical); `coral-cover-regional.json` used for trend/context only | Replaces absolute `<25`/`>=40`. Regional mean is NOT the "healthy" bar (shifting-baseline guard). Trend = series slope, fallback to observed-vs-historical pair. |
| **Thermal** | `reef-health.json` `thermalStress.degreeHeatingWeeks` (continuous), fallback `alertLevel` | CRW anomaly-vs-site-MMM already baked in | v1: continuous current DHW (no history exists). Recurrence deferred to v2 ETL change. |
| **Fish** | `fish-biomass-series.json` (RLS), `reef-fish-abundance-series.json` (REEF), `agrra-reef-series.json` (AGRRA fish) — **77 sites only** | **Per-source**, within own metric → `0..1`, against the source's own program/regional distribution or MPA-contrast. `reef-check-fish-regional.json` = coarse context, not the normalizer. | Precedence: in-situ biomass (RLS/AGRRA) > abundance (REEF) > indicator context. No shared B/B₀ formula — units heterogeneous. Blue Parks is NOT an input here. |
| **Fishing** | `fishing-pressure.json` GFW hours + `series` (under `.records`); MPAtlas `mpaStatus`; Blue Parks award `level` | `effective-fishing.ts` `reconcile()` bands; `fishingTrend()` for trajectory | Reuse as-is; add trajectory. `paper-park` never positive. Blue Parks/MPAtlas = protection modifier here. |

**Sighting Signal** (support only): `sightings.json` `lastConfirmedAt`, `recentRecordCount`, `verified`, `confidence`; per-site `monthlyProbability[12]` in `sites.json`; apex/indicator cross-ref via `iucn-status.json`.

**On B/B₀ (why it is *not* used as an absolute anchor):** the literature offers unfished references (B₀ ≈ 1,000–1,200 kg/ha fishery, ~1,900 kg/ha ecological; healthy ≥0.5 B₀, collapse <0.25 B₀ — McClanahan et al. 2011/2018). These were considered as fish-pillar cutoffs but are **not adopted for v1**: they are global absolutes (conflicting with per-region intent), the data lacks per-site unfished baselines to compute B/B₀, and the named regional file holds volunteer indicator *densities* (per 100 m², 1997–2001), not basin unfished biomass. v1 uses per-source relative normalization instead; a proper B/B₀ ingestion is a possible v2 (Open Q-B).

## C. Comparable-index research grounding

Established frameworks reviewed to keep the model defensible:

1. **Ocean Health Index** — most transferable template. Total = weighted mean of goal scores, each = *status + likely future state* (future = status modified by trend[0.67], pressures, resilience), all rescaled 0–100 vs a per-goal reference point. Equal weights globally but explicitly tunable. → Our `status + trend + pressure` decomposition and rescale-before-combine come from here.
2. **Healthy Reefs Initiative Reef Health Index (Mesoamerican Reef)** — closest analog: unweighted mean of four 1–5 sub-scores (live coral cover, fleshy macroalgae [inverted], herbivorous fish biomass, commercial fish biomass), threshold-binned. Labels Critical/Poor/Fair/Good/Very good. → Validates equal-weight 4-pillar mean and inverting "bad" indicators. *Caveat: exact fish-biomass g/100 m² cutoffs must be verified from the latest report card PDF (source returned 403 to automated fetch).*
3. **NOAA Coral Reef Watch** — DHW as anomaly vs per-site Maximum Monthly Mean; ordinal ladder (Watch→Warning→Alert 1[≥4 DHW]→Alert 2[≥8], 2023 expansion adds Alert 3–5) anchored to mortality outcomes. → Our thermal pillar; supports anomaly-vs-baseline and outcome-anchored bins.
4. **AGRRA** — standardized *collection protocol* feeding the RHI scoring layer. → Architectural cue: keep the raw data (protocol) layer separate from the scoring layer so methodology can evolve without re-collecting.
5. **Reef Check / EcoDiver** — compact functional indicator set; certified-diver data-quality gating before scoring. → Our source-precedence + observer-reliability gate (FR-9).
6. **Fish biomass B/B₀** — express standing biomass as fraction of unfished baseline from old no-take/remote reefs; anchor cutoffs on ecological thresholds. → *Considered but not adopted for v1* (data lacks per-site unfished baselines; see §B "On B/B₀"). Informs the possible v2 ingestion.

**Citable sources:** agrra.org; coralreefwatch.noaa.gov (5km methodology); reefcheck.org (EcoDiver protocol); Halpern et al. 2012 + oceanhealthindex.org/methodology; healthyreefs.org (RHI / MAR report cards); McClanahan et al. 2011 *PNAS* (critical thresholds/tangible targets), McClanahan et al. 2018 *Fish & Fisheries* (biomass baselines).

## D. Implementation surface (for the architecture step)

- Core: replace `getReefState(locationId): ReefState` in `src/lib/data/reef-state.ts` with a pillar pipeline returning `{ state, confidenceTier, pillars: PillarBreakdown[] }`. Keep a pure, data-layer-free scoring module (mirror `effective-fishing.ts`) for unit tests.
- Preserve `STATE_TEXT` / `STATE_COLOR` / `STATE_DEF` enums (FR-2); extend `STATE_DEF` copy.
- Override application stays at `atlas-location.ts:214` (`manualReefState ?? computed`).
- Breakdown consumed by `how-calculated.tsx`, `reef-state-card.tsx`, `reef-state-badge.tsx`.
- Add a regression harness (extend `scripts/verify-fishing-model.ts` pattern) that computes verdicts for the 4 override sites + 10 basis-annotated records and diffs against current `manualReefState` / documented-basis values → produces the FR-10/FR-17 report. **Run this diff before setting any migration target.**
- Provenance: every pillar row carries `sourceIds` / `methodologyClaimIds`; `validate-provenance.mjs` enforces cited overrides (FR-16).
