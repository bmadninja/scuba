"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Site, Location } from "@/lib/data/types";
import type { ReefState } from "@/lib/data/reef-state";

const GlobeViz = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: 620,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#8b9db8",
        fontSize: "0.875rem",
      }}
    >
      Loading globe…
    </div>
  ),
});

const STATE_DOT: Record<ReefState, string> = {
  thriving: "#10b981",
  pressure: "#f59e0b",
  change: "#f43f5e",
};

type GlobePoint = {
  lat: number;
  lng: number;
  color: string;
  slug: string;
  name: string;
};

export function SitesGlobe({
  sites,
  locationsById,
  reefStateByLocationId,
}: {
  sites: Site[];
  locationsById: Record<string, Location>;
  reefStateByLocationId: Record<string, ReefState>;
}) {
  const router = useRouter();

  const points = useMemo<GlobePoint[]>(
    () =>
      sites.flatMap((s) => {
        const loc = locationsById[s.locationId];
        if (!loc) return [];
        return [
          {
            lat: loc.lat,
            lng: loc.lng,
            color: STATE_DOT[reefStateByLocationId[s.locationId]] ?? "#8b9db8",
            slug: s.slug,
            name: s.name,
          },
        ];
      }),
    [sites, locationsById, reefStateByLocationId]
  );

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "2rem 0 4rem" }}>
      <GlobeViz
        width={960}
        height={640}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        atmosphereColor="#00d4ff"
        atmosphereAltitude={0.12}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius={0.45}
        pointAltitude={0.01}
        pointsMerge={false}
        onPointClick={(point: object) => {
          const p = point as GlobePoint;
          router.push(`/sites/${p.slug}`);
        }}
        pointLabel={(point: object) => {
          const p = point as GlobePoint;
          return `<div style="background:#0a1628;padding:5px 12px;border-radius:8px;font-size:12px;color:#f0f4f8;border:1px solid rgba(255,255,255,0.15);pointer-events:none">${p.name}</div>`;
        }}
      />
    </div>
  );
}
