import type { ThermalStress } from "./types";

// ─── Water temperature history (display only) ────────────────────────────────
// Turns the stored monthly SST series (NOAA CRW CoralTemp monthly, on the
// thermalStress block) into an honest observed history for the location page:
// annual-mean points for a clean warming-vs-stable read, plus the current and
// seasonal-usual figures the Heat modal promises.
//
// SHOWN, NOT SCORED. None of this feeds getReefState — reef state stays a read
// on coral condition and the bleaching alert only. A warming trend never moves
// a verdict (see .claude/reef-health-spec.md §8).

export type WaterTempPoint = { year: number; tempC: number };
export type WaterTempTrend = "warming" | "stable";

export type WaterTempSummary = {
  /** Annual-mean SST, one point per complete-enough calendar year. */
  annual: WaterTempPoint[];
  /** Plain read for the context line beside coral cover. */
  trend: WaterTempTrend;
  /** Least-squares warming rate across the annual means, °C per decade. */
  changePerDecadeC: number;
  /** Most recent monthly SST (°C), for the Heat modal. */
  currentC: number | null;
  /** Usual SST for the current season (°C), for the Heat modal. */
  climatologyC: number | null;
  sourceLabel: string;
};

// Minimum months for a calendar year to count toward the trend. Set to 10 so
// only near-complete calendar years contribute: the window's boundary years
// (its first and last, each ~6 months of a single half of the year) are
// dropped, since a half-season mean would bias the endpoints of the line.
const MIN_MONTHS_PER_YEAR = 10;

// A reef counts as "warming" only above this decadal rate. Below it, a 10-year
// satellite record is noise-dominated (ENSO swings alone push the slope around),
// so we say "stable" rather than over-claim a trend from short-record wobble.
const WARMING_THRESHOLD_PER_DECADE = 0.2;

export function getWaterTempSummary(
  thermal: ThermalStress | null | undefined,
): WaterTempSummary | null {
  const series = thermal?.sstSeries;
  if (!series || !Array.isArray(series.monthlyC) || series.monthlyC.length < 12) {
    return null;
  }

  // The compact series is a start month plus one value per following month.
  // Walk it, mapping each index back to its calendar year (monthlyC[i] is
  // `start` + i months), and bucket the observed values by year.
  const startYear = Number(series.start.slice(0, 4));
  const startMonth = Number(series.start.slice(5, 7)); // 1–12
  if (!Number.isFinite(startYear) || !Number.isFinite(startMonth)) return null;

  const byYear = new Map<number, number[]>();
  series.monthlyC.forEach((v, i) => {
    if (typeof v !== "number" || !Number.isFinite(v)) return; // masked/gap month
    const year = startYear + Math.floor((startMonth - 1 + i) / 12);
    const bucket = byYear.get(year);
    if (bucket) bucket.push(v);
    else byYear.set(year, [v]);
  });

  const annual: WaterTempPoint[] = [];
  for (const [year, vals] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    if (vals.length < MIN_MONTHS_PER_YEAR) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    annual.push({ year, tempC: Math.round(mean * 10) / 10 });
  }
  if (annual.length < 2) return null;

  // Ordinary least-squares slope of annual-mean SST over year.
  const n = annual.length;
  const meanX = annual.reduce((s, p) => s + p.year, 0) / n;
  const meanY = annual.reduce((s, p) => s + p.tempC, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of annual) {
    num += (p.year - meanX) * (p.tempC - meanY);
    den += (p.year - meanX) ** 2;
  }
  const slopePerYear = den === 0 ? 0 : num / den;
  const changePerDecadeC = Math.round(slopePerYear * 10 * 100) / 100;
  const trend: WaterTempTrend =
    changePerDecadeC >= WARMING_THRESHOLD_PER_DECADE ? "warming" : "stable";

  return {
    annual,
    trend,
    changePerDecadeC,
    currentC: thermal?.sstCurrentC ?? null,
    climatologyC: thermal?.sstClimatologyC ?? null,
    sourceLabel: "NOAA Coral Reef Watch, annual means",
  };
}
