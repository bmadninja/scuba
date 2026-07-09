export type SkillLevel =
  | "never-dived"
  | "open-water"
  | "advanced"
  | "rescue"
  | "divemaster"
  | "tech";

export type DiveType =
  | "large-pelagics"
  | "coral"
  | "macro"
  | "wrecks"
  | "geology"
  | "blackwater"
  | "drift"
  | "cave"
  | "wall"
  | "night"
  | "muck";

export type PhotographyLensType = "macro" | "wide-angle" | "both";
export type PhotographyVisibility = "excellent" | "good" | "variable";

export type SitePhotography = {
  lensType: PhotographyLensType;
  visibility: PhotographyVisibility;
  highlights: string[];
};

export type GearCategory =
  | "mask"
  | "snorkel"
  | "fins"
  | "boots"
  | "wetsuit"
  | "drysuit"
  | "bcd"
  | "regulator"
  | "computer"
  | "light"
  | "reel-smb"
  | "reef-hook"
  | "gloves"
  | "hood"
  | "bag"
  | "specialty";

export type GearPartnerName =
  | "amazon"
  | "dgx"
  | "divers-direct"
  | "leisure-pro"
  | "scuba-com";

export type Location = {
  id: string;
  slug: string;
  name: string;
  country: string;
  region: string;
  countryCode: string;
  lat: number;
  lng: number;
  description: string;
  bestMonths: number[];
  siteIds: string[];
  heroImageUrl?: string;
  heroImages?: string[];
  sourceIds?: string[];
  methodologyClaimIds?: string[];
};

export type LocationQuote = {
  text: string;
  attribution?: string;
};

export type LocationGoodToKnow = {
  title: string;
  body: string;
};

export type LocationDetails = {
  id: string;
  extendedDescription: string;
  seasonNotes?: string;
  tripDuration: string;
  diveStyle: string;
  diveLevel: string;
  quotes: LocationQuote[];
  goodToKnow: LocationGoodToKnow[];
};

export type SpeciesEntry = {
  commonName: string;
  scientificName?: string;
  reliability: "year-round" | "seasonal" | "rare";
  bestMonths?: number[];
  depthRange?: { min: number; max: number };
  sourceIds?: string[];
  methodologyClaimIds?: string[];
  imageUrl?: string;
  ecologicalDescription?: string;
};

export type ConditionsMonth = {
  month: number;
  waterTempC: { min: number; max: number } | null;
  visibilityM: { min: number; max: number } | null;
  currentStrength: "none" | "mild" | "moderate" | "strong";
  suitRecommendation: string;
};

export type PartnerLink = {
  partner: string;
  label: string;
  url: string;
  productId?: string;
  isAffiliate: boolean;
  /** 1 = budget, 2 = mid-range, 3 = upscale, 4 = luxury. Lodging only. */
  priceLevel?: 1 | 2 | 3 | 4;
  /** Lodging type. Used to split lodging into hotels vs liveaboards in UI. */
  kind?: "hotel" | "liveaboard";
};

export type SiteGearItem = {
  name: string;
  reason: string;
  gearId?: string;
};

export type GetThereStructured = {
  nearestHubName: string;
  nearestHubDescription: string;
  transferToSitesName: string;
  transferToSitesDescription: string;
  liveaboardDescription?: string;
};

export type Site = {
  id: string;
  slug: string;
  locationId: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  depthRange: { min: number; max: number };
  skillLevel: SkillLevel;
  diveTypes: DiveType[];
  species: SpeciesEntry[];
  conditionsByMonth: ConditionsMonth[];
  bestMonths: number[];
  editorialRank: number;
  heroImageUrl?: string;
  heroImages?: string[];
  getThere: string;
  /** Structured breakdown of travel logistics. When present, renders as 3 labeled sections. */
  getThereStructured?: GetThereStructured;
  lodging: PartnerLink[];
  operators: PartnerLink[];
  gearIds: string[];
  siteSpecificGear: SiteGearItem[];
  notes?: string;
  photography?: SitePhotography;
  sourceIds?: string[];
  methodologyClaimIds?: string[];
};

export type GearPartner = {
  partner: GearPartnerName;
  productId: string;
  url: string;
  commission: number;
};

export type GearTier = "basic" | "addon";

export type EncounterCategory =
  | "shark-aggregation"
  | "ray-aggregation"
  | "pelagic-migration"
  | "cage-dive"
  | "blackwater"
  | "mating-event"
  | "spawning-event"
  | "cleaning-station"
  | "cephalopod-aggregation";

export type EncounterDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/**
 * A real-world region where an encounter happens. Decoupled from our
 * scubaSeason atlas — a region exists whether or not we have a corresponding
 * `Location` record. `inAtlasLocationId` links into the atlas when we have
 * coverage; `nearbyAtlasLocationIds` enables "pair with" itinerary suggestions
 * for adjacent atlas locations.
 */
export type EncounterRegion = {
  name: string;
  country: string;
  /**
   * - "primary": currently the best place for this encounter.
   * - "secondary": still happens, but eclipsed or less reliable.
   * - "emerging": new or rebuilding.
   * - "closed": not currently bookable (operator licence revoked, MPA
   *   restriction, conservation closure, etc.).
   */
  status: "primary" | "secondary" | "emerging" | "closed";
  inAtlasLocationId?: string;
  nearbyAtlasLocationIds?: string[];
  whyHere: string;
  bestMonthsAtRegion: number[];
  /** Plain-English status note when status !== "primary". */
  statusNote?: string;
};

export type Encounter = {
  id: string;
  slug: string;
  name: string;
  category: EncounterCategory;
  speciesCommon?: string;
  speciesScientific?: string;
  shortDescription: string;
  bestMonths: number[];
  difficulty: EncounterDifficulty;
  requiredExperience: string;
  ethicsNotes: string;
  conservationNotes: string;
  limitations: string;
  confidence: "high" | "medium" | "low";
  regions: EncounterRegion[];
  /** Operator ids — resolved against operators.json. Affiliate-eligible. */
  operatorIds: string[];
  sourceIds: string[];
  methodologyClaimIds: string[];
  bucketListRank?: number;
  heroImageUrl?: string;
};

/**
 * A dive operator that runs a specific encounter (or several) in a specific
 * region. Listings are conservative: `permitStatus: "listed-only"` until we
 * have a documented permit/licence cross-check.
 *
 * Affiliate links are optional — when present, the encounter page renders
 * the CTA via the affiliate provider with UTM tagging; otherwise it falls
 * back to the operator's own site.
 */
export type Operator = {
  id: string;
  name: string;
  /** Matches an EncounterRegion.name on at least one encounter. */
  regionName: string;
  encounterIds: string[];
  permitStatus: "verified" | "listed-only" | "unknown";
  priceRangeUSD?: [number, number];
  durationDays?: number;
  groupSizeMax?: number;
  website: string;
  affiliateUrl?: string;
  affiliateProvider?: "padi-travel" | "divezone" | "zublu" | "direct";
  notesShort?: string;
};

/**
 * Per-site, per-species evidence record. We deliberately do NOT carry a
 * `probabilityPercent` field — numeric probabilities are only meaningful
 * with a documented effort denominator, and most of our seed data lacks
 * one. UI surfaces `lastConfirmedAt`, `recentRecordCount`, proximity, and
 * seasonality instead.
 */
export type SightingEvidence = {
  id: string;
  siteId: string;
  speciesCommon: string;
  speciesScientific?: string;
  /** ISO date (YYYY-MM-DD). Null means "no confirmed record on file". */
  lastConfirmedAt: string | null;
  /** Count of confirmed records within the proximity radius in the last 24 months. */
  recentRecordCount: number;
  /** Radius (km) over which records were aggregated for `recentRecordCount`. */
  proximityRadiusKm: number;
  /** Months (1-12) where records cluster. Empty when no seasonal signal. */
  seasonalityMonths: number[];
  confidence: "high" | "medium" | "low";
  sourceIds: string[];
  methodologyClaimIds: string[];
  notes?: string;
  /** iNaturalist observation ID. When present, links to the source observation. */
  obsId?: string;
  /**
   * True when the most recent run of the live ingest
   * (scripts/fetch-sightings-live.mjs) found at least one research-grade
   * record for this site/species. False/absent means the value is carried
   * over from a previous run or is hand-curated.
   */
  verified?: boolean;
  /** Provenance tag set by the live ingest, e.g. "sightings-live". */
  source?: string;
  /** ISO timestamp of the live ingest run that last touched this record. */
  fetchedAt?: string;
};

/**
 * MPA protection status, ordered from no formal protection to strict
 * no-take. Sourced from Protected Planet (WDPA) and refined with
 * Marine Protection Atlas (MPAtlas) for genuine-enforcement signal.
 */
/**
 * Significance of a current or recent water-quality event at a
 * location. Surfaces in a small callout when something happened that
 * would affect a dive trip.
 */
export type WaterQualitySeverity = "watch" | "concerning" | "severe";

export type WaterQualityEvent = {
  /** Short event title (e.g. "Sargassum influx", "SCTLD outbreak"). */
  title: string;
  severity: WaterQualitySeverity;
  /** Year or year-range the event began. */
  since: string;
  /** Plain-English description of what divers actually see / experience. */
  description: string;
  /** Optional months when this event is worst (1-12). */
  worstMonths?: number[];
};

/**
 * Water-quality / pollution record. Only present for locations with a
 * notable ongoing or recent issue divers should know about. Sites
 * without a record stay silent — no UI placeholder.
 */
export type WaterQualityRecord = {
  id: string;
  locationId: string;
  events: WaterQualityEvent[];
  /** Microplastics ambient pressure if known. */
  microplasticsLevel?: "low" | "moderate" | "high" | "very-high";
  /** Editorial summary of what a visitor can expect / how to adapt. */
  divingImpactNote: string;
  sourceIds: string[];
  methodologyClaimIds: string[];
  lastReviewedAt: string;
};

export type WreckVesselType =
  | "freighter"
  | "tanker"
  | "warship"
  | "submarine"
  | "aircraft"
  | "ferry"
  | "fishing"
  | "cable-layer"
  | "research"
  | "tug"
  | "other";

export type WreckSunkCause =
  | "wartime-attack"
  | "scuttled-artificial-reef"
  | "scuttled-disposal"
  | "accident"
  | "storm"
  | "unknown";

export type WreckProtection =
  | "none"
  | "underwater-cultural-heritage"
  | "national-marine-sanctuary"
  | "war-grave"
  | "restricted-access";

/**
 * Wreck history record. Attached to a site (not a location) because a
 * single location often hosts multiple wrecks.
 */
export type WreckRecord = {
  id: string;
  siteId: string;
  vesselName: string;
  vesselType: WreckVesselType;
  /** ISO country code or "Multi-national" / "Unknown". */
  nationality?: string;
  builtYear?: number;
  /** ISO date or just year string. */
  sunk: string;
  sunkCause: WreckSunkCause;
  /** Length in metres. */
  lengthM?: number;
  /** Tonnage where credible (gross or displacement). */
  tonnage?: number;
  /** Min and max diveable depths (often a structure span). */
  depthRangeM?: { min: number; max: number };
  protectionStatus: WreckProtection;
  /** 1–3 sentence editorial history paragraph. */
  history: string;
  /** Notable inside the wreck — cargo, fittings, rooms divers visit. */
  notableFeatures?: string[];
  sourceIds: string[];
  methodologyClaimIds: string[];
  lastReviewedAt: string;
};

export type MpaStatus =
  | "no-protection"
  | "designated-multi-use"
  | "strict-mpa"
  | "no-take";

/**
 * Where an mpaStatus value came from, in ascending order of authority:
 *  - "template": regional-template guess from backfill-reef-pressure.mjs
 *  - "wdpa-only": an MPA exists here (WDPA) but its enforcement quality is
 *    unverified — treat as designated, not confirmed no-take
 *  - "mpatlas": derived from an MPAtlas MPA Guide assessment (level + stage)
 *  - "manual": hand-curated; never overwritten by the ingest
 */
export type MpaStatusSource = "template" | "wdpa-only" | "mpatlas" | "manual";

/**
 * Raw MPA Guide assessment carried through from MPAtlas so the derived
 * mpaStatus stays traceable. levelOfProtection / stage use MPAtlas's own
 * vocabulary; mpaGuideStatus is their 2-char stage+level code (e.g. "if"
 * = implemented + fully protected).
 */
export type MpaGuideAssessment = {
  levelOfProtection:
    | "fully"
    | "highly"
    | "lightly"
    | "minimally"
    | "incompatible"
    | "unknown";
  stage: "proposed" | "designated" | "implemented" | "actively-managed";
  mpaGuideStatus?: string;
  wdpaId?: number;
  /** MPAtlas internal zone/site id the value was resolved from. */
  mpatlasId?: string;
  /** Official MPA / zone name the assessment was resolved from (site_name). */
  mpaName?: string;
  /** Year the MPA was formally designated (from MPAtlas designated_date). */
  designatedDate?: string;
  /**
   * Date the MPA reached the implemented stage. The gap between this and
   * designatedDate is the real "how long has protection actually been in
   * force" signal — the paper-park timeline.
   */
  implementedDate?: string;
  /** MPAtlas regulations_in_force flag: "yes" | "no" | "unknown". */
  regulationsInForce?: string;
  /**
   * Peer-reviewed / third-party report backing this assessment, verbatim from
   * MPAtlas's affiliated_reports column (e.g. "Pike et al. (2024)"). Lets a
   * site cite the science behind its protection claim.
   */
  affiliatedReports?: string;
  assessedAt?: string;
};

/**
 * Blue Park Award tier (Marine Conservation Institute). Platinum > Gold >
 * Silver. Several award years (2021, 2022, 2024, 2025) were not itemised by
 * tier in MCI's announcements — those use "awarded" rather than guessing a
 * tier. See scripts/data notes and src/data/blue-parks.json.
 */
export type BlueParkLevel = "platinum" | "gold" | "silver" | "awarded";

/**
 * A Blue Park Award recognising an MPA that meets the highest science-based
 * standard for marine biodiversity protection. Keyed to one of our locations
 * (which may sit inside a larger or a named sub-area park — parkName carries
 * the official MPA name so the badge stays honest).
 */
export type BlueParkAward = {
  locationId: string;
  level: BlueParkLevel;
  /** Year the award was made (MCI's formal award year where sources differ). */
  year: number;
  /** Official MPA name that holds the award. */
  parkName: string;
  /** Optional context, e.g. "Upgraded from Gold to Platinum in 2025". */
  note?: string;
  sourceIds?: string[];
};

export type FishingPressureLevel =
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "unknown";

/**
 * Measured fishing-effort band derived from Global Fishing Watch
 * apparent-fishing-hours within the query radius. Calibrated to the
 * observed distribution (see scripts + .claude/mpa-gfw-fishing-spec.md).
 */
export type FishingEffortLevel =
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "unknown";

/**
 * GFW measured effort reconciled against MPAtlas protection. Measured
 * effort is primary; protection only upgrades a low reading to
 * "protected", and flags "paper-park" when a protected area shows heavy
 * measured fishing (internal signal — see spec).
 */
export type EffectiveFishing =
  | "protected"
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "paper-park"
  | "unknown";

/** Direction of measured fishing effort vs the multi-year baseline. */
export type FishingTrend = "rising" | "stable" | "falling" | "unknown";

/**
 * Per-location human-pressure record. Pairs with reef-health to power
 * a "what humans are doing to this reef" panel on location pages.
 *
 * All fields editorial-bounded; none claim precision beyond what the
 * cited sources support. New methodology note "human-pressure-mpa-context"
 * documents the bounds.
 */
export type ReefPressureRecord = {
  id: string;
  locationId: string;
  mpaStatus: MpaStatus;
  /** Year the MPA was established; only set when mpaStatus !== "no-protection". */
  mpaSinceYear?: number;
  /** Plain-English MPA name (e.g. "Raja Ampat Marine Park"). */
  mpaName?: string;
  fishingPressure: FishingPressureLevel;
  /**
   * Editorial summary of the dominant pressures here — fishing,
   * coastal development, tourism, plastic, agricultural runoff, etc.
   */
  topPressures: string[];
  /**
   * Count of Green Fins-listed sustainable operators known at this
   * location. Undefined when we haven't verified.
   */
  greenFinsOperatorCount?: number;
  /** Editorial paragraph framing what visitors can do here. */
  visitorImpactNote: string;
  /**
   * Provenance for mpaStatus. Absent is treated as "template" (the
   * original backfill guess). Set to "manual" to lock a hand-curated
   * value so scripts/fetch-mpa-status.mjs never overwrites it.
   */
  mpaStatusSource?: MpaStatusSource;
  /** Present only when mpaStatusSource === "mpatlas". */
  mpaAssessment?: MpaGuideAssessment;
  /**
   * Evidence-backed manual reef-state override. Use ONLY where a real,
   * sourced condition signal exists that the coral-cover engine cannot see
   * (e.g. a documented fish-biomass recovery in a temperate MPA). When set,
   * it supersedes getReefState() for this location. Never set it to invent a
   * positive label from absence of data — manualReefStateBasis must cite the
   * evidence, and manualReefStateSourceIds must back it.
   */
  manualReefState?: "thriving" | "pressure" | "change";
  /** One-line, sourced rationale shown as the reef-state verdict sentence. */
  manualReefStateBasis?: string;
  manualReefStateSourceIds?: string[];
  /** Source ids backing this record (e.g. "mpatlas", "wdpa"). */
  sourceIds?: string[];
  /** Always cites human-pressure-mpa-context (and possibly extras). */
  methodologyClaimIds: string[];
  lastReviewedAt: string;
};

/**
 * NOAA Coral Reef Watch bleaching alert level (5-step scale).
 * See https://coralreefwatch.noaa.gov/product/5km/methodology.php
 */
export type BleachingAlertLevel =
  | "no-stress"
  | "watch"
  | "warning"
  | "alert-1"
  | "alert-2";

/**
 * Observed reef condition from an in-situ survey. Each instance is the
 * snapshot of a single survey, not a derived/modelled value.
 */
export type ObservedReefCondition = {
  surveyDate: string;
  surveyMethod: string;
  /** Live hard-coral cover, percent. */
  coralCoverPercent?: number;
  /** Share of surveyed coral colonies that were bleached, percent. */
  bleachedPercent?: number;
  /** Share of surveyed coral colonies that died (recent mortality), percent. */
  mortalityPercent?: number;
  /**
   * Coral cover from an earlier survey at this location (rough historical
   * baseline for "what visitors would have seen years ago" comparison).
   */
  historicalCoralCoverPercent?: number;
  /** ISO date for the historical baseline. Required when historical % is set. */
  historicalSurveyDate?: string;
  /**
   * Real multi-year coral-cover history: one point per survey year, oldest
   * first. When three or more points are present the reef card draws a genuine
   * time series instead of a two-point before/after. Every point is an observed
   * survey value, never a modelled or projected one. Points inherit this
   * record's `sourceIds`.
   */
  coralCoverSeries?: CoralCoverSeriesPoint[];
  sourceIds: string[];
  notes?: string;
};

/**
 * One observed coral-cover reading in a multi-year series. Always a real survey
 * value for a given year — the display never extrapolates beyond these points.
 */
export type CoralCoverSeriesPoint = {
  year: number;
  /** Observed hard-coral cover for that year, percent. */
  coralCoverPercent: number;
  /** Survey method for this point, when it differs from the record method. */
  method?: string;
};

/**
 * One observed fish-biomass reading in a multi-year series, in kilograms per
 * hectare. Derived from Reef Life Survey M1 fish transects: biomass is summed
 * across all fish species per transect block, converted to a density, and then
 * averaged across all M1 surveys within radius in that year. Every point is a
 * real measured value — the display never extrapolates beyond these points.
 */
export type FishBiomassSeriesPoint = {
  year: number;
  /** Mean standing fish biomass for that year, kilograms per hectare. */
  biomassKgPerHa: number;
  /** Number of RLS M1 surveys averaged into this year's point. */
  surveyCount: number;
};

/**
 * A location's multi-year reef-fish-biomass history, matched by proximity from
 * the Reef Life Survey (RLS) global M1 fish-transect dataset. This is a
 * DISPLAY-ONLY dataset for the reef card's fish-biomass-over-time chart: exactly
 * like the coral series, points are matched within a radius rather than by exact
 * site, so it never drives the reef-state verdict or any headline number — only
 * the labelled trend chart. Fish biomass is the metric that actually responds to
 * protection (coral is heat driven), so this is the honest "protection works"
 * benchmark. Lives in `src/data/fish-biomass-series.json`, one entry per
 * location. Method is effort standardized: every RLS M1 transect is the same
 * fixed area, so year-to-year change reflects the reef, not survey effort.
 */
export type FishBiomassSeriesRecord = {
  locationId: string;
  sourceId: string;
  methodologyClaimId: string;
  /** Match radius in degrees used to gather nearby surveys. */
  radiusDeg: number;
  surveyEventCount: number;
  surveyYears: number;
  /** Distinct RLS survey sites within radius that fed this series. */
  siteCount: number;
  /** Survey programs represented, e.g. ["RLS", "ATRC"]. */
  programs: string[];
  latest: {
    year: number;
    biomassKgPerHa: number;
    /** Mean fish counted per standard M1 transect (500 m²) in the latest year. */
    abundancePer500m2?: number;
    /** Mean fish species seen per M1 transect in the latest year. */
    speciesRichness?: number;
    surveyDate: string;
  };
  series: FishBiomassSeriesPoint[];
  citation?: string | null;
  notes?: string;
  lastReviewedAt?: string;
};

/**
 * A location's multi-year coral-cover survey history, matched by proximity from
 * an external survey platform (MERMAID). This is a DISPLAY-ONLY dataset for the
 * reef card's coral-cover-over-time chart: because points are matched within a
 * radius rather than by exact site, it never drives the reef-state verdict or
 * the headline coral number, only the labelled trend chart. Lives in
 * `src/data/coral-cover-series.json`, one entry per location.
 */
export type CoralCoverSeriesRecord = {
  locationId: string;
  sourceId: string;
  methodologyClaimId: string;
  /** Match radius in degrees used to gather nearby surveys. */
  radiusDeg: number;
  surveyEventCount: number;
  surveyYears: number;
  latest: {
    year: number;
    coralCoverPercent: number;
    surveyDate: string;
  };
  bleachedPercent?: number;
  mortalityPercent?: number;
  series: CoralCoverSeriesPoint[];
  citation?: string | null;
  notes?: string;
  lastReviewedAt?: string;
};

/** One observed fish-biomass reading in an AGRRA multi-year series. */
export type AgrraFishBiomassPoint = {
  year: number;
  /** Total fish biomass for that survey year, grams per 100 m². */
  fishBiomassGper100m2: number;
};

/**
 * A location's multi-year AGRRA (Atlantic and Gulf Rapid Reef Assessment) trend,
 * carrying live-coral cover and — as a Caribbean fallback — fish biomass. Like
 * the MERMAID `CoralCoverSeriesRecord`, this is a DISPLAY-ONLY dataset for the
 * reef card's trend charts: AGRRA survey sites are matched to our locations by
 * proximity (or a gated same-country national composite), so a series never
 * drives the reef-state verdict or the headline coral number — only the labelled
 * trend charts. Reef Life Survey (RLS) is the primary fish-biomass source; the
 * AGRRA `fish` block is used only where RLS has no coverage (RLS surveys almost
 * none of the wider Caribbean). Lives in `src/data/agrra-reef-series.json`, one
 * entry per location. Built by scripts/fetch-agrra-reef-trends.mjs.
 */
export type AgrraReefSeriesRecord = {
  locationId: string;
  sourceId: string;
  methodologyClaimId: string;
  /**
   * "proximity" = AGRRA sites within `radiusDeg` of the location; "country" =
   * the location's own-country national composite (fallback when proximity is
   * too thin). Drives the honest chart label.
   */
  matchType: "proximity" | "country";
  /** Present when matchType === "proximity". */
  radiusDeg?: number;
  /** Present when matchType === "country". */
  country?: string;
  /** Total AGRRA site-surveys pooled into the chosen scope. */
  surveyEventCount: number;
  coralSurveyYears: number;
  fishSurveyYears: number;
  coral: {
    latest: { year: number; coralCoverPercent: number };
    series: CoralCoverSeriesPoint[];
  };
  /** Omitted when the scope has fewer than two fish-biomass survey years. */
  fish?: {
    latest: { year: number; fishBiomassGper100m2: number };
    series: AgrraFishBiomassPoint[];
  };
  citation?: string | null;
  notes?: string;
  lastReviewedAt?: string;
};

/**
 * One observed fish-abundance reading in a multi-year series. The value is a
 * REEF community density index on the 1–4 scale (1 = Single, 2 = Few, 3 = Many,
 * 4 = Abundant): the sighting-frequency-weighted mean of the Roving Diver
 * Technique density scores across every species reported that year in the
 * geographic zone. Always a real, effort-standardised value for the year — the
 * display never extrapolates beyond these points.
 */
export type ReefFishAbundancePoint = {
  year: number;
  /** REEF community density index (1–4), sighting-frequency-weighted for the year. */
  densityIndex: number;
  /** Number of REEF Species-&-Abundance surveys behind this year's value. */
  surveyCount: number;
};

/**
 * A location's multi-year fish-abundance history from the REEF (Reef
 * Environmental Education Foundation) Volunteer Fish Survey Project, matched to
 * the REEF geographic zone that contains the location. This is a DISPLAY-ONLY
 * dataset for the reef card's fish-abundance-over-time chart: it is a relative
 * abundance index (not biomass), recorded at zone resolution by volunteer
 * divers, so it never drives the reef-state verdict or any headline number,
 * only the labelled trend chart. Unlike raw observation counts, REEF logs the
 * number of surveys, so the density index is effort-standardised — a rising
 * line reflects fish seen per survey, not more divers. Scoped to regions where
 * REEF coverage is strong (Tropical Western Atlantic / Caribbean, US, Tropical
 * Eastern Pacific); never applied to Mediterranean or Indo-Pacific sites where
 * REEF coverage is thin. Lives in `src/data/reef-fish-abundance-series.json`,
 * one entry per location.
 */
export type ReefFishAbundanceSeriesRecord = {
  locationId: string;
  sourceId: string;
  methodologyClaimId: string;
  /** REEF geographic zone code the series was drawn from. */
  reefZoneCode: string;
  /** Human-readable REEF geographic zone name. */
  reefZoneName: string;
  /** REEF region grouping (e.g. "TWA", "TEP", "PAC"). */
  reefRegion: string;
  /** Total REEF surveys behind the whole series. */
  totalSurveyCount: number;
  surveyYears: number;
  latest: {
    year: number;
    densityIndex: number;
    surveyCount: number;
  };
  /**
   * Direction of the density index over the series, computed by the ingest for
   * convenience. Display-only; never feeds the reef-state verdict.
   */
  trend: "rising" | "stable" | "falling";
  series: ReefFishAbundancePoint[];
  citation?: string | null;
  notes?: string;
  fetchedAt?: string;
  lastReviewedAt?: string;
};

/**
 * A location's yearly count of research-grade iNaturalist observations within
 * its radius. Renders as a cumulative accumulation line — the scientific record
 * of a reef growing over time — turning the static species count into a real,
 * dated, living record. Every year is a real observed count, never modelled.
 * Lives in `src/data/species-observation-timeline.json`.
 */
export type SpeciesObservationTimeline = {
  locationId: string;
  radiusKm: number;
  source: string;
  qualityGrade: string;
  yearlyObservations: { year: number; count: number }[];
  totalObservations: number;
  firstYear: number;
  lastYear: number;
  fetchedAt: string;
};

/**
 * A GCRMN world-region coral-cover trend, drawn as a faint backdrop behind a
 * site's own coral points so sparse site data reads against the multi-decade
 * regional picture. Regional average, not a site value — always labelled as
 * such. Lives in `src/data/coral-cover-regional.json`.
 */
export type CoralRegionalTrend = {
  region: string;
  label: string;
  sourceId: string;
  series: CoralCoverSeriesPoint[];
  yearRange: [number, number];
  citation?: string | null;
};

/**
 * One Reef Check indicator-fish taxon's regional density endpoints, counted on
 * standardised belt transects and expressed as individuals per 100 m². The two
 * values are the first and last year of Reef Check's global 5-Year compilation —
 * a regional mean across many reefs, never a single site.
 */
export type ReefCheckFishIndicator = {
  /** Display name, e.g. "Grouper (over 30 cm)". */
  taxon: string;
  /** Scientific family, e.g. "Serranidae". */
  family: string;
  /** Why the taxon is a fishing-pressure indicator, one short phrase. */
  role: string;
  startYear: number;
  startDensity: number;
  endYear: number;
  endDensity: number;
  /** Always "per 100 m²" for Reef Check fish belt transects. */
  unit: string;
  direction: "up" | "down";
  /** Reported significance, e.g. "p ≤ 0.01". */
  significance?: string;
  /** True when Reef Check found this taxon significantly more abundant inside MPAs. */
  higherInsideMpa?: boolean;
};

/**
 * Reef Check's regional indicator-fish benchmark for one ocean basin. This is
 * DISPLAY-ONLY context, never a reef-state input and never a site value: it
 * shows how food- and aquarium-trade fish trended region-wide on standardised
 * belt transects, plus the inside-vs-outside-MPA contrast that is the core
 * "protection works" signal. Regional means from the 1997–2001 global dataset.
 * Lives in `src/data/reef-check-fish-regional.json`.
 */
export type ReefCheckFishRegional = {
  /** Basin key, e.g. "indo-pacific" or "atlantic". */
  basin: string;
  label: string;
  sourceId: string;
  /** Plain description of the belt-transect method + unit. */
  method: string;
  yearRange: [number, number];
  /** Number of reef surveys behind the regional means, for honesty about n. */
  sampleReefs: number;
  indicators: ReefCheckFishIndicator[];
  /** One sentence stating the significant inside-vs-outside-MPA finding. */
  mpaContrast: string;
  citation: string;
  citationUrl?: string;
};

/**
 * One monitored station's indicator-fish reading at two survey years. Both
 * values are real, published survey endpoints for that exact station — never
 * modelled, never read off a plotted line, never spliced across methods.
 */
export type FishAbundanceStation = {
  /** Station name as published, e.g. "Lighthouse Reef". */
  station: string;
  startYear: number;
  startValue: number;
  endYear: number;
  endValue: number;
};

/**
 * A location's real indicator-fish (target / commercial reef fish) abundance
 * evidence from an in-situ belt-transect monitoring program. DISPLAY-ONLY and
 * never a reef-state input. We deliberately store published station endpoints
 * rather than a smoothed multi-year line: for our first site (Tubbataha) the
 * full annual arrays are held on request by the survey programs, so the honest
 * artefact is a two-year (start vs end) comparison across every monitored
 * station, plus the programs' own stated trend direction. The exact program,
 * method and unit are named so this is never conflated with Reef Check's
 * per-100 m² protocol (Tubbataha's data is Saving Philippine Reefs / Tubbataha
 * Management Office, counted per 500 m²). Lives in
 * `src/data/fish-abundance-series.json`.
 */
export type FishAbundanceSeriesRecord = {
  locationId: string;
  /** Primary program source id, e.g. "spr-ccef". */
  sourceId: string;
  /** Corroborating program source ids, e.g. ["tubbataha-management-office"]. */
  secondarySourceIds?: string[];
  methodologyClaimId: string;
  /** What is counted, e.g. "Target-fish biomass". */
  metric: string;
  /** Unit of every value, e.g. "kg per 500 m²". */
  unit: string;
  /** Survey method, named so it is never mistaken for the Reef Check protocol. */
  method: string;
  /** Short attribution shown under the chart, e.g. the program names. */
  sourceLabel: string;
  direction: "up" | "down" | "flat";
  /** The program's own stated trend claim, quotable and cited. */
  headline: string;
  stations: FishAbundanceStation[];
  /** How many of the stations rose, for an honest "4 of 6" framing. */
  stationsUp: number;
  stationsTotal: number;
  /** Honest counter-evidence or scope limit shown under the chart. */
  caveat?: string;
  citation: string;
  citationUrl?: string;
  lastReviewedAt?: string;
};

/**
 * Current thermal stress reading. Sourced from NOAA Coral Reef Watch or
 * an equivalent satellite product.
 */
export type ThermalStress = {
  asOf: string;
  alertLevel: BleachingAlertLevel;
  /** Degree Heating Weeks (°C-weeks). */
  degreeHeatingWeeks?: number;
  /** Sea-surface temperature anomaly vs climatology (°C). */
  sstAnomalyC?: number;
  /** HotSpot value (°C above the warmest monthly mean). */
  hotspotC?: number;
  sourceIds: string[];
  /**
   * Provenance of this thermal-stress reading. "noaa-crw-live" means the
   * block was overwritten by `scripts/fetch-reef-health-live.mjs` against
   * the NOAA Coral Reef Watch ERDDAP endpoint; absent means scaffolding.
   */
  source?: "noaa-crw-live";
  /** ISO timestamp of the live fetch. Present only when source is live. */
  fetchedAt?: string;
};

/**
 * Forward-looking projection. Must reference a documented methodology;
 * the validator rejects records that ship a projection without one.
 */
export type ReefProjection = {
  scenario: string;
  /** Free-text projection statement (e.g. "moderate bleaching risk by 2030"). */
  statement: string;
  uncertainty: string;
  sourceIds: string[];
  methodologyClaimIds: string[];
};

export type ReefHealthRecord = {
  id: string;
  /** Either a locationId or a siteId (one only). */
  locationId?: string;
  siteId?: string;
  observed?: ObservedReefCondition;
  thermalStress?: ThermalStress;
  projection?: ReefProjection;
  /**
   * Plain-English copy describing what a diver should expect on the reef
   * right now (depth tips, shoulder-season tips, what's still good). Kept
   * editorial — never invented numbers, never a projection.
   */
  divingOutlook?: string;
  /** Methodology notes covering the observed + thermal-stress fields. */
  methodologyClaimIds: string[];
  lastReviewedAt: string;
};

/**
 * Jurisdiction-level coral cover snapshot from NOAA NCRMP (US Atlantic +
 * Pacific) or AGRRA (wider Caribbean). Stored per jurisdiction, not per
 * dive site — published reports are at jurisdiction/domain resolution.
 * Joined to dive sites/locations via the `appliesTo` list.
 */
export type CoralCoverSnapshot = {
  id: string;
  label: string;
  program: "NOAA NCRMP" | "AGRRA" | "NOAA Pacific NCRMP";
  programUrl: string;
  method: string;
  current: { year: number; coverPercent: number };
  historical?: { year: number; coverPercent: number };
  sourceUrl: string;
  sourceLabel: string;
  notes?: string;
  appliesTo: string[];
};

export type CoralCoverData = {
  lastBuiltAt: string;
  jurisdictions: CoralCoverSnapshot[];
};

/**
 * Apparent fishing-effort summary from Global Fishing Watch, computed
 * within a fixed radius of a dive site or location. Numbers are in
 * AIS-detected fishing hours — small artisanal boats not broadcasting
 * AIS are not visible to GFW. Stored per location.
 */
/** One year's measured apparent-fishing-hours in a location's effort series. */
export type FishingEffortPoint = { year: number; fishingHours: number };

export type FishingPressureRecord = {
  locationId: string;
  radiusKm: number;
  current: { year: number; fishingHours: number };
  historical?: { year: number; fishingHours: number };
  /**
   * Multi-year apparent-fishing-effort history, oldest first, one point per
   * year within the query radius. DISPLAY-ONLY: it powers the effort-trend
   * sparkline and never feeds the reef-state verdict (which reads only the
   * latest band). A falling trend near a protected reef is a supporting
   * "pressure easing" signal, not proof of enforcement — AIS misses small and
   * dark vessels, and fishing near an MPA is often legal outside a no-take
   * core. Populated by scripts/fetch-fishing-pressure.mjs; when absent, the
   * data layer synthesizes a two-point series from `historical` + `current`.
   */
  series?: FishingEffortPoint[];
  fetchedAt: string;
  source: "global-fishing-watch";
};

/**
 * IUCN Red List status for a species, keyed by scientific (binomial)
 * name. Lower-cased for lookup.
 */
export type IucnStatus = {
  scientificName: string;
  commonName?: string;
  category:
    | "EX"
    | "EW"
    | "CR"
    | "EN"
    | "VU"
    | "NT"
    | "LC"
    | "DD"
    | "NE";
  categoryLabel: string;
  populationTrend?: "increasing" | "decreasing" | "stable" | "unknown";
  lastAssessedYear?: number;
  assessmentUrl?: string;
  source: "iucn-red-list";
  fetchedAt: string;
};

export type FlightHub =
  | "us-west"
  | "us-east"
  | "europe"
  | "asia"
  | "oceania";

export type LodgingTier = "budget" | "mid" | "upscale" | "luxury" | "liveaboard";

export type CostRange = { min: number; max: number };

/**
 * Hand-curated trip-cost estimate per location. Editorial bounds — we
 * never claim live prices. Every record cites editorial-curation +
 * any partner sources used; methodology note documents the bounds.
 */
export type TripCostEstimate = {
  id: string;
  locationId: string;
  currency: "USD";
  /** Round-trip flight ranges from each regional hub. Optional per hub. */
  flightUsdFromHub: Partial<Record<FlightHub, CostRange>>;
  /** Per-night lodging by tier (optional per tier). Liveaboard prices
   *  include dives + meals + cabin and replace lodging+dives stack. */
  perNightLodgingUsd: Partial<Record<LodgingTier, CostRange>>;
  /** Per-day dive package (2 boat dives, tanks, weights, guide). Skip
   *  when liveaboard is the only option. */
  diveDayUsd?: CostRange;
  /** Local transfers (airport-resort-marina, water taxis, internal
   *  flights, etc.) per traveller over the whole trip. */
  localTransfersUsd?: CostRange;
  /** Marine park / dive permit / conservation fees per traveller. */
  parkFeesUsd?: number;
  /** Plain-English context — what makes this trip cheap or expensive. */
  notes?: string;
  sourceIds: string[];
  methodologyClaimIds: string[];
  lastReviewedAt: string;
};

export type SourceType =
  | "scientific-survey"
  | "government-monitoring"
  | "occurrence-record"
  | "citizen-science"
  | "operator-report"
  | "booking-partner"
  | "editorial-curation"
  | "peer-reviewed-paper";

export type ClaimType =
  | "species-presence"
  | "sighting-probability"
  | "seasonality"
  | "reef-health"
  | "bleaching-risk"
  | "travel-recommendation"
  | "gear-recommendation";

export type Confidence = "high" | "medium" | "low";

export type DataSource = {
  id: string;
  name: string;
  url?: string;
  publisher?: string;
  sourceType: SourceType;
  accessedAt: string;
  license?: string;
  notes?: string;
  /**
   * Present only on sources we ingest programmatically on a schedule (a live
   * data feed), as opposed to sources we credit and build methodology on but
   * do not pull automatically.
   */
  ingestion?: "live";
};

export type MethodologyNote = {
  claimId: string;
  claimType: ClaimType;
  sourceIds: string[];
  confidence: Confidence;
  /**
   * Required when the claim presents a numeric probability — must document
   * the effort denominator (e.g. "positive sightings / eligible surveys").
   */
  calculation?: string;
  limitations: string;
  lastReviewedAt: string;
};

export type Gear = {
  id: string;
  name: string;
  category: GearCategory;
  tier: GearTier;
  levels: SkillLevel[];
  description: string;
  priceRangeUsd: { min: number; max: number };
  partners: GearPartner[];
  imageUrl?: string | null;
  sourceIds?: string[];
  methodologyClaimIds?: string[];
};

export type SpeciesDiversity = {
  locationId: string;
  speciesRichness: number;
  radiusKm: number;
  qualityGrade: string;
  source: string;
  fetchedAt: string;
};
