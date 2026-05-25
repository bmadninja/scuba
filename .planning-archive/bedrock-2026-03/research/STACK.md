# Stack Research

**Domain:** Ocean bathymetry data aggregation and visualisation platform
**Researched:** 2026-03-12
**Confidence:** MEDIUM (version numbers should be verified before use)

---

## Key Findings Summary

**The standard 2025/2026 stack for ocean bathymetry visualisation is:**

**deck.gl + MapLibre GL JS** for rendering. Not Leaflet (2D only, no WebGL), not Cesium (too heavy, globe-centric), not plain Mapbox (proprietary). deck.gl is the GPU-accelerated WebGL2 layer that handles terrain meshes, point clouds, and large raster datasets. MapLibre is the open-source base map. They compose cleanly — deck.gl renders on top of MapLibre with the `@deck.gl/mapbox` interleaved layer pattern.

**GEBCO + EMODnet** for free data. GEBCO 2024 Grid is the global standard (15 arc-second, GeoTIFF/NetCDF, open licence). EMODnet covers European waters at ~115m resolution — directly relevant for offshore wind (North Sea). Both offer WMS tile services that load directly into MapLibre with zero preprocessing. This is the fastest path to a working demo.

**COG (Cloud-Optimised GeoTIFF)** is the canonical data format. It allows HTTP range requests so browsers can load just the visible tile rather than the full file. geotiff.js reads COG client-side; in production, TiTiler serves it server-side.

**React + Vite** for the frontend. No SSR (Next.js adds complexity for a WebGL demo). Zustand for map state.

**For a 1-month demo:** static deployment to Vercel, GEBCO/EMODnet WMS tile services direct, no backend. **For production:** FastAPI + TiTiler + PostGIS + S3.

---

## Recommended Stack

### Frontend
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | React + Vite | Fast setup, no SSR complexity, good WebGL support |
| Map base | MapLibre GL JS | Open-source Mapbox fork, free, full WebGL |
| 3D/data layers | deck.gl | GPU-accelerated, handles large datasets, terrain mesh |
| State | Zustand | Lightweight, good for map state |
| Styling | Tailwind CSS | Fast UI development |

### Data
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Raster format | COG (Cloud-Optimised GeoTIFF) | HTTP range requests, browser-compatible |
| Client-side parsing | geotiff.js | Reads COG in browser |
| Server-side tiling | TiTiler | FastAPI-based, serves COG as tiles |
| Vector | GeoJSON / PMTiles | Lightweight, easy to serve |

### Backend (production)
| Layer | Choice | Rationale |
|-------|--------|-----------|
| API | FastAPI (Python) | Standard in geo/ocean science ecosystem |
| Geo database | PostGIS | Industry standard for spatial data |
| Object storage | S3 / R2 | COG files, large dataset storage |
| Tile server | TiTiler | Serves COG on-demand |

### Demo architecture (1 month)
- Static frontend on Vercel
- GEBCO/EMODnet WMS tile services direct (no backend needed)
- No auth, no database
- Focus 100% on visualisation quality

---

## What NOT to Use

| Avoid | Why |
|-------|-----|
| Leaflet | 2D only, no WebGL, cannot render terrain or large datasets |
| Mapbox GL JS v3 | Proprietary, paid API key, TOS friction for demo |
| CesiumJS | Globe-centric UX wrong for this; 5MB+ bundle; ion account required |
| OpenLayers | No meaningful 3D support; OGC compliance use only |
| Next.js | SSR adds complexity; deck.gl is client-side only |
| Raw NetCDF in browser | Browser cannot parse natively; convert to COG offline first |

---

## Free Data Sources for Prototype

| Source | Resolution | Format | Access | Best For |
|--------|------------|--------|--------|---------|
| GEBCO 2024 Grid | 15 arc-sec (~450m) | GeoTIFF, NetCDF, WMS | gebco.net | Global base layer |
| EMODnet Bathymetry | ~115m | GeoTIFF, WMS | emodnet.ec.europa.eu | North Sea / European offshore wind |
| NOAA ETOPO 2022 | 15-60 arc-sec | GeoTIFF, NetCDF | ncei.noaa.gov | US coastal |
| NOAA ENCs | Varies | Shapefile | charts.noaa.gov | Depth soundings, shipping lanes |

---

*Researched: 2026-03-12*
