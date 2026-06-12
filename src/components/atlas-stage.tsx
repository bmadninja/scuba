"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  parseFilters,
  filtersToParams,
  DEFAULT_FILTERS,
  STATE_VALUES,
  SORT_OPTIONS,
  CONTINENT_ORDER,
  regionContinent,
} from "./atlas-filter-rail";
import type { FilterLocation, Filters, SortKey } from "./atlas-filter-rail";
import { WILDLIFE_TAXONOMY } from "@/lib/atlas-location";
import { freshness } from "@/lib/data/reef-state";
import type { FreshnessKey } from "@/lib/data/reef-state";
import { HeroPhoto } from "./hero-photo";
import { HomeGlobe } from "./home-globe";
import type { PlanetMarker } from "./planet-globe";
import { STATE_COLOR, STATE_TEXT } from "@/lib/data/reef-state";
import { AtlasInfoPopup, InfoButton } from "./atlas-info-popup";
import type { InfoKey } from "./atlas-info-popup";

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// The current month is computed on the server and passed in as a prop so SSR and
// client hydration agree. Deriving it here with `new Date()` would read the
// client's local clock/timezone and could differ from the server, causing a
// hydration mismatch on the season pills and the highlighted month button.

const STATE_LABEL: Record<string, string> = {
  thriving: "Thriving",
  pressure: "Under pressure",
  change: "Witnessing change",
};

const STATE_SWATCH: Record<string, string> = {
  thriving: "#10b981",
  pressure: "#f59e0b",
  change: "#f43f5e",
};

const CERT_OPTIONS = ["Beginner", "Open water", "Advanced", "Technical"];
const SKILL_RANK: Record<string, number> = {
  Beginner: 0,
  "Open water": 1,
  Advanced: 2,
  Technical: 3,
};

// ─── Match logic — continent-level region + fresh-eyes, in-season-first sort ───

function matches(r: FilterLocation, f: Filters): boolean {
  if (f.condition.length && !f.condition.includes(r.state)) return false;

  if (f.skill.length) {
    const ceiling = Math.max(...f.skill.map((s) => SKILL_RANK[s] ?? 0));
    if ((SKILL_RANK[r.skill] ?? 0) > ceiling) return false;
  }

  // Region filter is by country. Selecting a continent selects all its
  // countries, so a country-level match also satisfies a continent selection.
  if (f.region.length && !f.region.includes(r.country)) return false;

  if (f.animals.length && !f.animals.some((a) => r.animalTags.includes(a))) return false;

  if (f.freshOnly) {
    const k: FreshnessKey | "none" =
      r.lastSurveyDays === null ? "none" : freshness(r.lastSurveyDays).k;
    if (k === "fresh") return false;
  }

  return true;
}

// ─── Collapsible filter section (native <details>) ─────────────────────────────

function FilterSection({
  title,
  infoKey,
  onInfo,
  children,
  defaultOpen = true,
}: {
  title: string;
  infoKey?: InfoKey;
  onInfo?: (k: InfoKey) => void;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-t border-white/10">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#8b9db8] [&::-webkit-details-marker]:hidden">
        {title}
        {infoKey && onInfo && (
          <InfoButton onClick={() => onInfo(infoKey)} label="How this works" />
        )}
        <span className="ml-auto text-[0.7rem] text-[#8b9db8] transition group-open:rotate-0 [.group:not([open])_&]:-rotate-90" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="pb-3.5">{children}</div>
    </details>
  );
}

function CheckRow({
  on,
  swatch,
  tint,
  onClick,
  children,
}: {
  on: boolean;
  swatch?: string;
  tint?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium transition ${
        on && tint ? "bg-[rgba(0,212,255,0.12)] text-[#f0f4f8]" : "text-[#f0f4f8] hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 text-[10px] font-bold text-white transition ${
          on ? "border-[#00d4ff] bg-[#00d4ff]" : "border-white/10 bg-[#0a1628]"
        }`}
        aria-hidden
      >
        {on ? "✓" : ""}
      </span>
      {swatch && (
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden />
      )}
      {children}
    </button>
  );
}

// ─── Wildlife taxonomy group (collapsible, multi-select leaf tags) ─────────────

function TaxoGroup({
  group,
  tags,
  selected,
  onToggle,
}: {
  group: string;
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  const count = tags.filter((t) => selected.includes(t)).length;
  return (
    <details open={count > 0} className="group/cat overflow-hidden rounded-[0.6rem] border border-white/10">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-[0.8125rem] font-bold text-[#f0f4f8] [&::-webkit-details-marker]:hidden">
        {group}
        <span className="ml-auto text-[#8b9db8] transition group-open/cat:rotate-180" aria-hidden>
          ⌄
        </span>
      </summary>
      <div className="flex flex-wrap gap-1.5 px-2.5 pb-2.5">
        {tags.map((t) => {
          const on = selected.includes(t);
          return (
            <button
              key={t}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                on
                  ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]"
                  : "border-white/10 bg-white/5 text-[#8b9db8] hover:border-white/20"
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>
    </details>
  );
}

// ─── Region tree — continent expands to its countries ──────────────────────────

function RegionTree({
  groups,
  selected,
  onToggleCountry,
  onToggleContinent,
}: {
  groups: { continent: string; countries: string[] }[];
  selected: string[];
  onToggleCountry: (country: string) => void;
  onToggleContinent: (countries: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {groups.map(({ continent, countries }) => {
        const activeCount = countries.filter((c) => selected.includes(c)).length;
        const allOn = countries.length > 0 && activeCount === countries.length;
        return (
          <details key={continent} open={activeCount > 0} className="group/reg">
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-[#f0f4f8] hover:bg-white/5 [&::-webkit-details-marker]:hidden">
              <span
                role="checkbox"
                aria-checked={allOn ? "true" : activeCount > 0 ? "mixed" : "false"}
                aria-label={`All of ${continent}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleContinent(countries);
                }}
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 text-[10px] font-bold transition ${
                  allOn
                    ? "border-[#00d4ff] bg-[#00d4ff] text-[#0a1628]"
                    : activeCount > 0
                      ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]"
                      : "border-white/10 bg-[#0a1628] text-white"
                }`}
              >
                {allOn ? "✓" : activeCount > 0 ? "–" : ""}
              </span>
              {continent}
              <span className="ml-auto text-[0.7rem] text-[#8b9db8] transition group-open/reg:rotate-180" aria-hidden>
                ⌄
              </span>
            </summary>
            <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-white/10 pl-2">
              {countries.map((country) => (
                <CheckRow
                  key={country}
                  on={selected.includes(country)}
                  onClick={() => onToggleCountry(country)}
                >
                  {country}
                </CheckRow>
              ))}
            </div>
          </details>
        );
      })}
    </div>
  );
}

// ─── Place-only reef card ──────────────────────────────────────────────────────

function ReefCard({
  r,
  freshEyes,
  showFreshPill,
}: {
  r: FilterLocation;
  freshEyes: boolean;
  showFreshPill: boolean;
}) {
  // Witnessing-change cards do not lift on hover.
  const lift = r.state !== "change";
  return (
    <Link
      href={`/locations/${r.slug}`}
      className={`group block overflow-hidden rounded-2xl border border-white/10 bg-[#0a1628] text-inherit no-underline ${
        lift
          ? "transition hover:-translate-y-[3px] hover:border-[#00d4ff]/30 hover:shadow-[0_16px_34px_-14px_rgba(0,0,0,0.5)]"
          : ""
      }`}
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <HeroPhoto
          url={r.heroImageUrl}
          alt={`Underwater reef at ${r.name}`}
          seed={r.slug ?? r.name}
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        {showFreshPill && freshEyes && (
          <span
            className="absolute left-2 top-2 inline-flex items-center rounded-full border px-1.5 py-[0.15rem] text-[0.55rem] font-bold backdrop-blur-[6px]"
            style={{
              background: "rgba(8,20,34,0.55)",
              color: "#fcd34d",
              borderColor: "rgba(252,211,77,0.45)",
            }}
          >
            Fresh eyes
          </span>
        )}
      </div>

      {/* Label block */}
      <div className="p-2.5">
        <p
          className="mb-1 flex items-center gap-1 text-[0.575rem] font-bold uppercase tracking-[0.12em]"
          style={{ color: STATE_SWATCH[r.state] }}
        >
          <span
            className="h-[5px] w-[5px] shrink-0 rounded-full"
            style={{ background: STATE_SWATCH[r.state] }}
            aria-hidden
          />
          {STATE_LABEL[r.state]}
        </p>
        <p className="text-[1.0625rem] font-extrabold tracking-[-0.01em] text-[#f0f4f8] transition-colors group-hover:text-[#00d4ff]">

          {r.name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-[#8b9db8]">
          {r.country} <span className="text-[#8b9db8]/50" aria-hidden>·</span> {r.region}
        </p>
      </div>
    </Link>
  );
}

// ─── Main stage ────────────────────────────────────────────────────────────────

export function AtlasStage({
  locations,
  currentMonth,
}: {
  locations: FilterLocation[];
  currentMonth: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(searchParams));
  const [view, setView] = useState<"cards" | "map">("cards");
  const [info, setInfo] = useState<InfoKey | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Keep the URL in sync so a filtered view is shareable / refreshable.
  useEffect(() => {
    const qs = filtersToParams(filters).toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  }, [filters, router]);

  const reset = useCallback(
    () => setFilters({ ...DEFAULT_FILTERS, condition: [...STATE_VALUES] }),
    [],
  );

  const toggle = (
    facet: "condition" | "months" | "skill" | "region" | "animals",
    value: string | number,
  ) => {
    setFilters((prev) => {
      const arr = prev[facet] as (string | number)[];
      const next = arr.includes(value as never)
        ? arr.filter((x) => x !== value)
        : [...arr, value];
      return { ...prev, [facet]: next };
    });
  };

  // Toggle every country in a continent on/off together.
  const toggleRegionContinent = (countries: string[]) => {
    setFilters((prev) => {
      const allOn = countries.every((c) => prev.region.includes(c));
      const next = allOn
        ? prev.region.filter((c) => !countries.includes(c))
        : Array.from(new Set([...prev.region, ...countries]));
      return { ...prev, region: next };
    });
  };

  // Region tree: continents (ordered) → the countries present under each.
  const regionGroups = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const r of locations) {
      const c = regionContinent(r.region);
      (map.get(c) ?? map.set(c, new Set()).get(c)!).add(r.country);
    }
    return [...CONTINENT_ORDER, "Other"]
      .filter((c) => map.has(c))
      .map((c) => ({ continent: c, countries: Array.from(map.get(c)!).sort() }));
  }, [locations]);

  // Hard-filtered set (everything except the season sort split).
  const matched = useMemo(
    () => locations.filter((r) => matches(r, filters)),
    [locations, filters],
  );

  // In-season-first sort: reefs whose bestMonths include a selected month (or the
  // current month if none selected) come first; the rest fall below a divider.
  const selectedMonths = useMemo(
    () => (filters.months.length ? filters.months : [currentMonth]),
    [filters.months, currentMonth],
  );
  const isInSeason = useCallback(
    (r: FilterLocation) => selectedMonths.some((m) => r.bestMonths.includes(m)),
    [selectedMonths],
  );

  const { inSeason, offSeason } = useMemo(() => {
    const inS = matched.filter(isInSeason).sort((a, b) => a.name.localeCompare(b.name));
    const off = matched.filter((r) => !isInSeason(r)).sort((a, b) => a.name.localeCompare(b.name));
    return { inSeason: inS, offSeason: off };
  }, [matched, isInSeason]);

  // Flat ordering for the non-default sorts (anything other than "season").
  const sortedFlat = useMemo(() => {
    const arr = [...matched];
    switch (filters.sort) {
      case "oldest":
        return arr.sort((a, b) => (b.lastSurveyDays ?? -1) - (a.lastSurveyDays ?? -1));
      case "heat":
        return arr.sort((a, b) => b.heatLevel - a.heatLevel);
      case "name":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return arr;
    }
  }, [matched, filters.sort]);

  const freshEyes = useCallback((r: FilterLocation) => {
    const k = r.lastSurveyDays === null ? "none" : freshness(r.lastSurveyDays).k;
    return k !== "fresh";
  }, []);

  // Globe markers derived from the filtered set.
  const markers: PlanetMarker[] = useMemo(
    () =>
      matched.map((r) => ({
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
        isInSeason: isInSeason(r),
      })),
    [matched, isInSeason],
  );
  const highlightedCountries = useMemo(
    () => Array.from(new Set(matched.map((r) => r.countryCode).filter(Boolean))),
    [matched],
  );

  const effectiveView = view;

  // Count active filters for the mobile badge
  const activeFilterCount =
    filters.months.length +
    filters.animals.length +
    filters.region.length +
    filters.skill.length +
    (filters.condition.length !== STATE_VALUES.length ? 1 : 0) +
    (filters.freshOnly ? 1 : 0);

  const renderCard = (r: FilterLocation) => (
    <ReefCard
      key={r.slug}
      r={r}
      freshEyes={freshEyes(r)}
      showFreshPill={filters.freshOnly}
    />
  );

  // Shared filter panel content — rendered in sidebar (desktop) and bottom sheet (mobile)
  const filterPanelContent = (
    <>
      {/* When */}
      <FilterSection title="When" infoKey="when" onInfo={setInfo}>
        <div className="grid grid-cols-4 gap-1.5">
          {MONTH_ABBR.map((m, i) => {
            const month = i + 1;
            const on = filters.months.includes(month);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => toggle("months", month)}
                className={`rounded-lg border px-1 py-1.5 text-center text-[0.78rem] font-semibold transition ${
                  on
                    ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]"
                    : "border-white/10 bg-white/5 text-[#8b9db8] hover:border-white/20"
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* What do you want to see? */}
      <FilterSection title="What do you want to see?" infoKey="species" onInfo={setInfo}>
        <div className="flex flex-col gap-1.5">
          {WILDLIFE_TAXONOMY.map((g) => (
            <TaxoGroup
              key={g.group}
              group={g.group}
              tags={g.tags.map((t) => t.tag)}
              selected={filters.animals}
              onToggle={(tag) => toggle("animals", tag)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Region */}
      <FilterSection title="Region">
        <RegionTree
          groups={regionGroups}
          selected={filters.region}
          onToggleCountry={(country) => toggle("region", country)}
          onToggleContinent={toggleRegionContinent}
        />
      </FilterSection>

      {/* Reef state */}
      <FilterSection title="Reef state" infoKey="state" onInfo={setInfo}>
        <div className="flex flex-col gap-0.5">
          {STATE_VALUES.map((s) => (
            <CheckRow
              key={s}
              on={filters.condition.includes(s)}
              swatch={STATE_SWATCH[s]}
              onClick={() => toggle("condition", s)}
            >
              {STATE_LABEL[s]}
            </CheckRow>
          ))}
        </div>
      </FilterSection>

      {/* Evidence gaps */}
      <FilterSection title="Evidence gaps" infoKey="evidence" onInfo={setInfo}>
        <CheckRow
          on={filters.freshOnly}
          onClick={() => setFilters((p) => ({ ...p, freshOnly: !p.freshOnly }))}
        >
          Needs fresh eyes
        </CheckRow>
      </FilterSection>

      {/* Certification level */}
      <FilterSection title="Certification level" infoKey="level" onInfo={setInfo}>
        <div className="flex flex-col gap-0.5">
          {CERT_OPTIONS.map((s) => (
            <CheckRow key={s} on={filters.skill.includes(s)} onClick={() => toggle("skill", s)}>
              {s}
            </CheckRow>
          ))}
        </div>
      </FilterSection>
    </>
  );

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[300px_1fr]">
      {/* ── DESKTOP FILTER SIDEBAR (hidden on mobile) ── */}
      <aside className="hidden lg:sticky lg:top-[78px] lg:block lg:max-h-[calc(100vh-96px)] lg:self-start lg:overflow-y-auto lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
        <div className="flex items-center justify-between pb-1.5">
          <span className="text-[1.05rem] font-extrabold text-[#f0f4f8]">Filters</span>
          <button
            type="button"
            onClick={reset}
            className="text-[0.8125rem] font-semibold text-[#00d4ff] hover:underline"
          >
            Reset
          </button>
        </div>
        {filterPanelContent}
      </aside>

      {/* ── MOBILE BOTTOM SHEET ── */}
      {sheetOpen && (
        <>
          {/* Scrim */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSheetOpen(false)}
            aria-hidden
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88vh] flex-col rounded-t-2xl border-t border-white/10 bg-[#0a1628] lg:hidden"
            style={{ boxShadow: "0 -16px 48px rgba(0,0,0,0.5)" }}
          >
            {/* Sheet header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-[1.05rem] font-extrabold text-[#f0f4f8]">Filters</span>
              <div className="flex items-center gap-4">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[0.8125rem] font-semibold text-[#00d4ff] hover:underline"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#8b9db8] hover:bg-white/15"
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Scrollable filter content */}
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              {filterPanelContent}
            </div>
            {/* Done button */}
            <div className="shrink-0 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full rounded-full bg-[#00d4ff] py-3 text-[0.9375rem] font-bold text-[#0a1628]"
              >
                Show {matched.length} reef{matched.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── RESULTS ── */}
      <main className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-[#f0f4f8]" role="status" aria-live="polite">
              {matched.length} reef{matched.length === 1 ? "" : "s"}
            </h2>
            {/* Mobile filters trigger */}
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[0.8125rem] font-semibold text-[#f0f4f8] lg:hidden"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <line x1="2" y1="4" x2="14" y2="4"/><line x1="4" y1="8" x2="12" y2="8"/><line x1="6" y1="12" x2="10" y2="12"/>
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#00d4ff] text-[0.625rem] font-bold text-[#0a1628]">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-[3px]">
              <button
                type="button"
                aria-pressed={effectiveView === "cards"}
                onClick={() => setView("cards")}
                className={`rounded-full px-[0.95rem] py-[0.35rem] text-[0.8125rem] font-bold transition ${
                  effectiveView === "cards"
                    ? "bg-[#00d4ff] text-[#0a1628] shadow-[0_1px_3px_rgba(15,23,42,0.14)]"
                    : "text-[#8b9db8]"
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                aria-pressed={effectiveView === "map"}
                onClick={() => setView("map")}
                className={`rounded-full px-[0.95rem] py-[0.35rem] text-[0.8125rem] font-bold transition ${
                  effectiveView === "map"
                    ? "bg-[#00d4ff] text-[#0a1628] shadow-[0_1px_3px_rgba(15,23,42,0.14)]"
                    : "text-[#8b9db8]"
                }`}
              >
                Map
              </button>
            </div>
          </div>
          {effectiveView === "cards" && (
            <label className="flex items-center gap-1.5 text-[0.8125rem] text-[#8b9db8]">
              Sort
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((p) => ({ ...p, sort: e.target.value as SortKey }))
                }
                className="rounded-lg border border-white/10 bg-[#0a1628] px-2.5 py-1.5 text-[0.8125rem] font-semibold text-[#f0f4f8] focus:border-[#00d4ff] focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {effectiveView === "cards" ? (
          matched.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
              {filters.sort === "season" ? (
                <>
                  {inSeason.map(renderCard)}
                  {offSeason.length > 0 && (
                    <div className="col-span-full mb-1 mt-3 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#8b9db8]">
                      <span className="h-px flex-1 bg-white/10" aria-hidden />
                      Great at other times of year
                      <span className="h-px flex-1 bg-white/10" aria-hidden />
                    </div>
                  )}
                  {offSeason.map(renderCard)}
                </>
              ) : (
                sortedFlat.map(renderCard)
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-[#8b9db8]">
              No reefs match this combination. Remove a filter to widen the search.
            </div>
          )
        ) : (
          <div className="relative mx-auto aspect-square w-full max-w-[920px]">
            <HomeGlobe markers={markers} highlightedCountries={highlightedCountries} />
          </div>
        )}
      </main>

      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}
    </div>
  );
}
