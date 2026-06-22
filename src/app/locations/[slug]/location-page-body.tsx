"use client";

import { useState } from "react";
import Link from "next/link";
import { AffiliateLink } from "@/components/affiliate-link";
import { resizePhotoUrl } from "@/lib/photo-quality";
import { EditorialHook } from "@/components/editorial-hook";
import { AtlasInfoPopup, InfoButton } from "@/components/atlas-info-popup";
import type { InfoKey } from "@/components/atlas-info-popup";
import type { SiteOption } from "@/components/sighting-submission/submission-form";
import { CoralProjectionChart } from "@/components/coral-projection-chart";
import type { CoralDataPoint } from "@/components/coral-projection-chart";

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

export type ThreatenedStats = {
  total: number;
  cr: number;
  en: number;
  vu: number;
};

// Story 4.3: fishing pressure data for the location panel
export type FishingPressureData = {
  fishingHours: number;
  year: number;
  radiusKm: number;
};

// Story 4.3: water quality events panel
export type WaterQualityEvent = {
  type: string;
  description: string;
  date: string | null;
  source: string | null;
};

export type LocationBodyProps = {
  locationId: string;
  locationName: string;
  sightingSites: SiteOption[];
  intro: string | null;
  // Reef condition
  conditionSentence: string;
  decline: DeclineChart | null;
  coverTrend: CoverTrend | null;
  coverNow: number | null;
  coverYear: number | null;
  coverTrendNote: string | null;
  // Story 4.2: projection chart data points (MERMAID survey points)
  projectionDataPoints: CoralDataPoint[];
  heat: ConditionPill | null;
  fishing: ConditionPill | null;
  // Story 4.3: GFW fishing pressure
  fishingPressure: FishingPressureData | null;
  // Story 4.3: water quality events
  waterQualityEvents: WaterQualityEvent[];
  // Story 4.1: reef health panel extra fields
  bleachedPct: number | null;
  dhwValue: number | null;
  surveyDateLabel: string | null;
  divingOutlook: string | null;
  reefStateLabel: string;
  reefStateColor: string;
  reefStateSub: string;
  hasReefData: boolean;
  // Species
  species: SpeciesCard[];
  threatenedStats: ThreatenedStats | null;
  // Sites
  sites: SiteRow[];
  // Gear
  gearGroups: GearGroup[];
  // Plan a trip
  tripFacts: TripFact[];
  monthCells: { letter: string; on: boolean; now: boolean }[];
  seasonNotes: string | null;
  getThere: GetThereView;
  stayTiers: StayTier[];
  operators: OperatorItem[];
  isWitnessing: boolean;
  // Editorial content
  quotes: { text: string; attribution?: string }[];
  goodToKnow: { title: string; body: string }[];
};

// ─── Light-token style constants ──────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
  fontSize: "11px",
  fontWeight: 500,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#4A5568",
  marginBottom: "1rem",
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
};

const SECTION_HEADER: React.CSSProperties = {
  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
  fontSize: "2rem",
  fontWeight: 400,
  fontStyle: "italic",
  lineHeight: 1.2,
  color: "#0E1C28",
  marginBottom: "1.5rem",
};

const SECTION_CARD: React.CSSProperties = {
  border: "1px solid #E7E6E2",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#FFFFFF",
};

const DATA_FRESHNESS: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
  fontSize: "11px",
  color: "#4A5568",
  marginTop: "0.25rem",
};

function DataFreshnessLabel({ source, date }: { source: string; date?: string | null }) {
  return (
    <p style={DATA_FRESHNESS}>
      {source}{date ? ` · ${date}` : ""}
    </p>
  );
}

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

// ─── Plan-a-trip expandable section ───────────────────────────────────────────

function Expand({ summary, children, defaultOpen = true }: { summary: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details
      open={defaultOpen}
      style={{ borderTop: "1px solid #E7E6E2" }}
      className="trip-expand"
    >
      <summary
        style={{
          listStyle: "none",
          cursor: "pointer",
          padding: "0.9rem 1.6rem",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "#0E1C28",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {summary}
        <span aria-hidden="true" className="trip-chev" style={{ color: "#4A5568", transition: "transform .2s" }}>⌄</span>
      </summary>
      <div style={{ padding: "0 1.6rem 1.2rem", fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.6 }}>
        {children}
      </div>
    </details>
  );
}

// ─── Reef health metric cell ──────────────────────────────────────────────────

function Metric({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      flex: 1,
      minWidth: 140,
      padding: "1rem 1.25rem",
      borderRight: last ? "none" : "1px solid #E7E6E2",
    }}>
      {children}
    </div>
  );
}

function MetricLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
      fontSize: "11px",
      fontWeight: 500,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#4A5568",
      marginBottom: "0.35rem",
      display: "flex",
      alignItems: "center",
      gap: "0.35rem",
    }}>
      {children}
    </p>
  );
}

// ─── Main client body ─────────────────────────────────────────────────────────

export function LocationPageBody(props: LocationBodyProps) {
  const [info, setInfo] = useState<InfoKey | null>(null);
  const [showAllSites, setShowAllSites] = useState(false);
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const [showAllOperators, setShowAllOperators] = useState(false);

  const {
    locationId,
    locationName,
    sightingSites,
    intro,
    conditionSentence,
    decline,
    coverTrend,
    coverNow,
    coverYear,
    coverTrendNote,
    projectionDataPoints,
    heat,
    fishing,
    fishingPressure,
    waterQualityEvents,
    bleachedPct,
    dhwValue,
    surveyDateLabel,
    divingOutlook,
    reefStateLabel,
    reefStateColor,
    reefStateSub,
    hasReefData,
    species,
    threatenedStats,
    sites,
    gearGroups,
    tripFacts,
    monthCells,
    getThere,
    stayTiers,
    operators,
    isWitnessing,
    quotes,
    goodToKnow,
    seasonNotes,
  } = props;

  const hasStay = stayTiers.some((t) => t.items.length > 0) || operators.length > 0;

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem clamp(1rem, 4vw, 3rem) 4rem", overflowX: "hidden", background: "#FFFFFF", color: "#0E1C28" }}>
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
          {/* INTRO */}
          {intro ? (
            <div style={{ marginBottom: "3rem" }}>
              <EditorialHook text={intro} />
            </div>
          ) : null}

          {/* STORY 4.1 + 4.2 + 4.3: REEF HEALTH PANEL */}
          {hasReefData ? (
            <section id="reef-condition" style={{ marginBottom: "3rem" }}>
              <h2 style={SECTION_HEADER}>Reef health</h2>

              {/* Diving outlook sentence */}
              <p style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                fontSize: "1.125rem",
                lineHeight: 1.7,
                color: "#4A5568",
                marginBottom: "1.5rem",
                maxWidth: 680,
              }}>
                {divingOutlook ?? conditionSentence}
              </p>

              {/* Data card */}
              <div style={SECTION_CARD}>
                {/* Coral cover + trend note */}
                <div style={{ padding: "1.25rem 1.25rem 0.75rem" }}>
                  <p style={{
                    fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
                    fontSize: "11px",
                    fontWeight: 500,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#4A5568",
                    marginBottom: "0.35rem",
                  }}>
                    Coral cover over time
                  </p>
                  {decline ? (
                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0E1C28", lineHeight: 1.45 }}>
                      Live coral has fallen from <strong>{decline.fromPct}%</strong>{" "}
                      to <span style={{ color: "#C0412B" }}>{decline.toPct}%</span> since {decline.fromYear}.{" "}
                      {decline.zeroYear ? (
                        <span style={{ color: "#4A5568", fontWeight: 400 }}>
                          If the decline holds, little would remain by around {decline.zeroYear}.
                        </span>
                      ) : null}
                    </p>
                  ) : coverNow !== null ? (
                    <p style={{ fontSize: "1rem", fontWeight: 600, color: "#0E1C28", lineHeight: 1.45 }}>
                      Live coral covers <strong>{coverNow}%</strong> of the reef
                      {coverYear ? ` as of ${coverYear}` : ""}.
                      {coverTrendNote ? <span style={{ color: "#4A5568", fontWeight: 400 }}> {coverTrendNote}</span> : null}
                    </p>
                  ) : (
                    <p style={{ fontSize: "0.9375rem", color: "#4A5568", lineHeight: 1.5 }}>
                      No coral cover survey is on file for this reef yet.
                    </p>
                  )}
                  <DataFreshnessLabel source="MERMAID" date={surveyDateLabel} />
                </div>

                {/* Story 4.2: CoralProjectionChart */}
                {projectionDataPoints.length >= 2 ? (
                  <div style={{ padding: "0.25rem 1.25rem 1rem" }}>
                    <CoralProjectionChart
                      locationName={locationName}
                      dataPoints={projectionDataPoints}
                    />
                  </div>
                ) : null}

                {/* Reef health metrics row */}
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0,
                  borderTop: "1px solid #E7E6E2",
                  background: "#F8F7F4",
                }}>
                  {/* Heat right now */}
                  {heat ? (
                    <Metric>
                      <MetricLabel>
                        Heat right now
                        <InfoButton onClick={() => setInfo("heat")} label="What this means" />
                      </MetricLabel>
                      <p style={{ margin: 0 }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: heat.tone === "good" ? "rgba(46,125,91,0.1)" : "rgba(185,138,46,0.1)",
                          color: heat.tone === "good" ? "#2E7D5B" : "#B98A2E",
                        }}>
                          {heat.label}
                        </span>
                      </p>
                      {heat.detail ? (
                        <p style={{ fontSize: "0.6875rem", color: "#4A5568", marginTop: "0.2rem", lineHeight: 1.45 }}>{heat.detail}</p>
                      ) : null}
                    </Metric>
                  ) : null}

                  {/* Fishing */}
                  {fishing ? (
                    <Metric>
                      <MetricLabel>
                        Fishing
                        <InfoButton onClick={() => setInfo("fishing")} label="What this means" />
                      </MetricLabel>
                      <p style={{ margin: 0 }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: fishing.tone === "good" ? "rgba(46,125,91,0.1)" : fishing.tone === "warm" ? "rgba(185,138,46,0.1)" : "rgba(14,28,40,0.06)",
                          color: fishing.tone === "good" ? "#2E7D5B" : fishing.tone === "warm" ? "#B98A2E" : "#4A5568",
                        }}>
                          {fishing.label}
                        </span>
                      </p>
                    </Metric>
                  ) : null}

                  {/* Reef state */}
                  <Metric last>
                    <MetricLabel>
                      Reef state
                      <InfoButton onClick={() => setInfo("state")} label="How we judge this" />
                    </MetricLabel>
                    <p style={{ fontSize: "0.95rem", fontWeight: 700, color: reefStateColor, margin: 0 }}>
                      {reefStateLabel}
                    </p>
                  </Metric>
                </div>
              </div>
            </section>
          ) : null}



          {/* STORY 4.3: WATER QUALITY PANEL (only when data exists) */}
          {waterQualityEvents.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <h2 style={SECTION_HEADER}>Water quality</h2>
              <div style={SECTION_CARD}>
                <div style={{ padding: "1.25rem" }}>
                  {waterQualityEvents.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        paddingTop: i > 0 ? "0.85rem" : 0,
                        marginTop: i > 0 ? "0.85rem" : 0,
                        borderTop: i > 0 ? "1px solid #E7E6E2" : "none",
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0E1C28", marginBottom: "0.25rem" }}>
                        {ev.type}
                      </p>
                      <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.6 }}>{ev.description}</p>
                      {ev.source && <DataFreshnessLabel source={ev.source} date={ev.date} />}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* WHAT YOU WILL SEE — species section */}
          {species.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <h2 style={{ ...SECTION_HEADER, display: "flex", alignItems: "center", gap: "0.75rem" }}>
                What you will see
                <span style={{ fontSize: "1rem", fontStyle: "normal" }}>
                  <InfoButton onClick={() => setInfo("iucn")} label="What the conservation labels mean" />
                </span>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem" }}>
                {(showAllSpecies ? species : species.slice(0, 3)).map((sp) => {
                  const Card = sp.href ? Link : "div";
                  return (
                    <Card
                      key={sp.key}
                      // @ts-expect-error polymorphic href
                      href={sp.href ?? undefined}
                      style={{
                        border: "1px solid #E7E6E2",
                        borderRadius: "8px",
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                        background: "#FFFFFF",
                      }}
                    >
                      {sp.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resizePhotoUrl(sp.imageUrl, 500) ?? sp.imageUrl} alt={sp.commonName} style={{ width: "100%", height: 96, objectFit: "cover", objectPosition: "center top", clipPath: "inset(0 0 30% 0)", display: "block" }} loading="lazy" decoding="async" />
                      ) : (
                        <div style={{ height: 96, background: "#0E4F6E" }} />
                      )}
                      <div style={{ padding: "0.75rem" }}>
                        <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1rem", fontWeight: 400, color: "#0E1C28", marginBottom: "0.3rem" }}>
                          {sp.commonName}
                        </p>
                        <p style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", color: "#4A5568", marginBottom: "0.3rem" }}>
                          <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: sp.dotColor, flexShrink: 0 }} />
                          {sp.seenText}
                        </p>
                        {sp.iucnBadge && sp.iucnLabel ? (
                          <p style={{ margin: 0 }}>
                            <span style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 999,
                              fontSize: "0.625rem",
                              fontWeight: 600,
                              background: sp.iucnBadge.bg,
                              color: sp.iucnBadge.color,
                              textTransform: "uppercase",
                              fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
                            }}>
                              {sp.iucnLabel}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </Card>
                  );
                })}
              </div>
              {species.length > 3 && !showAllSpecies ? (
                <button
                  onClick={() => setShowAllSpecies(true)}
                  style={{ marginTop: "0.75rem", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "#4A5568", textDecoration: "underline" }}
                >
                  Show all {species.length} species
                </button>
              ) : null}
            </section>
          ) : null}

          {/* DIVE SITES — card grid (Story 4.1) */}
          {sites.length > 0 ? (
            <section id="sites" style={{ marginBottom: "3rem" }}>
              <h2 style={SECTION_HEADER}>Dive sites</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                {(showAllSites ? sites : sites.slice(0, 6)).map((s) => (
                  <Link
                    key={s.id}
                    href={`/sites/${s.slug}`}
                    style={{
                      border: "1px solid #E7E6E2",
                      borderRadius: "8px",
                      overflow: "hidden",
                      textDecoration: "none",
                      color: "inherit",
                      display: "flex",
                      flexDirection: "column",
                      background: "#FFFFFF",
                      transition: "border-color 150ms",
                    }}
                    className="site-row-link"
                  >
                    <div style={{ width: "100%", height: 140, background: s.gradient, overflow: "hidden" }}>
                      {s.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resizePhotoUrl(s.imageUrl, 500) ?? s.imageUrl} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", clipPath: "inset(0 0 30% 0)", display: "block" }} loading="lazy" decoding="async" />
                      ) : null}
                    </div>
                    <div style={{ padding: "0.75rem" }}>
                      <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1rem", fontWeight: 400, color: "#0E1C28", marginBottom: "0.3rem" }}>{s.name}</p>
                      {s.speciesLine ? (
                        <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", color: "#4A5568" }}>{s.speciesLine}</p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
              {sites.length > 6 && !showAllSites ? (
                <button
                  onClick={() => setShowAllSites(true)}
                  style={{ marginTop: "0.75rem", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "#4A5568", textDecoration: "underline" }}
                >
                  Show all {sites.length} dive sites
                </button>
              ) : null}
            </section>
          ) : null}

          {/* WHAT DIVERS SAY — quotes */}
          {quotes.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <h2 style={SECTION_HEADER}>What divers say</h2>
              <div className="quotes-grid" style={{ display: "grid", gridTemplateColumns: quotes.length === 1 ? "1fr" : "1fr 1fr", gap: "0.75rem" }}>
                {quotes.map((q, i) => (
                  <figure
                    key={i}
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      background: "#0E1C28",
                      padding: "1.5rem",
                      margin: 0,
                      position: "relative",
                    }}
                  >
                    <span aria-hidden="true" style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "1.25rem",
                      fontFamily: 'Georgia, serif',
                      fontSize: "5rem",
                      lineHeight: 1,
                      color: "#F6C700",
                      opacity: 0.25,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}>&ldquo;</span>
                    <blockquote
                      style={{
                        fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                        fontSize: "0.9375rem",
                        fontStyle: "italic",
                        lineHeight: 1.75,
                        color: "rgba(255,255,255,0.9)",
                        margin: 0,
                        position: "relative",
                      }}
                    >
                      {q.text}
                    </blockquote>
                    {q.attribution ? (
                      <figcaption
                        style={{
                          marginTop: "1rem",
                          fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "#F6C700",
                        }}
                      >
                        — {q.attribution}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {/* GOOD TO KNOW */}
          {goodToKnow.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <h2 style={SECTION_HEADER}>Good to know</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {goodToKnow.map((item, i) => (
                  <div
                    key={item.title}
                    style={{
                      border: "1px solid #E7E6E2",
                      borderRadius: "8px",
                      borderLeft: "3px solid #F6C700",
                      background: "#FFFFFF",
                      padding: "0.85rem 1.25rem",
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0E1C28", marginBottom: "0.2rem" }}>{item.title}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.6 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}


        </div>

        {/* ============================ RIGHT — Plan a trip ============================ */}
        <aside style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}>
          <div style={{
            border: "1px solid #E7E6E2",
            borderRadius: "8px",
            boxShadow: "0 8px 40px rgba(14,28,40,0.12)",
            overflow: "hidden",
            opacity: isWitnessing ? 0.96 : 1,
            background: "#FFFFFF",
          }}>
            <div style={{ padding: "1.5rem 1.6rem 1.1rem", borderBottom: "1px solid #E7E6E2" }}>
              <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1.3rem", fontWeight: 400, color: "#0E1C28", lineHeight: 1.2 }}>
                Plan your trip
              </p>
            </div>

            {tripFacts.length > 0 || monthCells.length > 0 ? (
              <div style={{ padding: "0 1.6rem", display: "flex", flexDirection: "column" }}>
                {monthCells.length > 0 ? (
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568" }}>Best months</p>
                      <div style={{ display: "flex", gap: 3, marginTop: "0.4rem" }}>
                        {monthCells.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              flex: 1,
                              height: 22,
                              borderRadius: "3px",
                              fontSize: "0.5rem",
                              fontWeight: 600,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: c.on ? "rgba(46,125,91,0.12)" : "#F8F7F4",
                              color: c.on ? "#2E7D5B" : "#4A5568",
                              outline: c.now ? "2px solid #F6C700" : undefined,
                              outlineOffset: c.now ? 1 : undefined,
                              fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
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
                  <div key={f.label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0", borderTop: "1px solid #E7E6E2" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568" }}>{f.label}</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0E1C28", marginTop: "0.15rem" }}>{f.value}</p>
                    </div>
                  </div>
                ))}

                {seasonNotes ? (
                  <div style={{ padding: "0.85rem 0", borderTop: "1px solid #E7E6E2" }}>
                    <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.4rem" }}>Season notes</p>
                    <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.6 }}>{seasonNotes}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* FTC affiliate disclosure */}
            <div style={{ padding: "0.6rem 1.6rem", borderTop: "1px solid #E7E6E2" }}>
              <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "10px", color: "#4A5568", lineHeight: 1.5 }}>
                Some links are affiliate links. We may earn a commission at no cost to you.
              </p>
            </div>

            {/* Getting there */}
            {getThere && getThere.kind === "prose" ? (
              <Expand summary="Getting there">
                <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.6 }}>{getThere.text}</p>
              </Expand>
            ) : null}
            {getThere && getThere.kind === "structured" ? (
              <Expand summary="Getting there">
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.2rem" }}>Nearest hub</p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0E1C28" }}>{getThere.nearestHubName}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#4A5568", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.nearestHubDescription}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.2rem" }}>Transfer to the sites</p>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0E1C28" }}>{getThere.transferToSitesName}</p>
                    <p style={{ fontSize: "0.8125rem", color: "#4A5568", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.transferToSitesDescription}</p>
                  </div>
                  {getThere.liveaboardDescription ? (
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.2rem" }}>Liveaboard option</p>
                      <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.5 }}>{getThere.liveaboardDescription}</p>
                    </div>
                  ) : null}
                </div>
              </Expand>
            ) : null}

            {/* Where to stay */}
            {hasStay ? (
              <Expand summary="Where to stay" defaultOpen={false}>
                <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.55, marginBottom: "0.75rem" }}>
                  Most divers book a place to stay and a dive operator together. Each link goes to the provider own site.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {stayTiers
                    .filter((tier) => tier.items.length > 0)
                    .map((tier) => (
                      <div key={`tier-${tier.label}`}>
                        <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.4rem" }}>
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
                              className="flex items-center justify-between gap-2 rounded border border-[#E7E6E2] bg-white px-3 py-2 text-sm font-medium text-[#0E1C28] no-underline transition hover:border-[#0E1C28]"
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {l.label}
                                </span>
                                {l.isLiveaboard ? (
                                  <span style={{ flexShrink: 0, fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "10px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", padding: "1px 5px", borderRadius: 999, background: "rgba(46,125,91,0.1)", color: "#2E7D5B" }}>
                                    stay + dive
                                  </span>
                                ) : null}
                              </span>
                              <span aria-hidden="true" style={{ color: "#4A5568", flexShrink: 0 }}>→</span>
                            </AffiliateLink>
                          ))}
                        </div>
                      </div>
                    ))}

                  {operators.length > 0 ? (
                    <div>
                      <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.4rem" }}>
                        Dive operators
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {(showAllOperators ? operators : operators.slice(0, 2)).map((op) => (
                          <AffiliateLink
                            key={`op-${op.partner}-${op.label}`}
                            url={op.url || "#"}
                            event="operator_click"
                            partner={op.partner}
                            query={op.label}
                            productId={op.productId}
                            siteId={locationId}
                            isAffiliate={op.isAffiliate}
                            className="flex items-center justify-between gap-2 rounded border border-[#E7E6E2] bg-white px-3 py-2 text-sm font-medium text-[#0E1C28] no-underline transition hover:border-[#0E1C28]"
                          >
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                              {op.label}
                            </span>
                            <span aria-hidden="true" style={{ color: "#4A5568", flexShrink: 0 }}>→</span>
                          </AffiliateLink>
                        ))}
                      </div>
                      {operators.length > 2 && !showAllOperators ? (
                        <button
                          onClick={() => setShowAllOperators(true)}
                          style={{ marginTop: "0.5rem", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", color: "#4A5568", textDecoration: "underline" }}
                        >
                          Show all {operators.length} operators
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </Expand>
            ) : null}
          </div>

          {/* UPLOAD NUDGE CARD */}
          <div style={{ border: "2px dashed #F6C700", borderRadius: "8px", padding: "1.25rem", marginTop: "1rem" }}>
            <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontWeight: 600, color: "#0E1C28", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              Diving here?
              <InfoButton onClick={() => setInfo("sighting")} label="Learn how broadcasts work" />
            </p>
            <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontSize: "0.875rem", color: "#4A5568", marginBottom: "0.75rem" }}>
              Log what you see and help track this reef's health worldwide.
            </p>
            <Link
              href="/upload"
              style={{
                display: "inline-block",
                background: "#F6C700",
                color: "#0E1C28",
                fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
                fontWeight: 500,
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
                borderRadius: "2px",
                textDecoration: "none",
                minHeight: 44,
                lineHeight: "1.5",
              }}
            >
              Upload a sighting →
            </Link>
          </div>
        </aside>

        {/* ============================ GEAR — below aside so mobile order is: content → Plan Your Trip → Gear ============================ */}
        {gearGroups.length > 0 ? (
          <section id="gear" style={{ gridColumn: "1", marginBottom: "3rem" }}>
            <h2 style={SECTION_HEADER}>Gear & getting wet</h2>
            <div style={{ ...SECTION_CARD, padding: "1.1rem 1.4rem" }}>
              <ul style={{ display: "flex", flexDirection: "column", gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
                {gearGroups.map((group, gi) => (
                  <li key={group.label} style={{ listStyle: "none" }}>
                    <p style={{ fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace', fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", margin: gi === 0 ? "0 0 0.2rem" : "1.1rem 0 0.2rem" }}>
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
                            borderTop: ii === 0 ? "none" : "1px solid #E7E6E2",
                          }}
                        >
                          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0E1C28", flex: 1 }}>
                            {item.name}
                            {item.extra ? <span style={{ fontWeight: 400, color: "#4A5568", fontSize: "0.8125rem" }}> · {item.extra}</span> : null}
                          </span>
                          {item.shopUrl ? (
                            <a href={item.shopUrl} target="_blank" rel="noopener noreferrer" aria-label={`Where to buy ${item.name} (opens in new tab)`} style={{ color: "#4A5568", flexShrink: 0, display: "flex" }}>
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

      {/* Info popups */}
      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}

      <style>{`
        .trip-expand[open] .trip-chev { transform: rotate(180deg); }
        .trip-expand summary::-webkit-details-marker { display: none; }
        .site-row-link:hover { border-color: #0E1C28 !important; }
        .site-row-link:focus-visible { outline: 2px solid #F6C700; outline-offset: 2px; }
        .quotes-grid figure:last-child:nth-child(odd) { grid-column: 1 / -1; }
        @media (max-width: 1024px) {
          .location-body-grid { grid-template-columns: 1fr !important; }
          .location-body-grid aside { position: static !important; }
        }
        @media (max-width: 768px) {
          .location-body-grid { gap: 2rem !important; }
        }
        @media (max-width: 640px) {
          .location-body-grid > div > section:nth-child(4) > div { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </div>
  );
}
