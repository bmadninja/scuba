---
title: scubaSeason.Fun — Architecture
created: 2026-05-15
scope: technical decisions for PRD §3 scope. Lean — covers what the implementer needs, no more.
status: draft
---

# Architecture

## 1. Stack (locked)

- **Framework:** Next.js 16 App Router (Turbopack), React 19
- **Styling:** Tailwind v4, shadcn/ui component primitives, `@base-ui/react` for headless interactions
- **Globe:** `react-globe.gl` (kept — `three` peer dep already wired)
- **Hosting:** Vercel (already connected; default Next.js adapter)
- **Language:** TypeScript strict
- **Data:** Static JSON files in `src/data/` (loaded at build time via direct import). No database.
- **Search (client):** `fuse.js` for fuzzy text search on `/sites`. Added when F4 lands.
- **Analytics:** Vercel Analytics — cookieless, zero-config, free tier covers MVP traffic. Avoids cookie banner (NFR5).

**Out-of-scope for MVP:** databases, auth, serverless functions (other than Next.js routing), CDN beyond Vercel's default, ISR/revalidation (full static build — rebuild on data change is acceptable for our cadence).

## 2. Data Model

Two top-level JSON files in `src/data/`. Both committed to git — the dataset *is* the product.

### 2.1 `locations.json` — country/region containers

```ts
type Location = {
  id: string;            // "maldives", "raja-ampat"
  slug: string;          // URL slug (same as id for now)
  name: string;          // "Maldives"
  country: string;       // ISO country name
  region: string;        // "Indian Ocean", "Coral Triangle"
  countryCode: string;   // ISO-3166 alpha-2, for globe highlight
  lat: number;           // center for globe marker
  lng: number;
  description: string;   // 1-2 sentence overview
  bestMonths: number[];  // 1-12, dive season for this location overall
  siteIds: string[];     // child sites (denormalized for fast lookup)
  heroImageUrl?: string;
};
```

### 2.2 `sites.json` — individual dive sites

```ts
type Site = {
  id: string;                    // "maldives-manta-point"
  slug: string;
  locationId: string;            // FK → Location.id
  name: string;                  // "Manta Point"
  lat: number;
  lng: number;
  description: string;           // editorial overview (1-3 paragraphs)
  depthRange: { min: number; max: number };   // meters
  skillLevel: SkillLevel;        // minimum recommended
  diveTypes: DiveType[];         // ['large-pelagics', 'coral', ...]
  species: SpeciesEntry[];       // see 2.3
  conditionsByMonth: ConditionsMonth[];  // 12 entries
  bestMonths: number[];          // 1-12
  editorialRank: number;         // 0-100, manual sort weight
  heroImageUrl?: string;
  // Affiliate/booking arms — each defaults to []
  getThere: PartnerLink[];       // flights/transit
  lodging: PartnerLink[];        // hotels/liveaboards
  operators: PartnerLink[];      // dive shops/boats
  gearIds: string[];             // FK → Gear.id (Layer A computed by user's cert)
  siteSpecificGear: SiteGearItem[];   // Layer B (this site only)
  notes?: string;                // internal notes, not rendered
};

type SkillLevel = 'never-dived' | 'open-water' | 'advanced' | 'rescue' | 'divemaster' | 'tech';

type DiveType = 'large-pelagics' | 'coral' | 'macro' | 'wrecks' | 'geology' | 'blackwater';

type SpeciesEntry = {
  commonName: string;
  scientificName?: string;
  reliability: 'year-round' | 'seasonal' | 'rare';
  bestMonths?: number[];
  depthRange?: { min: number; max: number };
};

type ConditionsMonth = {
  month: number;                 // 1-12
  waterTempC: { min: number; max: number };
  visibilityM: { min: number; max: number };
  currentStrength: 'none' | 'mild' | 'moderate' | 'strong';
  suitRecommendation: string;    // "3mm shorty", "5mm full"
};

type PartnerLink = {
  partner: string;               // "Booking.com", "PADI Travel"
  label: string;                 // display text
  url: string;                   // affiliate URL with our tag
  productId?: string;
  isAffiliate: boolean;          // false = transparency link, no disclosure markup
};

type SiteGearItem = {
  name: string;                  // "Reef hook"
  reason: string;                // one sentence: "Strong currents at Batu Bolong require anchoring"
  gearId?: string;               // optional ref to Gear.id for affiliate
};
```

### 2.3 `gear.json` — shared gear catalogue

```ts
type Gear = {
  id: string;                    // "scuba-mask-cressi-f1"
  name: string;
  category: GearCategory;
  levels: SkillLevel[];          // which segments this fits
  description: string;
  priceRangeUsd: { min: number; max: number };
  partners: GearPartner[];       // multiple affiliate options per item
};

type GearCategory = 'mask' | 'fins' | 'snorkel' | 'wetsuit' | 'bcd' | 'regulator' | 'computer' | 'light' | 'reel-smb' | 'reef-hook' | 'boots' | 'gloves' | 'bag' | 'specialty';

type GearPartner = {
  partner: 'amazon' | 'dgx' | 'divers-direct' | 'leisure-pro' | 'scuba-com';
  productId: string;
  url: string;
  commission: number;            // % at time of capture; for our records only
};
```

### 2.4 Why this shape

- **Site references Location, not nested.** Flat is easier to scrape into and to query client-side.
- **Gear by ID with site referencing it.** One mask appears on 50 sites. Single source of truth means swapping a partner URL touches one file.
- **Per-month conditions are explicit, not generated.** Real dive conditions don't fit a sine wave — they're scraped/curated per-month.
- **`editorialRank` is manual** (PRD A3). When dataset grows, we add `popularityScore` from analytics; rank is a tiebreaker.
- **Booking arrays are typed identically.** One render component handles all three (flights/lodging/operators).

## 3. Routes

```
src/app/
├── page.tsx                    # / — landing (globe + featured)
├── about/page.tsx              # /about — affiliate disclosure, mission
├── sites/
│   ├── page.tsx                # /sites — search + filter list
│   └── [slug]/page.tsx         # /sites/[slug] — detail (FR1)
├── locations/
│   └── [slug]/page.tsx         # /locations/[slug] — location overview
└── api/
    └── (none — all static)
```

- `generateStaticParams` on `/sites/[slug]` and `/locations/[slug]` builds every page at build time (NFR1, NFR2)
- `sitemap.ts` generates dynamic sitemap from `locations.json` + `sites.json`
- `robots.ts` allows all crawlers; affiliate redirect paths excluded later if needed

## 4. State Management

- **No global store.** Filter state lives in URL params (FR2.2) read via `useSearchParams`. Diver profile (cert + recency) in `localStorage`, exposed via a custom hook `useDiverProfile()`.
- **Server components by default.** Globe, filter drawer, search input are client components (`'use client'`). Detail page sections are server components — they read static JSON at build, no client JS for content.
- **No SWR/React Query.** No remote data fetching at runtime.

## 5. Filter & Search Architecture

- **Filter state → URL params:** `month`, `cert`, `recency`, `region`, `tripStyle`, `diveTypes[]`, `species`
- **Filtering happens client-side** on a pre-built index. At build time, generate `src/data/_index.json` containing a compact subset of sites (id, slug, name, lat, lng, bestMonths, skillLevel, diveTypes, speciesNames[], regionId) — 10-50KB even at 500 sites.
- **Search:** `fuse.js` over the same index, weighted: `name` 3x, `species` 2x, `location` 1x.
- **Cert filter logic:** show sites where `Site.skillLevel <= user cert`. (Tech can dive Open Water sites; reverse doesn't hold.)
- **Recency filter logic:** when "2+ years ago", also tag refresher-friendly operators in results.

## 6. Scraper (Data Pipeline)

Lives **outside** the Next.js runtime. Standalone Node scripts in `scripts/scrape/`.

```
scripts/scrape/
├── sources/
│   ├── divezone.ts             # one module per source site
│   ├── deeperblue.ts
│   └── operators/              # per-operator scrapers
├── normalize.ts                # raw scrape → Site/Location shape
├── paraphrase.ts               # LLM rewrite (anthropic SDK call)
├── merge.ts                    # merge into existing JSON (preserves manual edits)
└── run.ts                      # orchestrator: scrape → normalize → paraphrase → merge
```

- **Run mode:** local one-shot for MVP (`npm run scrape -- --location=maldives`). No cron, no scheduled refresh — PRD decision pending Q-scrape-2.
- **Output:** writes to `src/data/sites.json` etc. directly. Git diff is the review surface — operator inspects diffs before committing.
- **Paraphrase pass:** optional flag `--paraphrase`. Calls Anthropic API with system prompt "rewrite this dive site description in our voice, preserving facts." Stored fields tag `_source: { url, scrapedAt, paraphrased: true }` for auditability.
- **Rate limit / robots.txt:** baseline 1 req/sec per source, honor robots.txt, custom User-Agent identifying us.
- **Image scraping:** **disabled by default** — image rights unresolved (PRD A8). Scraper records image URLs without downloading.

## 7. Affiliate Link Plumbing

- **Storage:** as shown in `PartnerLink` / `GearPartner` types. URL already contains affiliate tag at JSON-write time.
- **Rendering:** single `<AffiliateLink>` component that:
  - Renders `<a target="_blank" rel="nofollow sponsored noopener">`
  - Fires `gear_click` / `lodging_click` / `operator_click` / `flight_click` event to Vercel Analytics with `{site_id, partner, product_id}` (FR5.4)
  - Renders the "earns commission" indicator if `isAffiliate: true`
- **Disclosure component** `<AffiliateDisclosure>` placed at the bottom of any block with affiliate links (FR5.3)
- **No server-side redirect tracking.** Direct outbound is simpler and what Vercel Analytics handles.

## 8. Image Strategy (interim)

- For now, sites without `heroImageUrl` render a placeholder gradient with the site name and depth glyph.
- When image URLs land (via PRD A8), they go to `public/images/sites/{slug}.jpg`. Use Next.js `<Image>` with `priority` on hero only.
- No external CDN — Vercel's image optimizer handles it within their hosting.

## 9. Build & Deploy

- **CI:** none for MVP (single developer + AI). `npm run build` runs locally before push.
- **Deploy:** Vercel auto-deploys from `main`. Preview deploys on PR branches.
- **Data update flow:** edit JSON locally → `npm run build` to verify → commit → push → Vercel rebuilds. ~2-3 min end-to-end.
- **Sitemap regenerates every build** from JSON. No external SEO tools.

## 10. Things Explicitly NOT Decided Here

- Database migration path (would happen if dataset crosses ~500 sites or non-engineers need to edit. Likely Postgres on Vercel/Neon)
- Internationalization (English only)
- A/B testing infrastructure (Vercel Edge Config when needed)
- User accounts / dive log (PRD v2)
- Real-time sighting feed (PRD v2)

## 11. Risks the Architecture Carries

- **Scraper fragility.** Source sites change layout; scraper breaks silently if not run regularly. Mitigation: write tests that assert minimum fields populated; CI step optional later.
- **JSON-in-git scale.** At ~500 sites with full conditions/species data, JSON could hit 1-2MB. Still within Next.js comfort zone. Past that → DB.
- **Affiliate link rot.** Partner URLs change. Mitigation: `lastCheckedAt` field on each `PartnerLink` (add when needed); manual quarterly audit until automated.
- **Globe perf with 500+ markers.** `react-globe.gl` handles it, but consider clustering at globe-wide zoom (markers within 5° collapse to a country pin).

## 12. Implementation Order (mirrors PRD §10, refined)

1. **Schema migration script** — `scripts/migrate.ts`: reads `scuba-seasons.json`, emits `locations.json` (109 entries) + `sites.json` (empty for now) + `gear.json` (seed 20 common items)
2. **Type definitions + data loaders** — `src/lib/data/{locations,sites,gear}.ts` typed accessors
3. **Site detail page** `/sites/[slug]` with the two-column layout from UX notes
4. **3 flagship sites curated end-to-end** (Maldives Manta Point, Komodo Batu Bolong, Galápagos Darwin's Arch)
5. **Top filter bar + diver profile banner** (FR2 + FR2.1a)
6. **/sites search/list page** with Fuse + cards
7. **Globe redesign per UX A** (ocean-bright, coral pins, mask glyph)
8. **Affiliate component + disclosure** + Vercel Analytics events
9. **Scraper MVP** for one source (Divezone), wired to populate 1 flagship location
10. **SEO polish:** sitemap, metadata, OG images, schema.org markup
