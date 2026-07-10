"use client";

import Link from "next/link";
import { InfoButton } from "@/components/atlas-info-popup";

/**
 * "How this reef is doing" — the reef-health card (final design).
 *
 * Verdict leads; each pillar row carries a plain verdict word and one compact
 * visual with at most a single plain-language subline. No units or jargon on the
 * face — every technical detail lives behind "How we measure this" (the method
 * page). All numbers come from the same v1 readers that build the label
 * (computeReefState lower-of-two, biomass-standing, fishing), so a row's visual
 * and its verdict never disagree. Sources are consolidated into one muted line
 * at the foot of the card.
 */

const GREEN = "#2E7D5B";
const GREY = "#7A8698";
const INK = "#0E1C28";
const INK2 = "#4A5568";
const MUTE = "#6B7280";
const GRID = "#E7E6E2";
const TRACK = "#EFEEE9";

const CAPS: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: INK2,
  margin: 0,
};

export type VerdictWord = { word: string; color: string };

export type CoralRow =
  | {
      kind: "trend";
      points: { year: number; pct: number }[];
      currentPct: number;
      startYear: number;
      verdict: VerdictWord;
      arrow: "up" | "down" | "flat";
    }
  | { kind: "level"; pct: number; verdict: VerdictWord }
  | null;

export type FishRow = {
  grade: "Rich" | "Moderate" | "Sparse";
  color: string;
  /** observed / B0, uncapped, for dot placement (1.0 = at the benchmark). */
  ratio: number;
  subline: string;
} | null;

export type HeatRow = {
  verdict: VerdictWord;
  /** 0..1 position across the Safe / Warming / Bleaching scale. */
  pos: number;
  subline: string;
} | null;

export type FishingRow = {
  verdict: VerdictWord;
  /** 0..1 position across the Quiet -> Busy scale. */
  pos: number;
  subline: string;
} | null;

export type ReefHealthRows = {
  coral: CoralRow;
  fish: FishRow;
  heat: HeatRow;
  fishing: FishingRow;
};

export type ReefHealthPanelProps = {
  reefStateLabel: string;
  reefStateColor: string;
  verdictBasis: React.ReactNode;
  rows: ReefHealthRows;
  /** One consolidated, muted "Sources ·" line for the whole card. */
  sourceLine: string;
  onStateInfo: () => void;
};

function VerdictTag({ v, arrow }: { v: VerdictWord; arrow?: "up" | "down" | "flat" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: v.color }}>{v.word}</span>
      {arrow === "up" || arrow === "down" ? (
        <span aria-hidden="true" style={{ fontSize: "0.85rem", color: v.color }}>{arrow === "up" ? "↑" : "↓"}</span>
      ) : null}
    </div>
  );
}

function Subline({ text }: { text: string }) {
  return <p style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: INK2, margin: "0.5rem 0 0" }}>{text}</p>;
}

/** Row scaffold: name + visual + optional subline on the left, verdict right. */
function Row({
  name,
  grey,
  visual,
  subline,
  verdict,
}: {
  name: string;
  grey?: boolean;
  visual: React.ReactNode;
  subline?: string;
  verdict: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "1rem",
        alignItems: "center",
        padding: "1.1rem 1.25rem",
        borderTop: `1px solid ${GRID}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ ...CAPS, color: grey ? GREY : INK2, marginBottom: "0.55rem" }}>{name}</p>
        {visual}
        {subline ? <Subline text={subline} /> : null}
      </div>
      <div>{verdict}</div>
    </div>
  );
}

function NotSurveyedRow({ name }: { name: string }) {
  return (
    <Row
      name={name}
      grey
      visual={<div style={{ height: 8, borderRadius: 999, background: TRACK, maxWidth: 360 }} />}
      verdict={<span style={{ fontSize: "0.9rem", fontWeight: 600, color: GREY }}>Not surveyed</span>}
    />
  );
}

/* ── Coral cover — real trend line ──────────────────────────────────────── */
function CoralTrend({ row }: { row: Extract<CoralRow, { kind: "trend" }> }) {
  const W = 320;
  const H = 118;
  const padL = 8;
  const padR = 42;
  const padT = 14;
  const padB = 20;
  const pts = row.points;
  const years = pts.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yMax = Math.max(55, ...pts.map((p) => p.pct));
  const yTop = Math.ceil(yMax / 10) * 10;
  const x = (yr: number) =>
    maxYear === minYear ? padL + (W - padL - padR) / 2 : padL + ((yr - minYear) / (maxYear - minYear)) * (W - padL - padR);
  const y = (pct: number) => padT + (1 - pct / yTop) * (H - padT - padB);
  const bandTop = y(50);
  const bandBot = y(30);
  const last = pts[pts.length - 1];
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.year).toFixed(1)},${y(p.pct).toFixed(1)}`)
    .join(" ");
  return (
    <svg
      role="img"
      aria-label={`Live coral cover history, ending at ${row.currentPct}% now`}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", maxWidth: 360, height: "auto", display: "block" }}
    >
      <rect x={padL} y={bandTop} width={W - padL - padR} height={Math.max(0, bandBot - bandTop)} fill="rgba(46,125,91,0.08)" />
      <text x={padL + 3} y={bandTop + 11} style={{ ...CAPS, fontSize: 8 } as React.CSSProperties} fill={GREEN} opacity={0.75}>
        HEALTHY RANGE
      </text>
      <line x1={padL} y1={y(0)} x2={W - padR} y2={y(0)} stroke={GRID} strokeWidth={1} />
      <path d={linePath} fill="none" stroke={row.verdict.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p) => (
        <circle key={p.year} cx={x(p.year)} cy={y(p.pct)} r={2.4} fill={row.verdict.color} />
      ))}
      <text x={x(last.year) + 6} y={y(last.pct) + 4} fontSize={12} fontWeight={700} fill={INK}>{row.currentPct}%</text>
      <text x={padL} y={H - 5} fontSize={9} fill={MUTE}>{row.startYear}</text>
      <text x={x(maxYear)} y={H - 5} fontSize={9} fill={MUTE} textAnchor="middle">now</text>
    </svg>
  );
}

/* ── Coral cover — current-level marker (no real trend) ─────────────────── */
function CoralLevel({ row }: { row: Extract<CoralRow, { kind: "level" }> }) {
  const scaleMax = 60;
  const pos = Math.min(100, (row.pct / scaleMax) * 100);
  const healthyStart = (30 / scaleMax) * 100; // healthy zone shaded from 30%+
  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ position: "relative", height: 12, borderRadius: 999, background: TRACK }}>
        <div style={{ position: "absolute", left: `${healthyStart}%`, right: 0, top: 0, bottom: 0, borderRadius: "0 999px 999px 0", background: "rgba(46,125,91,0.16)" }} />
        <div
          style={{
            position: "absolute",
            left: `calc(${pos}% - 6px)`,
            top: -3,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: row.verdict.color,
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
          }}
        />
        <span style={{ position: "absolute", left: `calc(${pos}% + 11px)`, top: -5, fontSize: 12, fontWeight: 700, color: INK }}>
          {row.pct}%
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 9, color: MUTE, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <span>Low</span>
        <span>Healthy</span>
      </div>
    </div>
  );
}

/* ── A slim marked scale (fish / heat / fishing) ────────────────────────── */
function MarkedScale({
  pos,
  color,
  leftLabel,
  rightLabel,
  zones,
  benchTick,
  benchLabel,
}: {
  pos: number; // 0..1
  color: string;
  leftLabel: string;
  rightLabel: string;
  zones?: { at: number; color: string }[]; // filled left-to-right, `at` = fraction end
  benchTick?: number; // 0..1 position of a benchmark tick
  benchLabel?: string;
}) {
  const p = Math.max(0, Math.min(1, pos)) * 100;
  return (
    <div style={{ maxWidth: 360 }}>
      {benchLabel ? (
        <div style={{ position: "relative", height: 13 }}>
          <span style={{ position: "absolute", left: `${(benchTick ?? 0.5) * 100}%`, transform: "translateX(-50%)", fontSize: 9, color: MUTE, whiteSpace: "nowrap" }}>
            {benchLabel} ▾
          </span>
        </div>
      ) : null}
      <div style={{ position: "relative", height: 12, borderRadius: 999, overflow: "hidden", display: "flex", background: TRACK }}>
        {zones
          ? zones.map((z, i) => {
              const prev = i === 0 ? 0 : zones[i - 1].at;
              return <div key={i} style={{ width: `${(z.at - prev) * 100}%`, background: z.color }} />;
            })
          : null}
        {benchTick != null ? (
          <div style={{ position: "absolute", left: `${benchTick * 100}%`, top: -2, bottom: -2, width: 2, background: INK }} />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: `calc(${p}% - 6px)`,
            top: -3,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: color,
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 9, color: MUTE, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function ReefHealthPanel(props: ReefHealthPanelProps) {
  const { rows } = props;
  return (
    <section id="reef-condition" style={{ marginBottom: "3rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
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
        <Link href="/data#reefstate" style={{ ...CAPS, color: GREEN, textDecoration: "none", fontSize: 11 }}>
          {"ⓘ"} How we measure this
        </Link>
      </div>

      {/* Overall verdict */}
      <div style={{ maxWidth: 680, marginBottom: "1.25rem" }}>
        <p style={{ ...CAPS, display: "flex", alignItems: "center", gap: "0.3rem", marginBottom: "0.35rem" }}>
          Reef state
          <InfoButton onClick={props.onStateInfo} label="How we judge this" />
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.55rem" }}>
          <span style={{ width: 15, height: 15, borderRadius: "50%", background: props.reefStateColor, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: "2rem", fontWeight: 700, color: props.reefStateColor, lineHeight: 1.05 }}>{props.reefStateLabel}</span>
        </div>
        {props.verdictBasis ? (
          <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontSize: "1.0625rem", lineHeight: 1.6, color: INK2, margin: 0 }}>
            {props.verdictBasis}
          </p>
        ) : null}
      </div>

      {/* Four pillar rows */}
      <div style={{ border: `1px solid ${GRID}`, borderRadius: "1rem", background: "#FFFFFF", overflow: "hidden" }}>
        {/* Coral cover */}
        {rows.coral === null ? (
          <NotSurveyedRow name="Coral cover" />
        ) : rows.coral.kind === "trend" ? (
          <Row
            name="Coral cover"
            visual={<CoralTrend row={rows.coral} />}
            verdict={<VerdictTag v={rows.coral.verdict} arrow={rows.coral.arrow} />}
          />
        ) : (
          <Row
            name="Coral cover"
            visual={<CoralLevel row={rows.coral} />}
            verdict={<VerdictTag v={rows.coral.verdict} />}
          />
        )}

        {/* Fish life */}
        {rows.fish === null ? (
          <NotSurveyedRow name="Fish life" />
        ) : (
          <Row
            name="Fish life"
            visual={
              <MarkedScale
                pos={rows.fish.ratio / 2}
                color={rows.fish.color}
                leftLabel="Sparse"
                rightLabel="Rich"
                benchTick={0.5}
                benchLabel="healthy reef of its kind"
              />
            }
            subline={rows.fish.subline}
            verdict={<VerdictTag v={{ word: rows.fish.grade, color: rows.fish.color }} />}
          />
        )}

        {/* Heat */}
        {rows.heat === null ? (
          <NotSurveyedRow name="Heat" />
        ) : (
          <Row
            name="Heat"
            visual={
              <MarkedScale
                pos={rows.heat.pos}
                color={rows.heat.verdict.color}
                leftLabel="Safe"
                rightLabel="Bleaching"
                zones={[
                  { at: 1 / 3, color: "rgba(46,125,91,0.16)" },
                  { at: 2 / 3, color: "rgba(185,138,46,0.16)" },
                  { at: 1, color: "rgba(192,65,43,0.16)" },
                ]}
              />
            }
            subline={rows.heat.subline}
            verdict={<VerdictTag v={rows.heat.verdict} />}
          />
        )}

        {/* Fishing */}
        {rows.fishing === null ? (
          <NotSurveyedRow name="Fishing" />
        ) : (
          <Row
            name="Fishing"
            visual={
              <MarkedScale
                pos={rows.fishing.pos}
                color={rows.fishing.verdict.color}
                leftLabel="Quiet"
                rightLabel="Busy"
                zones={[
                  { at: 0.5, color: "rgba(46,125,91,0.14)" },
                  { at: 1, color: "rgba(185,138,46,0.14)" },
                ]}
              />
            }
            subline={rows.fishing.subline}
            verdict={<VerdictTag v={rows.fishing.verdict} />}
          />
        )}

        {/* One consolidated source line */}
        <div style={{ borderTop: `1px solid ${GRID}`, padding: "0.85rem 1.25rem", background: "#FAFAF8" }}>
          <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: 11, color: MUTE, margin: 0, lineHeight: 1.5 }}>
            {props.sourceLine}
          </p>
        </div>
      </div>
    </section>
  );
}
