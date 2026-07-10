"use client";

// ═══════════════════════════════════════════════════════════════════════════
// Reef-State "evidence breakdown" card
// ═══════════════════════════════════════════════════════════════════════════
//
// Sits directly beneath a reef's overall rating on a location page and answers:
// "how did we arrive at that rating, and how trustworthy is it?"
//
// It lists the four signals behind every rating — Living coral, Water heat, Fish
// life, Fishing pressure — each as a plain-language takeaway. Every signal row
// expands to reveal a fixed-domain reference chart with a shaded healthy zone. A
// single "How we measure this" link opens a modal explaining each signal.
//
// Purely presentational: it receives a `ReefBreakdown` view-model whose per-signal
// `band` is already computed server-side (and already inverted for heat/fishing,
// where "low is good"). The card never derives good/bad from raw numbers.

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import {
  CHART,
  PILLARS,
  TOKENS as T,
  TREND_ARROW,
  takeaway,
  toneColor,
  type Band,
  type PillarConfig,
  type ReefBreakdown,
  type SignalDatum,
  type Trend,
} from "./reef-breakdown-config";

// ── Shared atoms ───────────────────────────────────────────────────────────

function StatusDot({ tone, size = 9 }: { tone: Band; size?: number }) {
  const dead = tone === "none";
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: dead ? "transparent" : toneColor(tone),
        border: dead ? `1.5px dashed ${T.hairlineStrong}` : "none",
      }}
    />
  );
}

function SourceTag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.mute, letterSpacing: ".02em" }}>
      {children}
    </span>
  );
}

function TrendTag({ word }: { word: Trend }) {
  if (!word) return null;
  return (
    <span style={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink2 }}>
      {TREND_ARROW[word]} {word}
    </span>
  );
}

// ── Reference chart ─────────────────────────────────────────────────────────
// Fixed domain per signal with a shaded "healthy" zone, so the value is judged
// against a scientific baseline, not just its own history. Because heat & fishing
// are "low is good", their band renders at the bottom; coral & fish at the top.
// The line crossing into/out of the green band is the story. Both start and end
// values are labelled — a lone latest value is meaningless. Units stay honest so
// the chart reads scientific even though the takeaway stays plain.

function ReferenceChart({
  series,
  tone,
  pillar,
  xAxis,
  w = 208,
  h = 96,
}: {
  series: number[] | null;
  tone: Band;
  pillar: PillarConfig;
  /** Overrides the pillar's static start/end labels when real years are known. */
  xAxis?: [string, string];
  w?: number;
  h?: number;
}) {
  const cfg = CHART[pillar.key];
  const [xStart, xEnd] = xAxis ?? pillar.xAxis;

  // Degenerate cases: a single reading has nothing to trend; a null series has
  // no readings at all.
  if (!series || series.length < 2) {
    return (
      <div
        style={{
          width: w,
          height: h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.mono,
          fontSize: 10,
          color: T.mute,
          border: `1px dashed ${T.hairline}`,
          borderRadius: 4,
          background: T.surface,
        }}
      >
        {series && series.length === 1 ? "one survey only" : "no readings on file"}
      </div>
    );
  }

  const c = toneColor(tone);
  const ok = T.ok;
  const [dLo, dHi] = cfg.domain;
  const dRng = dHi - dLo || 1;
  const padL = 30;
  const padR = 10;
  const padT = 8;
  const padB = 16;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const xf = (i: number) => padL + (i / (series.length - 1)) * plotW;
  const yf = (v: number) =>
    padT + (1 - (Math.max(dLo, Math.min(dHi, v)) - dLo) / dRng) * plotH;

  const pts = series.map((v, i) => [xf(i), yf(v)] as const);
  const line = pts
    .map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1))
    .join(" ");
  const area =
    line +
    ` L${xf(series.length - 1).toFixed(1)} ${(padT + plotH).toFixed(1)}` +
    ` L${xf(0).toFixed(1)} ${(padT + plotH).toFixed(1)} Z`;

  const first = series[0];
  const latest = series[series.length - 1];
  const [hLo, hHi] = cfg.healthy;
  const bandTop = yf(hHi);
  const bandBot = yf(hLo);
  const thresh = cfg.dir === "high" ? hLo : hHi; // the edge of the healthy zone

  return (
    <div style={{ width: w }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        style={{ display: "block", overflow: "visible" }}
        aria-hidden="true"
      >
        {/* healthy reference zone */}
        <rect
          x={padL}
          y={bandTop}
          width={plotW}
          height={Math.max(0, bandBot - bandTop)}
          fill={ok}
          opacity="0.10"
        />
        <line
          x1={padL}
          y1={yf(thresh)}
          x2={w - padR}
          y2={yf(thresh)}
          stroke={ok}
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.7"
        />
        <text
          x={w - padR}
          y={cfg.dir === "high" ? bandTop + 9 : bandBot - 4}
          textAnchor="end"
          fontFamily={T.mono}
          fontSize="7.5"
          letterSpacing="0.05em"
          fill={`color-mix(in oklch, ${ok} 55%, ${T.mute})`}
        >
          HEALTHY
        </text>
        {/* y ticks + labels */}
        {cfg.ticks.map((v, k) => (
          <g key={k}>
            <line
              x1={padL}
              y1={yf(v)}
              x2={w - padR}
              y2={yf(v)}
              stroke={T.hairline}
              strokeWidth="1"
              opacity="0.6"
            />
            <text
              x={padL - 6}
              y={yf(v) + 3}
              textAnchor="end"
              fontFamily={T.mono}
              fontSize="8"
              fill={T.mute}
            >
              {v}
              {cfg.unit}
            </text>
          </g>
        ))}
        {/* axis spine */}
        <line
          x1={padL}
          y1={padT}
          x2={padL}
          y2={padT + plotH}
          stroke={T.hairlineStrong}
          strokeWidth="1"
        />
        {/* data */}
        <path d={area} fill={c} opacity="0.09" />
        <path
          d={line}
          fill="none"
          stroke={c}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={i === pts.length - 1 ? 3 : 1.7}
            fill={i === pts.length - 1 ? c : T.paper}
            stroke={c}
            strokeWidth="1.1"
          />
        ))}
      </svg>
      {/* start → end read-out */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 4,
          fontFamily: T.mono,
          fontSize: 9,
          color: T.mute,
        }}
      >
        <span>
          {xStart} · <span style={{ color: T.ink2 }}>{first}{cfg.unit}</span>
        </span>
        <span style={{ color: T.mute }}>{cfg.axisNote}</span>
        <span>
          {xEnd} ·{" "}
          <span style={{ color: `color-mix(in oklch, ${c} 68%, ${T.ink})`, fontWeight: 500 }}>
            {latest}
            {cfg.unit}
          </span>
        </span>
      </div>
    </div>
  );
}

// ── Method info modal ───────────────────────────────────────────────────────

function MethodModal({
  open,
  onClose,
  methodHref,
}: {
  open: boolean;
  onClose: () => void;
  methodHref: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "oklch(0.2 0.05 235 / 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Where the rating comes from"
        style={{
          width: "min(480px, 100%)",
          background: T.paper,
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 30px 70px -20px oklch(0.2 0.05 235 / 0.5)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "22px 24px 16px",
            borderBottom: `1px solid ${T.hairline}`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: T.mono,
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: ".14em",
                color: T.mute,
                marginBottom: 8,
              }}
            >
              How this works
            </div>
            <div
              style={{
                fontFamily: T.serif,
                fontSize: 23,
                fontStyle: "italic",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                color: T.ink,
                lineHeight: 1.15,
              }}
            >
              Where the rating comes from
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: `1px solid ${T.hairline}`,
              borderRadius: 4,
              width: 30,
              height: 30,
              cursor: "pointer",
              color: T.ink2,
              fontSize: 16,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "18px 24px 8px" }}>
          <p
            style={{
              fontFamily: T.serif,
              fontSize: 15.5,
              lineHeight: 1.55,
              color: T.ink2,
              margin: "0 0 18px",
            }}
          >
            Every reef gets one rating —{" "}
            <b style={{ color: T.ink }}>Thriving, Improving, Stable or Declining</b> — from
            four signals we watch:
          </p>
          {PILLARS.map((pl, i) => (
            <div
              key={pl.key}
              style={{
                display: "flex",
                gap: 13,
                padding: "13px 0",
                borderTop: i ? `1px solid ${T.hairline}` : "none",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: T.ink,
                  marginTop: 6,
                }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: T.ink }}>{pl.name}</span>
                  <SourceTag>{pl.source}</SourceTag>
                </div>
                <div style={{ fontSize: 13.5, color: T.ink2, lineHeight: 1.5, marginTop: 3 }}>
                  {pl.measure}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "16px 24px 22px" }}>
          <Link
            href={methodHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: T.brandYellow,
              color: T.brandYellowInk,
              padding: "12px 20px",
              borderRadius: 3,
              fontFamily: T.mono,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Read the full method →
          </Link>
        </div>
      </div>
    </div>
  );
}

// Small "how we measure this" trigger for the card header.
function MeasureLink({ onInfo }: { onInfo: () => void }) {
  return (
    <button
      type="button"
      onClick={onInfo}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        background: "none",
        border: "none",
        padding: 0,
        fontFamily: T.mono,
        fontSize: 11.5,
        color: T.ink2,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `1px solid ${T.hairlineStrong}`,
          fontFamily: T.serif,
          fontStyle: "italic",
          fontSize: 11,
          color: T.ink2,
        }}
      >
        i
      </span>
      How we measure this
    </button>
  );
}

// One-line honest override note, shown only when the rating was editorially set.
function OverrideNote({ note }: { note: string | null }) {
  if (!note) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 18px",
        borderTop: `1px solid ${T.hairline}`,
        background: T.surface,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: T.ink,
          marginTop: 5,
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.5, color: T.ink2 }}>
        {note}
      </span>
    </div>
  );
}

// ── Signal row — compact by default, chart on demand ────────────────────────

function VerdictLine({ band }: { band: Band }) {
  const text =
    band === "good"
      ? "Sitting inside the healthy range."
      : band === "mid"
        ? "Below the healthy range — worth watching."
        : "Well below the healthy range.";
  return (
    <div style={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.5, color: T.ink2 }}>{text}</div>
  );
}

function SignalRow({
  pl,
  datum,
  first,
}: {
  pl: PillarConfig;
  datum: SignalDatum;
  first: boolean;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const dead = datum.band === "none";

  return (
    <div style={{ borderTop: first ? "none" : `1px solid ${T.hairline}`, opacity: dead ? 0.72 : 1 }}>
      <button
        type="button"
        onClick={() => !dead && setOpen((o) => !o)}
        aria-expanded={dead ? undefined : open}
        aria-controls={dead ? undefined : panelId}
        disabled={dead}
        style={{
          width: "100%",
          textAlign: "left",
          background: open ? T.surface : "transparent",
          border: "none",
          cursor: dead ? "default" : "pointer",
          padding: "14px 18px",
          display: "flex",
          gap: 13,
          alignItems: "center",
          transition: "background 120ms",
        }}
      >
        <StatusDot tone={datum.band} size={10} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: dead ? T.ink2 : T.ink }}>
            {takeaway(pl.key, datum.band)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 3,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: T.mono,
                fontSize: 11,
                color: T.mute,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              {pl.name}
            </span>
            {datum.detail && <span style={{ fontSize: 13, color: T.ink2 }}>· {datum.detail}</span>}
          </div>
        </div>
        {dead ? (
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 11,
              color: T.mute,
              padding: "6px 10px",
              borderRadius: 2,
              border: `1px dashed ${T.hairlineStrong}`,
              background: T.surface,
            }}
          >
            not surveyed
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
            <TrendTag word={datum.trend} />
            <span
              aria-hidden="true"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: `1px solid ${T.hairline}`,
                color: T.ink2,
                transform: open ? "rotate(180deg)" : "none",
                transition: "transform 180ms, background 120ms",
                background: open ? T.paper : "transparent",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 4.5L6 8L9.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </span>
        )}
      </button>
      {open && !dead && (
        <div id={panelId} style={{ padding: "4px 18px 18px 41px", background: T.surface }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <ReferenceChart series={datum.series} tone={datum.band} pillar={pl} xAxis={datum.xAxis} />
            <div style={{ flex: 1, minWidth: 150 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 8,
                    borderRadius: 2,
                    background: `color-mix(in oklch, ${T.ok} 22%, ${T.paper})`,
                    border: `1px solid color-mix(in oklch, ${T.ok} 45%, ${T.hairline})`,
                  }}
                />
                <span
                  style={{ fontFamily: T.mono, fontSize: 10, color: T.mute, letterSpacing: ".04em" }}
                >
                  healthy range
                </span>
              </div>
              <VerdictLine band={datum.band} />
              <div style={{ marginTop: 8 }}>
                <SourceTag>Source · {pl.source}</SourceTag>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── The card ────────────────────────────────────────────────────────────────

export function ReefBreakdownCard({
  data,
  title = "How this reef is doing",
  methodHref = "/data",
}: {
  /** Per-reef view-model; `band` per signal is precomputed server-side. */
  data: ReefBreakdown;
  /** Card title. */
  title?: string;
  /** Route the modal's "Read the full method" CTA points at. */
  methodHref?: string;
}) {
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div
      style={{
        border: `1px solid ${T.hairlineStrong}`,
        borderRadius: 10,
        background: T.paper,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "15px 18px",
          borderBottom: `1px solid ${T.hairline}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontFamily: T.serif, fontSize: 18, color: T.ink, letterSpacing: "-0.01em" }}>
          {title}
        </div>
        <MeasureLink onInfo={() => setInfoOpen(true)} />
      </div>
      <div>
        {PILLARS.map((pl, i) => (
          <SignalRow key={pl.key} pl={pl} datum={data.signals[pl.key]} first={i === 0} />
        ))}
      </div>
      <OverrideNote note={data.overrideNote} />
      <MethodModal open={infoOpen} onClose={() => setInfoOpen(false)} methodHref={methodHref} />
    </div>
  );
}
