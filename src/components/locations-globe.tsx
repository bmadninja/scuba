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

  // Classic teardrop map pin as a 3D object: a bulb tapering to a point that
  // sits on the surface. Cone is tangent to the bulb so the silhouette reads
  // as one smooth pin. Geometry is shared; only the material color varies, so
  // 347 pins stay cheap on the GPU.
  const buildPin = useMemo(() => {
    const R = 1.7;
    const coneH = 1.81; // tangent cone height (~1.066 R)
    const coneR = 1.36; // tangent cone base radius (~0.8 R)
    const coneGeo = new THREE.ConeGeometry(coneR, coneH, 18);
    coneGeo.rotateX(Math.PI); // point the tip toward the globe
    coneGeo.translate(0, coneH / 2, 0); // tip at surface (y=0)
    const bulbGeo = new THREE.SphereGeometry(R, 20, 18);
    bulbGeo.translate(0, 2.84, 0); // bulb centered above the tip (~1.67 R)
    const matCache = new Map<string, THREE.MeshLambertMaterial>();
    return (color: string) => {
      let mat = matCache.get(color);
      if (!mat) {
        mat = new THREE.MeshLambertMaterial({ color });
        matCache.set(color, mat);
      }
      const g = new THREE.Group();
      g.add(new THREE.Mesh(coneGeo, mat));
      g.add(new THREE.Mesh(bulbGeo, mat));
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
        objectFacesSurfaces={true}
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
