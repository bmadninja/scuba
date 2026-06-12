import { Suspense } from "react";
import type { Metadata } from "next";
import { AtlasStage } from "@/components/atlas-stage";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import type { FilterLocation } from "@/components/atlas-filter-rail";

export const metadata: Metadata = {
  title: "Explore dive locations | scubaSeason.fun",
  description:
    "Browse every reef location — filtered by reef health, what you want to see, and when to go.",
};

export default function LocationsPage() {
  const atlasLocations = getAllAtlasLocations();
  const baseLocations = getAllLocations();
  const latLngBySlug = Object.fromEntries(
    baseLocations.map((l) => [l.slug, { lat: l.lat, lng: l.lng }]),
  );
  const currentMonth = new Date().getUTCMonth() + 1;

  const locations: FilterLocation[] = atlasLocations.map((a) => ({
    slug: a.slug,
    name: a.name,
    country: a.country,
    region: a.region,
    hook: a.hook,
    state: a.state,
    cover: a.cover,
    coverYear: a.coverYear,
    season: a.season,
    skill: a.skill,
    heroImageUrl: a.heroImageUrl,
    lastSurveyDays: a.lastSurveyDays,
    bestMonths: a.bestMonths,
    heatLevel: a.heatLevel,
    lat: latLngBySlug[a.slug]?.lat ?? 0,
    lng: latLngBySlug[a.slug]?.lng ?? 0,
    countryCode: "",
    animalTags: a.animalTags,
    diveTypeTags: a.diveTypeTags,
    maxCurrentStrength: a.maxCurrentStrength,
  }));

  return (
    <Suspense fallback={null}>
      <AtlasStage locations={locations} currentMonth={currentMonth} />
    </Suspense>
  );
}
