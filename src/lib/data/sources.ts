import sourcesData from "@/data/sources.json";
import type { DataSource } from "./types";

const sources = sourcesData as DataSource[];
const byId = new Map(sources.map((s) => [s.id, s]));

export const getAllSources = (): DataSource[] => sources;

export const getSourceById = (id: string): DataSource | null =>
  byId.get(id) ?? null;

export const getSourcesByIds = (ids: string[]): DataSource[] =>
  ids.map((id) => byId.get(id)).filter((s): s is DataSource => Boolean(s));

// The single internal editorial provenance tag ("scubaSeason editorial"). It is
// a legitimate provenance label for editorially-derived claims, but it is our
// own writing, not an external dataset — so it is excluded from the external
// source count we publish.
const INTERNAL_SOURCE_IDS = new Set(["editorial-curation"]);

/** Every source except our own editorial tag — the honest "science sources" count. */
export const getExternalSources = (): DataSource[] =>
  sources.filter((s) => !INTERNAL_SOURCE_IDS.has(s.id));

export const getExternalSourceCount = (): number => getExternalSources().length;

/** Sources we actually pull from a live/scheduled API (not just credit). */
export const getLiveSources = (): DataSource[] =>
  sources.filter((s) => s.ingestion === "live");

export const getLiveSourceCount = (): number => getLiveSources().length;
