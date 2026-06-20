import { Suspense } from "react";
import type { Metadata } from "next";
import { ExplorePage } from "@/components/explore-page";
import type { ExploreLocation } from "@/components/explore-page";
import { getAllAtlasLocations } from "@/lib/atlas-location";
import { getAllLocations } from "@/lib/data/locations";
import { getSightingsBySiteId } from "@/lib/data/sightings";

export const metadata: Metadata = {
  title: "Explore dive locations | Scuba Season",
  description:
    "Browse every reef location — filtered by reef health, what you want to see, and when to go. Real data. No guesses.",
};

export default function LocationsPage() {
  const atlasLocations = getAllAtlasLocations();
  const baseLocations = getAllLocations();

  const latLngBySlug = Object.fromEntries(
    baseLocations.map((l) => [l.slug, { lat: l.lat, lng: l.lng }]),
  );

  // Build a siteId → locationSlug reverse map so we can check sightings per location.
  // siteIds come from the base locations JSON (read-only).
  const siteIdsBySlug = Object.fromEntries(
    baseLocations.map((l) => [l.slug, l.siteIds ?? []]),
  );

  const currentMonth = new Date().getUTCMonth() + 1;

  const locations: ExploreLocation[] = atlasLocations.map((a) => {
    // Check if any site of this location has sighting evidence
    const siteIds = siteIdsBySlug[a.slug] ?? [];
    const hasSightings = siteIds.some(
      (siteId) => getSightingsBySiteId(siteId).length > 0,
    );

    return {
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
      coverNow: a.coverNow,
      hasSightings,
    };
  });

  return (
    <Suspense fallback={null}>
      <ExplorePage locations={locations} currentMonth={currentMonth} />
    </Suspense>
  );
}
