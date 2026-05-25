---
story: 1
title: Schema migration & typed data loaders
status: Draft
epic: F3 — Dataset Expansion
prd_refs: [FR3.1, FR3.2, FR3.5]
arch_refs: ["§2 Data Model", "§12 step 1-2"]
---

# Story 1 — Schema migration & typed data loaders

## Story

As the implementer, I need `src/data/{locations,sites,gear}.json` to conform exactly to the architecture §2 types, and typed accessors in `src/lib/data/` so every later story can import a stable API, so that downstream UI and scraping stories don't reshape data ad hoc.

## Context

This story is the foundation for the PRD's Location -> Site shift. The current product already has legacy location data and some scaffolded JSON files, but every downstream page, filter, scraper, and affiliate surface depends on a stable data contract matching architecture §2.

## Acceptance Criteria

- AC1: `src/data/locations.json` validates against the `Location` type (architecture §2.1). All 109 legacy entries from `scuba-seasons.json` are represented as Locations with `id`, `slug`, `name`, `country`, `region`, `countryCode`, `lat`, `lng`, `description`, `bestMonths`, `siteIds: []` (empty until curation), optional `heroImageUrl`.
- AC2: `src/data/sites.json` validates against the `Site` type (architecture §2.2). May be empty array initially; type must match exactly including `conditionsByMonth` shape with 12 entries when populated.
- AC3: `src/data/gear.json` contains a seed of ~20 common items per the `Gear` type (architecture §2.3), covering categories needed for Curious → Advanced segments (mask, fins, snorkel, wetsuit, BCD, regulator, computer, light, SMB, reef-hook).
- AC4: `src/lib/data/locations.ts`, `src/lib/data/sites.ts`, `src/lib/data/gear.ts` export typed accessors: `getAllLocations()`, `getLocationBySlug(slug)`, `getAllSites()`, `getSiteBySlug(slug)`, `getSitesByLocationId(id)`, `getGearByIds(ids[])`, `getGearByLevels(levels[])`.
- AC5: Types exported from `src/lib/data/types.ts` (or equivalent) — single source of truth for `Location`, `Site`, `Gear`, `SkillLevel`, `DiveType`, `SpeciesEntry`, `ConditionsMonth`, `PartnerLink`, `SiteGearItem`, `GearCategory`, `GearPartner`.
- AC6: `scripts/migrate.ts` is idempotent — re-running against existing `locations.json` does not duplicate or clobber manually edited fields.
- AC7: `npm run build` succeeds with strict TypeScript; no `any` in the new typed accessors.

## Dev Notes

- `scripts/migrate.ts` and `src/data/*.json` already exist — audit them against architecture §2 first; only diff what's wrong. Do NOT rewrite from scratch.
- `src/data/location-details.json` exists alongside `locations.json` — clarify with PM whether to merge into `locations.json` or keep as overlay (Story 3 may answer this when content gets curated).
- JSON files committed to git (architecture §2 intro). No CMS.
- `scuba-seasons.json` is the legacy source; preserve it untouched in case migration needs to be re-run.

## Tasks

- [ ] Read current `src/data/{locations,sites,gear}.json`; diff fields against arch §2 types
- [ ] Define/refine `src/lib/data/types.ts` with all type aliases from arch §2
- [ ] Update `scripts/migrate.ts` to be idempotent and emit conformant `locations.json`
- [ ] Backfill/seed `gear.json` with ~20 items spanning required categories and skill levels
- [ ] Write typed accessors in `src/lib/data/{locations,sites,gear}.ts`
- [ ] Add a `npm run validate-data` script that type-checks the JSON via a small zod-or-tsc pass (optional but recommended)
- [ ] Run `npm run build` clean

## File Pointers

- Modify: `scripts/migrate.ts`, `src/data/locations.json`, `src/data/sites.json`, `src/data/gear.json`
- Create: `src/lib/data/types.ts`, `src/lib/data/locations.ts`, `src/lib/data/sites.ts`, `src/lib/data/gear.ts`
- Reference (legacy, do not edit): `src/data/scuba-seasons.json`

## References

- PRD §4 Information Architecture, §5 F3, §11 Assumption A2
- Architecture §2 Data Model, §4 State Management, §12 step 1-2
