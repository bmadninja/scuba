# Project Research Summary

**Project:** Mosaic R&D — Bedrock Ocean Interview Project
**Domain:** Ocean bathymetry data aggregation and visualisation platform
**Researched:** 2026-03-12
**Confidence:** MEDIUM

## Executive Summary

Mosaic is an interview-driven product demonstration for Bedrock Ocean — a company that owns proprietary seafloor survey data and sells access to offshore wind and subsea cable clients. The current product (maps + raw file download) is functional but underdeveloped. The opportunity is clear and unoccupied: no platform currently combines high-resolution proprietary bathymetric data with purpose-built offshore energy workflows and a modern client-facing web UX. The demo should show Bedrock what Mosaic could be, not just what it is.

The recommended approach for a 1-month demo is a fully static deployment: React + MapLibre GL JS + deck.gl on Vercel, serving GEBCO bathymetry as Cloud-Optimised GeoTIFF (COG) from Cloudflare R2, with vector contours and infrastructure overlays via PMTiles. No backend is needed for the demo — zero servers means zero failure modes in an interview. The visual foundation (hillshade + perceptually correct colormap + WebGL GPU rendering) must be built first, because the first 10 seconds of the demo must be impressive. Everything else builds on top.

The top risks are technical and strategic. Technically: serving full-resolution rasters without tiling will crash browsers, and CRS/datum confusion creates subtle but career-ending errors in a field where depth precision is a compliance requirement. Strategically: it is easy to build analysis features that clients don't actually use — the real workflow is "get reliable depth data into QGIS/ArcGIS fast", not "replace their GIS." The demo should be structured as a user story (a cable engineer validating a route corridor), not a feature walkthrough — because every competing platform already shows maps.

---

## Key Findings

### Recommended Stack

The canonical 2025/2026 stack for ocean bathymetry visualisation is deck.gl + MapLibre GL JS for rendering. Leaflet is 2D-only and cannot handle terrain meshes. CesiumJS is globe-centric and requires ion account credentials. Mapbox GL JS is proprietary with TOS friction for a demo. MapLibre is the open-source Mapbox fork that runs fully in WebGL without API keys. deck.gl sits on top as a GPU-accelerated layer for large raster datasets, point clouds, and terrain.

For a 1-month demo, the backend is the static file CDN. COG (Cloud-Optimised GeoTIFF) files handle HTTP range requests natively — the browser fetches only the bytes needed for the current viewport. GDAL + rio-cogeo convert raw GEBCO data into delivery format offline, once. PMTiles provides single-file vector tile archives for contour lines and infrastructure overlays. The production backend (FastAPI + TiTiler + PostGIS + S3) is documented but not required for the demo.

**Core technologies:**
- React + Vite: Frontend shell — fast setup, no SSR complexity, WebGL-compatible
- MapLibre GL JS: GPU-accelerated base map — open-source, free, full WebGL support
- deck.gl: Data layer rendering — handles terrain meshes and large datasets at GPU speed
- Zustand: Map state management — lightweight, appropriate for layer/viewport state
- COG (Cloud-Optimised GeoTIFF): Raster data format — HTTP range requests, browser-native with geotiff.js
- PMTiles: Vector tile archive — serves contours and infrastructure from static hosting
- Cloudflare R2: Object storage + CDN — cost-effective COG/PMTiles delivery with global edge
- GEBCO 2024 / EMODnet: Public bathymetry sources — free, no backend, usable via WMS or downloaded COG

See `.planning/research/STACK.md` for full rationale and what to avoid.

### Expected Features

The product must nail the visual foundation before adding domain features. The market gap is workflow automation for offshore energy users, not another generic map viewer.

**Must have (table stakes) — industry users dismiss the product without these:**
- Interactive depth map with hillshade rendering
- Survey coverage browser with metadata (date, resolution, survey method)
- Depth profile along a drawn transect
- Area-clipped data download (not full-dataset download)
- Depth/slope colormap control
- Coordinate display (WGS84 + projected)
- Data age and quality labelling

**Should have (differentiators that make the demo "wow"):**
- WTG layout grid generator — drop a turbine grid, each turbine colour-codes red/amber/green by seabed suitability in real time (replaces hours of manual GIS work)
- Cable route corridor report — draw a line, auto-generate depth profile + slope histogram + seabed type + infrastructure crossings as PDF in seconds
- Epoch comparison slider — drag between two survey dates, seabed change animates (critical for scour monitoring)
- Site screener — filter survey areas by depth range, slope, and exclusion zones; returns candidate polygons instantly
- Hazard highlight layer — auto-flags steep slopes, shallow rock, existing cable crossings along a proposed route
- 3D seabed fly-through — deck.gl TerrainLayer for flying a cable route or wind site

**Defer to v2+ (anti-features for demo):**
- Full hydrographic processing pipeline (CARIS/Qimera territory — don't compete)
- AIS / vessel tracking (separate domain, dilutes focus)
- ML seabed classification without curated training data (errors destroy trust with specialists)
- In-platform commercial/payment workflow
- Mobile app (this work happens on desktop)

See `.planning/research/FEATURES.md` for competitor analysis and full rationale.

### Architecture Approach

The minimum viable architecture for an impressive demo is static-only: frontend on Vercel, COG and PMTiles files on Cloudflare R2, no running server processes. This eliminates demo failure modes and delivers globally fast CDN performance during an interview. The offline data pipeline (GDAL + rio-cogeo + Tippecanoe) runs once to prepare GEBCO data for delivery — it is not part of the live stack.

Layers compose in MapLibre in z-order: base map → COG bathymetry raster (hillshade + colormap) → depth contour lines (PMTiles) → infrastructure overlays (PMTiles) → survey coverage footprints (PMTiles) → interactive overlays (drawn transects, analysis results). This composable architecture means features can be added incrementally without architectural changes.

**Major components:**
1. React/Vite app (Vercel) — frontend shell, hosts map canvas and UI panels
2. MapLibre GL JS — GPU-accelerated renderer, manages all layer compositing
3. COG on R2 — GEBCO bathymetry raster, fetched via HTTP range requests per viewport
4. PMTiles on R2 — vector contours, infrastructure, survey coverage footprints
5. Zustand store — client-side layer state (visibility, opacity, active query results)
6. Offline data pipeline — GDAL + rio-cogeo + Tippecanoe, converts GEBCO to delivery formats once

See `.planning/research/ARCHITECTURE.md` for production architecture diagram and anti-patterns.

### Critical Pitfalls

1. **Loading full-resolution rasters into the browser** — GEBCO 2024 is ~900MB; proprietary surveys are 5–50GB. Serve exclusively as COG with GDAL overviews (`gdaladdo`). Never load raw raster. Bake this into the architecture from day one; retrofitting is expensive.

2. **CRS/datum confusion** — Datasets arrive in EPSG:4326, UTM, or other projections; web maps default to EPSG:3857. Canonicalise everything to EPSG:4326 at ingestion, reproject at serving time. Run `gdalsrsinfo`/`rio info` on every input. Missing datum = stop and investigate.

3. **NetCDF fill values and sign convention** — GEBCO stores depth as negative elevation. Fill values (32767, -9999) and scale/offset attributes must be handled via xarray (CF conventions auto-applied). Add sanity-check assertions: ocean pixels < 0, land pixels ≥ 0.

4. **Demo looks bad on a projector or screen share** — WebGL content that looks sharp on a 2x retina display can drop to 10fps screenshared and wash out on a projector. Use high-contrast palettes (NOAA haxby, viridis, plasma), minimum 1.5px contour lines, and screen-record a walkthrough at 1080p before the interview.

5. **Demo shows the map, not the workflow** — Every competing platform shows maps. Structure the demo as a user story ("you are a cable engineer, your company just won a North Atlantic route contract...") so every feature is motivated by a real problem. If the demo script is organised by feature, rewrite it.

6. **Public data void areas** — GEBCO has significant voids in coastal and shelf areas. Choose demo areas with verified good coverage and impressive topography (mid-ocean ridges, seamount chains, continental shelf break). Avoid the North Sea for demo — coarse public data there; proprietary surveys are the real product.

7. **Features clients don't actually use** — The real job-to-be-done is "get reliable depth data for a corridor into QGIS/ArcGIS fast," not "replace GIS." Prioritise export friction reduction over in-browser analysis depth.

See `.planning/research/PITFALLS.md` for integration gotchas, performance traps, and UX pitfalls.

---

## Implications for Roadmap

Based on the combined research, a 4-phase structure aligned to the architecture's suggested build order is recommended. The constraint is 1 month with demo quality as the exit criterion.

### Phase 1: Data Foundation + Visual Impact

**Rationale:** The PITFALLS research is unambiguous — tiled serving must be baked in from day one (retrofitting is expensive), and the first 10 seconds of the demo must be visually impressive. ARCHITECTURE research confirms visual foundation comes first. Nothing else matters if the map looks mediocre.

**Delivers:** Map canvas rendering GEBCO bathymetry as COG with Haxby colormap + hillshade blend. Offline data pipeline (GDAL + rio-cogeo) producing COG and PMTiles from GEBCO source data. Depth click-to-query. Verified demo area selection with known depth benchmarks.

**Addresses:** Interactive depth map (table stakes), depth/slope colormap control (table stakes)

**Avoids:**
- Full raster in browser (Pitfall 1) — COG architecture from the start
- CRS confusion (Pitfall 2) — validate all inputs at pipeline stage
- NetCDF fill values (Pitfall 3) — automated sanity checks in pipeline
- Bad colour ramp (Pitfall 8) — palette chosen before any rendering
- Public data void areas (Pitfall 7) — demo area verified before any presentation logic

**Needs research:** No — COG/MapLibre/GEBCO patterns are well-documented. Standard execution.

---

### Phase 2: Interactivity + Domain Layers

**Rationale:** Once the visual foundation is solid, the product must demonstrate it is a product, not just a map. Infrastructure overlays (subsea cables, wind farms) and basic analysis tools (depth profile, survey coverage) establish the domain context. These features are low implementation risk but high demo credibility.

**Delivers:** Layer toggle panel (hillshade, contours, infrastructure, survey coverage). Infrastructure overlays from OpenInfraMap/OSM as PMTiles. Depth profile along a drawn transect. Survey coverage footprint view. Coordinate display (WGS84 + projected). Shareable URL / permalink encoding map state.

**Addresses:** Survey coverage browser (table stakes), depth profile (table stakes), coordinate display (table stakes), data age/quality labelling (table stakes)

**Avoids:**
- UX pitfall: depth query requires right-click — show depth on hover in persistent panel
- UX pitfall: no shareable URL — encode all layer/viewport state in URL

**Needs research:** PMTiles integration with MapLibre (newer pattern — verify current `maplibre-gl-pmtiles` plugin API during implementation).

---

### Phase 3: "Wow" Domain Features

**Rationale:** The differentiating features identified in FEATURES.md are what make the demo lean-forward moments. The turbine suitability grid and cable corridor report directly address the unoccupied market gap — hours-long GIS workflows compressed to seconds. These are the features that justify the product existing. They are built third because they require the data layer architecture from Phase 1 and the interactivity patterns from Phase 2.

**Delivers:** WTG layout grid generator with real-time red/amber/green seabed suitability colouring. Cable route corridor report (auto-generated depth profile + slope histogram + seabed type breakdown as PDF). Epoch comparison slider for seabed change animation. Site screener with depth/slope/exclusion zone filters.

**Addresses:** WTG layout grid generator (differentiator), cable corridor report (differentiator), epoch comparison slider (differentiator), site screener (differentiator)

**Avoids:**
- Building features clients don't use (Pitfall 5) — focus on the data handoff workflow, not in-browser analysis depth
- Scope creep into AIS, ML classification, or processing pipelines

**Needs research:** PDF generation in browser (jsPDF vs server-side render), deck.gl TerrainLayer integration with MapLibre for 3D fly-through. Both have established patterns but implementation details should be verified.

---

### Phase 4: Demo Polish + Narrative

**Rationale:** Research is explicit that demo presentation is a distinct deliverable, not an afterthought. Pitfall 4 (projector/screenshare quality) and Pitfall 10 (feature tour vs. workflow narrative) are late-stage risks that destroy otherwise strong demos. This phase converts a working product into an interview-ready performance.

**Delivers:** Guided demo tour / scenario script (cable engineer user story). Dark theme. Loading states and progressive rendering for perceived performance. Screen-recorded 1080p walkthrough verified on projector-equivalent display. Competitive framing: "here is what is commercially at stake if Mosaic stays deprioritised." Area-clipped data export (table stakes not yet delivered).

**Addresses:** Area-clipped data download (table stakes), demo narrative (Pitfall 10), projector/screenshare quality (Pitfall 4)

**Avoids:**
- Demo organised by feature not user story (Pitfall 10)
- Demo never tested on recording / projector conditions (Pitfall 4)

**Needs research:** No — demo scripting and presentation patterns are known. Execution only.

---

### Phase Ordering Rationale

- **Visual foundation before domain features** — the first 10 seconds of the demo must be impressive; no feature adds credibility if the map looks mediocre
- **Architecture-first on data pipeline** — COG tiling cannot be retrofitted cheaply; it is the load-bearing decision for everything else
- **Differentiators in Phase 3, not Phase 1** — domain features require the interactivity layer to be established first; building them earlier would mean rebuilding in Phase 2
- **Polish as explicit phase** — demo quality is a deliverable, not a side effect of feature completion; pitfall research is unambiguous that presentation failures are common and avoidable

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** `maplibre-gl-pmtiles` plugin API — PMTiles support in MapLibre has evolved rapidly; verify current integration pattern
- **Phase 3:** PDF generation approach (jsPDF client-side vs. server-side render for cable corridor report); deck.gl TerrainLayer + MapLibre interleaved rendering for 3D fly-through

Phases with standard patterns (skip research-phase):
- **Phase 1:** COG + MapLibre + GEBCO are well-documented and have established community patterns
- **Phase 4:** Demo scripting and presentation rehearsal — execution, not research

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (MapLibre, deck.gl, COG, PMTiles) are community-confirmed; specific version numbers should be verified before dependency installation |
| Features | HIGH | Market gap analysis is strongly supported; table stakes derived from direct observation of the live product and competitor review |
| Architecture | HIGH | Static-first architecture is well-established for WebGL geo products; COG + PMTiles patterns have clear documentation |
| Pitfalls | MEDIUM-HIGH | Technical pitfalls (CRS, COG, NetCDF) are high-confidence domain knowledge; product/strategic pitfalls are medium-confidence inference from market observation |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Vertical datum handling in demo data:** PITFALLS.md identifies this as a production-critical concern (1–5m errors relevant for cable burial compliance). For the demo, flag this as a "production implementation concern" rather than solving it. Document it explicitly in the demo script as evidence of domain depth.
- **EMODnet vs GEBCO for North Sea coverage:** STACK.md notes EMODnet covers European waters at ~115m (vs GEBCO at ~450m). However, PITFALLS.md warns against using North Sea for demo due to public data void areas. Resolve during Phase 1 data pipeline work by verifying actual coverage of specific demo areas.
- **PDF generation mechanism:** FEATURES.md lists cable corridor report as a "wow" feature. The delivery mechanism (client-side PDF, server-side render, or static pre-generated) is unresolved and affects Phase 3 scope. Verify jsPDF capability for this output before committing to client-side approach.
- **GEBCO WMTS reliability:** PITFALLS.md flags intermittent WMTS service availability. For demo stability, self-host COG from R2 rather than depend on live GEBCO tile services.

---

## Sources

### Primary (HIGH confidence)
- GEBCO (gebco.net) — 2024 Grid metadata, WMS service, data format documentation
- EMODnet (emodnet.ec.europa.eu) — Bathymetry portal, resolution specs, WMS access
- MapLibre GL JS documentation — layer compositing, COG raster integration
- deck.gl documentation — MapLibre interleaved pattern, TerrainLayer

### Secondary (MEDIUM confidence)
- OpenInfraMap / OSM — subsea cable and wind farm infrastructure data
- rio-cogeo documentation — COG creation, GDAL overview patterns
- PMTiles specification — single-file vector tile format, MapLibre plugin
- Community knowledge: geo/WebGL developer patterns for COG serving without tile server

### Tertiary (LOW confidence — validate during implementation)
- Version numbers for all npm packages (React, MapLibre, deck.gl, Zustand) — should be verified against current releases before use
- jsPDF client-side PDF generation for corridor reports — needs implementation-phase validation
- GEBCO WMTS availability SLA — flagged as unreliable; assume self-hosting required

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
