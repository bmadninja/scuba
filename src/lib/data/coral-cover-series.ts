import seriesData from "@/data/coral-cover-series.json";
import type { CoralCoverSeriesRecord } from "./types";

const records = seriesData as CoralCoverSeriesRecord[];

const byLocationId = new Map<string, CoralCoverSeriesRecord>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllCoralCoverSeries = (): CoralCoverSeriesRecord[] => records;

/**
 * The multi-year coral-cover survey history for a location, if one is on file.
 * Display-only (chart), never a reef-state input — see the type docs.
 */
export const getCoralCoverSeriesByLocationId = (
  locationId: string,
): CoralCoverSeriesRecord | null => byLocationId.get(locationId) ?? null;
