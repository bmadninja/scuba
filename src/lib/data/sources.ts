import sourcesData from "@/data/sources.json";
import type { DataSource } from "./types";

const sources = sourcesData as DataSource[];
const byId = new Map(sources.map((s) => [s.id, s]));

export const getAllSources = (): DataSource[] => sources;

export const getSourceById = (id: string): DataSource | null =>
  byId.get(id) ?? null;

export const getSourcesByIds = (ids: string[]): DataSource[] =>
  ids.map((id) => byId.get(id)).filter((s): s is DataSource => Boolean(s));
