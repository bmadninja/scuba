# Requirements: Mosaic R&D — Bedrock Ocean Interview Package

**Defined:** 2026-03-12
**Core Value:** Show Bedrock Ocean you understand their product better than they do, backed by a live PRD and demo they can feel

---

## v1 Requirements

The deliverable is an interview package: competitive analysis, product PRD, and product strategy doc.

### Competitive Analysis

- [ ] **COMP-01**: Document covers direct competitors (Fugro SiteView, TGS Portal, ESRI Ocean) with feature comparison
- [ ] **COMP-02**: Identifies Mosaic's unoccupied market position (proprietary bathymetry + energy workflows + modern web UX)
- [ ] **COMP-03**: Quantifies commercial risk of inaction (e.g. if wind/cable clients migrate to competitors)
- [ ] **COMP-04**: Written in language a non-technical executive can read and act on

### Product PRD

- [ ] **PRD-01**: Documents current state of Mosaic with clear-eyed assessment of gaps (screenshots + annotations)
- [ ] **PRD-02**: Identifies core product failure — processed bathymetric data is never rendered; clients see file trees
- [ ] **PRD-03**: Improvement: surveys list redesigned as map-first geographic browser (draw AOI to find surveys)
- [ ] **PRD-04**: Improvement: survey detail shows human-readable data product names, not raw sensor filenames
- [ ] **PRD-05**: Improvement: survey header shows key metadata (resolution, depth range, sensors, datum, coverage area)
- [ ] **PRD-06**: New feature: bathymetric rendering — GeoTIFFs served as tiled colour maps with hillshade
- [ ] **PRD-07**: New feature: depth profile tool — draw a transect, see depth cross-section graph
- [ ] **PRD-08**: New feature: smarter download — select area of interest, choose format (GeoTIFF/CSV/LAS)
- [ ] **PRD-09**: New feature: shareable permalink — URL-encoded map state for sharing with colleagues
- [ ] **PRD-10**: New feature: data type filter — filter surveys by sensor type (MBES, SSS, MAG, SBP)
- [ ] **PRD-11**: Each improvement includes technical feasibility note (effort + stack required)

### Product Strategy Doc

- [ ] **STRAT-01**: Articulates Mosaic's positioning — not a GIS tool, not a file delivery system; the discovery layer for Bedrock's proprietary survey data
- [ ] **STRAT-02**: Defines two target client workflows (offshore wind site selection, subsea cable route planning)
- [ ] **STRAT-03**: Prioritised roadmap — Phase 1 quick wins (render the data), Phase 2 energy workflows
- [ ] **STRAT-04**: Revenue model recommendation — tiered access (public free, commercial subscription with advanced tools)
- [ ] **STRAT-05**: "Why now" — offshore wind buildout creates demand for exactly this product in 2026

---

## v2 Requirements

Deferred — valuable but not needed for the interview.

### Demo Prototype

- Build a working prototype of the improved Mosaic experience using GEBCO/EMODnet data
- Demonstrate bathymetric rendering, geographic search, depth profile tool

### WTG Suitability Grid

- Offshore wind "wow" feature — drop turbine layout, auto-score by seabed conditions
- High complexity; strong differentiator but beyond interview scope

### Cable Corridor Report

- Subsea cable "wow" feature — draw route, auto-generate hazard/depth PDF
- Same complexity tradeoff as WTG grid

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full production build | This is a PRD, not a shipped product |
| Codebase access / technical deep-dive | Working from live product and public information |
| Pricing model financial modelling | Beyond scope for interview |
| Mobile app recommendations | Not relevant to offshore industry clients |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| COMP-01 to COMP-04 | Phase 1: Competitive Analysis | Pending |
| PRD-01 to PRD-11 | Phase 2: Product PRD | Pending |
| STRAT-01 to STRAT-05 | Phase 3: Product Strategy | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---

*Requirements defined: 2026-03-12*
