import { Suspense } from "react";
import type { Metadata } from "next";
import { SitesExplorer } from "@/components/sites-explorer";
import { getAllSites } from "@/lib/data/sites";
import { getAllLocations } from "@/lib/data/locations";
import type { Location } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "All dive sites | scubaSeason.fun",
  description:
    "Every curated dive site — filtered by what you want to see, not what's easiest to sell.",
};

export default function SitesPage() {
  const sites = getAllSites();
  const locations = getAllLocations();
  const locationsById: Record<string, Location> = Object.fromEntries(
    locations.map((l) => [l.id, l]),
  );
  const currentMonth = new Date().getUTCMonth() + 1;

  return (
    <Suspense fallback={null}>
      <SitesExplorer
        sites={sites}
        locationsById={locationsById}
        currentMonth={currentMonth}
      />
    </Suspense>
  );
}
