"use client";

import { useState, useRef } from "react";

// ─── Story 4.2: CoralProjectionChart ─────────────────────────────────────────
// Inline SVG chart with solid historical line + dashed projection to 2031,
// a "Today" marker, hover tooltips, and confidence band.
// Falls back to a DataNote when < 2 data points.

export type CoralDataPoint = {
  year: number;
  pct: number;
};

type Props = {
  locationName: string;
  /** At least 2 data points required for the chart to render. */
  dataPoints: CoralDataPoint[];
};

const CURRENT_YEAR = 2026;
const PROJECT_TO = 2031;
const VIEWBOX_W = 520;
const VIEWBOX_H = 200;
const LEFT_PAD = 30;
const RIGHT_PAD = 20;
const TOP_PAD = 28;
const BOT_PAD = 30;

function xFor(year: number, minYear: number): number {
  const totalSpan = PROJECT_TO - minYear;
  const frac = (year - minYear) / totalSpan;
  return LEFT_PAD + frac * (VIEWBOX_W - LEFT_PAD - RIGHT_PAD);
}

function yFor(pct: number, top: number): number {
  const chartH = VIEWBOX_H - TOP_PAD - BOT_PAD;
  return TOP_PAD + chartH - (pct / top) * chartH;
}

function yForLinear(
  year: number,
  last: CoralDataPoint,
  slope: number,
  top: number,
): number {
  const projected = last.pct + slope * (year - last.year);
  const clamped = Math.max(0, projected);
  return yFor(clamped, top);
}

export function CoralProjectionChart({ locationName, dataPoints }: Props) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    year: number;
    pct: number;
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
        Not enough survey data for a projection. We show the chart once at least
        2 data points are on file.
      </div>
    );
  }

  const sorted = [...dataPoints].sort((a, b) => a.year - b.year);
  const last = sorted[sorted.length - 1];
  const minYear = sorted[0].year;
  const maxPct = Math.max(...sorted.map((d) => d.pct));
  const top = Math.max(40, Math.ceil(maxPct / 10) * 10);

  // Linear projection slope from last two points
  const prev = sorted[sorted.length - 2];
  const slope = (last.pct - prev.pct) / (last.year - prev.year);

  // Build path strings
  const histPoints = sorted
    .map((d) => `${xFor(d.year, minYear)},${yFor(d.pct, top)}`)
    .join(" ");

  const lastX = xFor(last.year, minYear);
  const lastY = yFor(last.pct, top);
  const endX = xFor(PROJECT_TO, minYear);
  const endPct = Math.max(0, last.pct + slope * (PROJECT_TO - last.year));
  const endY = yFor(endPct, top);
  const todayX = xFor(CURRENT_YEAR, minYear);

  // Confidence band (±10pp around projection)
  const bandTopY = yForLinear(CURRENT_YEAR, last, slope + 10 / (PROJECT_TO - last.year), top);
  const bandBotY = yForLinear(CURRENT_YEAR, last, slope - 10 / (PROJECT_TO - last.year), top);
  const bandTopEnd = yFor(Math.max(0, endPct + 10), top);
  const bandBotEnd = yFor(Math.max(0, endPct - 10), top);

  // Accessible hidden table
  const tableRows = sorted.map(
    (d) => `<tr><td>${d.year}</td><td>${d.pct}%</td></tr>`,
  ).join("");

  const ariaLabel = `Coral cover trend for ${locationName}`;

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
        {/* Y-axis hairlines */}
        <line x1={LEFT_PAD} y1={TOP_PAD} x2={VIEWBOX_W - RIGHT_PAD} y2={TOP_PAD} stroke="#E7E6E2" strokeWidth="1" />
        <line x1={LEFT_PAD} y1={VIEWBOX_H - BOT_PAD} x2={VIEWBOX_W - RIGHT_PAD} y2={VIEWBOX_H - BOT_PAD} stroke="#E7E6E2" strokeWidth="1" />
        <text x={LEFT_PAD - 4} y={TOP_PAD + 4} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{top}%</text>
        <text x={LEFT_PAD - 4} y={VIEWBOX_H - BOT_PAD + 4} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">0%</text>

        {/* Today vertical marker */}
        <line x1={todayX} y1={TOP_PAD} x2={todayX} y2={VIEWBOX_H - BOT_PAD} stroke="#0E1C28" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" />
        <text x={todayX + 4} y={TOP_PAD + 12} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono">Today</text>

        {/* Confidence band around projection */}
        <polygon
          points={`${lastX},${lastY} ${endX},${bandTopEnd} ${endX},${bandBotEnd} ${lastX},${lastY}`}
          fill="#0E4F6E"
          opacity="0.10"
        />

        {/* Dashed projection line */}
        <line
          x1={lastX}
          y1={lastY}
          x2={endX}
          y2={endY}
          stroke="#0E4F6E"
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.7"
        />

        {/* Solid historical polyline */}
        <polyline
          points={histPoints}
          fill="none"
          stroke="#0E1C28"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points with hover targets */}
        {sorted.map((d) => {
          const cx = xFor(d.year, minYear);
          const cy = yFor(d.pct, top);
          return (
            <g key={d.year}>
              <circle cx={cx} cy={cy} r="4" fill="#0E1C28" stroke="#FFFFFF" strokeWidth="2" />
              {/* Invisible larger hit target */}
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({ x: cx, y: cy, year: d.year, pct: d.pct });
                }}
              />
            </g>
          );
        })}

        {/* Year axis labels */}
        {sorted.map((d) => (
          <text key={`lbl-${d.year}`} x={xFor(d.year, minYear)} y={VIEWBOX_H - 4} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="middle">
            {d.year}
          </text>
        ))}
        <text x={endX} y={VIEWBOX_H - 4} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="middle">{PROJECT_TO}</text>

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 32}
              y={tooltip.y - 36}
              width={64}
              height={28}
              rx={4}
              fill="#0E1C28"
              opacity="0.9"
            />
            <text x={tooltip.x} y={tooltip.y - 22} fontSize="10" fill="#FFFFFF" fontFamily="IBM Plex Mono" fontWeight="700" textAnchor="middle">
              {tooltip.pct}%
            </text>
            <text x={tooltip.x} y={tooltip.y - 12} fontSize="9" fill="rgba(255,255,255,0.7)" fontFamily="IBM Plex Mono" textAnchor="middle">
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
          __html: `<caption>${ariaLabel}</caption><thead><tr><th>Year</th><th>Coral cover</th></tr></thead><tbody>${tableRows}</tbody>`,
        }}
      />

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.25rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 20, height: 2.5, background: "#0E1C28", borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>Survey data</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke="#0E4F6E" strokeWidth="2" strokeDasharray="4 4" /></svg>
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>Projection to {PROJECT_TO}</span>
        </div>
      </div>
    </div>
  );
}
