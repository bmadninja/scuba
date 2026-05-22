import detailsData from "@/data/location-details.json";
import type { LocationDetails } from "./types";

const details = detailsData as LocationDetails[];
const byId = new Map(details.map((d) => [d.id, d]));

export const getLocationDetailsById = (id: string): LocationDetails | null =>
  byId.get(id) ?? null;
