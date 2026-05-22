"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";

export type FeaturedLocation = {
  id: string;
  slug: string;
  name: string;
  description: string;
  heroImageUrl?: string;
  country: string;
  continent: string;
  bestMonths: number[];
  editorialRank: number;
  siteCount: number;
  skillLevels: string[];
  experiences: ("beginner" | "intermediate" | "advanced")[];
  interestTags: string[];
  animalTags: string[];
  tripModes: ("liveaboard" | "resort")[];
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
  featuredLocations?: FeaturedLocation[];
};

export function PlanetGlobePanel(props: PlanetGlobePanelProps) {
  const { featuredLocations = [], ...globeProps } = props;
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
        locations={featuredLocations}
        selectedMonth={selectedMonth}
        tripMode={tripMode}
        cert={cert}
        seeFilters={seeFilters}
      />
    </div>
  );
}

function FeaturedGrid({
  locations,
  selectedMonth,
  tripMode,
  cert,
  seeFilters,
}: {
  locations: FeaturedLocation[];
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
    if (locations.length === 0) return [];
    const expLevel = cert === "" ? null : certToExperience(cert);

    const passesFilters = (l: FeaturedLocation) => {
      if (tripMode !== "" && !l.tripModes.includes(tripMode)) return false;
      if (expLevel && !l.experiences.includes(expLevel)) return false;
      if (seeFilters.length > 0) {
        const matchesSee = seeFilters.some((f) => {
          if (ANIMAL_OPTIONS.includes(f as AnimalFilter)) {
            return l.animalTags.includes(f);
          }
          return l.interestTags.includes(f);
        });
        if (!matchesSee) return false;
      }
      return true;
    };

    const inSeason = locations
      .filter((l) => l.bestMonths.includes(selectedMonth) && passesFilters(l))
      .sort((a, b) => b.editorialRank - a.editorialRank);

    const seenContinents = new Set<string>();
    const picks: FeaturedLocation[] = [];
    for (const l of inSeason) {
      if (!seenContinents.has(l.continent)) {
        seenContinents.add(l.continent);
        picks.push(l);
      }
    }
    for (const l of inSeason) {
      if (picks.length >= 12) break;
      if (!picks.includes(l)) picks.push(l);
    }

    if (picks.length > 0) return picks;

    return locations
      .filter(passesFilters)
      .sort((a, b) => b.editorialRank - a.editorialRank)
      .slice(0, 6);
  }, [locations, selectedMonth, tripMode, cert, seeFilters]);

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
          All dive sites →
        </Link>
      </div>
      {featured.length === 0 ? (
        <p className="text-sm text-slate-500">
          No locations match these filters for {monthName}. Try clearing a
          filter or picking another month.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => {
            const inSeason = l.bestMonths.includes(selectedMonth);
            return (
              <Link
                key={l.id}
                href={`/locations/${l.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    l.heroImageUrl ??
                    `https://picsum.photos/seed/${l.slug}/800/440`
                  }
                  alt={l.name}
                  className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                />
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {l.country}
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
                    {l.name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {l.description}
                  </p>
                  <div className="mt-3 inline-block rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d5d90]">
                    {l.siteCount} {l.siteCount === 1 ? "dive site" : "dive sites"}
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
