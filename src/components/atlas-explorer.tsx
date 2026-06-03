"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AtlasFilterRail,
  applyFilters,
  parseFilters,
  filtersToParams,
  DEFAULT_FILTERS,
  STATE_VALUES,
  SORT_OPTIONS,
} from "./atlas-filter-rail";
import type { FilterLocation, Filters, SortKey } from "./atlas-filter-rail";
import { ReefLocationCard } from "./reef-location-card";
import { HomeGlobe } from "./home-globe";
import type { PlanetMarker } from "./planet-globe";
import { STATE_COLOR, STATE_TEXT, STATE_DEF } from "@/lib/data/reef-state";
import type { ReefState } from "@/lib/data/reef-state";

const LEGEND_STATES: ReefState[] = ["thriving", "pressure", "change"];

const STATE_LABEL: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function NoResults({
  filters,
  onChange,
  onReset,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onReset: () => void;
}) {
  const chips: { label: string; onRemove: () => void }[] = [];

  const missingStates = STATE_VALUES.filter((s) => !filters.condition.includes(s));
  if (missingStates.length) {
    chips.push({
      label: `Reef state: ${missingStates.map((s) => STATE_LABEL[s]).join(", ")} hidden`,
      onRemove: () => onChange({ ...filters, condition: [...STATE_VALUES] }),
    });
  }
  if (filters.skill.length) {
    chips.push({
      label: `Certification: ${filters.skill.join(", ")}`,
      onRemove: () => onChange({ ...filters, skill: [] }),
    });
  }
  if (filters.months.length) {
    chips.push({
      label: `Months: ${filters.months.map((m) => MONTH_ABBR[m - 1]).join(", ")}`,
      onRemove: () => onChange({ ...filters, months: [] }),
    });
  }
  if (filters.region.length) {
    chips.push({
      label: `${filters.region.length} region${filters.region.length > 1 ? "s" : ""}`,
      onRemove: () => onChange({ ...filters, region: [] }),
    });
  }
  if (filters.heat.length) {
    chips.push({
      label: `Thermal stress: ${filters.heat.join(", ")}`,
      onRemove: () => onChange({ ...filters, heat: [] }),
    });
  }
  if (filters.freshOnly) {
    chips.push({
      label: "Needs fresh eyes only",
      onRemove: () => onChange({ ...filters, freshOnly: false }),
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
      <p className="text-sm font-medium text-slate-700">No locations match these filters.</p>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              {c.label}
              <span aria-hidden className="text-slate-400">×</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs font-medium text-[#0089de] hover:underline"
      >
        Reset all filters
      </button>
    </div>
  );
}

/**
 * The atlas explorer. Owns the shared filter state and feeds three views from a
 * single filtered result set: the left filter rail, the globe, and the results
 * grid. Toggling any filter immediately reshapes all three.
 */
export function AtlasExplorer({
  locations,
  regions,
  skills,
}: {
  locations: FilterLocation[];
  regions: string[];
  skills: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  // Slug of the location the user last clicked on the globe, used to highlight
  // its card in the grid.
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Keep the URL in sync so a filtered view is shareable / refreshable.
  useEffect(() => {
    const qs = filtersToParams(filters).toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [filters, router]);

  const reset = useCallback(
    () => setFilters({ ...DEFAULT_FILTERS, condition: [...STATE_VALUES] }),
    [],
  );

  // Compute the filtered set ONCE; everything else derives from it.
  const results = useMemo(() => applyFilters(locations, filters), [locations, filters]);

  // Globe markers derived from the filtered results — color by reef state via
  // the canonical STATE_COLOR map, with in season reefs flagged.
  const markers: PlanetMarker[] = useMemo(
    () =>
      results.map((r) => ({
        id: r.slug,
        slug: r.slug,
        site: r.name,
        label: r.name,
        country: r.country,
        region: r.region,
        lat: r.lat,
        lng: r.lng,
        color: STATE_COLOR[r.state],
        stateLabel: STATE_TEXT[r.state],
        seasonText: r.season,
        isInSeason: r.inSeason,
      })),
    [results],
  );

  // Highlighted countries derived from the same filtered results.
  const highlightedCountries = useMemo(
    () => Array.from(new Set(results.map((r) => r.countryCode).filter(Boolean))),
    [results],
  );

  return (
    <section className="mt-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <AtlasFilterRail
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          regions={regions}
          skills={skills}
        />

        {/* min-w-0 keeps this 1fr track purely flexible. Without it the track's
            default min-width:auto lets the globe canvas (sized to the column's
            width) push the column wider each frame, a feedback loop that makes
            the globe grow without bound. */}
        <div className="min-w-0">
          <HomeGlobe
            markers={markers}
            highlightedCountries={highlightedCountries}
            onMarkerClick={(m) => setActiveSlug(m.slug ?? null)}
          />

          {/* Thin inline reef-state legend */}
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-slate-600">
            {LEGEND_STATES.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5"
                title={STATE_DEF[s].short}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: STATE_COLOR[s] }}
                />
                {STATE_TEXT[s]}
              </span>
            ))}
            <Link href="/data" className="font-medium text-[#0089de] hover:underline">
              What these mean
            </Link>
          </div>

          {/* Count + sort */}
          <div className="mb-5 mt-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-600">
              <strong className="text-slate-900">{results.length}</strong> of{" "}
              {locations.length} locations
            </span>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, sort: e.target.value as SortKey }))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-[#0089de] focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((r) => (
                <div
                  key={r.slug}
                  className={
                    activeSlug === r.slug
                      ? "rounded-2xl ring-2 ring-[#0089de] ring-offset-2"
                      : undefined
                  }
                >
                  <ReefLocationCard r={r} />
                </div>
              ))}
            </div>
          ) : (
            <NoResults filters={filters} onChange={setFilters} onReset={reset} />
          )}
        </div>
      </div>
    </section>
  );
}
