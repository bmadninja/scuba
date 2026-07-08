"use client";

// ─── SpeciesAccumulationChart ────────────────────────────────────────────────
// A compact area chart of the cumulative research-grade observations logged near
// a location, by year. It turns the static "N species logged" stat into a real,
// dated, growing record. Every point is a running total of actual iNaturalist
// observations — nothing modelled or projected.

export type CumulativePoint = { year: number; cumulative: number };

type Props = {
  points: CumulativePoint[];
  radiusKm: number;
};

const W = 320;
const H = 72;
const PAD_X = 2;
const PAD_TOP = 6;
const PAD_BOT = 14;

export function SpeciesAccumulationChart({ points, radiusKm }: Props) {
  if (points.length < 2) return null;

  const first = points[0];
  const last = points[points.length - 1];
  const minYear = first.year;
  const maxYear = last.year;
  const yearSpan = Math.max(1, maxYear - minYear);
  const maxVal = Math.max(...points.map((p) => p.cumulative), 1);

  const xFor = (year: number) => PAD_X + ((year - minYear) / yearSpan) * (W - PAD_X * 2);
  const yFor = (val: number) => PAD_TOP + (1 - val / maxVal) * (H - PAD_TOP - PAD_BOT);

  const line = points.map((p) => `${xFor(p.year)},${yFor(p.cumulative)}`).join(" ");
  const area = `${xFor(minYear)},${H - PAD_BOT} ${line} ${xFor(maxYear)},${H - PAD_BOT}`;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={`Cumulative research-grade observations logged within ${radiusKm} km, ${minYear} to ${maxYear}`}
        style={{ display: "block", overflow: "visible" }}
      >
        <polygon points={area} fill="#2E7D5B" fillOpacity="0.12" />
        <polyline
          points={line}
          fill="none"
          stroke="#2E7D5B"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={xFor(last.year)} cy={yFor(last.cumulative)} r="3" fill="#2E7D5B" />
        <text x={xFor(minYear)} y={H - 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="start">{minYear}</text>
        <text x={xFor(maxYear)} y={H - 3} fontSize="9" fill="#4A5568" fontFamily="IBM Plex Mono" textAnchor="end">{maxYear}</text>
      </svg>
    </div>
  );
}
