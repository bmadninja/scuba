# Project Overview — scubaseason.fun

## Purpose

**scubaseason.fun** is a trip-planning atlas for scuba divers built around one question: *where should I dive, when?* It pairs a curated catalogue of dive sites and locations with a source-aware science layer (reef health, species sightings, thermal stress, fishing pressure) so divers make decisions based on honest evidence rather than marketing claims.

**Core value proposition:** "Species-chaser grade depth that generic dive search can't match." Every claim is traceable to a named source. No per-dive probabilities without an effort denominator. Editorial recommendations are never influenced by affiliate revenue.

## Quick Reference

| Field | Value |
|---|---|
| **URL** | https://scubaseason.fun |
| **Framework** | Next.js 16.2.1 (App Router, RSC, Turbopack dev) |
| **Language** | TypeScript 5, strict mode |
| **UI** | React 19, Tailwind CSS v4, @base-ui/react |
| **Deploy** | Vercel (static pre-render, 304+ routes) |
| **Node version** | 24 (`.nvmrc`) |
| **Repository type** | Monolith |
| **Architecture** | Fully static (SSG) — all data in JSON, no server-side rendering at request time |

## Tech Stack Summary

| Category | Technology |
|---|---|
| Framework | Next.js 16.2.1 App Router |
| React | 19.2.4 |
| Styling | Tailwind CSS v4, tw-animate-css |
| UI Components | @base-ui/react (headless), shadcn scaffolding (base-nova style), lucide-react icons |
| 3D Globe | react-globe.gl 2.37.0 + Three.js 0.183.2 |
| Geo | topojson-client 3.1.0, world-atlas 2.0.2 |
| Analytics | @vercel/analytics |
| AI (scripts) | @anthropic-ai/sdk — used in discover-sites.mjs |
| Validation (scripts) | zod 3.25 |
| Data | ~20 static JSON files in `src/data/` |

## Architecture Type

**Static Site Generation (SSG) with a data pipeline.** The entire site pre-renders at build time from JSON data files. No API calls at user request time. Data is kept fresh by GitHub Actions workflows and Node.js scripts that write to JSON files and trigger Vercel redeploys.

## Repository Structure

```
scuba/
├── src/
│   ├── app/           # Next.js App Router pages (all SSG)
│   ├── components/    # React UI components (server + client)
│   ├── lib/
│   │   ├── data/      # Typed data access layer (reads JSON files)
│   │   └── *.ts       # Utility libraries (affiliate, schema-org, etc.)
│   └── data/          # Static JSON data (~20 files, ~3 MB total)
├── scripts/           # Node.js data pipeline scripts
├── .github/workflows/ # GitHub Actions (nightly/weekly data refresh)
├── docs/              # Project documentation (this folder)
└── .planning/         # Milestone planning documents
```

## Current Status (as of 2026-06-03)

- **380 dive sites** across **113 locations** (countries/regions)
- **11 bucket-list encounters** (marine species/events)
- **442 sighting evidence records** — but 136/380 sites (36%) have zero sightings
- **116 reef-health records**, ~5 locations still missing one
- **258 IUCN species** statuses loaded
- **113 fishing-pressure records** (GFW, refreshed weekly)
- Milestone 1 fully shipped; Milestone 2 active (sighting backfill is top priority)

## Key Links

- [Architecture](./architecture.md) — system design, data flow, component model
- [Data Models](./data-models.md) — TypeScript types, JSON schemas, data relationships
- [Component Inventory](./component-inventory.md) — all UI components
- [Development Guide](./development-guide.md) — local setup, scripts, testing
- [Deployment Guide](./deployment-guide.md) — Vercel deployment, CI/CD
- [Data Pipeline](./data-pipeline.md) — external APIs, scripts, automation
- [Source Tree](./source-tree-analysis.md) — annotated directory structure
