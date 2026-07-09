import seriesData from "@/data/fish-abundance-series.json";
import type { FishAbundanceSeriesRecord } from "./types";

const records = seriesData as FishAbundanceSeriesRecord[];

const byLocationId = new Map<string, FishAbundanceSeriesRecord>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllFishAbundanceSeries = (): FishAbundanceSeriesRecord[] =>
  records;

/**
 * The in-situ indicator-fish abundance evidence for a location, if one is on
 * file. Display-only (chart + statement), never a reef-state input — see the
 * type docs.
 */
export const getFishAbundanceSeriesByLocationId = (
  locationId: string,
): FishAbundanceSeriesRecord | null => byLocationId.get(locationId) ?? null;
