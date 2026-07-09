"use client";

import { useState, useRef } from "react";

// ─── FishBiomassChart ────────────────────────────────────────────────────────
// Honest observed reef-fish-biomass history on the site's own time axis. Draws a
// line through the real Reef Life Survey points only — no forward projection, no
// extrapolation. Two points read as a before/after; three or more as a genuine
// multi-year trend. Every point is a value that was actually measured.
//
// Fish biomass (kilograms per hectare) is the reef metric that responds to
// protection, so this is the "protection works" companion to the coral-cover
// chart. It is DISPLAY ONLY and never sets the reef-state label.

export type BiomassDataPoint = {
  year: number;
  /** Standing fish biomass, kilograms per hectare. */
  kgPerHa: number;
};

type Props = {
  locationName: string;
  /** At least 2 observed survey points required for the chart to render. */
  dataPoints: BiomassDataPoint[];
  /** Short attribution shown under the chart, e.g. "Reef Life Survey". */
  sourceLabel?: string;
};

const VIEWBOX_W = 520;
const VIEWBOX_H = 180;
const LEFT_PAD = 44;
const RIGHT_PAD = 16;
const TOP_PAD = 20;
const BOT_PAD = 26;
const MIN_LABEL_GAP = 46; // px between year labels, avoids collisions

// Warm sea-green for the fish-biomass line, distinct from the coral chart's ink.
const LINE_COLOR = "#2E7D5B";

function yFor(value: number, top: number): number {
  const chartH = VIEWBOX_H - TOP_PAD - BOT_PAD;
  return TOP_PAD + chartH - (value / top) * chartH;
}

function fmt(kgPerHa: number): string {
  return kgPerHa >= 1000
    ? `${(kgPerHa / 1000).toFixed(1)}k`
    : `${Math.round(kgPerHa)}`;
}

export function FishBiomassChart({ locationName, dataPoints, sourceLabel }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    year: number;
    kgPerHa: number;
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
        Only one fish survey on file for this reef, so there is nothing to chart
        yet. The trend appears once a second survey year is recorded.
      </div>
    );
  }

  const sorted = [...dataPoints].sort((a, b) => a.year - b.year);
  const minYear = sorted[0].year;
  const maxYear = sorted[sorted.length - 1].year;
  const yearSpan = Math.max(1, maxYear - minYear);
  const maxVal = Math.max(...sorted.map((d) => d.kgPerHa));
  // Round the axis top up to a clean value above the highest point.
  const step = maxVal >= 2000 ? 500 : maxVal >= 500 ? 200 : 50;
  const top = Math.max(step, Math.ceil(maxVal / step) * step);
  const twoPoint = sorted.length === 2;

  function xFor(year: number): number {
    const frac = (year - minYear) / yearSpan;
    return LEFT_PAD + frac * (VIEWBOX_W - LEFT_PAD - RIGHT_PAD);
  }

  const linePoints = sorted
    .map((d) => `${xFor(d.year)},${yFor(d.kgPerHa, top)}`)
    .join(" ");

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

  const tableRows = sorted
    .map((d) => `<tr><td>${d.year}</td><td>${Math.round(d.kgPerHa)} kg/ha</td></tr>`)
    .join("");

  const ariaLabel = `Reef fish biomass history for ${locationName}`;

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
        <text x={LEFT_PAD - 6} y={TOP_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{fmt(top)}</text>
        <text x={LEFT_PAD - 6} y={VIEWBOX_H - BOT_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">0</text>
        <text x={LEFT_PAD - 6} y={(TOP_PAD + VIEWBOX_H - BOT_PAD) / 2} fontSize="8" fill="#9CB3AB" fontFamily="IBM Plex Mono" textAnchor="end">kg/ha</text>

        {/* Observed survey line. Two points = a dashed before/after; more = a
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
          const cy = yFor(d.kgPerHa, top);
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
                  setTooltip({ x: cx, y: cy, year: d.year, kgPerHa: d.kgPerHa });
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
            <rect x={tooltip.x - 40} y={tooltip.y - 38} width={80} height={30} rx={4} fill="#0E1C28" opacity="0.9" />
            <text x={tooltip.x} y={tooltip.y - 24} fontSize="10" fill="#FFFFFF" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">
              {Math.round(tooltip.kgPerHa)} kg/ha
            </text>
            <text x={tooltip.x} y={tooltip.y - 13} fontSize="9" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono" textAnchor="middle">
              {tooltip.year}
            </text>
          </g>
        )}
      </svg>

      {/* Accessible hidden table */}
      <table
        aria-hidden="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}
        dangerouslySetInnerHTML={{
          __html: `<caption>${ariaLabel}</caption><thead><tr><th>Year</th><th>Fish biomass</th></tr></thead><tbody>${tableRows}</tbody>`,
        }}
      />

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.1rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 20, height: 2.5, background: LINE_COLOR, borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
            {twoPoint ? "Two surveys" : `${sorted.length} surveys, ${minYear} to ${maxYear}`}
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
