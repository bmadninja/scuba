"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";

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

export function PlanetGlobePanel(props: PlanetGlobeProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(props.initialMonth ?? 1);
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

  const markers = (props.markers ?? []).map((marker) => {
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
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="inline-flex items-center gap-2 rounded-full bg-[#0089de] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d5d90]"
          >
            <SlidersHorizontal className="size-4" />
            {expanded ? "Hide filters" : "Filter"}
          </button>
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

        {expanded ? (
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
        ) : null}
      </div>

      <DynamicPlanetGlobe
        {...props}
        markers={filteredMarkers}
        highlightedCountries={filteredHighlightedCountries}
      />
    </div>
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
