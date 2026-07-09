// ─── FishingEffortTrend ──────────────────────────────────────────────────────
// The direction of measured apparent-fishing-effort near a reef, from Global
// Fishing Watch AIS data. A falling effort beside a protected reef is the
// "pressure easing" signal that complements the fish-biomass story — context,
// not proof of enforcement (AIS misses small and dark vessels, and fishing near
// an MPA is often legal outside a small no-take core). The honest caveats live
// in the "Boat traffic" info popup; this only reports the change.
//
// The NUMBER is the meaning here, not a slope. With only two measured years we
// show a plain-language stat (percent change plus the two figures) and draw NO
// line — a straight line between two points would imply a smooth year-by-year
// glide we never measured. Once the ingest fills three or more real years, a
// magnitude-honest sparkline (y-axis 0 to peak) is drawn above the stat, where
// a line genuinely means something. Server-safe: a pure SVG, no client hooks.

import type { FishingEffortPoint, FishingTrend } from "@/lib/data/types";

type Props = {
  /** Oldest-first per-year effort. Two or more points required to render. */
  series: FishingEffortPoint[];
  /** Direction word, drives the colour and phrasing. */
  trend: FishingTrend;
  radiusKm: number;
};

const VIEWBOX_W = 184;
const VIEWBOX_H = 52;
const LEFT_PAD = 4;
const RIGHT_PAD = 4;
const TOP_PAD = 6;
const BOT_PAD = 16;

// Colour by direction. Falling effort is the good-news signal; rising is a
// warning; steady/unknown stay neutral ink.
const TREND_COLOR: Record<FishingTrend, string> = {
  falling: "#2E7D5B",
  rising: "#B98A2E",
  stable: "#4A5568",
  unknown: "#4A5568",
};

const MONO = 'var(--font-mono), "IBM Plex Mono", monospace';

// GFW apparent hours are modelled estimates, so round to a readable precision
// rather than implying count-level accuracy.
function roundHours(h: number): number {
  if (h >= 1000) return Math.round(h / 100) * 100;
  if (h >= 100) return Math.round(h / 10) * 10;
  return h;
}

// The headline sentence. Percent is computed from the exact figures; a rising
// change off a tiny baseline is phrased without a number (a huge percent off a
// handful of hours would read as false precision).
function headline(trend: FishingTrend, first: number, last: number, firstYear: number): string {
  const pct = first > 0 ? Math.round((Math.abs(last - first) / first) * 100) : null;
  switch (trend) {
    case "falling":
      return pct != null
        ? `Fishing effort down ${pct}% since ${firstYear}`
        : `Fishing effort lower than ${firstYear}`;
    case "rising":
      return pct != null && first >= 50 && pct <= 300
        ? `Fishing effort up ${pct}% since ${firstYear}`
        : `Fishing effort higher than ${firstYear}`;
    default:
      return `Fishing effort about the same as ${firstYear}`;
  }
}

export function FishingEffortTrend({ series, trend, radiusKm }: Props) {
  const sorted = [...series].sort((a, b) => a.year - b.year);
  if (sorted.length < 2) return null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const color = TREND_COLOR[trend];
  const drawLine = sorted.length >= 3;

  const minYear = first.year;
  const maxYear = last.year;
  const yearSpan = Math.max(1, maxYear - minYear);
  const peak = Math.max(...sorted.map((d) => d.fishingHours), 1);
  const chartH = VIEWBOX_H - TOP_PAD - BOT_PAD;
  const xFor = (year: number) =>
    LEFT_PAD + ((year - minYear) / yearSpan) * (VIEWBOX_W - LEFT_PAD - RIGHT_PAD);
  const yFor = (hours: number) => TOP_PAD + chartH - (hours / peak) * chartH;
  const linePoints = sorted.map((d) => `${xFor(d.year)},${yFor(d.fishingHours)}`).join(" ");

  return (
    <div style={{ marginTop: "0.4rem" }}>
      {drawLine ? (
        <svg
          viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
          width={VIEWBOX_W}
          height={VIEWBOX_H}
          role="img"
          aria-label={`Apparent fishing effort within ${radiusKm} km, ${minYear} to ${maxYear}.`}
          style={{ display: "block", maxWidth: "100%", overflow: "visible" }}
        >
          <line
            x1={LEFT_PAD}
            y1={VIEWBOX_H - BOT_PAD}
            x2={VIEWBOX_W - RIGHT_PAD}
            y2={VIEWBOX_H - BOT_PAD}
            stroke="#E7E6E2"
            strokeWidth="1"
          />
          <polyline
            points={linePoints}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {sorted.map((d) => (
            <circle
              key={d.year}
              cx={xFor(d.year)}
              cy={yFor(d.fishingHours)}
              r="2.4"
              fill={color}
              stroke="#FFFFFF"
              strokeWidth="1.5"
            >
              <title>{`${d.fishingHours.toLocaleString()} vessel hours (${d.year})`}</title>
            </circle>
          ))}
          <text x={xFor(minYear)} y={VIEWBOX_H - 4} fontSize="8" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="start">
            {minYear}
          </text>
          <text x={xFor(maxYear)} y={VIEWBOX_H - 4} fontSize="8" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">
            {maxYear}
          </text>
        </svg>
      ) : null}

      <p style={{ margin: 0, fontFamily: MONO, fontSize: 11.5, fontWeight: 600, color, lineHeight: 1.35 }}>
        {headline(trend, first.fishingHours, last.fishingHours, minYear)}
      </p>
      <p style={{ margin: "0.15rem 0 0", fontFamily: MONO, fontSize: 10, color: "#4A5568", lineHeight: 1.35 }}>
        {roundHours(first.fishingHours).toLocaleString()} → {roundHours(last.fishingHours).toLocaleString()} vessel
        hours within {radiusKm} km
      </p>
    </div>
  );
}
