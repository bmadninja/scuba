---
story: 3
title: Curate 3 flagship sites end-to-end
status: Draft
epic: F1 — Content shape proof
prd_refs: [FR1.2, FR1.4, FR3.4]
arch_refs: ["§12 step 4"]
depends_on: [1, 2]
---

# Story 3 — Curate 3 flagship sites end-to-end

## Story

As the editor, I need three fully-populated flagship sites (Maldives — Manta Point, Komodo — Batu Bolong, Galápagos — Darwin's Arch) so the detail page template is proven against real content before scaling to the rest of the catalogue.

## Context

The template cannot be judged with placeholder rows. These three flagship sites exercise the full data model: species reliability, monthly conditions, skill thresholds, plan-your-trip links, base gear, and site-specific gear.

## Acceptance Criteria

- AC1: Three `Site` rows added to `src/data/sites.json` with every required field per arch §2.2: description (1-3 paragraphs), depthRange, skillLevel, diveTypes, species (5-15 entries per FR1.2 with reliability + bestMonths), all 12 `conditionsByMonth` entries, bestMonths, editorialRank, `getThere`/`lodging`/`operators` (placeholder partner labels OK — Story 8 wires real affiliate URLs), `gearIds` referencing real Gear entries, `siteSpecificGear` (e.g., reef hook for Batu Bolong).
- AC2: Parent Locations in `locations.json` updated so `siteIds[]` includes the new flagship sites.
- AC3: Visiting `/sites/manta-point-maldives`, `/sites/batu-bolong-komodo`, `/sites/darwins-arch-galapagos` renders without runtime errors and every section has real content (no "TBD" placeholders).
- AC4: At least one site demonstrates each of the three skillLevel tiers represented: Manta Point (open-water/intermediate accessible), Batu Bolong (advanced — strong current), Darwin's Arch (advanced+, liveaboard-only).
- AC5: Content voice is consistent across the three (species-chaser, factual, no marketing fluff per PRD target user).
- AC6: Hero placeholder gradient (architecture §8) renders cleanly where `heroImageUrl` is unset — no broken images.

## Dev Notes

- This is mostly an editorial story, not code. Story 2's template must support every field before this story can complete.
- Slugs are stable URLs — pick carefully, they're committed and will rank in search.
- Real affiliate URLs land in Story 8; use `isAffiliate: false` placeholder partner links for now (the detail page renders them transparently per FR5.1 data model).
- LLM-assist for prose is fine (PRD Q5 non-blocking) but every fact (depth, temp ranges, species reliability) must be verifiable.

## Tasks

- [ ] Pick exact slugs and confirm Location parents exist
- [ ] Draft Overview prose for each (3 paragraphs target)
- [ ] Populate species list (5-15 each, with reliability + months)
- [ ] Populate `conditionsByMonth` × 12 from a reliable source (Divezone / operator pages / NOAA SST)
- [ ] Set `gearIds` (Tier A references) + `siteSpecificGear` (Tier B)
- [ ] Add placeholder `getThere`/`lodging`/`operators` rows
- [ ] Verify in browser: all 3 detail pages render every section

## File Pointers

- Modify: `src/data/sites.json`, `src/data/locations.json`
- Reference: `src/data/gear.json` (gear IDs must exist)

## References

- PRD §5 F1, §5 F3, §11 A1
- Architecture §12 step 4
