import type { Metadata } from "next";
import { Suspense } from "react";
import { AtlasStage } from "@/components/atlas-stage";
import type { FilterLocation } from "@/components/atlas-filter-rail";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { AtlasNav } from "@/components/atlas-nav";
import { HideLayoutNav } from "@/components/hide-layout-nav";
import { HeroCarousel } from "@/components/hero-carousel";

export const metadata: Metadata = {
  title: "scubaSeason.fun — live coral health for every reef",
  description: "Plan your next dive around real conditions.",
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

      {/* ─── HERO CAROUSEL ────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        {/* Hero-variant transparent nav floats above the carousel. */}
        <AtlasNav entries={navEntries} variant="hero" />
        <HeroCarousel />
      </div>

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
