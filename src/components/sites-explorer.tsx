"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getReefState, STATE_TEXT, STATE_COLOR } from "@/lib/data/reef-state";
import { getHeadlineSightingForSite, formatLastConfirmed } from "@/lib/data/sightings";
import { EvidenceDot } from "@/components/evidence-dot";
import { SitesGlobe } from "@/components/sites-globe";
import type { Location, Site, SkillLevel } from "@/lib/data/types";
import type { ReefState } from "@/lib/data/reef-state";

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  sites: Site[];
  locationsById: Record<string, Location>;
  currentMonth: number;
};

type SortKey = "season" | "oldest-survey" | "name";
type ViewMode = "cards" | "map";

// ─── constants ────────────────────────────────────────────────────────────────

const SKILL_LABEL: Record<SkillLevel, string> = {
  "never-dived": "Beginner",
  "open-water": "Open water+",
  advanced: "Advanced+",
  rescue: "Advanced+",
  divemaster: "Advanced+",
  tech: "Technical",
};

const SKILL_RANK: Record<SkillLevel, number> = {
  "never-dived": 0,
  "open-water": 1,
  advanced: 2,
  rescue: 3,
  divemaster: 4,
  tech: 5,
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CERT_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "never-dived", label: "Beginner" },
  { value: "open-water", label: "Open water" },
  { value: "advanced", label: "Advanced" },
  { value: "tech", label: "Technical" },
];

// ─── "What to see" grouped sub-items ─────────────────────────────────────────

const WHAT_TO_SEE_GROUPS: {
  groupLabel: string;
  items: { value: string; label: string; keywords: string[] }[];
}[] = [
  {
    groupLabel: "Sharks & rays",
    items: [
      { value: "hammerhead-sharks", label: "Hammerhead sharks", keywords: ["hammerhead"] },
      { value: "whale-sharks", label: "Whale sharks", keywords: ["whale shark"] },
      { value: "manta-rays", label: "Manta rays", keywords: ["manta"] },
      { value: "reef-sharks", label: "Reef sharks", keywords: ["reef shark", "whitetip", "blacktip", "silvertip", "grey reef"] },
      { value: "nurse-wobbegong", label: "Nurse & wobbegong", keywords: ["nurse shark", "wobbegong", "tawny"] },
    ],
  },
  {
    groupLabel: "Marine mammals",
    items: [
      { value: "whales", label: "Whales", keywords: ["humpback", "sperm whale", "blue whale", "pilot whale", "minke whale"] },
      { value: "dolphins", label: "Dolphins", keywords: ["dolphin", "orca", "porpoise"] },
      { value: "dugongs", label: "Dugongs", keywords: ["dugong", "manatee"] },
    ],
  },
  {
    groupLabel: "Reptiles & pelagics",
    items: [
      { value: "sea-turtles", label: "Sea turtles", keywords: ["turtle"] },
      { value: "barracuda-jacks", label: "Barracuda & jacks", keywords: ["barracuda", "trevally", "jack"] },
      { value: "tuna-billfish", label: "Tuna & billfish", keywords: ["tuna", "marlin", "wahoo", "sailfish"] },
    ],
  },
  {
    groupLabel: "Macro & critters",
    items: [
      { value: "nudibranchs", label: "Nudibranchs", keywords: ["nudibranch"] },
      { value: "seahorses-pipefish", label: "Seahorses & pipefish", keywords: ["seahorse", "pipefish"] },
      { value: "octopus-cuttlefish", label: "Octopus & cuttlefish", keywords: ["octopus", "cuttlefish", "squid"] },
      { value: "frogfish-gobies", label: "Frogfish & gobies", keywords: ["frogfish", "goby", "pygmy"] },
    ],
  },
];

const SEE_ITEM_MAP = new Map(
  WHAT_TO_SEE_GROUPS.flatMap((g) => g.items.map((i) => [i.value, i]))
);

function siteMatchesSeeItem(site: Site, value: string): boolean {
  const item = SEE_ITEM_MAP.get(value);
  if (!item) return false;
  return site.species.some((sp) =>
    item.keywords.some((kw) => sp.commonName.toLowerCase().includes(kw))
  );
}

// ─── Region grouped sub-items ─────────────────────────────────────────────────

const REGION_GROUPS: {
  groupLabel: string;
  bucketValue: string;
  items: { value: string; label: string; regions: string[] }[];
}[] = [
  {
    groupLabel: "Asia",
    bucketValue: "Asia",
    items: [
      { value: "indonesia", label: "Indonesia", regions: ["Bali", "North Sulawesi", "West Papua", "Lesser Sunda Islands", "South Central Coast", "Southwest Coast", "North Coast"] },
      { value: "philippines", label: "Philippines", regions: ["Cebu", "Visayas", "Mindoro"] },
      { value: "malaysia-borneo", label: "Malaysia & Borneo", regions: ["Sabah", "Sulu Sea", "South China Sea"] },
      { value: "thailand-andaman", label: "Thailand & Andaman", regions: ["Andaman Sea", "Gulf of Thailand", "Andaman Islands"] },
      { value: "japan-east-asia", label: "Japan & East Asia", regions: ["Bonin Islands", "Ryukyu Islands", "Korea Strait", "Hainan"] },
      { value: "micronesia", label: "Micronesia & Pacific", regions: ["Micronesia", "Chuuk", "Yap"] },
      { value: "south-asia", label: "South Asia", regions: ["Lakshadweep"] },
    ],
  },
  {
    groupLabel: "Oceania",
    bucketValue: "Oceania",
    items: [
      { value: "australia", label: "Australia", regions: ["Great Barrier Reef", "Western Australia", "New South Wales", "Coral Sea"] },
      { value: "fiji-pacific", label: "Fiji & South Pacific", regions: ["Somosomo Strait", "South Pacific", "Western Pacific", "Tuamotu Archipelago"] },
      { value: "png-solomons", label: "PNG & Solomon Islands", regions: ["New Britain", "Guadalcanal", "Espiritu Santo"] },
      { value: "new-zealand", label: "New Zealand", regions: ["Fiordland", "Northland"] },
    ],
  },
  {
    groupLabel: "Indian Ocean",
    bucketValue: "Indian Ocean",
    items: [
      { value: "maldives", label: "Maldives & Sri Lanka", regions: ["Indian Ocean"] },
      { value: "east-africa", label: "East Africa", regions: ["East Africa", "Mozambique Channel", "KwaZulu-Natal", "Zanzibar"] },
      { value: "red-sea-gulf", label: "Red Sea & Gulf", regions: ["Red Sea", "Gulf of Aden", "Gulf of Oman", "Arabian Sea"] },
    ],
  },
  {
    groupLabel: "Americas",
    bucketValue: "Americas",
    items: [
      { value: "caribbean", label: "Caribbean", regions: ["Caribbean", "Bay Islands", "Yucatán Peninsula"] },
      { value: "eastern-pacific-galapagos", label: "Eastern Pacific & Galápagos", regions: ["Eastern Pacific", "Galápagos", "Guanacaste"] },
      { value: "north-south-america", label: "North & South America", regions: ["California", "Hawaii", "Florida", "East Coast", "Southeast Brazil"] },
    ],
  },
  {
    groupLabel: "Atlantic & Mediterranean",
    bucketValue: "Atlantic & Mediterranean",
    items: [
      { value: "mediterranean", label: "Mediterranean", regions: ["Mediterranean", "Adriatic Sea"] },
      { value: "atlantic-islands", label: "Atlantic Islands", regions: ["Azores", "Canary Islands"] },
      { value: "north-atlantic", label: "North Atlantic", regions: ["Atlantic Ocean", "Orkney"] },
    ],
  },
];

const SUB_REGION_MAP = new Map(
  REGION_GROUPS.flatMap((g) => g.items.map((i) => [i.value, i.regions]))
);

const BROAD_REGION_VALUES = new Set(REGION_GROUPS.map((g) => g.bucketValue));

const REGION_BUCKET: Record<string, string> = {
  "Andaman Islands": "Asia", "Andaman Sea": "Asia", "Bali": "Asia",
  "Bonin Islands": "Asia", "Cebu": "Asia", "Chuuk": "Asia",
  "Gulf of Thailand": "Asia", "Hainan": "Asia", "Korea Strait": "Asia",
  "Lakshadweep": "Asia", "Lesser Sunda Islands": "Asia", "Micronesia": "Asia",
  "Mindoro": "Asia", "North Sulawesi": "Asia", "Ryukyu Islands": "Asia",
  "Sabah": "Asia", "South China Sea": "Asia", "South Central Coast": "Asia",
  "Southwest Coast": "Asia", "Sulu Sea": "Asia", "Visayas": "Asia",
  "West Papua": "Asia", "Yap": "Asia", "North Coast": "Asia",
  "Coral Sea": "Oceania", "Espiritu Santo": "Oceania", "Fiordland": "Oceania",
  "Great Barrier Reef": "Oceania", "Guadalcanal": "Oceania", "New Britain": "Oceania",
  "New South Wales": "Oceania", "Northland": "Oceania", "Somosomo Strait": "Oceania",
  "South Pacific": "Oceania", "Tuamotu Archipelago": "Oceania",
  "Western Australia": "Oceania", "Western Pacific": "Oceania",
  "Arabian Sea": "Indian Ocean", "East Africa": "Indian Ocean",
  "Gulf of Aden": "Indian Ocean", "Gulf of Oman": "Indian Ocean",
  "Indian Ocean": "Indian Ocean", "KwaZulu-Natal": "Indian Ocean",
  "Mozambique Channel": "Indian Ocean", "Red Sea": "Indian Ocean",
  "Zanzibar": "Indian Ocean",
  "Bay Islands": "Americas", "California": "Americas", "Caribbean": "Americas",
  "East Coast": "Americas", "Eastern Pacific": "Americas", "Florida": "Americas",
  "Galápagos": "Americas", "Guanacaste": "Americas", "Hawaii": "Americas",
  "Southeast Brazil": "Americas", "Yucatán Peninsula": "Americas",
  "Adriatic Sea": "Atlantic & Mediterranean", "Atlantic Ocean": "Atlantic & Mediterranean",
  "Azores": "Atlantic & Mediterranean", "Canary Islands": "Atlantic & Mediterranean",
  "Mediterranean": "Atlantic & Mediterranean", "Orkney": "Atlantic & Mediterranean",
};

function getRegionBucket(location: { region: string } | null | undefined): string {
  if (!location) return "Other";
  return REGION_BUCKET[location.region] ?? "Other";
}

function regionFilterMatches(filterValue: string, location: Location | null | undefined): boolean {
  if (!location) return false;
  if (BROAD_REGION_VALUES.has(filterValue)) {
    return getRegionBucket(location) === filterValue;
  }
  const regions = SUB_REGION_MAP.get(filterValue);
  return regions?.includes(location.region) ?? false;
}

function getRegionLabel(value: string): string {
  if (BROAD_REGION_VALUES.has(value)) return value;
  for (const g of REGION_GROUPS) {
    const item = g.items.find((i) => i.value === value);
    if (item) return item.label;
  }
  return value;
}

function getSeeLabel(value: string): string {
  return SEE_ITEM_MAP.get(value)?.label ?? value;
}

/** Reef state config — ordered as in the mockup strip */
const REEF_STATES: { value: ReefState; label: string }[] = [
  { value: "thriving", label: "Improving" },
  { value: "pressure", label: "Stable" },
  { value: "change", label: "Declining" },
];

/** Ocean-gradient backgrounds per index, cycling through 6 variants */
const OCEAN_GRADIENTS = [
  "linear-gradient(155deg,#041c33,#065566,#0a7a6b)",
  "linear-gradient(150deg,#0a3060,#0a6b8a,#087a6e)",
  "linear-gradient(158deg,#0d4a7a,#0a6b9a,#08a0b2)",
  "linear-gradient(145deg,#0e2240,#122f55,#1a4060)",
  "linear-gradient(152deg,#031522,#064466,#0b829f)",
  "linear-gradient(148deg,#041c33,#063a52,#086b7a)",
];

// ─── reef-state badge styles ──────────────────────────────────────────────────

const REEF_STATE_BADGE: Record<ReefState, { bg: string; color: string; border: string }> = {
  thriving: {
    bg: "rgba(16,185,129,0.14)",
    color: "#6ee7b7",
    border: "1px solid rgba(16,185,129,0.22)",
  },
  pressure: {
    bg: "rgba(245,158,11,0.16)",
    color: "#fbbf24",
    border: "1px solid rgba(245,158,11,0.28)",
  },
  change: {
    bg: "rgba(244,63,94,0.14)",
    color: "#fca5a5",
    border: "1px solid rgba(244,63,94,0.2)",
  },
};

// ─── URL param helpers ────────────────────────────────────────────────────────

function getMultiParam(params: ReturnType<typeof useSearchParams>, key: string): string[] {
  const val = params.get(key);
  if (!val) return [];
  return val.split(",").filter(Boolean);
}

// ─── main component ───────────────────────────────────────────────────────────

export function SitesExplorer({ sites, locationsById, currentMonth }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  // ── read params ──────────────────────────────────────────────────────────────
  const query = params.get("q") ?? "";
  const reefStates = getMultiParam(params, "reef") as ReefState[];
  const certFilters = getMultiParam(params, "cert") as SkillLevel[];
  const seeFilters = getMultiParam(params, "see");
  const regionFilters = getMultiParam(params, "region");
  const freshFilter = params.get("fresh") === "1";
  const monthFilters = getMultiParam(params, "month").map(Number).filter((n) => n >= 1 && n <= 12);
  const sortKey = (params.get("sort") as SortKey | null) ?? "season";
  const viewMode = (params.get("view") as ViewMode | null) ?? "cards";

  // ── URL mutators ─────────────────────────────────────────────────────────────
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

  const toggleMultiParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      const current = (next.get(key) ?? "").split(",").filter(Boolean);
      const idx = current.indexOf(value);
      if (idx >= 0) current.splice(idx, 1);
      else current.push(value);
      if (current.length === 0) next.delete(key);
      else next.set(key, current.join(","));
      const qs = next.toString();
      router.replace(qs ? `/sites?${qs}` : "/sites", { scroll: false });
    },
    [params, router],
  );

  const clearAll = () =>
    router.replace(viewMode === "map" ? "/sites?view=map" : "/sites", { scroll: false });

  // ── reef state cache (per-site, keyed by locationId) ─────────────────────────
  const reefStateByLocationId = useMemo(() => {
    const cache: Record<string, ReefState> = {};
    for (const s of sites) {
      if (!(s.locationId in cache)) {
        cache[s.locationId] = getReefState(s.locationId);
      }
    }
    return cache;
  }, [sites]);

  // ── filter ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = sites.filter((s) => {
      // reef state — OR logic
      if (reefStates.length > 0 && !reefStates.includes(reefStateByLocationId[s.locationId])) return false;
      // cert — show sites accessible to the highest selected cert level
      if (certFilters.length > 0) {
        const maxRank = Math.max(...certFilters.map((c) => SKILL_RANK[c] ?? 0));
        if (SKILL_RANK[s.skillLevel] > maxRank) return false;
      }
      // what to see — OR logic
      if (seeFilters.length > 0 && !seeFilters.some((f) => siteMatchesSeeItem(s, f))) return false;
      // region — OR logic
      if (regionFilters.length > 0 && !regionFilters.some((f) => regionFilterMatches(f, locationsById[s.locationId]))) return false;
      // fresh eyes
      if (freshFilter && getHeadlineSightingForSite(s.id) !== null) return false;
      // months — OR logic (in-season for any selected month)
      if (monthFilters.length > 0 && !monthFilters.some((m) => s.bestMonths.includes(m))) return false;
      // text search
      if (q) {
        const hay = [
          s.name,
          s.description,
          locationsById[s.locationId]?.country ?? "",
          locationsById[s.locationId]?.region ?? "",
          locationsById[s.locationId]?.name ?? "",
          ...s.species.map((sp) => sp.commonName),
          ...s.species.map((sp) => sp.scientificName ?? ""),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // sort
    if (sortKey === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey === "oldest-survey") {
      result = [...result].sort((a, b) => b.editorialRank - a.editorialRank);
    } else {
      result = [...result].sort((a, b) => {
        const aIn = a.bestMonths.includes(currentMonth) ? 1 : 0;
        const bIn = b.bestMonths.includes(currentMonth) ? 1 : 0;
        if (bIn !== aIn) return bIn - aIn;
        return b.editorialRank - a.editorialRank;
      });
    }

    return result;
  }, [sites, locationsById, query, reefStates, certFilters, seeFilters, regionFilters, freshFilter, monthFilters, sortKey, currentMonth, reefStateByLocationId]);

  const hasActiveFilter =
    reefStates.length > 0 ||
    certFilters.length > 0 ||
    seeFilters.length > 0 ||
    regionFilters.length > 0 ||
    freshFilter ||
    monthFilters.length > 0 ||
    query !== "";

  return (
    <>
      {/* ── Dark ink page header ─────────────────────────────────────────────── */}
      <header style={{ background: "#0b1e32", padding: "4rem 3rem 5rem" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#00d4ff",
              marginBottom: "1rem",
            }}
          >
            Catalogue
          </p>
          <h1
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.08,
              color: "#fff",
              marginBottom: "0.875rem",
            }}
          >
            All dive sites
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.45)",
              maxWidth: 480,
              marginBottom: "2rem",
            }}
          >
            Every curated site — filtered by what you want to see, not what&apos;s easiest to sell.
          </p>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 480 }}>
            <svg
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.35)",
                pointerEvents: "none",
              }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setParam("q", e.target.value || null)}
              placeholder="Search by site name, animal, or location…"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 999,
                padding: "0.75rem 1.25rem 0.75rem 2.75rem",
                fontSize: "0.9375rem",
                fontFamily: "inherit",
                color: "rgba(255,255,255,0.7)",
                outline: "none",
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Sticky filter strip ──────────────────────────────────────────────── */}
      <div
        style={{
          background: "#0a1628",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          padding: "1rem 3rem",
          position: "sticky",
          top: 62,
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            flexWrap: "wrap",
          }}
        >
          {/* Reef state chips — multi-select pills */}
          {REEF_STATES.map(({ value, label }) => {
            const isActive = reefStates.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleMultiParam("reef", value)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.9375rem",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
                  background: isActive ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#00d4ff" : "#8b9db8",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: isActive ? STATE_COLOR[value] : "#8b9db8",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {label}
              </button>
            );
          })}

          {/* What to see — grouped dropdown */}
          <FilterDropdown label="What to see" selectedCount={seeFilters.length}>
            {WHAT_TO_SEE_GROUPS.map((group) => (
              <ExpandableGroup
                key={group.groupLabel}
                groupLabel={group.groupLabel}
                items={group.items}
                selectedValues={seeFilters}
                onToggle={(v) => toggleMultiParam("see", v)}
              />
            ))}
          </FilterDropdown>

          {/* Region — grouped dropdown */}
          <FilterDropdown label="Region" selectedCount={regionFilters.length}>
            {REGION_GROUPS.map((group) => (
              <ExpandableGroup
                key={group.groupLabel}
                groupLabel={group.groupLabel}
                items={group.items}
                selectedValues={regionFilters}
                onToggle={(v) => toggleMultiParam("region", v)}
              />
            ))}
          </FilterDropdown>

          {/* When — multi-select months */}
          <FilterDropdown label="When" selectedCount={monthFilters.length}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.125rem", padding: "0.125rem" }}>
              {MONTH_LABELS.map((lbl, i) => {
                const m = i + 1;
                const isSelected = monthFilters.includes(m);
                const isCurrent = m === currentMonth;
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => toggleMultiParam("month", String(m))}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.75rem",
                      fontSize: "0.8125rem",
                      fontFamily: "inherit",
                      background: isSelected ? "rgba(0,212,255,0.12)" : "transparent",
                      color: isSelected ? "#00d4ff" : isCurrent ? "#a8d4ff" : "#f0f4f8",
                      fontWeight: isCurrent ? 600 : 400,
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "0.375rem",
                      textAlign: "left",
                    }}
                  >
                    <CheckBox checked={isSelected} />
                    {lbl}
                    {isCurrent && <span style={{ fontSize: "0.5625rem", color: "#00d4ff", marginLeft: "auto" }}>now</span>}
                  </button>
                );
              })}
            </div>
          </FilterDropdown>

          {/* Certification — multi-select */}
          <FilterDropdown label="Certification" selectedCount={certFilters.length}>
            {CERT_OPTIONS.map((o) => {
              const isSelected = certFilters.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleMultiParam("cert", o.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.45rem 0.875rem",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    background: isSelected ? "rgba(0,212,255,0.12)" : "transparent",
                    color: isSelected ? "#00d4ff" : "#f0f4f8",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "0.375rem",
                  }}
                >
                  <CheckBox checked={isSelected} />
                  {o.label}
                </button>
              );
            })}
          </FilterDropdown>

          {/* Needs fresh eyes chip */}
          <button
            type="button"
            onClick={() => setParam("fresh", freshFilter ? null : "1")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.9375rem",
              borderRadius: 999,
              border: `1px solid ${freshFilter ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
              background: freshFilter ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)",
              fontSize: "0.8125rem",
              fontWeight: freshFilter ? 600 : 500,
              color: freshFilter ? "#00d4ff" : "#8b9db8",
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            Needs fresh eyes
          </button>
        </div>
      </div>

      {/* ── Active filter summary bar ────────────────────────────────────────── */}
      {hasActiveFilter && (
        <div
          style={{
            maxWidth: "100%",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            background: "#0a1628",
            padding: "0.625rem 3rem",
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "#8b9db8" }}>{filtered.length} sites</span>

            {reefStates.map((rs) => (
              <ActivePill key={rs} label={STATE_TEXT[rs]} onRemove={() => toggleMultiParam("reef", rs)} />
            ))}
            {seeFilters.map((f) => (
              <ActivePill key={f} label={getSeeLabel(f)} onRemove={() => toggleMultiParam("see", f)} />
            ))}
            {regionFilters.map((f) => (
              <ActivePill key={f} label={getRegionLabel(f)} onRemove={() => toggleMultiParam("region", f)} />
            ))}
            {monthFilters.map((m) => (
              <ActivePill key={m} label={MONTH_LABELS[m - 1]} onRemove={() => toggleMultiParam("month", String(m))} />
            ))}
            {certFilters.map((c) => (
              <ActivePill key={c} label={CERT_OPTIONS.find((o) => o.value === c)?.label ?? c} onRemove={() => toggleMultiParam("cert", c)} />
            ))}
            {freshFilter && (
              <ActivePill label="Fresh eyes" onRemove={() => setParam("fresh", null)} />
            )}
            {query && (
              <ActivePill label={`"${query}"`} onRemove={() => setParam("q", null)} />
            )}

            <button
              type="button"
              onClick={clearAll}
              style={{
                marginLeft: "auto",
                fontSize: "0.75rem",
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* ── Grid header: count + sort + view toggle ─────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: "0 auto" }} className="px-5 pt-7 sm:px-8 lg:px-12">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.0625rem", fontWeight: 700, color: "#f0f4f8" }}>
            {filtered.length} reefs
          </span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", color: "#8b9db8" }}>
              Sort
              <select
                value={sortKey}
                onChange={(e) => setParam("sort", e.target.value === "season" ? null : e.target.value)}
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.5rem",
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.8125rem",
                  fontFamily: "inherit",
                  background: "#0a1628",
                  color: "#f0f4f8",
                  cursor: "pointer",
                }}
              >
                <option value="season">Best season</option>
                <option value="oldest-survey">Oldest surveys</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div
              style={{
                display: "inline-flex",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
            >
              {(["cards", "map"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setParam("view", v === "cards" ? null : v)}
                  style={{
                    padding: "0.35rem 0.875rem",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    border: "none",
                    background: viewMode === v ? "#00d4ff" : "rgba(255,255,255,0.05)",
                    color: viewMode === v ? "#030712" : "#8b9db8",
                    textTransform: "capitalize",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Map / Globe view ─────────────────────────────────────────────────── */}
      {viewMode === "map" && (
        <div style={{ maxWidth: 1320, margin: "0 auto" }} className="px-5 sm:px-8 lg:px-12">
          <SitesGlobe
            sites={filtered}
            locationsById={locationsById}
            reefStateByLocationId={reefStateByLocationId}
          />
        </div>
      )}

      {/* ── Card grid ────────────────────────────────────────────────────────── */}
      <div
        style={{ maxWidth: 1320, margin: "0 auto", display: viewMode === "cards" ? undefined : "none" }}
        className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8"
      >
        {filtered.length === 0 ? (
          <div
            style={{
              borderRadius: "0.75rem",
              border: "1px dashed rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)",
              padding: "3rem 1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#aebcd0" }}>
              No matches.
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.9375rem", color: "#8b9db8" }}>
              Try clearing a filter or broadening the search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6">
            {filtered.map((site, idx) => (
              <SiteCard
                key={site.id}
                site={site}
                location={locationsById[site.locationId] ?? null}
                inSeason={site.bestMonths.includes(monthFilters.length > 0 ? monthFilters[0] : currentMonth)}
                reefState={reefStateByLocationId[site.locationId]}
                gradientIndex={idx % OCEAN_GRADIENTS.length}
                currentMonth={currentMonth}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── SiteCard ─────────────────────────────────────────────────────────────────

function SiteCard({
  site,
  location,
  inSeason,
  reefState,
  gradientIndex,
  currentMonth,
}: {
  site: Site;
  location?: Location | null;
  inSeason: boolean;
  reefState: ReefState;
  gradientIndex: number;
  currentMonth: number;
}) {
  const sighting = getHeadlineSightingForSite(site.id);
  const badgeStyle = REEF_STATE_BADGE[reefState];
  const locationLabel = [location?.name, location?.country]
    .filter(Boolean)
    .join(" · ");

  const skillLabel =
    SKILL_LABEL[site.skillLevel] ?? site.skillLevel.replace("-", " ") + "+";

  const depthChip = `${site.depthRange.min}–${site.depthRange.max} m`;

  const diveTypeChip = site.diveTypes
    .slice(0, 1)
    .map((t) => t.replace("-", " "))
    .join("");

  const currentStrength =
    site.conditionsByMonth.find((c) => c.month === currentMonth)
      ?.currentStrength ??
    site.conditionsByMonth[0]?.currentStrength ??
    null;

  const gradient = OCEAN_GRADIENTS[gradientIndex];

  const sightDotColor =
    sighting?.confidence === "high"
      ? "#10b981"
      : sighting?.confidence === "medium"
        ? "#00d4ff"
        : "#8b9db8";

  return (
    <Link
      href={`/sites/${site.slug}`}
      style={{
        borderRadius: "1.25rem",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0a1628",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        boxShadow:
          "0 1px 2px rgba(16,40,70,.03), 0 8px 24px -12px rgba(16,40,70,.09)",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
      }}
      className="site-card-link"
    >
      {/* Image area */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: gradient,
            transition: "transform 0.5s",
          }}
          className="site-card-img"
        />
        {site.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.heroImageUrl}
            alt={site.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s",
            }}
            className="site-card-img"
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(95deg,transparent 0,transparent 50px,rgba(0,160,220,.03) 50px,rgba(0,160,220,.03) 52px)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top,rgba(4,20,40,.5) 0%,transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "0.875rem",
            left: "0.875rem",
            display: "flex",
            gap: "0.375rem",
            zIndex: 2,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.625rem",
              fontWeight: 700,
              padding: "0.275rem 0.625rem",
              borderRadius: 999,
              backdropFilter: "blur(8px)",
              background: badgeStyle.bg,
              color: badgeStyle.color,
              border: badgeStyle.border,
            }}
          >
            {STATE_TEXT[reefState]}
          </span>
          {inSeason && (
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                padding: "0.275rem 0.625rem",
                borderRadius: 999,
                backdropFilter: "blur(8px)",
                background: "rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              In season
            </span>
          )}
        </div>
        <span
          style={{
            position: "absolute",
            bottom: "0.875rem",
            right: "0.875rem",
            fontSize: "0.5875rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "0.275rem 0.65rem",
            borderRadius: 999,
            background: "rgba(0,0,0,0.42)",
            color: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255,255,255,0.10)",
            zIndex: 2,
          }}
        >
          {skillLabel}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: "1.25rem 1.375rem 1.375rem",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <p
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#8b9db8",
            marginBottom: "0.3rem",
          }}
        >
          {locationLabel || "—"}
        </p>
        <h3
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "#f0f4f8",
            marginBottom: "0.5rem",
            transition: "color 0.15s",
          }}
          className="site-card-name"
        >
          {site.name}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            lineHeight: 1.65,
            color: "#aebcd0",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {site.description}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            marginTop: "0.75rem",
            fontSize: "0.6875rem",
            color: "#8b9db8",
          }}
        >
          {sighting ? (
            <>
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: sightDotColor,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {sighting.speciesCommon} · confirmed {formatLastConfirmed(sighting.lastConfirmedAt)}
            </>
          ) : (
            <EvidenceDot
              confidence={null}
              showTooltip
              className="text-xs leading-5 text-[#8b9db8]"
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            marginTop: "0.875rem",
            paddingTop: "0.875rem",
            borderTop: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              fontSize: "0.5875rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              color: "#8b9db8",
            }}
          >
            {depthChip}
          </span>
          {diveTypeChip && (
            <span
              style={{
                fontSize: "0.5875rem",
                fontWeight: 600,
                padding: "0.2rem 0.55rem",
                borderRadius: 999,
                background: "rgba(0,212,255,0.12)",
                color: "#00d4ff",
                textTransform: "capitalize",
              }}
            >
              {diveTypeChip}
            </span>
          )}
          {currentStrength && currentStrength !== "none" && (
            <span
              style={{
                fontSize: "0.5875rem",
                fontWeight: 600,
                padding: "0.2rem 0.55rem",
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                color: "#8b9db8",
                textTransform: "capitalize",
              }}
            >
              Current: {currentStrength}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  selectedCount,
  children,
}: {
  label: string;
  selectedCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const isActive = selectedCount > 0;

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.45rem 0.9375rem",
          borderRadius: 999,
          border: `1px solid ${isActive || open ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
          background: isActive || open ? "rgba(0,212,255,0.12)" : "rgba(255,255,255,0.05)",
          fontSize: "0.8125rem",
          fontWeight: isActive ? 600 : 500,
          color: isActive || open ? "#00d4ff" : "#8b9db8",
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          transition: "all 0.15s",
        }}
      >
        {label}
        {isActive && (
          <span
            style={{
              fontSize: "0.625rem",
              background: "#00d4ff",
              color: "#030712",
              borderRadius: 999,
              padding: "0.1rem 0.45rem",
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {selectedCount}
          </span>
        )}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          style={{
            opacity: 0.5,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M2 3.5L5 6.5L8 3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.375rem)",
            left: 0,
            zIndex: 50,
            background: "#0a1628",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "0.625rem",
            boxShadow: "0 4px 24px -4px rgba(0,0,0,0.5)",
            padding: "0.375rem",
            minWidth: 220,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ExpandableGroup ──────────────────────────────────────────────────────────

function ExpandableGroup({
  groupLabel,
  items,
  selectedValues,
  onToggle,
}: {
  groupLabel: string;
  items: { value: string; label: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedInGroup = items.filter((i) => selectedValues.includes(i.value)).length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
          textAlign: "left",
          padding: "0.45rem 0.875rem",
          fontSize: "0.8125rem",
          fontWeight: 600,
          fontFamily: "inherit",
          background: selectedInGroup > 0 ? "rgba(0,212,255,0.06)" : "transparent",
          color: selectedInGroup > 0 ? "#00d4ff" : "#aebcd0",
          border: "none",
          cursor: "pointer",
          borderRadius: "0.375rem",
        }}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          style={{
            flexShrink: 0,
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <path
            d="M2 1.5L5.5 4L2 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {groupLabel}
        {selectedInGroup > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.625rem",
              background: "rgba(0,212,255,0.2)",
              color: "#00d4ff",
              padding: "0.1rem 0.45rem",
              borderRadius: 999,
              fontWeight: 700,
              lineHeight: 1.4,
            }}
          >
            {selectedInGroup}
          </span>
        )}
      </button>

      {expanded && (
        <div style={{ paddingBottom: "0.25rem" }}>
          {items.map((item) => {
            const isSelected = selectedValues.includes(item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.value);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  textAlign: "left",
                  paddingLeft: "1.875rem",
                  paddingRight: "0.875rem",
                  paddingTop: "0.375rem",
                  paddingBottom: "0.375rem",
                  fontSize: "0.8125rem",
                  fontFamily: "inherit",
                  background: isSelected ? "rgba(0,212,255,0.1)" : "transparent",
                  color: isSelected ? "#00d4ff" : "#f0f4f8",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "0.375rem",
                }}
              >
                <CheckBox checked={isSelected} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── CheckBox ─────────────────────────────────────────────────────────────────

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1.5px solid ${checked ? "#00d4ff" : "rgba(255,255,255,0.25)"}`,
        background: checked ? "#00d4ff" : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.1s, border-color 0.1s",
      }}
    >
      {checked && (
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
          <path
            d="M1 4l2 2 4-4"
            stroke="#030712"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

// ─── ActivePill ───────────────────────────────────────────────────────────────

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.2rem 0.5rem 0.2rem 0.625rem",
        borderRadius: 999,
        background: "rgba(0,212,255,0.1)",
        border: "1px solid rgba(0,212,255,0.22)",
        fontSize: "0.75rem",
        color: "#00d4ff",
        fontWeight: 500,
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: "#00d4ff",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          fontSize: "0.875rem",
          opacity: 0.6,
          fontFamily: "inherit",
        }}
      >
        ×
      </button>
    </span>
  );
}
