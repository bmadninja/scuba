import { z } from "zod";

const SKILL_LEVELS = ["never-dived", "open-water", "advanced", "tech"];
// Keep in sync with the DiveType union in src/lib/data/types.ts.
const DIVE_TYPES = [
  "large-pelagics",
  "coral",
  "macro",
  "wrecks",
  "geology",
  "blackwater",
  "drift",
  "cave",
  "wall",
  "night",
  "muck",
];
const RELIABILITY = ["year-round", "seasonal", "rare"];
const CURRENT = ["none", "mild", "moderate", "strong"];

const MonthRange = z.object({
  min: z.number().int(),
  max: z.number().int(),
});

export const SiteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  locationId: z.string(),
  name: z.string().min(2),
  // Absolute https URL (Wikimedia/Pexels) OR a root-relative self-hosted path
  // (/heroes/*.webp), which the OIB localisation pipeline writes.
  heroImageUrl: z
    .string()
    .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
      message: "must be an absolute URL or a root-relative path",
    })
    .nullable(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
  description: z.string().min(80).max(800),
  depthRange: z.object({
    min: z.number().int().nonnegative(),
    max: z.number().int().positive(),
  }),
  skillLevel: z.enum(SKILL_LEVELS),
  diveTypes: z.array(z.enum(DIVE_TYPES)).min(1),
  species: z
    .array(
      z.object({
        commonName: z.string(),
        scientificName: z.string().optional(),
        reliability: z.enum(RELIABILITY),
        bestMonths: z.array(z.number().int().min(1).max(12)).optional(),
      }),
    )
    .min(2),
  conditionsByMonth: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        waterTempC: MonthRange,
        visibilityM: MonthRange,
        currentStrength: z.enum(CURRENT),
        suitRecommendation: z.string(),
      }),
    )
    .length(12),
  bestMonths: z.array(z.number().int().min(1).max(12)).min(1),
  editorialRank: z.number().int().min(1).max(100),
  getThere: z.string().min(40),
  lodging: z.array(z.object({})).default([]),
  operators: z.array(z.object({})).default([]),
  gearIds: z.array(z.string()).default([]),
  siteSpecificGear: z.array(z.object({})).default([]),
  notes: z.string().nullable().optional(),
});

export const SCHEMA_DESCRIPTION_FOR_LLM = `
Return STRICT JSON for a dive site matching this TypeScript shape (no extra fields):

{
  id: string,              // kebab-case, prefix with locationId: "{locationId}-{site-slug}"
  slug: string,            // same as id
  locationId: string,      // MUST be one provided in the candidate list
  name: string,
  heroImageUrl: string | null,   // ONLY a Wikimedia Commons URL (https://upload.wikimedia.org/...) or null
  lat: number, lng: number,
  description: string,     // 80-800 chars, evocative, factual, mention what makes it special
  depthRange: { min: number, max: number },     // meters, integers
  skillLevel: "never-dived" | "open-water" | "advanced" | "tech",
  diveTypes: ("large-pelagics" | "coral" | "geology" | "wrecks" | "macro" | "cave" | "drift")[],   // 1+
  species: [{
    commonName: string,
    scientificName?: string,
    reliability: "year-round" | "seasonal" | "rare",
    bestMonths?: number[]        // 1-12, required when reliability="seasonal"
  }, ...],                       // 2+ entries. MARINE FAUNA ONLY — see hard rules below
  conditionsByMonth: [           // EXACTLY 12 entries, month 1..12
    {
      month: 1..12,
      waterTempC: { min, max },
      visibilityM: { min, max },
      currentStrength: "none" | "mild" | "moderate" | "strong",
      suitRecommendation: string  // e.g. "Tropical wetsuit", "5mm full"
    }
  ],
  bestMonths: number[],        // 1-12 subset, peak diving months
  editorialRank: 1..100,       // 90+ for world-class, 70-89 great, 50-69 solid
  getThere: string,            // 40+ chars: nearest airport(s), transfer logistics
  lodging: [],                 // leave empty array
  operators: [],               // leave empty array
  gearIds: [],                 // leave empty array
  siteSpecificGear: [],        // leave empty array
  notes: string | null         // permits, hazards, access restrictions
}

Hard rules:
- NO hallucination. Every fact (depth, species, conditions) must come from a source you cited.
- If you cannot find ≥3 independent corroborating sources for lat/lng and depth, refuse.
- heroImageUrl MUST be a real Wikimedia Commons file URL you verified, or null.
- description must NOT use marketing fluff ("paradise", "unforgettable"). Be concrete.
- species MUST be fauna a diver/snorkeler can actually encounter UNDERWATER at this
  site: fish, sharks/rays, corals, mollusks (nudibranchs, octopus, cuttlefish),
  crustaceans, echinoderms, sea turtles, marine mammals (whales, dolphins, seals,
  manatees), sea snakes. NEVER include land/coastal wildlife just because it lives
  near the site's coordinates — no birds (kookaburras, gulls, ibis, ospreys...), no
  land reptiles or mammals (water dragons, wallabies...), no insects. If you are
  unsure whether a species is seen underwater during the dive itself, leave it out.
- lat/lng MUST be the actual coordinates of this specific site, and MUST be
  geographically plausible for the given locationId (the same country/region, not
  just "somewhere with a similar name"). A site named after a famous wreck or
  landmark that turns out to be thousands of km from the target location is NOT a
  match for that location — refuse instead of filing it there.
`;
