import { getReefHealthByLocationId } from "./reef-health";
import { getFishBiomassSeriesByLocationId } from "./fish-biomass-series";
import { getLocationFishing } from "./fishing-pressure";
import { computeReefState } from "./reef-state";

/**
 * Per-pillar confidence tier and the per-site confidence badge (R2).
 *
 * The tier is the honest part: it says whether we are showing a real direction
 * over time, a simple before-and-after, a single reading, or nothing yet.
 *
 *   A  Measured trend      — 3+ surveys across ≥4 years (a real direction)
 *   B  Before and after    — 2 surveys (rose or fell, not a trend line)
 *   C  Single reading      — 1 survey (a level today, not a direction)
 *   D  Not on file yet     — no data for this pillar here
 *
 * The SITE BADGE is the weakest tier among the pillars that actually SET the
 * label — i.e. the present STATE pillars (coral, biomass), plus an active
 * bleaching alert when it is what forced the verdict. Fishing is a pressure
 * gate, not a label-setting state pillar, so it never weakens the badge (it is
 * still reported per-pillar for the method panel).
 */
export type ConfidenceTier = "A" | "B" | "C" | "D";

export const TIER_LABEL: Record<ConfidenceTier, string> = {
  A: "Measured trend",
  B: "Before and after",
  C: "Single reading",
  D: "Not on file yet",
};

const TIER_RANK: Record<ConfidenceTier, number> = { A: 4, B: 3, C: 2, D: 1 };

function weakest(tiers: ConfidenceTier[]): ConfidenceTier {
  if (tiers.length === 0) return "D";
  return tiers.reduce((w, t) => (TIER_RANK[t] < TIER_RANK[w] ? t : w));
}

/** Coral-cover data confidence from the in-situ reef-health records. */
function coralTier(locationId: string): ConfidenceTier {
  const records = getReefHealthByLocationId(locationId);
  let hasCover = false;
  let hasBefore = false;
  for (const r of records) {
    const o = r.observed;
    if (!o) continue;
    const series = o.coralCoverSeries;
    if (series && series.length >= 3) {
      const years = series.map((p) => p.year);
      if (Math.max(...years) - Math.min(...years) >= 4) return "A";
    }
    if (o.coralCoverPercent !== undefined) {
      hasCover = true;
      if (o.historicalCoralCoverPercent !== undefined) hasBefore = true;
    }
  }
  if (!hasCover) return "D";
  return hasBefore ? "B" : "C";
}

/** Fish-biomass data confidence from the RLS multi-year series. */
function biomassTier(locationId: string): ConfidenceTier {
  const s = getFishBiomassSeriesByLocationId(locationId);
  if (!s) return "D";
  const points = s.series?.length ?? 0;
  if (points >= 3 && s.surveyYears >= 4) return "A";
  if (points >= 2) return "B";
  if (points >= 1) return "C";
  return "D";
}

/** Fishing pressure confidence (a pressure — reported, never in the badge). */
function fishingTier(locationId: string): ConfidenceTier {
  const f = getLocationFishing(locationId);
  if (f.pressureSource === "gfw") {
    if (f.showEffortTrend) return "B"; // measured boats, multi-year
    return "C"; // single measured reading
  }
  if (f.pressureSource === "gravity") return "C"; // a fixed level from the model
  if (f.pressureSource === "editorial") return "D";
  return "D";
}

export type ReefConfidence = {
  /** null where the pillar plays no part in this reef (e.g. no coral survey). */
  coral: ConfidenceTier | null;
  biomass: ConfidenceTier | null;
  /** Heat is a live satellite reading: A when on file, D when absent. */
  heat: ConfidenceTier;
  /** Fishing is a pressure; reported but excluded from the badge. */
  fishing: ConfidenceTier;
  /** Weakest tier among the pillars that SET the label. */
  badge: ConfidenceTier;
};

export function getReefConfidence(locationId: string): ReefConfidence {
  const pillars = computeReefState(locationId);

  const coral = pillars.coralCover !== null ? coralTier(locationId) : null;
  const biomass = pillars.biomass !== null ? biomassTier(locationId) : null;
  const heat: ConfidenceTier = pillars.worstAlert !== null ? "A" : "D";
  const fishing = fishingTier(locationId);

  // Which pillars actually set the label?
  const labelSetting: ConfidenceTier[] = [];
  if (coral !== null) labelSetting.push(coral);
  if (biomass !== null) labelSetting.push(biomass);
  // An active bleaching alert forces Declining — a live, high-confidence read.
  if (pillars.alertRank >= 3) labelSetting.push(heat);

  const badge: ConfidenceTier = pillars.state === "unknown" ? "D" : weakest(labelSetting);

  return { coral, biomass, heat, fishing, badge };
}
