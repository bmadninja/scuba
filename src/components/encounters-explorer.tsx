"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Encounter } from "@/lib/data/types";

// ─── Animal-group taxonomy ─────────────────────────────────────────────────

const ANIMAL_GROUP: Record<string, string> = {
  "sardine-run": "schooling-fish",
  "great-white-cage-diving": "sharks",
  "hammerhead-schools": "sharks",
  "whale-sharks": "sharks",
  "manta-cleaning-stations": "rays-mantas",
  "thresher-sharks": "sharks",
  "mobula-ray-aggregations": "rays-mantas",
  "blackwater-diving": "open-water",
  "coral-spawning": "coral-invertebrates",
  "mandarin-fish-dusk-spawning": "reef-fish",
  "giant-cuttlefish-aggregation": "cephalopods",
};

const ENCOUNTER_TYPE: Record<string, string> = {
  "shark-aggregation": "aggregation",
  "ray-aggregation": "aggregation",
  "cephalopod-aggregation": "aggregation",
  "pelagic-migration": "migration",
  "cage-dive": "cage-diving",
  "cleaning-station": "cleaning-station",
  "blackwater": "night-blackwater",
  "spawning-event": "spawning",
  "mating-event": "spawning",
};

// ─── Filter options ────────────────────────────────────────────────────────

const ANIMAL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All animals" },
  { value: "sharks", label: "Sharks" },
  { value: "rays-mantas", label: "Rays & mantas" },
  { value: "schooling-fish", label: "Schooling fish" },
  { value: "cephalopods", label: "Cephalopods" },
  { value: "reef-fish", label: "Reef fish" },
  { value: "coral-invertebrates", label: "Coral & invertebrates" },
  { value: "open-water", label: "Open water / night" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All encounter types" },
  { value: "aggregation", label: "Aggregation" },
  { value: "migration", label: "Migration" },
  { value: "spawning", label: "Spawning & mating" },
  { value: "cleaning-station", label: "Cleaning station" },
  { value: "night-blackwater", label: "Night / blackwater" },
  { value: "cage-diving", label: "Cage diving" },
];

const SKILL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All skill levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

// ─── Styling ───────────────────────────────────────────────────────────────

const DIFFICULTY_RING: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  intermediate: "bg-amber-50 text-amber-800 ring-amber-200",
  advanced: "bg-orange-50 text-orange-800 ring-orange-200",
  expert: "bg-rose-50 text-rose-800 ring-rose-200",
};

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ─── Component ────────────────────────────────────────────────────────────

export default function EncountersExplorer({
  encounters,
}: {
  encounters: Encounter[];
}) {
  const [animalGroup, setAnimalGroup] = useState("");
  const [encounterType, setEncounterType] = useState("");
  const [skill, setSkill] = useState("");

  const filtered = useMemo(() => {
    return encounters.filter((e) => {
      if (animalGroup && ANIMAL_GROUP[e.id] !== animalGroup) return false;
      if (encounterType && ENCOUNTER_TYPE[e.category] !== encounterType) return false;
      if (skill && e.difficulty !== skill) return false;
      return true;
    });
  }, [encounters, animalGroup, encounterType, skill]);

  const hasActiveFilter = animalGroup || encounterType || skill;

  function clearFilters() {
    setAnimalGroup("");
    setEncounterType("");
    setSkill("");
  }

  return (
    <>
      {/* Filter bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <FilterSelect
          value={animalGroup}
          onChange={setAnimalGroup}
          options={ANIMAL_OPTIONS}
          label="Animal group"
        />
        <FilterSelect
          value={encounterType}
          onChange={setEncounterType}
          options={TYPE_OPTIONS}
          label="Encounter type"
        />
        <FilterSelect
          value={skill}
          onChange={setSkill}
          options={SKILL_OPTIONS}
          label="Skill level"
        />
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="ml-auto rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {hasActiveFilter && (
        <p className="mb-5 text-[13px] text-slate-500">
          {filtered.length === 0
            ? "No encounters match those filters."
            : `${filtered.length} of ${encounters.length} encounters`}
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/encounters/${e.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
            >
              {e.heroImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={e.heroImageUrl}
                  alt={e.name}
                  className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
                />
              ) : (
                <div className="h-44 w-full bg-gradient-to-br from-[#cfe6f7] to-[#0089de]" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {e.category.replace(/-/g, " ")}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${DIFFICULTY_RING[e.difficulty]}`}
                  >
                    {e.difficulty}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-slate-900 group-hover:text-[#0089de]">
                  {e.name}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {e.shortDescription}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.bestMonths.length === 12 ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      Year-round
                    </span>
                  ) : (
                    e.bestMonths.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                      >
                        {MONTH_ABBR[m - 1]}
                      </span>
                    ))
                  )}
                </div>
                <p className="mt-auto pt-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Confidence: {e.confidence}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : hasActiveFilter ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-8 py-16 text-center">
          <p className="text-[15px] font-semibold text-slate-700">
            No encounters match those filters
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            Try broadening your selection or{" "}
            <button
              onClick={clearFilters}
              className="text-[#0089de] hover:underline"
            >
              clear all filters
            </button>
            .
          </p>
        </div>
      ) : null}
    </>
  );
}

// ─── FilterSelect ──────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  const isActive = value !== "";
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer rounded-full border py-1.5 pl-3.5 pr-8 text-[13px] font-medium transition focus:outline-none focus:ring-2 focus:ring-[#0089de]/40 ${
          isActive
            ? "border-[#0089de] bg-[#e8f4fd] text-[#0089de]"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor">
          <path d="M0 0l5 6 5-6H0z" />
        </svg>
      </span>
    </div>
  );
}
