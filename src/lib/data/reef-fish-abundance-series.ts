import seriesData from "@/data/reef-fish-abundance-series.json";
import type { ReefFishAbundanceSeriesRecord } from "./types";

const records = seriesData as ReefFishAbundanceSeriesRecord[];

const byLocationId = new Map<string, ReefFishAbundanceSeriesRecord>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllReefFishAbundanceSeries = (): ReefFishAbundanceSeriesRecord[] =>
  records;

/**
 * The multi-year REEF fish-abundance history for a location, if one is on file.
 * Display-only (chart), never a reef-state input — see the type docs. Only
 * populated for locations in strong-REEF regions (Caribbean/US/ETP).
 */
export const getReefFishAbundanceSeriesByLocationId = (
  locationId: string,
): ReefFishAbundanceSeriesRecord | null => byLocationId.get(locationId) ?? null;
