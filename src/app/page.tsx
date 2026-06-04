import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas-explorer";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { STATE_DEF } from "@/lib/data/reef-state";
import sourcesData from "@/data/sources.json";

export const metadata: Metadata = {
  title: "scubaSeason.fun — a data atlas for the living ocean",
  description:
    "Browse every tracked reef by coral health, thermal stress and survey freshness. Built on ongoing science and daily monitoring, not a one-time write-up.",
};

// Top 3 featured destinations for the inspiration grid
// Sorted by editorial rank; first location in the atlas gets the large slot.
const FEATURED_SLUGS = ["raja-ampat", "palau", "azores"];

// Destination gradient backgrounds (ocean-tone CSS gradients, no real images needed)
const DEST_GRADIENT: Record<string, string> = {
  "raja-ampat":
    "linear-gradient(160deg, #041c33 0%, #063a52 25%, #065a66 45%, #086b7a 65%, #0a7a6b 100%)",
  palau:
    "linear-gradient(155deg, #031522 0%, #042338 25%, #064466 50%, #0a6b8a 75%, #0b829f 100%)",
  azores:
    "linear-gradient(150deg, #0a1f38 0%, #0d2e4e 30%, #103a5e 55%, #124870 80%, #0f3d61 100%)",
  default:
    "linear-gradient(155deg, #0b1e32 0%, #0d2e4e 30%, #0e3d5e 60%, #094a6a 100%)",
};

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const STATE_COLOR: Record<string, string> = {
  thriving: "#10b981",
  pressure: "#0089de",
  change: "#f43f5e",
};

export default function Home() {
  const allLocs = getAllAtlasLocations();
  const rawBySlug = new Map(getAllLocations().map((l) => [l.slug, l]));

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
  // If we don't have enough, fill with top editorial picks
  const inspirationLocs =
    featuredLocs.length >= 2
      ? featuredLocs
      : allLocs.slice(0, 3);

  return (
    <>
      {/* ─── DARK INK HERO ────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          position: "relative",
          minHeight: "80vh",
          overflow: "hidden",
          background: "#0b1e32",
        }}
      >
        {/* Background layers */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 70% 55% at 65% 25%, rgba(0,137,222,0.2) 0%, transparent 65%),
              radial-gradient(ellipse 45% 35% at 30% 60%, rgba(0,184,212,0.12) 0%, transparent 60%),
              linear-gradient(175deg, #021422 0%, #041c33 18%, #052745 38%, #073060 55%, #052540 72%, #031928 100%)
            `,
          }}
        />
        {/* Light ray texture */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              repeating-linear-gradient(96deg, transparent 0px, transparent 44px, rgba(0,160,220,0.035) 44px, rgba(0,160,220,0.035) 47px),
              repeating-linear-gradient(84deg, transparent 0px, transparent 70px, rgba(0,200,230,0.025) 70px, rgba(0,200,230,0.025) 73px)
            `,
          }}
        />
        {/* Bottom fade into the next section */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: "linear-gradient(to bottom, transparent, #0b1e32)",
          }}
        />

        {/* Photo credit — top right */}
        <p
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "1.25rem",
            right: "3rem",
            fontSize: "0.625rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            zIndex: 10,
          }}
        >
          Coral garden illustration
        </p>

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            paddingTop: "12rem",
            paddingBottom: "5.5rem",
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

          {/* H1 */}
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
            A data atlas for the living ocean.
          </h1>

          {/* Serif subline */}
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
            Where science meets the water. Track {reefCount} reefs with daily
            satellite monitoring and in-water survey data.
          </p>

          {/* Hero stats */}
          <div
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

      {/* ─── REEF STATES — still dark ─────────────────────────────── */}
      <section
        style={{ background: "#0b1e32", padding: "5rem 3rem" }}
        aria-label="Reef states"
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: "5rem",
            alignItems: "center",
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
              What you&apos;re looking at
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
              Every reef has a story. We tell it with data.
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
              Each location is classified into one of three states — based on
              live coral cover surveys, thermal stress from NOAA, and fishing
              pressure from Global Fishing Watch.
            </p>
            <a
              href="#atlas"
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
              Browse the atlas →
            </a>
          </div>

          {/* Reef state cards */}
          <div
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
                { key: "thriving", count: thrivingCount },
                { key: "pressure", count: pressureCount },
                { key: "change", count: changeCount },
              ] as const
            ).map(({ key, count }) => (
              <div
                key={key}
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
                    background: STATE_COLOR[key],
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
                    {STATE_DEF[key].short}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  style={{
                    marginLeft: "auto",
                    fontSize: "1.375rem",
                    fontWeight: 900,
                    letterSpacing: "-0.03em",
                    color: "rgba(255,255,255,0.14)",
                    flexShrink: 0,
                    paddingTop: 1,
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INSPIRATION GRID ──────────────────────────────────────── */}
      {inspirationLocs.length >= 2 && (
        <section
          style={{
            background: "#0b1e32",
            padding: "0 3rem 5rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
          aria-label="Featured destinations"
        >
          <div
            style={{
              maxWidth: 1320,
              margin: "0 auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "1.75rem",
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
                  Remarkable reefs
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#fff",
                  }}
                >
                  Where to go
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

            {/* 2-col asymmetric grid: large left + 2 stacked right */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.65fr 1fr",
                gap: 1,
                background: "rgba(255,255,255,0.05)",
                borderRadius: "1.25rem",
                overflow: "hidden",
              }}
            >
              {/* Large featured card */}
              <Link
                href={`/locations/${inspirationLocs[0]!.slug}`}
                style={{
                  position: "relative",
                  display: "block",
                  minHeight: 360,
                  overflow: "hidden",
                  textDecoration: "none",
                  background:
                    DEST_GRADIENT[inspirationLocs[0]!.slug] ??
                    DEST_GRADIENT.default,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(2,14,28,0.9) 0%, rgba(2,14,28,0.3) 50%, transparent 100%)",
                  }}
                />
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
                    {inspirationLocs[0]!.region}
                  </p>
                  <p
                    style={{
                      fontSize: "1.375rem",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "#fff",
                      lineHeight: 1.15,
                      marginBottom: "0.5rem",
                    }}
                  >
                    {inspirationLocs[0]!.name}
                  </p>
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
                    {inspirationLocs[0]!.hook}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "0.875rem",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: STATE_COLOR[inspirationLocs[0]!.state],
                        background: `${STATE_COLOR[inspirationLocs[0]!.state]}22`,
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {STATE_TEXT[inspirationLocs[0]!.state]}
                    </span>
                    {inSeason(inspirationLocs[0]!.bestMonths) && (
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "#10b981",
                          background: "rgba(16,185,129,0.15)",
                          padding: "3px 8px",
                          borderRadius: 999,
                        }}
                      >
                        ● In season now
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Right column: 2 stacked cards */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 1 }}
              >
                {inspirationLocs.slice(1, 3).map((loc) => (
                  <Link
                    key={loc!.slug}
                    href={`/locations/${loc!.slug}`}
                    style={{
                      position: "relative",
                      display: "block",
                      flex: 1,
                      minHeight: 160,
                      overflow: "hidden",
                      textDecoration: "none",
                      background:
                        DEST_GRADIENT[loc!.slug] ?? DEST_GRADIENT.default,
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(2,14,28,0.9) 0%, rgba(2,14,28,0.3) 50%, transparent 100%)",
                      }}
                    />
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
                          marginBottom: "0.25rem",
                        }}
                      >
                        {loc!.region}
                      </p>
                      <p
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
                      </p>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: STATE_COLOR[loc!.state],
                            background: `${STATE_COLOR[loc!.state]}22`,
                            padding: "2px 7px",
                            borderRadius: 999,
                          }}
                        >
                          {STATE_TEXT[loc!.state]}
                        </span>
                        {inSeason(loc!.bestMonths) && (
                          <span
                            style={{
                              fontSize: "0.6875rem",
                              fontWeight: 600,
                              color: "#10b981",
                              background: "rgba(16,185,129,0.15)",
                              padding: "2px 7px",
                              borderRadius: 999,
                            }}
                          >
                            ● In season
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── ATLAS EXPLORER ──────────────────────────────────────── */}
      <div id="atlas" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Suspense fallback={null}>
            <AtlasExplorer locations={filterLocs} regions={regions} skills={skills} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
