import locationSeriesData from "@/data/cremp-reef-series.json";
import siteSeriesData from "@/data/cremp-site-series.json";
import type { CrempReefSeriesRecord, CrempSiteSeriesRecord } from "./types";

const locationRecords = locationSeriesData as CrempReefSeriesRecord[];
const siteRecords = siteSeriesData as CrempSiteSeriesRecord[];

const byLocationId = new Map<string, CrempReefSeriesRecord>();
for (const r of locationRecords) {
  byLocationId.set(r.locationId, r);
}

const bySiteId = new Map<string, CrempSiteSeriesRecord>();
for (const r of siteRecords) {
  bySiteId.set(r.siteId, r);
}

export const getAllCrempReefSeries = (): CrempReefSeriesRecord[] => locationRecords;

export const getAllCrempSiteSeries = (): CrempSiteSeriesRecord[] => siteRecords;

/**
 * The CREMP stony-coral history for a location, if its region is monitored.
 * Display-only (chart), never a reef-state input — see the type docs.
 */
export const getCrempReefSeriesByLocationId = (
  locationId: string,
): CrempReefSeriesRecord | null => byLocationId.get(locationId) ?? null;

/**
 * The CREMP stony-coral history for a dive site, where a CREMP monitoring site
 * is that exact reef. Display-only (chart), never a reef-state input.
 */
export const getCrempSiteSeriesBySiteId = (
  siteId: string,
): CrempSiteSeriesRecord | null => bySiteId.get(siteId) ?? null;
