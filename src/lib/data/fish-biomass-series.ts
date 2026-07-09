import seriesData from "@/data/fish-biomass-series.json";
import type { FishBiomassSeriesRecord } from "./types";

const records = seriesData as FishBiomassSeriesRecord[];

const byLocationId = new Map<string, FishBiomassSeriesRecord>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllFishBiomassSeries = (): FishBiomassSeriesRecord[] => records;

/**
 * The multi-year reef-fish-biomass history for a location, if one is on file.
 * Display-only (chart), never a reef-state input — see the type docs.
 */
export const getFishBiomassSeriesByLocationId = (
  locationId: string,
): FishBiomassSeriesRecord | null => byLocationId.get(locationId) ?? null;
