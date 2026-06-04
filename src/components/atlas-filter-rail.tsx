"use client";

import { useMemo, useState } from "react";
import { freshness } from "@/lib/data/reef-state";
import type { FreshnessKey } from "@/lib/data/reef-state";
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

export const ANIMAL_OPTIONS = ["Sharks", "Mantas", "Turtles", "Whales", "Dolphins", "Dugongs"];

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
  pressure: "#0089de",
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

const CONTINENT_ORDER = ["Asia", "Oceania", "Indian Ocean", "Americas", "Atlantic & Mediterranean"];

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
        on ? "bg-[#e8f0fe] text-slate-900" : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition ${
          on ? "border-[#0089de] bg-[#0089de]" : "border-slate-300 bg-white"
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

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
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
    <div className="border-b border-slate-100 pb-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Region</h4>
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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] font-bold text-white transition ${
                    allSelected
                      ? "border-[#0089de] bg-[#0089de]"
                      : activeCount > 0
                        ? "border-[#0089de] bg-[#e8f0fe]"
                        : "border-slate-300 bg-white"
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
                  className="flex flex-1 items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    {continent}
                    {activeCount > 0 && (
                      <span className="rounded-full bg-[#0089de] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                        {activeCount}
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400">{expanded ? "▾" : "▸"}</span>
                </button>
              </div>

              {expanded && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-100 pl-2">
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
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  regions: string[];
  skills?: string[];
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
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5" style={{ boxShadow: "0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12)" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-medium text-[#0089de] hover:underline"
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
          <p className="px-2.5 pt-1 text-xs leading-5 text-slate-500">
            Surfaces reefs whose last in water survey is stale or cold.
          </p>
        </FacetGroup>

        <FacetGroup title="Thermal stress">
          {HEAT_BUCKETS.map((b) => (
            <CheckOpt
              key={b.value}
              on={f.heat.includes(b.value)}
              onClick={() => toggle("heat", b.value)}
            >
              <span className="flex flex-col">
                <span>{b.label}</span>
                <span className="text-xs text-slate-400">{b.hint}</span>
              </span>
            </CheckOpt>
          ))}
        </FacetGroup>

        <FacetGroup title="Wildlife">
          {ANIMAL_OPTIONS.map((a) => (
            <CheckOpt key={a} on={f.animals.includes(a)} onClick={() => toggle("animals", a)}>
              {a}
            </CheckOpt>
          ))}
        </FacetGroup>

        <FacetGroup title="Diveable in">
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {MONTH_ABBR.map((m, i) => {
              const month = i + 1;
              const on = f.months.includes(month);
              return (
                <button
                  key={m}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle("months", month)}
                  className={`rounded-lg px-1 py-1.5 text-xs font-medium transition ${
                    on ? "bg-[#0089de] text-white" : "bg-slate-50 text-slate-600 hover:bg-[#e8f0fe]"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </FacetGroup>

        {skills.length > 0 && (
          <FacetGroup title="Certification level">
            <p className="px-2.5 pb-1 text-xs leading-5 text-slate-500">
              Shows all locations accessible at or below this level.
            </p>
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
