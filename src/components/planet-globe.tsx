"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { useEffect, useRef, useState } from "react";

export type PlanetMarker = {
  lat: number;
  lng: number;
  label: string;
  color?: string;
};

export type PlanetGlobeProps = {
  highlightedCountries?: string[];
  markers?: PlanetMarker[];
  focusPoint?: {
    lat: number;
    lng: number;
    altitude?: number;
  };
};

type GlobeFeature = {
  properties?: {
    iso_a2?: string;
    iso_a3?: string;
    name?: string;
  };
};

type WorldAtlasTopology = {
  objects: {
    countries: object;
  };
};

const DEFAULT_MARKERS: PlanetMarker[] = [
  {
    lat: -16.7346,
    lng: -151.0094,
    label: "Placeholder reef marker",
    color: "#68e4ff",
  },
];

const DEFAULT_FOCUS_POINT = {
  lat: 12,
  lng: -135,
  altitude: 2.1,
};

const WORLD_ATLAS_URL =
  "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
const EARTH_TEXTURE_URL =
  "//unpkg.com/three-globe/example/img/earth-night.jpg";

const hexToRgb = (hex: string) => {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const parsed = Number.parseInt(normalized, 16);

  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

export function PlanetGlobe({
  highlightedCountries = [],
  markers = DEFAULT_MARKERS,
  focusPoint = DEFAULT_FOCUS_POINT,
}: PlanetGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [countries, setCountries] = useState<GlobeFeature[]>([]);
  const [loadError, setLoadError] = useState(false);

  const highlightedSet = new Set(
    highlightedCountries.map((country) => country.toUpperCase()),
  );
  const visibleMarkers = markers.length > 0 ? markers : DEFAULT_MARKERS;

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const updateSize = () => {
      if (!containerRef.current) {
        return;
      }

      const width = containerRef.current.offsetWidth;
      const height = Math.min(Math.max(width * 0.7, 320), 540);
      setDimensions({ width, height });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadCountries = async () => {
      try {
        setLoadError(false);

        const response = await fetch(WORLD_ATLAS_URL);

        if (!response.ok) {
          throw new Error(`Failed to load atlas: ${response.status}`);
        }

        const topology = (await response.json()) as WorldAtlasTopology;
        const geoJson = feature(
          topology as never,
          topology.objects.countries as never,
        );

        if (cancelled) {
          return;
        }

        if ("features" in geoJson && Array.isArray(geoJson.features)) {
          setCountries(geoJson.features as GlobeFeature[]);
          return;
        }

        setCountries([]);
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setCountries([]);
        }
      }
    };

    void loadCountries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!globeRef.current || dimensions.width === 0) {
      return;
    }

    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = false;
    controls.minDistance = 180;
    controls.maxDistance = 320;

    globeRef.current.pointOfView(
      {
        lat: focusPoint.lat,
        lng: focusPoint.lng,
        altitude: focusPoint.altitude ?? DEFAULT_FOCUS_POINT.altitude,
      },
      0,
    );
  }, [dimensions.width, focusPoint]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-cyan-100/10 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.24),_transparent_36%),linear-gradient(180deg,_rgba(3,15,32,0.98),_rgba(1,8,18,0.98))] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative min-h-[340px]">
          {dimensions.width > 0 ? (
            <Globe
              ref={globeRef}
              width={Math.max(dimensions.width - 32, 0)}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl={EARTH_TEXTURE_URL}
              showAtmosphere
              atmosphereColor="#7dd3fc"
              atmosphereAltitude={0.14}
              polygonsData={countries}
              polygonAltitude={0.01}
              polygonCapColor={(polygon) => {
                const globeFeature = polygon as GlobeFeature;
                const iso2 = globeFeature.properties?.iso_a2?.toUpperCase();
                const iso3 = globeFeature.properties?.iso_a3?.toUpperCase();
                const isHighlighted =
                  (iso2 && highlightedSet.has(iso2)) ||
                  (iso3 && highlightedSet.has(iso3));

                return isHighlighted
                  ? "rgba(45, 212, 191, 0.92)"
                  : "rgba(232, 249, 255, 0.78)";
              }}
              polygonSideColor={(polygon) => {
                const globeFeature = polygon as GlobeFeature;
                const iso2 = globeFeature.properties?.iso_a2?.toUpperCase();
                const iso3 = globeFeature.properties?.iso_a3?.toUpperCase();
                const isHighlighted =
                  (iso2 && highlightedSet.has(iso2)) ||
                  (iso3 && highlightedSet.has(iso3));

                return isHighlighted
                  ? "rgba(13, 148, 136, 0.58)"
                  : "rgba(15, 23, 42, 0.3)";
              }}
              polygonStrokeColor={() => "rgba(4, 18, 33, 0.65)"}
              polygonsTransitionDuration={300}
              pointsData={visibleMarkers}
              pointLat="lat"
              pointLng="lng"
              pointColor="color"
              pointAltitude={0.04}
              pointRadius={0.6}
              pointLabel="label"
              ringsData={visibleMarkers}
              ringLat="lat"
              ringLng="lng"
              ringColor={(marker: object) => {
                const planetMarker = marker as PlanetMarker;
                const rgb = hexToRgb(planetMarker.color ?? "#68e4ff");

                return (t: number) =>
                  `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, 0.85 - t)})`;
              }}
              ringMaxRadius={6}
              ringPropagationSpeed={2.6}
              ringRepeatPeriod={1100}
            />
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-3 pb-3 text-xs text-cyan-50/70">
            <span>Planet prototype</span>
            <span>{visibleMarkers.length} markers loaded</span>
          </div>

          {loadError ? (
            <div className="absolute inset-x-4 bottom-10 rounded-2xl border border-cyan-200/10 bg-slate-950/80 px-4 py-3 text-left text-sm text-slate-300 backdrop-blur">
              Planet data placeholder is ready, but the temporary world atlas
              source could not be loaded.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
