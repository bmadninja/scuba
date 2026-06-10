"use client";

import dynamic from "next/dynamic";
import type { PlanetMarker } from "./planet-globe";

// ssr:false dynamic import must live inside a Client Component (Next.js lazy-loading guide).
const DynamicPlanetGlobe = dynamic(
  () => import("./planet-globe").then((m) => m.PlanetGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[#030712] p-4 shadow-sm">
        <div className="min-h-[340px] animate-pulse rounded-xl bg-white/5" />
      </div>
    ),
  },
);

export function HomeGlobe({
  markers,
  highlightedCountries,
  onMarkerClick,
}: {
  markers: PlanetMarker[];
  highlightedCountries: string[];
  onMarkerClick?: (m: PlanetMarker) => void;
}) {
  return (
    <DynamicPlanetGlobe
      markers={markers}
      highlightedCountries={highlightedCountries}
      onMarkerClick={onMarkerClick}
    />
  );
}
