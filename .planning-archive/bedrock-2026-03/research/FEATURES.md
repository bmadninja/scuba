# Features Research

**Domain:** Ocean bathymetry data aggregation and visualisation platform
**Researched:** 2026-03-12

---

## Key Findings Summary

**The competitive gap is real and unoccupied.** No existing platform combines purpose-built offshore energy workflows + client-facing web UX + high-quality proprietary bathymetric data. Mosaic's opportunity is genuine.

---

## Table Stakes
*(Must exist or industry users dismiss the product immediately)*

- Interactive depth map with hillshade rendering
- Survey coverage browser with metadata (date, resolution, method)
- Depth profile along a drawn transect
- Area-clipped data download (don't force download of the full dataset)
- Depth/slope colormap control
- Coordinate display (WGS84 + projected)
- Data age and quality labelling

---

## Differentiators

### Offshore Wind
| Feature | Value |
|---------|-------|
| **WTG layout grid generator** | Drop turbine grid, each turbine instantly color-codes red/amber/green by seabed suitability (depth, slope, substrate type). Currently done manually in GIS — takes hours. |
| **Site screener** | Filter survey areas by depth range, slope limit, exclusion zones (cables, protected areas). Returns candidate polygons instantly. |
| **Epoch comparison slider** | Show seabed change between two survey dates. Critical for scour monitoring near foundations. |
| **Seabed classification overlay** | Sediment type (sand, gravel, rock, mud) mapped from acoustic backscatter. |

### Subsea Cable
| Feature | Value |
|---------|-------|
| **Cable route corridor report** | Draw a route, buffer it, auto-generate: depth profile, slope histogram, seabed type breakdown, existing infrastructure crossings. Currently a 2–3 hour GIS workflow — Mosaic does it in seconds. |
| **Hazard highlight layer** | Auto-flags steep slopes, shallow rock, existing cable crossings along a proposed route. |
| **Burial depth calculator** | Given seabed type + water depth, estimates required cable burial depth per DNV/IHO standards. |

---

## "Wow" Demo Features
*(Features that cause people to lean forward in an interview)*

1. **Turbine suitability grid** — Drop a WTG layout, watch turbines colour red/amber/green in real time. Instant.
2. **Cable corridor report** — Draw a line, click "Generate Report", get a PDF in 5 seconds.
3. **3D seabed fly-through** — CesiumJS or deck.gl TerrainLayer, fly along a cable route or over a wind site.
4. **Epoch comparison slider** — Drag slider between two survey dates, seabed change animates.

---

## Competitor Analysis

| Platform | Strengths | Weaknesses | Mosaic opportunity |
|----------|-----------|------------|-------------------|
| **CARIS HIPS/SIPS** | Industry standard for hydrographic processing | Desktop-only, survey contractor tool, not client-facing | Mosaic is web, client-facing |
| **QPS Qimera** | Strong multibeam processing | Same — desktop, specialist tool | Same gap |
| **ESRI ArcGIS Ocean** | Full GIS stack, trusted brand | Generic, not bathymetry-specialised, expensive, complex | Domain-specific UX |
| **SeaSketch** | Good for marine spatial planning | Academic/governance focus, not commercial energy | Energy workflow focus |
| **Fugro GeoViewer** | Client data delivery | Basic, no analysis tools | Analysis layer on top |
| **Global Fishing Watch** | Beautiful public UX | Fishing only | Mosaic's design inspiration |
| **TGS / PGS / CGG** | Massive seismic data libraries | Oil & gas focus, expensive, not bathymetry-first | Renewables/cable focus |

**The gap:** No platform combines (1) high-resolution proprietary survey data + (2) purpose-built offshore energy workflows + (3) modern client-facing web UX. Mosaic can own this.

---

## Anti-Features for v1 Demo
*(Tempting but wrong)*

| Feature | Why to avoid |
|---------|-------------|
| Full hydrographic processing pipeline | That's CARIS/Qimera territory — don't compete |
| AIS / vessel tracking | Separate data domain, dilutes focus |
| Mobile app | Desktop is where this work happens |
| ML seabed classification (uncurated) | Errors destroy trust with specialist users |
| In-platform commercial/payment workflow | Not needed for demo; distracts from core value |

---

*Researched: 2026-03-12*
