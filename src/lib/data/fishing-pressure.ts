import fishingData from "@/data/fishing-pressure.json";
import type {
  EffectiveFishing,
  FishingEffortLevel,
  FishingPressureRecord,
  FishingTrend,
} from "./types";
import {
  editorialEffortLevel,
  fishingTrend,
  gfwEffortLevel,
  reconcile,
} from "./effective-fishing";
import { getReefPressureByLocationId } from "./reef-pressure";

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
  /** True when the effort came from GFW; false when it fell back to editorial. */
  measured: boolean;
};

/**
 * The combined fishing read for a location: measured GFW effort reconciled
 * against MPAtlas protection. Falls back to the editorial fishingPressure
 * estimate only for the handful of locations with no GFW record.
 */
export const getLocationFishing = (locationId: string): LocationFishing => {
  const gfw = byLocationId.get(locationId) ?? null;
  const pressure = getReefPressureByLocationId(locationId);
  const hours = gfw?.current?.fishingHours ?? null;
  const effort = gfw
    ? gfwEffortLevel(hours)
    : editorialEffortLevel(pressure?.fishingPressure);
  const effective = reconcile(effort, pressure?.mpaStatus ?? null);
  return {
    effective,
    effort,
    hours,
    year: gfw?.current?.year ?? null,
    trend: fishingTrend(hours, gfw?.historical?.fishingHours),
    radiusKm: data.radiusKm,
    measured: Boolean(gfw),
  };
};
