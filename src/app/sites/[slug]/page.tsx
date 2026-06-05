import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SetNavBreadcrumb } from "@/components/set-nav-breadcrumb";
import { IucnBadge } from "@/components/iucn-badge";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { siteSchema } from "@/lib/schema-org";
import { getAllSites, getSiteBySlug } from "@/lib/data/sites";
import { getLocationById } from "@/lib/data/locations";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { skillText } from "@/lib/data/reef-state";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getWrecksBySiteId } from "@/lib/data/wrecks";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import type { Site } from "@/lib/data/types";

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];


/**
 * One animal shown in "What you'll see". Combines a curated species entry
 * with this site's sighting-evidence record for the same animal.
 */
type Creature = {
  commonName: string;
  scientificName?: string;
  reliability?: "year-round" | "seasonal" | "rare";
  bestMonths?: number[];
  imageUrl?: string;
  lastConfirmedAt?: string | null;
  recentRecordCount?: number;
  proximityRadiusKm?: number;
};

type SightingRecord = ReturnType<typeof getSightingsBySiteId>[number];

function creatureKey(scientific: string | undefined, common: string): string {
  return (scientific || common).trim().toLowerCase();
}

function mergeCreatures(site: Site, sightings: SightingRecord[]): Creature[] {
  const byKey = new Map<string, Creature>();
  const order: string[] = [];

  for (const s of site.species) {
    const key = creatureKey(s.scientificName, s.commonName);
    if (!byKey.has(key)) order.push(key);
    byKey.set(key, {
      commonName: s.commonName,
      scientificName: s.scientificName,
      reliability: s.reliability,
      bestMonths: s.bestMonths,
      imageUrl: s.imageUrl,
    });
  }

  for (const ev of sightings) {
    const key = creatureKey(ev.speciesScientific, ev.speciesCommon);
    const existing = byKey.get(key);
    if (existing) {
      existing.lastConfirmedAt = ev.lastConfirmedAt;
      existing.recentRecordCount = ev.recentRecordCount;
      existing.proximityRadiusKm = ev.proximityRadiusKm;
    } else {
      order.push(key);
      byKey.set(key, {
        commonName: ev.speciesCommon,
        scientificName: ev.speciesScientific,
        lastConfirmedAt: ev.lastConfirmedAt,
        recentRecordCount: ev.recentRecordCount,
        proximityRadiusKm: ev.proximityRadiusKm,
      });
    }
  }

  return order.map((k) => byKey.get(k)!);
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00Z");
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) { const m = Math.floor(diffDays / 30); return `${m} ${m === 1 ? "month" : "months"} ago`; }
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return iso;
  }
}

/** Returns green dot color if within 14 days, amber otherwise */
function sightingDotColor(iso: string | null | undefined): string {
  if (!iso) return "#94a3b8";
  try {
    const diffDays = Math.floor(
      (new Date().getTime() - new Date(iso + "T00:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 14 ? "#10b981" : "#e8962f";
  } catch {
    return "#94a3b8";
  }
}

export function generateStaticParams() {
  return getAllSites().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) return { title: "Dive site not found" };
  const location = getLocationById(site.locationId);
  const metadataImageUrl = underwaterPhotoUrl(site.heroImageUrl);
  const title = `${site.name} — ${location?.name ?? ""}`;
  const description = site.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/sites/${site.slug}` },
    openGraph: {
      title,
      description,
      url: `/sites/${site.slug}`,
      type: "article",
      images: [{ url: metadataImageUrl, width: 2000, height: 1100 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [metadataImageUrl],
    },
  };
}

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = getSiteBySlug(slug);
  if (!site) notFound();

  const location = getLocationById(site.locationId);
  const currentMonth = new Date().getUTCMonth() + 1;
  const inSeason = site.bestMonths.includes(currentMonth);
  const sightings = getSightingsBySiteId(site.id);
  const wrecks = getWrecksBySiteId(site.id);

  const coralCover = location ? getCoralCoverForLocation(location.id) : null;
  const reefHealthRecords = location ? getReefHealthByLocationId(location.id) : [];

  const creatures = mergeCreatures(site, sightings);

  const photoCredits = creatures
    .filter((c) => c.imageUrl)
    .map((c) => ({
      commonName: c.commonName,
      ...getSpeciesPhotoCredit(creatureKey(c.scientificName, c.commonName)),
    }))
    .filter((c) => c.imageUrl);

  // Latest sighting for stat strip
  const latestSighting = sightings
    .filter((s) => s.lastConfirmedAt)
    .sort((a, b) => (b.lastConfirmedAt ?? "").localeCompare(a.lastConfirmedAt ?? ""))[0];

  // Current month conditions
  const condMonth = site.conditionsByMonth.find((c) => c.month === currentMonth);

  // Stat strip: 6 items matching mockup
  const bestMonthsRange =
    site.bestMonths.length === 12
      ? "Year round"
      : MONTH_ABBR[site.bestMonths[0] - 1] +
        (site.bestMonths.length > 1
          ? "–" + MONTH_ABBR[site.bestMonths[site.bestMonths.length - 1] - 1]
          : "");

  // Dives types for subtitle
  const siteTypeLabel = site.diveTypes.length > 0
    ? site.diveTypes[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Dive site";

  // Depth profile bars — map depthRange to 8 bars with proportional heights
  const minDepth = site.depthRange.min;
  const maxDepth = site.depthRange.max;
  // Create a simple profile: gentle slope then steeper then back
  const depthBarHeights = [30, 50, 70, 100, 90, 75, 55, 40];

  // Reef health for conditions grid
  const thermalStress = reefHealthRecords
    .map((r) => r.thermalStress)
    .filter(Boolean)[0];
  const observedReef = reefHealthRecords
    .map((r) => r.observed)
    .filter(Boolean)[0];

  const coralCoverPct = coralCover?.current.coverPercent ?? observedReef?.coralCoverPercent ?? null;
  const bleachingAlert = thermalStress?.alertLevel ?? "no-stress";

  const BLEACHING_LABEL: Record<string, string> = {
    "no-stress": "No bleaching alert",
    watch: "Watch",
    warning: "Warning",
    "alert-1": "Alert Level 1",
    "alert-2": "Alert Level 2",
  };

  const dhw = thermalStress?.degreeHeatingWeeks ?? 0;
  const sstAnomaly = thermalStress?.sstAnomalyC ?? 0;

  const noThermalStress = bleachingAlert === "no-stress";

  return (
    <>
      <JsonLd data={siteSchema(site, location)} />
      <SetNavBreadcrumb
        items={[
          { label: "Atlas", href: "/" },
          ...(location
            ? [{ label: location.name, href: `/locations/${location.slug}` }]
            : []),
          { label: site.name },
        ]}
      />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          height: "62vh",
          minHeight: 480,
          overflow: "hidden",
        }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(160deg,#031828 0%,#052a45 20%,#064a6a 40%,#087088 58%,#0a9880 75%,#088870 100%)",
          }}
        />
        {/* Shimmer overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(96deg,transparent 0,transparent 44px,rgba(0,180,220,.04) 44px,rgba(0,180,220,.04) 46px)",
          }}
        />
        {/* Fade to white at bottom */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 260,
            background: "linear-gradient(to bottom,transparent,#fff)",
          }}
        />
        {/* Photo credit */}
        <div
          style={{
            position: "absolute",
            top: "1.5rem",
            right: "2rem",
            zIndex: 20,
            fontSize: "0.5875rem",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Photo · {site.name}{location ? `, ${location.name}` : ""}
        </div>
        {/* Hero content */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 3rem 3rem",
            maxWidth: 1320,
            margin: "0 auto",
          }}
        >
          {/* In-season pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.875rem",
              borderRadius: 999,
              background: inSeason
                ? "rgba(16,185,129,0.12)"
                : "rgba(100,116,139,0.12)",
              border: inSeason
                ? "1px solid rgba(16,185,129,0.2)"
                : "1px solid rgba(100,116,139,0.2)",
              fontSize: "0.625rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: inSeason ? "#10b981" : "#94a3b8",
              marginBottom: "1rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: inSeason ? "#10b981" : "#94a3b8",
                display: "inline-block",
                animation: inSeason ? "pulse 2s infinite" : undefined,
              }}
            />
            {inSeason ? "In season now" : "Off season"}
          </div>
          {/* H1 */}
          <h1
            style={{
              fontSize: "clamp(2.25rem, 4.5vw, 3.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
              color: "#0f172a",
              margin: 0,
            }}
          >
            {site.name}
          </h1>
          {/* Subtitle */}
          <p
            style={{
              fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1rem",
              color: "#64748b",
              marginTop: "0.625rem",
            }}
          >
            {siteTypeLabel}
            {location ? ` · ${location.name}${location.region ? `, ${location.region}` : ""}` : ""}
            {" "}· {site.depthRange.min}–{site.depthRange.max} m
            {" "}· {skillText(site.skillLevel)}+
          </p>
        </div>
      </section>

      {/* ── STAT STRIP ── */}
      <div
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: "#f1f7fb",
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "0 3rem",
            display: "flex",
            alignItems: "stretch",
            overflowX: "auto",
          }}
        >
          {/* Depth range */}
          <StatStripItem
            label="Depth range"
            value={`${site.depthRange.min} – ${site.depthRange.max} m`}
            first
          />
          {/* Certification */}
          <StatStripItem
            label="Certification"
            value={`${skillText(site.skillLevel)}+`}
          />
          {/* Typical visibility */}
          <StatStripItem
            label="Typical visibility"
            value={
              condMonth
                ? `${condMonth.visibilityM.min} – ${condMonth.visibilityM.max} m`
                : "15 – 25 m"
            }
          />
          {/* Current */}
          <StatStripItem
            label="Current"
            value={
              condMonth
                ? condMonth.currentStrength.charAt(0).toUpperCase() + condMonth.currentStrength.slice(1)
                : "Moderate"
            }
            note="Check tides — site is current-dependent"
          />
          {/* Best time */}
          <StatStripItem
            label="Best time"
            value={bestMonthsRange}
            note={`Peak season ${bestMonthsRange}`}
          />
          {/* Last confirmed sighting */}
          {latestSighting?.lastConfirmedAt ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                padding: "1.125rem 2rem",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: "0.5875rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                Last confirmed sighting
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#10b981",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {formatRelativeTime(latestSighting.lastConfirmedAt)}
              </span>
              <span
                style={{
                  fontSize: "0.6875rem",
                  color: "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {latestSighting.speciesCommon} · iNaturalist
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── BODY (2-col grid with sidebar) ── */}
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "3.5rem 3rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* ── LEFT COLUMN ── */}
          <div>
            {/* ── ABOUT / DESCRIPTION (first per 7.10) ── */}
            {(site.description || site.notes || wrecks.length > 0) ? (
              <section style={{ marginBottom: "2.5rem" }}>
                <p
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: "0.75rem",
                  }}
                >
                  Overview
                </p>
                {site.description ? (
                  <p
                    style={{
                      fontSize: "0.9375rem",
                      lineHeight: 1.75,
                      color: "#334155",
                      marginBottom: "1.25rem",
                    }}
                  >
                    {site.description}
                  </p>
                ) : null}
                {site.notes ? (
                  <div
                    style={{
                      borderRadius: "1rem",
                      border: "1px solid #e2e8f0",
                      background: "#f1f7fb",
                      padding: "1rem 1.25rem",
                      marginBottom: "1.25rem",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#1d5d90",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Briefing note
                    </p>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "#334155" }}>
                      {site.notes}
                    </p>
                  </div>
                ) : null}
                {wrecks.length > 0 ? (
                  <div style={{ marginTop: "1.25rem" }}>
                    <p
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#64748b",
                        marginBottom: "0.75rem",
                      }}
                    >
                      The wreck
                    </p>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {wrecks.map((w) => (
                        <li
                          key={w.id}
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "1rem",
                            padding: "1rem 1.25rem",
                          }}
                        >
                          <p style={{ fontWeight: 700, color: "#0f172a" }}>{w.vesselName}</p>
                          <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: 2, textTransform: "capitalize" }}>
                            {w.vesselType} · Sunk {w.sunk}
                          </p>
                          <p style={{ fontSize: "0.8125rem", lineHeight: 1.65, color: "#334155", marginTop: "0.5rem" }}>
                            {w.history}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {/* ── SPECIES GRID ── */}
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.75rem",
              }}
            >
              What you&apos;ll see
            </p>
            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                marginBottom: "1.25rem",
              }}
            >
              Confirmed species at this site
            </h2>

            {creatures.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,1fr)",
                  gap: "0.75rem",
                  marginBottom: "2.5rem",
                }}
              >
                {creatures.map((c) => {
                  const iucn = IUCN_ENABLED ? getIucnStatus(c.scientificName) : null;
                  const dotColor = sightingDotColor(c.lastConfirmedAt);
                  // Every confirmed species links to its per-site species detail
                  // page (which itself links onward to /where-to-see when a
                  // curated encounter exists). No dead "#" links.
                  const speciesSlug = c.commonName
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  const href = `/sites/${site.slug}/species/${speciesSlug}`;

                  // Gradient backgrounds cycling through 6 variants
                  const gradients = [
                    "linear-gradient(145deg,#0a3060,#0a6b8a,#087a6e)",
                    "linear-gradient(145deg,#041c33,#065566,#0a7a6b)",
                    "linear-gradient(145deg,#0d4060,#0a7090,#086878)",
                    "linear-gradient(145deg,#031522,#064466,#0b829f)",
                    "linear-gradient(145deg,#042030,#0a5060,#0a9080)",
                    "linear-gradient(145deg,#0a2840,#0a5878,#087068)",
                  ];
                  const gradIdx = (creatures.indexOf(c)) % gradients.length;

                  return (
                    <Link
                      key={creatureKey(c.scientificName, c.commonName)}
                      href={href}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "1rem",
                        overflow: "hidden",
                        textDecoration: "none",
                        color: "inherit",
                        display: "block",
                      }}
                    >
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.imageUrl}
                          alt={c.commonName}
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 100,
                            background: gradients[gradIdx],
                          }}
                        />
                      )}
                      <div style={{ padding: "0.75rem" }}>
                        <p
                          style={{
                            fontSize: "0.8125rem",
                            fontWeight: 700,
                            color: "#0f172a",
                            marginBottom: "0.2rem",
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.25rem",
                          }}
                        >
                          {c.commonName}
                          {iucn ? (
                            <IucnBadge status={iucn} />
                          ) : null}
                        </p>
                        {c.scientificName ? (
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              fontStyle: "italic",
                              color: "#64748b",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {c.scientificName}
                          </p>
                        ) : null}
                        {c.reliability ? (
                          <p style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: c.reliability === "year-round" ? "#10b981" : c.reliability === "seasonal" ? "#f59e0b" : "#94a3b8", marginBottom: "0.25rem" }}>
                            {c.reliability}
                            {c.reliability === "seasonal" && c.bestMonths && c.bestMonths.length > 0
                              ? ` · Peak: ${c.bestMonths.map((m) => MONTH_ABBR[m - 1]).join(", ")}`
                              : null}
                          </p>
                        ) : null}
                        {c.lastConfirmedAt ? (
                          <p
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                              fontSize: "0.6875rem",
                              color: "#64748b",
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                background: dotColor,
                                flexShrink: 0,
                                display: "inline-block",
                              }}
                            />
                            <time dateTime={c.lastConfirmedAt}>
                              Confirmed {formatRelativeTime(c.lastConfirmedAt)}
                            </time>
                          </p>
                        ) : (
                          <p
                            style={{
                              fontSize: "0.6875rem",
                              color: "#94a3b8",
                            }}
                          >
                            No recent record
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: "1rem",
                  padding: "2.5rem 1.5rem",
                  textAlign: "center",
                  marginBottom: "2.5rem",
                }}
              >
                <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>
                  No records yet
                </p>
                <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                  No recent sighting data for this site. Dived here? Log what you saw.
                </p>
              </div>
            )}

            {/* Photo credits (collapsed) */}
            {photoCredits.length > 0 ? (
              <details style={{ marginBottom: "2rem" }}>
                <summary
                  style={{
                    fontSize: "0.6875rem",
                    color: "#94a3b8",
                    cursor: "pointer",
                    listStyle: "none",
                  }}
                >
                  Photos via iNaturalist · credits
                </summary>
                <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
                  {photoCredits.map((c) => (
                    <li
                      key={c.commonName}
                      style={{ fontSize: "0.6875rem", color: "#94a3b8", lineHeight: 1.6 }}
                    >
                      {c.commonName}: {c.photographer ?? "iNaturalist contributor"} · {c.licenseLabel}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}

            {/* ── SIGHTINGS LOG ── */}
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.75rem",
              }}
            >
              Recent sightings
            </p>
            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                marginBottom: "1.25rem",
              }}
            >
              iNaturalist research grade observations
            </h2>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                border: "1px solid #e2e8f0",
                borderRadius: "1.25rem",
                overflow: "hidden",
                marginBottom: "2.5rem",
              }}
            >
              {sightings.filter((s) => s.lastConfirmedAt).length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#64748b",
                      marginBottom: "0.375rem",
                    }}
                  >
                    No recent sightings recorded.
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#94a3b8",
                      lineHeight: 1.5,
                    }}
                  >
                    Dived here? Log what you saw on iNaturalist to help keep this record current.
                  </p>
                </div>
              ) : (
                sightings
                  .filter((s) => s.lastConfirmedAt)
                  .sort((a, b) => (b.lastConfirmedAt ?? "").localeCompare(a.lastConfirmedAt ?? ""))
                  .slice(0, 5)
                  .map((s, i, arr) => {
                    const dotColor = sightingDotColor(s.lastConfirmedAt);
                    const obsId = s.sourceIds[0] ?? null;
                    return (
                      <div
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "1rem",
                          padding: "1rem 1.375rem",
                          borderBottom: i < arr.length - 1 ? "1px solid #e2e8f0" : "none",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: dotColor,
                            flexShrink: 0,
                            marginTop: 4,
                            display: "inline-block",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <p
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {s.speciesCommon}
                          </p>
                          {s.notes ? (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                marginTop: "0.15rem",
                              }}
                            >
                              {s.notes}
                            </p>
                          ) : (
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                marginTop: "0.15rem",
                              }}
                            >
                              {s.recentRecordCount} record{s.recentRecordCount === 1 ? "" : "s"} within {s.proximityRadiusKm} km
                            </p>
                          )}
                          {obsId ? (
                            <a
                              href={`https://www.inaturalist.org/observations/${obsId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                                fontSize: "0.6875rem",
                                color: "#94a3b8",
                                textDecoration: "none",
                              }}
                            >
                              obs/{obsId} →
                            </a>
                          ) : (
                            <p
                              style={{
                                fontSize: "0.6875rem",
                                color: "#94a3b8",
                                fontFamily: "var(--font-mono), 'IBM Plex Mono', monospace",
                              }}
                            >
                              iNaturalist · research grade
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {s.lastConfirmedAt ? formatRelativeTime(s.lastConfirmedAt) : ""}
                        </span>
                      </div>
                    );
                  })
              )}
            </div>

            {/* ── CONDITIONS GRID ── */}
            <p
              style={{
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#64748b",
                marginBottom: "0.75rem",
              }}
            >
              Conditions
            </p>
            <h2
              style={{
                fontSize: "1.375rem",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "#0f172a",
                marginBottom: "1.25rem",
              }}
            >
              What to expect in the water
            </h2>

            {/* 12-month conditions grid */}
            {site.conditionsByMonth.length === 12 && (
              <div style={{ marginBottom: "2rem", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "0.375rem 0.5rem", color: "#64748b", fontWeight: 600, fontSize: "0.625rem", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      </th>
                      {MONTH_ABBR.map((m, i) => {
                        const isCurrent = i + 1 === currentMonth;
                        return (
                          <th
                            key={m}
                            style={{
                              padding: "0.375rem 0.25rem",
                              textAlign: "center",
                              fontWeight: isCurrent ? 800 : 500,
                              color: isCurrent ? "#0089de" : "#64748b",
                              fontSize: "0.625rem",
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              outline: isCurrent ? "2px solid #0089de" : "none",
                              outlineOffset: "-2px",
                              borderRadius: "0.25rem",
                            }}
                          >
                            {m}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Water temp row */}
                    <tr>
                      <td style={{ padding: "0.5rem 0.5rem", color: "#64748b", fontWeight: 600, fontSize: "0.6875rem", whiteSpace: "nowrap" }}>Temp (°C)</td>
                      {site.conditionsByMonth.map((c, i) => {
                        const isCurrent = c.month === currentMonth;
                        return (
                          <td key={i} style={{ padding: "0.5rem 0.25rem", textAlign: "center", color: isCurrent ? "#0089de" : "#0f172a", fontWeight: isCurrent ? 700 : 400, background: isCurrent ? "rgba(0,137,222,0.06)" : "transparent", borderRadius: "0.25rem" }}>
                            {c.waterTempC.min}–{c.waterTempC.max}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Visibility row */}
                    <tr>
                      <td style={{ padding: "0.5rem 0.5rem", color: "#64748b", fontWeight: 600, fontSize: "0.6875rem", whiteSpace: "nowrap" }}>Viz (m)</td>
                      {site.conditionsByMonth.map((c, i) => {
                        const isCurrent = c.month === currentMonth;
                        return (
                          <td key={i} style={{ padding: "0.5rem 0.25rem", textAlign: "center", color: isCurrent ? "#0089de" : "#0f172a", fontWeight: isCurrent ? 700 : 400, background: isCurrent ? "rgba(0,137,222,0.06)" : "transparent", borderRadius: "0.25rem" }}>
                            {c.visibilityM.min}–{c.visibilityM.max}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Current row */}
                    <tr>
                      <td style={{ padding: "0.5rem 0.5rem", color: "#64748b", fontWeight: 600, fontSize: "0.6875rem", whiteSpace: "nowrap" }}>Current</td>
                      {site.conditionsByMonth.map((c, i) => {
                        const isCurrent = c.month === currentMonth;
                        const bg =
                          c.currentStrength === "strong" ? "rgba(244,63,94,0.12)" :
                          c.currentStrength === "moderate" ? "rgba(245,158,11,0.12)" :
                          "rgba(16,185,129,0.10)";
                        const col =
                          c.currentStrength === "strong" ? "#e11d48" :
                          c.currentStrength === "moderate" ? "#d97706" :
                          "#059669";
                        return (
                          <td key={i} style={{ padding: "0.375rem 0.25rem", textAlign: "center" }}>
                            <span style={{
                              display: "inline-block",
                              fontSize: "0.5875rem",
                              fontWeight: 700,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              padding: "0.15rem 0.35rem",
                              borderRadius: "0.25rem",
                              background: isCurrent ? (c.currentStrength === "strong" ? "rgba(244,63,94,0.2)" : c.currentStrength === "moderate" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.18)") : bg,
                              color: col,
                              outline: isCurrent ? `2px solid ${col}` : "none",
                              outlineOffset: "1px",
                            }}>
                              {c.currentStrength.slice(0, 3)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
                <p style={{ fontSize: "0.6875rem", color: "#94a3b8", marginTop: "0.5rem" }}>
                  Highlighted column = this month. Current: <span style={{ color: "#059669", fontWeight: 600 }}>mild</span> · <span style={{ color: "#d97706", fontWeight: 600 }}>mod</span> · <span style={{ color: "#e11d48", fontWeight: 600 }}>str</span>
                </p>
              </div>
            )}

            {/* Summary cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "2.5rem",
              }}
            >
              {/* Entry type */}
              <CondCard
                label="Entry type"
                value={site.getThere ? (site.getThere.toLowerCase().includes("boat") ? "Boat" : "Shore") : "Boat"}
                note={site.getThere || "Check with local operators for access details."}
              />
              {/* Current (this month) */}
              <CondCard
                label="Current now"
                value={
                  condMonth
                    ? condMonth.currentStrength.charAt(0).toUpperCase() + condMonth.currentStrength.slice(1)
                    : "Moderate"
                }
                note="Incoming tide can bring pelagics and better visibility. Plan arrival around tide times."
              />
              {/* Visibility */}
              <CondCard
                label="Visibility"
                value={
                  condMonth
                    ? `${condMonth.visibilityM.min} – ${condMonth.visibilityM.max} m typical`
                    : "15 – 25 m typical"
                }
                note="Can drop after heavy rain. Check conditions day-of with your operator."
              />
              {/* Water temperature */}
              <CondCard
                label="Water temp"
                value={
                  condMonth
                    ? `${condMonth.waterTempC.min} – ${condMonth.waterTempC.max}°C`
                    : "27 – 29°C"
                }
                note={condMonth?.suitRecommendation || "3 mm wetsuit comfortable for most divers."}
              />
              {/* Reef health */}
              <CondCard
                label="Reef health"
                value={
                  coralCoverPct !== null
                    ? coralCoverPct >= 50
                      ? "Excellent"
                      : coralCoverPct >= 30
                      ? "Good"
                      : "Under pressure"
                    : bleachingAlert === "no-stress"
                    ? "No alert"
                    : BLEACHING_LABEL[bleachingAlert] ?? "Check locally"
                }
                note={
                  coralCoverPct !== null
                    ? `Hard coral cover ${coralCoverPct}%${coralCover?.current.year ? ` (${coralCover.current.year})` : ""}. ${BLEACHING_LABEL[bleachingAlert]}.`
                    : "No bleaching alert active. Check NOAA Coral Reef Watch for latest thermal stress."
                }
              />
              {/* Photography */}
              <CondCard
                label="Photography"
                value={
                  site.diveTypes.includes("large-pelagics") || site.diveTypes.includes("coral")
                    ? "Wide angle"
                    : site.diveTypes.includes("macro")
                    ? "Macro"
                    : "Wide angle"
                }
                note={
                  site.diveTypes.includes("large-pelagics")
                    ? "Large animals at range. Blue water background. Strobe optional — natural light often best."
                    : site.diveTypes.includes("macro")
                    ? "Macro lens for small critters. Snooted strobe for even lighting on small subjects."
                    : "Wide angle lens recommended. Good ambient light. Strobe helps on the reef wall."
                }
              />
            </div>

            {/* ── SEASON CALENDAR ── */}
            <section style={{ marginTop: "2.5rem", marginBottom: "2.5rem" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: "0.75rem",
                }}
              >
                Season calendar
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(12, 1fr)",
                  gap: "0.25rem",
                }}
              >
                {MONTH_ABBR.map((abbr, i) => {
                  const active = site.bestMonths.includes(i + 1);
                  return (
                    <div
                      key={abbr}
                      style={{
                        textAlign: "center",
                        borderRadius: "0.5rem",
                        padding: "0.5rem 0.25rem",
                        background: active ? "rgba(0,137,222,0.12)" : "#f1f7fb",
                        border: active ? "1px solid rgba(0,137,222,0.25)" : "1px solid #e2e8f0",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: active ? 700 : 500,
                          color: active ? "#0089de" : "#94a3b8",
                          display: "block",
                        }}
                      >
                        {abbr}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.625rem" }}>
                Highlighted months = recommended season ({bestMonthsRange})
              </p>
            </section>

            {/* ── THERMAL STATUS (live) — conditions content ── */}
            <section style={{ marginTop: "2.5rem", marginBottom: "2.5rem" }}>
              <p
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#64748b",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                Thermal status
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.5625rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: noThermalStress ? "#10b981" : "#f59e0b",
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: noThermalStress ? "#10b981" : "#f59e0b",
                      display: "inline-block",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  Live
                </span>
              </p>
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1.25rem",
                  padding: "1.25rem 1.375rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.875rem",
                    borderRadius: "0.75rem",
                    background: noThermalStress ? "#eef8f1" : "#fff8f0",
                    border: noThermalStress ? "1px solid #cde9d6" : "1px solid #fde8cc",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: noThermalStress ? "#e7f6ee" : "#fde8cc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: noThermalStress ? "#10b981" : "#f59e0b",
                        boxShadow: `0 0 0 3px ${noThermalStress ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
                      }}
                    />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: noThermalStress ? "#15824c" : "#92400e",
                      }}
                    >
                      {BLEACHING_LABEL[bleachingAlert] ?? "No thermal stress"}
                    </p>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        color: noThermalStress ? "#3d6b50" : "#78350f",
                        marginTop: "0.1rem",
                      }}
                    >
                      NOAA Coral Reef Watch
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    marginTop: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.625rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.5rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#64748b",
                        marginBottom: "0.2rem",
                      }}
                    >
                      DHW
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {dhw.toFixed(1)} °C·wk
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "0.625rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.5rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#64748b",
                        marginBottom: "0.2rem",
                      }}
                    >
                      SST anomaly
                    </p>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {sstAnomaly >= 0 ? "+" : ""}{sstAnomaly.toFixed(1)} °C
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── HOW TO DIVE THIS SITE ── */}
            <HowToDiveSection site={site} />

          </div>

          {/* ── SIDEBAR ── */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              position: "sticky",
              top: "5rem",
            }}
          >
            {/* Depth profile */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "1.25rem",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.375rem",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f1f7fb",
                }}
              >
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Depth profile
                </p>
              </div>
              <div style={{ padding: "1.25rem 1.375rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: "0.5rem",
                    height: 80,
                    marginBottom: "0.75rem",
                  }}
                >
                  {depthBarHeights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${h}%`,
                        borderRadius: "4px 4px 0 0",
                        background:
                          "linear-gradient(to bottom,rgba(0,137,222,0.15),rgba(0,137,222,0.5))",
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.625rem",
                    color: "#64748b",
                  }}
                >
                  <span>{minDepth} m</span>
                  <span>{maxDepth} m</span>
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                    marginTop: "0.75rem",
                    lineHeight: 1.5,
                  }}
                >
                  {site.description.slice(0, 100)}
                  {site.description.length > 100 ? "…" : ""}
                </p>
              </div>
            </div>

            {/* Parent location card */}
            {location ? (
              <div
                style={{
                  background: "#0b1e32",
                  borderRadius: "1.25rem",
                  padding: "1.25rem 1.375rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.5875rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Part of
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    marginBottom: "0.25rem",
                  }}
                >
                  {location.name}
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: "1.25rem",
                  }}
                >
                  {location.country}
                  {location.region ? ` · ${location.region}` : ""}
                </p>
                <Link
                  href={`/locations/${location.slug}`}
                  style={{
                    display: "block",
                    padding: "0.625rem 1rem",
                    borderRadius: "0.625rem",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    textAlign: "center",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  View location & plan your trip →
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

/** Stat strip item */
function StatStripItem({
  label,
  value,
  note,
  first = false,
}: {
  label: string;
  value: string;
  note?: string;
  first?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.2rem",
        padding: first ? "1.125rem 2rem 1.125rem 0" : "1.125rem 2rem",
        borderRight: "1px solid #e2e8f0",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: "0.5875rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#64748b",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 700,
          color: "#0f172a",
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
      {note ? (
        <span
          style={{
            fontSize: "0.6875rem",
            color: "#64748b",
            whiteSpace: "nowrap",
          }}
        >
          {note}
        </span>
      ) : null}
    </div>
  );
}

/** Conditions grid card */
function CondCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div
      style={{
        padding: "1rem 1.125rem",
        borderRadius: "0.875rem",
        border: "1px solid #e2e8f0",
      }}
    >
      <p
        style={{
          fontSize: "0.5875rem",
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "0.9375rem",
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: "0.2rem",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "0.75rem",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {note}
      </p>
    </div>
  );
}

/** How-to-dive numbered sequence */
function HowToDiveSection({ site }: { site: Site }) {
  const conditions = site.conditionsByMonth;
  const bestCond = conditions.find((c) => site.bestMonths.includes(c.month));
  const currentStr = bestCond?.currentStrength ?? "moderate";
  const visDesc = bestCond
    ? `${bestCond.visibilityM.min}–${bestCond.visibilityM.max} m`
    : "15–25 m";
  const depthDesc = `${site.depthRange.min}–${site.depthRange.max} m`;
  const bestMonthsStr = site.bestMonths.map((m) => MONTH_ABBR[m - 1]).join(", ");

  const steps = [
    {
      num: "01",
      title: "Time your arrival",
      description: bestMonthsStr
        ? `Peak season runs ${bestMonthsStr}. Arrive at the site early — first light brings calmer conditions and less boat traffic. Check the local tide table the night before and aim to be in the water before the tide turns.`
        : "Check local conditions before heading out. Early morning often means calmer surface conditions and better light below.",
    },
    {
      num: "02",
      title: "Descend and orient",
      description: `This site runs ${depthDesc}. Descend slowly along the reef wall or slope and take a moment at depth to check current direction before moving further. Identify your exit point before you explore.`,
    },
    {
      num: "03",
      title: "Work with the current",
      description:
        currentStr === "strong" || currentStr === "moderate"
          ? `Current here can be ${currentStr}. Position yourself up-current from your target area, then let the drift work for you. This is how the best encounters happen at this site.`
          : `Current is typically ${currentStr} at this site. Follow the reef edge and let slow drift guide you past the key features at your own pace.`,
    },
    {
      num: "04",
      title: "Surface and debrief",
      description: `Visibility averages ${visDesc} here. After your dive, deploy your SMB at the 5 m safety stop. Log sightings on iNaturalist — every confirmed record helps this atlas stay accurate for the next diver.`,
    },
  ];

  return (
    <section style={{ marginTop: 0, marginBottom: "2.5rem" }}>
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#64748b",
          marginBottom: "0.75rem",
        }}
      >
        How to dive this site
      </p>
      <h2
        style={{
          fontSize: "1.375rem",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#0f172a",
          marginBottom: "1.25rem",
        }}
      >
        Sequence and positioning
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          overflow: "hidden",
        }}
      >
        {steps.map((step, i) => (
          <div
            key={step.num}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.5rem",
              padding: "1.25rem 1.5rem",
              borderBottom: i < steps.length - 1 ? "1px solid #e2e8f0" : "none",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: "2rem",
                fontWeight: 900,
                color: "#e2e8f0",
                lineHeight: 1,
                minWidth: 48,
                flexShrink: 0,
              }}
            >
              {step.num}
            </span>
            <div>
              <p
                style={{
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "0.375rem",
                }}
              >
                {step.title}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-serif), 'Source Serif 4', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  color: "#475569",
                }}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
