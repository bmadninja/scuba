# PRD Reconciliation: Charter + PM Log

**Inputs compared:**
- PRD: `_bmad-output/planning-artifacts/scubaseason-prd/prd.md`
- Source 1: `docs/product-charter.md`
- Source 2: `docs/pm-log.md`

---

## Gaps: in source docs but NOT in PRD

**1. Site count discrepancy — 380 vs 356**
Both source docs state 380 dive sites (measured 2026-05-29). The PRD says 356. The charter explicitly notes this grew from 179 to 380 via the Colab Gemini Blitz. The PRD uses a stale count and should be corrected.

**2. Confidence indicator on site cards (interim honesty tactic)**
The PM log floats a concrete near-term tactic: visibly mark which sites have confirmed sighting evidence so the species-chaser promise stays honest *during* backfill. "Leaning toward doing both — a confidence indicator on site cards is cheap and keeps the site honest during backfill." This is not mentioned anywhere in the PRD.

**3. Weekly automated data refresh workflows**
The charter notes "Weekly data refresh workflows (IUCN, GFW) running." The PRD describes GFW and IUCN as static snapshots without acknowledging these are now automated weekly. This understates current data freshness.

**4. IUCN species coverage already substantial — 258 species**
Charter states "IUCN status: 258 species with category + population trend." The PRD treats IUCN as nearly absent (feature-flagged, only 3 records). There is a material tension: the data exists for 258 species but is hidden behind a flag. The PRD should capture both facts — data exists, display is gated on licensing.

**5. `/encounters` and `/dive-in` routes listed in charter but missing from PRD IA**
The charter's live routes list includes `/encounters` and `/dive-in`, which do not appear in PRD Section 4 (Information Architecture). The PRD lists 10 routes but these two are absent. Verify whether they are live or removed, then reconcile.

---

## Contradictions / Inconsistencies

**Site count:** PRD says 356; both source docs say 380. One source must be wrong — the PRD was likely written before the Colab blitz was measured. Use 380 (charter figure) as authoritative.

**Reef health record count:** PRD says "116 records"; charter says "114 records." Minor but inconsistent.

**STATE.md vs. reality:** The PM log notes `.planning/STATE.md` is stale and the charter is now the source of truth. The PRD does not acknowledge this and may be drawing on stale planning state in places.

---

## No gaps found in these areas

Priority order, revenue model, affiliate transparency, MERMAID gap, grant credibility framing, evidence backfill urgency, and breadth-pause directive are all faithfully reflected in the PRD.
