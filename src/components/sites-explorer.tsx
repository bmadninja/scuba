"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { SiteCard } from "./site-card";
import type {
  DiveType,
  Location,
  Site,
  SkillLevel,
} from "@/lib/data/types";

type Props = {
  sites: Site[];
  locationsById: Record<string, Location>;
  currentMonth: number;
};

const SKILL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "never-dived", label: "Never dived" },
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster+" },
  { value: "tech", label: "Tech" },
];

const DIVE_TYPE_OPTIONS: { value: DiveType; label: string }[] = [
  { value: "large-pelagics", label: "Large pelagics" },
  { value: "coral", label: "Coral" },
  { value: "macro", label: "Macro" },
  { value: "wrecks", label: "Wrecks" },
  { value: "geology", label: "Geology" },
  { value: "blackwater", label: "Blackwater" },
];

const SKILL_RANK: Record<SkillLevel, number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

export function SitesExplorer({ sites, locationsById, currentMonth }: Props) {
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState<SkillLevel | "">("");
  const [diveTypes, setDiveTypes] = useState<DiveType[]>([]);
  const [onlyInSeason, setOnlyInSeason] = useState(false);

  const toggleDiveType = (t: DiveType) =>
    setDiveTypes((curr) =>
      curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t],
    );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites
      .filter((s) => {
        if (onlyInSeason && !s.bestMonths.includes(currentMonth)) return false;
        if (skill && SKILL_RANK[s.skillLevel] > SKILL_RANK[skill]) return false;
        if (
          diveTypes.length &&
          !diveTypes.some((t) => s.diveTypes.includes(t))
        ) {
          return false;
        }
        if (q) {
          const hay = [
            s.name,
            s.description,
            locationsById[s.locationId]?.country ?? "",
            locationsById[s.locationId]?.region ?? "",
            ...s.species.map((sp) => sp.commonName),
            ...s.species.map((sp) => sp.scientificName ?? ""),
          ]
            .join(" ")
            .toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.editorialRank - a.editorialRank);
  }, [sites, locationsById, currentMonth, query, skill, diveTypes, onlyInSeason]);

  const activeFilterCount =
    (skill ? 1 : 0) + diveTypes.length + (onlyInSeason ? 1 : 0);

  return (
    <div>
      {/* Search + filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by site, country, species…"
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0089de]"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FilterField label="Your certification">
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((o) => {
                const active = skill === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setSkill(active ? "" : o.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-[#0089de] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Filters to sites at or below your cert level.
            </p>
          </FilterField>

          <FilterField label="Dive types">
            <div className="flex flex-wrap gap-1.5">
              {DIVE_TYPE_OPTIONS.map((o) => {
                const active = diveTypes.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => toggleDiveType(o.value)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-[#0089de] text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </FilterField>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyInSeason}
              onChange={(e) => setOnlyInSeason(e.target.checked)}
              className="size-4 rounded border-slate-300 text-[#0089de] focus:ring-[#0089de]"
            />
            In season this month only
          </label>
          {activeFilterCount > 0 ? (
            <button
              type="button"
              onClick={() => {
                setSkill("");
                setDiveTypes([]);
                setOnlyInSeason(false);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-[#0089de]"
            >
              <X className="size-3" />
              Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </button>
          ) : null}
        </div>
      </div>

      {/* Result count */}
      <div className="mt-6 mb-4 flex items-end justify-between border-b border-slate-200 pb-3">
        <p className="text-sm text-slate-600">
          Showing{" "}
          <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-900">{sites.length}</span> dive
          sites
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Sorted by editorial rank
        </p>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No matches.</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing a filter or broadening the search.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SiteCard
              key={s.id}
              site={s}
              location={locationsById[s.locationId] ?? null}
              inSeason={s.bestMonths.includes(currentMonth)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}
