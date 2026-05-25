import sightingsData from "@/data/sightings.json";
import type { SightingEvidence } from "./types";

const sightings = sightingsData as SightingEvidence[];

const bySiteId = new Map<string, SightingEvidence[]>();
for (const s of sightings) {
  const list = bySiteId.get(s.siteId) ?? [];
  list.push(s);
  bySiteId.set(s.siteId, list);
}

export const getAllSightings = (): SightingEvidence[] => sightings;

export const getSightingsBySiteId = (siteId: string): SightingEvidence[] =>
  bySiteId.get(siteId) ?? [];

/**
 * Highest-signal sighting for the card badge: most recently confirmed
 * record at the site (prefers high confidence over older medium/low).
 */
export const getHeadlineSightingForSite = (
  siteId: string,
): SightingEvidence | null => {
  const list = bySiteId.get(siteId);
  if (!list || list.length === 0) return null;
  const sorted = [...list].sort((a, b) => {
    const conf =
      confidenceScore(b.confidence) - confidenceScore(a.confidence);
    if (conf !== 0) return conf;
    return (b.lastConfirmedAt ?? "").localeCompare(a.lastConfirmedAt ?? "");
  });
  return sorted[0] ?? null;
};

const confidenceScore = (c: SightingEvidence["confidence"]): number =>
  c === "high" ? 2 : c === "medium" ? 1 : 0;

export const formatLastConfirmed = (iso: string | null): string => {
  if (!iso) return "No confirmed record on file";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};
