import locationsData from "@/data/locations.json";
import type { Location } from "./types";

const locations = locationsData as Location[];
const bySlug = new Map(locations.map((l) => [l.slug, l]));
const byId = new Map(locations.map((l) => [l.id, l]));

export const getAllLocations = (): Location[] => locations;

export const getLocationBySlug = (slug: string): Location | null =>
  bySlug.get(slug) ?? null;

export const getLocationById = (id: string): Location | null =>
  byId.get(id) ?? null;
