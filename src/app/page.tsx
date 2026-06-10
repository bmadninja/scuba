import type { Metadata } from "next";
import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { AtlasExplorer } from "@/components/atlas-explorer";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import sourcesData from "@/data/sources.json";
import { AtlasNav } from "@/components/atlas-nav";
import { HideLayoutNav } from "@/components/hide-layout-nav";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getSightingsBySiteId } from "@/lib/data/sightings";

// Homepage hero — manta ray, Grand Cayman. Unsplash free license
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1675829604010-509cca710300?w=3840&q=90&auto=format&fit=crop";

export const metadata: Metadata = {
  title: "scubaSeason.fun — find where to dive",
  description:
    "Find dive sites in season now, with real sighting records and live reef health data.",
};

const STATE_TEXT: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

// Badge style per state
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
  whiteSpace: "nowrap",
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

  // Search entries for the hero nav
  const navEntries = allLocs.map((l) => ({
    slug: l.slug,
    name: l.name,
    country: l.country,
    region: l.region,
    state: l.state,
  }));

  const currentMonth = new Date().getUTCMonth() + 1;
  const currentYear = new Date().getUTCFullYear();
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const currentMonthName = MONTH_NAMES[currentMonth - 1];

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

  // In season now — compute full list before slicing (for count in stat strip)
  const inSeasonLocs = allLocs
    .filter((l) => inSeason(l.bestMonths))
    .sort((a, b) => {
      const order: Record<string, number> = { thriving: 0, pressure: 1, change: 2 };
      const diff = (order[a.state] ?? 3) - (order[b.state] ?? 3);
      return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
  const inSeasonCount = inSeasonLocs.length;
  const inSeasonDisplay = inSeasonLocs.slice(0, 6);

  // Locations with no sighting records (for Dive With Purpose section)
  const rawLocs = getAllLocations();
  const noSightingsCount = rawLocs.filter((rawLoc) => {
    const sites = getSitesByLocationId(rawLoc.id);
    return !sites.some((site) => getSightingsBySiteId(site.id).length > 0);
  }).length;

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
        {/* Bottom fade into next section */}
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
          {/* H1 */}
          <h1
            style={{
              fontSize: "clamp(3rem, 6.5vw, 5.75rem)",
              fontWeight: 800,
              lineHeight: 1.01,
              letterSpacing: "-0.035em",
              color: "#fff",
              maxWidth: 760,
              marginBottom: "1rem",
            }}
          >
            Find where
            <br />
            to dive.
          </h1>

          {/* Subline */}
          <p
            style={{
              fontSize: "clamp(1rem, 1.5vw, 1.125rem)",
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "-0.01em",
              marginBottom: "1.75rem",
              maxWidth: 520,
              lineHeight: 1.5,
            }}
          >
            Browse {reefCount} dive locations — filter by season, species, or reef health.
          </p>

          {/* CTA links */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1.5rem",
              marginBottom: "2.25rem",
            }}
          >
            <a
              href="#atlas"
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Browse all locations →
            </a>
            <a
              href="#in-season"
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.85)",
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Best spots this month →
            </a>
          </div>

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
              { val: String(reefCount), lbl: "Locations" },
              { val: String(inSeasonCount), lbl: `In season in ${currentMonthName}` },
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

      {/* ─── IN SEASON NOW ────────────────────────────────────────── */}
      {inSeasonDisplay.length > 0 && (
        <section
          id="in-season"
          aria-label="In season now"
          className="home-section-pad"
          style={{ background: "#0b1e32" }}
        >
          <div style={{ maxWidth: 1320, margin: "0 auto" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: "1.75rem",
                flexWrap: "wrap",
                gap: "0.75rem",
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
                  Diving this month
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#fff",
                  }}
                >
                  Best season right now — {currentMonthName} {currentYear}
                </h2>
              </div>
              <a
                href="/#atlas"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "#0089de",
                  textDecoration: "none",
                  flexShrink: 0,
                }}
              >
                View all {inSeasonCount} in-season locations →
              </a>
            </div>

            {/* Card grid — up to 6 cards, 3 per row */}
            <div
              className="home-inseason-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              {inSeasonDisplay.map((loc) => {
                const animals = loc.animalTags ?? [];
                return (
                  <Link
                    key={loc.slug}
                    href={`/locations/${loc.slug}`}
                    style={{
                      position: "relative",
                      display: "block",
                      overflow: "hidden",
                      textDecoration: "none",
                      background: "#0f2438",
                      borderRadius: "1.25rem",
                      minHeight: 240,
                    }}
                  >
                    {/* Min-height base layer */}
                    <div aria-hidden="true" style={{ width: "100%", minHeight: 240 }} />
                    {loc.heroImageUrl && (
                      <Image
                        src={underwaterPhotoUrl(loc.heroImageUrl)}
                        alt={`Underwater reef at ${loc.name}`}
                        fill
                        sizes="(max-width: 900px) 100vw, 33vw"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                    {/* Gradient overlay */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to top, rgba(2,14,28,0.92) 0%, rgba(2,14,28,0.3) 50%, transparent 100%)",
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
                          marginBottom: "0.25rem",
                        }}
                      >
                        {loc.region}
                      </p>
                      <h3
                        style={{
                          fontSize: "1.0625rem",
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "#fff",
                          lineHeight: 1.15,
                          marginBottom: "0.5rem",
                        }}
                      >
                        {loc.name}
                      </h3>
                      {/* Badges */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Reef state badge */}
                        <span style={{ ...BADGE_BASE, ...STATE_BADGE_STYLE[loc.state] }}>
                          {STATE_TEXT[loc.state]}
                        </span>
                        {/* Green in-season dot indicator */}
                        <span
                          style={{
                            ...BADGE_BASE,
                            background: "rgba(21,160,92,0.15)",
                            color: "#6ee7b7",
                            border: "1px solid rgba(21,160,92,0.25)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            style={{
                              display: "inline-block",
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: "#15a05c",
                              flexShrink: 0,
                            }}
                          />
                          In season
                        </span>
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
        </section>
      )}

      {/* ─── DIVE WITH PURPOSE ───────────────────────────────────── */}
      <section
        aria-label="Dive with purpose"
        className="home-section-pad"
        style={{ background: "#071526" }}
      >
        <div
          className="home-purpose-grid"
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* Left — For divers */}
          <div>
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#0089de",
                marginBottom: "0.75rem",
              }}
            >
              For divers
            </p>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#fff",
                marginBottom: "0.875rem",
                lineHeight: 1.1,
              }}
            >
              Make your dive count.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                fontStyle: "italic",
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "2rem",
                maxWidth: 440,
              }}
            >
              We&apos;ll point you to programs that need data from sites like these.
            </p>

            {/* Citizen science rows */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              {[
                {
                  icon: "📸",
                  desc: "Photograph a manta's belly spots — AI matches it to known individuals across years and oceans.",
                  effort: "Zero effort",
                },
                {
                  icon: "🪸",
                  desc: "Color-match 10 corals against a chart. Helps track bleaching across the reef.",
                  effort: "15 minutes",
                },
                {
                  icon: "🐟",
                  desc: "10-min fish count at a marked site. Citizen surveys match federally funded fisheries surveys in accuracy.",
                  effort: "Free training",
                },
              ].map(({ icon, desc, effort }) => (
                <div
                  key={effort}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{ fontSize: "1.375rem", lineHeight: 1, flexShrink: 0, marginTop: 2 }}
                  >
                    {icon}
                  </span>
                  <div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: "0.35rem",
                      }}
                    >
                      {desc}
                    </p>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {effort}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="/#atlas"
              style={{
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "#0089de",
                textDecoration: "none",
              }}
            >
              See which sites need your eyes →
            </a>
          </div>

          {/* Right — For researchers */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "1.25rem",
              padding: "2rem",
            }}
          >
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                marginBottom: "0.75rem",
              }}
            >
              For researchers
            </p>
            <h2
              style={{
                fontSize: "clamp(1.25rem, 2vw, 1.625rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#fff",
                marginBottom: "0.75rem",
                lineHeight: 1.15,
              }}
            >
              Monitoring a reef? We&apos;ll send you fresh eyes.
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.45)",
                marginBottom: "1.5rem",
              }}
            >
              Tell us where you need divers and we&apos;ll direct them there.
            </p>

            {/* Highlight box */}
            <div
              style={{
                background: "rgba(244,63,94,0.06)",
                border: "1px solid rgba(244,63,94,0.2)",
                borderRadius: "0.75rem",
                padding: "1rem 1.25rem",
                marginBottom: "1.75rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                <strong style={{ color: "#fca5a5", fontWeight: 700 }}>
                  {noSightingsCount} sites
                </strong>{" "}
                in our atlas still have no sighting records.
              </p>
            </div>

            {/* CTA button */}
            <a
              href="mailto:hello@scubaseason.fun"
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                background: "#0089de",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9375rem",
                borderRadius: "0.625rem",
                textDecoration: "none",
                marginBottom: "0.875rem",
              }}
            >
              Get in touch →
            </a>
            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              hello@scubaseason.fun
            </p>
          </div>
        </div>
      </section>

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
                All locations
              </p>
              <h2
                style={{
                  fontSize: "1.875rem",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                }}
              >
                {reefCount} reefs across {regions.length} regions
              </h2>
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

      {/* ─── TRUST STRIP ─────────────────────────────────────────── */}
      <section
        aria-label="About the data"
        className="home-section-pad"
        style={{
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>
              {sourceCount} data sources
            </strong>{" "}
            — NOAA, AIMS, IUCN, GFW, iNaturalist and more.{" "}
            <Link
              href="/data"
              style={{ color: "#0089de", textDecoration: "none", fontWeight: 600 }}
            >
              Full source list →
            </Link>
          </p>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>
              Live thermal data
            </strong>{" "}
            — re-checked against NOAA&apos;s 5 km satellite feed every night.
          </p>
          <p
            style={{
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#475569",
            }}
          >
            <strong style={{ color: "#0f172a", fontWeight: 700 }}>
              0 marketing adjectives
            </strong>{" "}
            — if a reef is degraded, we say so.
          </p>
        </div>
      </section>
    </>
  );
}
