"use client";

import { useState, useRef } from "react";

// ─── FishAbundanceChart ──────────────────────────────────────────────────────
// Honest observed REEF fish-abundance history on the site's own time axis.
// Draws a line through the real per-year density-index points only — no forward
// projection, no extrapolation. Two points read as a before/after; three or more
// as a genuine multi-year trend. Every point is a survey-effort-standardised
// value that was actually recorded by REEF volunteer divers in that year.
//
// This is a RELATIVE abundance index (REEF density, 0–3), not biomass. It is
// display-only and never feeds the reef-state verdict. Because REEF logs the
// number of surveys, a rising line reflects more fish seen per survey rather
// than more divers — which raw observation counts cannot tell apart.

export type FishAbundancePoint = {
  year: number;
  /** REEF density index (0–3). */
  value: number;
  /** Surveys behind this year's value — shown in the tooltip. */
  surveyCount: number;
};

type Props = {
  locationName: string;
  /** At least 2 observed points required for the chart to render. */
  dataPoints: FishAbundancePoint[];
  /** Short attribution shown under the chart, e.g. "REEF · Bonaire zone". */
  sourceLabel?: string;
};

const VIEWBOX_W = 520;
const VIEWBOX_H = 180;
const LEFT_PAD = 34;
const RIGHT_PAD = 16;
const TOP_PAD = 20;
const BOT_PAD = 26;
const MIN_LABEL_GAP = 46; // px between year labels, avoids collisions

// REEF density index (DEN) runs on a fixed 1–4 scale: 1 = Single, 2 = Few,
// 3 = Many, 4 = Abundant. The axis is anchored to that scale's true floor and
// ceiling — not a cherry-picked baseline — and held constant across every site,
// so a higher line genuinely means more fish per survey, never a rescaled axis.
const AXIS_MIN = 1;
const AXIS_MAX = 4;

// A warm ocean-green for the fish line, distinct from the ink coral line.
const LINE_COLOR = "#0E6E5A";

function yFor(value: number): number {
  const chartH = VIEWBOX_H - TOP_PAD - BOT_PAD;
  const clamped = Math.min(Math.max(value, AXIS_MIN), AXIS_MAX);
  return TOP_PAD + chartH - ((clamped - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * chartH;
}

export function FishAbundanceChart({
  locationName,
  dataPoints,
  sourceLabel,
}: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    year: number;
    value: number;
    surveyCount: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (dataPoints.length < 2) {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "#F8F7F4",
          border: "1px solid #E7E6E2",
          borderRadius: "8px",
          fontSize: "0.8125rem",
          color: "#4A5568",
          fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
        }}
      >
        Only one year of REEF surveys on file for this zone, so there is nothing
        to chart yet. The trend appears once a second survey year is recorded.
      </div>
    );
  }

  const sorted = [...dataPoints].sort((a, b) => a.year - b.year);
  const minYear = sorted[0].year;
  const maxYear = sorted[sorted.length - 1].year;
  const yearSpan = Math.max(1, maxYear - minYear);
  const twoPoint = sorted.length === 2;

  function xFor(year: number): number {
    const frac = (year - minYear) / yearSpan;
    return LEFT_PAD + frac * (VIEWBOX_W - LEFT_PAD - RIGHT_PAD);
  }

  const linePoints = sorted
    .map((d) => `${xFor(d.year)},${yFor(d.value)}`)
    .join(" ");

  // Year labels, left to right, dropping any that would collide with the last
  // one kept. First and last years are always shown.
  const labelYears: number[] = [];
  let lastX = -Infinity;
  sorted.forEach((d, i) => {
    const x = xFor(d.year);
    const isEnd = i === 0 || i === sorted.length - 1;
    if (isEnd || x - lastX >= MIN_LABEL_GAP) {
      if (i === sorted.length - 1 && labelYears.length > 0 && x - lastX < MIN_LABEL_GAP) {
        labelYears.pop();
      }
      labelYears.push(d.year);
      lastX = x;
    }
  });

  // Accessible hidden table
  const tableRows = sorted
    .map((d) => `<tr><td>${d.year}</td><td>${d.value.toFixed(2)}</td><td>${d.surveyCount}</td></tr>`)
    .join("");

  const ariaLabel = `REEF fish abundance history for ${locationName}`;

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_W} ${VIEWBOX_H}`}
        width="100%"
        height={VIEWBOX_H}
        role="img"
        aria-label={ariaLabel}
        style={{ display: "block", overflow: "visible" }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-axis frame */}
        <line x1={LEFT_PAD} y1={TOP_PAD} x2={VIEWBOX_W - RIGHT_PAD} y2={TOP_PAD} stroke="#EEEDEA" strokeWidth="1" />
        <line x1={LEFT_PAD} y1={VIEWBOX_H - BOT_PAD} x2={VIEWBOX_W - RIGHT_PAD} y2={VIEWBOX_H - BOT_PAD} stroke="#E7E6E2" strokeWidth="1" />
        <text x={LEFT_PAD - 6} y={TOP_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{AXIS_MAX}</text>
        <text x={LEFT_PAD - 6} y={VIEWBOX_H - BOT_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{AXIS_MIN}</text>

        {/* Observed abundance line. Two points = a dashed before/after; more = a
            solid multi-year trend. */}
        <polyline
          points={linePoints}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={twoPoint ? "6 4" : undefined}
        />

        {/* Data points with hover targets */}
        {sorted.map((d) => {
          const cx = xFor(d.year);
          const cy = yFor(d.value);
          return (
            <g key={d.year}>
              <circle cx={cx} cy={cy} r="4" fill={LINE_COLOR} stroke="#FFFFFF" strokeWidth="2" />
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({ x: cx, y: cy, year: d.year, value: d.value, surveyCount: d.surveyCount });
                }}
              />
            </g>
          );
        })}

        {/* Year axis labels (collision-free) */}
        {labelYears.map((year) => (
          <text key={`lbl-${year}`} x={xFor(year)} y={VIEWBOX_H - 6} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="middle">
            {year}
          </text>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 40} y={tooltip.y - 44} width={80} height={36} rx={4} fill="#0E1C28" opacity="0.9" />
            <text x={tooltip.x} y={tooltip.y - 30} fontSize="10" fill="#FFFFFF" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">
              {tooltip.value.toFixed(2)}
            </text>
            <text x={tooltip.x} y={tooltip.y - 20} fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono" textAnchor="middle">
              {tooltip.year} · {tooltip.surveyCount} surveys
            </text>
          </g>
        )}
      </svg>

      {/* Accessible hidden table */}
      <table
        aria-hidden="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
        dangerouslySetInnerHTML={{
          __html: `<caption>${ariaLabel}</caption><thead><tr><th>Year</th><th>Density index</th><th>Surveys</th></tr></thead><tbody>${tableRows}</tbody>`,
        }}
      />

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.1rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 20, height: 2.5, background: LINE_COLOR, borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
            {twoPoint ? "Two survey years" : `${sorted.length} survey years, ${minYear} to ${maxYear}`}
          </span>
        </div>
        {sourceLabel ? (
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
            {sourceLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
