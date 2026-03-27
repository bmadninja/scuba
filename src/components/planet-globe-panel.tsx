"use client";

import dynamic from "next/dynamic";

import type { PlanetGlobeProps } from "./planet-globe";

const DynamicPlanetGlobe = dynamic(
  () =>
    import("./planet-globe").then((module) => module.PlanetGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full overflow-hidden rounded-[2rem] border border-cyan-100/10 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.24),_transparent_36%),linear-gradient(180deg,_rgba(3,15,32,0.98),_rgba(1,8,18,0.98))] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="min-h-[340px] animate-pulse rounded-[1.5rem] bg-white/5" />
      </div>
    ),
  },
);

export function PlanetGlobePanel(props: PlanetGlobeProps) {
  return <DynamicPlanetGlobe {...props} />;
}
