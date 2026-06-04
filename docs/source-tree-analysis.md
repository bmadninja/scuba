# Source Tree Analysis — scubaseason.fun

## Root

```
scuba/
├── src/                      # Application source
├── scripts/                  # Data pipeline scripts
├── docs/                     # Project documentation (this folder)
├── .github/workflows/        # GitHub Actions (data refresh + site discovery)
├── .planning/                # Active milestone planning documents
├── .planning-archive/        # Previous milestone archives
├── public/                   # Static assets (SVGs, icons)
├── logs/                     # Blitz run logs
├── tmp/                      # Temp files (PIDs, prompts, scratch)
├── notebooks/                # Colab notebooks (Gemini blitz)
├── next.config.ts            # Next.js 16 config (Turbopack, image domains)
├── tsconfig.json             # TypeScript config (strict, path aliases)
├── package.json              # Dependencies + npm scripts
├── postcss.config.mjs        # Tailwind v4 PostCSS plugin
├── eslint.config.mjs         # ESLint (next config)
├── components.json           # shadcn/ui config (base-nova style)
├── .nvmrc                    # Node 24
├── .env.example              # Env var template (all optional)
├── AGENTS.md                 # CRITICAL: read before writing Next.js code
├── CLAUDE.md                 # Points to AGENTS.md
├── README.md                 # Project intro
├── STATUS.md                 # Current status snapshot (may be stale)
└── STORIES.md                # User stories (21 passing verification)
```

## src/app/ — Next.js App Router

All page files are Server Components (no `"use client"`). All dynamic routes are fully pre-rendered via `generateStaticParams`.

```
src/app/
├── layout.tsx                # Root layout — fonts, AtlasNav, AtlasFooter, JSON-LD, Analytics
├── page.tsx                  # / — Atlas explorer (globe + filter grid)
├── globals.css               # Tailwind v4 + Atlas design system tokens
├── icon.tsx                  # Favicon: 🪸 coral emoji ImageResponse
├── opengraph-image.tsx       # Root OG card (1200×630)
├── robots.ts                 # allow: "/"
├── sitemap.ts                # Full site sitemap (304+ URLs)
│
├── about/page.tsx            # Mission, roadmap, affiliate disclosure
├── data/page.tsx             # Data transparency — sources, methodologies
├── faq/page.tsx              # Q&A on coral cover, projections, NOAA alerts
│
├── for/[cert]/               # Cert-level landing pages (6: never-dived → tech)
│   └── page.tsx              # generateStaticParams: 6 hardcoded slugs
│
├── locations/[slug]/         # Location detail pages (113)
│   ├── page.tsx              # Full reef health panel, sites grid, trip planning
│   └── how-calculated.tsx    # "use client" — collapsible methodology drawer
│
├── sites/
│   ├── page.tsx              # /sites — filterable site catalogue (SitesExplorer)
│   └── [slug]/
│       ├── page.tsx          # Site detail — species, conditions, gear, wrecks
│       └── opengraph-image.tsx  # Per-slug branded OG card
│
└── where-to-see/[species]/   # Species encounter landing pages (11)
    └── page.tsx              # Best locations + sites to see a species
```

## src/components/ — UI Components

```
src/components/
├── atlas-explorer.tsx        # "use client" — main home page orchestrator
├── atlas-filter-rail.tsx     # "use client" — filter sidebar + shared filter logic/types
├── atlas-footer.tsx          # Footer (server)
├── atlas-nav.tsx             # "use client" — sticky nav with typeahead search
├── home-globe.tsx            # "use client" — SSR boundary for PlanetGlobe
├── planet-globe.tsx          # "use client" — react-globe.gl/Three.js 3D globe
├── sites-explorer.tsx        # "use client" — /sites filter + grid
│
├── reef-location-card.tsx    # Atlas grid card (server)
├── site-card.tsx             # Site catalogue card (server)
│
├── coral-cover-panel.tsx     # Coral cover data panel (server)
├── fishing-pressure-panel.tsx # GFW fishing effort panel (server)
├── data-freshness-label.tsx  # Live/snapshot/presence pill badge (server)
├── iucn-badge.tsx            # IUCN threat status badge (server)
│
├── affiliate-disclosure.tsx  # One-liner disclosure (server)
├── affiliate-link.tsx        # "use client" — affiliate URL + analytics tracking
├── json-ld.tsx               # JSON-LD <script> injector (server)
│
└── ui/
    └── button.tsx            # "use client" — @base-ui/react button with CVA variants
```

## src/lib/ — Library Layer

```
src/lib/
├── data/
│   ├── types.ts              # All TypeScript interfaces (canonical type source)
│   ├── reef-state.ts         # Reef state classification + utilities (no JSON file)
│   ├── atlas-location.ts     # buildAtlasLocation() — aggregated computed view
│   │
│   ├── sites.ts              # sites.json loader (Map by slug + id)
│   ├── locations.ts          # locations.json loader
│   ├── location-details.ts   # location-details.json loader
│   ├── encounters.ts         # encounters.json loader
│   ├── operators.ts          # operators.json loader
│   ├── sightings.ts          # sightings.json loader + getHeadlineSightingForSite()
│   ├── reef-health.ts        # reef-health.json loader (indexed by locationId + siteId)
│   ├── reef-pressure.ts      # reef-pressure.json loader
│   ├── coral-cover.ts        # coral-cover.json loader (denormalizes appliesTo[])
│   ├── fishing-pressure.ts   # fishing-pressure.json loader
│   ├── iucn-status.ts        # iucn-status.json loader + IUCN_ENABLED flag
│   ├── sources.ts            # sources.json loader (source registry)
│   ├── methodologies.ts      # methodologies.json loader (methodology registry)
│   ├── gear.ts               # gear.json loader + getGearForLevel()
│   ├── wrecks.ts             # wrecks.json loader
│   ├── water-quality.ts      # water-quality.json loader
│   └── species-photos.ts     # species-photo-credits.json loader
│
├── affiliate.ts              # enhanceAffiliateUrl(), bookingUrlForOperator()
├── photo-quality.ts          # isUnderwaterQualityPhoto(), underwaterPhotoUrl()
├── schema-org.ts             # JSON-LD builders (siteSchema, locationSchema, etc.)
├── scuba-globe.ts            # Globe data layer (scuba-seasons.json, 109 entries)
├── site-config.ts            # SITE_URL, SITE_NAME, SITE_TAGLINE
└── utils.ts                  # cn() = twMerge(clsx(...))
```

## src/data/ — Static JSON Data

```
src/data/
├── sites.json                # 356 sites, 2.5 MB — largest file
├── locations.json            # 113 locations, 48 KB
├── location-details.json     # 109 editorial details, 124 KB
├── encounters.json           # 11 bucket-list encounters, 25 KB
├── reef-health.json          # 116 records (NOAA CRW + surveys), 122 KB
├── sightings.json            # 442 records, 231 KB
├── reef-pressure.json        # 108 records, 67 KB
├── fishing-pressure.json     # 113 records (GFW), 37 KB
├── iucn-status.json          # 258 species, 91 KB
├── species-photo-credits.json # 520 iNaturalist credits, 178 KB
├── coral-cover.json          # 13 NCRMP/AGRRA jurisdictions, 11 KB
├── wrecks.json               # 30 records, 26 KB
├── water-quality.json        # 23 records, 19 KB
├── gear.json                 # 32 items, 23 KB
├── operators.json            # 9 encounter operators, 4 KB
├── sources.json              # 63 source registry entries, 29 KB
├── methodologies.json        # 18 methodology notes, 10 KB
├── scuba-seasons.json        # 109 globe-view entries (legacy), 40 KB
└── coverage-gaps.json        # 100 competitor-identified gaps, 41 KB
```

## scripts/ — Data Pipeline

```
scripts/
├── lib/
│   └── site-schema.mjs       # Zod SiteSchema + LLM prompt description
│
├── discover-sites.mjs        # AI site discovery (Claude Haiku + Sonnet)
├── discover-prompt.md        # Prompt template for Claude Code CLI blitz mode
├── competitor-scan-prompt.md # Prompt for competitor gap analysis
├── competitor-scan.sh        # Scrapes PADI/liveaboard/magazine → coverage-gaps.json
│
├── fetch-reef-health-live.mjs   # NOAA CRW nightly thermal stress
├── fetch-fishing-pressure.mjs   # GFW weekly fishing effort
├── fetch-iucn-status.mjs        # IUCN Red List weekly refresh
├── fetch-coral-cover.mjs        # Coral cover citation URL validation
├── fetch-species-photos.mjs     # iNaturalist species photos
├── fetch-site-photos.mjs        # Wikimedia Commons site hero images
├── fetch-encounter-photos.mjs   # Wikimedia Commons encounter heroes
├── fetch-gear-photos.mjs        # Wikimedia Commons gear images
│
├── backfill-reef-health.mjs     # One-time reef health backfill (regional templates)
├── backfill-reef-pressure.mjs   # One-time reef pressure backfill
├── backfill-sightings.mjs       # Sighting evidence backfill (136 sites have zero)
├── backfill-trip-costs.mjs      # Trip cost estimate backfill
│
├── curate-lodging.mjs        # Populate lodging arrays on sites
├── enrich-lodging-tiers.mjs  # Infer/set priceLevel on lodging entries
│
├── validate-provenance.mjs   # Hard-error provenance validation (run in CI)
├── audit-data-provenance.mjs # Source coverage report
├── audit-editorial-independence.mjs  # Check no ranking code references commission
├── verify-stories.mjs        # Integration test suite (21 user stories)
│
├── migrate.ts                # One-shot legacy → normalized schema (already run)
│
├── blitz-supervisor.sh       # Restarts parallel blitz batch every 30 min
├── blitz-parallel.sh         # Launches 3 regional workers in parallel
├── blitz-worker.sh           # Single region worker (Claude Code CLI loop)
└── blitz-local.sh            # Single-worker local blitz
```

## .github/workflows/ — CI/CD

```
.github/workflows/
├── fetch-reef-health.yml     # Daily 06:30 UTC
├── fetch-fishing-pressure.yml # Weekly Sunday 07:00 UTC
├── fetch-iucn-status.yml     # Weekly Monday 07:00 UTC
├── fetch-coral-cover.yml     # Monthly 1st 07:00 UTC
├── discover-sites.yml        # Mon/Wed/Fri 07:12 UTC (opens PR)
└── blitz-discover-sites.yml  # Manual dispatch (3 parallel jobs, commits directly)
```

## .planning/ — Milestone Planning

```
.planning/
├── PROJECT.md                # Project charter + goals
├── REQUIREMENTS.md           # M2 requirements (22 items, phases 6–10)
├── ROADMAP.md                # Phase breakdown + build order
├── STATE.md                  # Current state tracker (may be stale — check STATUS.md)
├── config.json               # Planning tool config
└── research/sources-m3/      # External data source research for M3
    ├── conditions-forecasting.md
    ├── human-pressure.md
    ├── ocean-health.md
    ├── pressure-mpa.md
    ├── sightings.md
    ├── water-quality.md
    └── wrecks-bathymetry.md
```
