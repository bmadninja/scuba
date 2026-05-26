"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { isDateInSeason } from "@/lib/scuba-globe";

import type { PlanetGlobeProps } from "./planet-globe";
import type { Encounter } from "@/lib/data/types";

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
  { value: "thriving", label: "Stable / watch", hint: "No-stress / watch" },
  { value: "stressed", label: "Heat stress", hint: "Warning / Alert 1" },
  { value: "critical", label: "Severe risk", hint: "Alert 2" },
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
  allEncounters?: Encounter[];
};

export function PlanetGlobePanel(props: PlanetGlobePanelProps) {
  const { featuredLocations = [], allEncounters = [], ...globeProps } = props;
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") ?? "";
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

  const clearAllFilters = () => {
    setSelectedMonths([globeProps.initialMonth ?? 1]);
    setTripMode("");
    setCert("");
    setRecency("");
    setSeeFilters([]);
    setEncounterFilter(null);
    setReefConditions([]);
    setShowAnimalOptions(false);
    setShowEncounterOptions(false);
  };

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
    // Prefer the canonical list (so encounters without any mapped location
    // still appear); fall back to location-aggregated when not provided.
    const source = allEncounters.length > 0
      ? allEncounters.map((e) => ({ id: e.id, slug: e.slug, name: e.name }))
      : (() => {
          const seen = new Map<string, { id: string; slug: string; name: string }>();
          for (const l of featuredLocations) {
            for (const e of l.encounters ?? []) {
              if (!seen.has(e.id)) seen.set(e.id, e);
            }
          }
          return Array.from(seen.values());
        })();
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  }, [allEncounters, featuredLocations]);

  const encountersById = useMemo(
    () => new Map(allEncounters.map((e) => [e.id, e])),
    [allEncounters],
  );

  const encounterNameById = useMemo(
    () => new Map(encounterOptions.map((e) => [e.id, e.name])),
    [encounterOptions],
  );

  const selectedEncounter =
    encounterFilter !== null ? encountersById.get(encounterFilter) ?? null : null;
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
    <div className="grid w-full gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <aside className="lg:sticky lg:top-20">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d5d90]">
                  Focus the atlas
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Follow reef stress, data gaps, and diver-safe evidence.
                </p>
              </div>
              {activeChips.length > 1 ? (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="shrink-0 text-xs font-semibold text-[#0089de] hover:text-[#1d5d90]"
                >
                  Reset
                </button>
              ) : null}
            </div>
            {activeChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeChips.slice(0, 8).map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClear}
                    className="rounded-full bg-[#eef7fb] px-2.5 py-1 text-[11px] font-medium text-[#1d5d90] ring-1 ring-inset ring-[#c7e2f0] transition hover:bg-white"
                    title="Clear filter"
                  >
                    {chip.label} ×
                  </button>
                ))}
                {activeChips.length > 8 ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    +{activeChips.length - 8}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="max-h-none space-y-4 p-4 lg:max-h-[calc(100vh-10rem)] lg:overflow-auto">
              <FilterField label="Months">
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

              <FilterField label="Dive access">
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

              <FilterField label="Contributor level">
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

              <FilterField label="Recent dive activity">
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

              <FilterField label="Reef condition">
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
                  coral-cover survey.
                </p>
              </FilterField>

              <FilterField label="Evidence focus">
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
      </aside>

      <div className="min-w-0">
        <DynamicPlanetGlobe
          {...globeProps}
          markers={filteredMarkers}
          highlightedCountries={filteredHighlightedCountries}
        />

        {selectedEncounter ? (
          <EncounterBrief encounter={selectedEncounter} />
        ) : null}

        <FeaturedGrid
          locations={featuredLocations}
          selectedMonths={sortedMonths}
          tripMode={tripMode}
          cert={cert}
          seeFilters={seeFilters}
          encounterFilter={encounterFilter}
          selectedEncounter={selectedEncounter}
          reefConditions={reefConditions}
          query={normalizedQuery}
        />
      </div>
    </div>
  );
}

function EncounterBrief({ encounter }: { encounter: Encounter }) {
  const DIFFICULTY_RING: Record<string, string> = {
    beginner: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    intermediate: "bg-amber-50 text-amber-800 ring-amber-200",
    advanced: "bg-orange-50 text-orange-800 ring-orange-200",
    expert: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  const monthAbbr = (m: number) =>
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  const months =
    encounter.bestMonths.length === 12
      ? "Year-round"
      : encounter.bestMonths.map(monthAbbr).join(" · ");
  const primaryRegion =
    encounter.regions.find((r) => r.status === "primary") ??
    encounter.regions[0];
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-0 sm:flex-row">
        {encounter.heroImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={encounter.heroImageUrl}
            alt={encounter.name}
            className="h-32 w-full object-cover sm:h-auto sm:w-40 sm:shrink-0"
          />
        ) : null}
        <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {encounter.name}
              </h3>
              {encounter.speciesCommon ? (
                <p className="text-xs text-slate-600">
                  {encounter.speciesCommon}
                </p>
              ) : null}
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${DIFFICULTY_RING[encounter.difficulty]}`}
            >
              {encounter.difficulty}
            </span>
          </div>
          <p className="text-[12px] leading-5 text-slate-600">
            <span className="font-semibold text-slate-700">When:</span>{" "}
            {months}
            {primaryRegion ? (
              <>
                {" · "}
                <span className="font-semibold text-slate-700">Best in:</span>{" "}
                {primaryRegion.name}, {primaryRegion.country}
              </>
            ) : null}
          </p>
          <Link
            href={`/encounters/${encounter.slug}`}
            className="inline-flex w-fit items-center gap-1 rounded-full bg-[#0089de] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d5d90]"
          >
            Open encounter guide →
          </Link>
        </div>
      </div>
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
  selectedEncounter,
  reefConditions,
  query,
}: {
  locations: FeaturedLocation[];
  selectedMonths: number[];
  tripMode: TripModeFilter | "";
  cert: CertFilter | "";
  seeFilters: SeeFilter[];
  encounterFilter: string | null;
  selectedEncounter: Encounter | null;
  reefConditions: ReefCondition[];
  query: string;
}) {
  // An encounter "has atlas coverage" if any of its regions resolve to a
  // scubaSeason location we cover. Region.inAtlasLocationId is the direct
  // link; nearbyAtlasLocationIds enables "pair with" — we use both to drive
  // the location grid.
  const encounterHasLocations = selectedEncounter
    ? selectedEncounter.regions.some(
        (r) =>
          r.inAtlasLocationId ||
          (r.nearbyAtlasLocationIds && r.nearbyAtlasLocationIds.length > 0),
      )
    : true;
  // Map atlas locationId → { months, region } so the grid can prefer the
  // region-specific season over the encounter-wide bestMonths.
  const encounterLocationRefs = useMemo(() => {
    if (!selectedEncounter) return null;
    const m = new Map<
      string,
      { bestMonthsAtLocation?: number[]; isPrimary: boolean }
    >();
    for (const r of selectedEncounter.regions) {
      const ids = [
        r.inAtlasLocationId,
        ...(r.nearbyAtlasLocationIds ?? []),
      ].filter((x): x is string => Boolean(x));
      for (const id of ids) {
        // First write wins so direct hits aren't overwritten by neighbor hits.
        if (!m.has(id)) {
          m.set(id, {
            bestMonthsAtLocation: r.bestMonthsAtRegion,
            isPrimary: Boolean(r.inAtlasLocationId === id),
          });
        }
      }
    }
    return m;
  }, [selectedEncounter]);
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

    const inSeasonForLocation = (l: FeaturedLocation): boolean => {
      if (selectedEncounter && encounterLocationRefs) {
        // Encounter-aware season: prefer per-location override, else the
        // encounter's own bestMonths. Don't fall back to the location's
        // generic seasonality — a mandarin-fish dusk dive happens nightly
        // even outside the destination's "macro season."
        const ref = encounterLocationRefs.get(l.id);
        const months =
          ref?.bestMonthsAtLocation && ref.bestMonthsAtLocation.length > 0
            ? ref.bestMonthsAtLocation
            : selectedEncounter.bestMonths;
        return months.some((m) => selectedMonthSet.has(m));
      }
      return l.bestMonths.some((m) => selectedMonthSet.has(m));
    };

    const inSeason = locations
      .filter((l) => inSeasonForLocation(l) && passesFilters(l))
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
  }, [locations, selectedMonths.join(","), tripMode, cert, seeFilters, encounterFilter, selectedEncounter, encounterLocationRefs, reefConditions.join(","), query]);

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
            Reef signals worth watching.
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
            Each location card shows reef condition, coral cover, seasonality,
            and what evidence we currently have &mdash; dated, sourced, and
            bounded by limitations.
          </p>
        </div>
        <Link
          href="/sites"
          className="hidden text-sm font-semibold text-[#0089de] hover:text-[#1d5d90] sm:inline-flex"
        >
          All dive sites →
        </Link>
      </div>
      {encounterFilter && !encounterHasLocations ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Operators for this encounter aren&rsquo;t in our location atlas yet
          &mdash; the closest sites are a separate, regional industry. See the
          encounter brief above for when and where it actually happens.
        </p>
      ) : featured.length === 0 ? (
        <p className="text-sm text-slate-500">
          No locations match these filters for {monthName}. Try clearing a
          filter or picking another month.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => {
            const seasonMonths = selectedEncounter
              ? (encounterLocationRefs?.get(l.id)?.bestMonthsAtLocation
                  ?.length
                  ? encounterLocationRefs.get(l.id)!.bestMonthsAtLocation!
                  : selectedEncounter.bestMonths)
              : l.bestMonths;
            const inSeason = seasonMonths.some((m) => selectedMonthSet.has(m));
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
