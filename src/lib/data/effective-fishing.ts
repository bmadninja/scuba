import type {
  EffectiveFishing,
  FishingEffortLevel,
  FishingEffortPoint,
  FishingTrend,
  MpaStatus,
} from "./types";

/**
 * Pure fishing-pressure logic: turn Global Fishing Watch apparent-fishing-hours
 * into a band, reconcile it against MPAtlas protection, and decide what it means
 * for the reef state. No data-layer imports so it stays unit-testable in
 * isolation. The location-bound lookup lives in fishing-pressure.ts.
 *
 * Design + calibration rationale: .claude/mpa-gfw-fishing-spec.md
 */

/** GFW hours/year thresholds. Ordered ascending. */
export const GFW_BANDS = {
  low: 200,
  moderate: 2_500,
  high: 25_000,
} as const;

/**
 * Apparent-fishing-hours/year within the query radius → effort band.
 * Distribution is heavily right-skewed (median ~350h, p90 ~17.6k), so the
 * bands are log-scaled, not linear. 200h across a 50km radius is roughly one
 * industrial vessel fishing for under a month over a country-sized area — hence
 * "low".
 */
export function gfwEffortLevel(hours: number | null | undefined): FishingEffortLevel {
  if (hours == null || Number.isNaN(hours)) return "unknown";
  if (hours < GFW_BANDS.low) return "low";
  if (hours < GFW_BANDS.moderate) return "moderate";
  if (hours < GFW_BANDS.high) return "high";
  return "very-high";
}

/** Editorial fishingPressure → effort band. Fallback for locations with no GFW record. */
export function editorialEffortLevel(pressure: string | null | undefined): FishingEffortLevel {
  switch (pressure) {
    case "low":
      return "low";
    case "moderate":
    case "medium": // legacy typo; treated as moderate
      return "moderate";
    case "high":
    case "very-high":
      return "high";
    default:
      return "unknown";
  }
}

/**
 * The tie-in. Measured effort (GFW) is the source of truth; MPAtlas protection
 * is a modifier that can only strengthen the read when the data confirms it:
 *  - protected + measured low  → "protected" (enforcement confirmed working)
 *  - protected + measured high → "paper-park" (protection not holding)
 *  - everything else           → the raw measured band
 * Protection never grants credit that the measurement contradicts.
 */
export function reconcile(effort: FishingEffortLevel, mpa: MpaStatus | null): EffectiveFishing {
  const isProtected = mpa === "no-take" || mpa === "strict-mpa";
  if (isProtected && effort === "low") return "protected";
  if (isProtected && (effort === "high" || effort === "very-high")) return "paper-park";
  return effort;
}

/**
 * Below this peak (apparent fishing hours in any year of the series) we treat
 * the trend as noise and do not chart it: a swing like 0h → 2h is not a
 * "rising" story worth telling. Matches the low/moderate band boundary, so a
 * shown trend always involves at least one year of genuinely measurable effort.
 */
export const EFFORT_TREND_MIN_HOURS = GFW_BANDS.low;

/**
 * The multi-year effort series to display, oldest first: the ingested per-year
 * series when present, else a two-point series synthesized from the record's
 * `historical` + `current` points. Deduplicates by year (last write wins) and
 * sorts ascending. Chart-only — never a reef-state input.
 */
export function fishingEffortSeries(record: {
  current?: FishingEffortPoint | null;
  historical?: FishingEffortPoint | null;
  series?: FishingEffortPoint[] | null;
} | null | undefined): FishingEffortPoint[] {
  if (!record) return [];
  const source =
    record.series && record.series.length > 0
      ? record.series
      : [record.historical, record.current];
  const byYear = new Map<number, number>();
  for (const p of source) {
    if (!p || typeof p.year !== "number" || typeof p.fishingHours !== "number") {
      continue;
    }
    byYear.set(p.year, p.fishingHours);
  }
  return [...byYear.entries()]
    .map(([year, fishingHours]) => ({ year, fishingHours }))
    .sort((a, b) => a.year - b.year);
}

/**
 * Whether an effort series is worth charting as a trend: at least two distinct
 * years and a peak above {@link EFFORT_TREND_MIN_HOURS}. Keeps near-zero
 * series (where a tiny absolute change reads as a dramatic direction) off the
 * card.
 */
export function effortTrendWorthShowing(series: FishingEffortPoint[]): boolean {
  if (series.length < 2) return false;
  return series.some((p) => p.fishingHours >= EFFORT_TREND_MIN_HOURS);
}

/** Current vs multi-year baseline → trend direction. */
export function fishingTrend(
  current: number | null | undefined,
  baseline: number | null | undefined,
): FishingTrend {
  if (current == null) return "unknown";
  if (baseline == null) return "unknown";
  if (baseline === 0) return current > 0 ? "rising" : "stable";
  const ratio = current / baseline;
  if (ratio > 1.5) return "rising";
  if (ratio < 0.67) return "falling";
  return "stable";
}

/**
 * Whether the reconciled fishing read permits an "Improving" reef state.
 * Only genuinely low or confirmed-protected water qualifies; "unknown" gets
 * the benefit of the doubt (no data to say otherwise).
 */
export function fishingAllowsImproving(e: EffectiveFishing): boolean {
  return e === "protected" || e === "low" || e === "unknown";
}

/** Internal QA only: protected on paper but heavy measured fishing nearby. */
export function isPaperParkRisk(e: EffectiveFishing): boolean {
  return e === "paper-park";
}
