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
  | "blackwater";

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
};

export type ConditionsMonth = {
  month: number;
  waterTempC: { min: number; max: number };
  visibilityM: { min: number; max: number };
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
  getThere: string;
  lodging: PartnerLink[];
  operators: PartnerLink[];
  gearIds: string[];
  siteSpecificGear: SiteGearItem[];
  notes?: string;
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

export type FishingPressureLevel =
  | "low"
  | "moderate"
  | "high"
  | "very-high"
  | "unknown";

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
  sourceIds: string[];
  notes?: string;
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
export type FishingPressureRecord = {
  locationId: string;
  radiusKm: number;
  current: { year: number; fishingHours: number };
  historical?: { year: number; fishingHours: number };
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
