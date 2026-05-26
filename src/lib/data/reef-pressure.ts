import reefPressureData from "@/data/reef-pressure.json";
import type { ReefPressureRecord } from "./types";

const records = reefPressureData as ReefPressureRecord[];
const byLocationId = new Map<string, ReefPressureRecord>();
for (const r of records) byLocationId.set(r.locationId, r);

export const getAllReefPressure = (): ReefPressureRecord[] => records;

export const getReefPressureByLocationId = (
  locationId: string,
): ReefPressureRecord | null => byLocationId.get(locationId) ?? null;
