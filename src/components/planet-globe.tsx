"use client";

import Globe, { type GlobeMethods } from "react-globe.gl";
import { feature } from "topojson-client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const height = Math.min(Math.max(width * 0.62, 320), 520);
      setDimensions({ width, height });
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

  useEffect(() => {
    const inSeason = visibleMarkers.find((m) => m.isInSeason);
    setSelectedMarkerId(inSeason?.id ?? visibleMarkers[0]?.id ?? null);
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
                const sel = marker as PlanetMarker;
                setSelectedMarkerId(sel.id ?? null);
                const controls = globeRef.current?.controls();
                if (controls) controls.autoRotate = false;
                globeRef.current?.pointOfView(
                  { lat: sel.lat, lng: sel.lng, altitude: 1.4 },
                  900,
                );
              }}
              htmlElementsData={visibleMarkers}
              htmlLat="lat"
              htmlLng="lng"
              htmlAltitude={(marker: object) =>
                (marker as PlanetMarker).id === selectedMarker?.id ? 0.06 : 0.045
              }
              htmlElement={(marker: object) => {
                const site = marker as PlanetMarker;
                const isSelected = site.id === selectedMarker?.id;
                const color = site.color ?? IN_SEASON;
                const el = document.createElement("div");
                el.style.pointerEvents = "none";
                el.style.position = "relative";
                el.title = "";

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
              }}
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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-end px-3 pb-2 text-[11px] text-slate-600/80">
            <span>Click a location to inspect details</span>
          </div>
        </div>
      </div>

      {/* Marker detail card */}
      {selectedMarker ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {selectedMarker.site}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedMarker.country}
                {selectedMarker.region ? ` · ${selectedMarker.region}` : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                selectedMarker.isInSeason
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200"
              }`}
            >
              {selectedMarker.isInSeason ? "● In season" : "○ Out of season"}
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1.3fr_1fr]">
            <div className="space-y-3">
              <Field label="Best window" value={selectedMarker.seasonLabel} />
              <Field label="Style" value={selectedMarker.diveStyle} />
              <Field label="Experience" value={selectedMarker.experienceLevel} />
              <Field label="Water + suit">
                <span>
                  {selectedMarker.waterTemp}
                  <br />
                  <span className="text-slate-500">
                    {selectedMarker.suitRecommendation}
                  </span>
                </span>
              </Field>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                What you&rsquo;ll see
              </p>
              <ul className="space-y-1.5">
                {(selectedMarker.sightings ?? []).map((s) => (
                  <li
                    key={s.name}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 ring-1 ring-inset ring-slate-200">
                      {s.likelihood}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedMarker.id ? (
            <Link
              href={`/locations/${selectedMarker.id}`}
              className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#0089de] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d5d90]"
            >
              View dive sites in this area →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm leading-6 text-slate-700">
        {children ?? value ?? "—"}
      </div>
    </div>
  );
}
