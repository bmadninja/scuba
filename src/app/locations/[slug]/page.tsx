import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SetNavBreadcrumb } from "@/components/set-nav-breadcrumb";
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
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED, countThreatenedSpecies } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { STATE_TEXT, STATE_COLOR, bestMonthsText } from "@/lib/data/reef-state";
import { LocationPageBody } from "./location-page-body";
import { HeroGallery } from "@/components/hero-gallery";
import type {
  ConditionPill,
  DeclineChart,
  CoverTrend,
  FishingPressureData,
  WaterQualityEvent,
  GearGroup,
  GearItem,
  OperatorItem,
  SiteRow,
  SpeciesCard,
  StayItem,
  StayTier,
  TripFact,
  ThreatenedStats,
} from "./location-page-body";
import type { CoralDataPoint } from "@/components/coral-projection-chart";
import type { BleachingAlertLevel, MpaStatus, PartnerLink } from "@/lib/data/types";

// ---------------------------------------------------------------------------
// Plain-language mappings
// ---------------------------------------------------------------------------

// Heat (NOAA thermal-stress alert level) → one plain pill, no jargon.
const HEAT_PILL: Record<BleachingAlertLevel, ConditionPill> = {
  "no-stress": { label: "Around usual", tone: "good", sub: "No heat stress" },
  watch:       { label: "Warmer than usual", tone: "warm", sub: "No bleaching yet" },
  warning:     { label: "Warmer than usual", tone: "warm", sub: "Worth watching" },
  "alert-1":   { label: "Hot right now", tone: "warm", sub: "Bleaching likely" },
  "alert-2":   { label: "Very hot right now", tone: "warm", sub: "Severe bleaching likely" },
};

// Fishing protection → one plain pill. Derived from MPA status + pressure level.
function fishingPill(mpa: MpaStatus | null, pressure: string | null): ConditionPill | null {
  if (mpa === "no-take") {
    return { label: "Banned", tone: "good", sub: "Helping the reef recover" };
  }
  if (mpa === "strict-mpa") {
    return { label: "Patrolled", tone: "good", sub: "Rules enforced on the water" };
  }
  if (mpa === "designated-multi-use") {
    return { label: "Limited", tone: "warm", sub: "Some fishing allowed in zones" };
  }
  // No formal protection — fall back to the pressure read.
  if (pressure === "low") return { label: "Light", tone: "good", sub: "Low fishing pressure" };
  if (pressure === "moderate") return { label: "Open", tone: "warm", sub: "Some fishing pressure" };
  if (pressure === "high" || pressure === "very-high") {
    return { label: "Open", tone: "warm", sub: "Heavy fishing pressure" };
  }
  return null;
}

const STATE_SUB: Record<string, string> = {
  thriving: "Near its natural baseline",
  pressure: "A reef in transition",
  change: "Documenting what remains",
};

const OCEAN_GRADIENTS = [
  "linear-gradient(145deg,#0a3060,#0a6b8a,#087a6e)",
  "linear-gradient(145deg,#041c33,#065566,#0a7a6b)",
  "linear-gradient(145deg,#031522,#064466,#0b829f)",
  "linear-gradient(145deg,#0d4060,#0a7090,#086878)",
  "linear-gradient(145deg,#042030,#0a5060,#0a9080)",
  "linear-gradient(145deg,#0a2840,#0a5878,#087068)",
];

const IUCN_BADGE: Record<string, { bg: string; color: string }> = {
  EX: { bg: "#fdecec", color: "#b91c1c" },
  EW: { bg: "#fdecec", color: "#b91c1c" },
  CR: { bg: "#fdecec", color: "#b91c1c" },
  EN: { bg: "#fdecec", color: "#c0392f" },
  VU: { bg: "#fcf2e2", color: "#b9751a" },
  NT: { bg: "#f3fce8", color: "#3f6212" },
  LC: { bg: "#e7f6ee", color: "#15824c" },
};

const IUCN_LABEL: Record<string, string> = {
  EX: "Extinct",
  EW: "Extinct in the wild",
  CR: "Critically endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near threatened",
  LC: "Least concern",
  DD: "Data deficient",
  NE: "Not evaluated",
};

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function getSpeciesIcon(_name: string): string {
  return "";
}

function siteGearIcon(_name: string): string {
  return "";
}

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
  if (days === null || iso === null) return "Logged here";
  if (days === 0) return "Seen today";
  if (days === 1) return "Seen yesterday";
  if (days < 30) return `Seen ${days} days ago`;
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `Seen ${m} ${m === 1 ? "month" : "months"} ago`;
  }
  const d = new Date(iso + "T00:00:00Z");
  return `Seen ${d.toLocaleDateString("en-US", { year: "numeric", month: "short", timeZone: "UTC" })}`;
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

function gearShopUrl(gearId?: string): string | null {
  if (!gearId) return null;
  const g = getGearById(gearId);
  if (!g) return null;
  const amazon = g.partners.find((p) => p.partner === "amazon") ?? g.partners[0];
  return amazon?.url ?? null;
}

function wetsuitForTemp(minTempC: number | null): { name: string; note: string; gearId?: string } {
  if (minTempC === null) return { name: "Wetsuit", note: "match to the water" };
  if (minTempC >= 28) return { name: "3mm shorty or dive skin", note: "warm water", gearId: "wetsuit-bare-3mm-full" };
  if (minTempC >= 24) return { name: "3mm full wetsuit", note: "warm water", gearId: "wetsuit-bare-3mm-full" };
  if (minTempC >= 19) return { name: "5mm full wetsuit", note: "cooler water" };
  return { name: "7mm wetsuit or drysuit", note: "cold water" };
}

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
      images: metadataImageUrl ? [{ url: metadataImageUrl }] : undefined,
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
  const details = getLocationDetailsById(location.id);
  const bestMonthsSet = new Set(location.bestMonths);
  const currentMonth = new Date().getMonth() + 1;

  const atlasLoc = buildAtlasLocation(location);
  const isWitnessing = atlasLoc.state === "change";
  const heroPhotoUrl = underwaterPhotoUrl(atlasLoc.heroImageUrl);
  const stateColor = STATE_COLOR[atlasLoc.state];

  // --- Sightings aggregated across sites, newest first ----------------------
  const allSightings = sites
    .flatMap((s) =>
      getSightingsBySiteId(s.id).map((sv) => ({ ...sv, siteName: s.name, siteSlug: s.slug })),
    )
    .filter((sv) => sv.lastConfirmedAt !== null)
    .sort((a, b) => {
      const da = a.lastConfirmedAt ? new Date(a.lastConfirmedAt).getTime() : 0;
      const db = b.lastConfirmedAt ? new Date(b.lastConfirmedAt).getTime() : 0;
      return db - da;
    });

  const highlightedSpecies = allSightings
    .reduce<typeof allSightings>((acc, sv) => {
      if (!acc.find((x) => x.speciesCommon === sv.speciesCommon)) acc.push(sv);
      return acc;
    }, [])
    .slice(0, 6);

  // Most-recent species per site, for the simplified site rows.
  const siteHeadline = new Map<string, (typeof allSightings)[number][]>();
  for (const sv of allSightings) {
    const list = siteHeadline.get(sv.siteId) ?? [];
    if (list.length < 4 && !list.find((x) => x.speciesCommon === sv.speciesCommon)) {
      list.push(sv);
      siteHeadline.set(sv.siteId, list);
    }
  }

  // --- Threatened species count across all sightings at this location --------
  // Uses all (not just the top 3 cards) so the stat reflects the full picture.
  const threatenedStats: ThreatenedStats | null = IUCN_ENABLED
    ? countThreatenedSpecies(allSightings.map((sv) => sv.speciesScientific))
    : null;

  // --- Species cards --------------------------------------------------------
  const species: SpeciesCard[] = highlightedSpecies.slice(0, 3).map((sv, i) => {
    const days = daysSince(sv.lastConfirmedAt);
    const iucn = IUCN_ENABLED ? getIucnStatus(sv.speciesScientific) : null;
    const photoCredit = sv.speciesScientific ? getSpeciesPhotoCredit(sv.speciesScientific) : null;
    return {
      key: `${sv.speciesCommon}-${i}`,
      commonName: sv.speciesCommon,
      href: sv.siteSlug ? `/sites/${sv.siteSlug}/species/${sv.speciesCommon.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}` : null,
      imageUrl: photoCredit?.imageUrl ? photoCredit.imageUrl.replace("/square.", "/medium.") : null,
      icon: getSpeciesIcon(sv.speciesCommon),
      seenText: fmtRelative(days, sv.lastConfirmedAt),
      dotColor: dotColor(days),
      iucnLabel: iucn ? (IUCN_LABEL[iucn.category] ?? null) : null,
      iucnBadge: iucn ? (IUCN_BADGE[iucn.category] ?? null) : null,
    };
  });

  // --- Site rows ------------------------------------------------------------
  const siteRows: SiteRow[] = sites.map((s, i) => {
    // Use the site's curated species list (richer than the dated sightings),
    // showing up to four so a row reads as more than a single name. Fall back
    // to recent confirmed sightings when a site has no curated species.
    const names: string[] = [];
    for (const e of s.species ?? []) {
      if (names.length >= 4) break;
      if (e.commonName && !names.includes(e.commonName)) names.push(e.commonName);
    }
    if (names.length === 0) {
      for (const h of siteHeadline.get(s.id) ?? []) {
        if (names.length >= 4) break;
        if (h.speciesCommon && !names.includes(h.speciesCommon))
          names.push(h.speciesCommon);
      }
    }
    const speciesLine =
      names.length > 0 ? names.map((n) => n.toLowerCase()).join(" · ") : null;
    return {
      id: s.id,
      slug: s.slug,
      name: s.name,
      speciesLine,
      gradient: OCEAN_GRADIENTS[i % OCEAN_GRADIENTS.length],
      imageUrl: s.heroImageUrl ? underwaterPhotoUrl(s.heroImageUrl) : null,
    };
  });

  // --- Gear (two layers) ----------------------------------------------------
  const allTemps = sites.flatMap((s) =>
    (s.conditionsByMonth ?? []).flatMap((c) => c.waterTempC ? [c.waterTempC.min, c.waterTempC.max] : []),
  );
  const minWaterTemp = allTemps.length > 0 ? Math.min(...allTemps) : null;
  const maxWaterTemp = allTemps.length > 0 ? Math.max(...allTemps) : null;
  const wetsuit = wetsuitForTemp(minWaterTemp);

  const basicItems: GearItem[] = [
    { icon: "", name: "Mask and fins", extra: null, shopUrl: gearShopUrl("mask-cressi-f1") },
    { icon: "", name: "BCD and regulator", extra: null, shopUrl: gearShopUrl("bcd-scubapro-hydros-pro") },
    { icon: "", name: wetsuit.name, extra: wetsuit.note, shopUrl: gearShopUrl(wetsuit.gearId) },
    { icon: "", name: "Dive computer", extra: null, shopUrl: gearShopUrl("computer-shearwater-peregrine") },
  ];

  // Site-specific add-ons, deduped by name across sites.
  const seenGear = new Set<string>();
  const siteGearItems: GearItem[] = [];
  for (const s of sites) {
    for (const g of (s.siteSpecificGear ?? [])) {
      if (seenGear.has(g.name)) continue;
      seenGear.add(g.name);
      siteGearItems.push({
        icon: siteGearIcon(g.name),
        name: g.name,
        extra: s.name,
        shopUrl: gearShopUrl(g.gearId),
      });
    }
  }

  const gearGroups: GearGroup[] = [{ label: "Basic kit", items: basicItems }];
  if (siteGearItems.length > 0) {
    gearGroups.push({ label: "For specific sites", items: siteGearItems.slice(0, 4) });
  }

  // --- Reef condition -------------------------------------------------------
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

  // A two-point coral-cover chart whenever we have a real before/after: a red
  // decline (with projection to zero), or a green/neutral trend for reefs that
  // are recovering or holding steady.
  let decline: DeclineChart | null = null;
  let coverTrend: CoverTrend | null = null;
  let coverTrendNote: string | null = null;
  if (
    coverNow !== null &&
    coverBefore !== null &&
    surveyYear !== null &&
    historicalYear !== null &&
    surveyYear > historicalYear
  ) {
    if (coverBefore > coverNow) {
      const span = surveyYear - historicalYear;
      const perYear = (coverBefore - coverNow) / span;
      const zeroYear = perYear > 0 ? surveyYear + Math.max(1, Math.round(coverNow / perYear)) : null;
      decline = {
        fromPct: Math.round(coverBefore),
        fromYear: historicalYear,
        toPct: Math.round(coverNow),
        toYear: surveyYear,
        zeroYear,
      };
    } else if (coverNow > coverBefore) {
      coverTrendNote = `Up from ${Math.round(coverBefore)}% in ${historicalYear}.`;
      coverTrend = {
        fromPct: Math.round(coverBefore),
        fromYear: historicalYear,
        toPct: Math.round(coverNow),
        toYear: surveyYear,
        direction: "up",
      };
    } else {
      coverTrendNote = `Holding steady since ${historicalYear}.`;
      coverTrend = {
        fromPct: Math.round(coverBefore),
        fromYear: historicalYear,
        toPct: Math.round(coverNow),
        toYear: surveyYear,
        direction: "flat",
      };
    }
  }

  const thermalAlert: BleachingAlertLevel = thermal?.alertLevel ?? "no-stress";

  // Derive a plain "around X now, about Y above the usual Z" line from real data.
  // We have an SST anomaly (current vs the seasonal climatology) but no absolute
  // current SST, so we read the current month's typical water temp from the site
  // conditions and treat usual = current − anomaly.
  const currentMonthTemps = sites.flatMap((s) =>
    (s.conditionsByMonth ?? [])
      .filter((c) => c.month === currentMonth && c.waterTempC !== null)
      .map((c) => c.waterTempC ? (c.waterTempC.min + c.waterTempC.max) / 2 : null)
      .filter((t): t is number => t !== null),
  );
  const currentTempC =
    currentMonthTemps.length > 0
      ? Math.round(currentMonthTemps.reduce((a, b) => a + b, 0) / currentMonthTemps.length)
      : null;
  const anomalyC = thermal?.sstAnomalyC ?? null;
  const usualTempC =
    currentTempC !== null && anomalyC !== null
      ? Math.round(currentTempC - anomalyC)
      : null;

  // Heat label logic, escalating with the NOAA alert level. "Normal" when the
  // anomaly is small and no stress is flagged; "Warmer than usual" when elevated;
  // bleaching-alert wording at the higher levels.
  let heatDetail: string | null = null;
  if (currentTempC !== null && usualTempC !== null && anomalyC !== null) {
    const diff = Math.round(Math.abs(anomalyC));
    if (currentTempC === usualTempC || Math.abs(anomalyC) < 0.5) {
      heatDetail = `Around ${currentTempC}°C now, about the usual ${usualTempC}°C for the season.`;
    } else if (anomalyC > 0) {
      heatDetail = `Around ${currentTempC}°C now, about ${diff}°C above the usual ${usualTempC}°C for the season.`;
    } else {
      heatDetail = `Around ${currentTempC}°C now, about ${diff}°C below the usual ${usualTempC}°C for the season.`;
    }
  }

  let heat: ConditionPill | null = null;
  if (thermal) {
    const base = HEAT_PILL[thermalAlert];
    const isNormal =
      (thermalAlert === "no-stress" || thermalAlert === "watch") &&
      anomalyC !== null &&
      Math.abs(anomalyC) < 1;
    heat = {
      ...base,
      label: isNormal ? "Normal" : base.label,
      tone: isNormal ? "good" : base.tone,
      detail: heatDetail,
    };
  }
  const fishing = fishingPill(reefPressure?.mpaStatus ?? null, reefPressure?.fishingPressure ?? null);
  const hasReefData = coverNow !== null || decline !== null || heat !== null || fishing !== null;

  // For a flat coral-cover trend, append a forward-looking sentence based on current
  // heat stress and fishing pressure so the note reads as an honest outlook, not just
  // a historical observation.
  if (coverTrendNote && coverTrendNote.startsWith("Holding steady")) {
    const heatOk = thermalAlert === "no-stress" || thermalAlert === "watch";
    const fp = reefPressure?.fishingPressure ?? "unknown";
    const mpa = reefPressure?.mpaStatus ?? "no-protection";
    const fishingOk = fp === "low" || mpa === "strict-mpa" || mpa === "no-take";
    if (!heatOk && (fp === "high" || fp === "very-high")) {
      coverTrendNote += " Both elevated heat and high fishing pressure put this stability at risk.";
    } else if (!heatOk) {
      coverTrendNote += " Current heat stress could disturb this balance.";
    } else if (fp === "high" || fp === "very-high") {
      coverTrendNote += " High fishing pressure could undermine this stability over time.";
    } else if (heatOk && fishingOk) {
      coverTrendNote += " If conditions stay this way, this reef should hold its ground.";
    }
  }

  // One plain condition sentence, honest, never "still worth diving".
  // --- Story 4.1/4.2/4.3: extra fields for location body props ---------------
  const bleachedPct = observed?.bleachedPercent ?? null;
  const dhwValue = reefHealth?.thermalStress?.degreeHeatingWeeks ?? null;
  const surveyDateLabel = surveyYear ? String(surveyYear) : null;
  const divingOutlook = reefHealth?.divingOutlook ?? null;

  // Projection data points: build from observed historical + current pair
  const projectionDataPoints: CoralDataPoint[] = [];
  if (coverBefore !== null && historicalYear !== null) {
    projectionDataPoints.push({ year: historicalYear, pct: Math.round(coverBefore) });
  }
  if (coverNow !== null && surveyYear !== null) {
    projectionDataPoints.push({ year: surveyYear, pct: Math.round(coverNow) });
  }

  // GFW fishing pressure: not available at ReefPressureRecord level (no hour counts)
  // fishingPressure pill already computed above from mpaStatus + pressure level
  const fishingPressureData: FishingPressureData | null = null;

  // Water quality events: empty for now (no data source wired yet)
  const waterQualityEvents: WaterQualityEvent[] = [];

  const conditionSentence = (() => {
    const parts: string[] = [];
    if (decline) {
      parts.push(`This reef has lost much of its live coral since ${decline.fromYear}.`);
    } else if (coverNow !== null) {
      parts.push(`Live coral covers ${Math.round(coverNow)}% of this reef.`);
    }
    if (heat) {
      parts.push(
        heat.tone === "warm"
          ? "The water is warmer than usual right now, so expect some pale coral."
          : "The water is around its usual temperature for now.",
      );
    }
    if (fishing && (fishing.label === "Banned" || fishing.label === "Patrolled")) {
      parts.push("Fishing is held back here, which gives the reef room to recover.");
    }
    if (parts.length === 0) {
      return "Live science signals for this reef are still being gathered.";
    }
    return parts.join(" ");
  })();

  // --- Plan a trip ----------------------------------------------------------
  const getThereStructured = sites.map((s) => s.getThereStructured).find((t) => Boolean(t)) ?? null;
  const getThereProse =
    sites.map((s) => s.getThere).find((t) => t && t.trim().length > 0) ??
    details?.goodToKnow.find((g) => g.title?.toLowerCase().includes("getting there"))?.body ??
    null;
  const lodging = dedupePartnerLinks(
    sites.flatMap((s) => (s.lodging ?? []).filter((l) => l && l.partner)),
  );
  const operatorsRaw = dedupePartnerLinks(
    sites.flatMap((s) => (s.operators ?? []).filter((o) => o && o.partner)),
  );

  const isGenericSearchUrl = (url: string) =>
    !url || url.includes("dive-shop-search") || url.includes("/dive-shop");
  const realOperators = operatorsRaw.filter((op) => op.isAffiliate || !isGenericSearchUrl(op.url));

  const operators: OperatorItem[] = realOperators.slice(0, 6).map((op) => ({
    partner: op.partner,
    label: op.label,
    url: op.url,
    productId: op.productId,
    isAffiliate: op.isAffiliate,
    detail: null,
  }));

  // Lodging grouped into plain price tiers, with liveaboards split out as their
  // own group (a liveaboard is a stay and dive package, not a price band).
  const toStayItem = (l: PartnerLink): StayItem => ({
    partner: l.partner,
    label: l.label,
    url: l.url,
    productId: l.productId,
    isAffiliate: l.isAffiliate,
    isLiveaboard: l.kind === "liveaboard",
  });

  const lodgingHotels = lodging.filter((l) => l.kind !== "liveaboard");
  const lodgingLiveaboards = lodging.filter((l) => l.kind === "liveaboard");

  // priceLevel: 1 = budget, 2 = mid-range, 3 = upscale, 4 = luxury.
  const byPrice = (min: number, max: number) =>
    lodgingHotels
      .filter((l) => (l.priceLevel ?? 2) >= min && (l.priceLevel ?? 2) <= max)
      .slice(0, 3)
      .map(toStayItem);

  const stayTiers: StayTier[] = [
    { label: "Budget", items: byPrice(1, 1) },
    { label: "Mid range", items: byPrice(2, 3) },
    { label: "Luxury", items: byPrice(4, 4) },
    { label: "Liveaboards", items: lodgingLiveaboards.slice(0, 3).map(toStayItem) },
  ].filter((t) => t.items.length > 0);

  const tripFacts: TripFact[] = [
    { icon: "", label: "Best months", value: bestMonthsText(location.bestMonths) },
  ];
  if (minWaterTemp !== null && maxWaterTemp !== null) {
    tripFacts.push({
      icon: "",
      label: "Water",
      value: `${minWaterTemp} to ${maxWaterTemp}°C`,
    });
  }
  if (details?.diveLevel) {
    tripFacts.push({ icon: "", label: "Level", value: details.diveLevel });
  }
  if (details?.diveStyle) {
    tripFacts.push({ icon: "", label: "Dive style", value: details.diveStyle });
  }
  if (details?.tripDuration) {
    tripFacts.push({ icon: "", label: "Trip length", value: details.tripDuration });
  }
  // "Best months" already carried by the season strip; keep the fact list lean.
  const monthCells = MONTH_LETTERS.map((letter, i) => ({
    letter,
    on: bestMonthsSet.has(i + 1),
    now: i + 1 === currentMonth,
  }));
  // Drop the duplicate "Best months" text fact — the strip shows it.
  const leanTripFacts = tripFacts.filter((f) => f.label !== "Best months");

  const getThereView = getThereStructured
    ? {
        kind: "structured" as const,
        nearestHubName: getThereStructured.nearestHubName,
        nearestHubDescription: getThereStructured.nearestHubDescription,
        transferToSitesName: getThereStructured.transferToSitesName,
        transferToSitesDescription: getThereStructured.transferToSitesDescription,
        liveaboardDescription: getThereStructured.liveaboardDescription ?? null,
      }
    : getThereProse
      ? { kind: "prose" as const, text: getThereProse }
      : null;

  // Prefer the fuller editorial paragraph so rich locations read as a real
  // paragraph; fall back to the shorter one-line description. When both are
  // present, pick whichever is longer.
  const introExtended = details?.extendedDescription?.trim() || null;
  const introShort = location.description?.trim() || null;
  const intro =
    introExtended && introShort
      ? introExtended.length >= introShort.length
        ? introExtended
        : introShort
      : introExtended || introShort || null;

  return (
    <>
      <JsonLd data={locationSchema(location, sites.length)} />
      <SetNavBreadcrumb items={[{ label: location.name }]} />

      {/* HERO — extends behind the sticky nav via negative top margin */}
      <section style={{ position: "relative", height: "calc(58vh + 60px)", minHeight: 500, overflow: "hidden", marginTop: "-60px" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(155deg,#041c33 0%,#063a52 20%,#065a70 40%,#087a8a 58%,#0a9a88 75%,#0a8070 100%)",
          }}
        />
        <HeroGallery
          images={atlasLoc.heroImages?.length ? atlasLoc.heroImages : (atlasLoc.heroImageUrl ? [atlasLoc.heroImageUrl] : [])}
          alt={`Underwater reef at ${location.name}`}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom,rgba(4,18,32,0.15) 0%,rgba(4,18,32,0.05) 35%,rgba(4,18,32,0.45) 72%,rgba(4,18,32,0.82) 100%)",
          }}
        />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 3rem 2.5rem", maxWidth: 1320, margin: "0 auto" }}>
          {/* State pill — appears once on the page */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.4rem 1rem",
              borderRadius: 999,
              background: "rgba(47,108,237,0.2)",
              border: "1px solid rgba(47,108,237,0.4)",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#dbe7ff",
              marginBottom: "1rem",
              backdropFilter: "blur(8px)",
            }}
          >
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: stateColor, flexShrink: 0 }} />
            {STATE_TEXT[atlasLoc.state]}
          </div>
          <h1
            style={{
              fontSize: "clamp(2.5rem,5vw,4.25rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: "#fff",
              textShadow: "0 2px 18px rgba(4,18,32,0.5)",
            }}
          >
            {location.name}
          </h1>
          <p style={{ fontSize: "0.9rem", fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.8)", marginTop: "0.7rem", textTransform: "uppercase" }}>
            {location.country}
            {location.region ? ` · ${location.region}` : ""}
          </p>
        </div>
      </section>

      {/* BODY (client) */}
      <LocationPageBody
        locationId={location.id}
        locationName={location.name}
        sightingSites={sites.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lng: s.lng }))}
        intro={intro}
        conditionSentence={conditionSentence}
        decline={decline}
        coverTrend={coverTrend}
        coverNow={coverNow}
        coverYear={surveyYear}
        coverTrendNote={coverTrendNote}
        projectionDataPoints={projectionDataPoints}
        fishingPressure={fishingPressureData}
        waterQualityEvents={waterQualityEvents}
        bleachedPct={bleachedPct}
        dhwValue={dhwValue ?? null}
        surveyDateLabel={surveyDateLabel}
        divingOutlook={divingOutlook ?? null}
        heat={heat}
        fishing={fishing}
        reefStateLabel={STATE_TEXT[atlasLoc.state]}
        reefStateColor={stateColor}
        reefStateSub={STATE_SUB[atlasLoc.state]}
        hasReefData={hasReefData}
        species={species}
        threatenedStats={threatenedStats}
        sites={siteRows}
        gearGroups={gearGroups}
        tripFacts={leanTripFacts}
        monthCells={monthCells}
        getThere={getThereView}
        stayTiers={stayTiers}
        operators={operators}
        isWitnessing={isWitnessing}
        seasonNotes={details?.seasonNotes ?? null}
        quotes={details?.quotes ?? []}
        goodToKnow={(details?.goodToKnow ?? []).filter(
          (g) => !g.title?.toLowerCase().includes("getting there"),
        )}
      />
    </>
  );
}
