---
story: 3
title: Encounter and bucket-list data model
status: Draft for Approval
type: new-capability
depends_on: [1]
repo_status: not-built
---

# Story 3 — Encounter and Bucket-List Data Model

## Story

As a diver planning around a dream experience, I need bucket-list encounters modeled independently from dive sites so I can explore sardine run, hammerhead schools, great white cage diving, mantas, blackwater, and other experiences across locations.

## Context

The current `Site` model is site-first. Bucket-list experiences are often cross-location and seasonal, so they need their own data type.

## Acceptance Criteria

- AC1: Add an `Encounter` type with species/event metadata, best months, difficulty, ethics notes, conservation notes, source IDs, and methodology IDs.
- AC2: Add `EncounterLocation` mappings to locations and optional site IDs.
- AC3: Add `src/data/encounters.json` with an initial seed set of 8-12 draft encounters.
- AC4: Each seeded encounter includes confidence/limitations and does not use numeric probability unless supported.
- AC5: Add typed loaders: get all encounters, get by slug, get by species, get by location, get bucket-list ranked.
- AC6: Add validation that every encounter has at least one source and one methodology note.

## Initial Encounters

- Sardine run
- Great white cage diving
- Hammerhead schools
- Whale sharks
- Manta cleaning stations
- Thresher sharks
- Mobula ray aggregations
- Blackwater diving
- Coral spawning
- Mandarin fish dusk spawning
- Giant cuttlefish aggregation

## File Pointers

- Modify: `src/lib/data/types.ts`
- Create: `src/data/encounters.json`
- Create: `src/lib/data/encounters.ts`

## QA Notes

- Validate every encounter has source/methodology references.
- Confirm no encounter claims precise sighting probabilities without eligible-survey denominator.
