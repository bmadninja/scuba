import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasStage } from "@/components/atlas-stage";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { AtlasNav } from "@/components/atlas-nav";
import { HideLayoutNav } from "@/components/hide-layout-nav";

// Homepage hero — manta ray, underwater. Unsplash free license.
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1675829604010-509cca710300?w=3840&q=90&auto=format&fit=crop";

export const metadata: Metadata = {
  title: "scubaSeason.fun — find where to dive",
  description:
    "Find dive sites in season now, with real sighting records and live reef health data.",
};

export default function Home() {
  const allLocs = getAllAtlasLocations();
  const rawBySlug = new Map(getAllLocations().map((l) => [l.slug, l]));

  // Search entries for the hero nav.
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

  return (
    <>
      {/* Hide the sticky layout nav — we render our own inside the hero. */}
      <HideLayoutNav />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          position: "relative",
          height: "clamp(440px, 60vh, 640px)",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
        }}
      >
        {/* Hero-variant transparent nav over the photo, with working search. */}
        <AtlasNav entries={navEntries} variant="hero" />

        {/* Hero photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE_URL}
          alt="Manta ray gliding over a coral reef"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        {/* Smooth legibility gradient — clear at the top, gently darkening toward
            the base so the photo stays visible behind the overlaid copy while the
            text remains legible. Never goes fully opaque (no hard black band). */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(3,7,18,0.28) 0%,rgba(3,7,18,0.10) 38%,rgba(3,7,18,0.62) 80%,rgba(3,7,18,0.88) 100%)",
          }}
        />

        {/* Headline + lede, overlaid on the lower band of the photo */}
        <div
          className="home-hero-content"
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.9rem,3.4vw,3rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.06,
              color: "#ffffff",
              maxWidth: 560,
              textShadow: "0 2px 24px rgba(3,7,18,0.55)",
            }}
          >
            Where to dive and what you&apos;ll actually see.
          </h1>
          <p
            style={{
              fontSize: "1.0625rem",
              lineHeight: 1.55,
              color: "rgba(240,244,248,0.86)",
              marginTop: "1rem",
              maxWidth: 500,
              textShadow: "0 1px 12px rgba(3,7,18,0.5)",
            }}
          >
            A live dive atlas for sightings, reef health, conservation status, and ocean pressure.
          </p>
        </div>
      </section>

      {/* ─── WORKING ATLAS ────────────────────────────────────────── */}
      <div
        id="atlas"
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "2.5rem 3rem 4rem",
        }}
        className="home-atlas-stage"
      >
        <Suspense fallback={null}>
          <AtlasStage locations={filterLocs} currentMonth={currentMonth} />
        </Suspense>
      </div>
    </>
  );
}
