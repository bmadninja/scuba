"use client";

import { useState, useRef } from "react";

// ─── CoralCoverHistoryChart ──────────────────────────────────────────────────
// Honest observed-survey history on the site's own time axis. Draws a line
// through the real survey points only — no forward projection, no extrapolation.
// Two points read as a before/after; three or more as a genuine multi-year
// trend. Every point on the site line is a value that was actually measured.
//
// Regional context (GCRMN) is drawn as a single faint HORIZONTAL reference line
// at the region's average cover — "this reef vs its region" — rather than a
// second time series, so there is never an axis-era mismatch.
//
// (Exported as CoralProjectionChart for backwards compatibility with the one
// call site; the old dashed projection-to-2031 was removed because a trend
// extrapolated from two survey points is not something we can stand behind.)

export type CoralDataPoint = {
  year: number;
  pct: number;
};

type Props = {
  locationName: string;
  /** At least 2 observed survey points required for the chart to render. */
  dataPoints: CoralDataPoint[];
  /** Short attribution shown under the chart, e.g. "AIMS LTMP" or "MERMAID". */
  sourceLabel?: string;
  /** Regional average cover, drawn as a faint horizontal reference line. */
  contextValue?: number;
  /** Legend label for the reference line, e.g. "Caribbean average (GCRMN)". */
  contextLabel?: string;
};

const VIEWBOX_W = 520;
const VIEWBOX_H = 180;
const LEFT_PAD = 34;
const RIGHT_PAD = 16;
const TOP_PAD = 20;
const BOT_PAD = 26;
const MIN_LABEL_GAP = 46; // px between year labels, avoids collisions

const CONTEXT_COLOR = "#9CB3AB";

function yFor(pct: number, top: number): number {
  const chartH = VIEWBOX_H - TOP_PAD - BOT_PAD;
  return TOP_PAD + chartH - (pct / top) * chartH;
}

export function CoralProjectionChart({
  locationName,
  dataPoints,
  sourceLabel,
  contextValue,
  contextLabel,
}: Props) {
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
        Only one survey on file for this reef, so there is nothing to chart yet.
        The trend appears once a second survey year is recorded.
      </div>
    );
  }

  const sorted = [...dataPoints].sort((a, b) => a.year - b.year);
  const minYear = sorted[0].year;
  const maxYear = sorted[sorted.length - 1].year;
  const yearSpan = Math.max(1, maxYear - minYear);
  const hasContext = typeof contextValue === "number" && contextValue > 0;
  const maxPct = Math.max(...sorted.map((d) => d.pct), hasContext ? contextValue! : 0);
  const top = Math.max(40, Math.ceil(maxPct / 10) * 10);
  const twoPoint = sorted.length === 2;

  function xFor(year: number): number {
    const frac = (year - minYear) / yearSpan;
    return LEFT_PAD + frac * (VIEWBOX_W - LEFT_PAD - RIGHT_PAD);
  }

  const linePoints = sorted
    .map((d) => `${xFor(d.year)},${yFor(d.pct, top)}`)
    .join(" ");

  // Year labels, left to right, dropping any that would collide with the last
  // one kept. First and last years are always shown.
  const labelYears: number[] = [];
  let lastX = -Infinity;
  sorted.forEach((d, i) => {
    const x = xFor(d.year);
    const isEnd = i === 0 || i === sorted.length - 1;
    if (isEnd || x - lastX >= MIN_LABEL_GAP) {
      // Avoid the last label crowding the final point.
      if (i === sorted.length - 1 && labelYears.length > 0 && x - lastX < MIN_LABEL_GAP) {
        labelYears.pop();
      }
      labelYears.push(d.year);
      lastX = x;
    }
  });

  const contextY = hasContext ? yFor(contextValue!, top) : 0;

  // Accessible hidden table
  const tableRows = sorted
    .map((d) => `<tr><td>${d.year}</td><td>${d.pct}%</td></tr>`)
    .join("");

  const ariaLabel = `Coral cover history for ${locationName}`;

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
        <text x={LEFT_PAD - 6} y={TOP_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{top}%</text>
        <text x={LEFT_PAD - 6} y={VIEWBOX_H - BOT_PAD + 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">0%</text>

        {/* Regional reference line (faint, horizontal) */}
        {hasContext ? (
          <>
            <line
              x1={LEFT_PAD}
              y1={contextY}
              x2={VIEWBOX_W - RIGHT_PAD}
              y2={contextY}
              stroke={CONTEXT_COLOR}
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={VIEWBOX_W - RIGHT_PAD}
              y={contextY - 4}
              fontSize="9"
              fill={CONTEXT_COLOR}
              fontFamily="IBM Plex Mono"
              textAnchor="end"
            >
              region avg {Math.round(contextValue!)}%
            </text>
          </>
        ) : null}

        {/* Observed survey line. Two points = a dashed before/after; more = a
            solid multi-year trend. */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#0E1C28"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={twoPoint ? "6 4" : undefined}
        />

        {/* Data points with hover targets */}
        {sorted.map((d) => {
          const cx = xFor(d.year);
          const cy = yFor(d.pct, top);
          return (
            <g key={d.year}>
              <circle cx={cx} cy={cy} r="4" fill="#0E1C28" stroke="#FFFFFF" strokeWidth="2" />
              <circle
                cx={cx}
                cy={cy}
                r="12"
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onMouseEnter={() => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({ x: cx, y: cy, year: d.year, pct: d.pct });
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
            <rect x={tooltip.x - 32} y={tooltip.y - 36} width={64} height={28} rx={4} fill="#0E1C28" opacity="0.9" />
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
      <div style={{ display: "flex", gap: "1.1rem", marginTop: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <div style={{ width: 20, height: 2.5, background: "#0E1C28", borderRadius: 2 }} />
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
            {twoPoint ? "Two surveys" : `${sorted.length} surveys, ${minYear} to ${maxYear}`}
          </span>
        </div>
        {hasContext && contextLabel ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg width="20" height="4"><line x1="0" y1="2" x2="20" y2="2" stroke={CONTEXT_COLOR} strokeWidth="1.5" strokeDasharray="4 3" /></svg>
            <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
              {contextLabel}
            </span>
          </div>
        ) : null}
        {sourceLabel ? (
          <span style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 10, color: "#4A5568" }}>
            {sourceLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
