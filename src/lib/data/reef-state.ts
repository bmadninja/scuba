import { getReefHealthByLocationId } from "./reef-health";
import { getLocationFishing } from "./fishing-pressure";
import { fishingAllowsImproving } from "./effective-fishing";
import {
  getAllFishBiomassSeries,
  getFishBiomassSeriesByLocationId,
} from "./fish-biomass-series";
import { getReefFishAbundanceSeriesByLocationId } from "./reef-fish-abundance-series";
import {
  getAgrraReefSeriesByLocationId,
  getAllAgrraReefSeries,
} from "./agrra-reef-series";
import {
  coralIsCritical,
  composeReefState,
  percentileScore,
  scoreCoralCover,
  scoreFishingBand,
  scoreThermal,
  thermalIsSevere,
  TIER_LABEL,
  type ConfidenceTier,
  type PillarScore,
} from "./reef-state-pillars";
import type { BleachingAlertLevel } from "./types";

export type ReefState = "thriving" | "pressure" | "change" | "unknown";

const ALERT_RANK: Record<BleachingAlertLevel, number> = {
  "no-stress": 0,
  watch: 1,
  warning: 2,
  "alert-1": 3,
  "alert-2": 4,
};

export const ALERT_TO_HEAT: Record<BleachingAlertLevel, number> = {
  "no-stress": 0,
  watch: 1,
  warning: 2,
  "alert-1": 3,
  "alert-2": 4,
};

// User-facing labels use the design vocab: Improving / Stable / Declining.
// (Internal state keys stay thriving/pressure/change as data identifiers.)
export const STATE_TEXT: Record<ReefState, string> = {
  thriving: "Improving",
  pressure: "Stable",
  change: "Declining",
  unknown: "Not surveyed",
};

/**
 * Canonical reef-state colors. Single source of truth so globe markers,
 * card dots and the legend always agree. Branded editorial palette.
 */
export const STATE_COLOR: Record<ReefState, string> = {
  thriving: "#2E7D5B",
  pressure: "#B98A2E",
  change: "#C0412B",
  unknown: "#7A8698",
};

export const STATE_DEF: Record<ReefState, { short: string; signal: string }> = {
  thriving: {
    short: "High, stable or rising coral cover, low heat stress, light fishing pressure. The reef is close to its natural baseline.",
    signal: "Coral cover at or above its long term baseline and steady; thermal stress rarely past watch level; fishing pressure low or protected.",
  },
  pressure: {
    short: "Still rewarding to dive, but coral cover is moderate or slipping under fishing, warming, or both. Intact, not pristine.",
    signal: "Coral cover below baseline and declining or flat; recurring warm seasons or rising fishing pressure — but the reef structure and fish life largely hold.",
  },
  change: {
    short: "Visibly transforming after repeated bleaching or heavy loss. Diving here documents what remains.",
    signal: "Coral cover well below baseline after one or more bleaching events; the reef is actively reorganising. Diver records here are the most valuable in the atlas.",
  },
  unknown: {
    short: "No coral survey or heat reading is on file for this reef yet, so we do not assign a state. A single logged dive can change that.",
    signal: "No reef condition data yet: no coral cover survey and no thermal stress reading for this location. We do not guess a state from the absence of data.",
  },
};

/**
 * Program reference distributions for the fish pillar, built once at module
 * load. Each fish source is normalized within its own metric against the
 * atlas-wide distribution of that metric (FR-8) — no shared B/B0, no
 * cross-unit averaging. Sorted ascending for {@link percentileScore}.
 */
const RLS_BIOMASS_SORTED: number[] = getAllFishBiomassSeries()
  .map((r) => r.latest?.biomassKgPerHa)
  .filter((v): v is number => typeof v === "number")
  .sort((a, b) => a - b);

const AGRRA_FISH_SORTED: number[] = getAllAgrraReefSeries()
  .map((r) => r.fish?.latest?.fishBiomassGper100m2)
  .filter((v): v is number => typeof v === "number")
  .sort((a, b) => a - b);

/** Survey-recency → pillar confidence, reusing the Fresh/Stale/Cold thresholds. */
function recencyConfidence(days: number | null): number {
  if (days === null) return 0.5;
  if (days <= 730) return 1;
  if (days <= 1460) return 0.7;
  return 0.4;
}

export type ReefStateDetail = {
  state: ReefState;
  tier: ConfidenceTier;
  tierLabel: string;
  pillars: PillarScore[];
};

/**
 * The full multi-pillar reef-state read for a location: the verdict, its
 * confidence tier, and the per-pillar breakdown. `getReefState` returns just
 * the label for the many callers that only need the badge; this returns the
 * evidence behind it for the "how calculated" surface and the reef card.
 */
export function getReefStateDetail(locationId: string): ReefStateDetail {
  const healthRecords = getReefHealthByLocationId(locationId);

  // --- Coral + thermal, from the reef-health records ---
  let worstAlert: BleachingAlertLevel | null = null;
  let worstDHW: number | null = null;
  let bestCover: number | null = null;
  let bestCoverBefore: number | null = null;
  let bestCoverDays: number | null = null;

  for (const r of healthRecords) {
    const alert = r.thermalStress?.alertLevel;
    if (alert && (!worstAlert || ALERT_RANK[alert] > ALERT_RANK[worstAlert])) {
      worstAlert = alert;
    }
    const dhw = r.thermalStress?.degreeHeatingWeeks;
    if (typeof dhw === "number" && (worstDHW === null || dhw > worstDHW)) {
      worstDHW = dhw;
    }
    const cover = r.observed?.coralCoverPercent;
    if (cover !== undefined && (bestCover === null || cover > bestCover)) {
      bestCover = cover;
      bestCoverBefore = r.observed?.historicalCoralCoverPercent ?? null;
      const d = r.observed?.surveyDate;
      bestCoverDays = d
        ? Math.floor((Date.now() - new Date(d + "T00:00:00Z").getTime()) / 86_400_000)
        : null;
    }
  }

  const coralFalling =
    bestCover !== null && bestCoverBefore !== null && bestCover < bestCoverBefore;
  const coralPresent = bestCover !== null;
  const coralCritical = bestCover !== null && coralIsCritical(bestCover);

  const coral: PillarScore = {
    key: "coral",
    score: bestCover !== null ? scoreCoralCover(bestCover) : null,
    confidence: recencyConfidence(bestCoverDays),
    hasData: bestCover !== null,
    note:
      bestCover !== null
        ? `${bestCover}% cover${coralFalling ? ", falling" : bestCoverBefore !== null ? ", holding" : ""}`
        : "No coral survey on file",
  };

  const thermalHasData = worstAlert !== null || worstDHW !== null;
  const thermalSevere = thermalIsSevere(worstDHW, worstAlert);
  const thermal: PillarScore = {
    key: "thermal",
    score: thermalHasData ? scoreThermal(worstDHW, worstAlert) : null,
    confidence: 0.8, // NOAA CRW is refreshed nightly — the reading is current.
    hasData: thermalHasData,
    note: thermalHasData
      ? worstDHW !== null
        ? `${worstDHW} DHW (${worstAlert ?? "no-stress"})`
        : `${worstAlert}`
      : "No thermal reading",
  };

  // --- Fish community, per-source by evidence quality (FR-9) ---
  const fish = scoreFishPillar(locationId);

  // --- Fishing pressure ---
  const fishing = getLocationFishing(locationId);
  const fishingScore = scoreFishingBand(fishing.effective);
  const fishingPillar: PillarScore = {
    key: "fishing",
    score: fishingScore,
    confidence: fishing.measured ? 0.8 : 0.4,
    hasData: fishingScore !== null,
    note:
      fishingScore !== null
        ? `${fishing.effective}${fishing.trend !== "unknown" ? `, ${fishing.trend}` : ""}`
        : "No fishing data",
  };

  const pillars: PillarScore[] = [coral, thermal, fish, fishingPillar];

  const { state, tier } = composeReefState({
    pillars,
    coralPresent,
    coralFalling,
    coralCritical,
    thermalSevere,
    fishingAllowsImproving: fishingAllowsImproving(fishing.effective),
  });

  return { state, tier, tierLabel: TIER_LABEL[tier], pillars };
}

/** Fish pillar: RLS biomass > AGRRA fish biomass > REEF abundance index. */
function scoreFishPillar(locationId: string): PillarScore {
  const rls = getFishBiomassSeriesByLocationId(locationId);
  if (rls?.latest?.biomassKgPerHa !== undefined) {
    const conf = Math.min(1, 0.5 + (rls.surveyYears ?? 1) * 0.15);
    return {
      key: "fish",
      score: percentileScore(rls.latest.biomassKgPerHa, RLS_BIOMASS_SORTED),
      confidence: conf,
      hasData: true,
      note: `${Math.round(rls.latest.biomassKgPerHa)} kg/ha (RLS)`,
    };
  }
  const agrra = getAgrraReefSeriesByLocationId(locationId);
  if (agrra?.fish?.latest?.fishBiomassGper100m2 !== undefined) {
    const conf = Math.min(1, 0.5 + (agrra.fishSurveyYears ?? 1) * 0.12);
    return {
      key: "fish",
      score: percentileScore(agrra.fish.latest.fishBiomassGper100m2, AGRRA_FISH_SORTED),
      confidence: conf,
      hasData: true,
      note: `${Math.round(agrra.fish.latest.fishBiomassGper100m2)} g/100m² (AGRRA)`,
    };
  }
  const reef = getReefFishAbundanceSeriesByLocationId(locationId);
  if (reef?.latest?.densityIndex !== undefined) {
    // REEF density index is 1–4; map linearly to 0..1.
    const conf = Math.min(0.8, 0.4 + (reef.surveyYears ?? 1) * 0.08);
    return {
      key: "fish",
      score: Math.max(0, Math.min(1, (reef.latest.densityIndex - 1) / 3)),
      confidence: conf,
      hasData: true,
      note: `abundance ${reef.latest.densityIndex.toFixed(1)}/4 (REEF)`,
    };
  }
  return {
    key: "fish",
    score: null,
    confidence: 0,
    hasData: false,
    note: "No fish survey on file",
  };
}

/** The reef-state label. Delegates to the multi-pillar engine. */
export function getReefState(locationId: string): ReefState {
  return getReefStateDetail(locationId).state;
}

export function getReefHeatLevel(locationId: string): number {
  const records = getReefHealthByLocationId(locationId);
  let worst = 0;
  for (const r of records) {
    const alert = r.thermalStress?.alertLevel;
    if (alert) worst = Math.max(worst, ALERT_TO_HEAT[alert]);
  }
  return worst;
}

export function getLastSurveyDays(locationId: string, nowDate = new Date()): number | null {
  const records = getReefHealthByLocationId(locationId);
  let latestMs: number | null = null;
  for (const r of records) {
    // Only actual in-water observations count — satellite/thermal asOf is not a survey.
    const d = r.observed?.surveyDate;
    if (d) {
      const ms = new Date(d + "T00:00:00Z").getTime();
      if (latestMs === null || ms > latestMs) latestMs = ms;
    }
  }
  if (latestMs === null) return null;
  return Math.floor((nowDate.getTime() - latestMs) / (1000 * 60 * 60 * 24));
}

export type FreshnessKey = "fresh" | "stale" | "cold";
export function freshness(days: number): { k: FreshnessKey; label: string; note: string } {
  // "Fresh" = surveyed within the last 2 years — reef surveys happen on annual-to-biennial cadence.
  if (days <= 730) return { k: "fresh", label: "Fresh", note: "surveyed within the last two years" };
  if (days <= 1460) return { k: "stale", label: "Stale", note: "survey data is getting outdated" };
  return { k: "cold", label: "Cold", note: "no recent eyes underwater" };
}

/** Project lat/lng to schematic 0-100 map coordinates */
export function geoToMapXY(lat: number, lng: number): [number, number] {
  const x = Math.max(3, Math.min(97, (lng + 180) / 360 * 100));
  const y = Math.max(4, Math.min(95, -0.53 * lat + 50));
  return [x, y];
}

/** Convert bestMonths array to a human-readable range string.
 *  Handles year-wrapping seasons (e.g. [10,11,12,1,2,3,4] → "Oct–Apr"). */
export function bestMonthsText(months: number[]): string {
  if (months.length === 0) return "—";
  if (months.length === 12) return "Year round";
  const ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sorted = [...months].sort((a, b) => a - b);

  // Find the largest gap between consecutive months (including year wrap-around).
  // The season spans from right after the largest gap to the month before it.
  let maxGap = 0;
  let maxGapIdx = sorted.length - 1; // default: no internal gap, use wrap-around
  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const next = i === sorted.length - 1 ? sorted[0] + 12 : sorted[i + 1];
    const gap = next - curr;
    if (gap > maxGap) {
      maxGap = gap;
      maxGapIdx = i;
    }
  }

  const startIdx = (maxGapIdx + 1) % sorted.length;
  const endIdx = maxGapIdx;
  return `${ABBR[sorted[startIdx] - 1]}–${ABBR[sorted[endIdx] - 1]}`;
}

/** Skill level canonical text */
const SKILL_MAP: Record<string, string> = {
  "never-dived": "Beginner",
  "open-water": "Open water",
  advanced: "Advanced",
  rescue: "Advanced",
  divemaster: "Advanced",
  tech: "Technical",
};

export function skillText(skillLevel: string): string {
  return SKILL_MAP[skillLevel] ?? skillLevel;
}
