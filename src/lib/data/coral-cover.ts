import coralCoverData from "@/data/coral-cover.json";
import type { CoralCoverData, CoralCoverSnapshot } from "./types";

const data = coralCoverData as unknown as CoralCoverData;

const byLocationId = new Map<string, CoralCoverSnapshot>();
for (const j of data.jurisdictions) {
  for (const locId of j.appliesTo) byLocationId.set(locId, j);
}

export const getCoralCoverForLocation = (
  locationId: string,
): CoralCoverSnapshot | null => byLocationId.get(locationId) ?? null;

export const getAllCoralCoverJurisdictions = (): CoralCoverSnapshot[] =>
  data.jurisdictions;

export const getCoralCoverBuildDate = (): string => data.lastBuiltAt;
