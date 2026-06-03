"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ScubaSeasonWindow } from "@/lib/scuba-globe";

export type PlanetMarker = {
  id?: string;
  slug?: string;
  site?: string;
  country?: string;
  region?: string;
  lat: number;
  lng: number;
  label: string;
  color?: string;
  notes?: string;
  stateLabel?: string;
  seasonText?: string;
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
  onMarkerClick?: (m: PlanetMarker) => void;
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

const DEFAULT_FOCUS_POINT = {
  lat: 12,
  lng: -135,
  altitude: 2.1,
};

const WORLD_ATLAS_URL =
  "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
// Day-Earth texture for the ocean-bright direction
const EARTH_TEXTURE_URL =
  "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

// Brand palette
const IN_SEASON = "#0089de"; // PADI blue
const OUT_OF_SEASON = "#f23d4e"; // coral accent

export function PlanetGlobe({
  highlightedCountries = [],
  markers = [],
  onMarkerClick,
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
  // Only show a detail popover once the user clicks a pin — no default select.
  const selectedMarker =
    visibleMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      // Prominent in a wide column: scale up to 620px tall, never below 380px.
      const height = Math.min(Math.max(width * 0.66, 380), 620);
      // Only re-render when the size actually changes. ResizeObserver can fire
      // with identical dimensions; an unconditional setState would hand the
      // Globe new accessor functions each time and make it rebuild every
      // marker, orphaning the translucent CSS2D halos into a growing glow.
      setDimensions((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadError(false);
        const response = await fetch(WORLD_ATLAS_URL);
        if (!response.ok) throw new Error(String(response.status));
        const topology = (await response.json()) as WorldAtlasTopology;
        const geoJson = feature(
          topology as never,
          topology.objects.countries as never,
        );
        if (cancelled) return;
        if ("features" in geoJson && Array.isArray(geoJson.features)) {
          setCountries(geoJson.features as GlobeFeature[]);
        } else {
          setCountries([]);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setCountries([]);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  // If the filtered marker set no longer contains the selection, clear it so
  // the popover does not point at a hidden pin.
  useEffect(() => {
    setSelectedMarkerId((current) =>
      current && visibleMarkers.some((m) => m.id === current) ? current : null,
    );
  }, [visibleMarkers]);

  useEffect(() => {
    if (!globeRef.current || dimensions.width === 0) return;
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
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

  // Shared select behaviour: fly the camera in, stop auto-rotate, surface the
  // detail popover, and notify the parent (so it can highlight a card).
  const selectMarker = useCallback(
    (sel: PlanetMarker) => {
      setSelectedMarkerId(sel.id ?? null);
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = false;
      globeRef.current?.pointOfView(
        { lat: sel.lat, lng: sel.lng, altitude: 1.4 },
        900,
      );
      onMarkerClick?.(sel);
    },
    [onMarkerClick],
  );

  // Marker accessors are memoized so react-globe.gl only rebuilds the marker
  // layer when the selection changes — not on every render. A fresh function
  // identity makes three-globe clear and recreate every CSS2D marker, which
  // orphans the translucent halos into a glow that grows over time.
  const selectedId = selectedMarker?.id ?? null;

  const htmlAltitudeAccessor = useCallback(
    (marker: object) => ((marker as PlanetMarker).id === selectedId ? 0.06 : 0.045),
    [selectedId],
  );

  const htmlElementAccessor = useCallback(
    (marker: object) => {
      const site = marker as PlanetMarker;
      const isSelected = site.id === selectedId;
      const color = site.color ?? IN_SEASON;
      const el = document.createElement("div");
      // react-globe.gl sets pointer-events:none on HTML markers by default so
      // they never block globe drag. Opt back in here so the visible pin is the
      // real click target.
      el.style.pointerEvents = "auto";
      el.style.cursor = "pointer";
      el.style.position = "relative";
      el.title = site.site ?? "Dive site";
      el.addEventListener("click", (event) => {
        // Stop the globe controls from treating this as a drag/rotate.
        event.stopPropagation();
        selectMarker(site);
      });

      const halo = document.createElement("div");
      halo.style.position = "absolute";
      halo.style.top = "50%";
      halo.style.left = "50%";
      halo.style.transform = "translate(-50%, -50%)";
      halo.style.width = isSelected ? "26px" : "18px";
      halo.style.height = isSelected ? "26px" : "18px";
      halo.style.borderRadius = "9999px";
      halo.style.background = `${color}26`;
      halo.style.boxShadow = isSelected
        ? `0 0 0 4px ${color}33, 0 0 18px ${color}66`
        : `0 0 0 2px ${color}26`;

      const pin = document.createElement("div");
      pin.style.position = "relative";
      pin.style.zIndex = "1";
      pin.style.width = isSelected ? "12px" : "9px";
      pin.style.height = isSelected ? "12px" : "9px";
      pin.style.borderRadius = "9999px";
      pin.style.background = color;
      pin.style.border = "2px solid white";
      pin.style.boxShadow = "0 2px 6px rgba(0,0,0,0.35)";

      el.appendChild(halo);
      el.appendChild(pin);
      return el;
    },
    [selectedId, selectMarker],
  );

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="relative mx-auto w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-[#eaf4fb] to-[#dfecf6] p-4 shadow-sm"
      >
        <div className="relative min-h-[340px]">
          {dimensions.width > 0 && visibleMarkers.length > 0 ? (
            <Globe
              ref={globeRef}
              width={Math.max(dimensions.width - 32, 0)}
              height={dimensions.height}
              backgroundColor="rgba(0,0,0,0)"
              globeImageUrl={EARTH_TEXTURE_URL}
              showAtmosphere
              atmosphereColor="#a8e6ff"
              atmosphereAltitude={0.18}
              polygonsData={countries}
              polygonAltitude={0.01}
              polygonCapColor={(polygon) => {
                const f = polygon as GlobeFeature;
                const iso2 = f.properties?.iso_a2?.toUpperCase();
                const iso3 = f.properties?.iso_a3?.toUpperCase();
                const name = f.properties?.name?.toUpperCase();
                const isHighlighted =
                  (iso2 && highlightedSet.has(iso2)) ||
                  (iso3 && highlightedSet.has(iso3)) ||
                  (name && highlightedSet.has(name));
                return isHighlighted
                  ? "rgba(0, 137, 222, 0.32)"
                  : "rgba(255, 255, 255, 0.18)";
              }}
              polygonSideColor={() => "rgba(0, 137, 222, 0.08)"}
              polygonStrokeColor={() => "rgba(29, 93, 144, 0.25)"}
              polygonsTransitionDuration={300}
              pointsData={visibleMarkers}
              pointLat="lat"
              pointLng="lng"
              pointColor={() => "rgba(0,0,0,0)"}
              pointAltitude={0.04}
              pointRadius={1.0}
              pointLabel={(marker: object) =>
                (marker as PlanetMarker).site ?? "Dive site"
              }
              onPointClick={(marker: object) => {
                selectMarker(marker as PlanetMarker);
              }}
              htmlElementsData={visibleMarkers}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={htmlAltitudeAccessor}
              htmlElement={htmlElementAccessor}
            />
          ) : null}

          {dimensions.width > 0 && visibleMarkers.length === 0 ? (
            <div className="absolute inset-4 flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/70 px-6 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  No matches
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Try clearing one of the filters to broaden the search.
                </p>
              </div>
            </div>
          ) : null}

          {loadError ? (
            <div className="absolute inset-x-4 bottom-10 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-left text-sm text-slate-700 shadow">
              World atlas data couldn&rsquo;t load. The globe will still spin —
              country highlights are disabled.
            </div>
          ) : null}

          {selectedMarker ? (
            <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900">
                  {selectedMarker.color ? (
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: selectedMarker.color }}
                    />
                  ) : null}
                  {selectedMarker.stateLabel ?? "Reef"}
                </span>
                <h3 className="mt-1.5 text-base font-semibold leading-tight text-slate-900">
                  {selectedMarker.site ?? selectedMarker.label}
                </h3>
                {selectedMarker.country ? (
                  <p className="mt-0.5 text-sm text-slate-500">
                    {selectedMarker.country}
                  </p>
                ) : null}
                {selectedMarker.seasonText ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Best season{" "}
                    <span className="font-semibold text-[#1d5d90]">
                      {selectedMarker.seasonText}
                    </span>
                    {selectedMarker.isInSeason ? (
                      <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        In season now
                      </span>
                    ) : null}
                  </p>
                ) : null}
                {selectedMarker.slug ? (
                  <Link
                    href={`/locations/${selectedMarker.slug}`}
                    className="mt-3 inline-flex text-sm font-medium text-[#0089de] hover:underline"
                  >
                    View location →
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end px-3 pb-2 text-[11px] text-slate-600/80">
              <span>Click a location to inspect details</span>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

