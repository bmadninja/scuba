"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { SiteCard } from "./site-card";
import { getAllEncounters } from "@/lib/data/encounters";
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

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const SKILL_RANK: Record<SkillLevel, number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

const ENCOUNTERS = getAllEncounters();

export function SitesExplorer({ sites, locationsById, currentMonth }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  const query = params.get("q") ?? "";
  const skill = (params.get("cert") as SkillLevel | null) ?? "";
  const diveTypes = (params.get("types")?.split(",").filter(Boolean) ?? []) as DiveType[];
  const month = params.get("month") ? Number(params.get("month")) : null;
  const encounterSlug = params.get("encounter") ?? "";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `/sites?${qs}` : "/sites", { scroll: false });
    },
    [params, router],
  );

  const toggleDiveType = (t: DiveType) => {
    const next = diveTypes.includes(t)
      ? diveTypes.filter((x) => x !== t)
      : [...diveTypes, t];
    setParam("types", next.length ? next.join(",") : null);
  };

  const selectedEncounter = ENCOUNTERS.find((e) => e.slug === encounterSlug);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const encounterLocationIds = selectedEncounter
      ? new Set(selectedEncounter.locations.map((l) => l.locationId))
      : null;
    const encounterMonths = selectedEncounter?.bestMonths ?? null;

    return sites
      .filter((s) => {
        if (month && !s.bestMonths.includes(month)) return false;
        if (skill && SKILL_RANK[s.skillLevel] > SKILL_RANK[skill]) return false;
        if (
          diveTypes.length &&
          !diveTypes.some((t) => s.diveTypes.includes(t))
        ) {
          return false;
        }
        if (encounterLocationIds) {
          if (!encounterLocationIds.has(s.locationId)) return false;
          if (
            encounterMonths &&
            !s.bestMonths.some((m) => encounterMonths.includes(m))
          ) {
            return false;
          }
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
  }, [sites, locationsById, query, skill, diveTypes, month, selectedEncounter]);

  const activeChips: { key: string; label: string; clear: () => void }[] = [];
  if (skill) {
    activeChips.push({
      key: `cert:${skill}`,
      label: `Cert: ${SKILL_OPTIONS.find((o) => o.value === skill)?.label ?? skill}`,
      clear: () => setParam("cert", null),
    });
  }
  for (const t of diveTypes) {
    activeChips.push({
      key: `type:${t}`,
      label: DIVE_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
      clear: () => toggleDiveType(t),
    });
  }
  if (month) {
    activeChips.push({
      key: `month:${month}`,
      label: `Going in ${MONTH_LABELS[month - 1]}`,
      clear: () => setParam("month", null),
    });
  }
  if (selectedEncounter) {
    activeChips.push({
      key: `enc:${selectedEncounter.slug}`,
      label: `Target: ${selectedEncounter.name}`,
      clear: () => setParam("encounter", null),
    });
  }
  if (query) {
    activeChips.push({
      key: "q",
      label: `“${query}”`,
      clear: () => setParam("q", null),
    });
  }

  const clearAll = () => router.replace("/sites", { scroll: false });

  const skillCaveat =
    skill === "never-dived"
      ? "Showing entry-level sites. Always dive under instructor supervision until certified — see DAN safety guidance before booking."
      : skill === "open-water"
        ? "Showing sites at or below Open Water. Mind depth and current limits in your training."
        : null;

  return (
    <div>
      {/* Search + filter bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setParam("q", e.target.value || null)}
            placeholder="Search by site, country, species…"
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0089de]"
          />
        </div>

        <FilterField label="Target encounter">
          <div className="flex flex-wrap gap-1.5">
            {ENCOUNTERS.map((e) => {
              const active = encounterSlug === e.slug;
              return (
                <button
                  key={e.slug}
                  type="button"
                  onClick={() => setParam("encounter", active ? null : e.slug)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-[#0089de] text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                  }`}
                >
                  {e.name}
                </button>
              );
            })}
          </div>
          {selectedEncounter ? (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Best months: {selectedEncounter.bestMonths.map((m) => MONTH_LABELS[m - 1]).join(", ")}.{" "}
              Difficulty: {selectedEncounter.difficulty}. Confidence: {selectedEncounter.confidence}.
            </p>
          ) : null}
        </FilterField>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FilterField label="Your certification">
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.map((o) => {
                const active = skill === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setParam("cert", active ? null : o.value)}
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

        <FilterField label="Travel month">
          <div className="flex flex-wrap gap-1.5">
            {MONTH_LABELS.map((label, i) => {
              const m = i + 1;
              const active = month === m;
              const isThisMonth = m === currentMonth;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setParam("month", active ? null : String(m))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-[#0089de] text-white"
                      : `border bg-white hover:border-[#0089de] hover:text-[#0089de] ${
                          isThisMonth
                            ? "border-[#0089de]/60 text-[#0089de]"
                            : "border-slate-300 text-slate-700"
                        }`
                  }`}
                >
                  {label}
                  {isThisMonth ? " •" : ""}
                </button>
              );
            })}
          </div>
        </FilterField>

        {skillCaveat ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
            {skillCaveat}
          </div>
        ) : null}

        {activeChips.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-200 pt-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Active
            </span>
            {activeChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-slate-700"
              >
                {c.label}
                <X className="size-3" />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto text-[11px] font-semibold text-slate-600 hover:text-[#0089de]"
            >
              Clear all
            </button>
          </div>
        ) : null}
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
              inSeason={s.bestMonths.includes(month ?? currentMonth)}
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
    <div className="mt-4 first:mt-0">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}
