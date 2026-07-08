import timelineData from "@/data/species-observation-timeline.json";
import type { SpeciesObservationTimeline } from "./types";

const records = timelineData as SpeciesObservationTimeline[];

const byLocationId = new Map<string, SpeciesObservationTimeline>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllSpeciesObservationTimelines = (): SpeciesObservationTimeline[] => records;

/**
 * The yearly research-grade observation timeline for a location, if on file.
 * Display-only (accumulation chart), never a reef-state input.
 */
export const getSpeciesObservationTimelineByLocationId = (
  locationId: string,
): SpeciesObservationTimeline | null => byLocationId.get(locationId) ?? null;

/**
 * Cumulative running total of observations by year, for the accumulation line.
 */
export function getCumulativeObservations(
  timeline: SpeciesObservationTimeline,
): { year: number; cumulative: number }[] {
  let running = 0;
  return timeline.yearlyObservations.map((p) => {
    running += p.count;
    return { year: p.year, cumulative: running };
  });
}
