import { getAllLocations } from "./locations";
import { getBlueParkByLocationId } from "./blue-parks";
import { computeReefState } from "./reef-state";
import {
  getReefConfidence,
  type ConfidenceTier,
} from "./reef-confidence";
import { getLocationFishing } from "./fishing-pressure";

/**
 * Coverage / gap map (R6) — an internal GTM asset, not a public UI.
 *
 * One row per location, carrying each pillar's confidence tier and the site
 * badge, so we can generate ready-to-send outreach lists like "Blue Parks with
 * no fish-biomass trend" or "reefs missing a coral survey that GCRMN could
 * fill." The confidence-tier data doubles as the partnership engine.
 *
 * This reader computes live from the same modules that build the label, so it
 * can never drift from what the site shows. scripts/build-reef-gap-map.mjs
 * snapshots it to src/data/reef-gap-map.json for offline outreach work.
 */
export type PillarKey = "coral" | "biomass" | "heat" | "fishing";

export type ReefGapRow = {
  locationId: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  state: string;
  /** Weakest tier among the pillars that set the label. */
  badge: ConfidenceTier;
  isBluePark: boolean;
  /** null when the pillar plays no part in this reef. */
  tiers: Record<PillarKey, ConfidenceTier | null>;
  /** Where the fishing-pressure level came from (gfw | gravity | editorial | none). */
  fishingSource: string;
  /** Convenience flags for the common outreach queries. */
  hasBiomassTrend: boolean; // biomass tier A or B
  hasCoralTrend: boolean; // coral tier A or B
  biomassMissing: boolean; // no fish-biomass pillar at all
};

const isTrend = (t: ConfidenceTier | null): boolean => t === "A" || t === "B";

export function buildReefGapMap(): ReefGapRow[] {
  return getAllLocations().map((loc) => {
    const pillars = computeReefState(loc.id);
    const conf = getReefConfidence(loc.id);
    const fishing = getLocationFishing(loc.id);
    const tiers: Record<PillarKey, ConfidenceTier | null> = {
      coral: conf.coral,
      biomass: conf.biomass,
      heat: pillars.worstAlert !== null ? conf.heat : null,
      fishing: conf.fishing,
    };
    return {
      locationId: loc.id,
      slug: loc.slug,
      name: loc.name,
      country: loc.country,
      region: loc.region,
      state: pillars.state,
      badge: conf.badge,
      isBluePark: getBlueParkByLocationId(loc.id) !== null,
      tiers,
      fishingSource: fishing.pressureSource,
      hasBiomassTrend: isTrend(conf.biomass),
      hasCoralTrend: isTrend(conf.coral),
      biomassMissing: conf.biomass === null,
    };
  });
}

// ── Query helpers (the outreach engine) ─────────────────────────────────────

/** Blue Parks that have no fish-biomass trend on file (A/B). Prime RLS ask. */
export function blueParksMissingBiomassTrend(rows = buildReefGapMap()): ReefGapRow[] {
  return rows.filter((r) => r.isBluePark && !r.hasBiomassTrend);
}

/** Locations with a label but no coral survey — GCRMN/AIMS/MERMAID ask. */
export function reefsMissingCoralSurvey(rows = buildReefGapMap()): ReefGapRow[] {
  return rows.filter((r) => r.state !== "unknown" && r.tiers.coral === null);
}

/** Every location missing a given pillar entirely (tier null/D). */
export function reefsMissingPillar(
  pillar: PillarKey,
  rows = buildReefGapMap(),
): ReefGapRow[] {
  return rows.filter((r) => {
    const t = r.tiers[pillar];
    return t === null || t === "D";
  });
}

/** Coverage summary: counts by pillar × tier, plus badge distribution. */
export function gapMapSummary(rows = buildReefGapMap()) {
  const pillarKeys: PillarKey[] = ["coral", "biomass", "heat", "fishing"];
  const byPillar = Object.fromEntries(
    pillarKeys.map((p) => [
      p,
      { A: 0, B: 0, C: 0, D: 0, none: 0 } as Record<string, number>,
    ]),
  ) as Record<PillarKey, Record<string, number>>;
  const byBadge: Record<ConfidenceTier, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const r of rows) {
    byBadge[r.badge]++;
    for (const p of pillarKeys) {
      const t = r.tiers[p];
      byPillar[p][t ?? "none"]++;
    }
  }
  return { total: rows.length, byBadge, byPillar };
}
