import type { Metadata } from "next";
import Link from "next/link";
import { HomepageStatStrip } from "@/components/homepage-stat-strip";
import { ReefStateCardTrio, type ReefStateCardData } from "@/components/reef-state-card";
import { FeaturedReefMosaic, type MosaicCard } from "@/components/featured-reef-mosaic";
import { SpeciesFilmstrip } from "@/components/species-filmstrip";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

export const metadata: Metadata = {
  title: "Scuba Season — The reef atlas built on science, made for divers.",
  description:
    "384 dive locations and 1417 sites with live reef health, confirmed species sightings, and real conditions — so you can plan a dive that matters.",
};

// ─── Data for ReefStateCard trio (one per state: improving / stable / declining)
const REEF_STATE_CARDS: ReefStateCardData[] = [
  {
    slug: "raja-ampat-indonesia",
    name: "Raja Ampat",
    country: "Indonesia",
    region: "Coral Triangle",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_NoemiMerz_12.jpg",
    state: "improving",
    hook: "56% coral cover, strictly protected, with the highest marine biodiversity on the planet.",
  },
  {
    slug: "blue-corner-palau",
    name: "Blue Corner",
    country: "Palau",
    region: "Pacific",
    heroImageUrl: "https://images.pexels.com/photos/31745245/pexels-photo-31745245.jpeg?auto=compress&cs=tinysrgb&w=1920",
    state: "stable",
    hook: "38% coral cover inside one of the oldest marine sanctuaries in the Pacific. Sharks on every dive.",
  },
  {
    slug: "great-barrier-reef-australia",
    name: "Great Barrier Reef",
    country: "Australia",
    region: "Pacific",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_JordanRobins_02.jpg",
    state: "declining",
    hook: "Back to back bleaching events from 2016 to 2024. Every dive here is a record of what survives.",
  },
];

// ─── Featured mosaic cards (6-8 locations across regions)
const MOSAIC_CARDS: MosaicCard[] = [
  {
    slug: "komodo-national-park-indonesia",
    name: "Komodo National Park",
    country: "Indonesia",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_TheOceanAgency_360_84.jpg",
    state: "improving",
  },
  {
    slug: "tubbataha-philippines",
    name: "Tubbataha Reefs",
    country: "Philippines",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_GregoryPiper_71.jpg",
    state: "improving",
  },
  {
    slug: "rangiroa-french-polynesia",
    name: "Tiputa Pass",
    country: "French Polynesia",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_HannesKlostermann_51.jpg",
    state: "improving",
  },
  {
    slug: "bunaken-indonesia",
    name: "Bunaken",
    country: "Indonesia",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_IshanHassan_05.jpg",
    state: "stable",
  },
  {
    slug: "florida-keys-usa",
    name: "Florida Keys",
    country: "United States",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_DaniEscayola_24.jpg",
    state: "declining",
  },
  {
    slug: "malapascua-philippines",
    name: "Malapascua",
    country: "Philippines",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_LiangFu_08.jpg",
    state: "stable",
  },
  {
    slug: "bonegi-solomon-islands",
    name: "Bonegi Wrecks",
    country: "Solomon Islands",
    heroImageUrl: "https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_TraceyJennings_15.jpg",
    state: "improving",
  },
  {
    slug: "blue-corner-palau",
    name: "Blue Corner",
    country: "Palau",
    heroImageUrl: "https://images.pexels.com/photos/31745245/pexels-photo-31745245.jpeg?auto=compress&cs=tinysrgb&w=1920",
    state: "stable",
  },
];

export default function Home() {
  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
        }}
      >
        {/* Ocean gradient fallback */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 80% 60% at 55% 35%, #0E4F6E 0%, #051828 55%, #0E1C28 100%)",
          }}
        />

        {/* Hero photo — manta ray over coral reef */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_FilippoBorghi_04.jpg"
          alt="Manta ray gliding above a pristine coral reef"
          loading="eager"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />

        {/* Gradient overlays */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(14,28,40,0.20) 0%, rgba(14,28,40,0.05) 30%, rgba(14,28,40,0.55) 68%, rgba(14,28,40,0.98) 100%)",
          }}
        />
        {/* Bottom white fade for StatStrip transition */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6rem",
            background: "linear-gradient(to bottom, transparent, #FFFFFF)",
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 1.5rem 5.5rem",
          }}
          className="hero-content"
        >
          {/* Eyebrow */}
          <p
            style={{
              fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
              fontWeight: 400,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.70)",
              marginBottom: "1.125rem",
            }}
          >
            The reef atlas built on science, made for divers.
          </p>

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "clamp(2.375rem, 5.5vw, 4.25rem)",
              lineHeight: 1.07,
              color: "#FFFFFF",
              maxWidth: 660,
              textShadow: "0 2px 32px rgba(14,28,40,0.55)",
              marginBottom: "2rem",
            }}
          >
            Where are the reefs worth diving right now?
          </h1>

          {/* Dual CTA */}
          <div className="hero-ctas" style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
            {/* Ghost CTA — Explore reefs */}
            <Link
              href="/locations"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.8125rem 1.625rem",
                borderRadius: "2px",
                border: "1.5px solid rgba(255,255,255,0.65)",
                background: "transparent",
                color: "#FFFFFF",
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: "0.9375rem",
                textDecoration: "none",
                minHeight: "44px",
                transition: "background 200ms ease, border-color 200ms ease",
              }}
              className="hero-cta-ghost"
            >
              Explore reefs
            </Link>

            {/* Yellow CTA — Upload a sighting */}
            <Link
              href="/submit"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.8125rem 1.625rem",
                borderRadius: "2px",
                background: "#F6C700",
                color: "#0E1C28",
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 500,
                fontSize: "0.9375rem",
                textDecoration: "none",
                minHeight: "44px",
                transition: "background 200ms ease",
              }}
              className="hero-cta-yellow"
            >
              Upload a sighting
            </Link>
          </div>
        </div>
      </section>

      {/* ══ STAT STRIP ════════════════════════════════════════════════ */}
      <HomepageStatStrip />

      {/* ══ REEF STATE TRIO ═══════════════════════════════════════════ */}
      <RevealOnScroll>
        <section
          aria-label="Reef states"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "5rem 1.5rem 3rem",
          }}
        >
          {/* Section heading */}
          <div style={{ marginBottom: "2.5rem" }}>
            <p
              style={{
                fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                fontWeight: 400,
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--color-ink-2)",
                marginBottom: "0.625rem",
              }}
            >
              Reef states
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                fontWeight: 400,
                fontSize: "clamp(1.75rem, 3.5vw, 2.625rem)",
                lineHeight: 1.1,
                color: "var(--color-ink)",
                maxWidth: 520,
              }}
            >
              Know what every reef looks like before you dive.
            </h2>
          </div>

          <ReefStateCardTrio cards={REEF_STATE_CARDS} />

          <div style={{ marginTop: "1.75rem" }}>
            <Link
              href="/locations"
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 400,
                fontSize: "0.9375rem",
                color: "var(--color-ocean)",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Browse all 384 locations
            </Link>
          </div>
        </section>
      </RevealOnScroll>

      {/* ══ FEATURED REEF MOSAIC ══════════════════════════════════════ */}
      <RevealOnScroll delay="d1">
        <section
          aria-label="Featured reefs"
          style={{
            padding: "3rem 0 4rem",
            borderTop: "1px solid var(--color-hairline)",
            borderBottom: "1px solid var(--color-hairline)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ marginBottom: "1.75rem" }}>
              <p
                style={{
                  fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                  fontWeight: 400,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-ink-2)",
                  marginBottom: "0.5rem",
                }}
              >
                Featured destinations
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  lineHeight: 1.15,
                  color: "var(--color-ink)",
                }}
              >
                From the Coral Triangle to the Pacific.
              </h2>
            </div>

            <FeaturedReefMosaic cards={MOSAIC_CARDS} />
          </div>
        </section>
      </RevealOnScroll>

      {/* ══ SPECIES FILMSTRIP ═════════════════════════════════════════ */}
      <RevealOnScroll delay="d2">
        <section
          aria-label="Species you may encounter"
          style={{
            padding: "4rem 0",
            background: "var(--color-paper)",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
            <div style={{ marginBottom: "1.75rem" }}>
              <p
                style={{
                  fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                  fontWeight: 400,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-ink-2)",
                  marginBottom: "0.5rem",
                }}
              >
                Species you may encounter
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                  lineHeight: 1.15,
                  color: "var(--color-ink)",
                  maxWidth: 520,
                }}
              >
                See the probability, not the hope.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: "0.9375rem",
                  color: "var(--color-ink-2)",
                  lineHeight: 1.65,
                  maxWidth: 520,
                  marginTop: "0.625rem",
                }}
              >
                Sighting odds are calculated from verified diver logs across the past 24 months — not editorial picks.
              </p>
            </div>

            <SpeciesFilmstrip />
          </div>
        </section>
      </RevealOnScroll>

      {/* ══ CITIZEN SCIENCE 50/50 ═════════════════════════════════════ */}
      <RevealOnScroll delay="d3">
        <section
          aria-label="Contribute to science"
          style={{
            borderTop: "1px solid var(--color-hairline)",
          }}
        >
          <div
            className="citizen-science-split"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              minHeight: "480px",
            }}
          >
            {/* Left — underwater photo */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                minHeight: "360px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://d1qsp4j04beddk.cloudfront.net/OceanImageBank_TheOceanAgency_360_84.jpg"
                alt="Diver photographing a coral reef system"
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                }}
              />
            </div>

            {/* Right — copy + CTA */}
            <div
              style={{
                padding: "3.5rem 3rem 3.5rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
              className="citizen-science-text"
            >
              <p
                style={{
                  fontFamily: 'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
                  fontWeight: 400,
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--color-ink-2)",
                  marginBottom: "1rem",
                }}
              >
                Citizen science
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-serif), "Source Serif 4", Georgia, serif',
                  fontWeight: 400,
                  fontSize: "clamp(1.625rem, 3vw, 2.375rem)",
                  lineHeight: 1.15,
                  color: "var(--color-ink)",
                  marginBottom: "1.25rem",
                }}
              >
                Every dive photo you submit reaches 5 conservation databases on your behalf.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 300,
                  fontSize: "1.0625rem",
                  color: "var(--color-ink-2)",
                  lineHeight: 1.7,
                  marginBottom: "2rem",
                  maxWidth: 440,
                }}
              >
                iNaturalist, GBIF, OBIS and more — no accounts required. Your sighting is geo-tagged, species-matched, and forwarded automatically. Scientists see it the same day.
              </p>
              <div>
                <Link
                  href="/submit"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.875rem 2rem",
                    borderRadius: "2px",
                    background: "#F6C700",
                    color: "#0E1C28",
                    fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
                    fontWeight: 500,
                    fontSize: "0.9375rem",
                    textDecoration: "none",
                    minHeight: "44px",
                  }}
                >
                  Upload a sighting
                </Link>
              </div>
            </div>
          </div>
        </section>
      </RevealOnScroll>

      {/* ══ METHOD STRIP ══════════════════════════════════════════════ */}
      <div
        style={{
          background: "#14191E",
          padding: "1.75rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
          className="method-strip-inner"
        >
          <p
            style={{
              fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
              fontWeight: 300,
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,0.80)",
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            63 data sources. Updated as science publishes.
          </p>
          <Link
            href="/data"
            style={{
              fontFamily: 'var(--font-sans), "IBM Plex Sans", system-ui, sans-serif',
              fontWeight: 400,
              fontSize: "0.875rem",
              color: "rgba(255,255,255,0.55)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              whiteSpace: "nowrap",
            }}
          >
            Learn more
          </Link>
        </div>
      </div>

      {/* ══ RESPONSIVE + HOVER STYLES ════════════════════════════════ */}
      <style>{`
        .hero-cta-ghost:hover {
          background: rgba(255,255,255,0.10) !important;
          border-color: rgba(255,255,255,0.90) !important;
        }
        .hero-cta-yellow:hover {
          background: #e0b400 !important;
        }
        *:focus-visible {
          outline: 2px solid #F6C700 !important;
          outline-offset: 2px !important;
        }

        @media (max-width: 640px) {
          .hero-ctas {
            flex-direction: column !important;
          }
          .hero-ctas a:first-child {
            order: 2;
          }
          .hero-ctas a:last-child {
            order: 1;
          }
          .citizen-science-split {
            grid-template-columns: 1fr !important;
          }
          .citizen-science-text {
            padding: 2rem 1.5rem !important;
          }
          .method-strip-inner {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </>
  );
}
