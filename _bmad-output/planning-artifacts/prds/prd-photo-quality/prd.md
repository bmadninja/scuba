---
title: Photo Quality Uplift
status: draft
created: 2026-06-05
updated: 2026-06-05
---

# Photo Quality Uplift

## Problem Statement

scubaseason.fun currently serves three categories of photos — site heroes, location heroes, and species thumbnails — but all three fall short of a quality bar appropriate for an aspirational dive-planning product:

1. **Species thumbnails are tiny.** `fetch-species-photos.mjs` grabs `square_url` from iNaturalist, which is 75×75 px. Cards that render at 200–400 px stretch these into blurry artifacts.

2. **Relevance is species-only, not encounter-context.** A species photo for "Blacktip reef shark" at Cape Kri may show a specimen jar, a hand-drawing, or a shark photographed off South Africa. The user intent is "will I see this animal here?" — the image should convey that encounter, not just the taxonomy.

3. **Coverage gaps.** Several location heroes and site heroes fall back to a gradient placeholder because no qualifying image was found on the first automated pass.

4. **No uniqueness constraint.** The same Wikimedia or iNaturalist image can appear as the hero for multiple locations, multiple sites, and in multiple species cards simultaneously. Users scrolling the Atlas see the same frame repeatedly, which reads as low-effort.

---

## Goals

1. Every species card on a site-detail page (`/sites/[slug]`) shows a **contextually relevant underwater photo of that species** — sharp enough to read at 300–400 px rendered width, with no blurring.
2. Every location hero and site hero displays a **unique** underwater photograph — no two heroes on the same page share the same source URL, and the same image is never reused as a hero on a different location or site.
3. All currently-null hero images (`heroImageUrl: null` in `locations.json` and `sites.json`) are filled in with a qualifying photo.
4. Minimum quality thresholds are enforced in the fetch scripts and documented so future additions stay consistent.

### Non-Goals

- Uploading or hosting photos ourselves (we continue to hotlink CC-licensed sources)
- Real-time photo refresh or user-submitted photos
- Photo quality scoring via ML / vision API (manual heuristics are sufficient for now)

---

## Quality Rules

These rules apply to **all** photo categories unless otherwise noted.

### Rule Q1 — Underwater-only

A photo is accepted only if its filename, title, description, or Wikimedia categories contain at least one of the underwater context words already defined in `fetch-site-photos.mjs`:

```
underwater, under water, diver, divers, diving, scuba,
snorkel, snorkeling, snorkelling, reef, coral, wreck,
subsea, submerged, submarine, freediv, cenote, cavern,
cave dive, blue hole
```

For iNaturalist photos: the observation must have `quality_grade: "research"` (community-verified) and the `place_guess` or taxon must be aquatic/marine.

### Rule Q2 — Minimum dimensions

| Photo type | Minimum source width |
|---|---|
| Location hero | 1600 px |
| Site hero | 1200 px |
| Species thumbnail | 800 px (use iNaturalist `large_url` or Wikimedia 1000 px crop; never `square_url` or `thumb_url`) |
| Encounter hero (`/where-to-see/`) | 1600 px |

### Rule Q3 — No specimen / illustration / surface shots

Reject any image whose filename or Wikimedia categories contain:

```
specimen, preserved, museum, collection, jar, taxidermy,
illustration, drawing, diagram, map, aerial, boat, surface,
port, dock, beach, above water
```

This is the existing `BAD_FILE_HINTS` list in `fetch-site-photos.mjs`, extended with the terms above.

### Rule Q4 — Uniqueness per page

Within a single rendered page, no two photos may share the same source URL. Concretely:

- A location page (`/locations/[slug]`) may not use the same image as its hero **and** as a species thumbnail or site-card photo anywhere on that page.
- A site page (`/sites/[slug]`) may not reuse the hero image in any species card on that page.

### Rule Q5 — Global hero uniqueness

The same URL may not be used as the hero for more than one location **or** more than one site. The fetch scripts must maintain a `used-hero-urls.json` registry (or equivalent in-memory dedup during a full refresh run) and skip any candidate already claimed.

---

## Species Photo Strategy

Current behaviour: one iNaturalist photo per species key (scientific + common name), shared across every site that lists that species.

**New behaviour:**

Each site × species pair may have its own photo. The fetch logic should:

1. **Look up the species in iNaturalist**, preferring observations tagged to the same geographic region as the site (use `place_id` or bounding box derived from the site's `lat`/`lng`).
2. **Pick the highest-quality research-grade observation photo** from that region — use `photos[0].url` replacing `/square.` with `/large.` to get 1024-px source (iNaturalist URL pattern: `https://inaturalist-open-data.s3.amazonaws.com/photos/{id}/large.{ext}`).
3. **Fall back to any region** if no regional photo meets Q1–Q3.
4. **Fall back to Wikimedia Commons** search for `"{species common name}" underwater` if iNaturalist yields nothing qualifying.
5. **Leave null** (renders gradient) only after all three attempts fail.

The fetched URL and provenance (taxon ID, observation ID, license, attribution) must be stored in `species-photo-credits.json` with the site slug as an additional key so attribution can be rendered per-site.

---

## Location & Site Hero Strategy

Existing logic in `fetch-site-photos.mjs` is sound but needs:

1. **Higher resolution floor** — currently `iiurlwidth: 2000` is requested but not enforced as a minimum. Add a post-download check: skip any candidate where the returned `thumburl` width is below the threshold in Rule Q2.
2. **Uniqueness registry** — after a successful fetch, record the canonical Wikimedia title in `used-hero-urls.json`. On subsequent fetches, skip any candidate whose title is already in that registry.
3. **All-locations pass** — run the script against every location and site slug in the data files, not just those with `heroImageUrl: null`. Sites/locations that already have a URL keep it (idempotent) unless `--force` is passed; the uniqueness registry is still built from existing URLs so new fetches don't duplicate them.

---

## Acceptance Criteria

| # | Criterion |
|---|---|
| AC1 | Zero species thumbnail URLs in `sites.json` are iNaturalist `square_url` (contains `/square.`) after the fetch run |
| AC2 | Every species thumbnail URL in `sites.json` resolves to an image ≥ 800 px wide (spot-checkable via HTTP HEAD) |
| AC3 | `heroImageUrl` is non-null for ≥ 95% of locations and ≥ 90% of sites in the data files |
| AC4 | No two location entries share the same `heroImageUrl` value |
| AC5 | No two site entries within the same location share the same hero image URL |
| AC6 | A location page renders no duplicate `src` values across hero + site-card images visible above the fold |
| AC7 | `species-photo-credits.json` contains a `siteSlug` field for every entry added in this run, enabling per-page attribution |
| AC8 | Fetch scripts are idempotent: re-running without `--force` does not re-fetch or overwrite any already-qualifying entry |

---

## Implementation Scope

Three scripts need updating; no UI changes are required unless species thumbnail `imageUrl` rendering already handles larger images (it does — the img element constrains via CSS, so a larger source only improves quality).

| Script | Changes |
|---|---|
| `scripts/fetch-species-photos.mjs` | Use regional iNat lookup → `large.` URL → Wikimedia fallback; store per-site-slug provenance; enforce Q1–Q4 |
| `scripts/fetch-site-photos.mjs` | Enforce min-width check post-response; load + write `used-hero-urls.json`; extend bad-word list per Q3 |
| `scripts/fetch-encounter-photos.mjs` | Same min-width + uniqueness changes as site-photos; share the same `used-hero-urls.json` registry |

A new shared module `scripts/lib/photo-registry.mjs` should export `loadRegistry()`, `isUsed(url)`, and `markUsed(url)` so all three scripts share one registry without duplication.

---

## Decisions

1. **iNaturalist rate limits.** ~47 min runtime for a full regional-lookup pass is acceptable for a one-time enrichment run.

2. **Wikimedia attribution display.** Attribution stays in `species-photo-credits.json` only — no inline display on pages.

3. **`--force` scope.** `--force` re-evaluates and potentially replaces existing photos, not just nulls. This allows quality uplift on photos that technically had a URL but didn't meet the new bar.
