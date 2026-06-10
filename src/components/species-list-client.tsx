"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AtlasInfoPopup,
  InfoButton,
  type InfoKey,
} from "@/components/atlas-info-popup";
import type { SpeciesGroup } from "@/lib/data/species-taxonomy";
import { resizePhotoUrl } from "@/lib/photo-quality";

/**
 * One fully resolved species row, computed on the server from real site +
 * sighting + IUCN data. The client component only filters and renders — it
 * invents nothing.
 */
export type SpeciesRow = {
  key: string;
  href: string;
  commonName: string;
  scientificName?: string;
  group: SpeciesGroup;
  icon: string;
  imageUrl?: string;
  /** Spelled-out IUCN label, e.g. "Least concern". Null when unknown. */
  iucnLabel: string | null;
  iucnBg: string | null;
  iucnText: string | null;
  /** Plain chance label, e.g. "Almost always". Null when unknown. */
  chanceLabel: string | null;
  chanceColor: string;
  /** Bar fill 0–100. Null hides the bar (likelihood unknown). */
  barPct: number | null;
  /** Plain frequency line, e.g. "Most dives". Null when unknown. */
  frequency: string | null;
  /** Where on the reef, plain language. Null when unknown. */
  where: string | null;
};

type Pill = { id: SpeciesGroup | "all"; label: string };

export function SpeciesListClient({
  rows,
  pills,
  siteName,
}: {
  rows: SpeciesRow[];
  pills: Pill[];
  siteName: string;
}) {
  const [activeType, setActiveType] = useState<SpeciesGroup | "all">("all");
  const [info, setInfo] = useState<InfoKey | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.group] = (c[r.group] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(
    () =>
      activeType === "all"
        ? rows
        : rows.filter((r) => r.group === activeType),
    [rows, activeType],
  );

  return (
    <>
      {/* Header */}
      <h1
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "#f0f4f8",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        Every animal recorded here
        <InfoButton
          onClick={() => setInfo("iucn")}
          label="What the conservation labels mean"
        />
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "#8b9db8",
          marginTop: "0.6rem",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        <span>
          {visible.length} {visible.length === 1 ? "species" : "species"}, most
          likely first
        </span>
        <span style={{ color: "#8b9db8" }}>·</span>
        <button
          type="button"
          onClick={() => setInfo("chances")}
          style={{
            background: "none",
            border: "none",
            color: "#00d4ff",
            fontWeight: 600,
            fontSize: "0.9375rem",
            cursor: "pointer",
            padding: 0,
          }}
        >
          How chances work
        </button>
      </p>

      {/* Type filter pills */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          margin: "1.75rem 0 1.5rem",
        }}
      >
        {pills.map((p) => {
          const active = activeType === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActiveType(p.id)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: 999,
                border: `1px solid ${active ? "#00d4ff" : "rgba(255,255,255,0.10)"}`,
                background: active ? "#00d4ff" : "rgba(255,255,255,0.05)",
                color: active ? "#0a1628" : "#8b9db8",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {p.label}
              <span style={{ opacity: 0.55, marginLeft: "0.35rem", fontWeight: 500 }}>
                {counts[p.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {visible.length > 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "1.25rem",
            overflow: "hidden",
          }}
        >
          {visible.map((r, i) => (
            <Link
              key={r.key}
              href={r.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.1rem 1.4rem",
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.10)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resizePhotoUrl(r.imageUrl, 240) ?? r.imageUrl}
                  alt={r.commonName}
                  style={{
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.6rem",
                    objectFit: "cover",
                    flexShrink: 0,
                    display: "block",
                  }}
                />
              ) : (
                <div
                  aria-hidden
                  style={{
                    fontSize: "1.4rem",
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "0.6rem",
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {r.icon}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    color: "#f0f4f8",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    flexWrap: "wrap",
                  }}
                >
                  {r.commonName}
                  {r.iucnLabel ? (
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.5625rem",
                        fontWeight: 700,
                        padding: "0.15rem 0.5rem",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        background: r.iucnBg ?? "rgba(255,255,255,0.10)",
                        color: r.iucnText ?? "#8b9db8",
                      }}
                    >
                      {r.iucnLabel}
                    </span>
                  ) : null}
                </p>
                {r.where ? (
                  <p
                    className="enc-where-line"
                    style={{ fontSize: "0.75rem", color: "#8b9db8", marginTop: "0.2rem" }}
                  >
                    {r.where}
                  </p>
                ) : null}
              </div>

              <div style={{ width: 165, flexShrink: 0 }} className="enc-odds-col">
                {r.chanceLabel ? (
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      marginBottom: "0.35rem",
                      color: r.chanceColor,
                    }}
                  >
                    {r.chanceLabel}
                  </p>
                ) : (
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 700,
                      marginBottom: "0.35rem",
                      color: "#8b9db8",
                    }}
                  >
                    Recorded here
                  </p>
                )}
                {r.barPct !== null ? (
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: "rgba(255,255,255,0.08)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        width: `${r.barPct}%`,
                        background: r.chanceColor,
                      }}
                    />
                  </div>
                ) : null}
                {r.frequency ? (
                  <p style={{ fontSize: "0.6875rem", color: "#8b9db8", marginTop: "0.35rem" }}>
                    {r.frequency}
                  </p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "2.5rem",
            textAlign: "center",
            color: "#8b9db8",
            fontSize: "0.875rem",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: "1.25rem",
          }}
        >
          No species of this type recorded at {siteName} yet.
        </div>
      )}

      {info ? (
        <AtlasInfoPopup infoKey={info} onClose={() => setInfo(null)} />
      ) : null}

      {/* Collapse the odds column / hide the where line on narrow screens,
          mirroring the mockup's mobile rules. */}
      <style>{`
        @media (max-width: 640px) {
          .enc-odds-col { width: 110px !important; }
          .enc-where-line { display: none !important; }
        }
      `}</style>
    </>
  );
}
