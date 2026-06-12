---
title: Citizen Science MVP — Epics (gap analysis)
prd: _bmad-output/planning-artifacts/prds/prd-scuba-2026-06-07/prd.md
created: 2026-06-07
---

# Citizen Science MVP — Epics

These epics cover only the gaps identified against the existing codebase. Anything already built is excluded.

---

## Epic 1 — Reef Status on Site Pages

**PRD:** FR-1.1 (partial), FR-1.2 (missing)

**Gap:** The reef status system (Thriving / Under pressure / Witnessing change) is fully built in `src/lib/data/reef-state.ts` and rendered on location pages (`/locations/[slug]`), but is **not shown on individual dive site pages** (`/sites/[slug]`). The `STATE_DEF` descriptions (short + signal copy) exist in the code but are not rendered anywhere.

**Scope:**
- Surface the parent location's reef status label + colored pill on the site page — above the fold, visible without scrolling (matches the existing pill style from the location page)
- Render the `STATE_DEF.short` description (currently ~80–120 words; expand to 150–200 words in the data if needed) below the status pill on the site page
- Where monitoring data exists (coral cover %, bleaching history), surface it alongside the status — this already appears in the "Reef health" card but should be co-located with the status label
- Where no monitoring data exists, show explicit "No survey data available for this site" rather than the current hardcoded fallbacks

**Stories:**
1. Show reef status pill + label on `/sites/[slug]` page, inherited from the parent location's computed reef state
2. Render `STATE_DEF.short` description below the status pill on site pages
3. Replace hardcoded fallback values (coral cover, visibility, temp) with explicit "Data not yet available" states where the source field is empty

**Not in scope:** Writing new per-site explanations (the existing generic status descriptions are sufficient for MVP); changes to the location page (already works).

---

## Epic 2 — "Why This Matters" Science Context Module

**PRD:** FR-2.1 (missing), FR-2.2 (missing)

**Gap:** No educational module exists anywhere on site pages connecting the reef's status to the broader ocean monitoring problem. No reference to Seabed 2030 or the shallow-water data gap exists in the codebase.

**Scope:**
- Add a "Why this matters" module to every dive site page, positioned after the reef status section
- Module content (static, shared across all site pages — not per-site):
  - 100–150 words explaining that shallow-water reef systems are among the least-monitored ocean environments
  - One specific, true data point: "As of 2026, only 25.7% of shallow coastal waters have been mapped to navigational resolution (Seabed 2030 / GEBCO)"
  - One sentence connecting diver observation to the gap: "Every dive at a site like this generates observations that satellite remote sensing and deep-sea surveys cannot capture"
- Module must be a reusable component — used on all site pages, not per-site copy
- No CTA, no signup prompt, no reference to future features — the module ends with the factual framing

**Stories:**
1. Write the "Why this matters" module copy (factual, no jargon, cites Seabed 2030 stat)
2. Build a `<ScienceContextModule />` component that renders the module content
3. Place `<ScienceContextModule />` on the site page template after the reef status section

**Not in scope:** Per-site variation of the module copy; interactive elements; any future-facing CTA.

---

## Epic 3 — Species Ecological Descriptions

**PRD:** FR-3.3 (partial)

**Gap:** Species detail pages (`/sites/[slug]/species/[species]`) exist and show IUCN status, sighting data, and "also seen at nearby sites" (within the same location). What's missing:
- No ecological description field on `SpeciesEntry` — species pages have no habitat/behavior context
- "Also seen at" cross-linking only works within the same location, not across the full database

**Scope:**
- Add an optional `ecologicalDescription` field (string, 100–200 words) to the `SpeciesEntry` type in `types.ts`
- Populate `ecologicalDescription` for the top ~50 most-commonly-listed species in `sites.json` (prioritize species that appear across many sites)
- Render `ecologicalDescription` on the species detail page, below the IUCN badge
- Extend "Also seen at" to show other sites across the full database (not just same location), limited to top 5 by sighting reliability

**Stories:**
1. Add `ecologicalDescription?: string` to `SpeciesEntry` type and populate for top 50 species
2. Render ecological description on species detail page
3. Update "Also seen at" query to search across all locations, return top 5 by reliability

**Not in scope:** Full species encyclopedia pages; user-contributed sightings; species filtering/search.

---

## Epic 4 — About Page and Footer Mission Update

**PRD:** FR-4.1 (partial), FR-4.2 (partial)

**Gap:** The About page (`/about`) describes the site's editorial principles but does not explicitly declare nonprofit status, explain what affiliate revenue funds, or articulate a long-term science mission. The footer tagline ("A data atlas for the living ocean") is generic and doesn't communicate the nonprofit/science purpose.

**Scope:**
- About page additions (no redesign — copy additions to existing page):
  - Add one explicit sentence declaring nonprofit status near the top of the page (e.g., "scubaseason.fun is a nonprofit project.")
  - Add one sentence explaining affiliate revenue purpose: "Affiliate commissions from hotels, liveaboards, and gear cover hosting and development costs — this site has no investors and earns no profit."
  - Add one paragraph on long-term science direction: what the platform is building toward (diver observations routed to scientific databases), without promising a specific timeline
- Footer update:
  - Replace or supplement the current tagline with a line that captures the science/nonprofit identity — e.g., "A nonprofit ocean atlas. Dive data for science."

**Stories:**
1. Add nonprofit declaration, affiliate revenue explanation, and science mission paragraph to About page
2. Update footer tagline to reflect nonprofit and science identity

**Not in scope:** About page redesign or restructure; governance documentation; legal disclaimers beyond what's already present.
