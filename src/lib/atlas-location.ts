import { getAllLocations, getLocationById } from "@/lib/data/locations";
import { getSitesByLocationId } from "@/lib/data/sites";
import { getReefHealthByLocationId } from "@/lib/data/reef-health";
import { getCoralCoverForLocation } from "@/lib/data/coral-cover";
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
  diveTypeTags: string[];
  maxCurrentStrength: "none" | "mild" | "moderate" | "strong";
};

// ─── Wildlife taxonomy (Story 7.2 / 7.3) ──────────────────────────────────────
// Categorised wildlife tags, each derived at build time from a regex over the
// species common names + site descriptions aggregated per location. This array
// is the single source of truth for the filter UI (atlas-filter-rail.tsx imports
// WILDLIFE_TAXONOMY) and for the per-location `animalTags`.
//
// Data-coverage rule (Story 7.2): every tag below resolves to ≥1 location in the
// live data (verified 2026-06-04 across 113 locations). Per-tag counts:
//   Sharks 87 · Hammerheads 27 · Rays & mantas 71 · Eagle rays 37 ·
//   Whales 31 · Dolphins 17 · Seals & sea lions 6 · Dugongs 2 ·
//   Sea turtles 64 · Large pelagics 74 · Reef fish 79 ·
//   Cephalopods 27 · Frogfish & seahorses 27 · Nudibranchs 16 · Corals & inverts 80
// No candidate tag resolved to 0, so none were dropped. If site data changes and
// a tag falls to 0 locations, drop it here and from the UI's survivor set.
export type WildlifeTag = { tag: string; test: RegExp };
export type WildlifeSubGroup = { group: string; tags: WildlifeTag[] };

export const WILDLIFE_TAXONOMY: WildlifeSubGroup[] = [
  {
    group: "Sharks & rays",
    tags: [
      { tag: "Whale sharks", test: /whale shark/ },
      { tag: "Sharks", test: /shark/ },
      { tag: "Hammerheads", test: /hammerhead/ },
      { tag: "Rays & mantas", test: /manta|stingray|devil ray|\bray\b/ },
      { tag: "Eagle rays", test: /eagle ray/ },
    ],
  },
  {
    group: "Marine mammals",
    tags: [
      { tag: "Whales", test: /whale/ },
      { tag: "Dolphins", test: /dolphin/ },
      { tag: "Seals & sea lions", test: /seal|sea lion/ },
      { tag: "Dugongs", test: /dugong|manatee/ },
    ],
  },
  {
    group: "Reptiles & pelagics",
    tags: [
      { tag: "Sea turtles", test: /turtle/ },
      { tag: "Large pelagics", test: /tuna|trevally|jack|barracuda|marlin|sailfish|wahoo|mola|sunfish/ },
      { tag: "Reef fish", test: /wrasse|parrotfish|grouper|snapper|angelfish|butterflyfish|anthias|damselfish|fusilier/ },
    ],
  },
  {
    group: "Macro & critters",
    tags: [
      { tag: "Cephalopods", test: /octopus|cuttlefish|squid|nautilus/ },
      { tag: "Frogfish & seahorses", test: /frogfish|seahorse|pipefish|seadragon/ },
      { tag: "Nudibranchs", test: /nudibranch|sea slug/ },
      { tag: "Corals & inverts", test: /coral|gorgonian|sea fan|lobster|\bcrab\b|shrimp|anemone/ },
    ],
  },
];

/** Flat list of every shipped wildlife tag, in taxonomy order. */
export const WILDLIFE_TAGS: string[] = WILDLIFE_TAXONOMY.flatMap((g) =>
  g.tags.map((t) => t.tag),
);

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

  // Every location uses its OWN hero photo. We deliberately do not borrow a
  // dive site's photo here — that produced duplicate images across the atlas.
  // A location without its own photo shows a gradient placeholder (handled in
  // the card/hero components), never a borrowed one.
  const heroImageUrl = location.heroImageUrl ?? undefined;

  // Derive animal tags from species common names across all sites.
  const allSpeciesText = sites
    .flatMap((s) => s.species.map((sp) => sp.commonName.toLowerCase()))
    .concat(sites.map((s) => s.description.toLowerCase()))
    .join(" ");
  const animalTags: string[] = WILDLIFE_TAXONOMY.flatMap((g) => g.tags)
    .filter((t) => t.test.test(allSpeciesText))
    .map((t) => t.tag);

  // Derive dive type tags — union of all sites' diveTypes at this location.
  const diveTypeTags: string[] = Array.from(
    new Set(sites.flatMap((s) => s.diveTypes as string[])),
  );

  // Derive max current strength across all sites and all months.
  const CURRENT_RANK: Record<string, number> = { none: 0, mild: 1, moderate: 2, strong: 3 };
  let maxCurrentRank = 0;
  for (const s of sites) {
    for (const m of s.conditionsByMonth ?? []) {
      const r = CURRENT_RANK[m.currentStrength] ?? 0;
      if (r > maxCurrentRank) maxCurrentRank = r;
    }
  }
  const RANK_TO_CURRENT = ["none", "mild", "moderate", "strong"] as const;
  const maxCurrentStrength = RANK_TO_CURRENT[maxCurrentRank];

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
    diveTypeTags,
    maxCurrentStrength,
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
