"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
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

type LocEntry = {
  slug: string;
  name: string;
  state: ReefState;
  lat: number;
  lng: number;
};

export function LocationsGlobe({ locations }: { locations: LocEntry[] }) {
  const router = useRouter();

  const points = useMemo<GlobePoint[]>(
    () =>
      locations.map((l) => ({
        lat: l.lat,
        lng: l.lng,
        color: STATE_DOT[l.state] ?? "#8b9db8",
        slug: l.slug,
        name: l.name,
      })),
    [locations],
  );

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "2rem 0 4rem" }}>
      <GlobeViz
        width={960}
        height={640}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        atmosphereColor="#a8e6ff"
        atmosphereAltitude={0.15}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius={0.45}
        pointAltitude={0.01}
        pointsMerge={false}
        onPointClick={(point: object) => {
          const p = point as GlobePoint;
          router.push(`/locations/${p.slug}`);
        }}
        pointLabel={(point: object) => {
          const p = point as GlobePoint;
          return `<div style="background:#0a1628;padding:5px 12px;border-radius:8px;font-size:12px;color:#f0f4f8;border:1px solid rgba(255,255,255,0.15);pointer-events:none">${p.name}</div>`;
        }}
      />
    </div>
  );
}
