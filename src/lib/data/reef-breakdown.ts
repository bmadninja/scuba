// ═══════════════════════════════════════════════════════════════════════════
// Server-side builder for the reef evidence-breakdown card
// ═══════════════════════════════════════════════════════════════════════════
//
// Maps the location page's already-computed reef signals into the presentational
// `ReefBreakdown` view-model the card renders. Per the project's data discipline
// this is deliberately HONEST rather than complete:
//
//   • coral  — real coral-cover % series drives a full chart; the band is judged
//     against the design's own healthy range.
//   • heat   — degree-heating-weeks (°C-wk) is a single current reading, so its
//     chart shows "one survey only"; the band follows NOAA's DHW steps.
//   • fish   — the app measures fish *biomass*, not "% vs a healthy reef", and
//     deliberately never grades biomass good/bad. There is no honest per-signal
//     fish band, so fish stays "not surveyed" until a comparable metric exists.
//   • fishing — GFW effort gives an honest band, but its units (annual apparent-
//     fishing-hours in a radius) do not match the design's "boat-hours/week"
//     axis, so the chart is left degenerate rather than plotted on a wrong scale.
//
// No new scientific thresholds are invented here: coral/heat bands use the
// design's stated healthy ranges (see CHART), and fishing reuses the effort/MPA
// band the page already computes.

import {
  bandFromValue,
  type Band,
  type ReefBreakdown,
  type SignalDatum,
  type Trend,
  type VerdictLabel,
} from "@/components/reef-report/reef-breakdown-config";
import type { BleachingAlertLevel, MpaStatus } from "@/lib/data/types";

type CoralDirection = "up" | "flat" | "down" | null;
type FishingEffort = "low" | "moderate" | "high" | "very-high" | "unknown";
type FishingTrend = "rising" | "stable" | "falling" | "unknown";

export type ReefBreakdownInput = {
  /** Overall reef state, from the atlas location model. */
  state: "thriving" | "pressure" | "change" | "unknown";
  coral: {
    /** Headline observed cover %, if surveyed. */
    coverNow: number | null;
    /** Real coral-cover survey points (oldest→newest), % per year. */
    series: { year: number; pct: number }[];
    /** Trend direction of the cover, if a before/after exists. */
    direction: CoralDirection;
  };
  thermal: {
    /** Degree-heating-weeks (°C-wk), a single current reading. */
    dhw: number | null;
    /** NOAA alert level, or null when there is no thermal record. */
    alert: BleachingAlertLevel | null;
  };
  fishing: {
    mpaStatus: MpaStatus | null;
    effort: FishingEffort | null;
    trend: FishingTrend | null;
    /** Qualitative detail (no numbers), e.g. "rules enforced on the water". */
    detail: string | null;
  };
  /** True when the reef state was hand-set from cited studies (→ override note). */
  citedManualState: boolean;
};

const VERDICT_FROM_STATE: Record<ReefBreakdownInput["state"], VerdictLabel> = {
  thriving: "Thriving",
  pressure: "Stable",
  change: "Declining",
  unknown: "Stable",
};

// Plain, number-free detail + trend for the coral row from its direction.
const CORAL_DETAIL: Record<Exclude<CoralDirection, null>, string> = {
  up: "climbing back",
  flat: "holding steady",
  down: "slipping year on year",
};
const CORAL_TREND: Record<Exclude<CoralDirection, null>, Trend> = {
  up: "rising",
  flat: "holding",
  down: "falling",
};

// Plain heat detail keyed to the resolved band (no numbers — the value lives in
// the chart / DHW reading). Kept band-consistent so the detail never contradicts
// the takeaway (e.g. "Cool — no bleaching" must not read "a little warm").
const HEAT_DETAIL_BY_BAND: Record<Exclude<Band, "none">, string> = {
  good: "no heat stress building",
  mid: "warmer than usual right now",
  bad: "bleaching likely right now",
};

// Heat band fallback when we have an alert level but no DHW number.
const HEAT_BAND_FROM_ALERT: Record<BleachingAlertLevel, Band> = {
  "no-stress": "good",
  watch: "good",
  warning: "mid",
  "alert-1": "bad",
  "alert-2": "bad",
};

function coralSignal(coral: ReefBreakdownInput["coral"]): SignalDatum {
  const points = coral.series;
  const effectiveCover =
    coral.coverNow ?? (points.length > 0 ? points[points.length - 1].pct : null);
  const band = bandFromValue("coral", effectiveCover);
  if (band === "none") {
    return { band: "none", detail: null, trend: null, series: null };
  }
  const detail = coral.direction ? CORAL_DETAIL[coral.direction] : null;
  const trend = coral.direction ? CORAL_TREND[coral.direction] : null;
  if (points.length >= 2) {
    return {
      band,
      detail,
      trend,
      series: points.map((p) => p.pct),
      xAxis: [String(points[0].year), "now"],
    };
  }
  // A single reading (or only the headline number) — honest "one survey only".
  return {
    band,
    detail,
    trend,
    series: effectiveCover != null ? [effectiveCover] : null,
  };
}

function thermalSignal(thermal: ReefBreakdownInput["thermal"]): SignalDatum {
  if (thermal.dhw == null && thermal.alert == null) {
    return { band: "none", detail: null, trend: null, series: null };
  }
  const band =
    thermal.dhw != null
      ? bandFromValue("thermal", thermal.dhw)
      : HEAT_BAND_FROM_ALERT[thermal.alert as BleachingAlertLevel];
  const detail = band === "none" ? null : HEAT_DETAIL_BY_BAND[band];
  // DHW is a single rolling reading — no historical series, so the chart shows
  // its degenerate state and the band + takeaway carry the meaning.
  return {
    band,
    detail,
    trend: null,
    series: thermal.dhw != null ? [thermal.dhw] : null,
  };
}

function fishingSignal(fishing: ReefBreakdownInput["fishing"]): SignalDatum {
  let band: Band;
  if (fishing.mpaStatus === "no-take" || fishing.mpaStatus === "strict-mpa") {
    band = "good";
  } else if (fishing.mpaStatus === "designated-multi-use") {
    band = "mid";
  } else {
    switch (fishing.effort) {
      case "low":
        band = "good";
        break;
      case "moderate":
        band = "mid";
        break;
      case "high":
      case "very-high":
        band = "bad";
        break;
      default:
        band = "none";
    }
  }
  if (band === "none") {
    return { band: "none", detail: null, trend: null, series: null };
  }
  // Only surface a trend when there is real pressure to trend — a protected /
  // quiet reef's boat-traffic direction is noise, matching the page's own rule.
  let trend: Trend = null;
  if (band !== "good") {
    if (fishing.trend === "rising") trend = "rising";
    else if (fishing.trend === "falling") trend = "falling";
    else if (fishing.trend === "stable") trend = "holding";
  }
  // GFW effort units (annual apparent-fishing-hours in a radius) do not match the
  // design's boat-hours/week axis, so we do not plot a mis-scaled series.
  return { band, detail: fishing.detail, trend, series: null };
}

/**
 * Assemble the reef-breakdown view-model, or null when no signal has honest
 * data (so the card simply does not render).
 */
export function buildReefBreakdown(input: ReefBreakdownInput): ReefBreakdown | null {
  const signals = {
    coral: coralSignal(input.coral),
    thermal: thermalSignal(input.thermal),
    // No honest per-signal fish grade exists yet (see file header).
    fish: { band: "none", detail: null, trend: null, series: null } as SignalDatum,
    fishing: fishingSignal(input.fishing),
  };

  const anySurveyed =
    signals.coral.band !== "none" ||
    signals.thermal.band !== "none" ||
    signals.fishing.band !== "none";
  if (!anySurveyed) return null;

  return {
    verdict: VERDICT_FROM_STATE[input.state],
    overrideNote: input.citedManualState
      ? "This rating was set from published studies, not just the signals below."
      : null,
    signals,
  };
}
