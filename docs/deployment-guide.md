# Deployment Guide — scubaseason.fun

## Platform

**Vercel** — auto-detects Next.js, handles builds, CDN distribution, and preview deployments.

- Production URL: **https://scubaseason.fun**
- Analytics: Vercel Web Analytics (`@vercel/analytics`)
- OG images: Vercel OG via Next.js `ImageResponse`

## Deploy to Production

```bash
vercel deploy --prod
```

This is the standard "push to prod" shorthand. Deploys the current working tree to scubaseason.fun.

## Automatic Deployments

Vercel is connected to the GitHub repository. Any push to `main` triggers an automatic production deployment.

Most data pipeline scripts (see `Data Refresh Automation` below) commit directly to `main`, which automatically triggers a Vercel redeploy — this is the mechanism by which nightly NOAA data updates reach the live site.

## Preview Deployments

The GitHub Actions site discovery workflow (`discover-sites.yml`) opens PRs rather than committing directly. Vercel automatically creates a preview deployment for each PR, allowing human review of new dive site data before merging.

## Build Configuration

No `vercel.json` in the project. Vercel auto-detects the Next.js project and applies defaults:
- **Build command:** `next build`
- **Output directory:** `.next`
- **Node version:** 24 (from `.nvmrc`)
- **Framework preset:** Next.js

### Image Configuration (`next.config.ts`)

Only `https://upload.wikimedia.org` is whitelisted as a remote image domain (Wikimedia Commons hero images). iNaturalist CDN images are used directly via `<img>` tags (not `next/image`).

### Turbopack

Turbopack is enabled for the dev server only. Production builds use the standard webpack bundler.

## Environment Variables

Set in the Vercel project dashboard under Settings → Environment Variables.

### Required for full functionality

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_DIVEBOOKER_PID` | Production | DiveBooker affiliate (approved: `645`) |

### Optional (affiliate — graceful degradation if unset)

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_AMAZON_TAG` | Production | Amazon Associates (format: `yourtag-20`) |
| `NEXT_PUBLIC_BOOKING_AID` | Production | Booking.com partner ID (6-7 digit numeric) |
| `NEXT_PUBLIC_PADI_PARTNER` | Production | PADI Travel partner slug |
| `NEXT_PUBLIC_LIVEABOARD_AID` | Production | Liveaboard.com partner ID |
| `NEXT_PUBLIC_SCUBAPRO_AID` | Production | SCUBAPRO affiliate ID |
| `NEXT_PUBLIC_TRAVELPAYOUTS_AID` | Production | Travelpayouts numeric marker ID |

### Required for GitHub Actions (data pipeline)

Set as GitHub repository secrets:

| Secret | Purpose |
|---|---|
| `GFW_API_TOKEN` | Global Fishing Watch API (fishing pressure) |
| `IUCN_API_KEY` | IUCN Red List API v4 |
| `ANTHROPIC_API_KEY` | Anthropic API (site discovery) |

## Data Refresh Automation (GitHub Actions)

All workflows live in `.github/workflows/`. They run on schedule, execute a data script, commit any changes to `main`, and let Vercel auto-deploy.

| Workflow | Trigger | Script | Output file |
|---|---|---|---|
| `fetch-reef-health.yml` | Daily 06:30 UTC | `fetch-reef-health-live.mjs` | `reef-health.json` |
| `fetch-fishing-pressure.yml` | Weekly Sun 07:00 UTC | `fetch-fishing-pressure.mjs` | `fishing-pressure.json` |
| `fetch-iucn-status.yml` | Weekly Mon 07:00 UTC | `fetch-iucn-status.mjs` | `iucn-status.json` |
| `fetch-coral-cover.yml` | Monthly 1st 07:00 UTC | `fetch-coral-cover.mjs` | `coral-cover.json` |
| `discover-sites.yml` | Mon/Wed/Fri 07:12 UTC | `discover-sites.mjs` | Opens PR to `main` |
| `blitz-discover-sites.yml` | Manual (`workflow_dispatch`) | `discover-sites.mjs` (BLITZ=1) | Commits directly to `main` |

### Reef Health (nightly)
Updates only the `thermalStress` block in `reef-health.json`. Fetches NOAA CRW ERDDAP `NOAA_DHW` dataset for each location. No API key required. Commits if any values changed.

### Fishing Pressure (weekly)
Queries GFW 4Wings API for apparent fishing effort within 50 km of each location. Requires `GFW_API_TOKEN`. Skips silently if token unset.

### IUCN Status (weekly)
Refreshes Red List category, population trend, and assessment year for all species across encounters and sites. Requires `IUCN_API_KEY`. Preserves existing records on API failure.

### Site Discovery (Mon/Wed/Fri)
AI-driven dive site discovery using Claude (Haiku for gap-pick + self-review, Sonnet for research with web_search/web_fetch). Validates with Zod schema, deduplicates, opens a PR with Vercel preview URL for human review before merging.

## Monitoring

- **Vercel Dashboard** — deployment logs, build errors, function logs
- **Vercel Analytics** — page views, Web Vitals
- Data pipeline script logs: GitHub Actions run logs in the repository

## Rollback

Vercel maintains deployment history. To roll back:

```bash
vercel rollback [deployment-url]
# or use the Vercel dashboard → Deployments → Promote to Production
```

## Performance Notes

- The entire site is statically pre-rendered — Time to First Byte is CDN-speed
- `sites.json` is 2.5 MB — the largest file; it's imported at build time, not served to clients
- `PlanetGlobe` uses Three.js and is loaded client-side only (`ssr: false`) to avoid hydration issues
- World-atlas TopoJSON (for country polygon highlighting) is fetched from unpkg CDN at globe mount — not bundled
- Google Fonts (Noto Sans, IBM Plex Mono, Source Serif 4) are loaded via `next/font/google` with `display: swap`
