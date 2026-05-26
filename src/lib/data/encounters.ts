import encountersData from "@/data/encounters.json";
import type { Encounter } from "./types";

const encounters = encountersData as Encounter[];
const bySlug = new Map(encounters.map((e) => [e.slug, e]));
const byId = new Map(encounters.map((e) => [e.id, e]));

export const getAllEncounters = (): Encounter[] => encounters;

export const getEncounterBySlug = (slug: string): Encounter | null =>
  bySlug.get(slug) ?? null;

export const getEncounterById = (id: string): Encounter | null =>
  byId.get(id) ?? null;

export const getEncountersByLocationId = (locationId: string): Encounter[] =>
  encounters.filter((e) =>
    e.regions.some(
      (r) =>
        r.inAtlasLocationId === locationId ||
        (r.nearbyAtlasLocationIds?.includes(locationId) ?? false),
    ),
  );

export const getEncountersBySpecies = (query: string): Encounter[] => {
  const q = query.toLowerCase();
  return encounters.filter(
    (e) =>
      e.speciesCommon?.toLowerCase().includes(q) ||
      e.speciesScientific?.toLowerCase().includes(q),
  );
};

export const getBucketListEncounters = (): Encounter[] =>
  [...encounters]
    .filter((e) => typeof e.bucketListRank === "number")
    .sort((a, b) => (a.bucketListRank ?? 99) - (b.bucketListRank ?? 99));
