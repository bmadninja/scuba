# Component Inventory — scubaseason.fun

All components in `src/components/`. All pages in `src/app/` are Server Components.

## Client vs Server Split

**Server Components** (no directive — render on server, zero JS shipped):
`AffiliateDisclosure`, `AtlasFooter`, `CoralCoverPanel`, `DataFreshnessLabel`, `FishingPressurePanel`, `IucnBadge`, `IucnAttribution`, `JsonLd`, `ReefLocationCard`, `SiteCard`

**Client Components** (`"use client"` — interactive, shipped to browser):
`AffiliateLink`, `AtlasExplorer`, `AtlasFilterRail`, `AtlasNav`, `HomeGlobe`, `PlanetGlobe`, `SitesExplorer`, `Button`

## Component Reference

### AffiliateDisclosure
`src/components/affiliate-disclosure.tsx` | Category: Affiliate | Server

One-liner disclosure ("Some links earn us a commission") with link to `/about`. No props.

---

### AffiliateLink
`src/components/affiliate-link.tsx` | Category: Affiliate | **Client**

Renders an `<a>` tag that rewrites affiliate URLs via `enhanceAffiliateUrl()` and fires a Vercel Analytics event on click. Sets `rel="sponsored"` when `isAffiliate=true`.

```typescript
Props {
  url: string
  event: "gear_click" | "lodging_click" | "operator_click" | "flight_click"
  partner: string
  query?: string
  productId?: string
  siteId: string
  isAffiliate: boolean
  className?: string
  children: ReactNode
}
```

---

### AtlasExplorer
`src/components/atlas-explorer.tsx` | Category: Composite Explorer | **Client**

Main atlas page orchestrator. Owns shared filter state and drives three synchronized views: `AtlasFilterRail` (sidebar), `HomeGlobe` (3D globe), and the results card grid (`ReefLocationCard[]`). URL search params kept in sync for shareability.

```typescript
Props {
  locations: FilterLocation[]
  regions: string[]
  skills: string[]
}
```

State: `filters` (synced to URL), `activeSlug` (globe-to-card highlight).
Memos: `results` (filtered locations), `markers` (globe PlanetMarker array), `highlightedCountries`.

---

### AtlasFilterRail
`src/components/atlas-filter-rail.tsx` | Category: Filter | **Client**

Left sidebar filter panel. Facets: reef state, evidence gaps, thermal stress, wildlife, best month, certification level, region (continent accordion). Also exports all shared filter logic and types used by `AtlasExplorer`.

```typescript
Props {
  filters: Filters
  onChange: (next: Filters) => void
  onReset: () => void
  regions: string[]
  skills?: string[]
}

// Also exports (used by AtlasExplorer):
export type { FilterLocation, SortKey, Filters }
export { STATE_VALUES, ANIMAL_OPTIONS, DEFAULT_FILTERS, SORT_OPTIONS }
export { parseFilters, filtersToParams, applyFilters }
```

---

### AtlasFooter
`src/components/atlas-footer.tsx` | Category: Layout | Server

Site-wide footer. Logo, tagline, contact email, nav links, data-disclaimer bar. No props.

---

### AtlasNav
`src/components/atlas-nav.tsx` | Category: Navigation | **Client**

Sticky top nav bar with typeahead search (client-side filter of `entries`), keyboard navigation (arrows, Enter, Escape), and active-link highlighting.

```typescript
Props {
  entries?: SearchEntry[]  // { slug, name, country, region, state }[]
}
```

State: `q` (search query), `open` (dropdown), `sel` (keyboard index), `containerRef` (click-outside).

---

### CoralCoverPanel
`src/components/coral-cover-panel.tsx` | Category: Data Display | Server

Coral cover benthic snapshot card: program name, current % cover, historical comparison, trend arrow, methodology text, source link. Uses `DataFreshnessLabel`.

```typescript
Props { snapshot: CoralCoverSnapshot }
```

---

### DataFreshnessLabel
`src/components/data-freshness-label.tsx` | Category: Badge | Server

Pill badge communicating data currency. Three variants via discriminated union:

| Variant | Color | When |
|---|---|---|
| `live` | Green | NOAA CRW live data, shows update date |
| `snapshot` | Amber | In-situ survey, shows method + date + years-ago if >2yr |
| `presence` | Grey | GBIF/OBIS occurrence records |

All variants link to `/data`.

```typescript
// Simplified — discriminated union on `variant`
Props {
  variant: "live" | "snapshot" | "presence"
  source?: string
  surveyMethod?: string  // required for "snapshot"
  surveyDate?: string
  updatedAt?: string
  className?: string
}
```

---

### FishingPressurePanel
`src/components/fishing-pressure-panel.tsx` | Category: Data Display | Server

GFW fishing-effort card: radius, current year fishing hours, historical comparison, trend %, and a prominent AIS-coverage caveat box.

```typescript
Props { record: FishingPressureRecord }
```

---

### HomeGlobe
`src/components/home-globe.tsx` | Category: Globe | **Client**

Thin SSR boundary wrapper. Lazy-loads `PlanetGlobe` with `ssr: false` (required for Three.js). Shows animated skeleton while loading. Re-exports the same props as `PlanetGlobe`.

```typescript
Props {
  markers: PlanetMarker[]
  highlightedCountries: string[]
  onMarkerClick?: (m: PlanetMarker) => void
}
```

---

### PlanetGlobe
`src/components/planet-globe.tsx` | Category: Globe | **Client** (never SSR'd)

Full interactive 3D globe using react-globe.gl / Three.js. Features: country polygon highlighting, colored HTML marker pins with halo rings, auto-rotate with camera fly-in on selection, click-triggered popover (reef state, season, in-season chip, location link), responsive sizing via ResizeObserver, load-error fallback.

```typescript
interface PlanetMarker {
  lat: number; lng: number; label: string
  id?: string; slug?: string; site?: string; country?: string; region?: string
  color?: string; stateLabel?: string; seasonText?: string; isInSeason?: boolean
  // + extended fields for sightings, dive style, gear, etc.
}

Props {
  initialMonth?: number
  highlightedCountries?: string[]
  markers?: PlanetMarker[]
  onMarkerClick?: (m: PlanetMarker) => void
  focusPoint?: { lat: number; lng: number; altitude?: number }
}
```

State: responsive dimensions, country polygon data, selectedMarkerId.
External data: fetches world-atlas TopoJSON from unpkg CDN at mount.

---

### IucnBadge + IucnAttribution
`src/components/iucn-badge.tsx` | Category: Badge | Server

`IucnBadge` renders a flat-pill IUCN threat status badge: code chip (e.g. "CR"), full category label, optional population trend, optional assessment year. Links to IUCN assessment URL. Color-coded by category via hardcoded `FLAT_TONE` map.

`IucnAttribution` is a companion footnote explaining scope limitations.

```typescript
Props { status: IucnStatus; className?: string }
```

---

### JsonLd
`src/components/json-ld.tsx` | Category: SEO | Server

Renders `<script type="application/ld+json">` for structured data. Accepts any plain object from schema-org helpers.

```typescript
Props { data: object }
```

Uses `dangerouslySetInnerHTML` — safe because only internal schema-org helpers provide data.

---

### ReefLocationCard
`src/components/reef-location-card.tsx` | Category: Card | Server

Atlas grid card. Shows: hero image, reef state badge, "In season now" badge, skill level, site name, country, hook text (2-line clamped), freshness indicators (thermal dot + survey dot), coral cover % + best season stat.

```typescript
interface ReefLocationCardData {
  slug: string; name: string; country: string; hook: string
  state: ReefState; cover: string | null; coverYear?: number
  season: string; skill: string; heroImageUrl?: string
  inSeason?: boolean; lastSurveyDays?: number
}

Props { r: ReefLocationCardData }
```

---

### SiteCard
`src/components/site-card.tsx` | Category: Card | Server

Dive site card for the `/sites` grid. Shows: hero image, country, in/off season pill, name, description, headline sighting (species + last confirmed + confidence dot), depth range, skill level, first dive type tag.

```typescript
Props {
  site: Site
  location?: Location | null
  inSeason: boolean
}
```

Calls `getHeadlineSightingForSite(site.id)` at render time.

---

### SitesExplorer
`src/components/sites-explorer.tsx` | Category: Composite Explorer | **Client**

Filter + results UI for `/sites`. Filters: text search, target encounter (wildlife), cert level, dive types (multi-select), travel month, reef health stress. Horizontal filter bar (vs. `AtlasExplorer`'s sidebar rail). Results sorted by `editorialRank`. All state URL-driven via `useSearchParams`.

```typescript
Props {
  sites: Site[]
  locationsById: Record<string, Location>
  currentMonth: number
}
```

No `useState` — all filter state lives in URL search params.
Module-level constants `ENCOUNTERS` and `ALERT_BY_LOCATION` pre-computed once at load.

---

### Button (`ui/button.tsx`)
`src/components/ui/button.tsx` | Category: Button | **Client**

Design-system button on `@base-ui/react/button` with CVA variants.

```typescript
Variants:
  variant: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link"
  size: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg"
```

Exports both `Button` (component) and `buttonVariants` (CVA function for reuse without rendering).

## Design System Tokens

| Token | Value | Usage |
|---|---|---|
| Primary blue | `#0089de` | Interactive elements, active states, borders |
| Background tint | `#f1f7fb`, `#eaf4fb` | Card/panel backgrounds |
| Max content width | `max-w-[1320px]` | Page wrapper |
| Content gutter | `px-7` | Horizontal padding |
| State: thriving | `#10b981` | Reef state badge |
| State: pressure | `#0089de` | Reef state badge |
| State: change | `#f43f5e` | Reef state badge |

## Shared Utilities

| Utility | File | Used by |
|---|---|---|
| `cn()` | `src/lib/utils.ts` | `Button`, any inline class merging |
| `underwaterPhotoUrl()` | `src/lib/photo-quality.ts` | `ReefLocationCard`, `SiteCard` |
| `isUnderwaterQualityPhoto()` | `src/lib/photo-quality.ts` | `atlas-location.ts` |
| `STATE_TEXT`, `STATE_COLOR`, `STATE_DEF` | `src/lib/data/reef-state.ts` | `AtlasExplorer`, `AtlasFilterRail`, `ReefLocationCard` |
| `freshness()` | `src/lib/data/reef-state.ts` | `AtlasFilterRail`, `ReefLocationCard` |
| `enhanceAffiliateUrl()` | `src/lib/affiliate.ts` | `AffiliateLink` |
