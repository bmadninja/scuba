"use client";

import { useState } from "react";
import Link from "next/link";
import { AffiliateLink } from "@/components/affiliate-link";
import { AtlasInfoPopup, InfoButton } from "@/components/atlas-info-popup";
import type { InfoKey } from "@/components/atlas-info-popup";

// ─── Serializable view-model passed from the server page ──────────────────────

export type ConditionCard = {
  icon: string;
  label: string;
  value: string;
  sub: string | null;
};

export type EncounterRow = {
  key: string;
  href: string;
  icon: string;
  imageUrl: string | null;
  name: string;
  where: string | null;
  chanceLabel: string;
  chanceColor: string;
  fillPct: number;
  fillColor: string;
  frequency: string;
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
  intro: string | null;
  conditions: ConditionCard[];
  encounters: EncounterRow[];
  speciesIndexHref: string;
  gearGroups: GearGroup[];
  tripTitle: string;
  tripFacts: TripFact[];
  monthCells: { letter: string; on: boolean; now: boolean }[];
  getThere: GetThereView;
  operators: OperatorItem[];
  lodging: LodgingItem[];
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

// The three citizen-science platforms. Static one-line descriptors, each
// opens its own info popup; the section closes with a Method-page link.
const CONTRIBUTE_PLATFORMS: {
  name: string;
  desc: string;
  info: InfoKey;
}[] = [
  { name: "iNaturalist", desc: "Photograph anything you see. No training needed.", info: "inaturalist" },
  { name: "CoralWatch", desc: "Match coral colour to a chart. A few minutes.", info: "coralwatch" },
  { name: "Reef Check", desc: "Run a standard fish survey. Free training.", info: "reefcheck" },
];

function ExternalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  );
}

function Expand({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }} className="trip-expand">
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

export function SitePageBody(props: SiteBodyProps) {
  const [info, setInfo] = useState<InfoKey | null>(null);

  const {
    siteId,
    intro,
    conditions,
    encounters,
    speciesIndexHref,
    gearGroups,
    tripTitle,
    tripFacts,
    monthCells,
    getThere,
    operators,
    lodging,
  } = props;

  const hotels = lodging.filter((l) => l.kind === "hotel");
  const liveaboards = lodging.filter((l) => l.kind === "liveaboard");
  const PRICE_DOTS = ["·", "··", "···", "····"];

  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem clamp(1rem, 4vw, 3rem) 4rem", overflowX: "hidden" }}>
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
          {/* INTRO — generic place setting */}
          {intro ? (
            <div style={{ marginBottom: "3rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "1.25rem",
                  lineHeight: 1.75,
                  color: "#aebcd0",
                  maxWidth: 700,
                }}
              >
                {intro}
              </p>
            </div>
          ) : null}

          {/* CONDITIONS — plain-labeled grid */}
          {conditions.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>
                Conditions
                <InfoButton onClick={() => setInfo("conditions")} label="What these mean" />
              </p>
              <div className="cond-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                {conditions.map((c) => (
                  <div key={c.label} style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1rem", padding: "1.1rem 1.2rem", background: "#0a1628" }}>
                    <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.25rem" }}>{c.label}</p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#f0f4f8" }}>{c.value}</p>
                    {c.sub ? <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.15rem" }}>{c.sub}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ENCOUNTER ODDS — your chances of seeing each animal */}
          {encounters.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
              <p style={LABEL_STYLE}>
                Your chances of seeing each animal
                <InfoButton onClick={() => setInfo("chances")} label="How this is worked out" />
                <InfoButton onClick={() => setInfo("iucn")} label="What the conservation labels mean" />
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1.25rem", overflow: "hidden" }}>
                {encounters.map((e, i) => (
                  <Link
                    key={e.key}
                    href={e.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "1.1rem 1.4rem",
                      borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.10)",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    {e.imageUrl ? (
                      <img
                        src={e.imageUrl}
                        alt=""
                        loading="lazy"
                        width={40}
                        height={40}
                        style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.6rem", objectFit: "cover", flexShrink: 0, background: "rgba(255,255,255,0.05)" }}
                      />
                    ) : (
                      <div aria-hidden="true" style={{ width: "2.5rem", height: "2.5rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#f0f4f8", display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                        {e.name}
                        {e.iucnLabel && e.iucnBadge ? (
                          <span style={{ display: "inline-block", fontSize: "0.5625rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 999, whiteSpace: "nowrap", background: e.iucnBadge.bg, color: e.iucnBadge.color }}>
                            {e.iucnLabel}
                          </span>
                        ) : null}
                      </p>
                      {e.where ? <p className="enc-where" style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.2rem" }}>{e.where}</p> : null}
                    </div>
                    <div style={{ width: 160, flexShrink: 0 }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 700, marginBottom: "0.35rem", color: e.chanceColor }}>{e.chanceLabel}</p>
                      <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${e.fillPct}%`, background: e.fillColor }} />
                      </div>
                      <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.35rem" }}>{e.frequency}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={speciesIndexHref} style={{ display: "inline-block", marginTop: "0.95rem", fontSize: "0.8125rem", fontWeight: 600, color: "#00d4ff", textDecoration: "none" }}>
                See all species recorded here →
              </Link>
            </section>
          ) : null}

          {/* CONTRIBUTE — diving here? add what you see */}
          <section style={{ marginBottom: "3rem" }}>
            <div style={{ border: "1px solid rgba(0,212,255,0.18)", background: "rgba(0,212,255,0.05)", borderRadius: "1.25rem", padding: "1.5rem 1.6rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f0f4f8", marginBottom: "0.4rem", letterSpacing: "-0.02em" }}>
                Diving here? Add what you see
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#aebcd0", lineHeight: 1.6, marginBottom: "1rem", maxWidth: 560 }}>
                Your photos become part of the public record scientists use. Pick how involved you want to be.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: "0.25rem" }}>
                {CONTRIBUTE_PLATFORMS.map((p, i) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setInfo(p.info)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.85rem",
                      padding: "0.75rem 0",
                      borderTop: i === 0 ? "none" : "1px solid rgba(0,212,255,0.12)",
                      background: "none",
                      border: i === 0 ? "none" : undefined,
                      borderLeft: "none",
                      borderRight: "none",
                      borderBottom: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      color: "inherit",
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#f0f4f8" }}>{p.name}</span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "#8b9db8" }}>{p.desc}</span>
                    </span>
                    <span aria-hidden="true" style={{ marginLeft: "auto", color: "#00d4ff", flexShrink: 0, fontSize: "1.1rem" }}>›</span>
                  </button>
                ))}
              </div>
              <Link href="/data#sightings" style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#00d4ff", textDecoration: "none", display: "inline-block", marginTop: "0.85rem" }}>
                See how submitting and verifying works on the Method page →
              </Link>
            </div>
          </section>

          {/* GEAR — two layers, minimal */}
          {gearGroups.length > 0 ? (
            <section style={{ marginBottom: "3rem" }}>
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

        {/* ============================ RIGHT — Plan your dive ============================ */}
        <aside style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}>
          <div style={{ border: "1px solid rgba(255,255,255,0.10)", borderRadius: "1.4rem", boxShadow: "0 12px 40px -16px rgba(0,0,0,0.5)", overflow: "hidden", background: "#0a1628" }}>
            <div style={{ padding: "1.5rem 1.6rem 1.1rem" }}>
              <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.5rem" }}>
                Plan your dive
              </p>
              <p style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#f0f4f8", lineHeight: 1.15 }}>{tripTitle}</p>
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
                    <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8b9db8", marginBottom: "0.2rem" }}>Getting on the water</p>
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
                      productId={op.productId}
                      siteId={siteId}
                      isAffiliate={op.isAffiliate}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f0f4f8" }}>{op.label}</span>
                        <ExternalIcon />
                      </div>
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
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f0f4f8", flex: 1 }}>{h.label}</span>
                        {h.priceLevel ? (
                          <span style={{ fontSize: "0.6875rem", color: "#8b9db8", flexShrink: 0 }}>{PRICE_DOTS[h.priceLevel - 1]}</span>
                        ) : null}
                        <ExternalIcon />
                      </div>
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
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55rem 0.75rem", borderRadius: "0.6rem", background: "rgba(255,255,255,0.05)", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f0f4f8", flex: 1 }}>{l.label}</span>
                        {l.priceLevel ? (
                          <span style={{ fontSize: "0.6875rem", color: "#8b9db8", flexShrink: 0 }}>{PRICE_DOTS[l.priceLevel - 1]}</span>
                        ) : null}
                        <ExternalIcon />
                      </div>
                    </AffiliateLink>
                  ))}
                </div>
              </Expand>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Info popups (conditions / chances / IUCN / contribute platforms) */}
      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}

      <style>{`
        .trip-expand[open] .trip-chev { transform: rotate(180deg); }
        .trip-expand summary::-webkit-details-marker { display: none; }
        @media (max-width: 1024px) {
          .site-body-grid { grid-template-columns: 1fr !important; }
          .site-body-grid aside { position: static !important; }
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
