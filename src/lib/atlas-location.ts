import { getAllLocations, getLocationById } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
import { isUnderwaterQualityPhoto } from "@/lib/photo-quality";
import {
  getReefState,
  getReefHeatLevel,
  getLastSurveyDays,
  geoToMapXY,
  bestMonthsText,
  skillText,
  ALERT_TO_HEAT,
} from "@/lib/data/reef-state";
import type { Location } from "@/lib/data/types";
import type { ReefState } from "@/lib/data/reef-state";

export type AtlasLocation = {
  slug: string;
  name: string;
  country: string;
  region: string;
  description: string;
  hook: string;
  state: ReefState;
  cover: string | null;
  coverYear: number | null;
  coverNow: number | null;
  coverThen: number | null;
  coverNowYear: number | null;
  coverThenYear: number | null;
  season: string;
  bestMonths: number[];
  skill: string;
  heatLevel: number;
  heatTrace: number[];
  lastSurveyDays: number | null;
  x: number;
  y: number;
  heroImageUrl?: string;
  animalTags: string[];
};

/** Deterministic 24-month synthetic heat trace for a location */
function buildHeatTrace(baseHeat: number, lat: number): number[] {
  const north = lat >= 0;
  const peak = north ? 8 : 2; // Sep for northern, Mar for southern
  return Array.from({ length: 24 }, (_, i) => {
    const month = i % 12;
    const d = Math.min(Math.abs(month - peak), 12 - Math.abs(month - peak));
    const seasonal = Math.cos((d / 6) * Math.PI);
    const yearTrend = i >= 12 ? 0.4 : 0;
    return Math.max(0, Math.min(5, Math.round(baseHeat - 0.8 + seasonal * 1.5 + yearTrend)));
  });
}

export function buildAtlasLocation(location: Location): AtlasLocation {
  const sites = getSitesByLocationId(location.id);
  const healthRecords = getReefHealthByLocationId(location.id);
  const coralCoverSnap = getCoralCoverForLocation(location.id);

  // Derive skill from sites (take minimum/easiest)
  const skillRank: Record<string, number> = {
    "never-dived": 0, "open-water": 1, advanced: 2, rescue: 3, divemaster: 4, tech: 5,
  };
  let minSkill = "open-water";
  let minRank = 99;
  for (const s of sites) {
    const r = skillRank[s.skillLevel] ?? 1;
    if (r < minRank) { minRank = r; minSkill = s.skillLevel; }
  }

  // Coral cover — prefer reef-health record, fall back to coral-cover snapshot
  let coverNow: number | null = null;
  let coverThen: number | null = null;
  let coverNowYear: number | null = null;
  let coverThenYear: number | null = null;

  for (const r of healthRecords) {
    const c = r.observed?.coralCoverPercent;
    if (c !== undefined && (coverNow === null || c > coverNow)) {
      coverNow = c;
      if (r.observed?.surveyDate) {
        coverNowYear = new Date(r.observed.surveyDate + "T00:00:00Z").getUTCFullYear();
      }
      const hist = r.observed?.historicalCoralCoverPercent;
      if (hist !== undefined) {
        coverThen = hist;
        if (r.observed?.historicalSurveyDate) {
          coverThenYear = new Date(r.observed.historicalSurveyDate + "T00:00:00Z").getUTCFullYear();
        }
      }
    }
  }

  if (coverNow === null && coralCoverSnap) {
    coverNow = coralCoverSnap.current.coverPercent;
    coverNowYear = coralCoverSnap.current.year;
    if (coralCoverSnap.historical) {
      coverThen = coralCoverSnap.historical.coverPercent;
      coverThenYear = coralCoverSnap.historical.year;
    }
  }

  // Locations carry no image of their own — borrow a representative hero from
  // the location's dive sites, preferring one that passes the underwater check.
  const heroImageUrl =
    location.heroImageUrl ??
    sites.find((s) => isUnderwaterQualityPhoto(s.heroImageUrl))?.heroImageUrl ??
    sites.find((s) => s.heroImageUrl)?.heroImageUrl;

  // Derive animal tags from species common names across all sites.
  const allSpeciesText = sites
    .flatMap((s) => s.species.map((sp) => sp.commonName.toLowerCase()))
    .concat(sites.map((s) => s.description.toLowerCase()))
    .join(" ");
  const animalTags: string[] = [];
  if (/shark|hammerhead|thresher|whitetip|blacktip|reef shark/.test(allSpeciesText)) animalTags.push("Sharks");
  if (/manta/.test(allSpeciesText)) animalTags.push("Mantas");
  if (/turtle/.test(allSpeciesText)) animalTags.push("Turtles");
  if (/whale/.test(allSpeciesText)) animalTags.push("Whales");
  if (/dolphin/.test(allSpeciesText)) animalTags.push("Dolphins");
  if (/dugong|manatee/.test(allSpeciesText)) animalTags.push("Dugongs");

  const heatLevel = getReefHeatLevel(location.id);
  const [x, y] = geoToMapXY(location.lat, location.lng);

  return {
    slug: location.slug,
    name: location.name,
    country: location.country,
    region: location.region,
    description: location.description,
    hook: location.description,
    state: getReefState(location.id),
    cover: coverNow !== null ? `${coverNow}%` : null,
    coverYear: coverNowYear,
    coverNow,
    coverThen,
    coverNowYear,
    coverThenYear,
    season: bestMonthsText(location.bestMonths),
    bestMonths: location.bestMonths,
    skill: skillText(minSkill),
    heatLevel,
    heatTrace: buildHeatTrace(heatLevel, location.lat),
    lastSurveyDays: getLastSurveyDays(location.id),
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    heroImageUrl,
    animalTags,
  };
}

export function getAllAtlasLocations(): AtlasLocation[] {
  return getAllLocations().map(buildAtlasLocation);
}

export function getAtlasLocationBySlug(slug: string): AtlasLocation | null {
  const loc = getAllLocations().find((l) => l.slug === slug);
  if (!loc) return null;
  return buildAtlasLocation(loc);
}
