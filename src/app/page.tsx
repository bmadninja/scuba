import type { Metadata } from "next";
import Link from "next/link";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { AtlasNav } from "@/components/atlas-nav";
import { HideLayoutNav } from "@/components/hide-layout-nav";
import { LandingTestimonial } from "@/components/landing-testimonial";
import { FadeInSection } from "@/components/landing-fade-section";

export const metadata: Metadata = {
  title: "scubaSeason.fun — Where to dive. What you'll actually see.",
  description:
    "A live atlas of 500+ dive sites — reef health, confirmed species sightings, real conditions and everything you need to plan a dive that matters.",
};

// ─── shared token shortcuts ───────────────────────────────────────
const C = {
  bg:        "#030712",
  surface:   "#0a1628",
  border:    "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.12)",
  text:      "#f0f4f8",
  textMid:   "#aebcd0",
  textMuted: "#8b9db8",
  cyan:      "#00d4ff",
  cyanDim:   "rgba(0,212,255,0.12)",
  cyanRing:  "rgba(0,212,255,0.25)",
  // reef states
  thr: "#6ee7b7", thrBg: "rgba(52,211,153,0.12)",  thrRing: "rgba(52,211,153,0.2)",
  pre: "#fcd34d", preBg: "rgba(251,191,36,0.12)",   preRing: "rgba(251,191,36,0.2)",
  chg: "#fda4af", chgBg: "rgba(251,113,133,0.12)",  chgRing: "rgba(251,113,133,0.2)",
} as const;

function StateBadge({
  variant,
  style,
}: {
  variant: "thr" | "pre" | "chg";
  style?: React.CSSProperties;
}) {
  const map = {
    thr: { color: C.thr, bg: C.thrBg, ring: C.thrRing, label: "Thriving" },
    pre: { color: C.pre, bg: C.preBg, ring: C.preRing, label: "Under pressure" },
    chg: { color: C.chg, bg: C.chgBg, ring: C.chgRing, label: "Witnessing change" },
  };
  const { color, bg, ring, label } = map[variant];
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        padding: "0.25rem 0.75rem",
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.04em",
        textAlign: "center",
        whiteSpace: "nowrap",
        color,
        background: bg,
        boxShadow: `0 0 0 1px ${ring} inset`,
        ...style,
      }}
    >
      {label}
    </span>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        borderRadius: 999,
        padding: "0.175rem 0.625rem",
        fontSize: "0.625rem",
        fontWeight: 600,
        border: `1px solid ${C.border}`,
        color: muted ? C.textMuted : C.cyan,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SecLabel({ n, label }: { n: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.5875rem",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.textMuted,
        marginBottom: "1.375rem",
      }}
    >
      <span style={{ display: "block", width: 18, height: 1, background: C.textMuted }} />
      {n} · {label}
    </div>
  );
}

export default function Home() {
  const allLocs = getAllAtlasLocations();
  const navEntries = allLocs.map((l) => ({
    slug: l.slug,
    name: l.name,
    country: l.country,
    region: l.region,
    state: l.state,
  }));

  return (
    <>
      <HideLayoutNav />

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <div style={{ position: "relative" }}>
        <AtlasNav entries={navEntries} variant="hero" />

        <section
          aria-label="Hero"
          style={{
            position: "relative",
            minHeight: "clamp(540px, 78vh, 820px)",
            display: "flex",
            alignItems: "flex-end",
            overflow: "hidden",
          }}
        >
          {/* gradient bg fallback */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 80% 60% at 60% 30%, #0a2e4e 0%, #041526 45%, #030712 100%)",
            }}
          />
          {/* hero photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1675829604010-509cca710300?w=1920&q=85&auto=format&fit=crop"
            alt="Manta ray gliding over a coral reef"
            loading="eager"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 38%",
            }}
          />
          {/* gradient overlay */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(3,7,18,0.25) 0%, rgba(3,7,18,0.05) 30%, rgba(3,7,18,0.55) 70%, rgba(3,7,18,0.96) 100%)",
            }}
          />

          {/* content */}
          <div
            className="lp-hero-content"
            style={{
              position: "relative",
              zIndex: 2,
              width: "100%",
              maxWidth: 1320,
              margin: "0 auto",
              padding: "0 3rem 5rem",
            }}
          >
            {/* live badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.cyan,
                background: C.cyanDim,
                border: `1px solid ${C.cyanRing}`,
                borderRadius: 999,
                padding: "0.3rem 0.75rem",
                marginBottom: "1.375rem",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: C.cyan,
                  animation: "blink 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              Live data · 63 sources
            </div>

            <h1
              style={{
                fontSize: "clamp(2.25rem, 4.8vw, 4rem)",
                fontWeight: 800,
                letterSpacing: "-0.038em",
                lineHeight: 1.04,
                color: "#fff",
                maxWidth: 620,
                textShadow: "0 2px 32px rgba(3,7,18,0.7)",
                marginBottom: "1.125rem",
              }}
            >
              Where to dive.
              <br />
              What you&apos;ll
              <br />
              actually see.
            </h1>

            <p
              style={{
                fontSize: "1.0625rem",
                lineHeight: 1.65,
                color: "rgba(240,244,248,0.78)",
                maxWidth: 490,
                textShadow: "0 1px 14px rgba(3,7,18,0.55)",
                marginBottom: "2.25rem",
              }}
            >
              A live atlas of 500+ dive sites — reef health, confirmed species sightings,
              real conditions and everything you need to plan a dive that matters.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/locations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: C.cyan,
                  color: C.bg,
                  padding: "0.8rem 1.625rem",
                  borderRadius: 999,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  transition: "background 150ms, transform 120ms",
                }}
              >
                Explore locations →
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        <div
          className="lp-wrap"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            overflowX: "auto",
            scrollbarWidth: "none",
            padding: "0 3rem",
          }}
        >
          {[
            { n: "500",  hi: true, label: "Dive sites", detail: "Across every major reef region" },
            { n: "63",   hi: false, label: "Live sources", detail: "Satellite · surveys · sightings" },
            { n: "3",    hi: false, label: "Reef states",  detail: "Assigned from data, not opinion" },
            { n: "Live", hi: false, label: "Updated daily", detail: "Reef states recalculated nightly", green: true },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flexShrink: 0,
                padding: "1.5rem 2.25rem",
                borderRight: `1px solid ${C.border}`,
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
              }}
            >
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  color: stat.green ? C.thr : C.text,
                  lineHeight: 1,
                }}
              >
                {stat.n}
                {stat.hi && <span style={{ color: C.cyan }}>+</span>}
              </span>
              <span
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 700,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                  marginTop: "0.25rem",
                }}
              >
                {stat.label}
              </span>
              <span style={{ fontSize: "0.75rem", color: C.textMuted, marginTop: "0.125rem" }}>
                {stat.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ TESTIMONIAL ══════════════════════════════════════════════ */}
      <LandingTestimonial />

      {/* ══ §01 REEF STATES ══════════════════════════════════════════ */}
      <FadeInSection
        className="lp-section"
        style={{
          padding: "6rem 0",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div className="lp-wrap" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 3rem" }}>
          {/* two-col: text + state pills */}
          <div
            className="lp-2col"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "5rem",
              alignItems: "center",
              marginBottom: "3.5rem",
            }}
          >
            <div>
              <SecLabel n="§ 01" label="Reef states" />
              <h2
                style={{
                  fontSize: "clamp(1.875rem, 3.8vw, 3.125rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.07,
                  marginBottom: "1.125rem",
                }}
              >
                Know what every reef
                <br />
                looks like{" "}
                <em style={{ fontStyle: "normal", color: C.cyan }}>before you dive.</em>
              </h2>
              <p
                style={{
                  fontSize: "1.0625rem",
                  color: C.textMid,
                  lineHeight: 1.7,
                  maxWidth: 460,
                  marginBottom: "2.25rem",
                }}
              >
                Every site earns one of three honest states from coral cover measurements,
                satellite thermal stress and fishing pressure data. The state tells you what you
                will find in the water. For reefs witnessing change, we model trajectory — how
                fast cover is declining and when it may stabilise. For thriving reefs, we track
                the rate of gain. Every reef is worth diving.
              </p>
              <Link
                href="/locations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  color: C.cyan,
                  border: `1px solid ${C.cyanRing}`,
                  padding: "0.625rem 1.25rem",
                  borderRadius: 999,
                }}
              >
                Browse all locations →
              </Link>
            </div>

            {/* state pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", paddingTop: "0.25rem" }}>
              {[
                {
                  v: "thr" as const,
                  text: "High, stable or rising coral cover. Low thermal stress. Close to its natural baseline.",
                },
                {
                  v: "pre" as const,
                  text: "Still rewarding to dive, but coral cover is moderate or slipping under fishing and warming.",
                },
                {
                  v: "chg" as const,
                  text: "Visibly transforming after bleaching or heavy loss. Diving here documents what remains.",
                },
              ].map(({ v, text }) => (
                <div
                  key={v}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "148px 1fr",
                    gap: "0.875rem",
                    alignItems: "center",
                    padding: "0.875rem 1.125rem",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                  }}
                >
                  <StateBadge variant={v} />
                  <span style={{ fontSize: "0.875rem", color: C.textMid, lineHeight: 1.55 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3-card grid */}
          <div className="lp-loc-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.875rem" }}>
            {[
              {
                href: "/locations/raja-ampat-indonesia",
                photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/A_diver_in_Raja_Ampat_seascape.jpg/1280px-A_diver_in_Raja_Ampat_seascape.jpg",
                gradient: "linear-gradient(148deg,#064e3b 0%,#065f46 38%,#0e7490 70%,#0a1628 100%)",
                state: "thr" as const,
                name: "Raja Ampat",
                country: "Indonesia · Coral Triangle",
                hook: "62% coral cover and climbing inside a strictly enforced reserve.",
                chips: ["Manta ray", "Reef shark", "Sea turtle", "Pygmy seahorse"],
                extra: "+24 more",
              },
              {
                href: "/locations/florida-keys-usa",
                photo: "https://upload.wikimedia.org/wikipedia/commons/d/d1/FKNMS_-_Greg_Tech_Diving_Self_Portrait_%2827809301726%29.jpg",
                gradient: "linear-gradient(148deg,#78350f 0%,#92400e 40%,#1c3a5e 75%,#0a1628 100%)",
                state: "pre" as const,
                name: "Florida Keys",
                country: "United States · Caribbean",
                hook: "Lost 17 percentage points of coral since 1987. Structure and fish life hold.",
                chips: ["Goliath grouper", "Hawksbill turtle", "Reef shark"],
                extra: "+11 more",
              },
              {
                href: "/locations/great-barrier-reef-australia",
                photo: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80&auto=format&fit=crop",
                gradient: "linear-gradient(148deg,#881337 0%,#4c0519 45%,#1e1028 75%,#0a1628 100%)",
                state: "chg" as const,
                name: "Great Barrier Reef",
                country: "Australia · Pacific",
                hook: "Back-to-back bleaching 2016–2024. Diving here documents what survives.",
                chips: ["Green turtle", "Maori wrasse", "Coral trout"],
                extra: "+8 more",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "transform 220ms ease, border-color 150ms, box-shadow 220ms ease",
                }}
                className="landing-loc-card"
              >
                <div
                  style={{
                    position: "relative",
                    aspectRatio: "4/3",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: card.gradient,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.photo}
                    alt={card.name}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      transition: "transform 500ms ease",
                    }}
                    className="landing-card-img"
                    loading="lazy"
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      borderRadius: 999,
                      padding: "0.2rem 0.625rem",
                      fontSize: "0.625rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 1px 10px rgba(0,0,0,0.45)",
                      color:
                        card.state === "thr" ? C.thr : card.state === "pre" ? C.pre : C.chg,
                      background:
                        card.state === "thr"
                          ? C.thrBg
                          : card.state === "pre"
                          ? "rgba(180,120,0,0.72)"
                          : C.chgBg,
                    }}
                  >
                    {card.state === "thr"
                      ? "Thriving"
                      : card.state === "pre"
                      ? "Under pressure"
                      : "Witnessing change"}
                  </span>
                </div>
                <div
                  style={{
                    padding: "0.875rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                    flex: 1,
                  }}
                >
                  <div
                    style={{ fontSize: "0.9375rem", fontWeight: 700, color: C.text, lineHeight: 1.25 }}
                    className="landing-card-name"
                  >
                    {card.name}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: C.textMuted, marginTop: "0.05rem" }}>
                    {card.country}
                  </div>
                  <div
                    style={{ fontSize: "0.8rem", color: C.textMid, lineHeight: 1.5, marginTop: "0.35rem" }}
                  >
                    {card.hook}
                  </div>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginTop: "0.5rem" }}
                  >
                    {card.chips.map((c) => (
                      <Chip key={c}>{c}</Chip>
                    ))}
                    <Chip muted>{card.extra}</Chip>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* ══ §02 DATA SOURCES ══════════════════════════════════════════ */}
      <FadeInSection
        className="lp-section"
        style={{
          padding: "6rem 0",
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(10,22,40,0.45)",
        }}
      >
        <div
          className="lp-wrap lp-2col"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          {/* sources grid — left on this section (flip) */}
          <div>
            <div
              className="lp-sources-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 1,
                background: C.border,
                borderRadius: 14,
                overflow: "hidden",
                border: `1px solid ${C.border}`,
              }}
            >
              {[
                { tag: "Satellite",    name: "NOAA Coral Reef Watch",  note: "24-month thermal stress trace per site" },
                { tag: "In-water",     name: "Coral cover surveys",    note: "Timestamped, geo-fixed field records" },
                { tag: "Biological",   name: "Species sightings",      note: "Verified diver logs, proximity-matched" },
                { tag: "Pressure",     name: "Fishing effort index",   note: "Global Fishing Watch vessel data" },
                { tag: "Conservation", name: "IUCN Red List",          note: "Status for every tracked species" },
                { tag: "Conditions",   name: "Water quality data",     note: "Visibility, temp, current by month" },
              ].map((src) => (
                <div
                  key={src.tag}
                  style={{
                    background: C.surface,
                    padding: "1.125rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.3rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    {src.tag}
                  </span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text }}>
                    {src.name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: C.textMuted,
                      lineHeight: 1.45,
                      marginTop: "0.125rem",
                    }}
                  >
                    {src.note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* text — right */}
          <div>
            <SecLabel n="§ 02" label="Data sources" />
            <h2
              style={{
                fontSize: "clamp(1.875rem, 3.8vw, 3.125rem)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.07,
                marginBottom: "1.125rem",
              }}
            >
              63 sources.
              <br />
              <em style={{ fontStyle: "normal", color: C.cyan }}>One honest signal.</em>
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: C.textMid,
                lineHeight: 1.7,
                maxWidth: 460,
                marginBottom: "2.25rem",
              }}
            >
              The atlas reads satellite thermal stress, dated in-water surveys, species sighting
              databases, fishing pressure indices and coral cover assessments, synthesised into a
              single state. No editorial. No tourism bias. Just what the data says.
            </p>
            <Link
              href="/data"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: C.cyan,
                border: `1px solid ${C.cyanRing}`,
                padding: "0.625rem 1.25rem",
                borderRadius: 999,
              }}
            >
              Read the methodology →
            </Link>
          </div>
        </div>
      </FadeInSection>

      {/* ══ TELA CALLOUT ══════════════════════════════════════════════ */}
      <div className="lp-tela" style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem 3rem 0" }}>
        <div
          style={{
            borderLeft: `3px solid ${C.thr}`,
            padding: "1.75rem 2rem",
            background: "rgba(52,211,153,0.04)",
            display: "flex",
            alignItems: "center",
            gap: "3rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: C.thr,
                marginBottom: "0.625rem",
              }}
            >
              Surprising finding
            </div>
            <div
              style={{
                fontSize: "1.1875rem",
                fontWeight: 700,
                color: C.text,
                lineHeight: 1.35,
                letterSpacing: "-0.015em",
              }}
            >
              The only thriving reef in the Caribbean. Tela, Honduras.
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: C.textMuted,
                marginTop: "0.5rem",
                lineHeight: 1.55,
              }}
            >
              Every other tracked Caribbean reef is under pressure or witnessing change.
            </div>
            <Link
              href="/locations/tela-honduras"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: C.thr,
                marginTop: "0.875rem",
                border: `1px solid ${C.thrRing}`,
                padding: "0.4rem 0.875rem",
                borderRadius: 999,
              }}
            >
              See Tela, Honduras →
            </Link>
          </div>
          <div style={{ display: "flex", gap: "2.5rem", flexShrink: 0 }}>
            {[
              { n: "1",   sub: "Thriving", color: C.thr },
              { n: "62%", sub: "Coral cover", color: C.text },
              { n: "11",  sub: "Sites tracked", color: C.text },
            ].map((s) => (
              <div key={s.sub} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: s.color,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontSize: "0.5625rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: C.textMuted,
                    marginTop: "0.25rem",
                  }}
                >
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* ══ §03 CONFIRMED SIGHTINGS ══════════════════════════════════ */}
      <FadeInSection
        className="lp-section"
        style={{ padding: "6rem 0", borderBottom: `1px solid ${C.border}` }}
      >
        <div
          className="lp-wrap lp-2col"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          <div>
            <SecLabel n="§ 03" label="Confirmed sightings" />
            <h2
              style={{
                fontSize: "clamp(1.875rem, 3.8vw, 3.125rem)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.07,
                marginBottom: "1.125rem",
              }}
            >
              See the probability,
              <br />
              <em style={{ fontStyle: "normal", color: C.cyan }}>not the hope.</em>
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: C.textMid,
                lineHeight: 1.7,
                maxWidth: 460,
                marginBottom: "2.25rem",
              }}
            >
              Every site shows which species have been confirmed by real diver logs in the last
              24 months. IUCN conservation status, how recently each was seen, and how rare a
              confirmed sighting is across the entire atlas.
            </p>
            <Link
              href="/sites/looe-key-florida-keys"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: C.cyan,
                border: `1px solid ${C.cyanRing}`,
                padding: "0.625rem 1.25rem",
                borderRadius: 999,
              }}
            >
              See Looe Key →
            </Link>
          </div>

          {/* species panel */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "0.875rem 1.25rem",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: C.text }}>
                  Looe Key, Florida Keys
                </div>
                <div
                  style={{ fontSize: "0.6875rem", color: C.textMuted, marginTop: "0.1rem" }}
                >
                  24-month sighting window · 4 confirmed species
                </div>
              </div>
              <StateBadge variant="pre" />
            </div>

            {[
              {
                name: "Goliath grouper",
                status: "Vulnerable",
                statusStyle: {
                  background: "rgba(251,146,60,0.15)",
                  color: "#fdba74",
                },
                evColor: "#34d399",
                ev: "Last confirmed 11 days ago · 130 records",
              },
              {
                name: "Hawksbill turtle",
                status: "Critically endangered",
                statusStyle: {
                  background: "rgba(251,113,133,0.15)",
                  color: "#fda4af",
                },
                evColor: "#34d399",
                ev: "Last confirmed 6 days ago · 88 records",
              },
              {
                name: "Elkhorn coral",
                status: "Critically endangered",
                statusStyle: {
                  background: "rgba(251,113,133,0.15)",
                  color: "#fda4af",
                },
                evColor: "#fbbf24",
                ev: "Last confirmed 3 months ago · 24 records",
              },
              {
                name: "Caribbean reef shark",
                status: "Near threatened",
                statusStyle: {
                  background: "rgba(139,157,184,0.14)",
                  color: "#94a3b8",
                },
                evColor: "#34d399",
                ev: "Last confirmed 2 days ago · 175 records",
              },
            ].map((sp, i, arr) => (
              <div
                key={sp.name}
                style={{
                  padding: "0.875rem 1.25rem",
                  borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: C.text }}
                  >
                    {sp.name}
                  </span>
                  <span
                    style={{
                      borderRadius: 4,
                      padding: "0.125rem 0.4rem",
                      fontSize: "0.5625rem",
                      fontWeight: 800,
                      letterSpacing: "0.03em",
                      whiteSpace: "nowrap",
                      ...sp.statusStyle,
                    }}
                  >
                    {sp.status}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    marginTop: "0.4rem",
                    fontSize: "0.6875rem",
                    color: C.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: sp.evColor,
                      flexShrink: 0,
                    }}
                  />
                  {sp.ev}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* ══ §04 PLAN YOUR TRIP ══════════════════════════════════════ */}
      <FadeInSection
        className="lp-section"
        style={{
          padding: "6rem 0",
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(10,22,40,0.45)",
        }}
      >
        <div
          className="lp-wrap lp-2col"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "center",
          }}
        >
          {/* conditions panel — left (flip) */}
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: `1px solid ${C.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.75rem",
              }}
            >
              <div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text }}>
                  Komodo National Park
                </div>
                <div
                  style={{ fontSize: "0.6875rem", color: C.textMuted, marginTop: "0.125rem" }}
                >
                  Indonesia · Coral Triangle
                </div>
              </div>
              <StateBadge variant="thr" />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 1,
                background: C.border,
              }}
            >
              {[
                { k: "Best season", v: "Apr–Nov", d: "peak: May–Sep" },
                { k: "Water temp",  v: "26–29°C", d: "cool upwellings" },
                { k: "Skill level", v: "Advanced", d: "strong currents" },
              ].map((tile) => (
                <div
                  key={tile.k}
                  style={{
                    background: C.surface,
                    padding: "0.875rem 1.125rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    {tile.k}
                  </span>
                  <span
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: C.text,
                      lineHeight: 1.15,
                    }}
                  >
                    {tile.v}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: C.textMuted }}>
                    {tile.d}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.textMuted,
                  marginBottom: "0.5rem",
                }}
              >
                Season calendar — June highlighted
              </div>
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 3 }}
              >
                {[
                  { mo: "Jan", t: "off" },
                  { mo: "Feb", t: "off" },
                  { mo: "Mar", t: "off" },
                  { mo: "Apr", t: "good" },
                  { mo: "May", t: "good" },
                  { mo: "Jun", t: "peak" },
                  { mo: "Jul", t: "good" },
                  { mo: "Aug", t: "good" },
                  { mo: "Sep", t: "good" },
                  { mo: "Oct", t: "good" },
                  { mo: "Nov", t: "good" },
                  { mo: "Dec", t: "off" },
                ].map(({ mo, t }) => (
                  <div
                    key={mo}
                    style={{
                      borderRadius: 4,
                      padding: "0.375rem 0",
                      textAlign: "center",
                      fontSize: "0.5rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background:
                        t === "peak"
                          ? C.cyan
                          : t === "good"
                          ? "rgba(0,212,255,0.14)"
                          : "rgba(255,255,255,0.05)",
                      color:
                        t === "peak"
                          ? C.bg
                          : t === "good"
                          ? C.cyan
                          : C.textMuted,
                    }}
                  >
                    {mo}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "2rem",
                padding: "0.875rem 1.25rem",
                borderTop: `1px solid ${C.border}`,
                flexWrap: "wrap",
              }}
            >
              {[
                { k: "Access",       v: "Liveaboard" },
                { k: "Nearest hub",  v: "Labuan Bajo" },
                { k: "Operators",    v: "3 listed →", cyan: true },
              ].map((acc) => (
                <div key={acc.k} style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span
                    style={{
                      fontSize: "0.5625rem",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                    }}
                  >
                    {acc.k}
                  </span>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: acc.cyan ? C.cyan : C.textMid,
                    }}
                  >
                    {acc.v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* text — right */}
          <div>
            <SecLabel n="§ 04" label="Plan your trip" />
            <h2
              style={{
                fontSize: "clamp(1.875rem, 3.8vw, 3.125rem)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.07,
                marginBottom: "1.125rem",
              }}
            >
              From reef state
              <br />
              <em style={{ fontStyle: "normal", color: C.cyan }}>to departure gate.</em>
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: C.textMid,
                lineHeight: 1.7,
                maxWidth: 460,
                marginBottom: "2.25rem",
              }}
            >
              Every site carries conditions, season calendars, skill requirements, access routes
              and recommended operators. The planning is as considered as the diving itself.
            </p>
            <Link
              href="/locations"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: C.cyan,
                border: `1px solid ${C.cyanRing}`,
                padding: "0.625rem 1.25rem",
                borderRadius: 999,
              }}
            >
              Browse locations →
            </Link>
          </div>
        </div>
      </FadeInSection>

      {/* ══ §05 EL NIÑO + SCIENCE CONTRIBUTION ══════════════════════ */}
      <FadeInSection
        className="lp-section"
        style={{
          padding: "6rem 0",
          borderBottom: `1px solid ${C.border}`,
          background: "rgba(251,113,133,0.03)",
        }}
      >
        <div
          className="lp-wrap lp-2col"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "5rem",
            alignItems: "start",
          }}
        >
          {/* left: context */}
          <div>
            <SecLabel n="§ 05" label="The bigger picture" />
            <h2
              style={{
                fontSize: "clamp(1.875rem, 3.8vw, 3.125rem)",
                fontWeight: 800,
                letterSpacing: "-0.035em",
                lineHeight: 1.07,
                marginBottom: "1.125rem",
              }}
            >
              Every dive can be{" "}
              <em style={{ fontStyle: "normal", color: C.chg }}>a data point.</em>
            </h2>
            <p
              style={{
                fontSize: "1.0625rem",
                color: C.textMid,
                lineHeight: 1.7,
                maxWidth: 460,
                marginBottom: "2.25rem",
              }}
            >
              The 4th global bleaching event (2023 to 2025) hit 84% of the world&apos;s reefs.
              A new El Niño is building. Every photo, colour score or survey transect you submit
              feeds the databases that shape reef policy worldwide.
            </p>
            <Link
              href="/data#sightings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: C.cyan,
                border: `1px solid ${C.cyanRing}`,
                padding: "0.625rem 1.25rem",
                borderRadius: 999,
              }}
            >
              How to submit your observations →
            </Link>
          </div>

          {/* right: three org cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.25rem" }}>
            {[
              {
                name: "iNaturalist",
                action: "Photograph anything you see",
                detail: "One clear photo, uploaded after the dive. The community confirms the ID to research grade. Your record feeds GBIF, OBIS and the IUCN Red List.",
                color: "#6ee7b7",
                bg: "rgba(52,211,153,0.08)",
                ring: "rgba(52,211,153,0.18)",
              },
              {
                name: "CoralWatch",
                action: "Match coral colour to a chart",
                detail: "Hold the Coral Health Chart next to a coral and note the score. Takes a few minutes. Repeated scores at the same reef are how early bleaching gets caught.",
                color: "#fcd34d",
                bg: "rgba(251,191,36,0.08)",
                ring: "rgba(251,191,36,0.18)",
              },
              {
                name: "Reef Check",
                action: "Run a standard survey transect",
                detail: "Count set lists of fish and invertebrates along a measured transect. Free diver training available. The same method worldwide since 1997.",
                color: "#fda4af",
                bg: "rgba(251,113,133,0.08)",
                ring: "rgba(251,113,133,0.18)",
              },
            ].map(({ name, action, detail, color, bg, ring }) => (
              <div
                key={name}
                style={{
                  background: bg,
                  border: `1px solid ${ring}`,
                  borderRadius: 14,
                  padding: "1.125rem 1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color,
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: C.text,
                    }}
                  >
                    — {action}
                  </span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: C.textMid, lineHeight: 1.6, margin: 0 }}>
                  {detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </FadeInSection>

      {/* ══ CTA BAND ════════════════════════════════════════════════ */}
      <FadeInSection>
        <div className="lp-wrap" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 3rem" }}>
          <div
            className="lp-cta-band"
            style={{
              background: "linear-gradient(135deg, #061428 0%, #0b1e36 50%, #060f20 100%)",
              border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: 20,
              padding: "3.75rem 4rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "3rem",
              alignItems: "center",
              margin: "5rem 0 6rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: -100,
                right: -60,
                width: 400,
                height: 400,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(0,212,255,0.04) 0%, transparent 65%)",
                pointerEvents: "none",
              }}
            />
            <div>
              <h2
                style={{
                  fontSize: "clamp(1.75rem, 3.5vw, 2.875rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.035em",
                  lineHeight: 1.08,
                  marginBottom: "0.75rem",
                }}
              >
                Start with a reef.
                <br />
                End with a plan.
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: C.textMid,
                  maxWidth: 520,
                  lineHeight: 1.65,
                }}
              >
                Browse 500+ dive sites by state, skill, season and species. Every site has live
                conditions, confirmed sightings and everything you need before you book.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
                minWidth: 200,
              }}
            >
              <Link
                href="/locations"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  background: C.cyan,
                  color: C.bg,
                  padding: "0.875rem 1.75rem",
                  borderRadius: 999,
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                }}
              >
                Explore locations →
              </Link>
            </div>
          </div>
        </div>
      </FadeInSection>

      {/* hover styles for location cards */}
      <style>{`
        .landing-loc-card:hover .landing-card-img { transform: scale(1.03); }
        .landing-loc-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0,212,255,0.25) !important;
          box-shadow: 0 2px 4px rgba(16,40,70,.06), 0 14px 32px -18px rgba(16,40,70,.22);
        }
        .landing-loc-card:hover .landing-card-name {
          color: #00d4ff !important;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @media (max-width: 640px) {
          .lp-cta-band { padding: 2rem 1.5rem !important; }
        }
      `}</style>
    </>
  );
}
