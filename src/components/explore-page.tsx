"use client";

import {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { STATE_TEXT, STATE_COLOR } from "@/lib/data/reef-state";
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
  { value: "thriving", label: "Thriving" },
  { value: "pressure", label: "Under pressure" },
  { value: "change", label: "Witnessing change" },
];

const REGION_BUCKETS = [
  { value: "Asia", label: "Asia" },
  { value: "Oceania", label: "Oceania" },
  { value: "Indian Ocean", label: "Indian Ocean" },
  { value: "Americas", label: "Americas" },
  { value: "Atlantic & Mediterranean", label: "Atlantic & Med" },
];

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
  // Draft filters used only inside the mobile sheet (applied on "Apply filters")
  const [draftReefStates, setDraftReefStates] = useState<ReefState[]>([]);
  const [draftRegions, setDraftRegions] = useState<string[]>([]);
  const [draftMonths, setDraftMonths] = useState<number[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLAnchorElement | null>>(new Map());

  // Active filters from URL
  const reefStates = getMultiParam(params, "reef") as ReefState[];
  const regionFilters = getMultiParam(params, "region");
  const monthFilters = getMultiParam(params, "month")
    .map(Number)
    .filter((n) => n >= 1 && n <= 12);

  const activeFilterCount =
    reefStates.length + regionFilters.length + monthFilters.length;
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

  // Escape key closes sheet
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

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
  }, [locations, reefStates, regionFilters, monthFilters, currentMonth]);

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
              color: "rgba(255,255,255,0.5)",
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
              color: "rgba(255,255,255,0.55)",
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
        className="sticky z-40 hidden border-b border-[#E7E6E2] bg-white sm:block"
        style={{ top: 56 }}
      >
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3"
          style={{ WebkitOverflowScrolling: "touch", maxWidth: 1320, margin: "0 auto" }}
        >
          {/* Reef state pills */}
          {REEF_STATES.map(({ value, label }) => (
            <FilterPill
              key={value}
              label={label}
              active={reefStates.includes(value)}
              onClick={() => toggleMultiParam("reef", value)}
            />
          ))}

          <span
            aria-hidden="true"
            className="shrink-0"
            style={{ width: 1, height: 20, background: "#E7E6E2" }}
          />

          {/* Region pills */}
          {REGION_BUCKETS.map(({ value, label }) => (
            <FilterPill
              key={value}
              label={label}
              active={regionFilters.includes(value)}
              onClick={() => toggleMultiParam("region", value)}
            />
          ))}

          <span
            aria-hidden="true"
            className="shrink-0"
            style={{ width: 1, height: 20, background: "#E7E6E2" }}
          />

          {/* Month pills */}
          {MONTH_LABELS.map((lbl, i) => {
            const m = i + 1;
            return (
              <FilterPill
                key={lbl}
                label={lbl}
                active={monthFilters.includes(m)}
                onClick={() => toggleMultiParam("month", String(m))}
              />
            );
          })}

          {/* Clear all */}
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="ml-auto shrink-0 whitespace-nowrap text-sm text-[#0E4F6E] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
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
