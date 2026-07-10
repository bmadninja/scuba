// ═══════════════════════════════════════════════════════════════════════════
// Reef-State "evidence breakdown" — static config + types
// ═══════════════════════════════════════════════════════════════════════════
//
// This is the presentation config behind the reef-breakdown card (see
// ./reef-breakdown-card.tsx). It carries no per-reef data — only the fixed
// vocabulary the card renders with:
//
//   PILLARS   the four signals, in fixed order, with plain-word sources + copy
//   TAKEAWAY  band -> plain-language takeaway, per signal (no numbers, no units)
//   VERDICT   the four reef-state labels -> tone + one-line note
//   CHART     per-signal chart geometry: a FIXED domain (never series-scaled)
//             with a shaded "healthy" zone, so the value is judged against a
//             scientific baseline and reefs stay comparable.
//
// The core design decision this encodes: two signals are inverted at the metric
// level (high water heat and high fishing pressure are *bad*). Both the takeaway
// wording and the `dir` field keep everything oriented to *reef health*, so a
// value inside the green band always means "good" regardless of metric
// direction. The `band` a reef reports per signal is expected to be computed
// server-side (already inverted for heat/fishing) — the UI never derives
// good/bad from raw numbers.

export type SignalKey = "coral" | "thermal" | "fish" | "fishing";

/** Health band for a single signal. `none` = not surveyed. Precomputed server-side. */
export type Band = "good" | "mid" | "bad" | "none";

/** Plain-word trend direction, or null when a signal has no defined trend. */
export type Trend = "rising" | "holding" | "falling" | null;

/** The four reef-state labels shown as the overall rating. */
export type VerdictLabel = "Thriving" | "Improving" | "Stable" | "Declining";

/** Per-signal data for one reef. `band` is precomputed; the UI is presentational. */
export type SignalDatum = {
  band: Band;
  /** Optional qualitative detail — always words, never numbers. */
  detail: string | null;
  trend: Trend;
  /** Ordered oldest→newest reading series, or null when there are no readings. */
  series: number[] | null;
  /**
   * Optional start/end labels for the chart read-out (e.g. ["2016", "now"]).
   * Falls back to the pillar's static xAxis when omitted — set this when the
   * real survey years are known so the read-out is honest per reef.
   */
  xAxis?: [string, string];
};

/** The full view-model the card renders. Assembled server-side per reef. */
export type ReefBreakdown = {
  verdict: VerdictLabel;
  /** Present only when the rating was editorially set from a study, not the signals. */
  overrideNote: string | null;
  signals: Record<SignalKey, SignalDatum>;
};

export type PillarConfig = {
  key: SignalKey;
  name: string;
  /** Plain-word data source, e.g. "Diver surveys". */
  source: string;
  /** Start/end labels for the chart read-out, e.g. ["2016", "now"]. */
  xAxis: [string, string];
  /** One-sentence "how we measure this", shown in the method modal. */
  measure: string;
};

// Fixed pillar order. Sources are plain words; `measure` copy feeds the modal.
export const PILLARS: readonly PillarConfig[] = [
  {
    key: "coral",
    name: "Living coral",
    source: "Diver surveys",
    xAxis: ["2016", "now"],
    measure:
      "How much of the reef is still living coral, checked by divers on repeat visits.",
  },
  {
    key: "thermal",
    name: "Water heat",
    source: "NOAA satellites",
    xAxis: ["24 mo ago", "now"],
    measure: "How hot the water has run. Long hot spells bleach and kill coral.",
  },
  {
    key: "fish",
    name: "Fish life",
    source: "Diver fish counts",
    xAxis: ["2016", "now"],
    measure: "How much fish life divers count here, next to reefs like it.",
  },
  {
    key: "fishing",
    name: "Fishing pressure",
    source: "Boat tracking",
    xAxis: ["24 mo ago", "now"],
    measure:
      "How hard the reef is fished, from boat-traffic data and local reports.",
  },
] as const;

// Plain-language takeaway per pillar + band. No numbers, no units — the takeaway
// always describes reef health, never the raw metric direction.
export const TAKEAWAY: Record<SignalKey, Record<Band, string>> = {
  coral: {
    good: "Plenty of living coral",
    mid: "Patchy coral cover",
    bad: "Mostly bare rock",
    none: "Not surveyed yet",
  },
  thermal: {
    good: "Cool — no bleaching",
    mid: "Running warm",
    bad: "Dangerous heat",
    none: "No satellite reading",
  },
  fish: {
    good: "Full of fish",
    mid: "Some fish, not many",
    bad: "Big fish are scarce",
    none: "Not counted yet",
  },
  fishing: {
    good: "Protected from fishing",
    mid: "Some fishing pressure",
    bad: "Heavily fished",
    none: "No fishing data",
  },
};

// The four reef-state labels.
export const VERDICT: Record<VerdictLabel, { tone: "good" | "mid" | "bad"; note: string }> = {
  Thriving: { tone: "good", note: "One of the healthiest reefs we track." },
  Improving: { tone: "good", note: "Bouncing back — clearly on the mend." },
  Stable: { tone: "mid", note: "Holding steady, for now." },
  Declining: { tone: "bad", note: "Losing ground faster than it recovers." },
};

export type ChartConfig = {
  /** Fixed [lo, hi] axis domain in data units — NOT series-scaled. */
  domain: [number, number];
  /** Axis unit suffix, e.g. "%", "°C-wk", " hrs". */
  unit: string;
  /** Gridline tick values, in data units. */
  ticks: number[];
  /** Healthy [lo, hi] range in data units. */
  healthy: [number, number];
  /** Which side of the threshold is healthy: "high" (coral/fish) or "low" (heat/fishing). */
  dir: "high" | "low";
  /** Middle read-out caption under the chart. */
  axisNote: string;
};

// Per-signal chart config. Fixed domain (not series-scaled) so the healthy zone
// is meaningful and reefs are comparable. `healthy` = [lo, hi] in data units;
// `dir` says which side of the threshold is good.
export const CHART: Record<SignalKey, ChartConfig> = {
  coral: {
    domain: [0, 60],
    unit: "%",
    ticks: [0, 20, 40, 60],
    healthy: [40, 60],
    dir: "high",
    axisNote: "% of seabed as living coral",
  },
  thermal: {
    domain: [0, 12],
    unit: "°C-wk",
    ticks: [0, 4, 8, 12],
    healthy: [0, 4],
    dir: "low",
    axisNote: "accumulated heat stress",
  },
  fish: {
    domain: [0, 130],
    unit: "%",
    ticks: [0, 50, 100],
    healthy: [100, 130],
    dir: "high",
    axisNote: "vs a healthy reef of its kind",
  },
  fishing: {
    domain: [0, 100],
    unit: " hrs",
    ticks: [0, 50, 100],
    healthy: [0, 20],
    dir: "low",
    axisNote: "boat-hours fished per week",
  },
};

// ── Design tokens ──────────────────────────────────────────────────────────
// The handoff's shared.css uses OKLCH tokens (--ink, --paper, --ok …). This app
// ships the same palette as hex `--color-*` tokens (see globals.css) and already
// maps the three health bands to its reef-state colours. We reuse those so the
// card reads native to the rest of the location page.
export const TOKENS = {
  paper: "#FFFFFF",
  surface: "#F8F7F4",
  hairline: "#E7E6E2",
  hairlineStrong: "#D3D1CB",
  ink: "#0E1C28",
  ink2: "#4A5568",
  mute: "#6B7280",
  // Health bands — the app's reef-state colours (improving/stable/declining).
  ok: "#2E7D5B",
  warn: "#B98A2E",
  bad: "#C0412B",
  brandYellow: "#F6C700",
  brandYellowInk: "#0E1C28",
  serif: 'var(--font-serif), "Source Serif 4", Georgia, serif',
  sans: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
  mono: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
} as const;

const TONE_COLOR: Record<Band, string> = {
  good: TOKENS.ok,
  mid: TOKENS.warn,
  bad: TOKENS.bad,
  none: TOKENS.mute,
};

/** Health-band colour for a signal (also the chart line/area/point colour). */
export function toneColor(band: Band): string {
  return TONE_COLOR[band] ?? TOKENS.mute;
}

/** Plain-language takeaway for a signal at a given band. */
export function takeaway(key: SignalKey, band: Band): string {
  return TAKEAWAY[key][band];
}

/** Plain arrow glyph for a trend word. */
export const TREND_ARROW: Record<Exclude<Trend, null>, string> = {
  rising: "↑",
  holding: "→",
  falling: "↓",
};

/**
 * Derive a health band for a signal from a real measured value, judged against
 * that signal's own healthy range in `CHART`. This keeps the band consistent
 * with the shaded healthy zone the chart draws — a value inside the zone reads
 * `good`, moderately outside reads `mid`, far outside reads `bad`. It uses the
 * design's stated thresholds only; it invents no new science.
 *
 * For "high is good" (coral, fish): good at/above the zone floor, `mid` down to
 * half of it, `bad` below. For "low is good" (heat, fishing): good at/below the
 * zone ceiling, `mid` up to twice it, `bad` above — which lines up with NOAA's
 * DHW bleaching steps (4 → warning, 8 → alert) for water heat.
 */
export function bandFromValue(key: SignalKey, value: number | null): Band {
  if (value == null || Number.isNaN(value)) return "none";
  const cfg = CHART[key];
  if (cfg.dir === "high") {
    const floor = cfg.healthy[0];
    if (value >= floor) return "good";
    if (value >= floor / 2) return "mid";
    return "bad";
  }
  const ceil = cfg.healthy[1];
  if (value <= ceil) return "good";
  if (value <= ceil * 2) return "mid";
  return "bad";
}
