import sitesData from "@/data/sites.json";
import type { Site } from "./types";

const sites = sitesData as Site[];
const bySlug = new Map(sites.map((s) => [s.slug, s]));
const byId = new Map(sites.map((s) => [s.id, s]));

export const getAllSites = (): Site[] => sites;

export const getSiteBySlug = (slug: string): Site | null =>
  bySlug.get(slug) ?? null;

export const getSiteById = (id: string): Site | null => byId.get(id) ?? null;

export const getSitesByLocationId = (locationId: string): Site[] =>
  sites.filter((s) => s.locationId === locationId);
