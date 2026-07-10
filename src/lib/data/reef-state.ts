import { getReefHealthByLocationId } from "./reef-health";
import { getLocationFishing } from "./fishing-pressure";
import { fishingAllowsImproving } from "./effective-fishing";
import { biomassStanding, type BiomassStanding } from "./biomass-standing";
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

/** Coral-cover STATE sub-score (1–5). Bins from the brief. */
export function coralSubScore(coverPercent: number): 1 | 2 | 3 | 4 | 5 {
  if (coverPercent >= 40) return 5;
  if (coverPercent >= 30) return 4;
  if (coverPercent >= 20) return 3;
  if (coverPercent >= 10) return 2;
  return 1;
}

/**
 * The pillars behind a location's reef-state label, computed once so the label,
 * the confidence badge, and the gap map all read the SAME numbers. This is the
 * single source of truth for the two-layer model.
 *
 * Two-layer, state-only model (brief 2026-07-10, decisions locked):
 *   STATE pillars (build the label): coral cover + fish biomass, combined
 *   lower-of-two. PRESSURE pillars (gate only): thermal stress + fishing.
 *
 * The label maps the lower-of-two condition onto the four states while
 * PRESERVING every asymmetry the coral-only engine had:
 *  - a pressure alone never causes Declining, EXCEPT an active bleaching alert
 *    (rank ≥ 3) which is measured damage in progress;
 *  - heat can force Declining; fishing only gates Improving;
 *  - coral's own Declining/Improving thresholds are UNCHANGED (<25% / ≥40%), so
 *    a site with no biomass reads byte-identically to the previous engine.
 *
 * The biomass pillar (see biomass-standing.ts) only exists where a site has an
 * RLS series AND a reef-gravity cell to anchor B0; elsewhere it is null and the
 * coral-only path runs exactly as before.
 */
export type ReefStatePillars = {
  state: ReefState;
  /** Best observed coral cover %, or null. */
  coralCover: number | null;
  /** Prior cover paired with the reading that set coralCover (trend basis). */
  coralCoverBefore: number | null;
  coralSubScore: 1 | 2 | 3 | 4 | 5 | null;
  coralFalling: boolean;
  /** Fish-biomass state pillar, or null when not scorable in v1. */
  biomass: BiomassStanding | null;
  /** Lower-of-two of the present state sub-scores (the condition level). */
  conditionLevel: 1 | 2 | 3 | 4 | 5 | null;
  /** Worst NOAA thermal alert rank (0–4). A pressure. */
  alertRank: number;
  worstAlert: BleachingAlertLevel | null;
};

export function computeReefState(locationId: string): ReefStatePillars {
  const healthRecords = getReefHealthByLocationId(locationId);

  let worstAlert: BleachingAlertLevel | null = null;
  let bestCover: number | null = null;
  let bestCoverBefore: number | null = null;

  for (const r of healthRecords) {
    const alert = r.thermalStress?.alertLevel;
    if (alert && (!worstAlert || ALERT_RANK[alert] > ALERT_RANK[worstAlert])) {
      worstAlert = alert;
    }
    const cover = r.observed?.coralCoverPercent;
    if (cover !== undefined && (bestCover === null || cover > bestCover)) {
      bestCover = cover;
      bestCoverBefore = r.observed?.historicalCoralCoverPercent ?? null;
    }
  }

  // Fish biomass STATE pillar (co-equal with coral). Null unless the site has
  // both an RLS series and a gravity cell to anchor B0 — see biomass-standing.ts.
  const biomass = biomassStanding(locationId);
  const coralSub = bestCover === null ? null : coralSubScore(bestCover);

  const alertRank = worstAlert ? ALERT_RANK[worstAlert] : 0;
  const coralFalling =
    bestCover !== null && bestCoverBefore !== null && bestCover < bestCoverBefore;

  // Condition level = the LOWER of the two present state sub-scores. A reef is
  // only as healthy as its weakest state pillar.
  const subs = [coralSub, biomass?.subScore ?? null].filter(
    (s): s is 1 | 2 | 3 | 4 | 5 => s !== null,
  );
  const conditionLevel = subs.length ? (Math.min(...subs) as 1 | 2 | 3 | 4 | 5) : null;

  const pillars: Omit<ReefStatePillars, "state"> = {
    coralCover: bestCover,
    coralCoverBefore: bestCoverBefore,
    coralSubScore: coralSub,
    coralFalling,
    biomass,
    conditionLevel,
    alertRank,
    worstAlert,
  };

  // Reef state needs a condition signal: a coral survey, a thermal reading, OR
  // now a fish-biomass reading. With none, "Not surveyed" — the absence of bad
  // news is not evidence of a healthy reef.
  if (worstAlert === null && bestCover === null && biomass === null) {
    return { state: "unknown", ...pillars };
  }

  const { effective } = getLocationFishing(locationId);

  // ── Declining (measured damage) ──────────────────────────────────────────
  // EITHER state pillar low is measured loss: coral <25% (UNCHANGED threshold,
  // so coral-only sites are unaffected) OR fish biomass sub-score ≤2 (standing
  // below ~0.375 of B0). Plus an active bleaching alert (rank ≥3). A pressure
  // never triggers this on its own — only measured reef condition or a live
  // bleaching alert.
  const coralDeclining = bestCover !== null && bestCover < 25;
  const biomassDeclining = biomass !== null && biomass.subScore <= 2;
  if (coralDeclining || biomassDeclining || alertRank >= 3) {
    return { state: "change", ...pillars };
  }

  // ── Improving (both state pillars strong, no active pressure holding it) ──
  // Every PRESENT state pillar must be strong: coral ≥40% (sub 5, UNCHANGED)
  // and biomass sub ≥4 (standing ≥0.5 of B0). Heat no worse than watch, fishing
  // permits improving, and coral is not measurably falling. (Biomass trend is
  // display-only in v1 — see biomass-standing.ts — so it does not gate here.)
  const coralAllowsImproving = bestCover === null || bestCover >= 40;
  const biomassAllowsImproving = biomass === null || biomass.subScore >= 4;
  if (
    coralAllowsImproving &&
    biomassAllowsImproving &&
    alertRank <= 1 &&
    fishingAllowsImproving(effective) &&
    !coralFalling
  ) {
    return { state: "thriving", ...pillars };
  }

  // ── Stable (everything else) ─────────────────────────────────────────────
  return { state: "pressure", ...pillars };
}

export function getReefState(locationId: string): ReefState {
  return computeReefState(locationId).state;
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
