"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  if (filters.animals.length) {
    chips.push({
      label: `Wildlife: ${filters.animals.join(", ")}`,
      onRemove: () => onChange({ ...filters, animals: [] }),
    });
  }
  if (filters.freshOnly) {
    chips.push({
      label: "Needs fresh eyes only",
      onRemove: () => onChange({ ...filters, freshOnly: false }),
    });
  }

  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
      <p className="text-sm font-medium text-[#aebcd0]">No locations match these filters.</p>
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.onRemove}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#8b9db8] transition hover:border-rose-500/30 hover:bg-rose-500/15 hover:text-rose-300"
            >
              {c.label}
              <span aria-hidden className="text-[#8b9db8]">×</span>
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onReset}
        className="mt-4 text-xs font-medium text-[#00d4ff] hover:underline"
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Count non-default active filters for the badge on the mobile Filters button.
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.condition.length !== STATE_VALUES.length) n++;
    n += filters.months.length ? 1 : 0;
    n += filters.skill.length ? 1 : 0;
    n += filters.region.length ? 1 : 0;
    n += filters.heat.length ? 1 : 0;
    n += filters.animals.length ? 1 : 0;
    if (filters.freshOnly) n++;
    return n;
  }, [filters]);

  // Close drawer on Escape.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Prevent body scroll while drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

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

  const toggleState = (state: string) => {
    setFilters((prev) => {
      const has = prev.condition.includes(state);
      return {
        ...prev,
        condition: has
          ? prev.condition.filter((s) => s !== state)
          : [...prev.condition, state],
      };
    });
  };

  return (
    <section className="mt-8">
      {/* ── Horizontal pill filter bar (desktop) ── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {/* Reef state chips */}
        {STATE_VALUES.map((state) => {
          const active = filters.condition.includes(state);
          return (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderColor: active ? "#00d4ff" : "rgba(255,255,255,0.1)",
                background: active ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)",
                color: active ? "#00d4ff" : "#8b9db8",
                fontWeight: active ? 600 : 500,
              }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
                style={{ background: STATE_COLOR[state as ReefState] }}
              />
              {STATE_LABEL[state]}
            </button>
          );
        })}

        {/* Sort select pushed to the right */}
        <label className="ml-auto flex items-center gap-2 text-sm text-[#8b9db8]">
          Sort
          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((p) => ({ ...p, sort: e.target.value as SortKey }))
            }
            className="rounded-lg border border-white/10 bg-[#0a1628] px-3 py-1.5 text-sm text-[#f0f4f8] focus:border-[#00d4ff] focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Mobile "Filters" button — hidden on lg+ where the sidebar is always visible */}
      <div className="mb-4 flex items-center lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#aebcd0] shadow-sm transition hover:border-[#00d4ff] hover:text-[#00d4ff]"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.032c0 .384-.22.735-.57.899l-2.5 1.25a.75.75 0 01-1.056-.575v-4.606a2.25 2.25 0 00-.659-1.59L2.659 6.219A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-[#00d4ff] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#0a1628]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          {/* Panel */}
          <div
            ref={drawerRef}
            className="absolute inset-y-0 left-0 flex w-80 max-w-[90vw] flex-col bg-[#0a1628] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-sm font-semibold text-[#f0f4f8]">Filters</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[#8b9db8] hover:bg-white/5 hover:text-[#f0f4f8]"
                aria-label="Close filters"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AtlasFilterRail
                filters={filters}
                onChange={setFilters}
                onReset={reset}
                regions={regions}
                skills={skills}
                className="h-full"
              />
            </div>
            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-full rounded-xl bg-[#00d4ff] py-2.5 text-sm font-semibold text-[#0a1628] transition hover:bg-[#33ddff]"
              >
                Show {results.length} location{results.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
        <AtlasFilterRail
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          regions={regions}
          skills={skills}
          className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"
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
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-[#8b9db8]">
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
            <Link href="/data" className="font-medium text-[#00d4ff] hover:underline">
              What these mean
            </Link>
          </div>

          {/* Count */}
          <div className="mb-5 mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-[#8b9db8]" role="status" aria-live="polite">
              <strong className="text-[#f0f4f8]">{results.length}</strong> of{" "}
              {locations.length} locations
            </span>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {results.map((r) => (
                <div
                  key={r.slug}
                  className={
                    activeSlug === r.slug
                      ? "rounded-2xl ring-2 ring-[#00d4ff] ring-offset-2"
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
