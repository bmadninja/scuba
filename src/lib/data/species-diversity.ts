import speciesDiversityData from "@/data/species-diversity.json";
import type { SpeciesDiversity } from "./types";

const records = speciesDiversityData as SpeciesDiversity[];

const byLocationId = new Map<string, SpeciesDiversity>();
for (const r of records) {
  byLocationId.set(r.locationId, r);
}

export const getAllSpeciesDiversity = (): SpeciesDiversity[] => records;

export const getSpeciesDiversityByLocationId = (
  locationId: string,
): SpeciesDiversity | undefined => byLocationId.get(locationId);
