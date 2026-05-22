"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";

export type FeaturedSite = {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImageUrl?: string;
  country: string;
  continent: string;
  skillLevel: string;
  bestMonths: number[];
  editorialRank: number;
  experience: "beginner" | "intermediate" | "advanced";
  interestTags: string[];
  animalTags: string[];
  tripMode: "liveaboard" | "resort";
};

type TripModeFilter = "liveaboard" | "resort";
type CertFilter =
  | "never-dived"
  | "open-water"
  | "advanced"
  | "rescue"
  | "divemaster"
  | "tech";
type RecencyFilter = "never" | "0-6" | "6-24" | "24+";
type InterestFilter =
  | "Big animals"
  | "Coral reefs"
  | "Macro & critters"
  | "Wrecks"
  | "Dramatic topography";
type AnimalFilter =
  | "Sharks"
  | "Whales"
  | "Mantas"
  | "Dolphins"
  | "Turtles"
  | "Dugongs";
type SeeFilter = InterestFilter | AnimalFilter;

const DynamicPlanetGlobe = dynamic(
  () => import("./planet-globe").then((module) => module.PlanetGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#eaf4fb] p-4 shadow-sm">
        <div className="min-h-[340px] animate-pulse rounded-xl bg-white/60" />
      </div>
    ),
  },
);

const TRIP_MODE_OPTIONS = [
  { value: "liveaboard", label: "Liveaboard" },
  { value: "resort", label: "Resort / day boat" },
] as const;

const CERT_OPTIONS: { value: CertFilter; label: string }[] = [
  { value: "never-dived", label: "Never dived" },
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster+" },
  { value: "tech", label: "Tech" },
];

const RECENCY_OPTIONS: { value: RecencyFilter; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "0-6", label: "< 6 mo" },
  { value: "6-24", label: "6–24 mo" },
  { value: "24+", label: "2+ yr" },
];

const INTEREST_OPTIONS = [
  "Big animals",
  "Coral reefs",
  "Macro & critters",
  "Wrecks",
  "Dramatic topography",
] as const;

const ANIMAL_OPTIONS = [
  "Sharks",
  "Whales",
  "Mantas",
  "Dolphins",
  "Turtles",
  "Dugongs",
] as const;

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

const toggleValue = <T extends string>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

type PlanetGlobePanelProps = PlanetGlobeProps & {
  featuredSites?: FeaturedSite[];
};

export function PlanetGlobePanel(props: PlanetGlobePanelProps) {
  const { featuredSites = [], ...globeProps } = props;
  const [selectedMonth, setSelectedMonth] = useState(globeProps.initialMonth ?? 1);
  const [tripMode, setTripMode] = useState<TripModeFilter | "">("");
  const [cert, setCert] = useState<CertFilter | "">("");
  const [recency, setRecency] = useState<RecencyFilter | "">("");
  const [seeFilters, setSeeFilters] = useState<SeeFilter[]>([]);
  const [showAnimalOptions, setShowAnimalOptions] = useState(false);
  const selectedDate = new Date(Date.UTC(2024, selectedMonth - 1, 15));

  const animalFilterSet = new Set<AnimalFilter>(
    seeFilters.filter((filter): filter is AnimalFilter =>
      ANIMAL_OPTIONS.includes(filter as AnimalFilter),
    ),
  );
  const allAnimalsSelected = ANIMAL_OPTIONS.every((option) =>
    animalFilterSet.has(option),
  );

  const toggleBigAnimals = () => {
    setSeeFilters((current) => {
      const withoutAnimals = current.filter(
        (filter) => !ANIMAL_OPTIONS.includes(filter as AnimalFilter),
      );
      if (allAnimalsSelected) {
        setShowAnimalOptions(false);
        return withoutAnimals;
      }
      setShowAnimalOptions(true);
      return [...withoutAnimals, ...ANIMAL_OPTIONS];
    });
  };

  const toggleAnimalFilter = (animal: AnimalFilter) => {
    setSeeFilters((current) => {
      const nonAnimalFilters = current.filter(
        (filter) => !ANIMAL_OPTIONS.includes(filter as AnimalFilter),
      );
      const currentAnimals = current.filter((filter): filter is AnimalFilter =>
        ANIMAL_OPTIONS.includes(filter as AnimalFilter),
      );
      const nextAnimals = toggleValue(currentAnimals, animal);
      return [...nonAnimalFilters, ...nextAnimals];
    });
  };

  const markers = (globeProps.markers ?? []).map((marker) => {
    if (!marker.season) return marker;
    const isInSeason = isDateInSeason(selectedDate, marker.season);
    return {
      ...marker,
      isInSeason,
      color: isInSeason ? "#0089de" : "#f23d4e",
    };
  });

  // Map cert filter onto existing experience tags
  const certToExperience = (c: CertFilter): "beginner" | "intermediate" | "advanced" | null => {
    if (c === "never-dived" || c === "open-water") return "beginner";
    if (c === "advanced") return "intermediate";
    if (c === "rescue" || c === "divemaster" || c === "tech") return "advanced";
    return null;
  };

  const filteredMarkers = markers.filter((marker) => {
    const matchesTripMode = tripMode === "" || marker.tripMode === tripMode;
    const expLevel = cert === "" ? null : certToExperience(cert);
    const matchesCert =
      !expLevel || marker.experienceTags?.includes(expLevel);
    const matchesInterest =
      seeFilters.length === 0 ||
      seeFilters.some((filter) => {
        if (ANIMAL_OPTIONS.includes(filter as AnimalFilter)) {
          return marker.animalTags?.includes(filter);
        }
        return marker.interestTags?.includes(filter);
      });
    return matchesTripMode && matchesCert && matchesInterest;
  });

  const filteredHighlightedCountries = Array.from(
    new Set(
      filteredMarkers
        .filter((marker) => marker.isInSeason)
        .map((marker) => marker.country ?? "")
        .filter(Boolean),
    ),
  );

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (cert) {
    const opt = CERT_OPTIONS.find((o) => o.value === cert);
    if (opt) activeChips.push({ key: "cert", label: opt.label, onClear: () => setCert("") });
  }
  if (recency) {
    const opt = RECENCY_OPTIONS.find((o) => o.value === recency);
    if (opt)
      activeChips.push({ key: "recency", label: `Dived ${opt.label}`, onClear: () => setRecency("") });
  }
  if (tripMode) {
    const opt = TRIP_MODE_OPTIONS.find((o) => o.value === tripMode);
    if (opt)
      activeChips.push({ key: "trip", label: opt.label, onClear: () => setTripMode("") });
  }
  for (const f of seeFilters) {
    activeChips.push({
      key: `see-${f}`,
      label: f,
      onClear: () => setSeeFilters((c) => c.filter((x) => x !== f)),
    });
  }
  activeChips.push({
    key: "month",
    label: MONTH_OPTIONS[selectedMonth - 1].label,
    onClear: () => setSelectedMonth(new Date().getUTCMonth() + 1),
  });

  return (
    <div className="w-full">
      {/* Top filter bar (PADI-style light) */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full bg-[#e8f0fe] px-2.5 py-1 text-xs font-medium text-[#1d5d90]"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onClear}
                  className="rounded-full p-0.5 hover:bg-[#0089de]/15"
                  aria-label={`Remove ${chip.label}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField label="Month">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0089de]"
                >
                  {MONTH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Trip type">
                <select
                  value={tripMode}
                  onChange={(e) => setTripMode(e.target.value as TripModeFilter | "")}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0089de]"
                >
                  <option value="">Any</option>
                  {TRIP_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Certification">
                <div className="flex flex-wrap gap-1.5">
                  {CERT_OPTIONS.map((o) => {
                    const active = cert === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setCert(active ? "" : o.value)}
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

              <FilterField label="Last dive">
                <div className="flex flex-wrap gap-1.5">
                  {RECENCY_OPTIONS.map((o) => {
                    const active = recency === o.value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => setRecency(active ? "" : o.value)}
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

              <FilterField label="What you want to see" className="sm:col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {INTEREST_OPTIONS.map((option) => {
                    if (option === "Big animals") {
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={toggleBigAnimals}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            allAnimalsSelected
                              ? "bg-[#0089de] text-white"
                              : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    }
                    const active = seeFilters.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setSeeFilters((c) => toggleValue(c, option))
                        }
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-[#0089de] text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
                {showAnimalOptions ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                    {ANIMAL_OPTIONS.map((option) => {
                      const active = animalFilterSet.has(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleAnimalFilter(option)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? "bg-[#0089de] text-white"
                              : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </FilterField>
            </div>
        </div>
      </div>

      <DynamicPlanetGlobe
        {...globeProps}
        markers={filteredMarkers}
        highlightedCountries={filteredHighlightedCountries}
      />

      <FeaturedGrid
        sites={featuredSites}
        selectedMonth={selectedMonth}
        tripMode={tripMode}
        cert={cert}
        seeFilters={seeFilters}
      />
    </div>
  );
}

function FeaturedGrid({
  sites,
  selectedMonth,
  tripMode,
  cert,
  seeFilters,
}: {
  sites: FeaturedSite[];
  selectedMonth: number;
  tripMode: TripModeFilter | "";
  cert: CertFilter | "";
  seeFilters: SeeFilter[];
}) {
  const monthName = MONTH_OPTIONS[selectedMonth - 1].label;

  const certToExperience = (
    c: CertFilter,
  ): "beginner" | "intermediate" | "advanced" | null => {
    if (c === "never-dived" || c === "open-water") return "beginner";
    if (c === "advanced") return "intermediate";
    if (c === "rescue" || c === "divemaster" || c === "tech") return "advanced";
    return null;
  };

  const featured = useMemo(() => {
    if (sites.length === 0) return [];
    const expLevel = cert === "" ? null : certToExperience(cert);

    const passesFilters = (s: FeaturedSite) => {
      if (tripMode !== "" && s.tripMode !== tripMode) return false;
      if (expLevel && s.experience !== expLevel) return false;
      if (seeFilters.length > 0) {
        const matchesSee = seeFilters.some((f) => {
          if (ANIMAL_OPTIONS.includes(f as AnimalFilter)) {
            return s.animalTags.includes(f);
          }
          return s.interestTags.includes(f);
        });
        if (!matchesSee) return false;
      }
      return true;
    };

    const inSeason = sites
      .filter((s) => s.bestMonths.includes(selectedMonth) && passesFilters(s))
      .sort((a, b) => b.editorialRank - a.editorialRank);

    // First pass: one per continent for diversity.
    const seenContinents = new Set<string>();
    const picks: FeaturedSite[] = [];
    for (const s of inSeason) {
      if (!seenContinents.has(s.continent)) {
        seenContinents.add(s.continent);
        picks.push(s);
      }
    }
    // Second pass: fill remaining slots with other in-season sites.
    for (const s of inSeason) {
      if (picks.length >= 12) break;
      if (!picks.includes(s)) picks.push(s);
    }

    if (picks.length > 0) return picks;

    // Fallback: nothing in season matches — show top-ranked filter matches
    // regardless of season so the grid isn't empty.
    return sites
      .filter(passesFilters)
      .sort((a, b) => b.editorialRank - a.editorialRank)
      .slice(0, 6);
  }, [sites, selectedMonth, tripMode, cert, seeFilters]);

  const hasFilters =
    tripMode !== "" || cert !== "" || seeFilters.length > 0;

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            {hasFilters
              ? `Matches · ${monthName}`
              : `In season this month · ${monthName}`}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Book the flight this week.
          </h2>
        </div>
        <Link
          href="/sites"
          className="hidden text-sm font-semibold text-[#0089de] hover:text-[#1d5d90] sm:inline-flex"
        >
          All sites →
        </Link>
      </div>
      {featured.length === 0 ? (
        <p className="text-sm text-slate-500">
          No sites match these filters for {monthName}. Try clearing a filter or
          picking another month.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => {
            const inSeason = s.bestMonths.includes(selectedMonth);
            return (
              <Link
                key={s.id}
                href={`/sites/${s.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    s.heroImageUrl ??
                    `https://picsum.photos/seed/${s.slug}/800/440`
                  }
                  alt={s.name}
                  className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {s.country}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        inSeason
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {inSeason ? "● In season" : "○ Off season"}
                    </span>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 group-hover:text-[#0089de]">
                    {s.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {s.description}
                  </p>
                  <div className="mt-3 inline-block rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[#1d5d90]">
                    {s.skillLevel.replace("-", " ")}+
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FilterField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      {children}
    </div>
  );
}
