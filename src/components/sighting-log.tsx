"use client";

// ─── Story 4.6: SightingLog Field Journal ─────────────────────────────────────
// Shows submitted diver sightings for a dive site, newest first.
// Per entry: diver name, date, species tags, conditions, photo thumbnail.
// "Load more" ghost button reveals additional 5 entries at a time.
// Empty state shows yellow CTA to /upload?site=[slug].

import { useState } from "react";
import Link from "next/link";

export type SightingEntry = {
  id: string;
  diverName: string | null;
  date: string | null;
  species: string[];
  depthM: number | null;
  tempC: number | null;
  photoUrl: string | null;
  photoAlt: string | null;
};

type Props = {
  entries: SightingEntry[];
  siteSlug: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "Date unknown";
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono), "IBM Plex Mono", monospace',
};

export function SightingLog({ entries, siteSlug }: Props) {
  const [shown, setShown] = useState(5);

  const uploadHref = `/upload?site=${encodeURIComponent(siteSlug)}`;

  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: "2rem 1.5rem",
          border: "1px solid #E7E6E2",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#4A5568", marginBottom: "1.25rem", fontSize: "0.9375rem" }}>
          No sightings recorded here yet.
        </p>
        <Link
          href={uploadHref}
          style={{
            display: "inline-block",
            background: "#F6C700",
            color: "#0E1C28",
            fontWeight: 600,
            fontSize: "0.875rem",
            padding: "0.65rem 1.5rem",
            borderRadius: "2px",
            textDecoration: "none",
            minHeight: 44,
            lineHeight: "1.2",
          }}
        >
          Upload the first sighting
        </Link>
      </div>
    );
  }

  const visible = entries.slice(0, shown);
  const hasMore = shown < entries.length;

  return (
    <div>
      <div
        style={{
          border: "1px solid #E7E6E2",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        {visible.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "1rem 1.25rem",
              borderTop: i === 0 ? "none" : "1px solid #E7E6E2",
              alignItems: "flex-start",
              background: "#FFFFFF",
            }}
          >
            {/* Photo thumbnail */}
            {entry.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.photoUrl}
                alt={entry.photoAlt ?? "Underwater photo"}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "cover",
                  borderRadius: "4px",
                  flexShrink: 0,
                  background: "#0E4F6E",
                }}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "4px",
                  flexShrink: 0,
                  background: "#0E4F6E",
                }}
              />
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Diver + date row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0E1C28" }}>
                  {entry.diverName ?? "Anonymous"}
                </span>
                <time
                  dateTime={entry.date ?? undefined}
                  style={{ ...MONO, fontSize: "11px", color: "#4A5568", whiteSpace: "nowrap" }}
                >
                  {formatDate(entry.date)}
                </time>
              </div>

              {/* Species chips */}
              {entry.species.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.4rem" }}>
                  {entry.species.map((sp) => (
                    <span
                      key={sp}
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        border: "1px solid #E7E6E2",
                        fontSize: "12px",
                        color: "#0E1C28",
                        background: "#FFFFFF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sp}
                    </span>
                  ))}
                </div>
              )}

              {/* Conditions row */}
              {(entry.depthM !== null || entry.tempC !== null) && (
                <div style={{ ...MONO, fontSize: "11px", color: "#4A5568", display: "flex", gap: "0.75rem" }}>
                  {entry.depthM !== null && <span>{entry.depthM} m depth</span>}
                  {entry.tempC !== null && <span>{entry.tempC} °C</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setShown((n) => n + 5)}
          style={{
            marginTop: "0.75rem",
            display: "block",
            width: "100%",
            padding: "0.65rem 1.25rem",
            border: "1px solid #0E1C28",
            borderRadius: "2px",
            background: "transparent",
            color: "#0E1C28",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          Load more ({entries.length - shown} remaining)
        </button>
      )}
    </div>
  );
}
