---
story: 9
title: Scraper MVP for one source
status: Draft
epic: Dataset pipeline
prd_refs: [FR3.4, "Q-scrape-1", "Q-scrape-3"]
arch_refs: ["§6 Scraper"]
depends_on: [1]
---

# Story 9 — Scraper MVP for one source

## Story

As the editor, I need a one-shot scrape → normalize → (optional) paraphrase → merge pipeline against a single source site so I can grow the catalogue beyond the 3 flagships without hand-typing every field.

## Context

Dataset depth is the moat, and hand-curation alone will not scale beyond the flagship proof. This story keeps scraping outside the Next.js runtime, makes diffs reviewable, and preserves manual edits during merges.

## Acceptance Criteria

- AC1: `scripts/scrape/run.ts` accepts `--location=<slug>` and `--source=<source>` and orchestrates scrape → normalize → merge (architecture §6).
- AC2: First implemented source: Divezone (placeholder until PM confirms Q-scrape-1). Module at `scripts/scrape/sources/divezone.ts`.
- AC3: Honors robots.txt and rate-limits to 1 req/sec per source. Custom User-Agent identifying the project.
- AC4: `normalize.ts` maps raw scrape → `Site` and `Location` shapes from arch §2.
- AC5: `--paraphrase` flag invokes Anthropic SDK to rewrite description prose (Q-scrape-3) and tags `_source: { url, scrapedAt, paraphrased: true }` for auditability.
- AC6: `merge.ts` preserves manually edited fields — only writes scraped fields where the existing value is empty/unset.
- AC7: Image scraping disabled by default — scraper records image URLs without downloading (arch §6).
- AC8: End-to-end run against one flagship location (e.g., Maldives) populates 3-5 new Sites under it; diffs are reviewable in git before commit.
- AC9: Has unit-ish test asserting required fields are populated post-normalize (architecture §11 risk mitigation).

## Dev Notes

- Lives outside Next.js runtime (architecture §6) — pure Node script.
- No cron / no scheduled refresh (PRD Q-scrape-2 unresolved; defer).
- Scraper writes directly to `src/data/sites.json` and `src/data/locations.json` via the typed loaders from Story 1.

## Tasks

- [ ] Scaffold `scripts/scrape/{sources,normalize,paraphrase,merge,run}.ts`
- [ ] Build Divezone source module
- [ ] Wire robots.txt + rate limiter + custom UA
- [ ] Implement merge preserving manual edits
- [ ] Wire `--paraphrase` flag with Anthropic SDK
- [ ] Smoke-test against Maldives; review diff

## File Pointers

- Create: `scripts/scrape/**`
- Modify: `src/data/sites.json`, `src/data/locations.json` (via merge output)
- Reference: `scripts/discover-sites.mjs`, `scripts/blitz-*.sh` (existing pipeline scripts may inform)

## References

- PRD §9 Q1 (scrape), §5 FR3.4
- Architecture §6, §11
