# Architecture — scubaseason.fun

## Executive Summary

scubaseason.fun is a **fully static Next.js application** (App Router, SSG). All 304+ routes are pre-rendered at build time from a set of ~20 JSON data files. There is no backend service, no database, and no server-side rendering at request time. Data freshness is maintained by GitHub Actions workflows that run Node.js scripts against external APIs, write updated JSON files, commit them to `main`, and trigger a Vercel redeploy.

The architecture is deliberately simple: complexity lives in the data pipeline (scripts), not the web application itself.

## Architecture Pattern

**JAMStack — Static Site Generation with a Data Pipeline**

```
External APIs                 GitHub Actions / scripts
(NOAA, GFW, IUCN,        →   (fetch → write JSON → commit)
 iNaturalist, Claude API)
                                       ↓
                              src/data/*.json  (20 files, ~3 MB)
                                       ↓
                         src/lib/data/*.ts  (typed data loaders)
                                       ↓
                         Next.js App Router pages  (SSG, generateStaticParams)
                                       ↓
                              Vercel CDN  →  scubaseason.fun
```

## Technology Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.2.1 | App Router, RSC, Turbopack dev |
| Language | TypeScript | 5.x | strict mode, path alias `@/*` → `src/*` |
| React | React / react-dom | 19.2.4 | Server + Client components |
| CSS | Tailwind CSS | v4 | CSS-only config (no tailwind.config.js) |
| CSS extras | tw-animate-css | 1.4.0 | Animation utilities |
| UI primitives | @base-ui/react | 1.3.0 | Headless button primitive |
| Icons | lucide-react | 1.7.0 | |
| Class merging | clsx + tailwind-merge | — | via `cn()` in `src/lib/utils.ts` |
| 3D Globe | react-globe.gl + Three.js | 2.37.0 / 0.183.2 | Client-only, SSR disabled |
| Geo | topojson-client + world-atlas | 3.1.0 / 2.0.2 | Country polygon highlighting |
| Analytics | @vercel/analytics | 2.0.1 | Vercel Web Analytics |
| Validation (scripts) | zod | 3.25 | Schema validation for site data |
| AI (scripts) | @anthropic-ai/sdk | 0.40.1 | discover-sites.mjs |
| Node | — | 24 | `.nvmrc` |

## Site Structure

Six distinct route namespaces:

| Route | Purpose | Pages |
|---|---|---|
| `/` | Interactive atlas home (globe + filter grid) | 1 |
| `/sites`, `/sites/[slug]` | Flat site catalogue + per-site detail | 357 |
| `/locations/[slug]` | Location hubs with reef science + trip planning | 113 |
| `/where-to-see/[species]` | Species/encounter SEO landing pages | 11 |
| `/for/[cert]` | Certification-tier landing pages | 6 |
| `/about`, `/data`, `/faq` | Editorial/transparency content | 3 |

All dynamic routes use `generateStaticParams()` — the entire site is fully pre-rendered at build time.

## Component Model

All page files (`src/app/**/page.tsx`) are **Server Components** by default. They fetch data from `src/lib/data/` modules (synchronous JSON reads) and pass it as props to components.

**Client components** (`"use client"`) are used only when browser APIs are needed:

| Component | Why Client |
|---|---|
| `AtlasExplorer` | Filter state, URL sync via `useRouter`/`useSearchParams` |
| `AtlasFilterRail` | Interactive filter UI |
| `AtlasNav` | Typeahead search, keyboard navigation |
| `HomeGlobe` | SSR boundary for `PlanetGlobe` (`ssr: false`) |
| `PlanetGlobe` | Three.js / react-globe.gl — requires DOM |
| `SitesExplorer` | Filter state, URL sync |
| `AffiliateLink` | `window.va` (Vercel Analytics) click tracking |
| `Button` (ui) | @base-ui/react button primitive |
| `how-calculated.tsx` | Collapsible drawer, `useState` |

**Globe SSR pattern:** `HomeGlobe` wraps `PlanetGlobe` with `next/dynamic(..., {ssr: false})`. This boundary component must itself be a Client Component — this is the canonical Next.js pattern for Three.js integration.

## Data Architecture

### Static JSON Data Files (`src/data/`)

All user-facing data lives in 20 JSON files committed to the repo:

| File | Records | Refresh cadence |
|---|---|---|
| `sites.json` | 356 | When new sites are discovered (Mon/Wed/Fri CI, or blitz) |
| `locations.json` | 113 | Manual / blitz |
| `location-details.json` | 109 | Manual |
| `encounters.json` | 11 | Manual |
| `reef-health.json` | 116 | Nightly (NOAA CRW thermal stress block only) |
| `sightings.json` | 442 | Backfill scripts; future: nightly GBIF/OBIS |
| `reef-pressure.json` | 108 | Manual backfill |
| `fishing-pressure.json` | 113 | Weekly (GFW API) |
| `iucn-status.json` | 258 | Weekly |
| `coral-cover.json` | 13 jurisdictions | Monthly (citation URL validation only) |
| `species-photo-credits.json` | 520 | On-demand (`fetch-species-photos.mjs`) |
| `wrecks.json` | 30 | Manual |
| `water-quality.json` | 23 | Manual |
| `gear.json` | 32 | Manual |
| `operators.json` | 9 | Manual |
| `sources.json` | 63 | Manual (source registry) |
| `methodologies.json` | 18 | Manual (methodology registry) |
| `scuba-seasons.json` | 109 | Legacy (globe-only) |
| `coverage-gaps.json` | 100 | competitor-scan.sh |

### Typed Data Access Layer (`src/lib/data/`)

Each JSON file has a corresponding TypeScript module that:
1. Imports the JSON (resolved at build time via `resolveJsonModule`)
2. Builds `Map<id, record>` indexes for O(1) lookups
3. Exports named getter functions used by page components

No async data fetching occurs at page render time — all reads are synchronous Map lookups.

### Computed Views

`src/lib/atlas-location.ts` — the primary computed aggregation layer. `buildAtlasLocation(location)` merges data from 5+ modules into a single `AtlasLocation` shape powering the globe and filter grid. Computes reef state classification, coral cover prioritization, heat sparklines, and skill level from child sites.

`src/lib/data/reef-state.ts` — reef state classification logic (see Data Models).

## Data Freshness Strategy

| Data type | Mechanism | Frequency |
|---|---|---|
| NOAA thermal stress | GitHub Actions → `fetch-reef-health-live.mjs` → commit | Nightly 06:30 UTC |
| GFW fishing pressure | GitHub Actions → `fetch-fishing-pressure.mjs` → commit | Weekly Sunday 07:00 UTC |
| IUCN species status | GitHub Actions → `fetch-iucn-status.mjs` → commit | Weekly Monday 07:00 UTC |
| Coral cover citations | GitHub Actions → `fetch-coral-cover.mjs` → commit | Monthly 1st 07:00 UTC |
| New dive sites | GitHub Actions (PR) or blitz | Mon/Wed/Fri or manual |
| Sighting evidence | `backfill-sightings.mjs` (backfill); future nightly | Manual / planned nightly |

## SEO Architecture

- All dynamic routes implement `generateMetadata` with site-specific titles and OG images
- Static routes use `export const metadata`
- All routes inherit `metadataBase: https://scubaseason.fun` and `title.template: "%s | scubaSeason.fun"` from root layout
- Per-slug OG images generated via `ImageResponse` (Vercel OG)
- `sitemap.ts` generates sitemap entries with priority weights
- `robots.ts` allows all crawlers
- JSON-LD structured data via `<JsonLd>` component: `TouristAttraction` (sites), `Place` (locations), `CollectionPage` (landing pages), `Organization` + `WebSite` (sitewide), `Taxon` (species)

## Affiliate Architecture

Single env var per partner (e.g. `NEXT_PUBLIC_AMAZON_TAG`) → data references only partner name string → `<AffiliateLink partner="amazon" ...>` calls `enhanceAffiliateUrl()` at render to append tracking param. Graceful degradation when env var is unset. Editorial ranking code is audited by `scripts/audit-editorial-independence.mjs` to ensure commission values never appear in sorting/filtering logic.

## Security Notes

- No user authentication
- No server-side data mutation
- `<JsonLd>` uses `dangerouslySetInnerHTML` — safe because only internal schema-org helpers provide data
- GFW commercial-use ToS: free tier prohibits commercial use; requires resolution before affiliate revenue begins
- Rotate `ScubaSeason2026!@` on all affiliate accounts where it was used (it appeared in committed docs)
