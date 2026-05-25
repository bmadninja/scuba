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

export type EncounterLocationRef = {
  locationId: string;
  siteIds?: string[];
  bestMonthsAtLocation?: number[];
  notes?: string;
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
  locations: EncounterLocationRef[];
  sourceIds: string[];
  methodologyClaimIds: string[];
  bucketListRank?: number;
  heroImageUrl?: string;
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
