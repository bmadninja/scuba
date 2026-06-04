"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getReefState, STATE_TEXT, STATE_COLOR } from "@/lib/data/reef-state";
import { getHeadlineSightingForSite, formatLastConfirmed } from "@/lib/data/sightings";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { EvidenceDot } from "@/components/evidence-dot";
import type { Location, Site, SkillLevel } from "@/lib/data/types";
import type { ReefState } from "@/lib/data/reef-state";

// ─── types ────────────────────────────────────────────────────────────────────

type Props = {
  sites: Site[];
  locationsById: Record<string, Location>;
  currentMonth: number;
};

type SortKey = "season" | "oldest-survey" | "name";

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
  { value: "open-water", label: "Open Water" },
  { value: "advanced", label: "Advanced" },
  { value: "rescue", label: "Rescue" },
  { value: "divemaster", label: "Divemaster+" },
  { value: "tech", label: "Tech" },
];

const DIVE_TYPE_OPTIONS = [
  { value: "large-pelagics", label: "Large pelagics" },
  { value: "coral", label: "Coral" },
  { value: "macro", label: "Macro" },
  { value: "wrecks", label: "Wrecks" },
  { value: "geology", label: "Geology" },
  { value: "blackwater", label: "Blackwater" },
];

/** Reef state config — ordered as in the mockup strip */
const REEF_STATES: { value: ReefState; label: string }[] = [
  { value: "thriving", label: "Thriving" },
  { value: "pressure", label: "Under pressure" },
  { value: "change", label: "Witnessing change" },
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
    bg: "rgba(0,137,222,0.16)",
    color: "#93c5fd",
    border: "1px solid rgba(0,137,222,0.25)",
  },
  change: {
    bg: "rgba(244,63,94,0.14)",
    color: "#fca5a5",
    border: "1px solid rgba(244,63,94,0.2)",
  },
};

/** Active filter summary bar pill styles (light, on white) */
const REEF_STATE_SUMMARY_PILL: Record<
  ReefState,
  { bg: string; color: string; border: string; dot: string }
> = {
  thriving: {
    bg: "#e7f6ee",
    color: "#15824c",
    border: "1px solid rgba(16,185,129,0.2)",
    dot: "#10b981",
  },
  pressure: {
    bg: "#e8f0fe",
    color: "#1d5d90",
    border: "1px solid rgba(0,137,222,0.2)",
    dot: "#0089de",
  },
  change: {
    bg: "#fde8ec",
    color: "#9f1239",
    border: "1px solid rgba(244,63,94,0.2)",
    dot: "#f43f5e",
  },
};

// ─── main component ───────────────────────────────────────────────────────────

export function SitesExplorer({ sites, locationsById, currentMonth }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  // ── read params ──────────────────────────────────────────────────────────────
  const query = params.get("q") ?? "";
  const reefState = (params.get("reef") as ReefState | null) ?? null;
  const certFilter = (params.get("cert") as SkillLevel | null) ?? null;
  const diveTypeFilter = params.get("type") ?? null;
  const monthFilter = params.get("month") ? Number(params.get("month")) : null;
  const sortKey = (params.get("sort") as SortKey | null) ?? "season";

  // ── helpers ──────────────────────────────────────────────────────────────────
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

  const clearAll = () => router.replace("/sites", { scroll: false });

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
      if (reefState && reefStateByLocationId[s.locationId] !== reefState) return false;
      if (certFilter && SKILL_RANK[s.skillLevel] > SKILL_RANK[certFilter]) return false;
      if (diveTypeFilter && !s.diveTypes.includes(diveTypeFilter as never)) return false;
      if (monthFilter && !s.bestMonths.includes(monthFilter)) return false;
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
      // "season" — in-season first, then editorial rank
      result = [...result].sort((a, b) => {
        const aIn = a.bestMonths.includes(currentMonth) ? 1 : 0;
        const bIn = b.bestMonths.includes(currentMonth) ? 1 : 0;
        if (bIn !== aIn) return bIn - aIn;
        return b.editorialRank - a.editorialRank;
      });
    }

    return result;
  }, [sites, locationsById, query, reefState, certFilter, diveTypeFilter, monthFilter, sortKey, currentMonth, reefStateByLocationId]);

  // ── active filter summary ─────────────────────────────────────────────────────
  const hasActiveFilter =
    reefState !== null ||
    certFilter !== null ||
    diveTypeFilter !== null ||
    monthFilter !== null ||
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
              color: "#0089de",
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
              fontFamily: "'Source Serif 4', Georgia, serif",
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

          {/* Search — pill dark glass */}
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
          background: "#f1f7fb",
          borderBottom: "1px solid #e2e8f0",
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
          {/* Reef state chips */}
          {REEF_STATES.map(({ value, label }) => {
            const isActive = reefState === value;
            const dotColor = isActive ? STATE_COLOR[value] : "#cbd5e1";
            return (
              <button
                key={value}
                type="button"
                onClick={() => setParam("reef", isActive ? null : value)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.45rem 0.9375rem",
                  borderRadius: 999,
                  border: `1px solid ${isActive ? "transparent" : "#e2e8f0"}`,
                  background: isActive ? "#e8f0fe" : isActive ? "#fff" : "#f8fafc",
                  fontSize: "0.8125rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#1d5d90" : "#94a3b8",
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
                    background: dotColor,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {label}
              </button>
            );
          })}

          {/* Cert dropdown chip */}
          <FilterDropdownChip
            label="Certification"
            active={certFilter !== null}
            onClear={() => setParam("cert", null)}
          >
            {CERT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setParam("cert", certFilter === o.value ? null : o.value)}
                className={certFilter === o.value ? "active" : ""}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.45rem 0.875rem",
                  fontSize: "0.8125rem",
                  fontFamily: "inherit",
                  background: certFilter === o.value ? "#e8f0fe" : "transparent",
                  color: certFilter === o.value ? "#1d5d90" : "#0f172a",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "0.375rem",
                }}
              >
                {o.label}
              </button>
            ))}
          </FilterDropdownChip>

          {/* Dive type dropdown chip */}
          <FilterDropdownChip
            label="Dive type"
            active={diveTypeFilter !== null}
            onClear={() => setParam("type", null)}
          >
            {DIVE_TYPE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setParam("type", diveTypeFilter === o.value ? null : o.value)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.45rem 0.875rem",
                  fontSize: "0.8125rem",
                  fontFamily: "inherit",
                  background: diveTypeFilter === o.value ? "#e8f0fe" : "transparent",
                  color: diveTypeFilter === o.value ? "#1d5d90" : "#0f172a",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: "0.375rem",
                }}
              >
                {o.label}
              </button>
            ))}
          </FilterDropdownChip>

          {/* Month dropdown chip */}
          <FilterDropdownChip
            label="Month"
            active={monthFilter !== null}
            onClear={() => setParam("month", null)}
          >
            {MONTH_LABELS.map((lbl, i) => {
              const m = i + 1;
              return (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setParam("month", monthFilter === m ? null : String(m))}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.45rem 0.875rem",
                    fontSize: "0.8125rem",
                    fontFamily: "inherit",
                    background: monthFilter === m ? "#e8f0fe" : "transparent",
                    color: monthFilter === m ? "#1d5d90" : m === currentMonth ? "#0089de" : "#0f172a",
                    fontWeight: m === currentMonth ? 600 : 400,
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "0.375rem",
                  }}
                >
                  {lbl}{m === currentMonth ? " ·" : ""}
                </button>
              );
            })}
          </FilterDropdownChip>

          {/* Sort */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.8125rem",
              color: "#64748b",
            }}
          >
            Sort{" "}
            <select
              value={sortKey}
              onChange={(e) => setParam("sort", e.target.value === "season" ? null : e.target.value)}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.4rem 0.75rem",
                fontSize: "0.8125rem",
                fontFamily: "inherit",
                background: "#fff",
                color: "#0f172a",
                cursor: "pointer",
              }}
            >
              <option value="season">In season now</option>
              <option value="oldest-survey">Oldest surveys</option>
              <option value="name">Name</option>
            </select>
          </div>

          {/* Result count */}
          <span
            style={{
              fontSize: "0.8125rem",
              color: "#64748b",
              whiteSpace: "nowrap",
              paddingLeft: "0.5rem",
            }}
          >
            <strong style={{ color: "#0f172a" }}>{filtered.length}</strong> sites
          </span>
        </div>
      </div>

      {/* ── Active filter summary bar ────────────────────────────────────────── */}
      {hasActiveFilter && (
        <div
          style={{
            maxWidth: "100%",
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            padding: "0.875rem 3rem",
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>Showing</span>

            {/* Reef state pill */}
            {reefState && (() => {
              const s = REEF_STATE_SUMMARY_PILL[reefState];
              return (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: 999,
                    background: s.bg,
                    border: s.border,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: s.color,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: s.dot,
                      display: "inline-block",
                    }}
                  />
                  {STATE_TEXT[reefState]}
                </span>
              );
            })()}

            {/* Other active filters */}
            {certFilter && (
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                {CERT_OPTIONS.find((o) => o.value === certFilter)?.label}
              </span>
            )}
            {diveTypeFilter && (
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                {DIVE_TYPE_OPTIONS.find((o) => o.value === diveTypeFilter)?.label}
              </span>
            )}
            {monthFilter && (
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                {MONTH_LABELS[monthFilter - 1]}
              </span>
            )}
            {query && (
              <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                &ldquo;{query}&rdquo;
              </span>
            )}

            <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
              only · {filtered.length} sites
            </span>

            <button
              type="button"
              onClick={clearAll}
              style={{
                marginLeft: "auto",
                fontSize: "0.8125rem",
                color: "#64748b",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Clear filter ×
            </button>
          </div>
        </div>
      )}

      {/* ── Card grid ────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "3rem" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              borderRadius: "0.75rem",
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
              padding: "3rem 1.5rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#334155" }}>
              No matches.
            </p>
            <p style={{ marginTop: "0.25rem", fontSize: "0.9375rem", color: "#64748b" }}>
              Try clearing a filter or broadening the search.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
            }}
          >
            {filtered.map((site, idx) => (
              <SiteCard
                key={site.id}
                site={site}
                location={locationsById[site.locationId] ?? null}
                inSeason={site.bestMonths.includes(monthFilter ?? currentMonth)}
                reefState={reefStateByLocationId[site.locationId]}
                gradientIndex={idx % OCEAN_GRADIENTS.length}
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
}: {
  site: Site;
  location?: Location | null;
  inSeason: boolean;
  reefState: ReefState;
  gradientIndex: number;
}) {
  const sighting = getHeadlineSightingForSite(site.id);
  const badgeStyle = REEF_STATE_BADGE[reefState];
  const locationLabel = [location?.name, location?.country]
    .filter(Boolean)
    .join(" · ");

  const skillLabel =
    SKILL_LABEL[site.skillLevel] ?? site.skillLevel.replace("-", " ") + "+";

  // depth chip
  const depthChip = `${site.depthRange.min}–${site.depthRange.max} m`;

  // primary dive type chip
  const diveTypeChip = site.diveTypes
    .slice(0, 1)
    .map((t) => t.replace("-", " "))
    .join("");

  // current strength from best current month conditions, fallback none
  const currentStrength =
    site.conditionsByMonth.find((c) => c.month === new Date().getUTCMonth() + 1)
      ?.currentStrength ??
    site.conditionsByMonth[0]?.currentStrength ??
    null;

  const gradient = OCEAN_GRADIENTS[gradientIndex];

  // Sighting dot color
  const sightDotColor =
    sighting?.confidence === "high"
      ? "#10b981"
      : sighting?.confidence === "medium"
        ? "#0089de"
        : "#94a3b8";

  return (
    <Link
      href={`/sites/${site.slug}`}
      style={{
        borderRadius: "1.25rem",
        overflow: "hidden",
        border: "1px solid #e2e8f0",
        background: "#fff",
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
        {/* Ocean gradient background */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: gradient,
            transition: "transform 0.5s",
          }}
          className="site-card-img"
        />

        {/* Actual hero photo layered on top (objectFit cover) */}
        {site.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={underwaterPhotoUrl(site.heroImageUrl)}
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

        {/* Shimmer overlay */}
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

        {/* Bottom gradient scrim */}
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

        {/* Top-left badges: reef state + in season */}
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

        {/* Bottom-right skill level badge */}
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
        {/* Location */}
        <p
          style={{
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: "0.3rem",
          }}
        >
          {locationLabel || "—"}
        </p>

        {/* Site name */}
        <h3
          style={{
            fontSize: "1.0625rem",
            fontWeight: 700,
            letterSpacing: "-0.015em",
            color: "#0f172a",
            marginBottom: "0.5rem",
            transition: "color 0.15s",
          }}
          className="site-card-name"
        >
          {site.name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Source Serif 4', Georgia, serif",
            fontSize: "0.875rem",
            lineHeight: 1.65,
            color: "#475569",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {site.description}
        </p>

        {/* Sighting row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            marginTop: "0.75rem",
            fontSize: "0.6875rem",
            color: "#64748b",
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
              className="text-[11px] leading-5 text-slate-500"
            />
          )}
        </div>

        {/* Chips row */}
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            flexWrap: "wrap",
            marginTop: "0.875rem",
            paddingTop: "0.875rem",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              fontSize: "0.5875rem",
              fontWeight: 600,
              padding: "0.2rem 0.55rem",
              borderRadius: 999,
              background: "#f1f7fb",
              color: "#64748b",
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
                background: "#e8f0fe",
                color: "#1d5d90",
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
                background: "#f1f7fb",
                color: "#64748b",
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

// ─── FilterDropdownChip ───────────────────────────────────────────────────────

function FilterDropdownChip({
  label,
  active,
  onClear,
  children,
}: {
  label: string;
  active: boolean;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block" }} className="filter-dropdown-wrap">
      <button
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.25rem",
          padding: "0.45rem 0.9375rem",
          borderRadius: 999,
          border: `1px solid ${active ? "transparent" : "#e2e8f0"}`,
          background: active ? "#e8f0fe" : "#fff",
          fontSize: "0.8125rem",
          fontWeight: active ? 600 : 500,
          color: active ? "#1d5d90" : "#475569",
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
        onClick={active ? onClear : undefined}
      >
        {label}
        {active ? (
          <span style={{ fontSize: "0.75rem", lineHeight: 1, opacity: 0.7 }}>×</span>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: 0.5 }}>
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Dropdown — only when not active (active means a filter is set; click clears it) */}
      {!active && (
        <div
          className="filter-dropdown-menu"
          style={{
            position: "absolute",
            top: "calc(100% + 0.375rem)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "0.625rem",
            boxShadow: "0 4px 16px -4px rgba(16,40,70,0.14)",
            padding: "0.375rem",
            minWidth: 180,
            display: "none",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
