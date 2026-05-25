import tripCostData from "@/data/trip-costs.json";
import type { TripCostEstimate } from "./types";

const records = tripCostData as TripCostEstimate[];
const byLocationId = new Map<string, TripCostEstimate>();
for (const r of records) byLocationId.set(r.locationId, r);

export const getAllTripCosts = (): TripCostEstimate[] => records;

export const getTripCostByLocationId = (
  locationId: string,
): TripCostEstimate | null => byLocationId.get(locationId) ?? null;
