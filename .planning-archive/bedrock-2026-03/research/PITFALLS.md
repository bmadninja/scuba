# Pitfalls Research

**Domain:** Ocean bathymetry data visualisation platform (Mosaic / Bedrock Ocean context)
**Researched:** 2026-03-12
**Confidence:** MEDIUM overall (HIGH for technical claims, MEDIUM for product strategy claims)

---

## Critical Pitfalls

### Pitfall 1: Loading Full-Resolution Bathymetric Grids into the Browser

**What goes wrong:** Developer fetches full GEBCO/survey GeoTIFF and pipes to frontend. GEBCO 2024 is ~900MB global; proprietary multibeam can be 5–50GB. Map freezes or crashes. Tested on a 10km crop during development, works fine — then client zooms out and it dies.

**Prevention:** Serve bathymetry as tiled raster (Cloud-Optimised GeoTIFF via rio-cogeo + titiler) or vector tiles for contour overlays. Never load raw raster in browser. Use GDAL overviews (`gdaladdo`) for multi-resolution.

**Warning signs:** Hardcoded bounding box. Single large file (>5MB) in network tab on load. Map fast until panning to new area.

**Phase:** Foundation — bake tiled serving in from day one; retrofitting is expensive.

---

### Pitfall 2: WGS84 / EPSG:4326 vs Web Mercator / EPSG:3857 Confusion

**What goes wrong:** Bathymetric datasets delivered in EPSG:4326; web maps default to EPSG:3857. Measurements in wrong CRS produce wrong numbers. Multibeam surveys in UTM projections not reprojected before ingestion — contours appear offset by hundreds of metres.

**Prevention:** Canonical store in EPSG:4326, reproject at serving time. Use `gdalsrsinfo` / `rio info` on every input. Check: no CRS = stop and investigate.

**Warning signs:** Overlay layers misalign with basemap. Depth at known benchmarks doesn't match published values. "datum" appears nowhere in codebase.

**Phase:** Data ingestion — validate CRS on every dataset before it enters the pipeline.

---

### Pitfall 3: NetCDF Fill Values, Scale/Offset, and Depth Sign Convention

**What goes wrong:** GEBCO uses `_FillValue` (commonly `32767` or `-9999`) and `scale_factor`/`add_offset` attributes. Ignored = depth spikes or absurd values. Sign convention: GEBCO stores elevation (negative = below surface). Some survey products store depth as positive-down. Mixing = inverted seabed.

**Prevention:** Always use `xarray` (auto-applies CF conventions). Document sign convention: "all depth stored as negative-elevation." Add sanity-check assertion: ocean pixels < 0, land pixels ≥ 0. Validate 5 known depth benchmarks per new dataset.

**Warning signs:** Max depth shows as 32767m. Ridges appear as mountains. Coastal shelf appears deeper than open ocean.

**Phase:** Data ingestion / prototype — add automated validation before first render.

---

### Pitfall 4: Demo Looks Great on Laptop, Terrible on Projector / Screen Share

**What goes wrong:** WebGL fine at 2x retina local; drops to 10fps screenshared. Dark ocean maps with subtle gradients look sharp on calibrated display; washed out on projector. Thin contour lines vanish. Labels unreadable at overview zoom.

**Prevention:** Screen-record a walkthrough at 1080p before the interview. High-contrast colour schemes (viridis, plasma, or NOAA haxby palette). Minimum 1.5px contour line weight. Don't rely on hover states that don't work in screenshare.

**Warning signs:** Colour palette chosen entirely from "looks nice on my screen." Never tested on a recording. Demo zoom level never tested at overview scale.

**Phase:** Demo polish — specific "interview readiness" checklist.

---

### Pitfall 5: Building Features Clients Don't Actually Use

**What goes wrong:** Over-invest in advanced analysis tools (histograms, volume calcs), custom export format menus, real-time streaming, annotation tools. Clients say they want more analysis — they actually mean "get data into my existing GIS tools faster."

**Prevention:** Primary job-to-be-done for cable and wind clients: get reliable depth data for a corridor/area into QGIS/ArcGIS/AutoCAD as fast as possible. Features that reduce friction in that handoff > in-browser analysis. Build one thing that fits their workflow rather than replacing it.

**Warning signs:** Roadmap full of "analysis" features, no "export" improvements. No explicit model of the handoff moment.

**Phase:** Product strategy — validate job-to-be-done before building features.

---

### Pitfall 6: "Deprioritised" Means Missing Ownership, Not Missing Demand

**What goes wrong:** No dedicated PM/designer. No user research. Tech debt accumulates. Sales works around limitations. Treating this as a pure product/UX problem when the real problem is organisational.

**For the interview:** Frame the demo not as "look at these features" but as "here is what is commercially at stake if Mosaic stays deprioritised." If cable companies can get equivalent data from Fugro SiteView or TGS with better UX, Bedrock loses the account. Make the competitive threat explicit.

**Warning signs on live product:** No changelog or roadmap. UX is clearly engineer-driven (power user features, no onboarding). Support handled by data team not product team.

**Phase:** Product strategy / competitive analysis — frame the commercial case before proposing features.

---

### Pitfall 7: Demo Data Coverage Gap — The Void Areas Problem

**What goes wrong:** GEBCO has significant voids in coastal and shelf areas. Demonstrating there makes the platform look worse than the real product — visible interpolation artefacts, low-resolution "puddles," incorrect shelf depths.

**Prevention:** Pick demo areas where GEBCO has good coverage and impressive topography — mid-ocean ridges, seamount chains, Canary Islands margin, continental shelf break. Avoid North Sea/Irish Sea for demo (coarse public data there; proprietary surveys are what matters). Explicitly call out: "this is public data; your proprietary surveys would render at 4x the resolution."

**Warning signs:** Demo area chosen by "looks interesting on a map" not verified data quality. No known depth value verified at demo location.

**Phase:** Prototype — validate demo data selection before building presentation logic.

---

### Pitfall 8: Colour Ramp Design — Representing Depth Badly

**What goes wrong:** Linear blue scale where deep = dark blue. Perceptually poor — shallow differences invisible, continental shelf and abyssal plain look the same shade. Rainbow/jet colourmap creates false visual boundaries at arbitrary depths.

**Prevention:** Use perceptually uniform sequential colourmap: NOAA "ocean" palette, GMT "haxby", or CIELAB-uniform custom palette. Apply non-linear (log or sqrt) scale so shallow and deep variation are both visible. Always include a labelled legend. Test with colour-blindness simulator.

**Warning signs:** Legend shows "0 to -11000" with no intermediate values. Shelf and abyssal plain same colour. Palette chosen because "it looks like the ocean."

**Phase:** Prototype — establish palette before building any visualisation.

---

### Pitfall 9: Ignoring Vertical Datum in Depth-Critical Applications

**What goes wrong:** WGS84 ellipsoid vs Chart Datum (LAT) vs Mean Sea Level differences of 1–5m are common. For cable burial planning, a 2m error can mean the difference between compliant and non-compliant burial depth assessment.

**Prevention:** Document vertical datum of every dataset in data catalogue. Never mix datasets with different vertical datums without explicit transformation. Flag this in the demo as a "production implementation concern" — shows awareness.

**Warning signs:** No vertical datum field in data catalogue. Depth queries return values without datum label.

**Phase:** Data catalogue / metadata — datum must be a first-class attribute.

---

### Pitfall 10: Demo Shows "The Map" Rather Than "The Workflow"

**What goes wrong:** Demo opens, shows a map, demonstrates features. Interviewer sees a map. This is what every competing platform does. It fails to differentiate because it leads with the tool, not the outcome.

**Prevention:** Structure the demo as a user story: "You are a cable engineer. Your company just won a contract for a North Atlantic cable route. You need to validate the depth profile before submitting to the regulator." Then let the product solve the problem in real time. Every feature shown is motivated by the scenario.

**Warning signs:** Demo script organised by feature not user problem. "And here you can see..." appears more than "so now the engineer needs to...". No specific client persona or scenario referenced.

**Phase:** Demo narrative — write the scenario script before building the demo.

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GEBCO WMTS tile service | Assuming always available, rate-limit-free | Download and self-host GEBCO tiles; public service has been intermittently unreliable |
| NOAA data download API | Treating as stable production API | Pin to specific version/dataset release, mirror data locally |
| Mapbox GL terrain | Using raster-array directly with GEBCO NetCDF | raster-array requires Mapbox Terrain-DEM format; convert via gdal2tiles or rio-cogeo |
| Cloud storage (S3/R2) | Serving COG tiles without CORS headers | Browsers block cross-origin requests; configure CORS explicitly on bucket |

---

## Performance Traps

| Trap | Prevention | Breaks At |
|------|------------|-----------|
| Single-resolution raster served whole | Build tile pyramid (COG overviews) | Files > ~50MB |
| Vector contours computed client-side | Pre-compute server-side; serve as vector tiles | Grid > ~500×500 cells |
| All survey metadata loaded at startup | Paginate/cluster; load on demand | > ~200 survey records |
| Synchronous fetch + render | Pre-fetch demo data; use progressive rendering | Every network call in a demo |

---

## UX Pitfalls

| Pitfall | Better Approach |
|---------|-----------------|
| No spatial search — user must know lat/lon | Place name / named field/block search; paste coordinates |
| Depth query requires right-click | Show depth on hover in persistent panel |
| No coverage indicator before download | Show data coverage confidence layer; highlight proprietary vs. public data zones |
| Data catalogue is a flat table | Filter by geography (draw AOI), date, resolution; cluster on map |
| No shareable URL / permalink | Every map state (centre, zoom, layers) should be URL-encodable |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase |
|---------|-----------------|
| Full raster in browser | Phase 1: Foundation — tile serving architecture |
| CRS/datum confusion | Phase 1: Data ingestion — validate all datasets |
| NetCDF fill values / sign convention | Phase 1: Data ingestion — automated validation |
| Bad colour ramp | Phase 2: Prototype — visual design before map |
| Demo looks bad on projector | Phase 3: Demo polish — presentation rehearsal checklist |
| Features clients don't use | Product strategy — workflow-first feature scoping |
| Deprioritised commercial framing | Product strategy / competitive analysis |
| Void areas in public data | Phase 2: Prototype — demo area selection |
| Demo leads with map not workflow | Phase 3: Demo narrative — write scenario first |
| No shareable URL | Phase 2: Prototype |

---

*Researched: 2026-03-12*
