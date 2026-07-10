import { getFishBiomassSeriesByLocationId } from "./fish-biomass-series";
import {
  getReefGravityForLocation,
  reefGravityBand,
  type ReefGravityPressureBand,
} from "./reef-gravity";

/**
 * Fish-biomass STATE pillar — standing stock as a fraction of the unfished
 * benchmark (B0), turned into a 1–5 sub-score for the reef-state model.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * MODELLING ASSUMPTION A1 — "B0 from reef gravity" (v1, documented, deferred).
 * ───────────────────────────────────────────────────────────────────────────
 * Standing/B0 needs an unfished benchmark B0 (kg/ha) — the fish biomass a reef
 * of this type would hold if it were barely fished. We do NOT have a measured
 * per-site B0 in v1 (that is R7/v2, gravity-derived + WCS-validated). Until
 * then we ESTIMATE B0 from the site's reef-gravity band, the same covariate the
 * literature uses to predict reef-fish biomass (MacNeil 2015; Cinner 2016/2018;
 * Andrello 2022):
 *
 *     gravity band   estimated B0 (kg/ha)
 *     low            1200   (remote, high-potential reef)
 *     moderate       1000   (global unfished benchmark, MacNeil 2015 ~1000)
 *     high            850
 *     very-high       700   (chronically pressured human-footprint reef)
 *
 * The band-conditioned B0 is intentionally GENTLE (700–1200) so it rarely
 * crosses a sub-score bin boundary; the dominant input is the observed biomass.
 * The two-layer model handles fishing pressure separately (the fishing gate),
 * so a heavily-fished reef that still holds fish reads high on this STATE pillar
 * yet is still capped below Improving by the pressure gate — by design.
 *
 * SCOPE GUARD: we only score biomass where a reef-gravity cell exists. Andrello
 * gravity is defined on coral-reef pixels, so its presence doubles as a proxy
 * that the MacNeil/Cinner tropical B0 benchmark is ecologically valid here. On
 * temperate / cold-water rocky reefs (no gravity cell) a tropical B0 would be
 * meaningless, so we return null and leave biomass as context, not a score.
 *
 * ALSO NOTE: v1 uses the biomass LEVEL only. The biomass TREND stays
 * display-only (its RLS series is proximity-matched, too noisy to gate the
 * label); a site-matched biomass trend is deferred to v2.
 */

/** Estimated unfished reef-fish-biomass benchmark (B0, kg/ha) by gravity band. */
const B0_BY_GRAVITY_BAND: Record<ReefGravityPressureBand, number> = {
  low: 1200,
  moderate: 1000,
  high: 850,
  "very-high": 700,
};

export function estimateB0FromGravityBand(band: ReefGravityPressureBand): number {
  return B0_BY_GRAVITY_BAND[band];
}

export type BiomassSubScore = 1 | 2 | 3 | 4 | 5;

/**
 * Standing/B0 → 1–5 sub-score. Bins from the brief:
 *   ≥0.75 = 5 · 0.50–0.74 = 4 · 0.25–0.49 = 3–2 · <0.25 = 1.
 * The 0.25–0.49 band spans two scores; we split it at its midpoint (0.375):
 * the upper half (0.375–0.49) = 3, the lower half (0.25–0.374) = 2.
 */
export function biomassSubScore(standing: number): BiomassSubScore {
  if (standing >= 0.75) return 5;
  if (standing >= 0.5) return 4;
  if (standing >= 0.375) return 3;
  if (standing >= 0.25) return 2;
  return 1;
}

export type BiomassStanding = {
  locationId: string;
  /** Latest observed standing fish biomass, kg/ha (RLS M1). */
  observedKgPerHa: number;
  /** Estimated unfished benchmark (B0), kg/ha — see assumption A1. */
  expectedB0KgPerHa: number;
  gravityBand: ReefGravityPressureBand;
  /** observed / B0, clamped to [0,1]. */
  standing: number;
  /** 1–5 state sub-score. */
  subScore: BiomassSubScore;
  latestYear: number;
  surveyYears: number;
  surveyEventCount: number;
};

/**
 * The fish-biomass state pillar for a location, or null when it cannot be
 * scored (no RLS series, or no reef-gravity cell to anchor B0 — see A1).
 * Single-sources reef gravity via getReefGravityForLocation, per the pillars
 * coordination contract.
 */
export function biomassStanding(locationId: string): BiomassStanding | null {
  const series = getFishBiomassSeriesByLocationId(locationId);
  if (!series) return null;
  const gravity = getReefGravityForLocation(locationId);
  if (!gravity) return null;

  const gravityBand = reefGravityBand(gravity.fishingPressureValue);
  const expectedB0KgPerHa = estimateB0FromGravityBand(gravityBand);
  const observedKgPerHa = series.latest.biomassKgPerHa;
  const standing = Math.max(0, Math.min(1, observedKgPerHa / expectedB0KgPerHa));

  return {
    locationId,
    observedKgPerHa,
    expectedB0KgPerHa,
    gravityBand,
    standing,
    subScore: biomassSubScore(standing),
    latestYear: series.latest.year,
    surveyYears: series.surveyYears,
    surveyEventCount: series.surveyEventCount,
  };
}
