"use client";

import { useMemo, useState } from "react";
import { InfoTooltip } from "@/components/info-tooltip";
import { freshness } from "@/lib/data/reef-state";
import type { FreshnessKey } from "@/lib/data/reef-state";
import { WILDLIFE_TAXONOMY, WILDLIFE_TAGS } from "@/lib/atlas-location";
import type { ReefLocationCardData } from "./reef-location-card";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterLocation = ReefLocationCardData & {
  region: string;
  bestMonths: number[];
  heatLevel: number;
  lastSurveyDays: number | null;
  lat: number;
  lng: number;
  countryCode: string;
  animalTags: string[];
};

export type SortKey = "season" | "oldest" | "heat" | "name";

export type Filters = {
  condition: string[];
  months: number[];
  skill: string[];
  region: string[];
  heat: string[];
  animals: string[];
  freshOnly: boolean;
  sort: SortKey;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATE_VALUES = ["thriving", "pressure", "change"];

// The shipped wildlife tags (flat) come from the build-time taxonomy in
// atlas-location.ts — the single source of truth (Story 7.2/7.3). Only tags that
// survived the data-coverage pass appear here.
export const ANIMAL_OPTIONS = WILDLIFE_TAGS;

export const DEFAULT_FILTERS: Filters = {
  condition: [...STATE_VALUES],
  months: [],
  skill: [],
  region: [],
  heat: [],
  animals: [],
  freshOnly: false,
  sort: "season",
};

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "season", label: "Best season" },
  { value: "oldest", label: "Oldest surveys first" },
  { value: "heat", label: "Highest thermal stress" },
  { value: "name", label: "Name" },
];

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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

const HEAT_BUCKETS: { value: string; label: string; hint: string; test: (h: number) => boolean }[] = [
  { value: "none",     label: "No stress",   hint: "Baseline temperature",   test: (h) => h === 0 },
  { value: "watch",    label: "Watch",       hint: "Mild warmth, monitor",   test: (h) => h === 1 },
  { value: "elevated", label: "Elevated",    hint: "Warning",                test: (h) => h === 2 },
  { value: "alert",    label: "Heat alert",  hint: "Alert 1 and above",      test: (h) => h >= 3 },
];

// Ordered display labels for skill levels. Filtering is cumulative: selecting
// "Open water" shows all locations accessible to an open-water certified diver
// (i.e. Beginner + Open water). This matches how divers actually plan trips.
const SKILL_OPTIONS = ["Beginner", "Open water", "Advanced", "Technical"];

const SKILL_RANK: Record<string, number> = {
  "Beginner":   0,
  "Open water": 1,
  "Advanced":   2,
  "Technical":  3,
};

export const CONTINENT_ORDER = ["Asia", "Oceania", "Indian Ocean", "Americas", "Atlantic & Mediterranean"];

/** Map a reef's sub-region (e.g. "Caribbean") to its continent bucket. */
export function regionContinent(region: string): string {
  return REGION_CONTINENT[region] ?? "Other";
}

// ─── Filter logic (pure) ──────────────────────────────────────────────────────

export function parseFilters(params: URLSearchParams): Filters {
  const c    = params.get("c");
  const m    = params.get("m");
  const s    = params.get("s");
  const r    = params.get("r");
  const h    = params.get("h");
  const a    = params.get("a");
  const sort = params.get("sort") as SortKey | null;
  return {
    condition: c ? c.split(",") : [...DEFAULT_FILTERS.condition],
    months:    m ? m.split(",").map(Number).filter((n) => !isNaN(n)) : [],
    skill:     s ? s.split(",") : [],
    region:    r ? r.split(",") : [],
    heat:      h ? h.split(",") : [],
    animals:   a ? a.split(",").filter((x) => ANIMAL_OPTIONS.includes(x)) : [],
    freshOnly: params.get("fresh") === "1",
    sort:      sort && SORT_OPTIONS.some((o) => o.value === sort) ? sort : "season",
  };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.condition.length !== 3 || !STATE_VALUES.every((s) => f.condition.includes(s))) {
    params.set("c", f.condition.join(","));
  }
  if (f.months.length)   params.set("m", f.months.join(","));
  if (f.skill.length)    params.set("s", f.skill.join(","));
  if (f.region.length)   params.set("r", f.region.join(","));
  if (f.heat.length)     params.set("h", f.heat.join(","));
  if (f.animals.length)  params.set("a", f.animals.join(","));
  if (f.freshOnly)       params.set("fresh", "1");
  if (f.sort !== "season") params.set("sort", f.sort);
  return params;
}

export function applyFilters(locs: FilterLocation[], f: Filters): FilterLocation[] {
  // Skill filter is cumulative: the highest-ranked selected skill level determines
  // the ceiling. A diver who selects "Open water" sees Beginner + Open water spots.
  const maxSkillRank = f.skill.length
    ? Math.max(...f.skill.map((s) => SKILL_RANK[s] ?? 0))
    : null;

  const filtered = locs.filter((r) => {
    if (f.condition.length && !f.condition.includes(r.state)) return false;

    if (maxSkillRank !== null && (SKILL_RANK[r.skill] ?? 0) > maxSkillRank) return false;

    if (f.region.length && !f.region.includes(r.region)) return false;

    if (f.months.length && !f.months.some((m) => r.bestMonths.includes(m))) return false;

    if (f.heat.length) {
      const bucket = HEAT_BUCKETS.find((b) => b.test(r.heatLevel));
      if (!bucket || !f.heat.includes(bucket.value)) return false;
    }

    if (f.animals.length && !f.animals.some((a) => r.animalTags.includes(a))) return false;

    if (f.freshOnly) {
      const k: FreshnessKey | "none" = r.lastSurveyDays === null
        ? "none"
        : freshness(r.lastSurveyDays).k;
      if (k === "fresh") return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (f.sort) {
      case "oldest": return (b.lastSurveyDays ?? -1) - (a.lastSurveyDays ?? -1);
      case "heat":   return b.heatLevel - a.heatLevel;
      case "name":   return a.name.localeCompare(b.name);
      default:       return firstBestMonth(a.bestMonths) - firstBestMonth(b.bestMonths);
    }
  });
}

function firstBestMonth(months: number[]): number {
  return months.length ? Math.min(...months) : 99;
}

// ─── UI primitives ────────────────────────────────────────────────────────────

function CheckOpt({
  on,
  swatch,
  onClick,
  children,
}: {
  on: boolean;
  swatch?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition ${
        on ? "bg-[rgba(0,212,255,0.12)] text-[#f0f4f8]" : "text-[#8b9db8] hover:bg-white/5"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition ${
          on ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]" : "border-white/10 bg-[#0a1628] text-white"
        }`}
        aria-hidden
      >
        {on ? "✓" : ""}
      </span>
      {swatch ? (
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

/** Visually-hidden text that remains available to screen readers. */
function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
      {children}
    </span>
  );
}

/**
 * Active-count badge. Pairs the digit with visually-hidden text ("N active
 * filters") so screen-reader users hear meaning, not a bare number (WCAG, §8).
 * Uses aqua (#00d4ff) text on a brand tint for AA contrast at this small size.
 */
function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[rgba(0,212,255,0.12)] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#00d4ff]">
      <span aria-hidden>{count}</span>
      <VisuallyHidden>
        {count} active {count === 1 ? "filter" : "filters"}
      </VisuallyHidden>
    </span>
  );
}

/**
 * A filter facet rendered as a native <details>/<summary> collapsible (Layout B,
 * Story 7.5). `defaultOpen` controls the initial expanded state.
 */
function FacetGroup({
  title,
  children,
  defaultOpen = true,
  badge,
  tooltip,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-white/10 pb-4">
      <summary className="mb-2 flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wide text-[#8b9db8] [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {title}
          {tooltip ? <InfoTooltip text={tooltip} /> : null}
          {badge}
        </span>
        <span className="text-[#8b9db8] transition group-open:rotate-90" aria-hidden>
          ▸
        </span>
      </summary>
      <div className="space-y-0.5">{children}</div>
    </details>
  );
}

/**
 * Nested wildlife sub-group, a native <details>/<summary> inside the Wildlife
 * facet (Story 7.3). Header shows a CountBadge when tags within it are active.
 */
function WildlifeSubGroup({
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
  const activeCount = tags.filter((t) => selected.includes(t)).length;
  return (
    <details
      open={activeCount > 0}
      className="group/sub rounded-lg"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#aebcd0] hover:bg-white/5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {group}
          <CountBadge count={activeCount} />
        </span>
        <span className="text-[#8b9db8] transition group-open/sub:rotate-90" aria-hidden>
          ▸
        </span>
      </summary>
      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
        {tags.map((t) => (
          <CheckOpt key={t} on={selected.includes(t)} onClick={() => onToggle(t)}>
            {t}
          </CheckOpt>
        ))}
      </div>
    </details>
  );
}

// ─── Region filter ────────────────────────────────────────────────────────────

function RegionFilter({
  regions,
  selected,
  onToggle,
  onToggleContinent,
}: {
  regions: string[];
  selected: string[];
  onToggle: (region: string) => void;
  onToggleContinent: (regions: string[]) => void;
}) {
  const grouped = useMemo(() => {
    const g: Record<string, string[]> = {};
    for (const r of regions) {
      const c = REGION_CONTINENT[r] ?? "Other";
      (g[c] ??= []).push(r);
    }
    return g;
  }, [regions]);

  const continents = useMemo(
    () => [
      ...CONTINENT_ORDER.filter((c) => grouped[c]?.length),
      ...(grouped["Other"] ? ["Other"] : []),
    ],
    [grouped],
  );

  const [open, setOpen] = useState<Record<string, boolean>>({});

  const isOpen = (c: string) => open[c] ?? selected.some((r) => (grouped[c] ?? []).includes(r));

  const toggleOpen = (c: string) => setOpen((prev) => ({ ...prev, [c]: !isOpen(c) }));

  return (
    <div className="border-b border-white/10 pb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b9db8]">Region</h4>
      <div className="space-y-1">
        {continents.map((continent) => {
          const regs = grouped[continent] ?? [];
          const activeCount = regs.filter((r) => selected.includes(r)).length;
          const allSelected = regs.length > 0 && regs.every((r) => selected.includes(r));
          const expanded = isOpen(continent);

          return (
            <div key={continent}>
              <div className="flex items-center gap-1">
                {/* Continent-level select-all checkbox */}
                <button
                  type="button"
                  aria-pressed={allSelected}
                  onClick={() => onToggleContinent(regs)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold transition ${
                    allSelected
                      ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]"
                      : activeCount > 0
                        ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]"
                        : "border-white/10 bg-[#0a1628] text-white"
                  }`}
                  title={allSelected ? `Deselect all in ${continent}` : `Select all in ${continent}`}
                  aria-label={allSelected ? `Deselect all in ${continent}` : `Select all in ${continent}`}
                >
                  {allSelected ? "✓" : activeCount > 0 ? "–" : ""}
                </button>

                {/* Accordion toggle */}
                <button
                  type="button"
                  onClick={() => toggleOpen(continent)}
                  className="flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[#aebcd0] hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    {continent}
                    {activeCount > 0 && (
                      <span className="rounded-full bg-[#00d4ff] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#0a1628]">
                        {activeCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[#8b9db8]">{expanded ? "▾" : "▸"}</span>
                </button>
              </div>

              {expanded && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                  {regs.map((r) => (
                    <CheckOpt key={r} on={selected.includes(r)} onClick={() => onToggle(r)}>
                      {r}
                    </CheckOpt>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AtlasFilterRail({
  filters: f,
  onChange,
  onReset,
  regions,
  skills = SKILL_OPTIONS,
  className,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  regions: string[];
  skills?: string[];
  className?: string;
}) {
  const toggle = (
    facet: "condition" | "months" | "skill" | "region" | "heat" | "animals",
    value: string | number,
  ) => {
    const arr = f[facet] as (string | number)[];
    const next = arr.includes(value as never)
      ? arr.filter((x) => x !== value)
      : [...arr, value];
    onChange({ ...f, [facet]: next });
  };

  const toggleContinent = (regs: string[]) => {
    const allOn = regs.every((r) => f.region.includes(r));
    const next = allOn
      ? f.region.filter((r) => !regs.includes(r))
      : Array.from(new Set([...f.region, ...regs]));
    onChange({ ...f, region: next });
  };

  return (
    <aside className={className ?? "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto"}>
      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0a1628] p-5" style={{ boxShadow: "0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#f0f4f8]">Filters</h3>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-[#00d4ff] hover:underline"
          >
            Reset
          </button>
        </div>

        <FacetGroup title="Reef state">
          {STATE_VALUES.map((s) => (
            <CheckOpt
              key={s}
              on={f.condition.includes(s)}
              swatch={STATE_SWATCH[s]}
              onClick={() => toggle("condition", s)}
            >
              {STATE_LABEL[s]}
            </CheckOpt>
          ))}
        </FacetGroup>

        <FacetGroup title="Evidence gaps">
          <CheckOpt on={f.freshOnly} onClick={() => onChange({ ...f, freshOnly: !f.freshOnly })}>
            Needs fresh eyes
          </CheckOpt>
        </FacetGroup>

        <FacetGroup
          title="Wildlife"
          badge={<CountBadge count={f.animals.length} />}
        >
          <div className="space-y-0.5">
            {WILDLIFE_TAXONOMY.map((g) => (
              <WildlifeSubGroup
                key={g.group}
                group={g.group}
                tags={g.tags.map((t) => t.tag)}
                selected={f.animals}
                onToggle={(tag) => toggle("animals", tag)}
              />
            ))}
          </div>
        </FacetGroup>

        <FacetGroup title="Diveable in">
          <div className="month-pill-row">
            {MONTH_ABBR.map((m, i) => {
              const month = i + 1;
              const on = f.months.includes(month);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("months", month)}
                  className={`rounded-lg border px-1 py-1.5 text-xs font-medium transition ${
                    on ? "border-[#00d4ff] bg-[rgba(0,212,255,0.12)] text-[#00d4ff]" : "border-white/10 bg-white/5 text-[#8b9db8] hover:border-white/20"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </FacetGroup>

        {skills.length > 0 && (
          <FacetGroup title="Certification level" tooltip="The minimum certification recommended for the dive conditions at this location.">
            {skills.map((s) => (
              <CheckOpt key={s} on={f.skill.includes(s)} onClick={() => toggle("skill", s)}>
                {s}
              </CheckOpt>
            ))}
          </FacetGroup>
        )}

        {regions.length > 0 && (
          <RegionFilter
            regions={regions}
            selected={f.region}
            onToggle={(r) => toggle("region", r)}
            onToggleContinent={toggleContinent}
          />
        )}
      </div>
    </aside>
  );
}

// ─── Region → continent mapping ───────────────────────────────────────────────

const REGION_CONTINENT: Record<string, string> = {
  // Asia
  "Andaman Sea": "Asia", "Bali": "Asia", "Bonin Islands": "Asia", "Cebu": "Asia",
  "Gulf of Thailand": "Asia", "Hainan": "Asia", "Korea Strait": "Asia",
  "Lesser Sunda Islands": "Asia", "Mindoro": "Asia", "North Sulawesi": "Asia",
  "Ryukyu Islands": "Asia", "Sabah": "Asia", "South Central Coast": "Asia",
  "South China Sea": "Asia", "Sulu Sea": "Asia", "Visayas": "Asia", "West Papua": "Asia",
  // Oceania
  "Coral Sea": "Oceania", "Chuuk": "Oceania", "Espiritu Santo": "Oceania",
  "Fiordland": "Oceania", "Great Barrier Reef": "Oceania", "Guadalcanal": "Oceania",
  "Micronesia": "Oceania", "New Britain": "Oceania", "New South Wales": "Oceania",
  "Northland": "Oceania", "Somosomo Strait": "Oceania", "South Pacific": "Oceania",
  "Tuamotu Archipelago": "Oceania", "Western Australia": "Oceania",
  "Western Pacific": "Oceania", "Yap": "Oceania",
  // Indian Ocean & East Africa
  "Andaman Islands": "Indian Ocean", "Arabian Sea": "Indian Ocean",
  "East Africa": "Indian Ocean", "Gulf of Aden": "Indian Ocean",
  "Gulf of Oman": "Indian Ocean", "Indian Ocean": "Indian Ocean",
  "KwaZulu-Natal": "Indian Ocean", "Lakshadweep": "Indian Ocean",
  "Mozambique Channel": "Indian Ocean", "Red Sea": "Indian Ocean",
  "Southwest Coast": "Indian Ocean", "Zanzibar": "Indian Ocean",
  // Americas
  "Bay Islands": "Americas", "California": "Americas", "Caribbean": "Americas",
  "East Coast": "Americas", "Eastern Pacific": "Americas", "Florida": "Americas",
  "Galápagos": "Americas", "Guanacaste": "Americas", "Hawaii": "Americas",
  "Southeast Brazil": "Americas", "Yucatán Peninsula": "Americas",
  // Atlantic & Mediterranean
  "Adriatic Sea": "Atlantic & Mediterranean", "Atlantic Ocean": "Atlantic & Mediterranean",
  "Azores": "Atlantic & Mediterranean", "Canary Islands": "Atlantic & Mediterranean",
  "Gulf of Guinea": "Atlantic & Mediterranean", "Mediterranean": "Atlantic & Mediterranean",
  "Thingvellir": "Atlantic & Mediterranean",
};
