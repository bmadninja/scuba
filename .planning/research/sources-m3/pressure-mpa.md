# Human Pressure, MPAs, and Fisheries Impact — Source Registry Research

Research for M3 source-registry gap: pressure on reefs, marine protected areas, and fisheries impact. All URLs verified live as of 2026-05-25. License terms read directly from publisher T&Cs pages where possible.

---

## 1. Fishing pressure

### Global Fishing Watch
- **id**: `global-fishing-watch`
- **url**: https://globalfishingwatch.org/our-apis/
- **publisher**: Global Fishing Watch (NGO, founded by Oceana, SkyTruth, Google)
- **sourceType**: government-monitoring (AIS-derived; uses satellite + state-mandated vessel transponders)
- **license**: Free for non-commercial / public-good use under custom Terms of Service. Requires free registered API token, mandatory attribution, follow-up survey participation. Commercial use requires custom license — explicitly out of scope for free tier. See https://globalfishingwatch.org/faqs/can-i-use-global-fishing-watch-apis-for-commercial-purposes/
- **data_format**: REST API (JSON), tile-server (Carto/Mapbox layers), Python client `gfw-api-python-client`, R client `gfwr`. Pre-aggregated CSVs at /datasets-and-code/.
- **claims_it_supports**:
  - Apparent commercial fishing effort (hours) per 0.01° grid cell
  - Vessel-by-vessel fishing events near a dive site
  - Encounter / transshipment events (illegal-fishing proxy)
  - Port visit patterns (industry footprint)
  - SAR detections (catches "dark fleet" vessels with AIS off)
- **integration_priority**: HIGH
- **notes**: Single most credible dataset for "is this reef being actively fished?" Caveat: AIS coverage is biased toward industrial vessels >24m and flag-state compliance — artisanal fleets are largely invisible. Commercial-use ambiguity is a real concern for scubaseason if it monetizes; need to confirm whether the site qualifies as "public good" or needs a custom license.

### Sea Around Us
- **id**: `sea-around-us`
- **url**: https://www.seaaroundus.org/
- **publisher**: Sea Around Us project, Institute for the Oceans and Fisheries, University of British Columbia
- **sourceType**: peer-reviewed-paper (catch reconstructions are published methodology + dataset hybrid)
- **license**: CC BY-NC 4.0. Citation policy at https://www.seaaroundus.org/citation-policy/. Country-specific data requires citing the country-specific reconstruction paper, not just the website.
- **data_format**: CSV download per EEZ / LME / RFMO / taxon, plus REST endpoints used by the site.
- **claims_it_supports**:
  - Historical catch reconstruction (1950–present) by EEZ, including unreported/IUU and discards
  - Catch composition by gear and taxon — useful for "what species are being removed near this site"
  - Marine Trophic Index (fishing-down-the-food-web indicator)
- **integration_priority**: MEDIUM
- **notes**: Academic flagship for reconstructed catch (vs. official FAO numbers that miss IUU). Dense and methodology-heavy — a consumer site should cite specific findings (e.g., "X% of catch in this EEZ is unreported") rather than dumping raw CSVs. NC clause limits direct embedding in a monetized product.

### FAO FishStat
- **id**: `fao-fishstat`
- **url**: https://www.fao.org/fishery/en/fishstat
- **publisher**: UN Food and Agriculture Organization (FAO)
- **sourceType**: government-monitoring (national self-reported statistics aggregated by FAO)
- **license**: CC BY-NC-SA 3.0 IGO. Policy at https://openknowledge.fao.org/server/api/core/bitstreams/6fe33207-e53d-4060-8d81-396b323789d5/content
- **data_format**: FishStatJ desktop app (Java), Statistical Query Panel (web), bulk CSV/ZIP downloads, R package `fishstat` on CRAN.
- **claims_it_supports**:
  - Official national capture-fishery production by country/species/year (1950–)
  - Aquaculture production (relevant for coastal-pollution framing — shrimp/salmon farm pressure)
  - Fleet size statistics
- **integration_priority**: MEDIUM
- **notes**: The canonical, government-of-record fisheries dataset. NC-SA license is the limiting factor — share-alike means any derivative dataset scubaseason builds and republishes must be CC BY-NC-SA too. Probably cite as inline statistics, do not bulk-redistribute.

---

## 2. MPA databases

### World Database on Protected Areas (WDPA) / Protected Planet
- **id**: `wdpa-protected-planet`
- **url**: https://www.protectedplanet.net/
- **publisher**: UNEP-WCMC and IUCN (joint product)
- **sourceType**: government-monitoring (compiled from national government submissions)
- **license**: Custom WDPA license — non-commercial only, no sub-licensing, no redistribution as downloadable layer; web publication allowed if not downloadable AND attribution shown. Full text: https://www.unep-wcmc.org/en/wdpa-data-license. Commercial use requires written permission from protectedareas@unep-wcmc.org.
- **data_format**: Monthly ESRI Shapefile / File Geodatabase / CSV download (registration required), plus REST API via Protected Planet.
- **claims_it_supports**:
  - MPA boundary polygons globally
  - IUCN protection category (Ia / Ib / II / III / IV / V / VI / Not Reported)
  - Designation type, year established, governing body
  - Marine vs. terrestrial classification
- **integration_priority**: HIGH
- **notes**: The single global registry for "is this dive site inside an MPA?" — every other MPA tool builds on top of WDPA. License is the catch: scubaseason cannot expose the raw shapefile as a downloadable layer, but CAN render it on a map with attribution AND cite "this site lies within [MPA name], IUCN Cat II, est. 1998." Need to email UNEP-WCMC if any commercial relationship is later established.

### Marine Protection Atlas (MPAtlas)
- **id**: `mpatlas`
- **url**: https://mpatlas.org/
- **publisher**: Marine Conservation Institute
- **sourceType**: scientific-survey (assessment overlay on top of WDPA)
- **license**: Open-access, freely downloadable. Specific license terms not as cleanly stated as WDPA — site says "open-access ... for research, policy, management, and other conservation decision-making." Treat as effectively CC BY with attribution; verify with marine-conservation.org before commercial use.
- **data_format**: Shapefile / GeoJSON download at https://marine-conservation.org/mpatlas/download/, plus web map.
- **claims_it_supports**:
  - "Implemented" vs. "designated-only" MPA status (catches paper-park problem)
  - Level-of-protection score (fully / highly / lightly / minimally protected, per The MPA Guide framework, Grorud-Colvert et al. 2021 Science)
  - Stage of establishment (proposed / designated / implemented / actively managed)
- **integration_priority**: HIGH
- **notes**: The critical complement to WDPA. WDPA says "this is an MPA"; MPAtlas tells you "but is it actually protecting anything?" Roughly 8% of the global ocean is in WDPA-listed MPAs, but only ~3% is fully or highly protected per MPAtlas — that gap is exactly the kind of insight that distinguishes scubaseason from a generic dive directory. Only covers assessed MPAs, not all of them — pair with WDPA for full coverage.

---

## 3. Regional sea conventions

### OSPAR Commission (NE Atlantic)
- **id**: `ospar-mpa`
- **url**: https://mpa.ospar.org/ (data webtool) — main org at https://www.ospar.org/work-areas/bdc/marine-protected-areas/mpa-webtool
- **publisher**: OSPAR Commission (15 governments + EU), co-administered by Agence française pour la biodiversité and Bundesamt für Naturschutz
- **sourceType**: government-monitoring (treaty-mandated reporting)
- **license**: Not explicitly stated as a standard CC license. OSPAR publications and reports are generally citable with attribution; the MPA webtool is a public-facing portal. Treat as web-only with citation.
- **data_format**: Web tool with downloadable summary reports (PDF) and assessment sheets; spatial data feeds into EMODnet.
- **claims_it_supports**:
  - MPA coverage statistics for NE Atlantic Contracting Parties
  - OSPAR threatened and/or declining species/habitats list (regional Red List)
  - Areas Beyond National Jurisdiction (ABNJ) protection
- **integration_priority**: LOW (regional scope; only relevant for NE Atlantic dive sites — UK, Ireland, France, Norway, Iceland, Portugal, Spain Atlantic)
- **notes**: Useful regional policy framing for any European Atlantic dive site. For scubaseason this is a "cite when relevant" rather than a primary integration.

### UNEP Regional Seas Programme (Barcelona / Cartagena / Nairobi conventions)
- **id**: `unep-regional-seas`
- **url**: https://www.unep.org/topics/ocean-seas-and-coasts/regional-seas-programme/regional-seas-conventions-and-action-plans
- **publisher**: UN Environment Programme
- **sourceType**: editorial-curation (treaty texts + UNEP secretariat reports; not a primary dataset)
- **license**: UN documents are generally free to cite with attribution; UNEP's standard publication license is CC BY-NC-SA 3.0 IGO for most reports.
- **data_format**: web-only (treaty texts, periodic State of the Marine Environment reports as PDFs)
- **claims_it_supports**:
  - "This dive site falls under the Barcelona Convention's SPAMI (Specially Protected Areas of Mediterranean Importance) framework"
  - "This Caribbean site is governed by the Cartagena Convention's SPAW Protocol"
  - "This Western Indian Ocean site is covered by the Nairobi Convention"
  - Regional policy framing — what international obligations apply
- **integration_priority**: LOW-MEDIUM
- **notes**: This is framing context, not a dataset. Useful for a "Governance & protection" section on a site page — gives the reader a sense of which international body is supposed to be looking after this water. Each convention has its own secretariat website with deeper data (e.g., SPA/RAC for Barcelona at https://www.rac-spa.org/, SPAW-RAC for Cartagena, CAR/RCU). Worth one inline reference, not a feature integration.

---

## 4. Coastal pollution / reef threat composites

### WRI Reefs at Risk Revisited
- **id**: `wri-reefs-at-risk`
- **url**: https://www.wri.org/data/reefs-risk-revisited
- **publisher**: World Resources Institute (with The Nature Conservancy, WorldFish Center, ICRAN, UNEP-WCMC, Global Coral Reef Monitoring Network)
- **sourceType**: scientific-survey (modeled composite threat index)
- **license**: CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivatives). NoDerivatives is restrictive — cannot republish modified versions of the layers.
- **data_format**: GIS shapefiles and KML downloads (also available by DVD on request), plus PDF report.
- **claims_it_supports**:
  - Composite local threat index (low / medium / high / very high) per reef cell
  - Component layers: coastal development pressure, watershed-based pollution, marine-based pollution & damage, overfishing & destructive fishing
  - Integrated threat including thermal stress + ocean acidification projections
- **integration_priority**: HIGH
- **notes**: Best single "what's threatening this specific reef" composite for any reef site, despite being 2011-vintage. The four threat components map exactly to the categories scubaseason wants to surface. ND clause means we can show the original layer with attribution but not bake it into a recolored derivative. Pair with NOAA Coral Reef Watch for current thermal data since Reefs at Risk's climate projections are dated.

### Ocean Health Index (OHI)
- **id**: `ocean-health-index`
- **url**: https://oceanhealthindex.org/
- **publisher**: National Center for Ecological Analysis and Synthesis (NCEAS, UCSB) + Conservation International
- **sourceType**: scientific-survey (composite index from ~100 source datasets)
- **license**: Open data; site explicitly invites use, asks for citation. All code on GitHub (ohi-science org) under permissive license. Underlying source data must be obtained from original providers (OHI doesn't redistribute raw inputs).
- **data_format**: CSV per goal/sub-goal/year/EEZ at https://oceanhealthindex.org/global-scores/data-download/; R package `ohicore`; interactive map.
- **claims_it_supports**:
  - Per-country EEZ score (0–100) on 10 goals: food provision, artisanal fishing opportunity, natural products, carbon storage, coastal protection, livelihoods & economies, tourism & recreation, sense of place, clean waters, biodiversity
  - Time series 2012–present, recomputed annually
  - Pressure and resilience sub-scores feeding each goal
- **integration_priority**: MEDIUM
- **notes**: Country-level (EEZ-level) granularity — not site-level — so it's a framing data point ("Indonesia's overall ocean-health score is X"), not a per-dive-site stat. Useful as a "national ocean stewardship" badge on country/region pages.

### Allen Coral Atlas
- **id**: `allen-coral-atlas`
- **url**: https://allencoralatlas.org/
- **publisher**: Allen Coral Atlas Partnership (Arizona State Univ., Planet, Univ. of Queensland, National Geographic Society) — originally funded by Paul G. Allen Philanthropies
- **sourceType**: scientific-survey (satellite-derived habitat maps + bleaching monitoring)
- **license**: Maps, bathymetry, and statistics under **CC BY 4.0** (permissive). Satellite imagery on the site is CC BY-SA-NC 4.0 (more restrictive). License note: https://allencoralatlas.org/resources/
- **data_format**: Web map, Mapbox tile layers, downloadable GeoTIFF / shapefile per maritime boundary.
- **claims_it_supports**:
  - Shallow-water (0–15 m) reef habitat classification globally (coral/algae, rock, rubble, sand, seagrass)
  - Near-real-time bleaching detection (since 2020)
  - Reef extent — useful sanity check that a "dive site" actually has reef nearby
- **integration_priority**: HIGH
- **notes**: CC BY 4.0 on the core maps is the most permissive license in this whole research bundle — usable in a commercial product with attribution. Best modern complement to WRI Reefs at Risk for showing actual reef presence and current bleaching. Only covers shallow tropical/subtropical reefs.

---

## 5. Climate framing

### IPCC Special Report on the Ocean and Cryosphere (SROCC) + AR6 WGII Ch. 3
- **id**: `ipcc-srocc-ar6-ocean`
- **url**: https://www.ipcc.ch/srocc/ (SROCC), https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/ (AR6 WGII Ch. 3 "Oceans and Coastal Ecosystems")
- **publisher**: Intergovernmental Panel on Climate Change (IPCC)
- **sourceType**: peer-reviewed-paper (assessment report synthesizing thousands of papers)
- **license**: IPCC reports are free to use with proper citation per https://www.ipcc.ch/srocc/cite-report/. Figures may have specific reuse terms; text is citable verbatim with attribution.
- **data_format**: PDF chapters; figure source data in Zenodo / IPCC data distribution centre.
- **claims_it_supports**:
  - "Virtually all coral reefs will degrade from their current state, even if global warming is limited to 1.5°C" — direct cite-able statement
  - Marine heatwave frequency projections by RCP/SSP
  - Ocean acidification, deoxygenation, sea-level rise quantitative ranges
- **integration_priority**: HIGH (as authority citation, not as data integration)
- **notes**: Cite-only source — gives every climate claim on scubaseason the highest possible scientific authority. Use specific paragraph references (e.g., "IPCC AR6 WGII Ch. 3, Section 3.4.2.1") rather than vague "IPCC says". Pair the SROCC for ocean-specific deep dive with AR6 for the most recent assessment.

### NOAA Coral Reef Watch
- **id**: `noaa-coral-reef-watch`
- **url**: https://coralreefwatch.noaa.gov/
- **publisher**: NOAA / NESDIS Center for Satellite Applications and Research
- **sourceType**: government-monitoring
- **license**: U.S. Government Work — effectively public domain in the US, free to use globally with attribution per NOAA data policy. No CC license formally applied.
- **data_format**: NetCDF/GeoTIFF daily 5km global, ERDDAP server, KMZ, web map, alerts API.
- **claims_it_supports**:
  - Current sea surface temperature anomaly at any reef coordinate
  - Degree Heating Weeks (DHW) — bleaching-stress accumulator
  - Bleaching Alert Level (No Stress / Watch / Warning / Alert 1 / Alert 2)
  - 4-month bleaching outlook forecasts
- **integration_priority**: HIGH
- **notes**: The de facto operational source for "is this reef bleaching right now?" Already cited by Allen Coral Atlas for their alerts. Free, permissive, well-documented API. Should probably be the first climate-pressure integration scubaseason does.

---

## 6. Industry / trade

### PADI AWARE Foundation — Dive Against Debris / Conservation Action Portal
- **id**: `padi-aware`
- **url**: https://www.padi.com/aware (programme), https://www.diveagainstdebris.org/ (data portal), https://www.adoptheblue.org/ (MPA-adopt programme)
- **publisher**: PADI AWARE Foundation (501(c)(3))
- **sourceType**: citizen-science
- **license**: Not stated as a standard open license. Data is shared publicly via the Conservation Action Portal map; bulk-data export terms are not openly published — likely need a partnership inquiry for raw data. Foundation publishes annual reports openly.
- **data_format**: Web map + portal (Conservation Action Portal); periodic peer-reviewed publications (e.g., 2020 *Marine Pollution Bulletin* paper with Ocean Conservancy).
- **claims_it_supports**:
  - Citizen-science marine-debris counts at dive sites (>100,000 divers, 117 countries)
  - "Adopt the Blue" programme — dive operators publicly committing to MPA stewardship at a specific site
  - Shark/ray protection campaigns, advocacy positions
- **integration_priority**: MEDIUM (high if scubaseason partners with PADI; lower as a raw-data source)
- **notes**: Most relevant industry-adjacent source for scuba-specific signals — a dive site that's an "Adopt the Blue" site is a strong positive signal for the page. Data access likely requires partnership conversation; the public portal is fine for "links out to citizen-science data here" but not for ingest.

### Global Sustainable Tourism Council (GSTC)
- **id**: `gstc-criteria`
- **url**: https://www.gstc.org/gstc-criteria/
- **publisher**: Global Sustainable Tourism Council (UNEP and UNWTO-affiliated NGO)
- **sourceType**: editorial-curation (standards body — publishes criteria, not data)
- **license**: Criteria documents are freely downloadable PDFs, citable with attribution. GSTC-Recognized / GSTC-Certified operator lists are publicly browsable.
- **data_format**: PDF standards documents; web-listed certification registries.
- **claims_it_supports**:
  - "This operator is GSTC-Certified" — third-party sustainability signal
  - Destination-level sustainability standards (criteria for marine/coastal areas)
  - Framework for evaluating dive-operator claims
- **integration_priority**: LOW-MEDIUM
- **notes**: Useful for operator-level trust signals if scubaseason ever surfaces dive shops. Less relevant for site-level pressure data. Companion to DEMA (industry-side) and PADI AWARE (conservation-side).

---

## Suggested integration

### Most of these belong in a new methodology note: `mpa-and-pressure-context`

The existing scubaseason methodology notes appear to cover species and habitat — none cover the "is this place actually protected, and how hard is it being hit?" question. Proposed note structure:

```
id: mpa-and-pressure-context
title: "Protection status and human-pressure context"
purpose: |
  Show whether a dive site lies inside a designated MPA, how meaningfully that
  MPA is implemented, and what known human pressures are documented in the
  surrounding waters. Distinguish between paper parks and actively managed
  protection.

primary sources (in order of how to display):
  1. WDPA / Protected Planet — yes/no inside an MPA, name, IUCN category, year
  2. MPAtlas — implementation level (paper park vs. fully protected)
  3. Allen Coral Atlas — reef presence + active bleaching alerts
  4. NOAA Coral Reef Watch — current thermal stress (DHW, alert level)
  5. WRI Reefs at Risk — composite threat layer with 4 sub-components
  6. Global Fishing Watch — recent fishing-effort intensity in the surrounding cell
  7. UNEP Regional Seas — which international convention applies (Barcelona/SPAW/Nairobi/OSPAR)

secondary / framing:
  - Sea Around Us — EEZ-level catch context if site is in nearshore waters
  - FAO FishStat — national-level fishery scale
  - Ocean Health Index — national stewardship score
  - IPCC SROCC / AR6 — climate framing paragraph (cite-only)
  - PADI AWARE Adopt the Blue — operator stewardship signal
  - GSTC certification — operator-level sustainability signal

display pattern:
  A "Protection & pressure" card on each dive site page with three rows:
    1. Protection status (WDPA + MPAtlas)
    2. Active threats (NOAA CRW current bleaching + GFW recent fishing)
    3. Long-term threat composite (WRI Reefs at Risk)

  An optional "How this place is governed" section citing the relevant
  Regional Seas convention and IPCC framing.
```

### Priority order for actual data integration (HIGH-priority only):

1. **NOAA Coral Reef Watch** — permissive license, operational API, immediately useful. Start here.
2. **WDPA / Protected Planet** — needed for the basic "is this an MPA?" question; license-compliant if we show on map without offering download.
3. **Allen Coral Atlas** — CC BY 4.0, modern, has bleaching too. Easiest commercial-safe layer.
4. **MPAtlas** — overlay on top of WDPA to tell paper parks from real ones.
5. **WRI Reefs at Risk** — composite threat layer (ND clause means show, don't remix).
6. **Global Fishing Watch** — high signal but get a clarity letter on commercial-use status first.

### License risk summary

- **Commercial-safe (CC BY / public domain):** Allen Coral Atlas maps (CC BY 4.0), NOAA Coral Reef Watch (US Gov Work), IPCC reports (cite-only).
- **Non-commercial with custom T&C, careful framing OK:** Global Fishing Watch (public-good ToS), WDPA (no downloadable derivatives, web display OK), MPAtlas (open-access but not explicitly CC).
- **NC and/or ND — show but don't remix:** WRI Reefs at Risk (CC BY-NC-ND 4.0), Sea Around Us (CC BY-NC 4.0), FAO FishStat (CC BY-NC-SA 3.0 IGO).
- **Need partnership conversation:** PADI AWARE (data access likely requires NDA/MOU).

Before scubaseason takes any payment that would arguably make use "commercial," double-check WDPA and Global Fishing Watch in particular — those are the two whose NC clauses could most plausibly be triggered.
