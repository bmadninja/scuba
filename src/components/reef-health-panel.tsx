"use client";

import Link from "next/link";
import { InfoButton } from "@/components/atlas-info-popup";

/**
 * "How this reef is doing" — the redesigned reef-health section.
 *
 * Verdict leads; the chart carries the numbers. One overall reef-state verdict
 * (from computeReefState, lower-of-two) + a per-site confidence badge, then four
 * pillar rows. Each row is a self-labelled chart/bar on the left and a plain
 * verdict word (coloured dot) on the right. The only prose per row is a
 * "Source ·" line — every value lives on the chart.
 *
 * This is a presentation layer over the existing readers: all numbers are
 * computed server-side in page.tsx (computeReefState, biomass-standing,
 * reef-confidence, fishing) and passed in as serialisable props, so the chart
 * always shows exactly what drives the verdict.
 */

const GREEN = "#2E7D5B";
const AMBER = "#B98A2E";
const INK = "#0E1C28";
const INK2 = "#4A5568";
const MUTE = "#6B7280";
const GRID = "#E7E6E2";
const PAPER = "#FFFFFF";

const CAPS: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: INK2,
  margin: 0,
};

const SRC: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
  fontSize: 11,
  color: MUTE,
  margin: "0.55rem 0 0",
  letterSpacing: "0.02em",
};

export type VerdictWord = {
  word: string;
  color: string;
};

export type ReefCoralRow = {
  points: { year: number; pct: number }[];
  verdict: VerdictWord;
  arrow: "up" | "down" | "flat";
  sourceLabel: string;
  healthyMin: number;
  healthyMax: number;
} | null;

export type ReefFishRow = {
  observedKgHa: number;
  b0KgHa: number;
  grade: "Rich" | "Moderate" | "Sparse";
  gradeColor: string;
  sourceLabel: string;
} | null;

export type ReefBleachRow = {
  dhw: number | null;
  verdict: VerdictWord;
  nowC: number | null;
  usualC: number | null;
  sourceLabel: string;
} | null;

export type ReefFishingRow = {
  verdict: VerdictWord;
  series: { year: number; hours: number }[];
  busyDespiteProtection: boolean;
  trafficWord: string;
  sourceLabel: string;
};

/** The four pillar rows, computed server-side and passed as one bundle. */
export type ReefHealthRows = {
  coral: ReefCoralRow;
  fish: ReefFishRow;
  bleaching: ReefBleachRow;
  fishing: ReefFishingRow;
};

export type ReefHealthPanelProps = {
  reefStateLabel: string;
  reefStateColor: string;
  verdictBasis: React.ReactNode;
  confidence: {
    badge: "A" | "B" | "C" | "D";
    badgeLabel: string;
    onFile: number;
    missing: string[];
  } | null;
  reefStateSources: { label: string; url: string | null }[];
  coral: ReefCoralRow;
  fish: ReefFishRow;
  bleaching: ReefBleachRow;
  fishing: ReefFishingRow;
  onStateInfo: () => void;
  onHeatInfo: () => void;
};

function Verdict({ v, arrow }: { v: VerdictWord; arrow?: "up" | "down" | "flat" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: v.color }}>{v.word}</span>
      {arrow && arrow !== "flat" ? (
        <span aria-hidden="true" style={{ fontSize: "0.85rem", color: v.color }}>
          {arrow === "up" ? "↑" : "↓"}
        </span>
      ) : null}
    </div>
  );
}

function NotSurveyed() {
  return (
    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#7A8698" }}>Not surveyed</span>
  );
}

function Row({
  title,
  chart,
  source,
  verdict,
  info,
}: {
  title: string;
  chart: React.ReactNode;
  source?: string;
  verdict: React.ReactNode;
  info?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "start",
        padding: "1.15rem 1.25rem",
        borderTop: `1px solid ${GRID}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ ...CAPS, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.6rem" }}>
          {title}
          {info}
        </p>
        {chart}
        {source ? <p style={SRC}>Source · {source}</p> : null}
      </div>
      <div style={{ paddingTop: "0.05rem" }}>{verdict}</div>
    </div>
  );
}

/* ── Coral cover line over time ─────────────────────────────────────────── */
function CoralChart({ row }: { row: NonNullable<ReefCoralRow> }) {
  const W = 320;
  const H = 128;
  const padL = 8;
  const padR = 40;
  const padT = 14;
  const padB = 20;
  const pts = row.points;
  const years = pts.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const maxPct = Math.max(55, ...pts.map((p) => p.pct)) ;
  const yMax = Math.ceil(maxPct / 10) * 10;
  const x = (yr: number) =>
    maxYear === minYear ? padL + (W - padL - padR) / 2 : padL + ((yr - minYear) / (maxYear - minYear)) * (W - padL - padR);
  const y = (pct: number) => padT + (1 - pct / yMax) * (H - padT - padB);
  const last = pts[pts.length - 1];
  const bandTop = y(row.healthyMax);
  const bandBot = y(row.healthyMin);
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)},${y(p.pct).toFixed(1)}`).join(" ");
  return (
    <svg
      role="img"
      aria-label={`Live coral cover history: ${pts.map((p) => `${p.pct}% in ${p.year}`).join(", ")}`}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", maxWidth: 360, height: "auto", display: "block" }}
    >
      {/* healthy range band */}
      <rect x={padL} y={bandTop} width={W - padL - padR} height={Math.max(0, bandBot - bandTop)} fill="rgba(46,125,91,0.08)" />
      <text x={padL + 3} y={bandTop + 11} style={{ ...CAPS, fontSize: 8 } as React.CSSProperties} fill={GREEN} opacity={0.75}>
        HEALTHY RANGE
      </text>
      {/* baseline */}
      <line x1={padL} y1={y(0)} x2={W - padR} y2={y(0)} stroke={GRID} strokeWidth={1} />
      {/* line + dots */}
      <path d={linePath} fill="none" stroke={row.verdict.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) => (
        <circle key={p.year} cx={x(p.year)} cy={y(p.pct)} r={2.6} fill={row.verdict.color} />
      ))}
      {/* endpoint value */}
      <text x={x(last.year) + 5} y={y(last.pct) + 4} fontSize={12} fontWeight={700} fill={INK}>
        {last.pct}%
      </text>
      {/* x labels */}
      <text x={padL} y={H - 5} fontSize={9} fill={MUTE}>{minYear}</text>
      <text x={x(maxYear)} y={H - 5} fontSize={9} fill={MUTE} textAnchor="middle">now</text>
      {/* y unit */}
      <text x={padL} y={11} style={{ ...CAPS, fontSize: 8 } as React.CSSProperties} fill={MUTE}>live coral cover, %</text>
    </svg>
  );
}

/* ── Fish biomass horizontal bar vs B0 benchmark ───────────────────────── */
function FishBar({ row }: { row: NonNullable<ReefFishRow> }) {
  const scaleMax = Math.max(row.b0KgHa * 1.25, row.observedKgHa * 1.1);
  const fillPct = Math.min(100, (row.observedKgHa / scaleMax) * 100);
  const b0Pct = Math.min(100, (row.b0KgHa / scaleMax) * 100);
  return (
    <div style={{ maxWidth: 360 }}>
      <p style={{ ...CAPS, fontSize: 8, marginBottom: "0.4rem" }}>fish biomass, kg/ha</p>
      {/* B0 marker */}
      <div style={{ position: "relative", height: 14 }}>
        <div style={{ position: "absolute", left: `${b0Pct}%`, transform: "translateX(-50%)", fontSize: 9, color: MUTE, whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 700, color: INK }}>{Math.round(row.b0KgHa)}</span> healthy reef of its kind {"▲"}
        </div>
      </div>
      <div style={{ position: "relative", height: 20, background: "#F2F1ED", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${fillPct}%`, background: row.gradeColor, borderRadius: 4 }} />
        {/* B0 tick */}
        <div style={{ position: "absolute", left: `${b0Pct}%`, top: -2, bottom: -2, width: 2, background: INK }} />
        <span style={{ position: "absolute", left: 6, top: 2, fontSize: 11, fontWeight: 700, color: "#FFFFFF" }}>
          {Math.round(row.observedKgHa)}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 9, color: MUTE }}>
        <span>0</span>
        <span>{Math.round(scaleMax)}</span>
      </div>
    </div>
  );
}

/* ── Bleaching risk: accumulated heat stress bar (0–12 DHW) ─────────────── */
function BleachBar({ row }: { row: NonNullable<ReefBleachRow> }) {
  const MAXV = 12;
  const dhw = row.dhw;
  const fillPct = dhw === null ? 0 : Math.min(100, (dhw / MAXV) * 100);
  const threshPct = (4 / MAXV) * 100;
  return (
    <div style={{ maxWidth: 360 }}>
      <p style={{ ...CAPS, fontSize: 8, marginBottom: "0.4rem" }}>accumulated heat stress, °C-weeks</p>
      <div style={{ position: "relative", height: 20, borderRadius: 4, overflow: "hidden", display: "flex" }}>
        {/* zones */}
        <div style={{ width: `${threshPct}%`, background: "rgba(46,125,91,0.16)" }} />
        <div style={{ width: `${threshPct}%`, background: "rgba(185,138,46,0.16)" }} />
        <div style={{ flex: 1, background: "rgba(192,65,43,0.16)" }} />
        {/* fill */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${fillPct}%`, background: row.verdict.color, opacity: 0.9 }} />
        {/* threshold marker */}
        <div style={{ position: "absolute", left: `${threshPct}%`, top: -2, bottom: -2, width: 2, background: INK }} />
        {dhw !== null ? (
          <span style={{ position: "absolute", left: 6, top: 2, fontSize: 11, fontWeight: 700, color: dhw >= 1 ? "#FFFFFF" : INK }}>
            {dhw}
          </span>
        ) : null}
      </div>
      <div style={{ position: "relative", height: 14, marginTop: 2, fontSize: 9, color: MUTE }}>
        <span style={{ position: "absolute", left: 0 }}>0</span>
        <span style={{ position: "absolute", left: `${threshPct}%`, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
          <span style={{ fontWeight: 700, color: INK }}>4</span> bleaching begins
        </span>
        <span style={{ position: "absolute", right: 0 }}>{MAXV}</span>
      </div>
      {row.nowC !== null && row.usualC !== null ? (
        <p style={{ fontSize: 10, color: MUTE, margin: "0.5rem 0 0" }}>
          now {row.nowC}°C · usual {row.usualC}°C
        </p>
      ) : null}
    </div>
  );
}

/* ── Fishing: boat activity area line ──────────────────────────────────── */
function FishingChart({ row }: { row: ReefFishingRow }) {
  const s = row.series;
  if (s.length >= 2) {
    const W = 320;
    const H = 96;
    const padL = 8;
    const padR = 40;
    const padT = 14;
    const padB = 18;
    const years = s.map((p) => p.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const maxH = Math.max(1, ...s.map((p) => p.hours));
    const x = (yr: number) => padL + ((yr - minYear) / (maxYear - minYear || 1)) * (W - padL - padR);
    const y = (h: number) => padT + (1 - h / maxH) * (H - padT - padB);
    const line = s.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)},${y(p.hours).toFixed(1)}`).join(" ");
    const area = `${line} L${x(maxYear).toFixed(1)},${y(0).toFixed(1)} L${x(minYear).toFixed(1)},${y(0).toFixed(1)} Z`;
    const last = s[s.length - 1];
    const col = row.busyDespiteProtection ? AMBER : "#5A7A9E";
    return (
      <svg
        role="img"
        aria-label={`Boat activity nearby: ${s.map((p) => `${Math.round(p.hours)} vessel hours in ${p.year}`).join(", ")}`}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", maxWidth: 360, height: "auto", display: "block" }}
      >
        <path d={area} fill={col} opacity={0.14} />
        <path d={line} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {s.map((p) => (
          <circle key={p.year} cx={x(p.year)} cy={y(p.hours)} r={2.4} fill={col} />
        ))}
        <text x={x(last.year) + 5} y={y(last.hours) + 4} fontSize={11} fontWeight={700} fill={INK}>
          {Math.round(last.hours)}
        </text>
        <text x={padL} y={H - 4} fontSize={9} fill={MUTE}>{minYear}</text>
        <text x={x(maxYear)} y={H - 4} fontSize={9} fill={MUTE} textAnchor="middle">{maxYear}</text>
        <text x={padL} y={11} style={{ ...CAPS, fontSize: 8 } as React.CSSProperties} fill={MUTE}>boat activity nearby, vessel hours</text>
      </svg>
    );
  }
  // Too few points for a line — a plain current-level read.
  return (
    <div style={{ maxWidth: 360 }}>
      <p style={{ ...CAPS, fontSize: 8, marginBottom: "0.4rem" }}>boat activity nearby</p>
      <span style={{ fontSize: "0.95rem", fontWeight: 600, color: row.busyDespiteProtection ? AMBER : INK }}>
        {row.trafficWord}
      </span>
    </div>
  );
}

export function ReefHealthPanel(props: ReefHealthPanelProps) {
  const { coral, fish, bleaching, fishing, confidence } = props;
  return (
    <section id="reef-condition" style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <h2
          style={{
            fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
            fontSize: "2rem",
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.2,
            color: INK,
            margin: 0,
          }}
        >
          How this reef is doing
        </h2>
        <Link
          href="/data#reefstate"
          style={{ ...CAPS, color: GREEN, textDecoration: "none", fontSize: 11 }}
        >
          {"ⓘ"} How we measure this
        </Link>
      </div>

      {/* Verdict headline + confidence badge */}
      <div style={{ maxWidth: 680, marginBottom: "1.25rem" }}>
        <p style={{ ...CAPS, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.4rem" }}>
          Reef state
          <InfoButton onClick={props.onStateInfo} label="How we judge this" />
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.5rem" }}>
          <span style={{ width: 13, height: 13, borderRadius: "50%", background: props.reefStateColor, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "1.75rem", fontWeight: 700, color: props.reefStateColor, lineHeight: 1.1 }}>
            {props.reefStateLabel}
          </span>
        </div>
        {confidence ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.25rem 0.6rem",
              borderRadius: 999,
              border: `1px solid #D8DCE2`,
              background: "#F6F7F9",
              fontSize: "0.6875rem",
              color: INK2,
              margin: "0 0 0.55rem",
            }}
            title="How sure we are: a real direction over time, a before and after, a single reading, or nothing yet. The badge is the weakest of the signals that set this label."
          >
            <span
              aria-hidden="true"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  confidence.badge === "A" ? GREEN : confidence.badge === "B" ? AMBER : confidence.badge === "C" ? "#C77D2E" : "#7A8698",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 600 }}>{confidence.badgeLabel}</span>
            <span aria-hidden="true" style={{ color: "#B4BAC2" }}>·</span>
            <span>
              {confidence.onFile} of 4 signals on file
              {confidence.missing.length > 0 ? `, ${confidence.missing.join(" and ")} missing` : ""}
            </span>
          </div>
        ) : null}
        {props.verdictBasis ? (
          <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontSize: "1.0625rem", lineHeight: 1.6, color: INK2, margin: 0 }}>
            {props.verdictBasis}
          </p>
        ) : null}
        {props.reefStateSources.length > 0 ? (
          <p style={{ ...SRC, marginTop: "0.55rem" }}>
            <span style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: MUTE }}>Evidence</span>{"  "}
            {props.reefStateSources.map((s, i) => (
              <span key={s.label}>
                {i > 0 ? ", " : " "}
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: GREEN, textDecoration: "underline" }}>{s.label}</a>
                ) : (
                  <span>{s.label}</span>
                )}
              </span>
            ))}
          </p>
        ) : null}
      </div>

      {/* Four pillar rows */}
      <div style={{ border: `1px solid ${GRID}`, borderRadius: "1rem", background: PAPER, overflow: "hidden" }}>
        <Row
          title="Coral health"
          chart={coral ? <CoralChart row={coral} /> : <NotSurveyed />}
          source={coral ? coral.sourceLabel : undefined}
          verdict={coral ? <Verdict v={coral.verdict} arrow={coral.arrow} /> : <NotSurveyed />}
        />
        <Row
          title="Fish biodiversity"
          chart={fish ? <FishBar row={fish} /> : <NotSurveyed />}
          source={fish ? fish.sourceLabel : undefined}
          verdict={fish ? <Verdict v={{ word: fish.grade, color: fish.gradeColor }} /> : <NotSurveyed />}
        />
        <Row
          title="Bleaching risk"
          info={
            bleaching ? (
              <InfoButton onClick={props.onHeatInfo} label="Heat right now" />
            ) : undefined
          }
          chart={bleaching ? <BleachBar row={bleaching} /> : <NotSurveyed />}
          source={bleaching ? bleaching.sourceLabel : undefined}
          verdict={bleaching ? <Verdict v={bleaching.verdict} /> : <NotSurveyed />}
        />
        <Row
          title="Fishing"
          chart={<FishingChart row={fishing} />}
          source={fishing.sourceLabel}
          verdict={<Verdict v={fishing.verdict} />}
        />
      </div>
    </section>
  );
}
