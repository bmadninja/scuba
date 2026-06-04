# Project Documentation Index — scubaseason.fun

**Generated:** 2026-06-03 | **Mode:** initial_scan (exhaustive) | **Project type:** web (Next.js monolith)

## Project Overview

- **Type:** Monolith — single Next.js 16 App Router application
- **Primary Language:** TypeScript 5
- **Architecture:** Static Site Generation (SSG) — fully pre-rendered from JSON data files
- **Deploy:** Vercel → https://scubaseason.fun
- **Node version:** 24

## Quick Reference

| | |
|---|---|
| Framework | Next.js 16.2.1 (App Router, RSC, Turbopack dev) |
| React | 19.2.4 |
| CSS | Tailwind v4 (CSS-only config) |
| Data | ~20 static JSON files in `src/data/` (~3 MB total) |
| Routes | 304+ (all pre-rendered at build time) |
| Sites | 380 dive sites, 113 locations, 11 encounters |
| Entry point | `src/app/layout.tsx` → `src/app/page.tsx` |
| Data entry | `src/lib/data/types.ts` (all TypeScript types) |

## Generated Documentation

- [Project Overview](./project-overview.md) — purpose, tech stack, current status
- [Architecture](./architecture.md) — system design, data flow, component model, SEO, affiliate
- [Data Models](./data-models.md) — all TypeScript types, reef state classification, data relationships
- [Component Inventory](./component-inventory.md) — all UI components with props and patterns
- [Development Guide](./development-guide.md) — local setup, scripts, testing, conventions
- [Deployment Guide](./deployment-guide.md) — Vercel, GitHub Actions, environment variables
- [Data Pipeline](./data-pipeline.md) — external APIs, scripts, automation, blitz system
- [Source Tree Analysis](./source-tree-analysis.md) — annotated directory structure

## Existing Documentation

- [Product Charter](./product-charter.md) — mission, positioning, editorial principles
- [PM Log](./pm-log.md) — key decisions and findings (2026-05-29 entry)
- [Affiliate Setup](./affiliate-setup.md) — affiliate programs status and architecture
- [Colab Blitz](./colab-blitz.md) — Colab/Gemini parallel site discovery system

## Getting Started

### Run locally

```bash
nvm use          # Node 24
npm install
npm run dev      # → http://localhost:3000
```

### Verify everything works

```bash
# In one terminal:
npm run dev

# In another:
npm run verify:stories  # 21 integration tests
npm run validate:provenance  # data integrity check
```

### Deploy

```bash
vercel deploy --prod  # → scubaseason.fun
```

## Key Architecture Decisions

1. **Fully static** — no server-side rendering at request time. All 304+ routes pre-rendered at build time from JSON files. Complexity lives in the data pipeline, not the app.

2. **JSON as database** — all data committed to `src/data/`. GitHub Actions scripts keep it fresh. Vercel auto-redeploys on commit. No backend service needed.

3. **Reef state classification** — three states (`thriving` / `pressure` / `change`) computed from NOAA thermal stress + in-situ coral surveys + GFW fishing pressure. See `src/lib/data/reef-state.ts`.

4. **Provenance-first data model** — every data claim references `sourceIds[]` and `methodologyClaimIds[]`. No `probabilityPercent` on sightings. `validate-provenance.mjs` enforces integrity at CI time.

5. **Globe SSR boundary** — `HomeGlobe` wraps `PlanetGlobe` with `next/dynamic({ssr: false})` — the canonical Next.js pattern for Three.js / react-globe.gl.

6. **Editorial independence** — affiliate commissions can never influence rankings. Enforced by `audit-editorial-independence.mjs`.

## Current Gaps (as of 2026-06-03)

- **136/380 sites (36%) have zero sighting evidence** — top M2 priority
- ~5 locations missing reef-health records
- Only 2 coral cover data points (MERMAID API integration proposed for multi-year trends)
- Affiliate activations incomplete: DiveBooker approved (`645`); others pending or CAPTCHA-blocked
- `STATE.md` is stale — use `STATUS.md` + `docs/product-charter.md` as truth
- GFW commercial-use ToS may require resolution before monetization begins

## For AI-Assisted Development

When using this documentation to plan new features:

- **Full-stack features:** Reference `architecture.md` + `data-models.md` + `component-inventory.md`
- **Data changes:** Reference `data-models.md` + `data-pipeline.md` — always run `validate-provenance.mjs` after
- **UI features:** Reference `component-inventory.md` — note client vs server component split carefully
- **New routes:** All dynamic routes need `generateStaticParams()` — the site is 100% SSG
- **New data source:** Add to `sources.json` registry + `methodologies.json` before claiming data
- **Brownfield PRD:** Point the PRD workflow to this index (`docs/index.md`)
