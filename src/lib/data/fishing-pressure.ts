import fishingData from "@/data/fishing-pressure.json";
import type {
  EffectiveFishing,
  FishingEffortLevel,
  FishingEffortPoint,
  FishingPressureRecord,
  FishingTrend,
} from "./types";
import {
  editorialEffortLevel,
  effortTrendWorthShowing,
  fishingEffortSeries,
  fishingTrend,
  gfwEffortLevel,
  reconcile,
} from "./effective-fishing";
import { getReefPressureByLocationId } from "./reef-pressure";
import { getReefGravityBandForLocation } from "./reef-gravity";

type FishingPressureData = {
  lastBuiltAt: string;
  radiusKm: number;
  records: FishingPressureRecord[];
};

const data = fishingData as unknown as FishingPressureData;
const byLocationId = new Map<string, FishingPressureRecord>();
for (const r of data.records) byLocationId.set(r.locationId, r);

export const getFishingPressureForLocation = (
  locationId: string,
): FishingPressureRecord | null => byLocationId.get(locationId) ?? null;

export const getFishingPressureRadiusKm = (): number => data.radiusKm;

export const getFishingPressureLastBuiltAt = (): string => data.lastBuiltAt;

export type LocationFishing = {
  /** GFW effort reconciled with MPAtlas protection. */
  effective: EffectiveFishing;
  /** Raw measured band (before protection reconciliation). */
  effort: FishingEffortLevel;
  /** Measured apparent-fishing-hours/year, or null when no GFW record. */
  hours: number | null;
  year: number | null;
  trend: FishingTrend;
  radiusKm: number;
  /** True when the effort came from GFW; false when it fell back to a model/editorial. */
  measured: boolean;
  /**
   * Where the raw effort band came from, in descending authority:
   *  - "gfw"       measured Global Fishing Watch effort (industrial vessels)
   *  - "gravity"   Andrello/Cinner reef-gravity band (universal, catches the
   *                artisanal pressure GFW is blind to) — the R3 fallback
   *  - "editorial" hand-set fishingPressure estimate (last resort)
   *  - "none"      no signal at all → effort is "unknown"
   */
  pressureSource: "gfw" | "gravity" | "editorial" | "none";
  /**
   * Multi-year measured effort, oldest first, for the display-only trend
   * sparkline. Empty when there is no GFW record. See {@link fishingEffortSeries}.
   */
  effortSeries: FishingEffortPoint[];
  /**
   * Whether the effort series is worth charting: two or more years with a
   * genuinely measurable peak. Near-zero series are suppressed. See
   * {@link effortTrendWorthShowing}.
   */
  showEffortTrend: boolean;
};

/**
 * The combined fishing read for a location: measured GFW effort reconciled
 * against MPAtlas protection.
 *
 * R3 — universal fishing pressure. The raw effort band is resolved in
 * descending authority so EVERY site has a level, including the artisanal reefs
 * GFW's AIS cannot see (Paolo 2024: satellite tracking misses most small boats):
 *
 *     measured GFW effort            (industrial, where AIS sees it)
 *       ↳ else reef-gravity band     (universal Andrello/Cinner model)
 *         ↳ else editorial estimate  (last resort)
 *
 * Reef gravity is single-sourced from getReefGravityBandForLocation — the same
 * value the biomass B0 estimate reads (pillars coordination contract). MPAtlas
 * protection then reconciles on top exactly as before: gravity is the pressure,
 * protection is what can mitigate it. Sites WITH a real GFW reading keep it; we
 * do not let a model band override a measurement.
 */
export const getLocationFishing = (locationId: string): LocationFishing => {
  const gfw = byLocationId.get(locationId) ?? null;
  const pressure = getReefPressureByLocationId(locationId);
  const hours = gfw?.current?.fishingHours ?? null;

  const gravityBand = getReefGravityBandForLocation(locationId);
  let effort: FishingEffortLevel;
  let pressureSource: LocationFishing["pressureSource"];
  if (gfw) {
    effort = gfwEffortLevel(hours);
    pressureSource = "gfw";
  } else if (gravityBand) {
    effort = gravityBand;
    pressureSource = "gravity";
  } else {
    effort = editorialEffortLevel(pressure?.fishingPressure);
    pressureSource = effort === "unknown" ? "none" : "editorial";
  }

  const effective = reconcile(effort, pressure?.mpaStatus ?? null);
  const effortSeries = fishingEffortSeries(gfw);
  return {
    effective,
    effort,
    hours,
    year: gfw?.current?.year ?? null,
    trend: fishingTrend(hours, gfw?.historical?.fishingHours),
    radiusKm: data.radiusKm,
    measured: Boolean(gfw),
    pressureSource,
    effortSeries,
    showEffortTrend: effortTrendWorthShowing(effortSeries),
  };
};
