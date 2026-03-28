"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { X } from "lucide-react";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";

type TripModeFilter = "liveaboard" | "resort";
type ExperienceFilter = "beginner" | "intermediate" | "advanced";
type InterestFilter =
  | "Big animals"
  | "Coral reefs"
  | "Macro & critters"
  | "Wrecks"
  | "Dramatic topography";
type AnimalFilter = "Sharks" | "Whales" | "Mantas" | "Dolphins" | "Turtles" | "Dugongs";
type SeeFilter = InterestFilter | AnimalFilter;

const DynamicPlanetGlobe = dynamic(
  () =>
    import("./planet-globe").then((module) => module.PlanetGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="w-full overflow-hidden rounded-[2rem] border border-cyan-100/10 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.24),_transparent_36%),linear-gradient(180deg,_rgba(3,15,32,0.98),_rgba(1,8,18,0.98))] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
        <div className="min-h-[340px] animate-pulse rounded-[1.5rem] bg-white/5" />
      </div>
    ),
  },
);

const TRIP_MODE_OPTIONS = [
  { value: "liveaboard", label: "Liveaboard" },
  { value: "resort", label: "Resort / day boat" },
] as const;

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner-friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

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
  const [selectedMonth, setSelectedMonth] = useState(props.initialMonth ?? 1);
  const [tripMode, setTripMode] = useState<TripModeFilter | "">("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceFilter | "">("");
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
    if (!marker.season) {
      return marker;
    }

    const isInSeason = isDateInSeason(selectedDate, marker.season);

    return {
      ...marker,
      isInSeason,
      color: isInSeason ? "#2f5d39" : "#6b1f2c",
    };
  });

  const filteredMarkers = markers.filter((marker) => {
    const matchesTripMode =
      tripMode === "" || marker.tripMode === tripMode;
    const matchesExperience =
      experienceLevel === "" || marker.experienceTags?.includes(experienceLevel);
    const matchesInterest =
      seeFilters.length === 0 ||
      seeFilters.some((filter) => {
        if (ANIMAL_OPTIONS.includes(filter as AnimalFilter)) {
          return marker.animalTags?.includes(filter);
        }

        return marker.interestTags?.includes(filter);
      });

    return matchesTripMode && matchesExperience && matchesInterest;
  });

  const filteredHighlightedCountries = Array.from(
    new Set(
      filteredMarkers
        .filter((marker) => marker.isInSeason)
        .map((marker) => marker.country ?? "")
        .filter(Boolean),
    ),
  );

  return (
    <div className="w-full">
      <div className="mb-4 rounded-[1.75rem] border border-cyan-100/10 bg-slate-950/55 p-4 text-left shadow-[0_20px_80px_rgba(0,0,0,0.16)] backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-100/55">
              Month
            </span>
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-200/35"
            >
              {MONTH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-100/55">
              Trip Type
            </span>
            <select
              value={tripMode}
              onChange={(event) =>
                setTripMode(event.target.value as TripModeFilter | "")
              }
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-200/35"
            >
              <option value="">Any trip type</option>
              {TRIP_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-100/55">
              Experience
            </span>
            <select
              value={experienceLevel}
              onChange={(event) =>
                setExperienceLevel(event.target.value as ExperienceFilter | "")
              }
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-200/35"
            >
              <option value="">Any experience level</option>
              {EXPERIENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

        </div>

        <div className="mt-4 border-t border-white/8 pt-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-cyan-100/55">
              See
            </p>
            {seeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {seeFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() =>
                      setSeeFilters((current) => current.filter((item) => item !== filter))
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-200/30 bg-cyan-300/12 px-3 py-1 text-xs font-medium text-cyan-50"
                  >
                    {filter}
                    <X className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((option) => {
              const active = seeFilters.includes(option);

              if (option === "Big animals") {
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={toggleBigAnimals}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      allAnimalsSelected
                        ? "border-cyan-200/40 bg-cyan-300/14 text-cyan-50"
                        : "border-white/8 bg-transparent text-slate-300 hover:border-cyan-100/20 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                );
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSeeFilters((current) => toggleValue(current, option))}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-cyan-200/40 bg-cyan-300/14 text-cyan-50"
                      : "border-white/8 bg-transparent text-slate-300 hover:border-cyan-100/20 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {showAnimalOptions ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
              {ANIMAL_OPTIONS.map((option) => {
                const active = animalFilterSet.has(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleAnimalFilter(option)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-cyan-200/40 bg-cyan-300/14 text-cyan-50"
                        : "border-white/8 bg-transparent text-slate-300 hover:border-cyan-100/20 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <DynamicPlanetGlobe
        {...props}
        markers={filteredMarkers}
        highlightedCountries={filteredHighlightedCountries}
      />
    </div>
  );
}
