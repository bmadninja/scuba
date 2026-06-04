import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas-explorer";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { STATE_DEF } from "@/lib/data/reef-state";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import sourcesData from "@/data/sources.json";
import { AtlasNav } from "@/components/atlas-nav";
import { HideLayoutNav } from "@/components/hide-layout-nav";

// Homepage hero — manta ray, Grand Cayman. Unsplash free license
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1675829604010-509cca710300?w=3840&q=90&auto=format&fit=crop";

export const metadata: Metadata = {
  title: "scubaSeason.fun — a data atlas for the living ocean",
  description:
    "Browse every tracked reef by coral health, thermal stress and survey freshness. Built on ongoing science and daily monitoring, not a one-time write-up.",
};

// Top 3 featured destinations for the inspiration grid
const FEATURED_SLUGS = ["raja-ampat-indonesia", "blue-corner-palau", "azores-portugal"];

// Animal tags per featured slug (curated for inspiration grid)
const ANIMAL_TAGS: Record<string, string[]> = {
  "raja-ampat-indonesia": ["Sharks", "Mantas"],
  "blue-corner-palau": ["Sharks", "Jellyfish"],
  "azores-portugal": ["Dolphins", "Whales"],
};

// Destination gradient backgrounds
const DEST_GRADIENT: Record<string, string> = {
  "raja-ampat-indonesia":
    "linear-gradient(160deg, #041c33 0%, #063a52 25%, #065a66 45%, #086b7a 65%, #0a7a6b 100%)",
  "blue-corner-palau":
    "linear-gradient(155deg, #031522 0%, #042338 25%, #064466 50%, #0a6b8a 75%, #0b829f 100%)",
  "azores-portugal":
    "linear-gradient(150deg, #0a1f38 0%, #0d2e4e 30%, #103a5e 55%, #124870 80%, #0f3d61 100%)",
  default:
    "linear-gradient(155deg, #0b1e32 0%, #0d2e4e 30%, #0e3d5e 60%, #094a6a 100%)",
};

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

// Badge style per state — matches mockup ibadge-state-* classes
const STATE_BADGE_STYLE: Record<string, React.CSSProperties> = {
  thriving: {
    background: "rgba(16,185,129,0.14)",
    color: "#6ee7b7",
    border: "1px solid rgba(16,185,129,0.22)",
  },
  pressure: {
    background: "rgba(0,137,222,0.16)",
    color: "#93c5fd",
    border: "1px solid rgba(0,137,222,0.25)",
  },
  change: {
    background: "rgba(244,63,94,0.14)",
    color: "#fca5a5",
    border: "1px solid rgba(244,63,94,0.2)",
  },
};

const BADGE_BASE: React.CSSProperties = {
  fontSize: "0.625rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  padding: "0.25rem 0.625rem",
  borderRadius: 999,
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "inline-block",
};

const SEASON_BADGE: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.7)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const ANIMAL_BADGE: React.CSSProperties = {
  ...BADGE_BASE,
  background: "rgba(255,255,255,0.07)",
  color: "rgba(255,255,255,0.55)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function Home() {
  const allLocs = getAllAtlasLocations();
  const rawBySlug = new Map(getAllLocations().map((l) => [l.slug, l]));

  // Search entries for the hero nav (same shape as layout.tsx passes to AtlasNav)
  const navEntries = allLocs.map((l) => ({
    slug: l.slug,
    name: l.name,
    country: l.country,
    region: l.region,
    state: l.state,
  }));

  const currentMonth = new Date().getUTCMonth() + 1;
  const inSeason = (months: number[]) => months.includes(currentMonth);

  const filterLocs: FilterLocation[] = allLocs.flatMap((l) => {
    const raw = rawBySlug.get(l.slug);
    if (!raw) return [];
    const loc: FilterLocation = {
      slug: l.slug,
      name: l.name,
      country: l.country,
      hook: l.hook,
      state: l.state,
      cover: l.cover,
      coverYear: l.coverYear,
      season: l.season,
      skill: l.skill,
      heroImageUrl: l.heroImageUrl,
      inSeason: inSeason(l.bestMonths),
      region: l.region,
      bestMonths: l.bestMonths,
      heatLevel: l.heatLevel,
      lastSurveyDays: l.lastSurveyDays,
      lat: raw.lat,
      lng: raw.lng,
      countryCode: raw.countryCode,
      animalTags: l.animalTags ?? [],
    };
    return [loc];
  });

  const regions = Array.from(new Set(allLocs.map((l) => l.region))).sort();
  const skills = ["Beginner", "Open water", "Advanced", "Technical"];

  const reefCount = allLocs.length;
  const sourceCount = (sourcesData as unknown[]).length;

  // State counts
  const thrivingCount = allLocs.filter((l) => l.state === "thriving").length;
  const pressureCount = allLocs.filter((l) => l.state === "pressure").length;
  const changeCount = allLocs.filter((l) => l.state === "change").length;

  // Featured destinations for inspiration grid
  const featuredLocs = FEATURED_SLUGS.map((slug) => allLocs.find((l) => l.slug === slug))
    .filter(Boolean)
    .slice(0, 3);
  const inspirationLocs =
    featuredLocs.length >= 2 ? featuredLocs : allLocs.slice(0, 3);

  return (
    <>
      {/* Hide the sticky layout nav — we render our own inside the hero */}
      <HideLayoutNav />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 700,
          overflow: "hidden",
        }}
      >
        {/* Hero-variant transparent nav, absolutely positioned over the photo */}
        <AtlasNav entries={navEntries} variant="hero" />
        {/* Hero photo — reef manta ray, Raja Ampat */}
        <Image
          src={HERO_IMAGE_URL}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
          aria-hidden="true"
        />
        {/* Dark overlay so text stays legible */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(175deg, rgba(2,20,34,0.45) 0%, rgba(4,28,51,0.35) 30%, rgba(5,39,69,0.25) 55%, rgba(5,37,64,0.40) 72%, rgba(3,25,40,0.55) 100%)",
          }}
        />
        {/* Caustic ray texture */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(96deg, transparent 0px, transparent 44px, rgba(0,160,220,0.025) 44px, rgba(0,160,220,0.025) 47px),
              repeating-linear-gradient(84deg, transparent 0px, transparent 70px, rgba(0,200,230,0.015) 70px, rgba(0,200,230,0.015) 73px)
            `,
          }}
        />
        {/* Bottom fade into reef states section */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 260,
            background: "linear-gradient(to bottom, transparent, #0b1e32)",
          }}
        />


        {/* Hero content — pinned to bottom with flex-end */}
        <div
          className="home-hero-content"
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#0089de",
              marginBottom: "1.25rem",
            }}
          >
            <span
              className="live-dot"
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#15a05c",
                boxShadow: "0 0 0 3px rgba(21,160,92,0.3)",
                flexShrink: 0,
              }}
            />
            Live · NOAA Coral Reef Watch
          </div>

          {/* H1 — three lines per mockup */}
          <h1
            style={{
              fontSize: "clamp(3rem, 6.5vw, 5.75rem)",
              fontWeight: 800,
              lineHeight: 1.01,
              letterSpacing: "-0.035em",
              color: "#fff",
              maxWidth: 760,
              marginBottom: "1.4rem",
            }}
          >
            A data atlas
            <br />
            for the living
            <br />
            ocean.
          </h1>

          {/* Serif italic subline */}
          <p
            style={{
              fontFamily:
                "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(1rem, 1.4vw, 1.175rem)",
              color: "rgba(255,255,255,0.52)",
              maxWidth: 480,
              lineHeight: 1.65,
              marginBottom: "2.75rem",
            }}
          >
            Ongoing science and daily monitoring — not a one-time write-up.
          </p>

          {/* Stat strip */}
          <div
            role="list"
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 0,
              flexWrap: "wrap",
            }}
          >
            {[
              { val: String(reefCount), lbl: "Reefs tracked" },
              { val: "5 km", lbl: "Satellite resolution" },
              { val: String(sourceCount), lbl: "Data sources" },
            ].map(({ val, lbl }, i) => (
              <div
                key={lbl}
                role="listitem"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                  padding: i === 0 ? "0 2.25rem 0 0" : "0 2.25rem",
                  borderLeft:
                    i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "1.625rem",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  {val}
                </span>
                <span
                  style={{
                    fontSize: "0.5875rem",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.32)",
                  }}
                >
                  {lbl}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REEF STATES ─────────────────────────────────────────── */}
      <section
        className="home-section-pad"
        style={{ background: "#0b1e32" }}
        aria-label="Reef states"
      >
        <div
          className="home-reef-states-grid"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#0089de",
                marginBottom: "1.25rem",
              }}
            >
              How the atlas reads a reef
            </p>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.625rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.08,
                color: "#fff",
                marginBottom: "1.25rem",
              }}
            >
              What a reef is actually doing right now.
            </h2>
            <p
              style={{
                fontFamily:
                  "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "1.025rem",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 400,
              }}
            >
              Every location carries a reef state — a judgment call about what
              the science says is happening on the ground. Not a marketing
              label. Not a star rating.
            </p>
            <a
              href="#"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                marginTop: "2rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#0089de",
                textDecoration: "none",
              }}
            >
              How we calculate this →
            </a>
          </div>

          {/* Reef state rows */}
          <div
            role="list"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              background: "rgba(255,255,255,0.05)",
              borderRadius: "1.25rem",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {(
              [
                {
                  key: "thriving" as const,
                  color: "#10b981",
                  count: thrivingCount,
                  def: "Coral cover holding, pressure low. A reef with room to surprise you.",
                },
                {
                  key: "pressure" as const,
                  color: "#0089de",
                  count: pressureCount,
                  def: "Degraded or stressed but actively diving. Worth watching closely.",
                },
                {
                  key: "change" as const,
                  color: "#f43f5e",
                  count: changeCount,
                  def: "The reef has fundamentally shifted. Go to see what's actually there — not what the brochures say.",
                },
              ] as const
            ).map(({ key, color, count, def }) => (
              <div
                key={key}
                role="listitem"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                  padding: "1.375rem 1.5rem",
                  background: "#0f2438",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 3,
                    alignSelf: "stretch",
                    borderRadius: 2,
                    flexShrink: 0,
                    marginTop: 2,
                    background: color,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "0.3rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {STATE_TEXT[key]}
                  </p>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    {def}
                  </p>
                </div>
                <span
                  aria-label={`${count} locations`}
                  style={{
                    marginLeft: "auto",
                    fontSize: "1.375rem",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.14)",
                    flexShrink: 0,
                    paddingTop: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSPIRATION GRID ─────────────────────────────────────── */}
      {inspirationLocs.length >= 2 && (
        <section
          className="home-section-pad-b"
          style={{
            background: "#0b1e32",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
          aria-label="Featured destinations"
        >
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "1.75rem",
                paddingTop: 1,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Worth going for
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#fff",
                  }}
                >
                  Something remarkable, right now
                </h2>
              </div>
              <a
                href="#atlas"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#0089de",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                Browse all {reefCount} →
              </a>
            </div>

            {/* 2-column asymmetric grid: large featured left + 2 stacked right */}
            <div className="home-inspire-grid">
              {/* Large featured card */}
              {(() => {
                const loc = inspirationLocs[0]!;
                const animals = ANIMAL_TAGS[loc.slug] ?? loc.animalTags ?? [];
                const seasonal = inSeason(loc.bestMonths);
                return (
                  <Link
                    href={`/locations/${loc.slug}`}
                    style={{
                      position: "relative",
                      display: "block",
                      overflow: "hidden",
                      textDecoration: "none",
                      background: DEST_GRADIENT[loc.slug] ?? DEST_GRADIENT.default,
                      borderRadius: "1.25rem",
                      minHeight: 380,
                    }}
                  >
                    {/* Borrowed underwater photo — gradient stays as base/load layer */}
                    <div
                      aria-hidden="true"
                      style={{
                        width: "100%",
                        minHeight: 380,
                        display: "block",
                      }}
                    />
                    <Image
                      src={underwaterPhotoUrl(loc.heroImageUrl)}
                      alt={`Underwater reef at ${loc.name}`}
                      fill
                      sizes="(max-width: 900px) 100vw, 60vw"
                      style={{ objectFit: "cover" }}
                    />
                    {/* Caustic shimmer */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                          "repeating-linear-gradient(94deg, transparent 0px, transparent 30px, rgba(0,160,220,0.04) 30px, rgba(0,160,220,0.04) 32px)",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Gradient overlay */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(2,14,28,0.9) 0%, rgba(2,14,28,0.3) 50%, transparent 100%)",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Hover blue overlay */}
                    <div
                      aria-hidden="true"
                      className="inspire-hover-overlay"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,137,222,0.1)",
                        opacity: 0,
                        transition: "opacity 0.25s",
                        pointerEvents: "none",
                      }}
                    />
                    {/* Content */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "1.5rem 1.5rem 1.625rem",
                        zIndex: 2,
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.45)",
                          marginBottom: "0.35rem",
                        }}
                      >
                        {loc.region}
                      </p>
                      <h3
                        style={{
                          fontSize: "1.375rem",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "#fff",
                          lineHeight: 1.15,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {loc.name}
                      </h3>
                      <p
                        style={{
                          fontFamily:
                            "var(--font-serif), 'Source Serif 4', Georgia, serif",
                          fontStyle: "italic",
                          fontSize: "0.875rem",
                          lineHeight: 1.55,
                          color: "rgba(255,255,255,0.6)",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}
                      >
                        {loc.hook}
                      </p>
                      {/* Badges */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginTop: "0.875rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ ...BADGE_BASE, ...STATE_BADGE_STYLE[loc.state] }}>
                          {STATE_TEXT[loc.state]}
                        </span>
                        {seasonal && (
                          <span style={SEASON_BADGE}>In season now</span>
                        )}
                        {animals.length > 0 && (
                          <span style={ANIMAL_BADGE}>
                            {animals.slice(0, 2).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })()}

              {/* Right stack — two smaller cards stacked vertically */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {inspirationLocs.slice(1, 3).map((loc) => {
                  const animals = ANIMAL_TAGS[loc!.slug] ?? loc!.animalTags ?? [];
                  const seasonal = inSeason(loc!.bestMonths);
                  return (
                    <Link
                      key={loc!.slug}
                      href={`/locations/${loc!.slug}`}
                      style={{
                        position: "relative",
                        display: "block",
                        overflow: "hidden",
                        textDecoration: "none",
                        background:
                          DEST_GRADIENT[loc!.slug] ?? DEST_GRADIENT.default,
                        borderRadius: "1.25rem",
                        flex: 1,
                      }}
                    >
                      {/* Min-height base layer — gradient shows during load */}
                      <div aria-hidden="true" style={{ width: "100%", minHeight: 160 }} />
                      {/* Borrowed underwater photo */}
                      <Image
                        src={underwaterPhotoUrl(loc!.heroImageUrl)}
                        alt={`Underwater reef at ${loc!.name}`}
                        fill
                        sizes="(max-width: 900px) 100vw, 40vw"
                        style={{ objectFit: "cover" }}
                      />
                      {/* Caustic shimmer */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundImage:
                            "repeating-linear-gradient(94deg, transparent 0px, transparent 30px, rgba(0,160,220,0.04) 30px, rgba(0,160,220,0.04) 32px)",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Gradient overlay */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(2,14,28,0.9) 0%, rgba(2,14,28,0.3) 50%, transparent 100%)",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Hover blue overlay */}
                      <div
                        aria-hidden="true"
                        className="inspire-hover-overlay"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,137,222,0.1)",
                          opacity: 0,
                          transition: "opacity 0.25s",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Content */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "1rem 1.25rem 1.25rem",
                          zIndex: 2,
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.625rem",
                            fontWeight: 700,
                            letterSpacing: "0.16em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.45)",
                            marginBottom: "0.35rem",
                          }}
                        >
                          {loc!.region}
                        </p>
                        <h3
                          style={{
                            fontSize: "1.0625rem",
                            fontWeight: 800,
                            letterSpacing: "-0.02em",
                            color: "#fff",
                            lineHeight: 1.15,
                            marginBottom: "0.4rem",
                          }}
                        >
                          {loc!.name}
                        </h3>
                        {/* Badges */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              ...BADGE_BASE,
                              ...STATE_BADGE_STYLE[loc!.state],
                            }}
                          >
                            {STATE_TEXT[loc!.state]}
                          </span>
                          {seasonal && (
                            <span style={SEASON_BADGE}>In season</span>
                          )}
                          {animals.length > 0 && (
                            <span style={ANIMAL_BADGE}>
                              {animals.slice(0, 2).join(" · ")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── ATLAS EXPLORER ──────────────────────────────────────── */}
      <section
        id="atlas"
        aria-label="Atlas explorer"
        className="home-section-pad"
        style={{ background: "#ffffff" }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          {/* Explorer header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "2rem",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid #e2e8f0",
              gap: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: "0.4rem",
                }}
              >
                The full atlas
              </p>
              <h2
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                }}
              >
                Browse every tracked reef
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.2rem" }}>
                <strong style={{ color: "#0f172a", fontWeight: 700 }}>
                  {reefCount}
                </strong>{" "}
                locations · {regions.length} regions
              </p>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                Filter, sort, or search above
              </p>
            </div>
          </div>

          <Suspense fallback={null}>
            <AtlasExplorer
              locations={filterLocs}
              regions={regions}
              skills={skills}
            />
          </Suspense>
        </div>
      </section>

      {/* ─── NUMBERS / EDITORIAL STATS ───────────────────────────── */}
      <section
        aria-label="About the data"
        className="home-section-pad"
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div
          className="home-stats-grid"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          {/* 38 data sources */}
          <div>
            <p
              style={{
                fontSize: "3.25rem",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: "#e2e8f0",
                lineHeight: 1,
                marginBottom: "0.75rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {sourceCount}
            </p>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Data sources
            </p>
            <p
              style={{
                fontFamily:
                  "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                color: "#475569",
              }}
            >
              NOAA Coral Reef Watch, AIMS, IUCN Red List, Global Fishing Watch,
              iNaturalist, NCRMP, and {sourceCount > 6 ? sourceCount - 6 : "more"} additional program-specific monitoring datasets.
            </p>
          </div>

          {/* Updated tonight — live badge */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.45rem 0.875rem 0.45rem 0.625rem",
                borderRadius: 999,
                background: "rgba(21,160,92,0.1)",
                border: "1px solid rgba(21,160,92,0.2)",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: "#15804d",
                marginBottom: "0.75rem",
              }}
            >
              <span
                className="live-dot"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#15a05c",
                  boxShadow: "0 0 0 3px rgba(21,160,92,0.25)",
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              Updated tonight
            </div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Thermal data
            </p>
            <p
              style={{
                fontFamily:
                  "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                color: "#475569",
              }}
            >
              Every reef is re-checked against NOAA&apos;s 5 km satellite feed
              each night. Three signals: bleaching alert level, degree heating
              weeks, and SST anomaly.
            </p>
          </div>

          {/* 0 marketing adjectives */}
          <div>
            <p
              style={{
                fontSize: "3.25rem",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                color: "#e2e8f0",
                lineHeight: 1,
                marginBottom: "0.75rem",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              0
            </p>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Marketing adjectives
            </p>
            <p
              style={{
                fontFamily:
                  "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontSize: "0.9375rem",
                lineHeight: 1.65,
                color: "#475569",
              }}
            >
              &ldquo;Limited survey data available&rdquo; is always better than a hopeful
              description we can&apos;t back up. If the data says a reef is
              degraded, we say so.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
