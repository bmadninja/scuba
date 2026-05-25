"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";

export type ReefCondition = "thriving" | "stressed" | "critical" | "unknown";

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
  /** 0 = never-dived … 5 = tech. The easiest site at this location. */
  minSkillRank: number;
  experiences: ("beginner" | "intermediate" | "advanced")[];
  interestTags: string[];
  animalTags: string[];
  encounters: { id: string; slug: string; name: string }[];
  tripModes: ("liveaboard" | "resort")[];
  reefCondition: ReefCondition;
  coralCoverPercent?: number;
  coralCoverDate?: string;
  bleachedPercent?: number;
};

const REEF_CONDITION_OPTIONS: {
  value: ReefCondition;
  label: string;
  hint: string;
}[] = [
  { value: "thriving", label: "Thriving reefs", hint: "No-stress / watch" },
  { value: "stressed", label: "Under stress", hint: "Warning / Alert 1" },
  { value: "critical", label: "See now — critical", hint: "Alert 2" },
];

const REEF_CONDITION_BADGE: Record<
  ReefCondition,
  { label: string; className: string }
> = {
  thriving: {
    label: "Thriving reef",
    className: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  },
  stressed: {
    label: "Under stress",
    className: "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200",
  },
  critical: {
    label: "Critical — see now",
    className: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
  },
  unknown: {
    label: "Data pending",
    className: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
  },
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
  | "Bucket list"
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
  "Bucket list",
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
  const [query, setQuery] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    globeProps.initialMonth ?? 1,
  ]);
  const [tripMode, setTripMode] = useState<TripModeFilter | "">("");
  const [cert, setCert] = useState<CertFilter | "">("");
  const [recency, setRecency] = useState<RecencyFilter | "">("");
  const [seeFilters, setSeeFilters] = useState<SeeFilter[]>([]);
  const [encounterFilter, setEncounterFilter] = useState<string | null>(null);
  const [reefConditions, setReefConditions] = useState<ReefCondition[]>([]);
  const [showAnimalOptions, setShowAnimalOptions] = useState(false);
  const [showEncounterOptions, setShowEncounterOptions] = useState(false);

  const toggleBucketList = () => {
    setShowEncounterOptions((s) => {
      const next = !s;
      if (!next) setEncounterFilter(null);
      return next;
    });
  };

  const selectEncounter = (id: string) => {
    setEncounterFilter((current) => (current === id ? null : id));
  };

  const encounterOptions = useMemo(() => {
    const seen = new Map<string, { id: string; slug: string; name: string }>();
    for (const l of featuredLocations) {
      for (const e of l.encounters ?? []) {
        if (!seen.has(e.id)) seen.set(e.id, e);
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [featuredLocations]);

  const encounterNameById = useMemo(
    () => new Map(encounterOptions.map((e) => [e.id, e.name])),
    [encounterOptions],
  );
  const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
  const selectedDates = sortedMonths.map(
    (m) => new Date(Date.UTC(2024, m - 1, 15)),
  );

  const toggleMonth = (m: number) => {
    setSelectedMonths((current) => {
      if (current.includes(m)) {
        if (current.length === 1) return current;
        return current.filter((x) => x !== m);
      }
      return [...current, m];
    });
  };

  const animalFilterSet = new Set<AnimalFilter>(
    seeFilters.filter((filter): filter is AnimalFilter =>
      ANIMAL_OPTIONS.includes(filter as AnimalFilter),
    ),
  );
  const bigAnimalsActive = showAnimalOptions || animalFilterSet.size > 0;

  const toggleBigAnimals = () => {
    if (bigAnimalsActive) {
      // Close the sub-panel and clear any animal selections.
      setShowAnimalOptions(false);
      setSeeFilters((current) =>
        current.filter(
          (filter) => !ANIMAL_OPTIONS.includes(filter as AnimalFilter),
        ),
      );
      return;
    }
    // Reveal the sub-options without auto-selecting; user picks individually.
    setShowAnimalOptions(true);
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
    const isInSeason = selectedDates.some((d) =>
      isDateInSeason(d, marker.season!),
    );
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

  const normalizedQuery = query.trim().toLowerCase();
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
    const matchesQuery =
      normalizedQuery === "" ||
      marker.label.toLowerCase().includes(normalizedQuery) ||
      (marker.country?.toLowerCase().includes(normalizedQuery) ?? false);
    return matchesTripMode && matchesCert && matchesInterest && matchesQuery;
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
  for (const r of reefConditions) {
    const opt = REEF_CONDITION_OPTIONS.find((o) => o.value === r);
    if (opt)
      activeChips.push({
        key: `reef-${r}`,
        label: opt.label,
        onClear: () => setReefConditions((c) => c.filter((x) => x !== r)),
      });
  }
  for (const f of seeFilters) {
    activeChips.push({
      key: `see-${f}`,
      label: f,
      onClear: () => setSeeFilters((c) => c.filter((x) => x !== f)),
    });
  }
  if (encounterFilter) {
    const name = encounterNameById.get(encounterFilter) ?? encounterFilter;
    activeChips.push({
      key: `enc-${encounterFilter}`,
      label: name,
      onClear: () => setEncounterFilter(null),
    });
  }
  for (const m of sortedMonths) {
    activeChips.push({
      key: `month-${m}`,
      label: MONTH_OPTIONS[m - 1].label,
      onClear: () => toggleMonth(m),
    });
  }

  return (
    <div className="w-full">
      {/* Top filter bar (PADI-style light) */}
      <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-4">
            <div className="mb-4">
              <label className="relative block">
                <span className="sr-only">Search locations</span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                >
                  <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m14 14 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dive locations or countries…"
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0089de]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FilterField label="Months" className="sm:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap gap-1.5">
                  {MONTH_OPTIONS.map((o) => {
                    const active = selectedMonths.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleMonth(o.value)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? "bg-[#0089de] text-white"
                            : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                        }`}
                      >
                        {o.label.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
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

              <FilterField label="Reef condition" className="sm:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap gap-1.5">
                  {REEF_CONDITION_OPTIONS.map((o) => {
                    const active = reefConditions.includes(o.value);
                    return (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={active}
                        title={o.hint}
                        onClick={() =>
                          setReefConditions((c) => toggleValue(c, o.value))
                        }
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
                <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
                  Reef condition is the worst current NOAA Coral Reef Watch
                  alert level on file, paired with the most recent in-situ
                  coral-cover survey. &ldquo;Data pending&rdquo; means we haven&rsquo;t
                  ingested a survey yet — not that the reef is healthy.
                </p>
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
                            bigAnimalsActive
                              ? "bg-[#0089de] text-white"
                              : "border border-slate-300 bg-white text-slate-700 hover:border-[#0089de] hover:text-[#0089de]"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    }
                    if (option === "Bucket list") {
                      if (encounterOptions.length === 0) return null;
                      const active =
                        showEncounterOptions || encounterFilter !== null;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={toggleBucketList}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                            active
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
                {showEncounterOptions && encounterOptions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-200 pt-2">
                    {encounterOptions.map((e) => {
                      const active = encounterFilter === e.id;
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => selectEncounter(e.id)}
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
        selectedMonths={sortedMonths}
        tripMode={tripMode}
        cert={cert}
        seeFilters={seeFilters}
        encounterFilter={encounterFilter}
        reefConditions={reefConditions}
        query={normalizedQuery}
      />
    </div>
  );
}

function FeaturedGrid({
  locations,
  selectedMonths,
  tripMode,
  cert,
  seeFilters,
  encounterFilter,
  reefConditions,
  query,
}: {
  locations: FeaturedLocation[];
  selectedMonths: number[];
  tripMode: TripModeFilter | "";
  cert: CertFilter | "";
  seeFilters: SeeFilter[];
  encounterFilter: string | null;
  reefConditions: ReefCondition[];
  query: string;
}) {
  const monthName =
    selectedMonths.length === 1
      ? MONTH_OPTIONS[selectedMonths[0] - 1].label
      : selectedMonths.length <= 3
        ? selectedMonths.map((m) => MONTH_OPTIONS[m - 1].label.slice(0, 3)).join(", ")
        : `${selectedMonths.length} months`;
  const selectedMonthSet = new Set(selectedMonths);

  // Cert → maximum minSkillRank a location can have to qualify.
  // We want "matches my level" to mean "the *easiest* dive at this
  // location is at or below my certification" — so a never-dived
  // visitor only sees places where they can actually book a dive.
  const certToMaxMinSkillRank = (c: CertFilter): number => {
    switch (c) {
      case "never-dived":
        // Pure try-dive locations are rare; allow Open Water sites too
        // so the user can certify on the trip.
        return 1;
      case "open-water":
        return 1;
      case "advanced":
        return 2;
      case "rescue":
        return 3;
      case "divemaster":
        return 4;
      case "tech":
        return 5;
    }
  };

  const featured = useMemo(() => {
    if (locations.length === 0) return [];
    const maxMinSkill = cert === "" ? null : certToMaxMinSkillRank(cert);

    const passesFilters = (l: FeaturedLocation) => {
      if (query !== "") {
        const hay = `${l.name} ${l.country} ${l.continent}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (tripMode !== "" && !l.tripModes.includes(tripMode)) return false;
      if (maxMinSkill !== null && l.minSkillRank > maxMinSkill) return false;
      if (reefConditions.length > 0 && !reefConditions.includes(l.reefCondition))
        return false;
      if (seeFilters.length > 0) {
        const matchesSee = seeFilters.some((f) => {
          if (ANIMAL_OPTIONS.includes(f as AnimalFilter)) {
            return l.animalTags.includes(f);
          }
          return l.interestTags.includes(f);
        });
        if (!matchesSee) return false;
      }
      if (encounterFilter) {
        if (!l.encounters.some((e) => e.id === encounterFilter)) return false;
      }
      return true;
    };

    const inSeason = locations
      .filter(
        (l) =>
          l.bestMonths.some((m) => selectedMonthSet.has(m)) && passesFilters(l),
      )
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, selectedMonths.join(","), tripMode, cert, seeFilters, encounterFilter, reefConditions.join(","), query]);

  const hasFilters =
    tripMode !== "" || cert !== "" || seeFilters.length > 0 || encounterFilter !== null || reefConditions.length > 0 || query !== "";

  const certLabel = cert
    ? (CERT_OPTIONS.find((o) => o.value === cert)?.label ?? "")
    : "";

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0089de]">
            {hasFilters
              ? `${featured.length} ${featured.length === 1 ? "match" : "matches"} · ${monthName}${certLabel ? ` · ${certLabel}` : ""}`
              : `In season this month · ${monthName}`}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            What the ocean is doing right now.
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
            Each location card shows reef condition, coral cover, and what
            you&rsquo;d see in season &mdash; sourced, dated, and limitations on file.
          </p>
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
            const inSeason = l.bestMonths.some((m) => selectedMonthSet.has(m));
            return (
              <Link
                key={l.id}
                href={`/locations/${l.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-[#0089de]/40 hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={underwaterPhotoUrl(l.heroImageUrl)}
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
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="inline-block rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d5d90]">
                      {l.siteCount} {l.siteCount === 1 ? "dive site" : "dive sites"}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${REEF_CONDITION_BADGE[l.reefCondition].className}`}
                    >
                      {REEF_CONDITION_BADGE[l.reefCondition].label}
                    </span>
                    {l.coralCoverPercent !== undefined ? (
                      <span className="inline-block rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                        {l.coralCoverPercent}% coral cover
                        {l.coralCoverDate
                          ? ` · ${l.coralCoverDate.slice(0, 4)}`
                          : ""}
                      </span>
                    ) : null}
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
