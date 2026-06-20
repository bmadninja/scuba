"use client";

import Link from "next/link";
import { ReefHealthBadge } from "@/components/reef-health-badge";
import type { ReefState } from "@/lib/data/reef-state";

/**
 * Maps the data-layer reef state (thriving/pressure/change) to the
 * design-layer health state (improving/stable/declining).
 */
function toHealthState(
  state: ReefState,
): "improving" | "stable" | "declining" {
  if (state === "thriving") return "improving";
  if (state === "pressure") return "stable";
  return "declining";
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function bestMonthLabel(months: number[]): string {
  if (months.length === 0) return "—";
  if (months.length === 12) return "Year round";
  const sorted = [...months].sort((a, b) => a - b);
  return `${MONTH_ABBR[sorted[0] - 1]}–${MONTH_ABBR[sorted[sorted.length - 1] - 1]}`;
}

export type ReefCardLocation = {
  slug: string;
  name: string;
  country: string;
  region: string;
  state: ReefState;
  heroImageUrl?: string;
  bestMonths: number[];
  coverNow: number | null;
  hasSightings: boolean;
};

interface ReefCardProps {
  location: ReefCardLocation;
  selected?: boolean;
  cardRef?: (el: HTMLAnchorElement | null) => void;
}

/**
 * ReefCard — Story 3.2
 *
 * Light-theme card matching Epic 3 design spec.
 * Hover border is handled via Tailwind group + CSS var trick since
 * inline :hover pseudo-selectors are unavailable in React.
 */
export function ReefCard({ location, selected = false, cardRef }: ReefCardProps) {
  const healthState = toHealthState(location.state);

  return (
    <Link
      href={`/locations/${location.slug}`}
      ref={cardRef}
      className={[
        "reef-card group flex flex-col overflow-hidden",
        "focus-visible:outline-2 focus-visible:outline-[#F6C700] focus-visible:outline-offset-2",
        selected ? "reef-card--selected" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderRadius: "8px",
        border: selected ? "2px solid #F6C700" : "1px solid #E7E6E2",
        background: "#FFFFFF",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 150ms",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Photo */}
      <div
        className="relative overflow-hidden"
        style={{ height: 180, background: "#0E4F6E", flexShrink: 0 }}
      >
        {location.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={location.heroImageUrl}
            alt={location.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(155deg,#041c33,#065566,#0a7a6b)",
            }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(14,28,40,0.4) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Card body */}
      <div
        className="flex flex-col"
        style={{ padding: "1rem", background: "#FFFFFF", flex: 1 }}
      >
        {/* Eyebrow: region · country */}
        <p
          style={{
            fontFamily:
              'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
            fontSize: "11px",
            fontWeight: 400,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#4A5568",
            marginBottom: "0.3rem",
          }}
        >
          {location.region} · {location.country}
        </p>

        {/* Location name */}
        <h3
          className="group-hover:text-[#0E4F6E] transition-colors"
          style={{
            fontFamily:
              'var(--font-serif), "Source Serif 4", Georgia, serif',
            fontSize: "22px",
            fontWeight: 400,
            lineHeight: 1.2,
            color: "#0E1C28",
            marginBottom: "0.5rem",
          }}
        >
          {location.name}
        </h3>

        {/* ReefHealthBadge */}
        <div style={{ marginBottom: "0.75rem" }}>
          <ReefHealthBadge state={healthState} />
        </div>

        {/* 2 data points */}
        <div
          className="flex flex-wrap gap-x-4 gap-y-1"
          style={{
            fontFamily:
              'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
            fontSize: "11px",
            color: "#4A5568",
            marginBottom: "0.625rem",
          }}
        >
          {location.coverNow !== null && (
            <span>
              <span style={{ fontWeight: 500, color: "#0E1C28" }}>
                {location.coverNow}%
              </span>{" "}
              coral cover
            </span>
          )}
          <span>
            <span style={{ fontWeight: 500, color: "#0E1C28" }}>
              {bestMonthLabel(location.bestMonths)}
            </span>{" "}
            best season
          </span>
        </div>

        {/* Evidence confidence */}
        <p
          style={{
            fontFamily:
              'var(--font-mono), "IBM Plex Mono", ui-monospace, monospace',
            fontSize: "10px",
            color: location.hasSightings ? "#2E7D5B" : "#4A5568",
            marginTop: "auto",
            paddingTop: "0.5rem",
          }}
        >
          {location.hasSightings
            ? "Confirmed sightings"
            : "No sighting records yet"}
        </p>
      </div>
    </Link>
  );
}
