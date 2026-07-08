import blueParksData from "@/data/blue-parks.json";
import type { BlueParkAward } from "./types";

const records = blueParksData as BlueParkAward[];

const byLocationId = new Map<string, BlueParkAward>();
for (const award of records) {
  byLocationId.set(award.locationId, award);
}

/**
 * Blue Park Award for a location, or null. A location earns a badge when it
 * IS a Blue Park or sits inside one (parkName carries the official MPA name).
 */
export function getBlueParkByLocationId(locationId: string): BlueParkAward | null {
  return byLocationId.get(locationId) ?? null;
}

export function getAllBlueParks(): BlueParkAward[] {
  return records;
}
