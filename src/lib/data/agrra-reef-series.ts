import seriesData from "@/data/agrra-reef-series.json";
import type { AgrraReefSeriesRecord } from "./types";

const records = seriesData as AgrraReefSeriesRecord[];

const byLocationId = new Map<string, AgrraReefSeriesRecord>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllAgrraReefSeries = (): AgrraReefSeriesRecord[] => records;

/**
 * The multi-year AGRRA coral-cover + fish-biomass trend for a location, if one is
 * on file. Display-only (charts), never a reef-state input — see the type docs.
 */
export const getAgrraReefSeriesByLocationId = (
  locationId: string,
): AgrraReefSeriesRecord | null => byLocationId.get(locationId) ?? null;
