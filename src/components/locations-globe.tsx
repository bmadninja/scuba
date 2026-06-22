"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
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

type LocationsGlobeProps = {
  locations: LocEntry[];
  /**
   * Optional: when provided, clicking a marker calls this instead of
   * navigating to the location page. Used by the explore page to
   * select the matching card and scroll it into view.
   */
  onMarkerClick?: (slug: string) => void;
  height?: number;
};

export function LocationsGlobe({
  locations,
  onMarkerClick,
  height = 640,
}: LocationsGlobeProps) {
  const router = useRouter();

  // Build a teardrop map pin: a cone whose point sits on the surface, with a
  // round head standing outward. Geometry is shared across all pins; only the
  // material (state color) varies, so 347 markers stay cheap on the GPU.
  const buildPin = useMemo(() => {
    const coneGeo = new THREE.ConeGeometry(1.9, 8, 18);
    coneGeo.rotateX(Math.PI); // point the tip toward the globe
    coneGeo.translate(0, 4, 0); // tip at origin (surface), base at y=8
    const headGeo = new THREE.SphereGeometry(2.5, 18, 18);
    headGeo.translate(0, 8.5, 0);
    const dotGeo = new THREE.SphereGeometry(1.05, 14, 14);
    dotGeo.translate(0, 8.5, 0);
    const whiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    const matCache = new Map<string, THREE.MeshBasicMaterial>();
    return (color: string) => {
      let mat = matCache.get(color);
      if (!mat) {
        mat = new THREE.MeshBasicMaterial({ color });
        matCache.set(color, mat);
      }
      const g = new THREE.Group();
      g.add(new THREE.Mesh(coneGeo, mat));
      g.add(new THREE.Mesh(headGeo, mat));
      g.add(new THREE.Mesh(dotGeo, whiteMat));
      return g;
    };
  }, []);

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
    <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "0" }}>
      <GlobeViz
        width={640}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/globe/earth-blue-marble.jpg"
        bumpImageUrl="/globe/earth-topology.png"
        atmosphereColor="#a8e6ff"
        atmosphereAltitude={0.15}
        objectsData={points}
        objectLat="lat"
        objectLng="lng"
        objectAltitude={0}
        objectFacesSurface={true}
        objectThreeObject={(d: object) => buildPin((d as GlobePoint).color)}
        onObjectClick={(obj: object) => {
          const p = obj as GlobePoint;
          if (onMarkerClick) {
            onMarkerClick(p.slug);
          } else {
            router.push(`/locations/${p.slug}`);
          }
        }}
        objectLabel={(obj: object) => {
          const p = obj as GlobePoint;
          return `<div style="background:#0E1C28;padding:5px 12px;border-radius:4px;font-size:12px;color:#FFFFFF;border:1px solid rgba(255,255,255,0.15);pointer-events:none">${p.name}</div>`;
        }}
      />
    </div>
  );
}
