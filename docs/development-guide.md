# Development Guide — scubaseason.fun

## Prerequisites

- **Node.js 24** (use nvm: `nvm use` in project root reads `.nvmrc`)
- **npm** (no other package managers tested)
- Git

Optional for data pipeline scripts:
- `ANTHROPIC_API_KEY` — discover-sites.mjs (site discovery)
- `GFW_API_TOKEN` — fetch-fishing-pressure.mjs
- `IUCN_API_KEY` — fetch-iucn-status.mjs

## Local Setup

```bash
# Clone and install
git clone <repo>
cd scuba
nvm use          # switches to Node 24
npm install

# Copy env template
cp .env.example .env.local
# Fill in only the vars you need (all are optional/graceful-degrading)

# Start dev server (Turbopack)
npm run dev
# → http://localhost:3000
```

**Important:** Read `AGENTS.md` before writing any Next.js code. This project uses Next.js 16 which has breaking API changes vs training data. The authoritative docs are in `node_modules/next/dist/docs/`.

## npm Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start Turbopack dev server |
| `npm run build` | Production build (runs `next build`) |
| `npm start` | Start production server |
| `npm run lint` | ESLint (Next.js config, no custom rules) |
| `npm run verify:stories` | Integration tests against live dev server |
| `npm run validate:provenance` | Validate all data provenance + methodology references |
| `npm run audit:data` | Source coverage report (which entities lack sourceIds) |
| `npm run audit:independence` | Check that no ranking/filter code references commission |
| `npm run discover:dry` | Dry-run site discovery (writes to `sites.proposed.json`) |
| `npm run discover` | Live site discovery (writes to `sites.json`) |
| `npm run migrate` | One-shot legacy data migration (already run) |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (fonts, nav, footer, JSON-LD)
│   ├── page.tsx            # Home / atlas explorer
│   ├── globals.css         # Tailwind v4 + design system tokens
│   ├── about/page.tsx
│   ├── data/page.tsx       # Data transparency
│   ├── faq/page.tsx
│   ├── for/[cert]/page.tsx # Cert-level landing pages
│   ├── locations/[slug]/   # Location detail + how-calculated.tsx
│   ├── sites/              # Site catalogue + [slug] detail
│   └── where-to-see/[species]/page.tsx
│
├── components/             # UI components (see component-inventory.md)
│   └── ui/button.tsx       # Only shadcn/base-ui primitive
│
├── lib/
│   ├── data/               # Typed data access layer
│   │   ├── types.ts        # All TypeScript interfaces
│   │   ├── reef-state.ts   # Reef state classification + utilities
│   │   ├── atlas-location.ts # Computed AtlasLocation aggregation
│   │   └── *.ts            # One module per JSON data file
│   ├── affiliate.ts        # Affiliate URL enhancement
│   ├── photo-quality.ts    # Underwater photo validation
│   ├── schema-org.ts       # JSON-LD builders
│   ├── scuba-globe.ts      # Globe data (scuba-seasons.json)
│   ├── site-config.ts      # SITE_URL, SITE_NAME, SITE_TAGLINE
│   └── utils.ts            # cn() utility

src/data/                   # Static JSON data files (~20 files)
scripts/                    # Data pipeline Node.js scripts
.github/workflows/          # CI/CD (data refresh + site discovery)
docs/                       # Project documentation (this folder)
.planning/                  # Milestone planning documents
```

## TypeScript

- **Path alias:** `@/*` → `./src/*` (configured in `tsconfig.json`)
- **strict mode** is on
- `resolveJsonModule: true` — JSON files importable directly
- `scripts/` is excluded from TypeScript compilation (scripts use `.mjs`)

## CSS / Tailwind

- **Tailwind v4** — no `tailwind.config.js`; configured entirely via `src/app/globals.css`
- Custom CSS properties defined in `globals.css`: atlas colors, reef state chips, heat ramp tokens, card/layout/map/sparkline/IUCN/species row classes
- `cn()` in `src/lib/utils.ts` = `twMerge(clsx(...inputs))` for conditional class composition

## Data Development

### Adding a new location or site

1. Run `npm run discover:dry` to test the AI pipeline — it writes to `sites.proposed.json`
2. Review the proposed site JSON for accuracy
3. Run `npm run discover` (or push to trigger the GitHub Action)
4. Run `npm run validate:provenance` to ensure provenance is intact

### Updating data manually

Edit the relevant JSON file in `src/data/`. Run `npm run validate:provenance` afterwards to check integrity.

### Adding a new data field

1. Add the field to the relevant interface in `src/lib/data/types.ts`
2. Update the data loader in `src/lib/data/*.ts` if indexing changes
3. Update `scripts/lib/site-schema.mjs` if it affects site schema validation
4. Run `npm run build` to catch TypeScript errors

### Running data pipeline scripts individually

```bash
# Refresh NOAA thermal stress data
node scripts/fetch-reef-health-live.mjs

# Refresh GFW fishing pressure (requires GFW_API_TOKEN in env)
GFW_API_TOKEN=... node scripts/fetch-fishing-pressure.mjs

# Refresh IUCN species status (requires IUCN_API_KEY in env)
IUCN_API_KEY=... node scripts/fetch-iucn-status.mjs

# Fetch iNaturalist species photos
node scripts/fetch-species-photos.mjs

# Backfill sighting evidence for sites with zero records
node scripts/backfill-sightings.mjs

# Validate data provenance
node scripts/validate-provenance.mjs

# Run editorial independence audit
node scripts/audit-editorial-independence.mjs
```

## Testing

**No unit test framework** is installed (no Jest/Vitest).

**Integration tests** via `npm run verify:stories`:
- Requires `npm run dev` running in another terminal
- Tests 21 user stories: homepage renders, nav links, site pages (all section headings, conditions table, gear sections), filter UI, sitemap.xml, robots.txt, JSON data integrity, top-10 destinations coverage, lint
- Filter by story: `node scripts/verify-stories.mjs --story=B2,B3`

**Data validation** via `npm run validate:provenance`:
- Validates all source + methodology references across every data file
- Exits 1 if hard errors; exits 0 with warnings only
- Run this after any data file changes

## Common Development Tasks

### Check what's failing in stories
```bash
npm run dev &
node scripts/verify-stories.mjs
```

### Check data integrity after edits
```bash
npm run validate:provenance
npm run audit:data
```

### Verify build succeeds before deploying
```bash
npm run build
```

### Deploy to production
```bash
vercel deploy --prod
# → ships to scubaseason.fun
```

## Environment Variables

All optional with graceful fallbacks. Set in `.env.local` for local development.

### Client-side (affiliate IDs)
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_AMAZON_TAG` | Amazon Associates tag |
| `NEXT_PUBLIC_BOOKING_AID` | Booking.com partner ID |
| `NEXT_PUBLIC_PADI_PARTNER` | PADI Travel partner slug |
| `NEXT_PUBLIC_TRAVELPAYOUTS_AID` | Travelpayouts marker ID |
| `NEXT_PUBLIC_LIVEABOARD_AID` | Liveaboard.com partner ID |
| `NEXT_PUBLIC_DIVEBOOKER_PID` | DiveBooker partner ID (approved: `645`) |
| `NEXT_PUBLIC_SCUBAPRO_AID` | SCUBAPRO affiliate ID |

### Server-side (data pipeline only)
| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Site discovery (discover-sites.mjs) |
| `GFW_API_TOKEN` | Global Fishing Watch API |
| `IUCN_API_KEY` | IUCN Red List API |

## Key Conventions

- **No hyphens** (`-`) in user-facing site copy; use em dashes (`—`) if needed
- All hero images must be underwater photographs (reject surface/specimen/studio shots)
- Hero image subject must match what the site is known for (wreck → wreck photo, not generic reef)
- `probabilityPercent` on sighting records is **explicitly forbidden** — no per-dive probabilities
- Every data claim must have `sourceIds` and `methodologyClaimIds` pointing to registry entries
- Editorial ranking/filtering code must never reference `commission` (enforced by `audit:independence`)
