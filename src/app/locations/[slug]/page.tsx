import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AffiliateLink } from "@/components/affiliate-link";
import { JsonLd } from "@/components/json-ld";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { locationSchema } from "@/lib/schema-org";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { buildAtlasLocation } from "@/lib/atlas-location";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getEncountersByLocationId } from "@/lib/data/encounters";
import { getLocationDetailsById } from "@/lib/data/location-details";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getReefPressureByLocationId } from "@/lib/data/reef-pressure";
import { getWaterQualityByLocationId } from "@/lib/data/water-quality";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { getFishingPressureForLocation, getFishingPressureLastBuiltAt } from "@/lib/data/fishing-pressure";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getSourceById } from "@/lib/data/sources";
import { getMethodologyByClaimId } from "@/lib/data/methodologies";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { DataFreshnessLabel } from "@/components/data-freshness-label";
import { EditorialHook } from "@/components/editorial-hook";
import { SightingRow } from "@/components/sighting-row";
import { STATE_TEXT, STATE_DEF, freshness, getLastSurveyDays, getReefState, bestMonthsText, STATE_COLOR } from "@/lib/data/reef-state";
import { HowCalculated } from "./how-calculated";
import type {
  BleachingAlertLevel,
  PartnerLink,
  Site,
} from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALERT_LABEL: Record<BleachingAlertLevel, string> = {
  "no-stress": "No stress",
  watch: "Watch",
  warning: "Warning",
  "alert-1": "Alert level 1",
  "alert-2": "Alert level 2",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const FISHING_SIGNAL: Record<
  string,
  { label: string; tone: "good" | "ok" | "warn" | "bad" | "neutral" }
> = {
  low: { label: "Low", tone: "good" },
  moderate: { label: "Moderate", tone: "ok" },
  high: { label: "High", tone: "warn" },
  "very-high": { label: "Very high", tone: "bad" },
  unknown: { label: "Not enough data", tone: "neutral" },
};

const ALERT_TONE: Record<BleachingAlertLevel, "good" | "ok" | "warn" | "bad"> = {
  "no-stress": "good",
  watch: "ok",
  warning: "warn",
  "alert-1": "bad",
  "alert-2": "bad",
};

const ALERT_CONSEQUENCE: Record<BleachingAlertLevel, string> = {
  "no-stress": "No abnormal heat right now. Corals stay coloured.",
  watch: "Mild warmth. Worth watching — no bleaching yet.",
  warning: "Reefs at this level can start losing colour within weeks.",
  "alert-1": "Bleaching likely. Some coral mortality typically follows.",
  "alert-2": "Severe bleaching expected. Significant coral mortality is likely.",
};

const MPA_STATUS: Record<string, { label: string; tone: "good" | "ok" | "warn"; copy: string }> = {
  "no-protection": {
    label: "No formal protection",
    tone: "warn",
    copy: "This site sits outside any designated marine protected area. Operator and community choices carry most of the conservation weight here.",
  },
  "designated-multi-use": {
    label: "Multi-use MPA",
    tone: "ok",
    copy: "Inside a designated MPA that permits regulated fishing and other uses. Worth checking which zones at this location are no-take.",
  },
  "strict-mpa": {
    label: "Strict MPA",
    tone: "good",
    copy: "Inside a strict marine protected area with active enforcement.",
  },
  "no-take": {
    label: "No-take reserve",
    tone: "good",
    copy: "Fully no-take — no fishing of any kind. The strongest protection tier.",
  },
};

const WQ_SEVERITY_LABEL: Record<string, string> = {
  watch: "WATCH",
  concerning: "CONCERNING",
  severe: "SEVERE",
};

const WQ_MICROPLASTICS_LABEL: Record<string, string> = {
  low: "Low microplastics",
  moderate: "Moderate microplastics",
  high: "High microplastics",
  "very-high": "Very high microplastics",
};

const FRESHNESS_TONE: Record<string, "good" | "warn" | "neutral"> = {
  fresh: "good",
  stale: "warn",
  cold: "neutral",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function dotColor(days: number | null): string {
  if (days === null) return "#94a3b8";
  if (days <= 30) return "#10b981";
  if (days <= 90) return "#e8962f";
  return "#94a3b8";
}

function fmtRelative(days: number | null, iso: string | null): string {
  if (days === null || iso === null) return "No date on file";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" });
}

function formatSurveyDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function dedupePartnerLinks(links: PartnerLink[]): PartnerLink[] {
  const seen = new Set<string>();
  const out: PartnerLink[] = [];
  for (const l of links) {
    const key = `${l.partner}::${l.label}::${l.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(l);
  }
  return out;
}

// Gradient palettes for species/site thumbnails (ocean tones)
const OCEAN_GRADIENTS = [
  "linear-gradient(145deg,#0a3060,#0a6b8a,#087a6e)",
  "linear-gradient(145deg,#041c33,#065566,#0a7a6b)",
  "linear-gradient(145deg,#031522,#064466,#0b829f)",
  "linear-gradient(145deg,#0d4060,#0a7090,#086878)",
  "linear-gradient(145deg,#042030,#0a5060,#0a9080)",
  "linear-gradient(145deg,#0a2840,#0a5878,#087068)",
];

// IUCN badge color mapping
const IUCN_BADGE: Record<string, { bg: string; color: string }> = {
  EX:  { bg: "#f3e8ff", color: "#6b21a8" },
  EW:  { bg: "#f3e8ff", color: "#6b21a8" },
  CR:  { bg: "#fde8cc", color: "#9a3412" },
  EN:  { bg: "#fde8cc", color: "#9a3412" },
  VU:  { bg: "#fde8cc", color: "#9a3412" },
  NT:  { bg: "#fef3c7", color: "#92400e" },
  LC:  { bg: "#e7f6ee", color: "#065f46" },
  DD:  { bg: "#f1f5f9", color: "#475569" },
  NE:  { bg: "#f1f5f9", color: "#475569" },
};

// Pressure badge colors
const PRESSURE_BADGE: Record<string, { bg: string; color: string }> = {
  good:    { bg: "#e7f6ee", color: "#15824c" },
  ok:      { bg: "#fef3c7", color: "#92400e" },
  warn:    { bg: "#fef3c7", color: "#92400e" },
  bad:     { bg: "#fdecea", color: "#b91c1c" },
  neutral: { bg: "#f1f5f9", color: "#475569" },
};

// State pill styles
const STATE_PILL_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  thriving: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.2)", color: "#10b981" },
  pressure: { bg: "rgba(0,137,222,0.12)", border: "rgba(0,137,222,0.2)", color: "#0089de" },
  change:   { bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.2)", color: "#f43f5e" },
};

// Thermal sidebar badge
const THERMAL_BADGE: Record<BleachingAlertLevel, { bg: string; border: string; dotOuter: string; dotInner: string; label: string; labelColor: string; subColor: string }> = {
  "no-stress": { bg: "#eef8f1", border: "#cde9d6", dotOuter: "#e7f6ee", dotInner: "#10b981", label: "No thermal stress", labelColor: "#15824c", subColor: "#3d6b50" },
  watch:       { bg: "#fefce8", border: "#fde68a", dotOuter: "#fef9c3", dotInner: "#ca8a04", label: "Thermal watch",     labelColor: "#92400e", subColor: "#78350f" },
  warning:     { bg: "#fffbeb", border: "#fcd34d", dotOuter: "#fef3c7", dotInner: "#d97706", label: "Thermal warning",   labelColor: "#92400e", subColor: "#78350f" },
  "alert-1":   { bg: "#fef2f2", border: "#fecaca", dotOuter: "#fee2e2", dotInner: "#ef4444", label: "Bleaching alert 1", labelColor: "#b91c1c", subColor: "#991b1b" },
  "alert-2":   { bg: "#fef2f2", border: "#fca5a5", dotOuter: "#fee2e2", dotInner: "#dc2626", label: "Bleaching alert 2", labelColor: "#991b1b", subColor: "#7f1d1d" },
};

// ---------------------------------------------------------------------------
// Static generation + metadata
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getAllLocations().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) return { title: "Location not found" };
  const metadataImageUrl = underwaterPhotoUrl(location.heroImageUrl);
  const title = `${location.name}, ${location.country}`;
  const description = location.description.slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: `/locations/${location.slug}` },
    openGraph: {
      title,
      description,
      url: `/locations/${location.slug}`,
      type: "article",
      images: [{ url: metadataImageUrl }],
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) notFound();

  const sites = getSitesByLocationId(location.id);
  const reefHealth = getReefHealthByLocationId(location.id)[0] ?? null;
  const reefPressure = getReefPressureByLocationId(location.id);
  const waterQuality = getWaterQualityByLocationId(location.id);
  const coralCover = getCoralCoverForLocation(location.id);
  const fishingPressure = getFishingPressureForLocation(location.id);
  const details = getLocationDetailsById(location.id);
  const encounters = getEncountersByLocationId(location.id);

  const bestMonthsSet = new Set(location.bestMonths);
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isInSeason = bestMonthsSet.has(currentMonth);

  const atlasLoc = buildAtlasLocation(location);
  const isWitnessing = atlasLoc.state === "change";
  const statePill = STATE_PILL_STYLE[atlasLoc.state];
  const stateColor = STATE_COLOR[atlasLoc.state];

  // Aggregate sightings across all child sites
  const allSightings = sites
    .flatMap((s) =>
      getSightingsBySiteId(s.id).map((sv) => ({
        ...sv,
        siteName: s.name,
        siteSlug: s.slug,
      })),
    )
    .filter((sv) => sv.lastConfirmedAt !== null)
    .sort((a, b) => {
      const da = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : 0;
      const db = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 10);

  // Most recent sighting
  const latestSighting = allSightings[0] ?? null;
  const latestDays = latestSighting ? daysSince(latestSighting.lastConfirmedAt) : null;

  // Dedupe species for the highlights strip (up to 6)
  const highlightedSpecies = allSightings
    .reduce<typeof allSightings>((acc, sv) => {
      if (!acc.find((x) => x.speciesCommon === sv.speciesCommon)) acc.push(sv);
      return acc;
    }, [])
    .slice(0, 6);

  // Per-site headline sighting (most recent confirmed per site)
  const siteHeadlineSighting = new Map<string, (typeof allSightings)[number]>();
  for (const sv of allSightings) {
    if (!siteHeadlineSighting.has(sv.siteId)) {
      siteHeadlineSighting.set(sv.siteId, sv);
    }
  }

  // Getting-there from first site that has data
  const getThere = sites.map((s) => s.getThere).find((t) => t && t.trim().length > 0);

  // Partner links
  const lodging = dedupePartnerLinks(sites.flatMap((s) => s.lodging));
  const operators = dedupePartnerLinks(sites.flatMap((s) => s.operators));

  // Reef health derived values
  const observed = reefHealth?.observed ?? null;
  const thermal = reefHealth?.thermalStress ?? null;
  const coverNow = observed?.coralCoverPercent ?? null;
  const coverBefore = observed?.historicalCoralCoverPercent ?? null;
  const surveyYear = observed?.surveyDate
    ? new Date(observed.surveyDate + "T00:00:00Z").getUTCFullYear()
    : null;
  const historicalYear = observed?.historicalSurveyDate
    ? new Date(observed.historicalSurveyDate + "T00:00:00Z").getUTCFullYear()
    : null;
  const coverTrend =
    coverNow !== null && coverBefore !== null
      ? Math.round((coverNow - coverBefore) * 10) / 10
      : null;

  const lastSurveyDays = getLastSurveyDays(location.id);
  const freshData = lastSurveyDays !== null ? freshness(lastSurveyDays) : null;
  const lastSurveyMonths =
    lastSurveyDays !== null ? Math.round(lastSurveyDays / 30) : null;

  const fishingPressureLevel = reefPressure?.fishingPressure ?? null;
  const fish = FISHING_SIGNAL[fishingPressureLevel ?? "unknown"] ?? FISHING_SIGNAL.unknown;

  // Thermal sidebar badge
  const thermalAlert = thermal?.alertLevel ?? "no-stress";
  const thermalBadge = THERMAL_BADGE[thermalAlert];

  // StatStrip items
  const statItems = [
    {
      label: "Dive sites",
      value: `${sites.length} curated`,
    },
    {
      label: "Reef state",
      value: STATE_TEXT[atlasLoc.state],
      valueStyle: { color: stateColor },
    },
    ...(atlasLoc.cover
      ? [
          {
            label: "Coral cover",
            value: atlasLoc.cover,
            note: atlasLoc.coverYear ? `Most recent survey · ${atlasLoc.coverYear}` : undefined,
          },
        ]
      : []),
    {
      label: "Species tracked",
      value: `${highlightedSpecies.length > 0 ? `${allSightings.length}+` : "—"}`,
    },
    {
      label: "Best season",
      value: bestMonthsText(location.bestMonths),
      note: isInSeason ? "In season now" : undefined,
      noteStyle: isInSeason ? { color: "#10b981" } : undefined,
    },
    ...(latestSighting
      ? [
          {
            label: "Last sighting",
            value: fmtRelative(latestDays, latestSighting.lastConfirmedAt),
            valueStyle: latestDays !== null && latestDays <= 30 ? { color: "#10b981" } : undefined,
            note: latestSighting.speciesCommon,
          },
        ]
      : []),
  ];

  return (
    <>
      <JsonLd data={locationSchema(location, sites.length)} />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        style={{
          position: "relative",
          height: "68vh",
          minHeight: 520,
          overflow: "hidden",
        }}
      >
        {/* Ocean gradient background */}
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(155deg,#041c33 0%,#063a52 20%,#065a70 40%,#087a8a 58%,#0a9a88 75%,#0a8070 100%)",
          }}
        />
        {/* Shimmer texture */}
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
            height: 300,
            background: "linear-gradient(to bottom,transparent,#fff)",
          }}
        />
        {/* Photo credit top-right */}
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
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Photo · {location.name}
        </div>
        {/* Hero content: pill + H1 + subtitle */}
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
          {/* State pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 1rem",
              borderRadius: 999,
              background: statePill.bg,
              border: `1px solid ${statePill.border}`,
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: statePill.color,
              marginBottom: "1rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: statePill.color,
                flexShrink: 0,
              }}
              aria-hidden
            />
            {STATE_TEXT[atlasLoc.state]}
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem,5vw,4.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: "#0f172a",
            }}
          >
            {location.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif),'Source Serif 4',Georgia,serif",
              fontStyle: "italic",
              fontSize: "1.05rem",
              color: "#64748b",
              marginTop: "0.75rem",
              lineHeight: 1.6,
            }}
          >
            {location.country}
            {location.region ? ` · ${location.region}` : ""}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* STAT STRIP                                                           */}
      {/* ------------------------------------------------------------------ */}
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
          {statItems.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                padding: "1.125rem 2rem",
                borderRight: i < statItems.length - 1 ? "1px solid #e2e8f0" : "none",
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
                {stat.label}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  ...(("valueStyle" in stat && stat.valueStyle) ? stat.valueStyle : {}),
                }}
              >
                {stat.value}
              </span>
              {stat.note ? (
                <span
                  style={{
                    fontSize: "0.6875rem",
                    color: "#64748b",
                    whiteSpace: "nowrap",
                    ...(("noteStyle" in stat && stat.noteStyle) ? stat.noteStyle : {}),
                  }}
                >
                  {stat.note}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BODY                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "4rem 3rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: "4rem",
            alignItems: "start",
          }}
          className="location-body-grid"
        >

          {/* ============================================================== */}
          {/* LEFT COLUMN                                                      */}
          {/* ============================================================== */}
          <div>

            {/* Witnessing change honest label */}
            {isWitnessing && (
              <div
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem 1.25rem",
                  borderRadius: "0.875rem",
                  border: "1px solid #fecdd3",
                  background: "#fff1f2",
                }}
              >
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#be123c", lineHeight: 1.6 }}>
                  This reef is experiencing documented loss. Survey data, depth, and species records are current.
                </p>
              </div>
            )}

            {/* Editorial hook — before reef science for thriving/pressure, after for witnessing */}
            {!isWitnessing && (details?.extendedDescription) ? (
              <div style={{ paddingTop: "2.5rem", paddingBottom: "1.25rem" }}>
                <EditorialHook text={details.extendedDescription} />
              </div>
            ) : null}

            {/* ------------------------------------------------------------ */}
            {/* SPECIES HIGHLIGHTS STRIP                                       */}
            {/* ------------------------------------------------------------ */}
            {highlightedSpecies.length > 0 ? (
              <section style={{ marginBottom: "2.5rem", marginTop: !isWitnessing && details?.extendedDescription ? "1.5rem" : "2.5rem" }}>
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
                  What you&apos;ll find here
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#0f172a",
                    marginBottom: "1.25rem",
                  }}
                >
                  Notable species across all sites
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: "0.75rem",
                  }}
                >
                  {highlightedSpecies.map((sv, i) => {
                    const days = daysSince(sv.lastConfirmedAt);
                    const dot = dotColor(days);
                    const relDate = fmtRelative(days, sv.lastConfirmedAt);
                    const iucn = IUCN_ENABLED ? getIucnStatus(sv.speciesScientific) : null;
                    const badgeStyle = iucn ? IUCN_BADGE[iucn.category] : null;
                    const siteLink = sv.siteSlug ? `/sites/${sv.siteSlug}` : null;
                    const CardEl = siteLink ? Link : "div";
                    return (
                      <CardEl
                        key={`${sv.speciesCommon}-${i}`}
                        // @ts-expect-error polymorphic href
                        href={siteLink ?? undefined}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "1rem",
                          overflow: "hidden",
                          textDecoration: "none",
                          color: "inherit",
                          display: "block",
                        }}
                      >
                        {/* Species image gradient */}
                        <div
                          style={{
                            height: 88,
                            background: OCEAN_GRADIENTS[i % OCEAN_GRADIENTS.length],
                          }}
                        />
                        <div style={{ padding: "0.75rem" }}>
                          <p
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              color: "#0f172a",
                              marginBottom: "0.2rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {sv.speciesCommon}
                            {badgeStyle && iucn ? (
                              <span
                                style={{
                                  display: "inline-block",
                                  fontSize: "0.5rem",
                                  fontWeight: 700,
                                  letterSpacing: "0.06em",
                                  textTransform: "uppercase",
                                  padding: "0.15rem 0.4rem",
                                  borderRadius: 3,
                                  background: badgeStyle.bg,
                                  color: badgeStyle.color,
                                  flexShrink: 0,
                                }}
                              >
                                {iucn.category}
                              </span>
                            ) : null}
                          </p>
                          {sv.speciesScientific ? (
                            <p
                              style={{
                                fontSize: "0.6875rem",
                                fontStyle: "italic",
                                color: "#64748b",
                                marginBottom: "0.4rem",
                              }}
                            >
                              {sv.speciesScientific}
                            </p>
                          ) : null}
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
                                background: dot,
                                flexShrink: 0,
                              }}
                            />
                            {relDate}{sv.siteName ? ` · ${sv.siteName}` : ""}
                          </p>
                        </div>
                      </CardEl>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* ------------------------------------------------------------ */}
            {/* REEF SCIENCE PANEL                                             */}
            {/* ------------------------------------------------------------ */}
            {reefHealth ? (
              <ReefSciencePanel
                record={reefHealth}
                reefPressure={reefPressure}
                waterQuality={waterQuality}
                coralCoverSnapshot={coralCover}
                fishingPressure={fishingPressure}
                lastSurveyDays={lastSurveyDays}
                lastSurveyMonths={lastSurveyMonths}
                gfwLastBuiltAt={getFishingPressureLastBuiltAt()}
                atlasState={atlasLoc.state}
                coverNow={coverNow}
                coverBefore={coverBefore}
                surveyYear={surveyYear}
                historicalYear={historicalYear}
                coverTrend={coverTrend}
                fish={fish}
                freshData={freshData}
                thermal={thermal}
              />
            ) : (
              <UnknownReefHealthPanel />
            )}

            {/* Editorial hook AFTER reef science for witnessing change */}
            {isWitnessing && details?.extendedDescription ? (
              <div style={{ margin: "2rem 0" }}>
                <EditorialHook text={details.extendedDescription} />
              </div>
            ) : null}

            {/* ------------------------------------------------------------ */}
            {/* DIVE SITES LIST                                                */}
            {/* ------------------------------------------------------------ */}
            {sites.length > 0 ? (
              <section id="sites" style={{ marginTop: "2.5rem", marginBottom: "2.5rem" }}>
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
                  Dive sites at this location
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#0f172a",
                    marginBottom: "1.25rem",
                  }}
                >
                  {sites.length} curated {sites.length === 1 ? "site" : "sites"}
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {sites.map((s, i) => {
                    const headline = siteHeadlineSighting.get(s.id);
                    const hDays = headline ? daysSince(headline.lastConfirmedAt) : null;
                    const hDot = dotColor(hDays);
                    const hRel = headline ? fmtRelative(hDays, headline.lastConfirmedAt) : null;
                    const siteInSeason = s.bestMonths && s.bestMonths.includes(currentMonth);
                    return (
                      <Link
                        key={s.id}
                        href={`/sites/${s.slug}`}
                        style={{
                          display: "flex",
                          gap: "1.25rem",
                          alignItems: "center",
                          padding: "1rem 1.25rem",
                          borderRadius: "1.1rem",
                          border: "1px solid #e2e8f0",
                          background: "#fff",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: "0.75rem",
                            flexShrink: 0,
                            background: OCEAN_GRADIENTS[i % OCEAN_GRADIENTS.length],
                            overflow: "hidden",
                          }}
                        >
                          {s.heroImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={underwaterPhotoUrl(s.heroImageUrl)}
                              alt={s.name}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : null}
                        </div>
                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
                            {s.name}
                          </p>
                          {headline ? (
                            <p
                              style={{
                                fontSize: "0.6875rem",
                                color: "#64748b",
                                marginBottom: "0.25rem",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.375rem",
                              }}
                            >
                              <span
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: "50%",
                                  background: hDot,
                                  flexShrink: 0,
                                }}
                              />
                              {headline.speciesCommon} · last confirmed {hRel}
                            </p>
                          ) : null}
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                            <span
                              style={{
                                fontSize: "0.625rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.5rem",
                                borderRadius: 999,
                                background: "#f1f7fb",
                                color: "#64748b",
                              }}
                            >
                              {s.depthRange.min}–{s.depthRange.max} m
                            </span>
                            <span
                              style={{
                                fontSize: "0.625rem",
                                fontWeight: 600,
                                padding: "0.2rem 0.5rem",
                                borderRadius: 999,
                                background: "#f1f7fb",
                                color: "#64748b",
                                textTransform: "capitalize",
                              }}
                            >
                              {s.skillLevel.replace("-", " ")}+
                            </span>
                            {siteInSeason ? (
                              <span
                                style={{
                                  fontSize: "0.625rem",
                                  fontWeight: 600,
                                  padding: "0.2rem 0.5rem",
                                  borderRadius: 999,
                                  background: "#e7f6ee",
                                  color: "#15824c",
                                }}
                              >
                                In season now
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <span style={{ color: "#cbd5e1", fontSize: "1.25rem", flexShrink: 0 }}>→</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : (
              <section id="sites" style={{ marginTop: "2.5rem" }}>
                <div
                  style={{
                    borderRadius: "0.875rem",
                    border: "1px dashed #cbd5e1",
                    background: "#f8fafc",
                    padding: "3rem 1.5rem",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#475569" }}>
                    Dive sites for this location are still being curated.
                  </p>
                  <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
                    Browse{" "}
                    <Link href="/" style={{ color: "#0089de", fontWeight: 600 }}>
                      the atlas
                    </Link>{" "}
                    for areas with sites already mapped.
                  </p>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------ */}
            {/* LIVE SIGHTINGS FEED                                            */}
            {/* ------------------------------------------------------------ */}
            {allSightings.length > 0 ? (
              <section style={{ marginTop: "2.5rem" }}>
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
                  Live from iNaturalist
                </p>
                <h2
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    color: "#0f172a",
                    marginBottom: "1.25rem",
                  }}
                >
                  Recent sightings across all sites
                </h2>
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "1.25rem",
                    overflow: "hidden",
                    marginBottom: "1rem",
                  }}
                >
                  {allSightings.map((sv, i) => (
                    <SightingRow
                      key={`${sv.siteId}-${sv.speciesCommon}-${i}`}
                      speciesCommon={sv.speciesCommon}
                      speciesScientific={sv.speciesScientific}
                      siteName={sv.siteName}
                      date={sv.lastConfirmedAt}
                    />
                  ))}
                </div>
                <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2rem" }}>
                  Sightings from iNaturalist Research Grade observations.{" "}
                  <Link href="/data" style={{ color: "#0089de", textDecoration: "none", fontWeight: 600 }}>
                    How we verify this data →
                  </Link>
                </p>
              </section>
            ) : null}

            {/* Encounters (wildlife encounter pages) */}
            {encounters.length > 0 ? (
              <section style={{ marginTop: "2.5rem" }}>
                <div
                  style={{
                    marginBottom: "1.5rem",
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                  }}
                >
                  <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a" }}>
                    Wildlife encounters here
                  </h2>
                  <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#64748b" }}>
                    {encounters.length} encounter{encounters.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
                  {encounters.map((enc) => (
                    <li key={enc.id}>
                      <Link
                        href={`/where-to-see/${enc.slug}`}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          borderRadius: "0.875rem",
                          border: "1px solid #e2e8f0",
                          background: "#fff",
                          padding: "1rem",
                          textDecoration: "none",
                          color: "inherit",
                        }}
                      >
                        {enc.heroImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={enc.heroImageUrl}
                            alt={enc.name}
                            width={56}
                            height={56}
                            style={{ width: 56, height: 56, minWidth: 56, borderRadius: "0.5rem", objectFit: "cover" }}
                          />
                        ) : (
                          <div style={{ width: 56, height: 56, minWidth: 56, borderRadius: "0.5rem", background: "#f1f5f9" }} />
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.875rem" }}>{enc.name}</p>
                          {enc.speciesCommon ? (
                            <p style={{ marginTop: 2, fontSize: "0.75rem", color: "#64748b" }}>{enc.speciesCommon}</p>
                          ) : null}
                          <p style={{ marginTop: 4, fontSize: "0.75rem", lineHeight: 1.5, color: "#475569", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {enc.shortDescription}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* Diver quotes */}
            {details && details.quotes.length > 0 ? (
              <section style={{ marginTop: "2.5rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.025em", color: "#0f172a", marginBottom: "1.5rem" }}>
                  What divers say
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  {details.quotes.map((q, i) => (
                    <figure
                      key={i}
                      style={{ borderRadius: "1.25rem", border: "1px solid #e2e8f0", background: "#fff", padding: "1.5rem" }}
                    >
                      <blockquote
                        style={{
                          fontFamily: "var(--font-serif),'Source Serif 4',Georgia,serif",
                          fontSize: "1rem",
                          fontStyle: "italic",
                          lineHeight: 1.7,
                          color: "#1e293b",
                        }}
                      >
                        &ldquo;{q.text}&rdquo;
                      </blockquote>
                      {q.attribution ? (
                        <figcaption
                          style={{
                            marginTop: "0.75rem",
                            fontSize: "0.6875rem",
                            fontWeight: 700,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: "#64748b",
                          }}
                        >
                          — {q.attribution}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

          </div>{/* end left column */}

          {/* ============================================================== */}
          {/* RIGHT SIDEBAR                                                    */}
          {/* ============================================================== */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              position: "sticky",
              top: "1.5rem",
              alignSelf: "flex-start",
            }}
          >

            {/* Thermal alert badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.875rem",
                padding: "1rem",
                borderRadius: "0.875rem",
                border: `1px solid ${thermalBadge.border}`,
                background: thermalBadge.bg,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: thermalBadge.dotOuter,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: thermalBadge.dotInner,
                  }}
                />
              </div>
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: thermalBadge.labelColor }}>
                  {thermalBadge.label}
                </p>
                <p style={{ fontSize: "0.6875rem", color: thermalBadge.subColor, marginTop: "0.15rem" }}>
                  NOAA Coral Reef Watch · updated nightly
                </p>
              </div>
            </div>

            {/* Best season calendar */}
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: "1.25rem",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.125rem 1.375rem",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f1f7fb",
                }}
              >
                <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a" }}>Best season</p>
              </div>
              <div style={{ padding: "1.25rem 1.375rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6,1fr)",
                    gap: "0.375rem",
                  }}
                >
                  {MONTH_NAMES.map((m, i) => {
                    const monthNum = i + 1;
                    const on = bestMonthsSet.has(monthNum);
                    const now = monthNum === currentMonth;
                    return (
                      <div
                        key={m}
                        title={on ? "Peak season" : "Off season"}
                        style={{
                          padding: "0.375rem 0.25rem",
                          textAlign: "center",
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          borderRadius: "0.375rem",
                          background: on ? "#e7f6ee" : "#f1f7fb",
                          color: on ? "#15824c" : "#64748b",
                          outline: now ? "2px solid #0089de" : undefined,
                          outlineOffset: now ? 1 : undefined,
                        }}
                      >
                        {m}
                      </div>
                    );
                  })}
                </div>
                {details?.seasonNotes ? (
                  <p style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.55 }}>
                    {details.seasonNotes}
                  </p>
                ) : (
                  <p style={{ marginTop: "0.875rem", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.55 }}>
                    Peak months highlighted. Current month outlined in blue.
                  </p>
                )}
              </div>
            </div>

            {/* Trip planning CTA */}
            <div
              style={{
                background: "#0b1e32",
                borderRadius: "1.25rem",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "0.75rem",
                }}
              >
                Plan a trip
              </p>
              <h3
                style={{
                  fontSize: "1.0625rem",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-0.02em",
                  marginBottom: "0.5rem",
                }}
              >
                {isWitnessing ? "Plan thoughtfully" : "Operators, lodges & liveaboards"}
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.45)",
                  marginBottom: "1.25rem",
                }}
              >
                {isWitnessing
                  ? "Choose operators committed to reef monitoring and low-impact diving."
                  : "Curated operators with real diver reviews, not commission rankings. Includes budget and luxury options."}
              </p>
              {operators.length > 0 ? (
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", textAlign: "left" }}>
                  {operators.slice(0, 3).map((op) => (
                    <li key={`${op.partner}-${op.label}`}>
                      <AffiliateLink
                        url={op.url || "#"}
                        event="operator_click"
                        partner={op.partner}
                        query={op.label}
                        productId={op.productId}
                        siteId={location.id}
                        isAffiliate={op.isAffiliate}
                        className="flex items-center justify-between rounded-lg px-3.5 py-2 text-[13px] font-medium no-underline opacity-80 hover:opacity-100 transition-opacity"
                      >
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{op.label}</span>
                        <span style={{ color: "rgba(255,255,255,0.3)" }}>→</span>
                      </AffiliateLink>
                    </li>
                  ))}
                </ul>
              ) : null}
              <a
                href={`https://www.padi.com/dive-shop-search?q=${encodeURIComponent(location.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.75rem",
                  background: "#0089de",
                  color: "#fff",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                See trip options →
              </a>
            </div>

            {/* Getting there */}
            {getThere ? (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "1.125rem 1.375rem",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f1f7fb",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a" }}>Getting there</p>
                </div>
                <div style={{ padding: "1.25rem 1.375rem" }}>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "#334155" }}>
                    {getThere}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Lodging (if available) */}
            {lodging.length > 0 ? (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "1.125rem 1.375rem",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f1f7fb",
                  }}
                >
                  <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0f172a" }}>Where to stay</p>
                </div>
                <div style={{ padding: "1.25rem 1.375rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {lodging.slice(0, 4).map((l) => (
                    <AffiliateLink
                      key={`${l.partner}-${l.label}`}
                      url={l.url || "#"}
                      event="lodging_click"
                      partner={l.partner}
                      query={l.label}
                      productId={l.productId}
                      siteId={location.id}
                      isAffiliate={l.isAffiliate}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 no-underline transition hover:border-[#0089de]/40"
                    >
                      <span>{l.label}</span>
                      <span style={{ color: "#94a3b8" }}>→</span>
                    </AffiliateLink>
                  ))}
                </div>
              </div>
            ) : null}

          </aside>{/* end sidebar */}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* FOOTER                                                               */}
      {/* ------------------------------------------------------------------ */}
      <footer style={{ background: "#0b1e32", padding: "4rem 3rem 3rem" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "3rem",
              paddingBottom: "3rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Column 1: logo + tagline */}
            <div>
              <Link
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  textDecoration: "none",
                  marginBottom: "1rem",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="16" fill="#0089de"/>
                  <path d="M5 20 Q9 14 14 17 Q18 20 22 15 Q26 10 31 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M5 25 Q9 20 13 22 Q17 24 21 20 Q25 16 31 21" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 300, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)" }}>scuba</span>
                  <span style={{ fontSize: "1.05rem", fontWeight: 900, letterSpacing: "-0.05em", color: "#fff" }}>Season.fun</span>
                </div>
              </Link>
              <p
                style={{
                  fontFamily: "var(--font-serif),'Source Serif 4',Georgia,serif",
                  fontSize: "0.875rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.35)",
                  maxWidth: 260,
                }}
              >
                A data atlas for the living ocean. Science-backed, honestly labeled, free to read.
              </p>
            </div>
            {/* Column 2: site links */}
            <div>
              <p
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: "1.25rem",
                }}
              >
                Site
              </p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {[
                  { href: "/", label: "Atlas" },
                  { href: "/data", label: "Method" },
                  { href: "/about", label: "About" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 500 }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {/* Column 3: get in touch */}
            <div>
              <p
                style={{
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: "1.25rem",
                }}
              >
                Get in touch
              </p>
              <a
                href="mailto:hello@scubaseason.fun"
                style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#0089de", textDecoration: "none", display: "block", marginBottom: "0.875rem" }}
              >
                hello@scubaseason.fun
              </a>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "rgba(255,255,255,0.3)" }}>
                Spotted wrong data? Want to collaborate? All of it welcome.
              </p>
            </div>
          </div>
          <div
            style={{
              paddingTop: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
              © {new Date().getFullYear()} scubaSeason.fun
            </p>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)" }}>
              Thermal data: NOAA Coral Reef Watch v3.1 · refreshed nightly
            </p>
          </div>
        </div>
      </footer>

      {/* Responsive: collapse sidebar below 1024px */}
      <style>{`
        @media (max-width: 1024px) {
          .location-body-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 768px) {
          .location-body-grid {
            padding: 2rem 1.25rem !important;
          }
        }
      `}</style>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reef Science Panel
// ---------------------------------------------------------------------------

function ReefSciencePanel({
  record,
  reefPressure,
  waterQuality,
  coralCoverSnapshot,
  fishingPressure,
  lastSurveyDays,
  lastSurveyMonths,
  gfwLastBuiltAt,
  atlasState,
  coverNow,
  coverBefore,
  surveyYear,
  historicalYear,
  coverTrend,
  fish,
  freshData,
  thermal,
}: {
  record: NonNullable<ReturnType<typeof getReefHealthByLocationId>>[number];
  reefPressure: ReturnType<typeof getReefPressureByLocationId>;
  waterQuality: ReturnType<typeof getWaterQualityByLocationId>;
  coralCoverSnapshot: ReturnType<typeof getCoralCoverForLocation>;
  fishingPressure: ReturnType<typeof getFishingPressureForLocation>;
  lastSurveyDays: number | null;
  lastSurveyMonths: number | null;
  gfwLastBuiltAt: string;
  atlasState: "thriving" | "pressure" | "change";
  coverNow: number | null;
  coverBefore: number | null;
  surveyYear: number | null;
  historicalYear: number | null;
  coverTrend: number | null;
  fish: { label: string; tone: "good" | "ok" | "warn" | "bad" | "neutral" };
  freshData: ReturnType<typeof freshness> | null;
  thermal: NonNullable<ReturnType<typeof getReefHealthByLocationId>>[number]["thermalStress"] | null;
}) {
  const observed = record.observed;
  const thermalAlert = thermal?.alertLevel ?? "no-stress";

  // Fishing pressure badge
  const gfwTrend =
    fishingPressure?.historical && fishingPressure.historical.fishingHours > 0
      ? Math.round(
          ((fishingPressure.current.fishingHours - fishingPressure.historical.fishingHours) /
            fishingPressure.historical.fishingHours) *
            100,
        )
      : null;
  const fishingNote =
    gfwTrend !== null && fishingPressure
      ? `Visible fishing ${gfwTrend > 0 ? `up ${gfwTrend}%` : gfwTrend < 0 ? `down ${Math.abs(gfwTrend)}%` : "flat"} vs ${fishingPressure.historical!.year}. Global Fishing Watch · ${fishingPressure.current.year}.`
      : fishingPressure
        ? `Global Fishing Watch · ${fishingPressure.current.year}.`
        : "Visible fishing activity near the reef from satellite tracking.";

  const mpa = reefPressure
    ? MPA_STATUS[reefPressure.mpaStatus] ?? MPA_STATUS["no-protection"]
    : null;
  const mpaNote =
    reefPressure && reefPressure.mpaName
      ? `${reefPressure.mpaName}${reefPressure.mpaSinceYear ? ` · since ${reefPressure.mpaSinceYear}` : ""}`
      : mpa ? mpa.copy : null;

  const WQ_ORDER: Record<string, number> = { watch: 1, concerning: 2, severe: 3 };
  const worstEvent =
    waterQuality && waterQuality.events.length > 0
      ? [...waterQuality.events].sort((a, b) => (WQ_ORDER[b.severity] ?? 0) - (WQ_ORDER[a.severity] ?? 0))[0]
      : null;
  const wqSignal = worstEvent
    ? {
        value: WQ_SEVERITY_LABEL[worstEvent.severity] ?? worstEvent.severity,
        tone: worstEvent.severity === "severe" ? ("bad" as const) : worstEvent.severity === "concerning" ? ("warn" as const) : ("ok" as const),
        note: worstEvent.title,
      }
    : waterQuality?.microplasticsLevel
      ? {
          value: WQ_MICROPLASTICS_LABEL[waterQuality.microplasticsLevel],
          tone:
            waterQuality.microplasticsLevel === "very-high" ? ("bad" as const) :
            waterQuality.microplasticsLevel === "high" ? ("warn" as const) :
            waterQuality.microplasticsLevel === "moderate" ? ("ok" as const) :
            ("good" as const),
          note: "Ambient microplastics in the water column.",
        }
      : null;

  // Trend box style
  const trendIsUp = coverTrend !== null && coverTrend > 0;
  const trendStyle = trendIsUp
    ? { bg: "#e7f6ee", border: "#a7f3d0", color: "#065f46" }
    : coverTrend !== null && coverTrend < 0
      ? { bg: "#fef2f2", border: "#fecaca", color: "#b91c1c" }
      : { bg: "#f1f7fb", border: "#e2e8f0", color: "#334155" };

  const methods = record.methodologyClaimIds
    .map(getMethodologyByClaimId)
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const sourceIds = Array.from(
    new Set([
      ...(observed?.sourceIds ?? []),
      ...(thermal?.sourceIds ?? []),
      ...(record.projection?.sourceIds ?? []),
      ...methods.flatMap((m) => m.sourceIds),
    ]),
  );
  const sources = sourceIds
    .map(getSourceById)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const reefState = getReefState(record.locationId ?? "");
  const statePillStyle = STATE_PILL_STYLE[reefState];

  // Pressure badge helper
  const pb = (tone: string) => PRESSURE_BADGE[tone] ?? PRESSURE_BADGE.neutral;

  // Projection
  const proj = computeCoverProjection({ coverNow, coverBefore, surveyYear, historicalYear });

  return (
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
        Reef science
      </p>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#0f172a",
          marginBottom: "1.25rem",
        }}
      >
        What the data says
      </h2>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            background: "#f1f7fb",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
            Coral cover — live coral as % of seafloor
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: freshData?.k === "fresh" ? "#15a05c" : freshData?.k === "stale" ? "#f59e0b" : "#94a3b8",
                flexShrink: 0,
              }}
            />
            {lastSurveyMonths !== null
              ? `Last survey ${lastSurveyMonths} month${lastSurveyMonths === 1 ? "" : "s"} ago`
              : observed?.surveyDate
                ? `Last survey ${formatSurveyDate(observed.surveyDate)}`
                : "Survey date unknown"}
          </div>
        </div>

        <div style={{ padding: "1.5rem" }}>
          {/* Coral cover bars */}
          {coverNow !== null ? (
            <>
              {coverBefore !== null ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>
                      A decade ago{historicalYear ? ` · ${historicalYear}` : ""}
                    </span>
                    <span style={{ fontSize: "1.125rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
                      {coverBefore}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(0, Math.min(100, coverBefore))}%`,
                        borderRadius: 4,
                        background: "#10b981",
                        opacity: 0.4,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b" }}>
                    Most recent{surveyYear ? ` · ${surveyYear}` : ""}
                  </span>
                  <span
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: coverTrend !== null && coverTrend > 0 ? "#10b981" : "#0f172a",
                    }}
                  >
                    {coverNow}%
                  </span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: "#e2e8f0", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(0, Math.min(100, coverNow))}%`,
                      borderRadius: 4,
                      background: "#10b981",
                    }}
                  />
                </div>
              </div>

              {/* Trend callout */}
              {coverTrend !== null ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginTop: "0.875rem",
                    padding: "0.625rem 0.875rem",
                    borderRadius: "0.75rem",
                    background: trendStyle.bg,
                    border: `1px solid ${trendStyle.border}`,
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", color: trendStyle.color, fontWeight: 500 }}>
                    {coverTrend > 0
                      ? `↑ Cover has increased since ${historicalYear ?? "the historical survey"} — one of the few locations on this atlas showing genuine recovery.`
                      : coverTrend < 0
                        ? `↓ Cover has declined by ${Math.abs(coverTrend)} points since ${historicalYear ?? "the historical survey"}.`
                        : "→ Cover is holding steady since the historical survey."}
                  </span>
                </div>
              ) : null}

              {/* Doom projection for declining cover */}
              {proj ? (
                <p
                  style={{
                    marginTop: "0.75rem",
                    borderRadius: "0.625rem",
                    background: "#fef2f2",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.75rem",
                    lineHeight: 1.5,
                    color: "#991b1b",
                  }}
                >
                  <strong>On current trend, no live coral by about {proj.zeroYear}.</strong>{" "}
                  Losing roughly {proj.perYear}% cover per year.
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>No coral cover survey on file for this location.</p>
          )}

          {/* 2x2 pressure grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "1.5rem",
            }}
          >
            {/* Fishing pressure */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                Fishing pressure
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.625rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  background: pb(fish.tone).bg,
                  color: pb(fish.tone).color,
                }}
              >
                {fish.label}
              </span>
            </div>

            {/* Thermal stress */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                Thermal stress
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.625rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  background: pb(ALERT_TONE[thermalAlert]).bg,
                  color: pb(ALERT_TONE[thermalAlert]).color,
                }}
              >
                {thermalAlert === "no-stress" ? "No stress" : ALERT_LABEL[thermalAlert]}
              </span>
            </div>

            {/* Bleaching alert */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                Bleaching alert
              </p>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.625rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  background: pb(ALERT_TONE[thermalAlert]).bg,
                  color: pb(ALERT_TONE[thermalAlert]).color,
                }}
              >
                {thermalAlert === "no-stress" ? "No alert" : ALERT_LABEL[thermalAlert]}
              </span>
            </div>

            {/* Reef state */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.4rem" }}>
                Reef state
              </p>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.25rem 0.625rem",
                  borderRadius: 999,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  background: statePillStyle.bg,
                  color: statePillStyle.color,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: statePillStyle.color,
                    flexShrink: 0,
                  }}
                  aria-hidden
                />
                {STATE_TEXT[reefState]}
              </span>
            </div>
          </div>

          {/* Method callout */}
          <div
            style={{
              marginTop: "1.25rem",
              padding: "1rem 1.125rem",
              borderRadius: "0.875rem",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: 1 }}
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "#64748b" }}>
              Bleaching alert runs from{" "}
              <strong style={{ color: "#0f172a", fontWeight: 600 }}>
                No stress → Watch → Warning → Alert 1 → Alert 2
              </strong>
              . Reef state combines thermal data, coral cover, and fishing pressure into a single judgment.{" "}
              <Link href="/data" style={{ color: "#0089de", fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}>
                How we calculate this →
              </Link>
            </p>
          </div>

          {/* Additional context cards */}
          {record.divingOutlook ? (
            <div
              style={{
                marginTop: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #bae6fd",
                background: "#f0f9ff",
                padding: "1rem 1.125rem",
              }}
            >
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0284c7", marginBottom: "0.4rem" }}>
                What to expect on a dive
              </p>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#0c4a6e" }}>{record.divingOutlook}</p>
            </div>
          ) : null}

          {reefPressure?.visitorImpactNote ? (
            <div
              style={{
                marginTop: "1rem",
                borderRadius: "0.875rem",
                border: "1px solid #a7f3d0",
                background: "#ecfdf5",
                padding: "1rem 1.125rem",
              }}
            >
              <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#065f46", marginBottom: "0.4rem" }}>
                What you can do
              </p>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#064e3b" }}>{reefPressure.visitorImpactNote}</p>
            </div>
          ) : null}

          {/* Full methodology disclosure */}
          <HowCalculated>
            <div className="space-y-5">
              {observed ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                      Coral cover trajectory
                    </p>
                    {observed.surveyDate ? (
                      <DataFreshnessLabel
                        variant="snapshot"
                        surveyMethod={observed.surveyMethod ?? "field survey"}
                        surveyDate={observed.surveyDate}
                      />
                    ) : null}
                  </div>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                    {typeof observed.coralCoverPercent === "number" ? (
                      <li>
                        Coral cover: <strong>{observed.coralCoverPercent}%</strong> (survey{" "}
                        {formatSurveyDate(observed.surveyDate)}, {observed.surveyMethod})
                      </li>
                    ) : null}
                    {typeof observed.bleachedPercent === "number" ? (
                      <li>Bleached: <strong>{observed.bleachedPercent}%</strong></li>
                    ) : null}
                    {typeof observed.mortalityPercent === "number" ? (
                      <li>Recent mortality: <strong>{observed.mortalityPercent}%</strong></li>
                    ) : null}
                    {observed.notes ? <li>{observed.notes}</li> : null}
                  </ul>
                </div>
              ) : null}

              {coralCoverSnapshot ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Jurisdiction scale reference
                  </p>
                  <p className="mt-1.5 text-[13px] leading-6">
                    The headline coral cover above is the site survey on file. For wider context,{" "}
                    {coralCoverSnapshot.program} reports a {coralCoverSnapshot.label} mean of{" "}
                    <strong>{coralCoverSnapshot.current.coverPercent}%</strong> in{" "}
                    {coralCoverSnapshot.current.year}
                    {coralCoverSnapshot.historical
                      ? `, against ${coralCoverSnapshot.historical.coverPercent}% in ${coralCoverSnapshot.historical.year}`
                      : ""}
                    . {coralCoverSnapshot.method}.
                    {coralCoverSnapshot.notes ? ` ${coralCoverSnapshot.notes}` : ""}{" "}
                    Reported at the jurisdiction scale, not this single reef.{" "}
                    <a
                      href={coralCoverSnapshot.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0089de] hover:underline"
                    >
                      {coralCoverSnapshot.sourceLabel} →
                    </a>
                  </p>
                </div>
              ) : null}

              {thermal ? (
                <div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                      Thermal stress mechanics
                    </p>
                    {thermal.source === "noaa-crw-live" ? (
                      <DataFreshnessLabel variant="live" source="NOAA CRW" updatedAt={thermal.fetchedAt ?? thermal.asOf} />
                    ) : (
                      <DataFreshnessLabel variant="snapshot" surveyMethod="NOAA CRW (scaffolding)" surveyDate={thermal.asOf} />
                    )}
                  </div>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                    <li>
                      NOAA Coral Reef Watch alert level:{" "}
                      <strong>{ALERT_LABEL[thermal.alertLevel]}</strong> — updated {formatSurveyDate(thermal.asOf)}
                    </li>
                    {typeof thermal.degreeHeatingWeeks === "number" ? (
                      <li>Degree Heating Weeks: <strong>{thermal.degreeHeatingWeeks} °C-wk</strong></li>
                    ) : null}
                    {typeof thermal.sstAnomalyC === "number" ? (
                      <li>Sea surface temperature anomaly: <strong>+{thermal.sstAnomalyC} °C</strong></li>
                    ) : null}
                    <li>Alert scale: no stress → watch → warning → alert level 1 → alert level 2.</li>
                  </ul>
                </div>
              ) : null}

              <div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Fishing pressure method
                  </p>
                  <DataFreshnessLabel
                    variant="live"
                    source="Global Fishing Watch"
                    updatedAt={fishingPressure?.fetchedAt ?? gfwLastBuiltAt}
                  />
                </div>
                <p className="mt-1.5 text-[13px] leading-6">
                  Fishing pressure is a proxy from Global Fishing Watch satellite AIS tracking.
                </p>
                {fishingPressure ? (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                    <li>
                      Apparent fishing hours within {fishingPressure.radiusKm} km:{" "}
                      <strong>{fishingPressure.current.fishingHours.toLocaleString()} h</strong>{" "}
                      in {fishingPressure.current.year}
                      {fishingPressure.historical
                        ? `, against ${fishingPressure.historical.fishingHours.toLocaleString()} h in ${fishingPressure.historical.year}`
                        : ""}.
                    </li>
                    {reefPressure && reefPressure.topPressures.length > 0 ? (
                      <li>Dominant pressures: {reefPressure.topPressures.join(", ")}.</li>
                    ) : null}
                  </ul>
                ) : null}
                <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] leading-5 text-amber-900">
                  <strong>Important caveat.</strong> GFW only sees vessels broadcasting AIS. Small artisanal boats and any operator running dark are invisible here.
                </p>
              </div>

              {mpa ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">Protection status</p>
                  <p className="mt-1.5 text-[13px] leading-6">{mpa.copy}</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                    {reefPressure?.mpaName ? (
                      <li>
                        {reefPressure.mpaName}
                        {reefPressure.mpaSinceYear ? ` · designated ${reefPressure.mpaSinceYear}` : ""}.
                      </li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              {waterQuality && waterQuality.events.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">Pollution and water quality</p>
                  <ul className="mt-1.5 space-y-2 text-[13px] leading-6">
                    {waterQuality.events.map((e, i) => (
                      <li key={i}>
                        <strong>{e.title} ({WQ_SEVERITY_LABEL[e.severity] ?? e.severity})</strong>{" "}
                        — since {e.since}. {e.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {reefState ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">How the reef state is classified</p>
                  <p className="mt-1.5 text-[13px] leading-6">{STATE_DEF[reefState].signal}</p>
                </div>
              ) : null}

              {record.projection ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">
                    Projection · {record.projection.scenario}
                  </p>
                  <p className="mt-1.5 text-[13px] leading-6">{record.projection.statement}</p>
                  <p className="mt-1 text-[12px] text-slate-500">Uncertainty: {record.projection.uncertainty}</p>
                </div>
              ) : null}

              {methods.map((m) => (
                <div key={m.claimId}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">How we summarise this</p>
                  <p className="mt-1.5 text-[13px] leading-6">{m.limitations}</p>
                </div>
              ))}

              {sources.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0089de]">Sources</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[13px]">
                    {sources.map((src) => (
                      <li key={src.id}>
                        {src.url ? (
                          <a href={src.url} target="_blank" rel="noreferrer noopener" className="text-[#0089de] hover:underline">
                            {src.name}
                          </a>
                        ) : src.name}
                        {src.publisher ? <span className="text-slate-500"> — {src.publisher}</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </HowCalculated>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Unknown reef health
// ---------------------------------------------------------------------------

function UnknownReefHealthPanel() {
  return (
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
        Reef science
      </p>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          letterSpacing: "-0.025em",
          color: "#0f172a",
          marginBottom: "1.25rem",
        }}
      >
        No survey on file
      </h2>
      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          padding: "1.5rem",
        }}
      >
        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "#64748b" }}>
          We don&rsquo;t yet have a survey or thermal-stress record on file for this location.
          That doesn&rsquo;t mean the reef is healthy — it means we can&rsquo;t say either way.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Partner link helpers (kept for sidebar CTA / lodging blocks)
// ---------------------------------------------------------------------------

const TIER_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: "Budget",
  2: "Mid-range",
  3: "Upscale",
  4: "Luxury",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TierBadge({ level }: { level: 1 | 2 | 3 | 4 }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
      <span className="text-emerald-700">
        <span>{"$".repeat(level)}</span>
        <span className="text-slate-300">{"$".repeat(4 - level)}</span>
      </span>
      <span>{TIER_LABELS[level]}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Cover projection helper
// ---------------------------------------------------------------------------

function computeCoverProjection({
  coverNow,
  coverBefore,
  surveyYear,
  historicalYear,
}: {
  coverNow: number | null;
  coverBefore: number | null;
  surveyYear: number | null;
  historicalYear: number | null;
}): { zeroYear: number; perYear: string; yearsLeft: number } | null {
  if (coverNow === null || coverBefore === null || surveyYear === null || historicalYear === null) return null;
  const span = surveyYear - historicalYear;
  if (span <= 0) return null;
  const perYear = (coverBefore - coverNow) / span;
  if (perYear <= 0) return null;
  const yearsLeft = Math.max(1, Math.round(coverNow / perYear));
  return { zeroYear: surveyYear + yearsLeft, perYear: perYear.toFixed(1), yearsLeft };
}
