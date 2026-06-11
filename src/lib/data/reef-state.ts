import { getReefHealthByLocationId } from "./reef-health";
import { getReefPressureByLocationId } from "./reef-pressure";
import type { BleachingAlertLevel } from "./types";

export type ReefState = "thriving" | "pressure" | "change";

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

export const STATE_TEXT: Record<ReefState, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

/**
 * Canonical reef-state colors. Single source of truth so globe markers,
 * card dots and the legend always agree.
 */
export const STATE_COLOR: Record<ReefState, string> = {
  thriving: "#10b981",
  pressure: "#f59e0b",
  change: "#f43f5e",
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
};

export function getReefState(locationId: string): ReefState {
  const healthRecords = getReefHealthByLocationId(locationId);
  const pressureRecord = getReefPressureByLocationId(locationId);

  let worstAlert: BleachingAlertLevel | null = null;
  let bestCover: number | null = null;

  for (const r of healthRecords) {
    const alert = r.thermalStress?.alertLevel;
    if (alert && (!worstAlert || ALERT_RANK[alert] > ALERT_RANK[worstAlert])) {
      worstAlert = alert;
    }
    const cover = r.observed?.coralCoverPercent;
    if (cover !== undefined && (bestCover === null || cover > bestCover)) {
      bestCover = cover;
    }
  }

  const alertRank = worstAlert ? ALERT_RANK[worstAlert] : 0;
  const fishing = pressureRecord?.fishingPressure ?? "unknown";

  // Witnessing change: severely degraded coral OR serious bleaching alert
  if ((bestCover !== null && bestCover < 25) || alertRank >= 3) {
    return "change";
  }
  // Thriving: good cover, low stress, low fishing
  if (
    (bestCover === null || bestCover >= 40) &&
    alertRank <= 1 &&
    (fishing === "low" || fishing === "unknown")
  ) {
    return "thriving";
  }
  // Everything else: under pressure
  return "pressure";
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

/** Convert bestMonths array to a human-readable range string */
export function bestMonthsText(months: number[]): string {
  if (months.length === 0) return "—";
  if (months.length === 12) return "Year round";
  const ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const sorted = [...months].sort((a, b) => a - b);
  // Detect a contiguous range
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (last - first === sorted.length - 1) {
    return `${ABBR[first - 1]}–${ABBR[last - 1]}`;
  }
  // Non-contiguous: just list first and last
  return `${ABBR[first - 1]}–${ABBR[last - 1]}`;
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
