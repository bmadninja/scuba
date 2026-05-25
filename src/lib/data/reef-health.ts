import reefHealthData from "@/data/reef-health.json";
import type { ReefHealthRecord } from "./types";

const records = reefHealthData as ReefHealthRecord[];

const byLocationId = new Map<string, ReefHealthRecord[]>();
const bySiteId = new Map<string, ReefHealthRecord[]>();
for (const r of records) {
  if (r.locationId) {
    const list = byLocationId.get(r.locationId) ?? [];
    list.push(r);
    byLocationId.set(r.locationId, list);
  }
  if (r.siteId) {
    const list = bySiteId.get(r.siteId) ?? [];
    list.push(r);
    bySiteId.set(r.siteId, list);
  }
}

export const getAllReefHealth = (): ReefHealthRecord[] => records;

export const getReefHealthByLocationId = (
  locationId: string,
): ReefHealthRecord[] => byLocationId.get(locationId) ?? [];

export const getReefHealthBySiteId = (
  siteId: string,
): ReefHealthRecord[] => bySiteId.get(siteId) ?? [];
