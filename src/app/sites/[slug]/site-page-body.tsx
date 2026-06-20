"use client";

import { useState } from "react";
import Link from "next/link";
import { AffiliateLink } from "@/components/affiliate-link";
import { AtlasInfoPopup, InfoButton } from "@/components/atlas-info-popup";
import type { InfoKey } from "@/components/atlas-info-popup";
import { SubmissionForm } from "@/components/sighting-submission";
import { SightingLog } from "@/components/sighting-log";
import type { SightingEntry } from "@/components/sighting-log";

// ─── Serializable view-model passed from the server page ──────────────────────

export type ConditionCard = {
  icon: string;
  label: string;
  value: string;
  sub: string | null;
};

// Story 4.4: monthly conditions row for the 12-month grid
export type MonthlyConditionRow = {
  month: number; // 1-12
  waterTempC: { min: number; max: number };
  visibilityM: { min: number; max: number };
  currentStrength: string;
};

export type EncounterRow = {
  key: string;
  href: string;
  icon: string;
  imageUrl: string | null;
  imageAttribution: string | null;
  name: string;
  where: string | null;
  chanceLabel: string;
  chanceColor: string;
  fillPct: number;
  fillColor: string;
  frequency: string;
  lastConfirmedDate: string | null;
  recentCount: number | null;
  iucnLabel: string | null;
  iucnBadge: { bg: string; color: string } | null;
};

export type GearItem = {
  icon: string;
  name: string;
  extra: string | null;
  shopUrl: string | null;
};

export type GearGroup = { label: string; items: GearItem[] };

export type TripFact = { icon: string; label: string; value: string };

export type OperatorItem = {
  partner: string;
  label: string;
  url: string;
  productId?: string;
  isAffiliate: boolean;
  detail: string | null;
};

export type LodgingItem = {
  partner: string;
  label: string;
  url: string;
  isAffiliate: boolean;
  priceLevel: 1 | 2 | 3 | 4 | null;
  kind: "hotel" | "liveaboard";
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

export type SiteBodyProps = {
  siteId: string;
  siteSlug: string;
  siteName: string;
  siteLat: number;
  siteLng: number;
  intro: string | null;
  conditions: ConditionCard[];
  monthlyConditions: MonthlyConditionRow[];
  encounters: EncounterRow[];
  speciesIndexHref: string;
  gearGroups: GearGroup[];
  tripTitle: string;
  tripFacts: TripFact[];
  monthCells: { letter: string; on: boolean; now: boolean }[];
  getThere: GetThereView;
  operators: OperatorItem[];
  lodging: LodgingItem[];
  sightingEntries: SightingEntry[];
};

// ─── Style constants (light token system) ────────────────────────────────────

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

const SECTION_CARD: React.CSSProperties = {
  border: "1px solid #E7E6E2",
  borderRadius: "8px",
  overflow: "hidden",
  background: "#FFFFFF",
};

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_STRENGTH_VALUE: Record<string, string> = {
  none: "Still",
  mild: "Gentle",
  moderate: "Moderate",
  strong: "Strong",
};

function currentTone(strength: string): { bg: string; color: string } {
  if (strength === "none" || strength === "mild") return { bg: "rgba(46,125,91,0.08)", color: "#2E7D5B" };
  if (strength === "moderate") return { bg: "#E7E6E2", color: "#4A5568" };
  return { bg: "rgba(192,65,43,0.08)", color: "#C0412B" };
}

function tempTone(tempMin: number): { bg: string; color: string } {
  if (tempMin >= 26) return { bg: "rgba(46,125,91,0.08)", color: "#2E7D5B" };
  if (tempMin >= 22) return { bg: "#E7E6E2", color: "#4A5568" };
  return { bg: "rgba(192,65,43,0.08)", color: "#C0412B" };
}

function visTone(visMin: number): { bg: string; color: string } {
  if (visMin >= 15) return { bg: "rgba(46,125,91,0.08)", color: "#2E7D5B" };
  if (visMin >= 8) return { bg: "#E7E6E2", color: "#4A5568" };
  return { bg: "rgba(192,65,43,0.08)", color: "#C0412B" };
}

function CellChip({ label, tone }: { label: string; tone: { bg: string; color: string } }) {
  return (
    <span
      style={{
        display: "block",
        padding: "4px 2px",
        background: tone.bg,
        color: tone.color,
        fontSize: "10px",
        fontWeight: 600,
        textAlign: "center",
        borderRadius: "2px",
        ...MONO,
      }}
    >
      {label}
    </span>
  );
}

// ─── Plan-a-dive sidebar expandable section ───────────────────────────────────

function Expand({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details
      open
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

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// ─── Main client body ─────────────────────────────────────────────────────────

export function SitePageBody(props: SiteBodyProps) {
  const [info, setInfo] = useState<InfoKey | null>(null);
  const [tripSheetOpen, setTripSheetOpen] = useState(false);

  const {
    siteId,
    siteSlug,
    siteName,
    siteLat,
    siteLng,
    intro,
    conditions,
    monthlyConditions,
    encounters,
    speciesIndexHref,
    gearGroups,
    tripTitle,
    tripFacts,
    monthCells,
    getThere,
    operators,
    lodging,
    sightingEntries,
  } = props;

  const hotels = lodging.filter((l) => l.kind === "hotel");
  const liveaboards = lodging.filter((l) => l.kind === "liveaboard");
  const PRICE_DOTS = ["·", "··", "···", "····"];
  const hasTrip = operators.length > 0 || hotels.length > 0 || liveaboards.length > 0 || getThere !== null;

  // ─── Sidebar content (shared between desktop sticky and mobile sheet) ─────
  function TripSidebarContent() {
    return (
      <div style={{ border: "1px solid #E7E6E2", borderRadius: "8px", boxShadow: "0 8px 40px rgba(14,28,40,0.10)", overflow: "hidden", background: "#FFFFFF" }}>
        <div style={{ padding: "1.5rem 1.6rem 1.1rem", borderBottom: "1px solid #E7E6E2" }}>
          <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1.3rem", fontWeight: 400, color: "#0E1C28", lineHeight: 1.2 }}>
            {tripTitle}
          </p>
        </div>

        {(tripFacts.length > 0 || monthCells.length > 0) && (
          <div style={{ padding: "0 1.6rem", display: "flex", flexDirection: "column" }}>
            {monthCells.length > 0 ? (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4A5568" }}>Best months</p>
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
                          ...MONO,
                        }}
                      >
                        {c.letter}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {tripFacts.map((f, idx) => (
              <div key={f.label} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.85rem 0", borderTop: idx === 0 && monthCells.length === 0 ? "none" : "1px solid #E7E6E2" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4A5568" }}>{f.label}</p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#0E1C28", marginTop: "0.15rem" }}>{f.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FTC disclosure */}
        <div style={{ padding: "0.6rem 1.6rem", borderTop: "1px solid #E7E6E2" }}>
          <p style={{ ...MONO, fontSize: "10px", color: "#4A5568", lineHeight: 1.5 }}>
            Some links are affiliate links. We may earn a commission at no additional cost to you.
          </p>
        </div>

        {/* Getting there */}
        {getThere && getThere.kind === "prose" ? (
          <Expand summary="Getting there">
            <p>{getThere.text}</p>
          </Expand>
        ) : null}
        {getThere && getThere.kind === "structured" ? (
          <Expand summary="Getting there">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div>
                <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4A5568", marginBottom: "0.2rem" }}>Nearest hub</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0E1C28" }}>{getThere.nearestHubName}</p>
                <p style={{ fontSize: "0.8125rem", color: "#4A5568", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.nearestHubDescription}</p>
              </div>
              <div>
                <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4A5568", marginBottom: "0.2rem" }}>Getting on the water</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0E1C28" }}>{getThere.transferToSitesName}</p>
                <p style={{ fontSize: "0.8125rem", color: "#4A5568", marginTop: "0.1rem", lineHeight: 1.5 }}>{getThere.transferToSitesDescription}</p>
              </div>
              {getThere.liveaboardDescription ? (
                <div>
                  <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#4A5568", marginBottom: "0.2rem" }}>Liveaboard option</p>
                  <p style={{ fontSize: "0.8125rem", color: "#4A5568", lineHeight: 1.5 }}>{getThere.liveaboardDescription}</p>
                </div>
              ) : null}
            </div>
          </Expand>
        ) : null}

        {/* Dive operators */}
        {operators.length > 0 ? (
          <Expand summary="Dive operators">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {operators.map((op) => (
                <AffiliateLink
                  key={op.url}
                  url={op.url}
                  event="operator_click"
                  partner={op.partner}
                  query={op.label}
                  productId={op.productId}
                  siteId={siteId}
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
          </Expand>
        ) : null}

        {/* Where to stay */}
        {hotels.length > 0 ? (
          <Expand summary="Where to stay">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {hotels.map((h) => (
                <AffiliateLink
                  key={h.url}
                  url={h.url}
                  event="lodging_click"
                  partner={h.partner}
                  siteId={siteId}
                  isAffiliate={h.isAffiliate}
                  className="flex items-center justify-between gap-2 rounded border border-[#E7E6E2] bg-white px-3 py-2 text-sm font-medium text-[#0E1C28] no-underline transition hover:border-[#0E1C28]"
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                    {h.label}
                  </span>
                  {h.priceLevel ? (
                    <span style={{ ...MONO, fontSize: "0.6875rem", color: "#4A5568", flexShrink: 0 }}>{PRICE_DOTS[h.priceLevel - 1]}</span>
                  ) : null}
                  <ExternalIcon />
                </AffiliateLink>
              ))}
            </div>
          </Expand>
        ) : null}

        {/* Liveaboards */}
        {liveaboards.length > 0 ? (
          <Expand summary="Liveaboards">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {liveaboards.map((l) => (
                <AffiliateLink
                  key={l.url}
                  url={l.url}
                  event="lodging_click"
                  partner={l.partner}
                  siteId={siteId}
                  isAffiliate={l.isAffiliate}
                  className="flex items-center justify-between gap-2 rounded border border-[#E7E6E2] bg-white px-3 py-2 text-sm font-medium text-[#0E1C28] no-underline transition hover:border-[#0E1C28]"
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                    {l.label}
                  </span>
                  {l.priceLevel ? (
                    <span style={{ ...MONO, fontSize: "0.6875rem", color: "#4A5568", flexShrink: 0 }}>{PRICE_DOTS[l.priceLevel - 1]}</span>
                  ) : null}
                  <ExternalIcon />
                </AffiliateLink>
              ))}
            </div>
          </Expand>
        ) : null}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem clamp(1rem, 4vw, 3rem) 4rem", overflowX: "hidden", background: "#FFFFFF", color: "#0E1C28" }}>
      <div
        className="site-body-grid"
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
              <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontSize: "1.125rem", lineHeight: 1.75, color: "#4A5568", maxWidth: 700 }}>
                {intro}
              </p>
            </div>
          ) : null}

          {/* CONDITIONS — 4 summary cards */}
          {conditions.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>
                Conditions
                <InfoButton onClick={() => setInfo("conditions")} label="What these mean" />
              </p>
              <div className="cond-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                {conditions.map((c) => (
                  <div key={c.label} style={{ ...SECTION_CARD, padding: "1rem 1.1rem" }}>
                    <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", marginBottom: "0.25rem" }}>{c.label}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#0E1C28" }}>{c.value}</p>
                    {c.sub ? <p style={{ ...MONO, fontSize: "0.6875rem", color: "#4A5568", marginTop: "0.15rem" }}>{c.sub}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* STORY 4.4: 12-MONTH CONDITIONS GRID */}
          {monthlyConditions.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>Month by month</p>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <table
                  style={{
                    borderCollapse: "separate",
                    borderSpacing: 0,
                    minWidth: 600,
                    width: "100%",
                    border: "1px solid #E7E6E2",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...MONO,
                          fontSize: "10px",
                          fontWeight: 500,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "#4A5568",
                          padding: "0.6rem 0.75rem",
                          textAlign: "left",
                          background: "#F8F7F4",
                          borderBottom: "1px solid #E7E6E2",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Month
                      </th>
                      {monthlyConditions.map((mc) => (
                        <th
                          key={mc.month}
                          style={{
                            ...MONO,
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "#0E1C28",
                            padding: "0.6rem 0.4rem",
                            textAlign: "center",
                            background: "#F8F7F4",
                            borderBottom: "1px solid #E7E6E2",
                            borderLeft: "1px solid #E7E6E2",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {MONTH_ABBR[mc.month - 1]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Water temperature row */}
                    <tr>
                      <td style={{ ...MONO, fontSize: "10px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4A5568", padding: "0.5rem 0.75rem", background: "#FFFFFF", borderBottom: "1px solid #E7E6E2", whiteSpace: "nowrap" }}>
                        Water (°C)
                      </td>
                      {monthlyConditions.map((mc) => {
                        const tone = tempTone(mc.waterTempC.min);
                        return (
                          <td key={mc.month} style={{ padding: "0.4rem 0.35rem", background: "#FFFFFF", borderBottom: "1px solid #E7E6E2", borderLeft: "1px solid #E7E6E2" }}>
                            <CellChip label={`${mc.waterTempC.min}`} tone={tone} />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Visibility row */}
                    <tr>
                      <td style={{ ...MONO, fontSize: "10px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4A5568", padding: "0.5rem 0.75rem", background: "#FFFFFF", borderBottom: "1px solid #E7E6E2", whiteSpace: "nowrap" }}>
                        Vis (m)
                      </td>
                      {monthlyConditions.map((mc) => {
                        const tone = visTone(mc.visibilityM.min);
                        return (
                          <td key={mc.month} style={{ padding: "0.4rem 0.35rem", background: "#FFFFFF", borderBottom: "1px solid #E7E6E2", borderLeft: "1px solid #E7E6E2" }}>
                            <CellChip label={`${mc.visibilityM.min}`} tone={tone} />
                          </td>
                        );
                      })}
                    </tr>
                    {/* Current row */}
                    <tr>
                      <td style={{ ...MONO, fontSize: "10px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4A5568", padding: "0.5rem 0.75rem", background: "#FFFFFF", whiteSpace: "nowrap" }}>
                        Current
                      </td>
                      {monthlyConditions.map((mc) => {
                        const tone = currentTone(mc.currentStrength);
                        return (
                          <td key={mc.month} style={{ padding: "0.4rem 0.35rem", background: "#FFFFFF", borderLeft: "1px solid #E7E6E2" }}>
                            <CellChip label={CURRENT_STRENGTH_VALUE[mc.currentStrength] ?? mc.currentStrength} tone={tone} />
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {/* STORY 4.5: ENCOUNTER ODDS — species section */}
          {encounters.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>
                Your chances of seeing each animal
                <InfoButton onClick={() => setInfo("chances")} label="How this is worked out" />
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, ...SECTION_CARD }}>
                {encounters.map((e, i) => (
                  <Link
                    key={e.key}
                    href={e.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1rem 1.25rem",
                      borderTop: i === 0 ? "none" : "1px solid #E7E6E2",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    {/* Species photo — Story 4.5: w-24 h-24 style */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {e.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.imageUrl}
                          alt={e.name}
                          loading="lazy"
                          width={48}
                          height={48}
                          style={{ width: 48, height: 48, borderRadius: "6px", objectFit: "cover", display: "block", background: "#0E4F6E" }}
                        />
                      ) : (
                        <div aria-hidden="true" style={{ width: 48, height: 48, borderRadius: "6px", background: "#0E4F6E", flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Story 4.5: common name in font-serif, no IUCN in visible display */}
                      <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1rem", fontWeight: 400, color: "#0E1C28", marginBottom: "0.15rem" }}
                        // Keep IUCN data in aria for accessibility without showing it visually
                        aria-label={e.iucnLabel ? `${e.name} (${e.iucnLabel})` : e.name}
                      >
                        {e.name}
                      </p>
                      {e.where ? <p className="enc-where" style={{ ...MONO, fontSize: "11px", color: "#4A5568", marginBottom: "0.1rem" }}>{e.where}</p> : null}
                      {/* Story 4.5: last confirmed date */}
                      {e.lastConfirmedDate ? (
                        <p style={{ ...MONO, fontSize: "11px", color: "#4A5568" }}>
                          Last confirmed {formatDate(e.lastConfirmedDate)}
                          {e.recentCount !== null ? ` · ${e.recentCount} records` : ""}
                        </p>
                      ) : null}
                      {/* Photo attribution */}
                      {e.imageAttribution ? (
                        <p style={{ ...MONO, fontSize: "11px", color: "#4A5568", marginTop: "0.1rem" }}>{e.imageAttribution}</p>
                      ) : null}
                    </div>
                    <div style={{ width: 140, flexShrink: 0 }}>
                      {/* Story 4.5: sighting odds in font-mono font-medium */}
                      <p style={{ ...MONO, fontSize: "0.8125rem", fontWeight: 600, marginBottom: "0.35rem", color: e.chanceColor }}>{e.chanceLabel}</p>
                      <div style={{ height: 5, borderRadius: 3, background: "#E7E6E2", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${e.fillPct}%`, background: e.fillColor }} />
                      </div>
                      <p style={{ ...MONO, fontSize: "0.6875rem", color: "#4A5568", marginTop: "0.35rem" }}>{e.frequency}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={speciesIndexHref} style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.8125rem", fontWeight: 600, color: "#0E4F6E", textDecoration: "none" }}>
                See all species recorded here →
              </Link>
            </section>
          ) : null}

          {/* STORY 4.6: SIGHTING LOG — field journal */}
          <section style={{ marginBottom: "3rem" }}>
            <p style={LABEL_STYLE}>Field journal</p>
            <SightingLog entries={sightingEntries} siteSlug={siteSlug} />
          </section>

          {/* STORY 4.4: UPLOAD NUDGE CARD */}
          <div style={{ border: "1.5px solid #F6C700", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontWeight: 500, color: "#0E1C28", marginBottom: "0.25rem" }}>
              Dived here recently?
            </p>
            <p style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontSize: "0.875rem", color: "#4A5568", marginBottom: "0.75rem" }}>
              Your sighting helps us track reef health at this site in real time.
            </p>
            <Link
              href={`/upload?site=${encodeURIComponent(siteSlug)}`}
              style={{
                display: "inline-block",
                background: "#F6C700",
                color: "#0E1C28",
                fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                fontWeight: 500,
                fontSize: "0.875rem",
                padding: "0.5rem 1rem",
                borderRadius: "2px",
                textDecoration: "none",
                minHeight: 44,
                lineHeight: "1.5",
              }}
            >
              Submit a sighting
            </Link>
          </div>

          {/* STORY 4.4: PRE-DIVE BRIEF CARD */}
          <details style={{ border: "1px solid #E7E6E2", borderRadius: "8px", padding: "1.25rem", marginBottom: "3rem" }}>
            <summary style={{ fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif', fontWeight: 500, cursor: "pointer", color: "#0E1C28", listStyle: "none" }}>
              Planning to dive {siteName}?
            </summary>
            <div style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "#4A5568", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <p>Your underwater photos help scientists track reef health here in real time.</p>
              <p><strong style={{ color: "#0E1C28" }}>What to photograph:</strong> fish and marine life, coral (especially anything pale or unusual), anything unexpected.</p>
              <p><strong style={{ color: "#0E1C28" }}>How to capture it:</strong> shoot JPEG, keep location on, note your depth and the date.</p>
              <p><Link href="/data" style={{ color: "#0E4F6E", textDecoration: "underline" }}>How does this work?</Link></p>
            </div>
          </details>

          {/* CONTRIBUTE — sighting submission */}
          <section style={{ marginBottom: "3rem" }}>
            <SubmissionForm
              mode="site"
              siteId={siteId}
              siteName={siteName}
              siteLat={siteLat}
              siteLng={siteLng}
            />
          </section>

          {/* GEAR */}
          {gearGroups.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>Gear</p>
              <div style={{ ...SECTION_CARD, padding: "1.1rem 1.4rem" }}>
                <ul style={{ display: "flex", flexDirection: "column", gap: 0, listStyle: "none", margin: 0, padding: 0 }}>
                  {gearGroups.map((group, gi) => (
                    <li key={group.label} style={{ listStyle: "none" }}>
                      <p style={{ ...MONO, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4A5568", margin: gi === 0 ? "0 0 0.2rem" : "1.1rem 0 0.2rem" }}>
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

        {/* ============================ RIGHT — Plan your dive (desktop sticky sidebar) ============================ */}
        <aside className="site-sidebar" style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}>
          <TripSidebarContent />
        </aside>
      </div>

      {/* STORY 4.7: MOBILE BOTTOM SHEET — Plan my trip button + sheet */}
      {hasTrip ? (
        <>
          {/* Fixed mobile button — hidden on desktop via lg:hidden (media query below) */}
          <button
            type="button"
            onClick={() => setTripSheetOpen(true)}
            className="mobile-trip-btn"
            style={{
              position: "fixed",
              bottom: "1rem",
              right: "1rem",
              background: "#0E1C28",
              color: "#FFFFFF",
              fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
              fontWeight: 500,
              fontSize: "0.875rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "2px",
              border: "none",
              boxShadow: "0 4px 24px rgba(14,28,40,0.25)",
              zIndex: 50,
              cursor: "pointer",
              minHeight: 44,
              minWidth: 44,
            }}
            aria-label="Plan my trip"
          >
            Plan my trip
          </button>

          {/* Bottom sheet overlay */}
          {tripSheetOpen ? (
            <>
              {/* Backdrop */}
              <div
                onClick={() => setTripSheetOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "rgba(14,28,40,0.45)",
                  zIndex: 60,
                }}
                aria-hidden="true"
              />
              {/* Sheet */}
              <div
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "#FFFFFF",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  padding: "1.5rem 1.25rem",
                  boxShadow: "0 -8px 40px rgba(14,28,40,0.18)",
                  zIndex: 70,
                  maxHeight: "85vh",
                  overflowY: "auto",
                }}
                role="dialog"
                aria-label="Plan your dive"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <p style={{ fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif', fontSize: "1.2rem", fontWeight: 400, color: "#0E1C28" }}>
                    Plan your dive
                  </p>
                  <button
                    type="button"
                    onClick={() => setTripSheetOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "0.5rem", color: "#4A5568", fontSize: "1.25rem", minHeight: 44, minWidth: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <TripSidebarContent />
              </div>
            </>
          ) : null}
        </>
      ) : null}

      {/* Info popups */}
      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}

      <style>{`
        .trip-expand[open] .trip-chev { transform: rotate(180deg); }
        .trip-expand summary::-webkit-details-marker { display: none; }
        @media (max-width: 1024px) {
          .site-body-grid { grid-template-columns: 1fr !important; }
          .site-sidebar { display: none !important; }
        }
        @media (min-width: 1025px) {
          .mobile-trip-btn { display: none !important; }
        }
        @media (max-width: 768px) {
          .site-body-grid { gap: 2rem !important; }
        }
        @media (max-width: 640px) {
          .cond-grid { grid-template-columns: repeat(2,1fr) !important; }
          .enc-where { display: none; }
        }
      `}</style>
    </div>
  );
}
