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
};

export type SpeciesEntry = {
  commonName: string;
  scientificName?: string;
  reliability: "year-round" | "seasonal" | "rare";
  bestMonths?: number[];
  depthRange?: { min: number; max: number };
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
  getThere: PartnerLink[];
  lodging: PartnerLink[];
  operators: PartnerLink[];
  gearIds: string[];
  siteSpecificGear: SiteGearItem[];
  notes?: string;
};

export type GearPartner = {
  partner: GearPartnerName;
  productId: string;
  url: string;
  commission: number;
};

export type Gear = {
  id: string;
  name: string;
  category: GearCategory;
  levels: SkillLevel[];
  description: string;
  priceRangeUsd: { min: number; max: number };
  partners: GearPartner[];
};
