import fishingData from "@/data/fishing-pressure.json";
import type { FishingPressureRecord } from "./types";

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
