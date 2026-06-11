"use client";

import { useState } from "react";
import Link from "next/link";
import { AffiliateLink } from "@/components/affiliate-link";
import { resizePhotoUrl } from "@/lib/photo-quality";
import { EditorialHook } from "@/components/editorial-hook";
import { AtlasInfoPopup, InfoButton } from "@/components/atlas-info-popup";
import type { InfoKey } from "@/components/atlas-info-popup";

// ─── Serializable view-model passed from the server page ──────────────────────

export type SpeciesCard = {
  key: string;
  commonName: string;
  href: string | null;
  imageUrl: string | null;
  icon: string;
  seenText: string;
  dotColor: string;
  iucnLabel: string | null;
  iucnBadge: { bg: string; color: string } | null;
};

export type SiteRow = {
  id: string;
  slug: string;
  name: string;
  speciesLine: string | null;
  gradient: string;
  imageUrl: string | null;
};

export type GearItem = {
  icon: string;
  name: string;
  extra: string | null;
  shopUrl: string | null;
};

export type GearGroup = { label: string; items: GearItem[] };

export type DeclineChart = {
  fromPct: number;
  fromYear: number;
  toPct: number;
  toYear: number;
  zeroYear: number | null;
};

// Two-point coral-cover chart for reefs that are holding steady or recovering,
// so every reef with a before/after shows a chart, not just declining ones.
export type CoverTrend = {
  fromPct: number;
  fromYear: number;
  toPct: number;
  toYear: number;
  direction: "up" | "flat";
};

export type ConditionPill = {
  label: string;
  tone: "warm" | "good" | "neutral";
  sub: string;
  /** Optional plain-language line with concrete numbers, e.g. "around 27°C now, about 2°C above the usual 25°C". */
  detail?: string | null;
};

export type TripFact = { icon: string; label: string; value: string };

export type StayItem = {
  partner: string;
  label: string;
  url: string;
  productId?: string;
  isAffiliate: boolean;
  isLiveaboard: boolean;
};

export type StayTier = {
  /** Plain heading: "Budget", "Mid range", "Luxury", "Liveaboards". */
  label: string;
  items: StayItem[];
};

export type OperatorItem = {
  partner: string;
  label: string;
  url: string;
  productId?: string;
  isAffiliate: boolean;
  detail: string | null;
};

export type GetThereView =
  | {
      kind: "structured";
      nearestHubName: string;
      nearestHubDescription: string;
      transferToSitesName: string;
      transferToSitesDescription: string;
      liveaboardDescription: string | null;
    }
  | { kind: "prose"; text: string }
  | null;

export type LocationBodyProps = {
  locationId: string;
  intro: string | null;
  // Reef condition
  conditionSentence: string;
  decline: DeclineChart | null;
  coverTrend: CoverTrend | null;
  coverNow: number | null;
  coverYear: number | null;
  coverTrendNote: string | null;
  heat: ConditionPill | null;
  fishing: ConditionPill | null;
  reefStateLabel: string;
  reefStateColor: string;
  reefStateSub: string;
  hasReefData: boolean;
  // Species
  species: SpeciesCard[];
  // Sites
  sites: SiteRow[];
  // Gear
  gearGroups: GearGroup[];
  // Plan a trip
  tripFacts: TripFact[];
  monthCells: { letter: string; on: boolean; now: boolean }[];
  getThere: GetThereView;
  stayTiers: StayTier[];
  operators: OperatorItem[];
  isWitnessing: boolean;
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#8b9db8",
  marginBottom: "1rem",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const PILL_STYLE: Record<"warm" | "good" | "neutral", React.CSSProperties> = {
  warm: { background: "rgba(245,158,11,0.15)", color: "#fcd34d" },
  good: { background: "rgba(16,185,129,0.15)", color: "#6ee7b7" },
  neutral: { background: "rgba(255,255,255,0.10)", color: "#8b9db8" },
};

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

// ─── Coral-cover decline chart (SVG, deterministic) ───────────────────────────

function DeclineSvg({ d }: { d: DeclineChart }) {
  // Map values onto a 520x190 viewBox. Scale top to the data so values above 35% fit.
  const top = Math.max(40, Math.ceil(Math.max(d.fromPct, d.toPct) / 10) * 10);
  const yFor = (pct: number) => 150 - (pct / top) * 120;
  const x0 = 20;
  const xNow = 326;
  const xEnd = 500;
  const yFrom = yFor(d.fromPct);
  const yNow = yFor(d.toPct);
  const yEnd = d.zeroYear ? yFor(0) : yNow;
  const label =
    `Coral cover declining from ${d.fromPct}% in ${d.fromYear} to ${d.toPct}% today` +
    (d.zeroYear ? `, projected toward near zero by ${d.zeroYear}` : "");
  return (
    <svg viewBox="0 0 520 190" width="100%" height="190" role="img" aria-label={label}>
      <line x1="20" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <line x1="20" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <path d={`M${x0},${yFrom} L${xNow},${yNow} L${xNow},150 L${x0},150 Z`} fill="#fdecea" opacity="0.7" />
      <polyline points={`${x0},${yFrom} ${xNow},${yNow}`} fill="none" stroke="#c0392f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {d.zeroYear ? (
        <polyline points={`${xNow},${yNow} ${xEnd},${yEnd}`} fill="none" stroke="#c0392f" strokeWidth="2" strokeDasharray="5 5" opacity="0.55" />
      ) : null}
      <circle cx={x0} cy={yFrom} r="3.5" fill="#c0392f" />
      <circle cx={xNow} cy={yNow} r="4.5" fill="#c0392f" stroke="#0a1628" strokeWidth="2" />
      <text x={x0} y={yFrom - 10} fontSize="11" fontWeight="700" fill="#c0392f" fontFamily="Noto Sans">{d.fromPct}%</text>
      <text x="300" y={yNow + 19} fontSize="12" fontWeight="800" fill="#c0392f" fontFamily="Noto Sans">{d.toPct}% today</text>
      <text x="14" y="178" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{d.fromYear}</text>
      <text x="306" y="178" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{d.toYear}</text>
      {d.zeroYear ? (
        <text x="478" y="178" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{d.zeroYear}</text>
      ) : null}
    </svg>
  );
}

// ─── Coral-cover chart for holding/recovering reefs (SVG, deterministic) ──────

function CoverTrendSvg({ c }: { c: CoverTrend }) {
  // Scale the y-axis to the data so values above 35% still fit, rounded up to
  // the next 10. Green for recovery, neutral grey for holding steady.
  const top = Math.max(40, Math.ceil(Math.max(c.fromPct, c.toPct) / 10) * 10);
  const yFor = (pct: number) => 150 - (pct / top) * 120;
  const x0 = 20;
  const xNow = 326;
  const yFrom = yFor(c.fromPct);
  const yNow = yFor(c.toPct);
  const up = c.direction === "up";
  const stroke = up ? "#10b981" : "#8b9db8";
  const fill = up ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)";
  const label =
    up
      ? `Coral cover recovering from ${c.fromPct}% in ${c.fromYear} to ${c.toPct}% today`
      : `Coral cover holding around ${c.toPct}% since ${c.fromYear}`;
  return (
    <svg viewBox="0 0 520 190" width="100%" height="190" role="img" aria-label={label}>
      <line x1="20" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      <line x1="20" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <text x="20" y="165" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">0%</text>
      <path d={`M${x0},${yFrom} L${xNow},${yNow} L${xNow},150 L${x0},150 Z`} fill={fill} />
      <polyline points={`${x0},${yFrom} ${xNow},${yNow}`} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x0} cy={yFrom} r="3.5" fill={stroke} />
      <circle cx={xNow} cy={yNow} r="4.5" fill={stroke} stroke="#0a1628" strokeWidth="2" />
      <text x={x0} y={yFrom - 10} fontSize="11" fontWeight="700" fill={stroke} fontFamily="Noto Sans">{c.fromPct}%</text>
      {yFrom >= 42 && <text x="20" y="24" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{top}%</text>}
      <text x="300" y={yNow - 12} fontSize="12" fontWeight="800" fill={stroke} fontFamily="Noto Sans">{c.toPct}% today</text>
      <text x="14" y="178" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{c.fromYear}</text>
      <text x="306" y="178" fontSize="9" fill="#94a3b8" fontFamily="IBM Plex Mono">{c.toYear}</text>
    </svg>
  );
}

// ─── Dropdown (native <details>) for Getting there / Where to stay ────────────

function Expand({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details
      open
      style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
      className="trip-expand"
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          padding: "0.9rem 1.6rem",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "#f0f4f8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {summary}
        <span aria-hidden="true" className="trip-chev" style={{ color: "#8b9db8", transition: "transform .2s" }}>⌄</span>
      </summary>
      <div style={{ padding: "0 1.6rem 1.2rem", fontSize: "0.8125rem", color: "#aebcd0", lineHeight: 1.6 }}>
        {children}
      </div>
    </details>
  );
}

// ─── Main client body ─────────────────────────────────────────────────────────

export function LocationPageBody(props: LocationBodyProps) {
  const [info, setInfo] = useState<InfoKey | null>(null);

  const {
    locationId,
    intro,
    conditionSentence,
    decline,
    coverTrend,
    coverNow,
    coverYear,
    coverTrendNote,
    heat,
    fishing,
    reefStateLabel,
    reefStateColor,
    reefStateSub,
    hasReefData,
    species,
    sites,
    gearGroups,
    tripFacts,
    monthCells,
    getThere,
    stayTiers,
    operators,
    isWitnessing,
  } = props;

  const hasStay = stayTiers.some((t) => t.items.length > 0) || operators.length > 0;

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem clamp(1rem, 4vw, 3rem) 4rem", overflowX: "hidden" }}>
      <div
        className="location-body-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        {/* ============================ LEFT ============================ */}
        <div>
          {/* INTRO — generic place setting, before any science */}
          {intro ? (
            <div style={{ marginBottom: "3rem" }}>
              <EditorialHook text={intro} />
            </div>
          ) : null}

          {/* REEF CONDITION — single section */}
          {hasReefData ? (
            <section id="reef-condition" style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>Reef condition</p>

              <p
                style={{
                  fontFamily: "var(--font-serif),'Source Serif 4',Georgia,serif",
                  fontSize: "1.2rem",
                  lineHeight: 1.7,
                  color: "#aebcd0",
                  marginBottom: "1.75rem",
                  maxWidth: 680,
                }}
              >
                {conditionSentence}
              </p>

              <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1.25rem", overflow: "hidden" }}>
                {/* Chart header + coral cover (shown once) */}
                <div style={{ padding: "1.4rem 1.6rem 0.5rem" }}>
                  <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.4rem" }}>
                    Coral cover over time
                  </p>
                  {decline ? (
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f0f4f8", lineHeight: 1.45, overflowWrap: "break-word" }}>
                      Live coral has fallen from <b>{decline.fromPct}%</b>{" "}
                      to <span style={{ color: "#c0392f" }}>{decline.toPct}%</span> since {decline.fromYear}.{" "}
                      {decline.zeroYear ? (
                        <span style={{ color: "#aebcd0", fontWeight: 500 }}>
                          If the decline holds, little would remain by around {decline.zeroYear}.
                        </span>
                      ) : null}
                    </p>
                  ) : coverNow !== null ? (
                    <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f0f4f8", lineHeight: 1.45, overflowWrap: "break-word" }}>
                      Live coral covers <b>{coverNow}%</b> of the reef
                      {coverYear ? ` as of ${coverYear}` : ""}.
                      {coverTrendNote ? <span style={{ color: "#aebcd0", fontWeight: 500 }}> {coverTrendNote}</span> : null}
                    </p>
                  ) : (
                    <p style={{ fontSize: "0.9375rem", color: "#8b9db8", lineHeight: 1.5 }}>
                      No coral cover survey is on file for this reef yet.
                    </p>
                  )}
                </div>

                {decline ? (
                  <div style={{ padding: "0.5rem 1rem 0" }}>
                    <DeclineSvg d={decline} />
                  </div>
                ) : coverTrend ? (
                  <div style={{ padding: "0.5rem 1rem 0" }}>
                    <CoverTrendSvg c={coverTrend} />
                  </div>
                ) : null}

                {/* Foot: heat / fishing / reef state — each once, plain words */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 0, borderTop: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
                  {heat ? (
                    <Metric>
                      <MetricLabel>
                        Heat right now
                        <InfoButton onClick={() => setInfo("heat")} label="What this means" />
                      </MetricLabel>
                      <p style={{ margin: 0 }}>
                        <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, ...PILL_STYLE[heat.tone] }}>
                          {heat.label}
                        </span>
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.15rem" }}>{heat.sub}</p>
                      {heat.detail ? (
                        <p style={{ fontSize: "0.6875rem", color: "#aebcd0", marginTop: "0.35rem", lineHeight: 1.45 }}>{heat.detail}</p>
                      ) : null}
                    </Metric>
                  ) : null}

                  {fishing ? (
                    <Metric>
                      <MetricLabel>
                        Fishing
                        <InfoButton onClick={() => setInfo("fishing")} label="What this means" />
                      </MetricLabel>
                      <p style={{ margin: 0 }}>
                        <span style={{ display: "inline-block", padding: "0.15rem 0.55rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700, ...PILL_STYLE[fishing.tone] }}>
                          {fishing.label}
                        </span>
                      </p>
                      <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.15rem" }}>{fishing.sub}</p>
                    </Metric>
                  ) : null}

                  <Metric>
                    <MetricLabel>
                      Reef state
                      <InfoButton onClick={() => setInfo("state")} label="How we judge this" />
                    </MetricLabel>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: reefStateColor, margin: 0 }}>
                      {reefStateLabel}
                    </p>
                    <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.15rem" }}>{reefStateSub}</p>
                  </Metric>
                </div>
              </div>
            </section>
          ) : null}

          {/* WHAT YOU'LL SEE — single heading */}
          {species.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>
                What you&apos;ll see
                <InfoButton onClick={() => setInfo("iucn")} label="What the conservation labels mean" />
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {species.map((sp) => {
                  const Card = sp.href ? Link : "div";
                  return (
                    <Card
                      key={sp.key}
                      // @ts-expect-error polymorphic href
                      href={sp.href ?? undefined}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: "1rem",
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        background: "#0a1628",
                      }}
                    >
                      {sp.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resizePhotoUrl(sp.imageUrl, 500) ?? sp.imageUrl} alt={sp.commonName} style={{ width: "100%", height: 96, objectFit: "cover", display: "block" }} loading="lazy" decoding="async" />
                      ) : (
                        <div style={{ height: 96, background: "rgba(255,255,255,0.05)" }} />
                      )}
                      <div style={{ padding: "0.75rem" }}>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#f0f4f8", marginBottom: "0.3rem" }}>
                          {sp.commonName}
                        </p>
                        {sp.iucnLabel && sp.iucnBadge ? (
                          <span style={{ display: "inline-block", fontSize: "0.5625rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, whiteSpace: "nowrap", background: sp.iucnBadge.bg, color: sp.iucnBadge.color, marginBottom: "0.4rem" }}>
                            {sp.iucnLabel}
                          </span>
                        ) : null}
                        <p style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", color: "#8b9db8" }}>
                          <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: sp.dotColor, flexShrink: 0 }} />
                          {sp.seenText}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ) : null}

          {/* DIVE SITES — simplified rows */}
          {sites.length > 0 ? (
            <section id="sites" style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>Dive sites</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {sites.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sites/${s.slug}`}
                    style={{
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                      padding: "1rem 1.25rem",
                      borderRadius: "1rem",
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "#0a1628",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: "0.6rem", flexShrink: 0, background: s.gradient, overflow: "hidden" }}>
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resizePhotoUrl(s.imageUrl, 240) ?? s.imageUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" decoding="async" />
                      ) : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#f0f4f8" }}>{s.name}</p>
                      {s.speciesLine ? (
                        <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.15rem" }}>{s.speciesLine}</p>
                      ) : null}
                    </div>
                    <span aria-hidden="true" style={{ color: "#8b9db8", fontSize: "1.2rem", flexShrink: 0 }}>→</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* GEAR — two layers, minimal */}
          {gearGroups.length > 0 ? (
            <section id="gear" style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>Gear</p>
              <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1.25rem", padding: "1.1rem 1.4rem" }}>
                <ul style={{ display: "flex", flexDirection: "column", gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
                  {gearGroups.map((group, gi) => (
                    <li key={group.label} style={{ listStyle: "none" }}>
                      <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", margin: gi === 0 ? "0 0 0.2rem" : "1.1rem 0 0.2rem" }}>
                        {group.label}
                      </p>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                        {group.items.map((item, ii) => (
                          <li
                            key={item.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                              padding: "0.65rem 0",
                              borderTop: ii === 0 ? "none" : "1px solid rgba(255,255,255,0.10)",
                            }}
                          >
                            <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f4f8", flex: 1 }}>
                              {item.name}
                              {item.extra ? <span style={{ fontWeight: 400, color: "#8b9db8", fontSize: "0.8125rem" }}> · {item.extra}</span> : null}
                            </span>
                            {item.shopUrl ? (
                              <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" aria-label={`Where to buy ${item.name} (opens in new tab)`} style={{ color: "#8b9db8", flexShrink: 0, display: "flex" }}>
                                <ExternalIcon />
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}
        </div>

        {/* ============================ RIGHT — Plan a trip ============================ */}
        <aside style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1.4rem", boxShadow: "0 12px 40px -16px rgba(0,0,0,0.5)", overflow: "hidden", opacity: isWitnessing ? 0.96 : 1, background: "#0a1628" }}>
            <div style={{ padding: "1.5rem 1.6rem 1.1rem" }}>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#f0f4f8", lineHeight: 1.15 }}>
                Plan your trip
              </p>
            </div>

            {tripFacts.length > 0 || monthCells.length > 0 ? (
              <div style={{ padding: "0 1.6rem", display: "flex", flexDirection: "column" }}>
                {monthCells.length > 0 ? (
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0", borderTop: "none" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b9db8" }}>Best months</p>
                      <div style={{ display: "flex", gap: 3, marginTop: "0.4rem" }}>
                        {monthCells.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              flex: 1,
                              height: 20,
                              borderRadius: 3,
                              fontSize: "0.5rem",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: c.on ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                              color: c.on ? "#6ee7b7" : "#8b9db8",
                              outline: c.now ? "2px solid #00d4ff" : undefined,
                              outlineOffset: c.now ? 1 : undefined,
                            }}
                          >
                            {c.letter}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {tripFacts.map((f) => (
                  <div key={f.label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0", borderTop: "1px solid rgba(255,255,255,0.10)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8b9db8" }}>{f.label}</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f0f4f8", marginTop: "0.1rem" }}>{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div style={{ height: "0.4rem" }} />

            {/* Getting there */}
            {getThere && getThere.kind === "prose" ? (
              <Expand summary="Getting there">
                <p style={{ fontSize: "0.8125rem", color: "#aebcd0", lineHeight: 1.6 }}>{getThere.text}</p>
              </Expand>
            ) : null}
            {getThere && getThere.kind === "structured" ? (
              <Expand summary="Getting there">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.2rem" }}>Nearest hub</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f0f4f8" }}>{getThere.nearestHubName}</p>
                    <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.nearestHubDescription}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.2rem" }}>Transfer to the sites</p>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f0f4f8" }}>{getThere.transferToSitesName}</p>
                    <p style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.transferToSitesDescription}</p>
                  </div>
                  {getThere.liveaboardDescription ? (
                    <div>
                      <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.2rem" }}>Liveaboard option</p>
                      <p style={{ fontSize: "0.75rem", color: "#8b9db8", lineHeight: 1.5 }}>{getThere.liveaboardDescription}</p>
                    </div>
                  ) : null}
                </div>
              </Expand>
            ) : null}

            {/* Where to stay — lodging grouped by tier, with dive operators
                nested below so a stay and an operator can be booked together. */}
            {hasStay ? (
              <Expand summary="Where to stay">
                <p style={{ fontSize: "0.75rem", color: "#8b9db8", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  Most divers book a place to stay and a dive operator together. Each link goes to the provider&apos;s own site.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {stayTiers
                    .filter((tier) => tier.items.length > 0)
                    .map((tier) => (
                      <div key={`tier-${tier.label}`}>
                        <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.4rem" }}>
                          {tier.label}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {tier.items.map((l) => (
                            <AffiliateLink
                              key={`stay-${l.partner}-${l.label}`}
                              url={l.url || "#"}
                              event="lodging_click"
                              partner={l.partner}
                              query={l.label}
                              productId={l.productId}
                              siteId={locationId}
                              isAffiliate={l.isAffiliate}
                              className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-[#f0f4f8] no-underline transition hover:border-[#00d4ff]/40"
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {l.label}
                                </span>
                                {l.isLiveaboard ? (
                                  <span style={{ flexShrink: 0, fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", padding: "0.1rem 0.4rem", borderRadius: 999, background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}>
                                    stay + dive
                                  </span>
                                ) : null}
                              </span>
                              <span aria-hidden="true" style={{ color: "#8b9db8", flexShrink: 0 }}>→</span>
                            </AffiliateLink>
                          ))}
                        </div>
                      </div>
                    ))}

                  {operators.length > 0 ? (
                    <div>
                      <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.4rem" }}>
                        Dive operators
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {operators.map((op) => (
                          <AffiliateLink
                            key={`op-${op.partner}-${op.label}`}
                            url={op.url || "#"}
                            event="operator_click"
                            partner={op.partner}
                            query={op.label}
                            productId={op.productId}
                            siteId={locationId}
                            isAffiliate={op.isAffiliate}
                            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[13px] font-medium text-[#f0f4f8] no-underline transition hover:border-[#00d4ff]/40"
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                              {op.label}
                            </span>
                            <span aria-hidden="true" style={{ color: "#8b9db8", flexShrink: 0 }}>→</span>
                          </AffiliateLink>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Expand>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Info popups (reef state / heat / fishing / IUCN) */}
      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}

      <style>{`
        .trip-expand[open] .trip-chev { transform: rotate(180deg); }
        .trip-expand summary::-webkit-details-marker { display: none; }
        @media (max-width: 1024px) {
          .location-body-grid { grid-template-columns: 1fr !important; }
          .location-body-grid aside { position: static !important; }
        }
        @media (max-width: 768px) {
          .location-body-grid { gap: 2rem !important; }
        }
      `}</style>
    </div>
  );
}

function Metric({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 150, padding: "1rem 1.4rem", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
      {children}
    </div>
  );
}

function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
      {children}
    </p>
  );
}
