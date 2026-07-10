/**
 * INTEGRATION-NOTES — how reef gravity SHOULD feed the reef-health score.
 * ---------------------------------------------------------------------------
 * This module is a self-contained READER for src/data/reef-gravity.json
 * (built by scripts/fetch-reef-gravity.mjs from Andrello et al. 2022). It is
 * deliberately NOT wired into the reef-state scoring yet — that scoring is
 * being changed in a parallel session. When it is time to wire it in, the
 * intended design is:
 *
 *  1. Universal fishing-pressure level.
 *     Every reef site gets a fishing-pressure band from `reefGravityBand()`.
 *     Unlike Global Fishing Watch (AIS-only, blind to artisanal reefs) this
 *     covers all ~54,596 reef pixels, so it is the ONE fishing signal that is
 *     present for essentially every reef location. Use it as the baseline
 *     fishing-pressure level in the reef-health score.
 *
 *  2. Reconciliation order (do NOT double-count).
 *     Today src/lib/data/effective-fishing.ts reconciles a GFW effort band
 *     with MPAtlas protection. Reef gravity should slot in as the fallback /
 *     universal layer BENEATH measured GFW effort:
 *         measured GFW effort  (industrial, where AIS sees it)
 *           ↳ else reef-gravity band  (universal, catches artisanal pressure)
 *             ↳ else editorial estimate  (last resort)
 *     i.e. prefer GFW where it has a real reading; otherwise use the gravity
 *     band; keep the editorial guess only where neither exists. Protection
 *     (MPAtlas no-take / strict-mpa) still down-weights the resulting level
 *     via the existing reconcile() step — gravity is the PRESSURE, protection
 *     is what mitigates it.
 *
 *  3. Scoring contribution.
 *     Map the band to the same low/moderate/high/very-high vocabulary the
 *     reef-state model already consumes for FishingPressureLevel, so no new
 *     enum is needed. A rising gravity band should push a reef toward
 *     "Declining"; low gravity + real protection supports "Improving".
 *
 *  Nothing here mutates shared modules (types.ts, reef-state.ts,
 *  effective-fishing.ts). Wiring is a one-line import of
 *  `getReefGravityForLocation` / `reefGravityBand` in the scoring layer.
 * ---------------------------------------------------------------------------
 */

import reefGravityData from "@/data/reef-gravity.json";

export type ReefGravityPressureBand = "low" | "moderate" | "high" | "very-high";

export type ReefGravityRecord = {
  locationId: string;
  /** Raw market gravity (Andrello grav_NC_raw): population / travel-time²,
   *  summed within reach of the reef cell. Right-skewed, ranges 0..~300,000. */
  gravity: number;
  /** Global 0..1 percentile of that raw gravity across all reef cells
   *  (Andrello grav_NC). This is the value to band on — see reefGravityBand. */
  fishingPressureValue: number;
  /** Haversine distance from the site to the reef cell that was sampled. */
  nearestPixelKm: number;
  pixelLat: number;
  pixelLng: number;
  source: string;
  fetchedAt: string;
};

type ReefGravityData = {
  lastBuiltAt: string;
  source: string;
  maxPixelKm: number;
  records: ReefGravityRecord[];
};

const data = reefGravityData as unknown as ReefGravityData;
const byLocationId = new Map<string, ReefGravityRecord>();
for (const r of data.records ?? []) byLocationId.set(r.locationId, r);

export const getReefGravityForLocation = (
  locationId: string,
): ReefGravityRecord | null => byLocationId.get(locationId) ?? null;

export const getReefGravityLastBuiltAt = (): string => data.lastBuiltAt;

export const getReefGravityMaxPixelKm = (): number => data.maxPixelKm;

/**
 * Band a reef cell's fishing pressure into low / moderate / high / very-high.
 *
 * BANDING THRESHOLDS — band on the PERCENTILE (fishingPressureValue), not the
 * raw gravity, using equal quartile cuts:
 *
 *     percentile < 0.25            → "low"
 *     0.25 ≤ percentile < 0.50     → "moderate"
 *     0.50 ≤ percentile < 0.75     → "high"
 *     percentile ≥ 0.75            → "very-high"
 *
 * WHY PERCENTILE, NOT RAW GRAVITY: raw market gravity is extremely
 * right-skewed (0 to ~300,000, a handful of reefs near dense coastal cities
 * dominate the top end). Equal-width bands on the raw value would put almost
 * every reef in "low". Andrello already publishes a global percentile rank of
 * gravity across all ~54,596 reef cells (the grav_NC column), which is exactly
 * the right-skew-corrected transform. Cutting that percentile into quartiles
 * gives global quartiles of reef fishing pressure: a "very-high" reef is in
 * the worst 25% of reefs worldwide for fishing pressure, "low" is in the best
 * 25%. This mirrors how Andrello et al. present the layer and keeps the bands
 * comparable across every site regardless of region.
 */
export const reefGravityBand = (
  fishingPressureValue: number,
): ReefGravityPressureBand => {
  if (fishingPressureValue >= 0.75) return "very-high";
  if (fishingPressureValue >= 0.5) return "high";
  if (fishingPressureValue >= 0.25) return "moderate";
  return "low";
};

/** Convenience: band straight from a location id, or null if we have no cell. */
export const getReefGravityBandForLocation = (
  locationId: string,
): ReefGravityPressureBand | null => {
  const rec = byLocationId.get(locationId);
  return rec ? reefGravityBand(rec.fishingPressureValue) : null;
};
