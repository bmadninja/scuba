# Architecture Research

**Domain:** Ocean bathymetry data aggregation and visualisation platform
**Researched:** 2026-03-12

---

## Key Findings Summary

**Minimum viable architecture for an impressive demo is static-only.** No running server processes. Frontend on Vercel + COG/PMTiles files on Cloudflare R2. Zero backend during an interview — nothing to go wrong, globally fast via CDN.

---

## Component Boundaries

| Component | What It Does |
|-----------|-------------|
| React/Next.js app (Vercel) | Frontend shell, hosts map canvas |
| MapLibre GL JS | GPU-accelerated map renderer — handles mixed raster/vector layers |
| COG (Cloud-Optimized GeoTIFF) | Serves GEBCO bathymetry raster via HTTP range requests — no tile server needed |
| PMTiles | Single-file vector tile archive — serves contours and infrastructure layers from static hosting |
| Cloudflare R2 | Object storage for COG + PMTiles files, CDN delivery |
| Offline data pipeline | GDAL + rio-cogeo + Tippecanoe — converts raw GEBCO data to delivery formats, runs once |
| Zustand store | Client-side layer state (visibility, opacity, active queries) |

---

## Data Flow

```
GEBCO NetCDF/GeoTIFF
  → GDAL (subset region) → rio-cogeo (create COG) → Upload to R2
  → gdaldem (hillshade) → rio-cogeo → Upload to R2
  → gdal_contour (isolines) → Tippecanoe (PMTiles) → Upload to R2

OpenInfraMap / OSM
  → GeoJSON export → Tippecanoe (PMTiles) → Upload to R2

Runtime:
  Browser pan/zoom → MapLibre requests tiles
  → HTTP Range request to R2 COG/PMTiles
  → Only bytes for current viewport fetched
  → Rendered in WebGL on GPU
```

---

## Build Order for Demo Impact

| Week | Focus | Why |
|------|-------|-----|
| 1 | Map visual foundation — COG rendering with Haxby colormap + hillshade | First 10 seconds must be impressive |
| 2 | Interactivity — layer toggles, depth click-to-query, infrastructure overlay (cables, wind farms) | Shows it's a product, not just a map |
| 3 | Domain features — depth profile along a line, area stats, survey coverage view | Demonstrates offshore wind/cable value |
| 4 | Polish — guided demo tour, dark theme, loading states, export | Interview-ready finish |

---

## Multi-Layer Architecture

Layers compose in MapLibre in z-order:
1. Base basemap (MapLibre style — dark/light)
2. COG bathymetry raster (hillshade + colormap, blended)
3. Depth contour lines (PMTiles vector, toggleable)
4. Infrastructure overlays — cables, wind farms, oil platforms (PMTiles)
5. Survey coverage footprints (PMTiles, shows Bedrock's data assets)
6. Interactive overlays — drawn transects, analysis results

---

## Anti-Patterns to Avoid

| Avoid | Why |
|-------|-----|
| Setting up TileServer-GL or Martin | Unnecessary complexity for static demo data |
| Using Leaflet | CPU-rendered, can't handle mixed raster/vector smoothly |
| Loading full GeoTIFF in browser | COG HTTP range requests fetch only visible pixels — use COG |
| Building backend before the map looks impressive | Visual impact is the demo |
| Serving raw NetCDF | Must convert to COG offline first |

---

## Production Architecture (for strategy doc, not demo)

```
Client → CDN → Next.js (Vercel)
               ↓
           FastAPI backend
               ↓
    ┌──────────┴──────────┐
  PostGIS              TiTiler
  (metadata,           (COG tile
   access control,      serving)
   audit logs)          ↓
                       S3/R2
                    (COG files,
                     survey data)
```

---

*Researched: 2026-03-12*
