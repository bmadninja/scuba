"use client";

import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STATE_TEXT, STATE_COLOR, freshness } from "@/lib/data/reef-state";
import { LocationsGlobe } from "@/components/locations-globe";
import { ReefCard } from "@/components/reef-card";
import { FilterPill } from "@/components/filter-pill";
import type { ReefState } from "@/lib/data/reef-state";
import type { ReefCardLocation } from "@/components/reef-card";

// ─── types ────────────────────────────────────────────────────────────────────

export type ExploreLocation = ReefCardLocation & {
  hook: string;
  skill: string;
  lastSurveyDays: number | null;
  animalTags: string[];
  diveTypeTags: string[];
  maxCurrentStrength: "none" | "mild" | "moderate" | "strong";
  lat: number;
  lng: number;
};

type Props = {
  locations: ExploreLocation[];
  currentMonth: number;
};

// ─── constants ────────────────────────────────────────────────────────────────

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const REEF_STATES: { value: ReefState; label: string }[] = [
  { value: "thriving", label: "Improving" },
  { value: "pressure", label: "Stable" },
  { value: "change", label: "Declining" },
];

const REGION_BUCKETS = [
  { value: "Asia", label: "Asia" },
  { value: "Oceania", label: "Oceania" },
  { value: "Indian Ocean", label: "Indian Ocean" },
  { value: "Americas", label: "Americas" },
  { value: "Atlantic & Mediterranean", label: "Atlantic & Med" },
];

const DIVE_TYPE_OPTIONS = [
  { value: "coral", label: "Coral reef" },
  { value: "large-pelagics", label: "Pelagics" },
  { value: "wrecks", label: "Wrecks" },
  { value: "wall", label: "Wall" },
  { value: "drift", label: "Drift" },
  { value: "cave", label: "Cave" },
  { value: "macro", label: "Macro" },
  { value: "muck", label: "Muck" },
  { value: "night", label: "Night" },
];

const SKILL_OPTIONS = ["Beginner", "Open water", "Advanced", "Technical"];

const SKILL_RANK: Record<string, number> = {
  "Beginner": 0, "Open water": 1, "Advanced": 2, "Technical": 3,
};

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

// ─── URL param helpers ────────────────────────────────────────────────────────

function getMultiParam(
  params: ReturnType<typeof useSearchParams>,
  key: string,
): string[] {
  const val = params.get(key);
  if (!val) return [];
  return val.split(",").filter(Boolean);
}

// ─── main component ───────────────────────────────────────────────────────────

export function ExplorePage({ locations, currentMonth }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Draft filters used only inside the mobile sheet (applied on "Apply filters")
  const [draftReefStates, setDraftReefStates] = useState<ReefState[]>([]);
  const [draftRegions, setDraftRegions] = useState<string[]>([]);
  const [draftMonths, setDraftMonths] = useState<number[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLAnchorElement | null>>(new Map());
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Active filters from URL
  const reefStates = getMultiParam(params, "reef") as ReefState[];
  const regionFilters = getMultiParam(params, "region");
  const monthFilters = getMultiParam(params, "month")
    .map(Number)
    .filter((n) => n >= 1 && n <= 12);
  const diveTypeFilters = getMultiParam(params, "divetype");
  const skillFilters = getMultiParam(params, "skill");
  const freshOnly = params.get("fresh") === "1";

  const activeFilterCount =
    reefStates.length + regionFilters.length + monthFilters.length +
    diveTypeFilters.length + skillFilters.length + (freshOnly ? 1 : 0);
  const hasActiveFilter = activeFilterCount > 0;

  // Sync draft with URL params when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setDraftReefStates([...reefStates]);
      setDraftRegions([...regionFilters]);
      setDraftMonths([...monthFilters]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  // Escape key closes sheet or dropdown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (openDropdown) setOpenDropdown(null);
        else if (sheetOpen) setSheetOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen, openDropdown]);

  // Close dropdown when clicking outside filter bar
  useEffect(() => {
    if (!openDropdown) return;
    const onMouseDown = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [openDropdown]);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `/locations?${qs}` : "/locations", {
        scroll: false,
      });
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
      router.replace(qs ? `/locations?${qs}` : "/locations", {
        scroll: false,
      });
    },
    [params, router],
  );

  const clearAll = useCallback(() => {
    setOpenDropdown(null);
    router.replace("/locations", { scroll: false });
  }, [router]);

  const applyDraftFilters = useCallback(() => {
    const next = new URLSearchParams();
    if (draftReefStates.length > 0)
      next.set("reef", draftReefStates.join(","));
    if (draftRegions.length > 0) next.set("region", draftRegions.join(","));
    if (draftMonths.length > 0)
      next.set("month", draftMonths.map(String).join(","));
    const qs = next.toString();
    router.replace(qs ? `/locations?${qs}` : "/locations", { scroll: false });
    setSheetOpen(false);
  }, [draftReefStates, draftRegions, draftMonths, router]);

  const filtered = useMemo(() => {
    let result = locations.filter((loc) => {
      if (reefStates.length > 0 && !reefStates.includes(loc.state))
        return false;
      if (
        regionFilters.length > 0 &&
        !regionFilters.some(
          (f) => (REGION_BUCKET[loc.region] ?? "Other") === f,
        )
      )
        return false;
      if (
        monthFilters.length > 0 &&
        !monthFilters.some((m) => loc.bestMonths.includes(m))
      )
        return false;
      if (
        diveTypeFilters.length > 0 &&
        !diveTypeFilters.some((dt) => loc.diveTypeTags.includes(dt))
      )
        return false;
      if (skillFilters.length > 0) {
        const maxRank = Math.max(...skillFilters.map((s) => SKILL_RANK[s] ?? 0));
        if ((SKILL_RANK[loc.skill] ?? 0) > maxRank) return false;
      }
      if (freshOnly) {
        const k = loc.lastSurveyDays === null ? "none" : freshness(loc.lastSurveyDays).k;
        if (k === "fresh") return false;
      }
      return true;
    });

    // Default sort: in-season first, then alphabetical
    result = [...result].sort((a, b) => {
      const aIn = a.bestMonths.includes(currentMonth) ? 1 : 0;
      const bIn = b.bestMonths.includes(currentMonth) ? 1 : 0;
      if (bIn !== aIn) return bIn - aIn;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [locations, reefStates, regionFilters, monthFilters, diveTypeFilters, skillFilters, freshOnly, currentMonth]);

  // When a globe marker is clicked, select the card and scroll it into view
  const handleMarkerClick = useCallback((slug: string) => {
    setSelectedSlug(slug);
    const el = cardRefs.current.get(slug);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  const toggleDraft = <T,>(
    arr: T[],
    setArr: (v: T[]) => void,
    value: T,
  ) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  return (
    <div
      style={{
        background: "var(--color-paper)",
        minHeight: "100vh",
        color: "var(--color-ink)",
      }}
    >
      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "#0E1C28",
          padding: "4rem 1.5rem 3rem",
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <p
            style={{
              fontFamily: "var(--font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#4A5568",
              marginBottom: "1rem",
            }}
          >
            Explore
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif), \"Source Serif 4\", Georgia, serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "#FFFFFF",
              marginBottom: "0.75rem",
            }}
          >
            Discover reefs worth diving.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-sans), \"IBM Plex Sans\", system-ui, sans-serif",
              fontSize: "1rem",
              lineHeight: 1.65,
              color: "#4A5568",
              maxWidth: 480,
            }}
          >
            Every reef location — filtered by reef health, best season, and
            region. Real data. No guesses.
          </p>
        </div>
      </header>

      {/* ── Sticky filter bar (desktop) ─────────────────────────────────────── */}
      <div
        ref={filterBarRef}
        className="sticky z-40 hidden sm:block"
        style={{ top: 56, background: "#FFFFFF", borderBottom: "1px solid #E7E6E2" }}
      >
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch", maxWidth: 1320, margin: "0 auto" }}
        >
          {/* Reef state pills with colored dots */}
          {REEF_STATES.map(({ value, label }) => {
            const active = reefStates.includes(value);
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMultiParam("reef", value)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                style={{
                  border: active ? "1px solid rgba(14,28,40,0.45)" : "1px solid #E7E6E2",
                  background: active ? "rgba(14,28,40,0.06)" : "transparent",
                  color: active ? "#0E1C28" : "#4A5568",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: STATE_COLOR[value as ReefState] }}
                />
                {label}
              </button>
            );
          })}

          <span aria-hidden="true" className="shrink-0 h-5" style={{ width: 1, background: "rgba(14,28,40,0.06)" }} />

          {/* What to see dropdown */}
          {(["whatToSee", "region", "when", "certification"] as const).map((key) => {
            const labels: Record<string, string> = {
              whatToSee: "What to see",
              region: "Region",
              when: "When",
              certification: "Certification",
            };
            const counts: Record<string, number> = {
              whatToSee: diveTypeFilters.length,
              region: regionFilters.length,
              when: monthFilters.length,
              certification: skillFilters.length,
            };
            const count = counts[key];
            const isOpen = openDropdown === key;
            return (
              <button
                key={key}
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenDropdown(isOpen ? null : key)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                style={{
                  border: (isOpen || count > 0) ? "1px solid rgba(14,28,40,0.45)" : "1px solid #E7E6E2",
                  background: (isOpen || count > 0) ? "rgba(14,28,40,0.06)" : "transparent",
                  color: (isOpen || count > 0) ? "#0E1C28" : "#4A5568",
                  cursor: "pointer",
                }}
              >
                {labels[key]}
                {count > 0 && (
                  <span
                    className="flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-xs font-semibold leading-none"
                    style={{ background: "#0E4F6E", color: "#FFFFFF" }}
                  >
                    {count}
                  </span>
                )}
                <span aria-hidden="true" style={{ fontSize: "10px", lineHeight: 1 }}>{isOpen ? "▲" : "▾"}</span>
              </button>
            );
          })}

          <span aria-hidden="true" className="shrink-0 h-5" style={{ width: 1, background: "rgba(14,28,40,0.06)" }} />

          {/* Needs fresh eyes toggle */}
          <button
            type="button"
            aria-pressed={freshOnly}
            onClick={() => setParam("fresh", freshOnly ? null : "1")}
            className="inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            style={{
              border: freshOnly ? "1px solid rgba(14,28,40,0.45)" : "1px solid #E7E6E2",
              background: freshOnly ? "rgba(14,28,40,0.06)" : "transparent",
              color: freshOnly ? "#0E1C28" : "#4A5568",
              cursor: "pointer",
            }}
          >
            Needs fresh eyes
          </button>

          {/* Clear all */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto shrink-0 whitespace-nowrap text-sm underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
              style={{ color: "#0E4F6E" }}
            >
              Clear all
            </button>
          )}
        </div>

        {/* Dropdown panels */}
        {openDropdown && (
          <div
            className="border-t border-white/10 px-4 py-4"
            style={{ maxWidth: 1320, margin: "0 auto" }}
          >
            {openDropdown === "whatToSee" && (
              <div className="flex flex-wrap gap-2">
                {DIVE_TYPE_OPTIONS.map(({ value, label }) => {
                  const active = diveTypeFilters.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMultiParam("divetype", value)}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                      style={{
                        border: active ? "1px solid #0E4F6E" : "1px solid #E7E6E2",
                        background: active ? "rgba(0,212,255,0.12)" : "#F8F7F4",
                        color: active ? "#0E4F6E" : "#4A5568",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {openDropdown === "region" && (
              <div className="flex flex-wrap gap-2">
                {REGION_BUCKETS.map(({ value, label }) => {
                  const active = regionFilters.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMultiParam("region", value)}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                      style={{
                        border: active ? "1px solid #0E4F6E" : "1px solid #E7E6E2",
                        background: active ? "rgba(0,212,255,0.12)" : "#F8F7F4",
                        color: active ? "#0E4F6E" : "#4A5568",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {openDropdown === "when" && (
              <div className="flex flex-wrap gap-2">
                {MONTH_LABELS.map((lbl, i) => {
                  const m = i + 1;
                  const active = monthFilters.includes(m);
                  return (
                    <button
                      key={lbl}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMultiParam("month", String(m))}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                      style={{
                        border: active ? "1px solid #0E4F6E" : "1px solid #E7E6E2",
                        background: active ? "rgba(0,212,255,0.12)" : "#F8F7F4",
                        color: active ? "#0E4F6E" : "#4A5568",
                        cursor: "pointer",
                      }}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            )}
            {openDropdown === "certification" && (
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map((s) => {
                  const active = skillFilters.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleMultiParam("skill", s)}
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                      style={{
                        border: active ? "1px solid #0E4F6E" : "1px solid #E7E6E2",
                        background: active ? "rgba(0,212,255,0.12)" : "#F8F7F4",
                        color: active ? "#0E4F6E" : "#4A5568",
                        cursor: "pointer",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Active filter strip (mobile, shown in filter bar when active) ─────── */}
      {/* On mobile the filter bar is replaced by the bottom "Filter (N)" button.
          When filters are active we show a minimal read-only strip. */}
      {hasActiveFilter && (
        <div
          className="flex items-center gap-2 overflow-x-auto border-b border-[#E7E6E2] bg-white px-4 py-2 sm:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {reefStates.map((rs) => (
            <span
              key={rs}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#0E1C28] px-3 py-1 text-xs text-white"
            >
              {STATE_TEXT[rs]}
            </span>
          ))}
          {regionFilters.map((r) => (
            <span
              key={r}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#0E1C28] px-3 py-1 text-xs text-white"
            >
              {r}
            </span>
          ))}
          {monthFilters.map((m) => (
            <span
              key={m}
              className="flex shrink-0 items-center gap-1 rounded-full bg-[#0E1C28] px-3 py-1 text-xs text-white"
            >
              {MONTH_LABELS[m - 1]}
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto shrink-0 text-xs text-[#0E4F6E] underline focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── Count bar ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "1rem 1rem 0.5rem",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
            fontSize: "11px",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-ink-2)",
          }}
        >
          {filtered.length} location{filtered.length !== 1 ? "s" : ""}
          {hasActiveFilter && " matching filters"}
        </p>
      </div>

      {/* ── Main layout: map (desktop left) + card grid (right) ──────────────── */}
      <div
        style={{ maxWidth: 1320, margin: "0 auto", padding: "0 0 4rem" }}
      >
        {/* Desktop: side-by-side. Mobile: card grid only. */}
        <div className="lg:flex lg:items-start">
          {/* Map — sticky on desktop, hidden on mobile */}
          <div
            className="hidden lg:block lg:sticky"
            style={{
              top: 56 + 49, // nav height + filter bar height
              width: "42%",
              flexShrink: 0,
              height: "calc(100vh - 56px - 49px)",
              overflow: "hidden",
            }}
          >
            <LocationsGlobe
              locations={filtered.map((l) => ({
                slug: l.slug,
                name: l.name,
                state: l.state,
                lat: l.lat,
                lng: l.lng,
              }))}
              onMarkerClick={handleMarkerClick}
            />
          </div>

          {/* Card grid */}
          <div
            className="px-4 py-4 lg:py-6 lg:px-6"
            style={{ flex: 1, minWidth: 0 }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  borderRadius: "8px",
                  border: "1px dashed #E7E6E2",
                  background: "rgba(14,28,40,0.03)",
                  padding: "3rem 1.5rem",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 500,
                    color: "var(--color-ink)",
                    marginBottom: "0.25rem",
                  }}
                >
                  No matches.
                </p>
                <p style={{ fontSize: "0.9375rem", color: "var(--color-ink-2)" }}>
                  Try clearing a filter or broadening the search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((loc) => (
                  <ReefCard
                    key={loc.slug}
                    location={loc}
                    selected={selectedSlug === loc.slug}
                    cardRef={(el) => {
                      cardRefs.current.set(loc.slug, el);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile: sticky "Filter (N)" button at bottom ─────────────────────── */}
      <div
        className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 sm:hidden"
        style={{ pointerEvents: "auto" }}
      >
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-full px-5 text-sm font-medium shadow-[0_8px_40px_rgba(14,28,40,0.18)] focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
          style={{
            background: activeFilterCount > 0 ? "#0E1C28" : "#FFFFFF",
            color: activeFilterCount > 0 ? "#FFFFFF" : "#0E1C28",
            border:
              activeFilterCount > 0
                ? "1px solid #0E1C28"
                : "1px solid #E7E6E2",
          }}
        >
          Filter
          {activeFilterCount > 0 && (
            <span
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-semibold"
              style={{ background: "#F6C700", color: "#0E1C28" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile filter sheet ───────────────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-[60] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(14,28,40,0.5)" }}
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[88vh] flex-col"
            style={{
              background: "#FFFFFF",
              borderRadius: "16px 16px 0 0",
              boxShadow: "0 -8px 40px rgba(14,28,40,0.12)",
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  background: "#E7E6E2",
                }}
              />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between border-b border-[#E7E6E2] px-5 py-3"
            >
              <span
                style={{
                  fontFamily: "var(--font-serif), \"Source Serif 4\", Georgia, serif",
                  fontSize: "1.125rem",
                  fontWeight: 400,
                  color: "var(--color-ink)",
                }}
              >
                Filter reefs
              </span>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#4A5568] focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                aria-label="Close filters"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.25rem" }}
              >
                &#x2715;
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Reef state */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-ink-2)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Reef state
                </h2>
                <div className="flex flex-wrap gap-2">
                  {REEF_STATES.map(({ value, label }) => (
                    <FilterPill
                      key={value}
                      label={label}
                      active={draftReefStates.includes(value)}
                      onClick={() =>
                        toggleDraft(
                          draftReefStates,
                          setDraftReefStates as (v: ReefState[]) => void,
                          value,
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              {/* Region */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-ink-2)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Region
                </h2>
                <div className="flex flex-wrap gap-2">
                  {REGION_BUCKETS.map(({ value, label }) => (
                    <FilterPill
                      key={value}
                      label={label}
                      active={draftRegions.includes(value)}
                      onClick={() =>
                        toggleDraft(draftRegions, setDraftRegions, value)
                      }
                    />
                  ))}
                </div>
              </section>

              {/* Best season month */}
              <section>
                <h2
                  style={{
                    fontFamily: "var(--font-mono), \"IBM Plex Mono\", ui-monospace, monospace",
                    fontSize: "11px",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-ink-2)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Best season
                </h2>
                <div className="flex flex-wrap gap-2">
                  {MONTH_LABELS.map((lbl, i) => {
                    const m = i + 1;
                    return (
                      <FilterPill
                        key={lbl}
                        label={lbl}
                        active={draftMonths.includes(m)}
                        onClick={() =>
                          toggleDraft(draftMonths, setDraftMonths, m)
                        }
                      />
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div
              className="border-t border-[#E7E6E2] px-5 py-4 space-y-2"
            >
              <button
                type="button"
                onClick={applyDraftFilters}
                className="flex h-12 w-full items-center justify-center rounded-sm text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
                style={{
                  background: "#F6C700",
                  color: "#0E1C28",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
