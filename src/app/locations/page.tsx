import { Suspense } from "react";
import type { Metadata } from "next";
import { LocationsExplorer } from "@/components/locations-explorer";
import type { LocationItem } from "@/components/locations-explorer";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";

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

  const locations: LocationItem[] = atlasLocations.map((a) => ({
    slug: a.slug,
    name: a.name,
    country: a.country,
    region: a.region,
    hook: a.hook,
    state: a.state,
    heroImageUrl: a.heroImageUrl,
    bestMonths: a.bestMonths,
    skill: a.skill,
    lastSurveyDays: a.lastSurveyDays,
    animalTags: a.animalTags,
    diveTypeTags: a.diveTypeTags,
    maxCurrentStrength: a.maxCurrentStrength,
    lat: latLngBySlug[a.slug]?.lat ?? 0,
    lng: latLngBySlug[a.slug]?.lng ?? 0,
  }));

  return (
    <Suspense fallback={null}>
      <LocationsExplorer locations={locations} currentMonth={currentMonth} />
    </Suspense>
  );
}
