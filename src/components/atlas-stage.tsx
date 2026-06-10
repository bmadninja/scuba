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
import { underwaterPhotoUrl } from "@/lib/photo-quality";
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
  pressure: "#2f6ced",
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
    <details open={defaultOpen} className="group border-t border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 py-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-500 [&::-webkit-details-marker]:hidden">
        {title}
        {infoKey && onInfo && (
          <InfoButton onClick={() => onInfo(infoKey)} label="How this works" />
        )}
        <span className="ml-auto text-[0.7rem] text-slate-400 transition group-open:rotate-0 [.group:not([open])_&]:-rotate-90" aria-hidden>
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
        on && tint ? "bg-[#eef4ff] text-slate-900" : "text-slate-900 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2 text-[10px] font-bold text-white transition ${
          on ? "border-[#0089de] bg-[#0089de]" : "border-slate-300 bg-white"
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
    <details open={count > 0} className="group/cat overflow-hidden rounded-[0.6rem] border border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-[0.8125rem] font-bold text-slate-900 [&::-webkit-details-marker]:hidden">
        {group}
        <span className="ml-auto text-slate-400 transition group-open/cat:rotate-180" aria-hidden>
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
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
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
            <summary className="flex cursor-pointer list-none items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
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
                    ? "border-[#0089de] bg-[#0089de] text-white"
                    : activeCount > 0
                      ? "border-[#0089de] bg-[#e8f0fe] text-[#0089de]"
                      : "border-slate-300 bg-white text-white"
                }`}
              >
                {allOn ? "✓" : activeCount > 0 ? "–" : ""}
              </span>
              {continent}
              <span className="ml-auto text-[0.7rem] text-slate-400 transition group-open/reg:rotate-180" aria-hidden>
                ⌄
              </span>
            </summary>
            <div className="ml-[26px] mt-0.5 flex flex-col gap-0.5 border-l border-slate-100 pl-2">
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
      className={`group relative block h-[175px] overflow-hidden rounded-2xl text-inherit no-underline ${
        lift ? "transition hover:-translate-y-[3px] hover:shadow-[0_16px_34px_-14px_rgba(4,18,32,0.45)]" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={underwaterPhotoUrl(r.heroImageUrl)}
        alt={`Underwater reef at ${r.name}`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom,rgba(4,18,32,0.05) 28%,rgba(4,18,32,0.5) 64%,rgba(4,18,32,0.92))",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 p-[0.85rem_0.95rem]">
        <p className="mb-0.5 flex items-center gap-1.5 text-[0.5625rem] font-bold uppercase tracking-[0.13em] text-white/60">
          <span>{r.region}</span>
          <span className="text-white/30" aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 text-white/75">
            <span
              className="h-[5px] w-[5px] shrink-0 rounded-full"
              style={{ background: STATE_SWATCH[r.state] }}
              aria-hidden
            />
            {STATE_LABEL[r.state]}
          </span>
        </p>
        <p
          className="mb-2 text-[0.9375rem] font-extrabold tracking-[-0.01em] text-white"
          style={{ textShadow: "0 1px 12px rgba(4,18,32,0.4)" }}
        >
          {r.name}
        </p>
        {/* Ghost pills — only where they change the read */}
        {showFreshPill && freshEyes && (
          <div className="flex flex-wrap gap-1.5">
            {showFreshPill && freshEyes && (
              <span
                className="inline-flex items-center rounded-full border px-2 py-[0.22rem] text-[0.6rem] font-bold backdrop-blur-[6px]"
                style={{
                  background: "rgba(8,20,34,0.3)",
                  color: "#fcd34d",
                  borderColor: "rgba(252,211,77,0.45)",
                }}
              >
                Needs fresh eyes
              </span>
            )}
          </div>
        )}
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
  const [isDesktop, setIsDesktop] = useState(true);

  // Globe is desktop/tablet only (>= ~700px). On mobile we fall back to cards.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 700px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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

  // Map view degrades to cards on mobile.
  const effectiveView = view === "map" && !isDesktop ? "cards" : view;

  const renderCard = (r: FilterLocation) => (
    <ReefCard
      key={r.slug}
      r={r}
      freshEyes={freshEyes(r)}
      showFreshPill={filters.freshOnly}
    />
  );

  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[300px_1fr]">
      {/* ── FILTER RAIL ── */}
      <aside className="lg:sticky lg:top-[78px] lg:max-h-[calc(100vh-96px)] lg:self-start lg:overflow-auto lg:pr-1">
        <div className="flex items-center justify-between pb-1.5">
          <span className="text-[1.05rem] font-extrabold text-slate-900">Filters</span>
          <button
            type="button"
            onClick={reset}
            className="text-[0.8125rem] font-semibold text-[#0089de] hover:underline"
          >
            Reset
          </button>
        </div>

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
                      ? "border-[rgba(47,108,237,0.3)] bg-[#e8f0fe] text-[#1d5d90]"
                      : "border-transparent bg-[#f1f7fb] text-slate-500 hover:border-slate-300"
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

        {/* Region — continent expands to its countries */}
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
      </aside>

      {/* ── RESULTS ── */}
      <main className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[1.1rem] font-extrabold tracking-[-0.02em] text-slate-900" role="status" aria-live="polite">
            {matched.length} reef{matched.length === 1 ? "" : "s"}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {effectiveView === "cards" && (
              <label className="flex items-center gap-2 text-[0.8125rem] text-slate-500">
                Sort
                <select
                  value={filters.sort}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, sort: e.target.value as SortKey }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[0.8125rem] font-semibold text-slate-900 focus:border-[#0089de] focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="inline-flex rounded-full bg-[#f1f7fb] p-[3px]">
              <button
                type="button"
                aria-pressed={effectiveView === "cards"}
                onClick={() => setView("cards")}
                className={`rounded-full px-[0.95rem] py-[0.35rem] text-[0.8125rem] font-bold transition ${
                  effectiveView === "cards"
                    ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]"
                    : "text-slate-500"
                }`}
              >
                Cards
              </button>
              {isDesktop && (
                <button
                  type="button"
                  aria-pressed={effectiveView === "map"}
                  onClick={() => setView("map")}
                  className={`rounded-full px-[0.95rem] py-[0.35rem] text-[0.8125rem] font-bold transition ${
                    effectiveView === "map"
                      ? "bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.14)]"
                      : "text-slate-500"
                  }`}
                >
                  Map
                </button>
              )}
            </div>
          </div>
        </div>

        {effectiveView === "cards" ? (
          matched.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filters.sort === "season" ? (
                <>
                  {inSeason.map(renderCard)}
                  {offSeason.length > 0 && (
                    <div className="col-span-full mb-1 mt-3 flex items-center gap-3 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                      <span className="h-px flex-1 bg-slate-200" aria-hidden />
                      Great at other times of year
                      <span className="h-px flex-1 bg-slate-200" aria-hidden />
                    </div>
                  )}
                  {offSeason.map(renderCard)}
                </>
              ) : (
                sortedFlat.map(renderCard)
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
              No reefs match this combination. Remove a filter to widen the search.
            </div>
          )
        ) : (
          <div className="relative mx-auto aspect-square w-full max-w-[560px]">
            <HomeGlobe markers={markers} highlightedCountries={highlightedCountries} />
          </div>
        )}
      </main>

      {info && <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />}
    </div>
  );
}
