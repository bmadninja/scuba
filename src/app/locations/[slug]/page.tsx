import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SetNavBreadcrumb } from "@/components/set-nav-breadcrumb";
import { AffiliateLink } from "@/components/affiliate-link";
import { JsonLd } from "@/components/json-ld";
import { underwaterPhotoUrl } from "@/lib/photo-quality";
import { locationSchema } from "@/lib/schema-org";
import { getAllLocations, getLocationBySlug } from "@/lib/data/locations";
import { buildAtlasLocation } from "@/lib/atlas-location";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getGearById } from "@/lib/data/gear";
import { getLocationDetailsById } from "@/lib/data/location-details";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getReefPressureByLocationId } from "@/lib/data/reef-pressure";
import { getWaterQualityByLocationId } from "@/lib/data/water-quality";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { getFishingPressureForLocation } from "@/lib/data/fishing-pressure";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { EditorialHook } from "@/components/editorial-hook";
import { STATE_TEXT, freshness, getLastSurveyDays, bestMonthsText, STATE_COLOR } from "@/lib/data/reef-state";
import { InfoTooltip } from "@/components/info-tooltip";
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

const THERMAL_PLAIN: Record<BleachingAlertLevel, { label: string; desc: string; color: string }> = {
  "no-stress": { label: "Normal",        desc: "no thermal stress",                              color: "#065f46" },
  watch:       { label: "Watch",         desc: "sea temp above normal, no active bleaching",     color: "#92400e" },
  warning:     { label: "Warning",       desc: "elevated heat stress, bleaching risk elevated",  color: "#b45309" },
  "alert-1":   { label: "Alert Level 1", desc: "active bleaching likely",                        color: "#b91c1c" },
  "alert-2":   { label: "Alert Level 2", desc: "severe bleaching in progress",                   color: "#991b1b" },
};

function getSpeciesIcon(name: string): string {
  const n = name.toLowerCase();
  if (/shark|ray|skate|manta|sawfish/.test(n)) return "🦈";
  if (/turtle|tortoise/.test(n)) return "🐢";
  if (/whale|dolphin|porpoise|dugong|manatee/.test(n)) return "🐬";
  if (/octopus|squid|cuttlefish/.test(n)) return "🐙";
  return "🐠";
}

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
  if (days < 365) { const m = Math.floor(days / 30); return `${m} ${m === 1 ? "month" : "months"} ago`; }
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

type BasicKitItem = { icon: string; name: string; note: string; gearId?: string };

// Map a region's coldest water temperature to a correct wetsuit recommendation.
// Accuracy is mandatory — a wrong thickness breaks trust (§4.14). Returns the
// matching basic-tier gearId when one exists so the Shop link resolves.
function wetsuitForTemp(minTempC: number | null): {
  name: string;
  note: string;
  gearId?: string;
} {
  if (minTempC === null) {
    return {
      name: "Wetsuit",
      note: "Match thickness to the water temperature on the day. Operators can advise.",
    };
  }
  if (minTempC >= 28) {
    return {
      name: "3mm shorty or dive skin",
      note: `Matched to warm ${minTempC}°C water — light exposure protection is plenty.`,
      gearId: "wetsuit-bare-3mm-full",
    };
  }
  if (minTempC >= 24) {
    return {
      name: "3mm full wetsuit",
      note: `Matched to ${minTempC}°C water — a full 3mm keeps you comfortable across a day of diving.`,
      gearId: "wetsuit-bare-3mm-full",
    };
  }
  if (minTempC >= 19) {
    return {
      name: "5mm full wetsuit",
      note: `Matched to cooler ${minTempC}°C water — a 5mm with hood and gloves on the colder dives.`,
    };
  }
  return {
    name: "7mm wetsuit or drysuit",
    note: `Matched to cold ${minTempC}°C water — a 7mm semidry or a drysuit, plus hood and gloves.`,
  };
}

// Decorative emoji for a site-specific gear item, inferred from its name.
function siteGearIcon(name: string): string {
  const n = name.toLowerCase();
  if (/reef hook/.test(n)) return "🪝";
  if (/smb|surface marker|buoy/.test(n)) return "🎈";
  if (/reel/.test(n)) return "🧵";
  if (/light|torch/.test(n)) return "🔦";
  if (/glove/.test(n)) return "🧤";
  if (/hood/.test(n)) return "🥽";
  if (/camera/.test(n)) return "📷";
  if (/patience|respect/.test(n)) return "🧘";
  if (/computer/.test(n)) return "⌚";
  if (/knife|cutting/.test(n)) return "🔪";
  return "🌊";
}

// Resolve a gearId to its Amazon product URL + partner for an AffiliateLink.
function gearShopLink(gearId?: string): { url: string; partner: string; productId?: string; isAffiliate: boolean } | null {
  if (!gearId) return null;
  const g = getGearById(gearId);
  if (!g) return null;
  const amazon = g.partners.find((p) => p.partner === "amazon") ?? g.partners[0];
  if (!amazon) return null;
  return { url: amazon.url, partner: amazon.partner, productId: amazon.productId, isAffiliate: true };
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
  const bestMonthsSet = new Set(location.bestMonths);
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isInSeason = bestMonthsSet.has(currentMonth);

  const atlasLoc = buildAtlasLocation(location);
  const isWitnessing = atlasLoc.state === "change";

  // Hero photo: borrowed underwater photo from the location's own sites
  // (computed in atlas-location.ts), falling back through underwaterPhotoUrl()
  // to a real underwater placeholder — never a bare gradient as the surface.
  const heroPhotoUrl = underwaterPhotoUrl(atlasLoc.heroImageUrl);
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
  const getThereStructured = sites.map((s) => s.getThereStructured).find((t) => Boolean(t)) ?? null;

  // Partner links
  const lodging = dedupePartnerLinks(sites.flatMap((s) => s.lodging));
  const operators = dedupePartnerLinks(sites.flatMap((s) => s.operators));

  // --- Plan your trip data shaping (§4.13a) -----------------------------
  // Operators render ONLY when backed by a real/affiliate URL. A synthesized
  // generic search (dive-shop-search) or a bare homepage is not a real lead.
  const isGenericSearchUrl = (url: string) =>
    !url || url.includes("dive-shop-search") || url.includes("/dive-shop");
  const realOperators = operators.filter(
    (op) => op.isAffiliate || !isGenericSearchUrl(op.url),
  );
  // Lodging split: liveaboards that cover diving sit in "Where to stay" with a
  // "stay + dive" tag and suppress a redundant separate operator (a liveaboard
  // IS the dive op).
  const liveaboards = lodging.filter((l) => l.kind === "liveaboard");
  const hasDiveCapableLodging = liveaboards.length > 0;
  const stayItems = lodging.slice(0, 4).map((l) => ({
    ...l,
    isLiveaboard: l.kind === "liveaboard",
  }));
  // When a dive-capable liveaboard is present, suppress the operators peer
  // group (the liveaboard already covers the diving).
  const operatorsToShow = hasDiveCapableLodging ? [] : realOperators.slice(0, 4);
  const hasWhatToBook = stayItems.length > 0 || operatorsToShow.length > 0;

  // --- Gear section data (§4.14) ---------------------------------------
  // Region water temperature across the location's sites → wetsuit thickness.
  const allTemps = sites.flatMap((s) =>
    s.conditionsByMonth.flatMap((c) => [c.waterTempC.min, c.waterTempC.max]),
  );
  const minWaterTemp = allTemps.length > 0 ? Math.min(...allTemps) : null;
  const wetsuit = wetsuitForTemp(minWaterTemp);

  // Layer A — basic kit for the location.
  const basicKit: BasicKitItem[] = [
    {
      icon: "🤿",
      name: "Mask and fins",
      note: "Your own well fitted mask and fins make every dive better. Rental kit is available from operators.",
      gearId: "mask-cressi-f1",
    },
    {
      icon: "🦺",
      name: "BCD and regulator",
      note: "Rental available from operators if you travel light.",
      gearId: "bcd-scubapro-hydros-pro",
    },
    {
      icon: "🌡️",
      name: wetsuit.name,
      note: wetsuit.note,
      gearId: wetsuit.gearId,
    },
    {
      icon: "⌚",
      name: "Dive computer",
      note: "Tracks depth and no decompression limits across repetitive profiles.",
      gearId: "computer-shearwater-peregrine",
    },
  ];

  // Layer B — site-specific add-ons grouped by site. Only sites with add-ons.
  const gearBySite = sites
    .map((s) => ({ site: s, items: s.siteSpecificGear }))
    .filter((g) => g.items.length > 0);
  const hasSiteGear = gearBySite.length > 0;

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
      <SetNavBreadcrumb
        items={[
          { label: "Atlas", href: "/" },
          { label: location.name },
        ]}
      />

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
        {/* Ocean gradient — decorative base layer UNDER the photo only */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(155deg,#041c33 0%,#063a52 20%,#065a70 40%,#087a8a 58%,#0a9a88 75%,#0a8070 100%)",
          }}
        />
        {/* Borrowed underwater photo — the visible hero surface (§5.5a) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroPhotoUrl}
          alt={`Underwater reef at ${location.name}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Dark legibility overlay — keeps white hero content ≥4.5:1 on any photo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(4,18,32,0.15) 0%,rgba(4,18,32,0.05) 35%,rgba(4,18,32,0.45) 72%,rgba(4,18,32,0.82) 100%)",
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
              color: "#fff",
              textShadow: "0 2px 18px rgba(4,18,32,0.5)",
            }}
          >
            {location.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-serif),'Source Serif 4',Georgia,serif",
              fontStyle: "italic",
              fontSize: "1.05rem",
              color: "rgba(255,255,255,0.92)",
              marginTop: "0.75rem",
              lineHeight: 1.6,
              textShadow: "0 1px 12px rgba(4,18,32,0.5)",
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
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {stat.label}
                {stat.label === "Reef state" ? (
                  <InfoTooltip text="Our overall judgment of what the science says is happening on this reef. Not a star rating." />
                ) : null}
                {stat.label === "Coral cover" ? (
                  <InfoTooltip text="Percentage of the reef surface covered by live coral, from the most recent survey." />
                ) : null}
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

            {/* Editorial hook — before reef science for thriving/pressure */}
            {!isWitnessing && (details?.extendedDescription) ? (
              <div style={{ paddingTop: "2.5rem", paddingBottom: "1.25rem" }}>
                <EditorialHook text={details.extendedDescription} />
              </div>
            ) : null}

            {/* ------------------------------------------------------------ */}
            {/* SPECIES HIGHLIGHTS STRIP — thriving/pressure only             */}
            {/* (witnessing change renders this after reef science + hook)    */}
            {/* ------------------------------------------------------------ */}
            {!isWitnessing && highlightedSpecies.length > 0 ? (
              <section style={{ marginBottom: "2.5rem", marginTop: details?.extendedDescription ? "1.5rem" : "2.5rem" }}>
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
                  What you&apos;ll see here
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
                    const photoCredit = sv.speciesScientific
                      ? getSpeciesPhotoCredit(sv.speciesScientific)
                      : null;
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
                        {photoCredit?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoCredit.imageUrl.replace("/square.", "/medium.")}
                            alt={sv.speciesCommon}
                            style={{ width: "100%", height: 88, objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 88,
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "2rem",
                            }}
                          >
                            {getSpeciesIcon(sv.speciesCommon)}
                          </div>
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
                              gap: "0.4rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {sv.speciesCommon}
                            {badgeStyle && iucn ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
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
                                  }}
                                >
                                  {iucn.category}
                                </span>
                                <InfoTooltip text="Conservation status from the IUCN Red List. CR=Critically Endangered, EN=Endangered, VU=Vulnerable, NT=Near Threatened, LC=Least Concern." />
                              </span>
                            ) : null}
                          </p>
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
                            {relDate ? `Seen ${relDate}` : ""}
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
                gfwLastBuiltAt={""}
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
            {/* SPECIES HIGHLIGHTS STRIP — witnessing change only             */}
            {/* (position: after reef science + editorial hook)               */}
            {/* ------------------------------------------------------------ */}
            {isWitnessing && highlightedSpecies.length > 0 ? (
              <section style={{ marginBottom: "2.5rem", marginTop: "2.5rem" }}>
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
                  What you&apos;ll see here
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
                    const photoCredit = sv.speciesScientific
                      ? getSpeciesPhotoCredit(sv.speciesScientific)
                      : null;
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
                        {photoCredit?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photoCredit.imageUrl.replace("/square.", "/medium.")}
                            alt={sv.speciesCommon}
                            style={{ width: "100%", height: 88, objectFit: "cover", display: "block" }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 88,
                              background: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "2rem",
                            }}
                          >
                            {getSpeciesIcon(sv.speciesCommon)}
                          </div>
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
                              gap: "0.4rem",
                              flexWrap: "wrap",
                            }}
                          >
                            {sv.speciesCommon}
                            {badgeStyle && iucn ? (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
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
                                  }}
                                >
                                  {iucn.category}
                                </span>
                                <InfoTooltip text="Conservation status from the IUCN Red List. CR=Critically Endangered, EN=Endangered, VU=Vulnerable, NT=Near Threatened, LC=Least Concern." />
                              </span>
                            ) : null}
                          </p>
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
                            {relDate ? `Seen ${relDate}` : ""}
                          </p>
                        </div>
                      </CardEl>
                    );
                  })}
                </div>
              </section>
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
            {/* GEAR SECTION (§4.14) — Layer A basic kit                      */}
            {/* ------------------------------------------------------------ */}
            <section id="gear" style={{ marginTop: "2.5rem" }}>
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
                What to pack
              </p>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Gear for diving here
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#64748b", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {minWaterTemp !== null
                  ? `Basic kit matched to ${minWaterTemp}°C water.`
                  : "Basic kit for the location."}
              </p>

              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1.25rem",
                  padding: "1.5rem",
                }}
              >
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", margin: 0, padding: 0, listStyle: "none" }}>
                  {basicKit.map((item) => {
                    const shop = gearShopLink(item.gearId);
                    return (
                      <li
                        key={item.name}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          padding: "0.75rem 0.875rem",
                          borderRadius: "0.75rem",
                          background: "#f1f7fb",
                        }}
                      >
                        <span aria-hidden="true" style={{ fontSize: "1.1rem", lineHeight: 1.3, flexShrink: 0 }}>
                          {item.icon}
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ display: "block", fontSize: "0.875rem", fontWeight: 700, color: "#0f172a" }}>
                            {item.name}
                          </span>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5, marginTop: "0.1rem" }}>
                            {item.note}
                          </span>
                        </span>
                        {shop ? (
                          <a
                            href={shop.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              flexShrink: 0,
                              alignSelf: "center",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#1d5d90",
                              textDecoration: "none",
                            }}
                          >
                            Shop
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

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
                  NOAA Coral Reef Watch · updated tonight
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

            {/* ---------------------------------------------------------- */}
            {/* PLAN YOUR TRIP — one block: getting there leads, then       */}
            {/* what to book (where to stay + operators as equal peers).    */}
            {/* §4.13a. Witnessing change: muted "Plan thoughtfully".       */}
            {/* ---------------------------------------------------------- */}
            {(getThere || getThereStructured || hasWhatToBook) ? (
              <div
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: "1.25rem",
                  overflow: "hidden",
                  opacity: isWitnessing ? 0.92 : 1,
                }}
              >
                {/* Block header */}
                <div
                  style={{
                    padding: "1.125rem 1.375rem",
                    borderBottom: "1px solid #e2e8f0",
                    background: "#f1f7fb",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.5875rem",
                      fontWeight: 700,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#64748b",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Plan a trip
                  </p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.01em", color: "#0f172a" }}>
                    {isWitnessing ? "Plan thoughtfully" : "Plan your trip"}
                  </p>
                  {isWitnessing ? (
                    <p style={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.55, marginTop: "0.35rem" }}>
                      Choose operators committed to reef monitoring and low impact diving.
                    </p>
                  ) : null}
                </div>

                <div style={{ padding: "1.25rem 1.375rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                  {/* 1. GETTING THERE — leads */}
                  {(getThere || getThereStructured) ? (
                    <div>
                      <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d5d90", marginBottom: "0.75rem" }}>
                        Getting there
                      </p>
                      {getThereStructured ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                          <div>
                            <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                              Nearest hub
                            </p>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                              {getThereStructured.nearestHubName}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem", lineHeight: 1.5 }}>
                              {getThereStructured.nearestHubDescription}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                              Transfer to sites
                            </p>
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                              {getThereStructured.transferToSitesName}
                            </p>
                            <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem", lineHeight: 1.5 }}>
                              {getThereStructured.transferToSitesDescription}
                            </p>
                          </div>
                          {getThereStructured.liveaboardDescription ? (
                            <div>
                              <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                                Liveaboard option
                              </p>
                              <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.5 }}>
                                {getThereStructured.liveaboardDescription}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "#334155" }}>
                          {getThere}
                        </p>
                      )}
                    </div>
                  ) : null}

                  {/* 2. WHAT TO BOOK — where to stay + operators as equal peers */}
                  {hasWhatToBook ? (
                    <div style={{ borderTop: (getThere || getThereStructured) ? "1px solid #e2e8f0" : "none", paddingTop: (getThere || getThereStructured) ? "1.5rem" : 0, display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                      {/* Where to stay */}
                      {stayItems.length > 0 ? (
                        <div>
                          <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d5d90", marginBottom: "0.6rem" }}>
                            Where to stay
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {stayItems.map((l) => (
                              <AffiliateLink
                                key={`stay-${l.partner}-${l.label}`}
                                url={l.url || "#"}
                                event="lodging_click"
                                partner={l.partner}
                                query={l.label}
                                productId={l.productId}
                                siteId={location.id}
                                isAffiliate={l.isAffiliate}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 no-underline transition hover:border-[#0089de]/40"
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {l.label} (opens in new tab)
                                  </span>
                                  {l.isLiveaboard ? (
                                    <span
                                      style={{
                                        flexShrink: 0,
                                        fontSize: "0.5625rem",
                                        fontWeight: 700,
                                        letterSpacing: "0.04em",
                                        textTransform: "uppercase",
                                        padding: "0.1rem 0.4rem",
                                        borderRadius: 999,
                                        background: "#e7f6ee",
                                        color: "#15824c",
                                      }}
                                    >
                                      stay + dive
                                    </span>
                                  ) : null}
                                </span>
                                <span aria-hidden="true" style={{ color: "#94a3b8", flexShrink: 0 }}>→</span>
                              </AffiliateLink>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Who to dive with — equal-weight peer, same treatment */}
                      {(operatorsToShow.length > 0 || hasDiveCapableLodging) ? (
                        <div>
                          <p style={{ fontSize: "0.5875rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#1d5d90", marginBottom: "0.6rem" }}>
                            Who to dive with
                          </p>
                          {hasDiveCapableLodging && operatorsToShow.length === 0 && (
                            <p style={{ fontSize: "0.8125rem", color: "#64748b", lineHeight: 1.55 }}>
                              Diving covered by the liveaboard — see Where to stay above.
                            </p>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {operatorsToShow.map((op) => (
                              <AffiliateLink
                                key={`op-${op.partner}-${op.label}`}
                                url={op.url || "#"}
                                event="operator_click"
                                partner={op.partner}
                                query={op.label}
                                productId={op.productId}
                                siteId={location.id}
                                isAffiliate={op.isAffiliate}
                                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-900 no-underline transition hover:border-[#0089de]/40"
                              >
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {op.label} (opens in new tab)
                                </span>
                                <span aria-hidden="true" style={{ color: "#94a3b8", flexShrink: 0 }}>→</span>
                              </AffiliateLink>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Section-level affiliate disclosure — one quiet line */}
                  {hasWhatToBook ? (
                    <p style={{ fontSize: "0.6875rem", color: "#94a3b8", lineHeight: 1.5, borderTop: "1px solid #e2e8f0", paddingTop: "0.875rem" }}>
                      Some shop and booking links earn us a commission at no cost to you — full disclosure on the{" "}
                      <Link href="/about" style={{ color: "#64748b", fontWeight: 600 }}>About page</Link>.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

          </aside>{/* end sidebar */}
        </div>
      </div>

      {/* Footer is rendered by layout.tsx — no inline footer here */}

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
// Reef Health Panel (simplified — max 3 data points)
// ---------------------------------------------------------------------------

function ReefSciencePanel({
  coverNow,
  coverBefore,
  surveyYear,
  historicalYear,
  coverTrend,
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
  const thermalAlert = thermal?.alertLevel ?? null;

  // Trend indicator
  const trendIndicator =
    coverTrend === null ? null :
    coverTrend > 0 ? "↑" :
    coverTrend < 0 ? "↓" : "→";

  const trendNote =
    coverTrend === null ? null :
    coverTrend < 0
      ? `down ${Math.abs(coverTrend)} pts since ${historicalYear ?? "last survey"}`
      : coverTrend > 0
        ? `up ${coverTrend} pts since ${historicalYear ?? "last survey"}`
        : `flat since ${historicalYear ?? "last survey"}`;

  const hasAnyData = coverNow !== null || thermalAlert !== null;
  if (!hasAnyData) return null;

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
        Reef health
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
        Reef condition
      </h2>

      <div
        style={{
          border: "1px solid #e2e8f0",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {/* Coral cover */}
        {coverNow !== null ? (
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", fontSize: "0.8125rem", fontWeight: 600, color: "#475569" }}>
              Coral cover
              <InfoTooltip text="Percentage of the reef surface covered by live coral, from the most recent survey." />
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a" }}>
                {coverNow}%
                {trendIndicator ? (
                  <span
                    style={{
                      fontSize: "1rem",
                      marginLeft: "0.25rem",
                      color: coverTrend! > 0 ? "#10b981" : coverTrend! < 0 ? "#ef4444" : "#64748b",
                    }}
                  >
                    {trendIndicator}
                  </span>
                ) : null}
              </span>
              {trendNote ? (
                <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>
                  {trendNote}{surveyYear ? ` · ${surveyYear}` : ""}
                </span>
              ) : (
                surveyYear ? (
                  <span style={{ fontSize: "0.6875rem", color: "#64748b" }}>{surveyYear}</span>
                ) : null
              )}
            </span>
          </div>
        ) : null}

        {/* Thermal status */}
        {thermalAlert !== null ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", fontSize: "0.8125rem", fontWeight: 600, color: "#475569" }}>
              Thermal status
              <InfoTooltip text="Current heat stress level from NOAA's satellite feed. Watch and Alert levels indicate bleaching risk." />
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: THERMAL_PLAIN[thermalAlert].color }}>
              {THERMAL_PLAIN[thermalAlert].label}
              <span style={{ fontWeight: 400, color: "#64748b" }}>
                {" "}— {THERMAL_PLAIN[thermalAlert].desc}
              </span>
            </span>
          </div>
        ) : null}
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
        Reef health
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
