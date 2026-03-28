"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { useEffect, useRef, useState } from "react";
import type { ScubaSeasonWindow } from "@/lib/scuba-globe";

export type PlanetMarker = {
  id?: string;
  site?: string;
  country?: string;
  region?: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  notes?: string;
  seasonLabel?: string;
  season?: ScubaSeasonWindow;
  isInSeason?: boolean;
  sightings?: Array<{
    name: string;
    likelihood: "High" | "Medium" | "Occasional";
  }>;
  diveStyle?: string;
  experienceLevel?: string;
  conditions?: string;
  gear?: string[];
  waterTemp?: string;
  suitRecommendation?: string;
  gettingThere?: string;
  stay?: string;
  tripMode?: "liveaboard" | "resort";
  experienceTags?: Array<"beginner" | "intermediate" | "advanced">;
  interestTags?: string[];
  animalTags?: string[];
};

export type PlanetGlobeProps = {
  initialMonth?: number;
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
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const highlightedSet = new Set(
    highlightedCountries.map((country) => country.trim().toUpperCase()),
  );
  const visibleMarkers = markers;
  const selectedMarker =
    visibleMarkers.find((marker) => marker.id === selectedMarkerId) ??
    visibleMarkers[0] ??
    null;
  const selectedRings = selectedMarker ? [selectedMarker] : [];

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
    setSelectedMarkerId(visibleMarkers[0]?.id ?? null);
  }, [visibleMarkers]);

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
          {dimensions.width > 0 && visibleMarkers.length > 0 ? (
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
                const name = globeFeature.properties?.name?.toUpperCase();
                const isHighlighted =
                  (iso2 && highlightedSet.has(iso2)) ||
                  (iso3 && highlightedSet.has(iso3)) ||
                  (name && highlightedSet.has(name));

                return isHighlighted
                  ? "rgba(73, 111, 86, 0.48)"
                  : "rgba(210, 225, 236, 0.3)";
              }}
              polygonSideColor={(polygon) => {
                const globeFeature = polygon as GlobeFeature;
                const iso2 = globeFeature.properties?.iso_a2?.toUpperCase();
                const iso3 = globeFeature.properties?.iso_a3?.toUpperCase();
                const name = globeFeature.properties?.name?.toUpperCase();
                const isHighlighted =
                  (iso2 && highlightedSet.has(iso2)) ||
                  (iso3 && highlightedSet.has(iso3)) ||
                  (name && highlightedSet.has(name));

                return isHighlighted
                  ? "rgba(42, 66, 51, 0.34)"
                  : "rgba(6, 18, 30, 0.14)";
              }}
              polygonStrokeColor={() => "rgba(10, 27, 44, 0.22)"}
              polygonsTransitionDuration={300}
              pointsData={visibleMarkers}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => "rgba(0,0,0,0)"}
              pointAltitude={0.055}
              pointRadius={1.12}
              pointLabel={(marker: object) =>
                (marker as PlanetMarker).site ?? "Dive site"
              }
              onPointClick={(marker: object) => {
                const selected = marker as PlanetMarker;
                setSelectedMarkerId(selected.id ?? null);

                const controls = globeRef.current?.controls();

                if (controls) {
                  controls.autoRotate = false;
                }

                globeRef.current?.pointOfView(
                  {
                    lat: selected.lat,
                    lng: selected.lng,
                    altitude: 1.15,
                  },
                  900,
                );
              }}
              ringsData={selectedRings}
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
              htmlElementsData={visibleMarkers}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={(marker: object) =>
                (marker as PlanetMarker).id === selectedMarker?.id ? 0.075 : 0.052
              }
              htmlElement={(marker: object) => {
                const site = marker as PlanetMarker;
                const isSelected = site.id === selectedMarker?.id;
                const color = site.color ?? "#2f5d39";
                const el = document.createElement("div");
                const pin = document.createElement("div");
                const halo = document.createElement("div");
                const stem = document.createElement("div");

                el.style.pointerEvents = "none";
                el.style.display = "flex";
                el.style.flexDirection = "column";
                el.style.alignItems = "center";
                el.style.transform = "translateY(-3px)";
                el.title = "";
                el.style.position = "relative";

                halo.style.position = "absolute";
                halo.style.top = isSelected ? "0px" : "1px";
                halo.style.width = isSelected ? "18px" : "14px";
                halo.style.height = isSelected ? "18px" : "14px";
                halo.style.borderRadius = "9999px";
                halo.style.background = `${color}22`;
                halo.style.boxShadow = isSelected
                  ? `0 0 0 6px ${color}1f`
                  : `0 0 0 3px ${color}14`;

                pin.style.width = isSelected ? "12px" : "10px";
                pin.style.height = isSelected ? "12px" : "10px";
                pin.style.borderRadius = "9999px";
                pin.style.background = color;
                pin.style.border = isSelected
                  ? "2px solid rgba(255,255,255,0.9)"
                  : "1.5px solid rgba(255,255,255,0.55)";
                pin.style.boxShadow = isSelected
                  ? "0 8px 24px rgba(2, 8, 23, 0.45)"
                  : "0 5px 14px rgba(2, 8, 23, 0.34)";
                pin.style.position = "relative";
                pin.style.zIndex = "1";

                stem.style.width = isSelected ? "2px" : "1.5px";
                stem.style.height = isSelected ? "12px" : "9px";
                stem.style.marginTop = "2px";
                stem.style.borderRadius = "9999px";
                stem.style.background = color;
                stem.style.opacity = isSelected ? "0.95" : "0.72";

                el.appendChild(halo);
                el.appendChild(pin);
                el.appendChild(stem);
                return el;
              }}
            />
          ) : null}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end px-3 pb-3 text-xs text-cyan-50/70">
            <span>Click a location to pause and inspect details</span>
          </div>

          {dimensions.width > 0 && visibleMarkers.length === 0 ? (
            <div className="absolute inset-4 flex items-center justify-center rounded-[1.5rem] border border-dashed border-cyan-100/15 bg-slate-950/50 px-6 text-center">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-cyan-100/55">
                  No Matches
                </p>
                <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
                  Try clearing one of the filters or broadening what your divers
                  want to see.
                </p>
              </div>
            </div>
          ) : null}

          {loadError ? (
            <div className="absolute inset-x-4 bottom-10 rounded-2xl border border-cyan-200/10 bg-slate-950/80 px-4 py-3 text-left text-sm text-slate-300 backdrop-blur">
              Planet data placeholder is ready, but the temporary world atlas
              source could not be loaded.
            </div>
          ) : null}
        </div>
      </div>

      {selectedMarker ? (
        <div className="mt-4 rounded-[1.75rem] border border-white/10 bg-slate-950/75 p-5 text-left text-slate-100 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {selectedMarker.site ?? "Dive site"}
              </h2>
              <p className="text-sm text-slate-300">
                {selectedMarker.country}
                {selectedMarker.region ? ` • ${selectedMarker.region}` : ""}
              </p>
            </div>
            <div
              className="rounded-full border px-3 py-1 text-sm font-medium"
              style={{
                borderColor: selectedMarker.color ?? "#2f5d39",
                color: selectedMarker.color ?? "#2f5d39",
                backgroundColor: `${selectedMarker.color ?? "#2f5d39"}22`,
              }}
            >
              {selectedMarker.isInSeason ? "In season" : "Out of season"}
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Best window</p>
                <p className="mt-1 text-sm text-slate-300">{selectedMarker.seasonLabel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Dive style</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMarker.diveStyle}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Experience level</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMarker.experienceLevel}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Conditions</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMarker.conditions}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Water temperature</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMarker.waterTemp}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-cyan-100/70">Exposure protection</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {selectedMarker.suitRecommendation}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-cyan-100/70">What you&apos;ll see</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {(selectedMarker.sightings ?? []).map((sighting) => (
                  <li
                    key={sighting.name}
                    className="rounded-xl bg-white/5 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-100">{sighting.name}</div>
                      <div className="shrink-0 rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-100/60">
                        {sighting.likelihood}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <p className="text-sm font-medium text-cyan-100/70">Recommended gear</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {(selectedMarker.gear ?? []).length > 0
                    ? "Standard recreational gear plus these extras is recommended:"
                    : "Standard recreational gear will do here."}
                </p>
                {(selectedMarker.gear ?? []).length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    {(selectedMarker.gear ?? []).map((item) => (
                      <li key={item} className="rounded-xl bg-white/5 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <p className="text-sm font-medium text-cyan-100/70">How to get there</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedMarker.gettingThere}
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <p className="text-sm font-medium text-cyan-100/70">Where to stay</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedMarker.stay}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
