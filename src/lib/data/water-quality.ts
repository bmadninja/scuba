import waterQualityData from "@/data/water-quality.json";
import type { WaterQualityRecord } from "./types";

const records = waterQualityData as WaterQualityRecord[];
const byLocationId = new Map<string, WaterQualityRecord>();
for (const r of records) byLocationId.set(r.locationId, r);

export const getAllWaterQuality = (): WaterQualityRecord[] => records;

export const getWaterQualityByLocationId = (
  locationId: string,
): WaterQualityRecord | null => byLocationId.get(locationId) ?? null;
