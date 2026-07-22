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
import { getCoralCoverSeriesByLocationId } from "@/lib/data/coral-cover-series";
import { getReefFishAbundanceSeriesByLocationId } from "@/lib/data/reef-fish-abundance-series";
import { getAgrraReefSeriesByLocationId } from "@/lib/data/agrra-reef-series";
import { getFishBiomassSeriesByLocationId } from "@/lib/data/fish-biomass-series";
import { getWaterTempSummary } from "@/lib/data/water-temp";
import { getRegionalCoralTrendForLocation } from "@/lib/data/coral-cover-regional";
import { getFishAbundanceSeriesByLocationId } from "@/lib/data/fish-abundance-series";
import { getReefPressureByLocationId } from "@/lib/data/reef-pressure";
import { getStandaloneMpaStatus } from "@/lib/data/mpa-status";
import { getSourcesByIds } from "@/lib/data/sources";
import { getBlueParkByLocationId } from "@/lib/data/blue-parks";
import { getLocationFishing } from "@/lib/data/fishing-pressure";
import { fishingAllowsImproving } from "@/lib/data/effective-fishing";
import { getSightingsBySiteId } from "@/lib/data/sightings";
import { getIucnStatus, IUCN_ENABLED, countThreatenedSpecies } from "@/lib/data/iucn-status";
import { getSpeciesPhotoCredit } from "@/lib/data/species-photos";
import { STATE_TEXT, STATE_COLOR, bestMonthsText, computeReefState } from "@/lib/data/reef-state";
import { biomassStanding } from "@/lib/data/biomass-standing";
import type { ReefHealthRows, VerdictWord } from "@/components/reef-health-panel";
import { LocationPageBody } from "./location-page-body";
import { HeroGallery } from "@/components/hero-gallery";
import type {
  ConditionPill,
  DeclineChart,
  CoverTrend,
  FishingPressureData,
  WaterQualityEvent,
  FishAbundanceView,
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
import type { BiomassDataPoint } from "@/components/fish-biomass-chart";
import type { WaterTempDataPoint } from "@/components/water-temp-chart";
import type { BleachingAlertLevel, CoralCoverSeriesPoint, MpaStatus, PartnerLink, ReefHealthRecord, SpeciesEntry } from "@/lib/data/types";

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
  // No formal protection — fall back to the measured read. This comes from
  // Global Fishing Watch vessel tracking, which only sees commercial vessels
  // broadcasting AIS and is blind to the small-scale and artisanal fishing that
  // dominates most reefs, so the sublabel names the commercial signal honestly
  // rather than claiming total fishing pressure.
  if (pressure === "low") return { label: "Light", tone: "good", sub: "Little commercial vessel activity" };
  if (pressure === "moderate") return { label: "Open", tone: "warm", sub: "Some commercial vessel activity" };
  if (pressure === "high" || pressure === "very-high") {
    return { label: "Open", tone: "warm", sub: "Heavy commercial vessel activity" };
  }
  return null;
}

const STATE_SUB: Record<string, string> = {
  thriving: "Near its natural baseline",
  pressure: "A reef in transition",
  change: "Documenting what remains",
  unknown: "No survey on file yet",
};

// Map a reef-health record's methodology claim to the survey body that supplied
// the observed coral cover, so the freshness pill credits the real source
// instead of a hardcoded one.
const CORAL_SOURCE_LABELS: Record<string, string> = {
  "reef-health-mermaid": "MERMAID",
  "reef-health-aims-noaa": "AIMS / NOAA",
  "reef-health-gcrmn-agrra": "GCRMN / AGRRA",
};

// Choose the best reef-health record for a location. A record with a real
// multi-year coral series wins; failing that, the most recent survey; failing
// that, the first on file. Keeps the page pointed at the richest data when a
// survey feed (e.g. MERMAID) sits alongside an editorial baseline.
function pickReefHealth(records: ReefHealthRecord[]): ReefHealthRecord | null {
  if (records.length === 0) return null;
  return [...records].sort((a, b) => {
    const aSeries = a.observed?.coralCoverSeries?.length ?? 0;
    const bSeries = b.observed?.coralCoverSeries?.length ?? 0;
    if (aSeries !== bSeries) return bSeries - aSeries;
    const aDate = a.observed?.surveyDate ?? "";
    const bDate = b.observed?.surveyDate ?? "";
    return bDate.localeCompare(aDate);
  })[0];
}

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
  // A location may have more than one reef-health record (an editorial baseline
  // plus a survey feed such as MERMAID). Prefer the one carrying a real
  // multi-year coral series, then the most recent survey, so the richest data
  // is what the page shows.
  const reefHealth = pickReefHealth(getReefHealthByLocationId(location.id));
  const reefPressure = getReefPressureByLocationId(location.id);
  const locationFishing = getLocationFishing(location.id);
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
  // Union of every curated species across the location's dive sites (the same
  // lists the site cards draw from), enriched with the freshest confirmed
  // sighting where one exists. Sighting-only species are kept but unlinked:
  // the species detail route only resolves curated entries.
  const latestSightingByName = new Map<string, (typeof allSightings)[number]>();
  for (const sv of allSightings) {
    const k = sv.speciesCommon.trim().toLowerCase();
    if (!latestSightingByName.has(k)) latestSightingByName.set(k, sv);
  }

  const curatedSpecies = new Map<
    string,
    { entry: SpeciesEntry; sitesWith: { slug: string; name: string }[] }
  >();
  for (const s of sites) {
    for (const e of s.species ?? []) {
      if (!e.commonName) continue;
      const k = e.commonName.trim().toLowerCase();
      const existing = curatedSpecies.get(k);
      if (existing) existing.sitesWith.push({ slug: s.slug, name: s.name });
      else curatedSpecies.set(k, { entry: e, sitesWith: [{ slug: s.slug, name: s.name }] });
    }
  }

  const RELIABILITY_ORDER = { "year-round": 0, seasonal: 1, rare: 2 } as const;
  const RELIABILITY_TEXT = {
    "year-round": "Seen year round",
    seasonal: "Seasonal visitor",
    rare: "Rare sighting",
  } as const;

  const buildCard = (opts: {
    commonName: string;
    scientificName?: string;
    fallbackImageUrl?: string;
    sighting: (typeof allSightings)[number] | undefined;
    reliability: SpeciesEntry["reliability"] | null;
    siteSlug: string | null;
    siteName: string | null;
  }): SpeciesCard => {
    const days = opts.sighting ? daysSince(opts.sighting.lastConfirmedAt) : null;
    const iucn = IUCN_ENABLED
      ? getIucnStatus(opts.scientificName ?? opts.sighting?.speciesScientific)
      : null;
    const photoKey =
      (opts.scientificName ?? opts.sighting?.speciesScientific)?.toLowerCase() ??
      opts.commonName.toLowerCase();
    const photoCredit =
      (opts.siteSlug ? getSpeciesPhotoCredit(`${opts.siteSlug}:${photoKey}`) : null) ??
      getSpeciesPhotoCredit(photoKey);
    return {
      key: opts.commonName.trim().toLowerCase(),
      commonName: opts.commonName,
      href: opts.siteSlug
        ? `/sites/${opts.siteSlug}/species/${opts.commonName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`
        : null,
      imageUrl:
        (photoCredit?.imageUrl
          ? photoCredit.imageUrl.replace("/square.", "/medium.")
          : null) ?? opts.fallbackImageUrl ?? null,
      icon: getSpeciesIcon(opts.commonName),
      seenText:
        opts.sighting
          ? fmtRelative(days, opts.sighting.lastConfirmedAt)
          : RELIABILITY_TEXT[opts.reliability ?? "rare"],
      dotColor: dotColor(days),
      iucnLabel: iucn ? (IUCN_LABEL[iucn.category] ?? null) : null,
      iucnBadge: iucn ? (IUCN_BADGE[iucn.category] ?? null) : null,
      siteName: opts.siteName,
    };
  };

  const curatedCards = [...curatedSpecies.entries()].map(([k, { entry, sitesWith }]) => {
    const sighting = latestSightingByName.get(k);
    // Link to the site of the latest sighting when that site also curates the
    // species, otherwise the first curating site.
    const site =
      (sighting && sitesWith.find((sw) => sw.slug === sighting.siteSlug)) ?? sitesWith[0];
    return buildCard({
      commonName: entry.commonName,
      scientificName: entry.scientificName,
      fallbackImageUrl: entry.imageUrl,
      sighting,
      reliability: entry.reliability,
      siteSlug: site.slug,
      siteName: site.name,
    });
  });

  const sightingOnlyCards = [...latestSightingByName.entries()]
    .filter(([k]) => !curatedSpecies.has(k))
    .map(([, sv]) =>
      buildCard({
        commonName: sv.speciesCommon,
        scientificName: sv.speciesScientific,
        sighting: sv,
        reliability: null,
        siteSlug: null,
        siteName: sv.siteName ?? null,
      }),
    );

  const sightingTime = (c: SpeciesCard) => {
    const sv = latestSightingByName.get(c.key);
    return sv?.lastConfirmedAt ? new Date(sv.lastConfirmedAt).getTime() : 0;
  };
  const species: SpeciesCard[] = [...curatedCards, ...sightingOnlyCards].sort((a, b) => {
    const ta = sightingTime(a);
    const tb = sightingTime(b);
    if (ta !== tb) return tb - ta;
    const ra = curatedSpecies.get(a.key)?.entry.reliability ?? "rare";
    const rb = curatedSpecies.get(b.key)?.entry.reliability ?? "rare";
    if (RELIABILITY_ORDER[ra] !== RELIABILITY_ORDER[rb])
      return RELIABILITY_ORDER[ra] - RELIABILITY_ORDER[rb];
    return a.commonName.localeCompare(b.commonName);
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
      decline = {
        fromPct: Math.round(coverBefore),
        fromYear: historicalYear,
        toPct: Math.round(coverNow),
        toYear: surveyYear,
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

  // Observed water-temperature history + "now vs usual" figures from the stored
  // monthly SST series (NOAA CRW). Display only — never an input to reef state.
  const waterTemp = getWaterTempSummary(thermal);
  // NOAA daily SST anomaly, still the basis for the "Normal" heat-pill override.
  const anomalyC = thermal?.sstAnomalyC ?? null;

  // Derive a plain "around X now, about Y above the usual Z" line. Preferred and
  // genuinely live: the actual current SST and the seasonal-usual SST from the
  // monthly series. Fallback for reefs with no series yet: the site's typical
  // water temp for the month, with usual = current − anomaly (the old estimate).
  let currentTempC: number | null = null;
  let usualTempC: number | null = null;
  if (waterTemp?.currentC != null && waterTemp?.climatologyC != null) {
    currentTempC = Math.round(waterTemp.currentC);
    usualTempC = Math.round(waterTemp.climatologyC);
  } else {
    const currentMonthTemps = sites.flatMap((s) =>
      (s.conditionsByMonth ?? [])
        .filter((c) => c.month === currentMonth && c.waterTempC !== null)
        .map((c) => c.waterTempC ? (c.waterTempC.min + c.waterTempC.max) / 2 : null)
        .filter((t): t is number => t !== null),
    );
    const est =
      currentMonthTemps.length > 0
        ? Math.round(currentMonthTemps.reduce((a, b) => a + b, 0) / currentMonthTemps.length)
        : null;
    const anomaly = thermal?.sstAnomalyC ?? null;
    currentTempC = est;
    usualTempC = est !== null && anomaly !== null ? Math.round(est - anomaly) : null;
  }

  // Heat modal readout: "around X°C now vs the usual Z°C for the season". When
  // both real SST figures are present the difference is measured directly;
  // otherwise it falls back to the stored anomaly.
  let heatDetail: string | null = null;
  if (currentTempC !== null && usualTempC !== null) {
    const signedDiff =
      waterTemp?.currentC != null && waterTemp?.climatologyC != null
        ? waterTemp.currentC - waterTemp.climatologyC
        : (thermal?.sstAnomalyC ?? currentTempC - usualTempC);
    const diff = Math.round(Math.abs(signedDiff));
    if (diff === 0 || Math.abs(signedDiff) < 0.5) {
      heatDetail = `Around ${currentTempC}°C now, about the usual ${usualTempC}°C for the season.`;
    } else if (signedDiff > 0) {
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
  // Protection pill from MPAtlas; measured GFW effort drives the fallback when
  // there is no formal protection. Standalone MPAtlas coverage backs locations
  // that have no editorial reef-pressure record but sit in an assessed reserve.
  const fishing = fishingPill(
    reefPressure?.mpaStatus ?? getStandaloneMpaStatus(location.id)?.mpaStatus ?? null,
    locationFishing.effort,
  );
  const blueParkAward = getBlueParkByLocationId(location.id);
  // Indicator-fish evidence: a real per-site abundance record (currently
  // Tubbataha, from Saving Philippine Reefs) shown as one supporting line under
  // the reef-state verdict. Display-only; it never sets the state.
  const siteFishBasis = getFishAbundanceSeriesByLocationId(location.id);

  // A real Reef Life Survey fish-biomass trend is reef data in its own right, so
  // it opens the reef-health panel even on temperate reefs that have no coral
  // cover, heat, fishing or Blue Park signal (e.g. St Abbs, Oban, Jervis Bay).
  const hasFishBiomassSeries =
    (getFishBiomassSeriesByLocationId(location.id)?.series.length ?? 0) >= 2;
  // hasReefData is computed below, once the coral-series chart points are known,
  // so a reef carrying only a proximity coral series still opens the panel.

  // For a flat coral-cover trend, append a forward-looking sentence based on current
  // heat stress and the combined fishing read so the note reads as an honest
  // outlook, not just a historical observation.
  if (coverTrendNote && coverTrendNote.startsWith("Holding steady")) {
    const heatOk = thermalAlert === "no-stress" || thermalAlert === "watch";
    const heavyFishing =
      locationFishing.effort === "high" || locationFishing.effort === "very-high";
    const fishingOk = fishingAllowsImproving(locationFishing.effective);
    if (!heatOk && heavyFishing) {
      coverTrendNote += " Both elevated heat and high fishing pressure put this stability at risk.";
    } else if (!heatOk) {
      coverTrendNote += " Current heat stress could disturb this balance.";
    } else if (heavyFishing) {
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
  const coralSourceLabel =
    coverNow !== null
      ? ((reefHealth?.methodologyClaimIds
          ?.map((id) => CORAL_SOURCE_LABELS[id])
          .find(Boolean)) ?? "Reef survey")
      : null;
  const divingOutlook = reefHealth?.divingOutlook ?? null;
  // The reef-state "verdict" sentence: an evidence-backed manual basis (e.g. a
  // documented recovery) wins, else the diving outlook / condition sentence.
  const verdictBasis = reefPressure?.manualReefStateBasis ?? null;

  // Peer-reviewed / award sources behind a hand-reviewed reef-state verdict,
  // surfaced as an "Evidence" link row under the verdict so the claim is visibly
  // cited rather than only backed in the data.
  const reefStateSources =
    reefPressure?.manualReefStateSourceIds && reefPressure.manualReefStateBasis
      ? getSourcesByIds(reefPressure.manualReefStateSourceIds).map((s) => ({
          label: s.name.split(" — ")[0],
          url: s.url ?? null,
        }))
      : [];


  // Coral-cover chart points. Prefer a real multi-year survey series when one
  // is on file: every year becomes a point and the chart draws a genuine trend.
  // Two nearby-survey composites can exist — MERMAID (mostly Indo-Pacific) and
  // AGRRA (the Caribbean standard). Both are display-only and clearly labelled;
  // when both cover a location we pick whichever has more survey years (MERMAID
  // wins ties as the incumbent), never touching the reef-state verdict or the
  // headline number. Otherwise fall back to the historical + current pair as a
  // two-point before/after. One point per year, earliest wins on ties.
  const mermaidCoralSeries = getCoralCoverSeriesByLocationId(location.id);
  const agrraSeries = getAgrraReefSeriesByLocationId(location.id);
  const nearbyCandidates: { series: CoralCoverSeriesPoint[]; label: string }[] = [];
  if (mermaidCoralSeries?.series?.length) {
    const km = Math.round(mermaidCoralSeries.radiusDeg * 111);
    // Public MERMAID data is contributed by many survey teams, not one org, so
    // the caption credits "MERMAID and the survey teams" rather than any single
    // contributor (never "WCS").
    nearbyCandidates.push({
      series: mermaidCoralSeries.series,
      label: `MERMAID and the survey teams, within ${km} km`,
    });
  }
  if (agrraSeries?.coral?.series?.length) {
    const label =
      agrraSeries.matchType === "country"
        ? `AGRRA ${agrraSeries.country} national average`
        : `AGRRA survey sites within ${Math.round((agrraSeries.radiusDeg ?? 0.75) * 111)} km`;
    nearbyCandidates.push({ series: agrraSeries.coral.series, label });
  }
  // Stable sort keeps MERMAID (pushed first) ahead of AGRRA on a year-count tie.
  nearbyCandidates.sort((a, b) => b.series.length - a.series.length);
  const chosenNearby = nearbyCandidates[0] ?? null;

  const series = chosenNearby?.series ?? observed?.coralCoverSeries ?? null;
  const projectionDataPoints: CoralDataPoint[] = [];
  let coralChartSourceLabel: string | null = coralSourceLabel;
  if (series && series.length >= 2) {
    const byYear = new Map<number, number>();
    for (const pt of series) {
      if (!byYear.has(pt.year)) byYear.set(pt.year, Math.round(pt.coralCoverPercent));
    }
    for (const [year, pct] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
      projectionDataPoints.push({ year, pct });
    }
    if (chosenNearby) {
      coralChartSourceLabel = chosenNearby.label;
    }
  } else {
    if (coverBefore !== null && historicalYear !== null) {
      projectionDataPoints.push({ year: historicalYear, pct: Math.round(coverBefore) });
    }
    if (coverNow !== null && surveyYear !== null) {
      projectionDataPoints.push({ year: surveyYear, pct: Math.round(coverNow) });
    }
  }

  // One consistent coral number per reef: the latest observed survey value from
  // the chosen series (the last chart point), falling back to the single
  // reef-health reading only when no series covers the reef. This one value
  // drives the reef-card coral row AND the "Live coral covers X%" basis line, so
  // the card and the chart can never show two different numbers.
  const coralDisplayPct: number | null =
    projectionDataPoints.length > 0
      ? projectionDataPoints[projectionDataPoints.length - 1].pct
      : coverNow !== null
        ? Math.round(coverNow)
        : null;

  // Plain-language credit for whoever ran the coral surveys, shared by the card
  // source line and the chart caption. MERMAID public data is contributed by many
  // survey teams (never "WCS"); AIMS and AGRRA/GCRMN are credited where they are
  // the source. For the reef-health fallback we read the record's actual
  // `observed.sourceIds` (not the loose methodology bucket, which mislabels e.g.
  // GCRMN-monitored Maldives reefs as AIMS) and credit the first survey program
  // present, in specificity order.
  const CORAL_SOURCE_CREDIT: [string, string][] = [
    ["aims-ltmp", "AIMS long term monitoring"],
    ["mermaid", "MERMAID and the survey teams"],
    ["agrra", "AGRRA and GCRMN reef surveys"],
    ["gcrmn", "GCRMN reef surveys"],
    ["reef-check", "Reef Check surveys"],
    ["reef-life-survey", "Reef Life Survey"],
    ["allen-coral-atlas", "Allen Coral Atlas"],
  ];
  const coralSourceCredit: string | null = (() => {
    if (chosenNearby) {
      return chosenNearby.label.startsWith("AGRRA")
        ? "AGRRA and GCRMN reef surveys"
        : "MERMAID and the survey teams";
    }
    if (coralDisplayPct === null) return null;
    const ids = new Set(observed?.sourceIds ?? []);
    for (const [id, credit] of CORAL_SOURCE_CREDIT) {
      if (ids.has(id)) return credit;
    }
    return "Reef survey";
  })();
  // When the chart is drawn from the single reef-health reading (no proximity
  // series), caption it with the accurate program credit rather than the loose
  // "AIMS / NOAA"-style methodology label.
  if (!chosenNearby && coralSourceCredit) {
    coralChartSourceLabel = coralSourceCredit;
  }

  // The reef-health card shows whenever there is ANY reef signal — including a
  // coral series on its own (the 30 reefs that only carry a proximity coral
  // history), so their coral row un-blanks even without heat, fishing or biomass.
  const hasReefData =
    coverNow !== null || decline !== null || heat !== null || fishing !== null ||
    blueParkAward !== null || hasFishBiomassSeries || siteFishBasis !== null ||
    projectionDataPoints.length >= 1;

  // GCRMN regional context, drawn as one faint horizontal reference line at the
  // region's most recent average cover — "this reef vs its region" — instead of
  // a second time series on a mismatched axis. Shown whenever the region has a
  // published trend and the site has a chart.
  const regionalTrend = getRegionalCoralTrendForLocation({
    country: location.country,
    region: location.region,
  });
  const showRegionalContext = regionalTrend !== null && projectionDataPoints.length >= 2;
  const coralContextValue: number | null = showRegionalContext
    ? regionalTrend!.series[regionalTrend!.series.length - 1].coralCoverPercent
    : null;
  const coralContextLabel: string | null = showRegionalContext
    ? `${regionalTrend!.label} average (GCRMN)`
    : null;

  // Reef-fish-biomass chart points. Real Reef Life Survey (RLS) M1 transect
  // biomass, matched by proximity and DISPLAY ONLY — it powers the fish-biomass-
  // over-time chart and never touches the reef-state verdict or any headline
  // number. Fish biomass is the metric that responds to protection, so this is
  // the "protection works" companion to the (heat-driven) coral chart. One point
  // per real survey year; only rendered when a genuine 2+ year series is on file.
  const fishBiomassSeries = getFishBiomassSeriesByLocationId(location.id);
  const biomassDataPoints: BiomassDataPoint[] = [];
  let biomassSourceLabel: string | null = null;
  if (fishBiomassSeries && fishBiomassSeries.series.length >= 2) {
    for (const pt of fishBiomassSeries.series) {
      biomassDataPoints.push({ year: pt.year, kgPerHa: pt.biomassKgPerHa });
    }
    const km = Math.round(fishBiomassSeries.radiusDeg * 111);
    const programs = fishBiomassSeries.programs.join(" + ") || "Reef Life Survey";
    biomassSourceLabel = `${programs} fish transects within ${km} km`;
  } else if (agrraSeries?.fish && agrraSeries.fish.series.length >= 2) {
    // Caribbean fallback: RLS barely surveys the wider Caribbean, so where it has
    // no series we use AGRRA's fish biomass (g/100 m² shown as kg/ha, ×0.1) into
    // the same chart, clearly labelled. Different survey method, so it is a
    // within-site trend, never compared across sources.
    for (const pt of agrraSeries.fish.series) {
      biomassDataPoints.push({ year: pt.year, kgPerHa: Math.round(pt.fishBiomassGper100m2 / 10) });
    }
    biomassSourceLabel =
      agrraSeries.matchType === "country"
        ? `AGRRA ${agrraSeries.country} national average`
        : `AGRRA fish transects within ${Math.round((agrraSeries.radiusDeg ?? 0.75) * 111)} km`;
  }

  // Water-temperature-over-time chart points: annual-mean SST from the stored
  // monthly series. Display only — the temperature analogue of the coral and
  // biomass charts. Rendered only when a 2+ year series is on file; absent
  // reefs simply show no chart. A warming trend never touches the reef state.
  const waterTempDataPoints: WaterTempDataPoint[] =
    waterTemp?.annual.map((p) => ({ year: p.year, tempC: p.tempC })) ?? [];
  const waterTempSourceLabel = waterTemp?.sourceLabel ?? null;
  // Plain "warming" vs "stable" read shown beside coral cover.
  const waterTempTrend = waterTemp?.trend ?? null;
  const waterTempChangePerDecade = waterTemp?.changePerDecadeC ?? null;

  // GFW measured fishing effort (apparent-fishing-hours within the query
  // radius), with the derived band and trend for the location panel.
  const fishingPressureData: FishingPressureData | null =
    locationFishing.hours != null && locationFishing.year != null
      ? {
          fishingHours: locationFishing.hours,
          year: locationFishing.year,
          radiusKm: locationFishing.radiusKm,
          level: locationFishing.effort,
          trend: locationFishing.trend,
          effortSeries: locationFishing.effortSeries,
          showEffortTrend: locationFishing.showEffortTrend,
        }
      : null;

  // ── Reef-health card rows (final design) ─────────────────────────────────
  // Verdict-leads presentation over the SAME readers that build the label
  // (computeReefState lower-of-two, biomass-standing, fishing). Every row's
  // visual is driven by the same value as its verdict, so they never disagree;
  // units and jargon live only behind "How we measure this".
  const GREEN = STATE_COLOR.thriving;
  const AMBER = STATE_COLOR.pressure;
  const RED = STATE_COLOR.change;
  const pillars = computeReefState(location.id);

  // Coral cover — the row is driven entirely by the reef-health survey figure
  // that also drives the verdict (pillars.coralCover), never the proximity
  // MERMAID series, so the displayed % always matches the verdict.
  //
  // Two vocabularies, by whether a REAL trend (3+ site surveys) exists:
  //  - trend  -> a direction word (Improving / Stable / Declining) + arrow.
  //  - level  -> a level word (Healthy / Moderate / Low / Critical), no arrow,
  //             because a single reading has no direction to report.
  // Neither touches the overall reef-state headline (that stays from
  // computeReefState).
  // The coral row is driven by the SAME observed coral series the chart below
  // draws (projectionDataPoints), so the card value and the chart never disagree.
  // Precedence: a real multi-year survey series (MERMAID proximity → AGRRA →
  // reef-health's own coralCoverSeries) is the source of truth for the value and
  // trend; the single reef-health reading is the fallback only when no series
  // covers the reef. This is display of observed coral history and is DECOUPLED
  // from the reef-state label (computeReefState is unchanged) — so a reef can
  // show real coral cover here while its overall state stays "Not surveyed".
  const coralLevelVerdict = (pct: number): VerdictWord =>
    pct >= 40
      ? { word: "Healthy", color: GREEN }
      : pct >= 20
        ? { word: "Moderate", color: AMBER }
        : pct >= 10
          ? { word: "Low", color: AMBER }
          : { word: "Critical", color: RED };
  // Direction word for a genuine multi-year trend (3+ survey years). Improving
  // needs healthy cover (≥40%) that is not net-falling across the series; below
  // 25% reads Declining; everything in between is Stable. Same thresholds the
  // coral-only engine used, now read off the observed series first/last points.
  const coralTrendVerdict = (currentPct: number, falling: boolean): VerdictWord =>
    currentPct < 25
      ? { word: "Declining", color: RED }
      : currentPct >= 40 && !falling
        ? { word: "Improving", color: GREEN }
        : { word: "Stable", color: AMBER };
  let coralRow: ReefHealthRows["coral"] = null;
  if (projectionDataPoints.length >= 1) {
    const points = projectionDataPoints.map((p) => ({ year: p.year, pct: p.pct }));
    const currentPct = points[points.length - 1].pct;
    if (points.length >= 3) {
      const falling = currentPct < points[0].pct;
      const verdict = coralTrendVerdict(currentPct, falling);
      const arrow: "up" | "down" | "flat" =
        verdict.word === "Improving" ? "up" : verdict.word === "Declining" ? "down" : "flat";
      coralRow = { kind: "trend", points, currentPct, startYear: points[0].year, verdict, arrow };
    } else {
      // One or two readings — a level word, no direction claim.
      coralRow = { kind: "level", pct: currentPct, verdict: coralLevelVerdict(currentPct) };
    }
  } else if (pillars.coralCover !== null) {
    const currentPct = Math.round(pillars.coralCover);
    coralRow = { kind: "level", pct: currentPct, verdict: coralLevelVerdict(currentPct) };
  }

  // Fish life — graded against the gravity-anchored B0 benchmark. The grade, the
  // dot (ratio vs the B0 tick) and the subline are all driven by the same ratio,
  // so they always agree. This is display only; the reef-state label still uses
  // biomass-standing's sub-score bands unchanged.
  const bio = biomassStanding(location.id);
  const fishRow: ReefHealthRows["fish"] = bio
    ? (() => {
        const ratio = bio.observedKgPerHa / bio.expectedB0KgPerHa;
        if (ratio >= 1.0) {
          return { grade: "Rich" as const, color: GREEN, ratio, subline: "More fish than a healthy reef of its kind." };
        }
        if (ratio >= 0.5) {
          return { grade: "Moderate" as const, color: AMBER, ratio, subline: "About what a healthy reef of its kind holds." };
        }
        return { grade: "Sparse" as const, color: RED, ratio, subline: "Fewer fish than a healthy reef of its kind." };
      })()
    : null;

  // Heat — verdict word and dot zone are both driven by the NOAA alert level, so
  // they cannot disagree. Never the word "Watch".
  const heatRow: ReefHealthRows["heat"] = thermal
    ? thermalAlert === "no-stress"
      ? { verdict: { word: "Safe now", color: GREEN }, pos: 0.16, subline: "No unusual heat right now." }
      : thermalAlert === "watch"
        ? { verdict: { word: "Warming", color: AMBER }, pos: 0.42, subline: "Warmer than usual right now, but not hot enough to bleach." }
        : thermalAlert === "warning"
          ? { verdict: { word: "Warming", color: AMBER }, pos: 0.58, subline: "Warmer than usual right now, but not hot enough to bleach." }
          : thermalAlert === "alert-1"
            ? { verdict: { word: "Bleaching now", color: RED }, pos: 0.8, subline: "Hot enough that coral is bleaching now." }
            : { verdict: { word: "Bleaching now", color: RED }, pos: 0.93, subline: "Hot enough that coral is bleaching now." }
    : null;

  // Fishing — protection verdict from the effective read; the dot sits on a
  // Quiet -> Busy scale from measured effort. Soft "busy despite protection"
  // wording is kept; no MPA is named a failure.
  const effortBand = locationFishing.effort;
  const reefProtected =
    !!fishing && (fishing.label === "Banned" || fishing.label === "Patrolled" || fishing.label === "Limited");
  const busyDespiteProtection = reefProtected && (effortBand === "high" || effortBand === "very-high");
  const effortPos =
    effortBand === "low" ? 0.15 : effortBand === "moderate" ? 0.45 : effortBand === "high" ? 0.72 : effortBand === "very-high" ? 0.9 : 0.15;
  const fishingRow: ReefHealthRows["fishing"] = fishing
    ? {
        verdict:
          fishing.label === "Banned"
            ? { word: "Protected", color: GREEN }
            : fishing.label === "Patrolled"
              ? { word: "Patrolled", color: GREEN }
              : fishing.label === "Limited"
                ? { word: "Limited", color: AMBER }
                : { word: "Open", color: fishing.tone === "good" ? GREEN : AMBER },
        pos: effortPos,
        subline: busyDespiteProtection
          ? fishing.label === "Banned"
            ? "Fishing is banned here, though boats are still busy nearby."
            : "Protected on paper, but boats are still busy nearby."
          : fishing.label === "Banned"
            ? "Quiet water, and fishing is fully banned here."
            : fishing.label === "Patrolled"
              ? "Quiet water, and the protection is actively patrolled."
              : fishing.label === "Limited"
                ? "Some fishing is allowed here, in marked zones."
                : effortBand === "high" || effortBand === "very-high"
                  ? "Open to fishing, and the water is busy."
                  : "Open to fishing, and the water is fairly quiet.",
      }
    : null;

  const reefRows: ReefHealthRows = {
    coral: coralRow,
    fish: fishRow,
    heat: heatRow,
    fishing: fishingRow,
  };

  // One consolidated source line for the whole card — only the present pillars.
  const sourceParts: string[] = [];
  if (coralRow && coralSourceCredit) sourceParts.push(coralSourceCredit);
  if (fishRow) sourceParts.push("Reef Life Survey");
  if (heatRow) sourceParts.push("NOAA Coral Reef Watch");
  if (fishingRow) sourceParts.push("Global Fishing Watch and reef gravity");
  const reefSourceLine = sourceParts.length > 0 ? `Sources · ${sourceParts.join(" · ")}` : "";

  // Water quality events: empty for now (no data source wired yet)
  const waterQualityEvents: WaterQualityEvent[] = [];

  // REEF Volunteer Fish Survey — display-only fish-abundance trend. Present only
  // for strong-REEF regions (Caribbean/US/ETP); null everywhere else, so the
  // panel never appears on Mediterranean or Indo-Pacific sites. Never touches the
  // reef-state verdict — it is a relative abundance index at REEF-zone scale.
  const reefAbundance = getReefFishAbundanceSeriesByLocationId(location.id);
  const fishAbundance: FishAbundanceView | null =
    reefAbundance && reefAbundance.series.length >= 2
      ? {
          points: reefAbundance.series.map((p) => ({
            year: p.year,
            value: p.densityIndex,
            surveyCount: p.surveyCount,
          })),
          trend: reefAbundance.trend,
          firstYear: reefAbundance.series[0].year,
          latestYear: reefAbundance.latest.year,
          surveyYears: reefAbundance.surveyYears,
          totalSurveyCount: reefAbundance.totalSurveyCount,
          zoneName: reefAbundance.reefZoneName,
          sourceLabel: `REEF · ${reefAbundance.reefZoneName} · ${reefAbundance.totalSurveyCount.toLocaleString()} surveys`,
        }
      : null;

  const conditionSentence = (() => {
    const parts: string[] = [];
    if (decline) {
      parts.push(`This reef has lost much of its live coral since ${decline.fromYear}.`);
    } else if (coralDisplayPct !== null) {
      // Uses the unified coral number (survey series latest, else reef-health), so
      // reefs that only carry a proximity coral series read "Live coral covers
      // X%" here instead of "still being gathered".
      parts.push(`Live coral covers ${coralDisplayPct}% of this reef.`);
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
        coralChartSourceLabel={coralChartSourceLabel}
        coralContextValue={coralContextValue}
        coralContextLabel={coralContextLabel}
        biomassDataPoints={biomassDataPoints}
        biomassSourceLabel={biomassSourceLabel}
        waterTempDataPoints={waterTempDataPoints}
        waterTempSourceLabel={waterTempSourceLabel}
        waterTempTrend={waterTempTrend}
        waterTempChangePerDecade={waterTempChangePerDecade}
        reefStateSources={reefStateSources}
        siteFishBasis={siteFishBasis}
        fishingPressure={fishingPressureData}
        waterQualityEvents={waterQualityEvents}
        fishAbundance={fishAbundance}
        bleachedPct={bleachedPct}
        dhwValue={dhwValue ?? null}
        surveyDateLabel={surveyDateLabel}
        coralSourceLabel={coralSourceLabel}
        divingOutlook={divingOutlook ?? null}
        heat={heat}
        fishing={fishing}
        blueParkAward={blueParkAward}
        verdictBasis={verdictBasis}
        reefStateLabel={STATE_TEXT[atlasLoc.state]}
        reefStateColor={stateColor}
        reefStateSub={STATE_SUB[atlasLoc.state]}
        reefRows={reefRows}
        reefSourceLine={reefSourceLine}
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
