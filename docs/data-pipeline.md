# Data Pipeline — scubaseason.fun

## Overview

scubaseason.fun has no live backend. All user-facing data lives in JSON files in `src/data/`. The "pipeline" is a collection of Node.js scripts (in `scripts/`) that fetch from external APIs, write updated JSON files, and commit them to `main` — triggering a Vercel redeploy that ships the updated data to the live site.

## End-to-End Flow

```
External API / Source
        │
        ▼
scripts/fetch-*.mjs  (data fetchers, run by GitHub Actions)
scripts/backfill-*.mjs  (one-time backfills, run manually)
scripts/discover-sites.mjs  (AI site discovery)
        │
        ▼
src/data/*.json  (committed static data)
        │
        ▼
src/lib/data/*.ts  (typed loaders with Map indexes)
        │
        ▼
Next.js pages  (SSG, all data read at build time)
        │
        ▼
scubaseason.fun  (Vercel CDN)
```

## External Data Sources

| Source | Script | API / URL | Auth |
|---|---|---|---|
| NOAA Coral Reef Watch (ERDDAP) | `fetch-reef-health-live.mjs` | `https://coastwatch.pfeg.noaa.gov/erddap/griddap/NOAA_DHW.json` | None |
| Global Fishing Watch 4Wings | `fetch-fishing-pressure.mjs` | `https://gateway.api.globalfishingwatch.org/v3/4wings/report` | `GFW_API_TOKEN` |
| IUCN Red List API v4 | `fetch-iucn-status.mjs` | `https://api.iucnredlist.org/api/v4/...` | `IUCN_API_KEY` |
| iNaturalist API v1 | `fetch-species-photos.mjs` | `https://api.inaturalist.org/v1/taxa` | None |
| Wikimedia Commons API | `fetch-site-photos.mjs`, etc. | `https://commons.wikimedia.org/w/api.php` | None |
| Anthropic Claude API | `discover-sites.mjs` | claude-sonnet-4-6 + web tools | `ANTHROPIC_API_KEY` |
| NCRMP + AGRRA reports | `fetch-coral-cover.mjs` | Citation URLs (HEAD validation only) | None |

## Automated Data Refresh (GitHub Actions)

| Workflow | Schedule | What it does |
|---|---|---|
| Nightly reef health | Daily 06:30 UTC | NOAA CRW → updates `thermalStress` block in `reef-health.json` |
| Weekly fishing pressure | Sunday 07:00 UTC | GFW → rewrites `fishing-pressure.json` |
| Weekly IUCN | Monday 07:00 UTC | IUCN Red List → rewrites `iucn-status.json` |
| Monthly coral cover | 1st of month 07:00 UTC | Validates citation URLs in `coral-cover.json` |
| Site discovery (PR) | Mon/Wed/Fri 07:12 UTC | AI pipeline → opens PR with 1 new site |
| Blitz (manual) | `workflow_dispatch` | AI pipeline × 3 parallel regions → commits directly |

## Script Reference

### fetch-reef-health-live.mjs
Updates only `thermalStress` blocks in `reef-health.json` with NOAA CRW data. Preserves all survey/observed data.

**Key logic:** For each location, queries ERDDAP griddap over a 0.3° bounding box. Variables: `CRW_BAA` (Bleaching Alert Area 0–4), `CRW_DHW` (Degree Heating Weeks), `CRW_SSTANOMALY`. Maps BAA integer to `BleachingAlertLevel` string. Pace: 250ms between requests. Fails hard if >20% of locations fail.

**Output:** `src/data/reef-health.json`

---

### fetch-fishing-pressure.mjs
Queries GFW 4Wings for apparent fishing effort near each location.

**Key logic:** Builds a 100 km × 100 km bounding-box GeoJSON polygon per location. POSTs to 4Wings report endpoint for current year and 4 years prior (comparison baseline). Pace: 3s between locations. Skips silently if `GFW_API_TOKEN` unset.

**Output:** `src/data/fishing-pressure.json`

---

### fetch-iucn-status.mjs
Refreshes IUCN category, population trend, and assessment year for every species in the dataset.

**Key logic:** Collects unique scientific binomials from `encounters.json` and `sites.json`. Per species: queries by genus+species name, filters to global assessments, picks latest by `year_published`, then fetches assessment detail for `population_trend`. Preserves existing records on API failure. Pace: 1.2s between species.

**Output:** `src/data/iucn-status.json`

---

### fetch-species-photos.mjs
Adds iNaturalist species photos to every species entry across all sites.

**Key logic:** Three-pass search per species: scientific name at species rank → scientific name free-text → common name. Writes `default_photo.square_url` to each matching species entry in `sites.json`. Also writes a credits file for attribution display.

**Outputs:** `src/data/sites.json` (imageUrl on species entries), `src/data/species-photo-credits.json`

---

### fetch-site-photos.mjs
Assigns Wikimedia Commons hero photos to dive sites. Hard rule: every accepted photo must be underwater.

**Key logic:** Two-pass per site. Pass 1: site-specific Wikimedia search with underwater keyword filter + dedup check. Pass 2: species-based fallback. Falls through to `heroImageUrl: null` on miss.

**Output:** `src/data/sites.json` (heroImageUrl)

---

### fetch-coral-cover.mjs
Validates citation URLs in the human-curated coral cover dataset. Cover percentages are never auto-rewritten — they come from NCRMP/AGRRA PDF reports with no queryable API.

**Output:** `src/data/coral-cover.json` (only `lastBuiltAt` changes)

---

### discover-sites.mjs
AI-driven autonomous dive site discovery agent using Claude.

**Models:** Haiku (gap-pick + self-review), Sonnet (research with web_search/web_fetch tools)

**5-step pipeline per site:**
1. **Gap pick** (Haiku): Given coverage stats, pick highest-value missing site
2. **Research** (Sonnet): Agentic loop up to 20 turns, ≥3 sources required
3. **Validation**: Zod `SiteSchema.safeParse()` — hard fail on any error
4. **Dedup check**: rejects same id/slug, same normalized name, or within 2 km of any existing site
5. **Self-review** (Haiku): Confidence score 0–1; score < 0.8 → rejected

**Write modes:**
- Normal: writes to `sites.json`, opens a GitHub PR for review
- Dry run (`DRY_RUN=1`): writes to `sites.proposed.json`, no commit
- Blitz (`BLITZ=1`): commits and pushes after each accepted site with optimistic-lock retry

**Discovery priority:** checks `src/data/coverage-gaps.json` first (competitor-sourced gaps), then fills by locations with `siteCount < 2`.

---

### backfill-sightings.mjs
Generates one synthetic sighting evidence record per site for the headline species, where none exists.

**Key logic:** Uses `species[0]` as headline species. Derives `lastConfirmedAt` from most recent past `bestMonths` entry (anchored to May 2026). Sets `recentRecordCount` based on species residency pattern. Source IDs always include GBIF + OBIS, plus taxon-specific sources for sharks/mantas/whales.

**Output:** `src/data/sightings.json` (appends, preserves existing)

---

### backfill-reef-health.mjs
Generates initial `reef-health.json` records using regional templates (PLAN map assigns each locationId to a template encoding coral cover %, bleaching %, alert level, DHW, outlook copy).

**Output:** `src/data/reef-health.json` (appends, preserves existing)

---

### backfill-reef-pressure.mjs
Generates initial `reef-pressure.json` records using MPA/fishing regional templates.

**Output:** `src/data/reef-pressure.json` (appends, preserves existing)

---

### backfill-trip-costs.mjs
Generates trip cost estimates per location using ~35 regional templates (round-trip flight ranges from 5 hub cities, lodging by tier, dive packages, local transfers, park fees). All USD.

**Output:** `src/data/trip-costs.json` (appends, preserves existing)

---

### validate-provenance.mjs
Hard-error validation of all data provenance relationships. Exits 1 on errors.

Checks: source/methodology registry integrity, encounter/sighting/reef-health/reef-pressure/wreck/water-quality provenance links, no `probabilityPercent` on sightings, dual-key guard on reef-health records.

---

### audit-editorial-independence.mjs
Scans `src/app`, `src/components`, `src/lib` for any reference to `commission` outside the allowlist. Exits 1 if ranking/filtering code references commission — enforces the invariant that editorial recommendations cannot be influenced by affiliate revenue.

---

### audit-data-provenance.mjs
Checks sourceIds/methodologyClaimIds coverage across all entities. Writes Markdown report to `_bmad-output/implementation-artifacts/data-audit/source-coverage-report.md`.

## The Blitz System

High-throughput parallel site discovery for bulk population runs.

```
blitz-supervisor.sh          (restarts batch every 30 min)
  └── blitz-parallel.sh      (3 region workers, 5s stagger)
        ├── blitz-worker.sh [indo-pacific]
        ├── blitz-worker.sh [americas-atlantic]
        └── blitz-worker.sh [indian-med-africa]
              └── claude --print (discover-prompt.md, up to 60 turns)
```

Each worker: `git pull --rebase` → Claude Code CLI → parse `DONE: <name>` or `EXHAUSTED` → wait 45s → repeat. Stops after 3 consecutive EXHAUSTED or 5 no-result.

**Current status:** PAUSED by PM decision. Resume only after sighting evidence zero-count is near zero (currently 136/380 sites = 36% have no sightings).

## Site Schema Validation (Zod)

`scripts/lib/site-schema.mjs` exports `SiteSchema` — enforced on every `discover-sites.mjs` output:

| Field | Constraint |
|---|---|
| `id`, `slug` | `/^[a-z0-9-]+$/` (kebab-case) |
| `description` | 80–800 chars |
| `species` | ≥2 entries; seasonal reliability requires `bestMonths` |
| `conditionsByMonth` | Exactly 12 entries |
| `editorialRank` | Integer 1–100 |
| `getThere` | ≥40 chars |
| `heroImageUrl` | Valid URL or null |

The same schema includes `SCHEMA_DESCRIPTION_FOR_LLM` — hard rules given to Claude: ≥3 independent sources for lat/lng and depth, no hallucination, `heroImageUrl` must be a verified Wikimedia Commons URL or null.
