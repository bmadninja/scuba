# Ocean Health Data Sources — Research Findings

Citable, publicly-accessible data sources for ocean health claims on scubaseason.fun. Each entry below has been URL-verified (fetched and confirmed live as of 2026-05-25). Excludes the sources already in `src/data/sources.json` (NOAA CRW, Allen Coral Atlas, GCRMN, AIMS LTMP, Reef Check, IUCN Red List, NCRMP, GBRMPA, AGRRA, ICRI).

---

## Top 5 Picks

Ranked by combined impact: credibility, license clarity, breadth of claims supported, and how often we'd cite them on dive-site, encounter, and location pages.

1. **NASA PO.DAAC** — the canonical citation for any SST, salinity, sea level, or ocean-circulation claim. Public-domain NASA data, deep historical coverage, programmatic access.
2. **Copernicus Marine Service (CMEMS)** — best single source for near-real-time and forecast SST, currents, chlorophyll, and biogeochemistry; explicitly free and open with clear EU licensing.
3. **NOAA CoastWatch / OceanWatch (ERDDAP)** — by far the easiest API surface for fetching live oceanographic rasters (SST anomalies, chl-a, ocean heat content) per dive-site coordinate. Worth its weight for site-page enrichment.
4. **OBIS (Ocean Biodiversity Information System)** — UNESCO/IOC clearinghouse of 187M+ marine species occurrence records. The natural citation for encounter pages ("recorded sightings of species X in region Y").
5. **Global Mangrove Watch (UNEP-WCMC + JAXA)** — peer-reviewed global mangrove baseline + change layers; the source to cite for any habitat-decline or coastal-protection claim near mangrove dive areas.

---

## 1. Satellite Oceanography (SST, Chlorophyll, Currents, Salinity)

### NASA PO.DAAC (Physical Oceanography DAAC)
- **URL:** https://podaac.jpl.nasa.gov/
- **Publisher:** NASA Jet Propulsion Laboratory / Caltech
- **License:** US Government public-domain (NASA Earthdata data-use policy — free use with attribution)
- **Supports claims:** historical and current SST, sea surface salinity, sea level / altimetry, ocean surface winds, ocean circulation. Hosts MODIS, GHRSST, SMAP, JASON/Sentinel-6, SWOT datasets.
- **Access:** HTTPS bulk download, OPeNDAP, S3 (NASA Earthdata Cloud), Harmony API, Python `podaac-data-subscriber`.
- **Credibility:** NASA-operated DAAC, primary archive for 40+ ocean missions; cited universally in peer-reviewed oceanography.
- **Why cite on site:** "Mean SST at this site (NASA MODIS, 2003–2024): 28.4 °C" — exact attribution for any temperature-history visualization.

### Copernicus Marine Service (CMEMS)
- **URL:** https://data.marine.copernicus.eu/products
- **Publisher:** Mercator Ocean International for the European Union (Copernicus Programme)
- **License:** Free and open under Copernicus data and information policy (attribution required; equivalent to CC BY in practice).
- **Supports claims:** near-real-time and forecast SST (OSTIA), surface currents, salinity, chlorophyll, oxygen, pH, primary production, sea ice; both global and regional (Med, Black Sea, Baltic, Arctic, NW Shelf).
- **Access:** Marine Data Store web UI, Python `copernicusmarine` toolbox, ERDDAP/WMS subset services, FTP.
- **Credibility:** Operational EU service; Ocean State Reports are EU reference documents; underpins WMO and IPCC reporting.
- **Why cite on site:** "Current SST anomaly: +1.2 °C above 1993–2014 climatology (Copernicus Marine OSTIA)" — best single source for live anomaly cards on location pages.

### NOAA CoastWatch / OceanWatch (ERDDAP)
- **URL:** https://coastwatch.noaa.gov/cwn/index.html (portal) and https://oceanwatch.pifsc.noaa.gov/erddap/ (Pacific node ERDDAP)
- **Publisher:** NOAA NESDIS / STAR (with regional nodes including PIFSC, AOML, NWFSC)
- **License:** US Government public-domain.
- **Supports claims:** SST, sea-level anomaly, chlorophyll-a, ocean heat content, harmful algal blooms, sea-surface salinity, sea-ice concentration, ocean winds, SAR. Long time series suitable for trend analysis.
- **Access:** ERDDAP (REST/JSON/netCDF/CSV by lat-lon-time subset) — programmatic, ideal for per-site lookups; also WMS, CoastWatch Utilities desktop tool.
- **Credibility:** NOAA operational satellite program with 30+ year history.
- **Why cite on site:** ERDDAP makes it trivial to fetch a single SST pixel for a dive-site point — the right tool for live "water temperature today" widgets with proper provenance.

### NASA Ocean Color (OB.DAAC)
- **URL:** https://oceancolor.gsfc.nasa.gov/
- **Publisher:** NASA Goddard Space Flight Center / Ocean Biology Processing Group
- **License:** US Government public-domain (NASA data-use policy).
- **Supports claims:** chlorophyll-a concentration, water clarity (Kd490), particulate carbon, primary productivity, harmful algal indicators. Mission archive: SeaWiFS, MODIS Aqua/Terra, VIIRS, Sentinel-3 OLCI, PACE.
- **Access:** Earthdata Search, OBPG `getfile` API, OB.DAAC FTP/HTTPS.
- **Credibility:** NASA-operated, decades of peer-reviewed validation; the reference archive for ocean color globally.
- **Why cite on site:** "Mean chlorophyll-a: 0.18 mg/m³ (NASA MODIS Aqua, 10-yr mean)" — supports "clear blue water" / visibility narratives with hard data.

### Bio-ORACLE
- **URL:** https://bio-oracle.org/
- **Publisher:** Bio-ORACLE consortium (lead: Universities of Algarve, Ghent, Adelaide; published in *Global Ecology and Biogeography*)
- **License:** Free for non-commercial scientific use with citation (Assis et al. 2018, 2024); commercial reuse requires permission — treat as "academic-citable, ask for commercial."
- **Supports claims:** global rasters of SST, salinity, pH, dissolved oxygen, nitrate, phosphate, silicate, chlorophyll, PAR, current velocity, bathymetry — present-day plus CMIP6 future projections (2000–2100, multiple SSP scenarios).
- **Access:** Bulk GeoTIFF/netCDF download, R package `sdmpredictors`, Python via `pyo-oracle`.
- **Credibility:** Widely cited (1,500+ peer-reviewed citations); built on Copernicus/NASA primary data, post-processed into model-ready layers.
- **Why cite on site:** Useful for forward-looking claims — "projected SST increase at this site by 2050 under SSP2-4.5: +1.6 °C."

---

## 2. Reef Monitoring Networks (Regional / Country-Level)

### CORDIO East Africa
- **URL:** https://cordioea.net/
- **Publisher:** Coastal Oceans Research and Development — Indian Ocean (NGO, Mombasa, Kenya)
- **License:** Reports are publicly downloadable with citation; raw data via request through CORDIO Data Portal (ArcGIS Hub).
- **Supports claims:** Western Indian Ocean coral cover, bleaching events, fish indicator status — Kenya, Tanzania, Seychelles, Comoros, Madagascar, Mozambique sites. Founded after the 1998 El Niño bleaching event.
- **Access:** PDF reports, ArcGIS Hub portal (cordio-data-portal-cordioea.hub.arcgis.com), bleaching dashboard.
- **Credibility:** GCRMN's Western Indian Ocean node; long-standing peer-reviewed research output; partners with Nairobi Convention and UNEP.
- **Why cite on site:** The authoritative source for any Indian-Ocean African dive-site reef-health claim (Mafia Island, Pemba, Aldabra, etc.).

### OBIS-SEAMAP (Spatial Ecological Analysis of Megavertebrate Populations)
- **URL:** https://seamap.env.duke.edu/
- **Publisher:** Duke University Marine Geospatial Ecology Lab (an OBIS thematic node)
- **License:** Open data with attribution; CC BY-like terms on most contributing datasets.
- **Supports claims:** marine megafauna sightings — cetaceans, sea turtles, seabirds, pinnipeds, rays — globally, with 8M+ observations.
- **Access:** Web mapper, dataset DOIs, occurrence download (CSV).
- **Credibility:** Duke-operated, peer-reviewed methodology, IUCN-partner for assessments.
- **Why cite on site:** Direct support for encounter pages — "X documented sightings of whale sharks in this 1° grid cell (OBIS-SEAMAP)."

---

## 3. Climate / Thermal Stress (Beyond NOAA CRW)

### Copernicus Marine Ocean State Report
- **URL:** https://marine.copernicus.eu/access-data/ocean-state-report
- **Publisher:** Copernicus Marine Service (Mercator Ocean International / EU)
- **License:** EU reference report, free open access.
- **Supports claims:** annual peer-reviewed assessment of global and European-regional ocean state — marine heatwaves, deoxygenation, acidification trends, salinity changes, decadal trend statistics.
- **Access:** PDF reports (annual), supplementary data via CMEMS catalogue.
- **Credibility:** Official EU reference publication; contributors are operational oceanographers and climate scientists.
- **Why cite on site:** Authoritative phrasing for high-level claims — "Mediterranean marine heatwave days have increased ~5× since 1982 (CMEMS Ocean State Report 8)."

### Bio-ORACLE future projections
- See entry under Satellite Oceanography. The CMIP6-downscaled layers (Bio-ORACLE v3) are arguably the easiest open source for forward-looking thermal-stress claims at site granularity.

### NOAA NCEI Ocean Heat Content
- **URL:** https://www.ncei.noaa.gov/products/ocean-heat-content
- **Publisher:** NOAA National Centers for Environmental Information
- **License:** US Government public-domain.
- **Supports claims:** global and basin-scale upper-ocean heat content anomalies (0–700 m, 0–2000 m), monthly and seasonal, 1955–present.
- **Access:** Bulk netCDF download, dashboard, OPeNDAP.
- **Credibility:** NOAA NCEI is the official US climate-data archive; the OHC product (Levitus, Boyer et al.) is the primary citation in IPCC reports.
- **Why cite on site:** Backs broader narrative claims — "Earth's oceans absorbed >90% of excess heat from greenhouse warming (NOAA NCEI)" — for explainer/about pages.

---

## 4. Buoy / In-Situ Ocean Observation Networks

### Argo Program
- **URL:** https://argo.ucsd.edu/
- **Publisher:** International Argo Program (coordinated by Scripps / UC San Diego; multi-nation)
- **License:** Free and unrestricted use (Argo Data Policy); citation of Argo and the Argo GDAC required.
- **Supports claims:** temperature and salinity profiles 0–2000 m globally; near-global coverage since ~2007. BGC-Argo adds chlorophyll, oxygen, nitrate, pH, suspended particles.
- **Access:** Argo GDACs (Brest, Monterey) via FTP/HTTPS; `argopy` Python package; ERDDAP; near-real-time within hours of surfacing.
- **Credibility:** International program endorsed by IOC/UNESCO and WMO; backbone of operational oceanography and reanalysis.
- **Why cite on site:** Subsurface profiles support thermocline/depth claims — "thermocline at ~80 m here based on Argo profiles, 2015–2024."

### NOAA National Data Buoy Center (NDBC)
- **URL:** https://www.ndbc.noaa.gov/
- **Publisher:** NOAA National Weather Service
- **License:** US Government public-domain.
- **Supports claims:** real-time and historical wave height, wave period, wind speed/direction, air and water temperature, atmospheric pressure from moored buoys, C-MAN coastal stations, drifting buoys, DART tsunami detectors, TAO equatorial Pacific array.
- **Access:** Web station pages, real-time JSON/text feeds, RSS, KML, NDBC THREDDS/ERDDAP archive.
- **Credibility:** Operational NOAA program since 1971; the primary US source for marine weather observations.
- **Why cite on site:** Live conditions cards on US/Caribbean/Pacific dive-site pages — "current wave height 1.2 m (NDBC Station 41043)."

### U.S. Integrated Ocean Observing System (IOOS)
- **URL:** https://ioos.noaa.gov/
- **Publisher:** NOAA IOOS Program Office + 11 regional associations (CARICOOS, PacIOOS, AOOS, GCOOS, etc.)
- **License:** US Government public-domain; regional association data typically CC BY or public-domain.
- **Supports claims:** integrated buoy, glider, HF-radar surface current, tide, and biogeochemical data across all US coasts, the Caribbean (CARICOOS), Hawaii/Pacific Islands (PacIOOS), and Great Lakes. Glider DAC aggregates underwater-glider profiles globally.
- **Access:** Regional ERDDAP servers, IOOS Data Catalog, Glider DAC THREDDS, regional dashboards.
- **Credibility:** Congressionally authorized NOAA program; regional associations are peer-reviewed.
- **Why cite on site:** PacIOOS in particular supports Hawaii/Micronesia dive-site conditions; CARICOOS for Caribbean. Surface-current maps add real value for drift/drift-dive context.

### EMODnet (European Marine Observation and Data Network)
- **URL:** https://emodnet.ec.europa.eu/en
- **Publisher:** European Commission (DG MARE) — consortium of 120+ European marine organizations
- **License:** Open access; products generally released under Creative Commons (per Frontiers paper and EU Open Data policy); confirm per-dataset terms.
- **Supports claims:** bathymetry, seabed habitats, marine biology (species occurrences and traits), chemistry, physics, geology, and human activities across European seas.
- **Access:** Thematic portals (bathymetry, biology, seabed-habitats, etc.), WMS/WFS, bulk download, API.
- **Credibility:** Official EU marine-data infrastructure since 2009.
- **Why cite on site:** Strongest source for European dive sites (Med, Atlantic Europe, Baltic, Black Sea) — habitat maps, bathymetry overlays, species records.

---

## 5. Habitat Datasets (Coral / Kelp / Seagrass / Mangrove)

### Global Mangrove Watch
- **URL:** https://www.globalmangrovewatch.org/ (interactive viewer) and https://resources.unep-wcmc.org/products/5e72c1881c524cd4bd0ca28a809514a2 (download)
- **Publisher:** UNEP-WCMC, JAXA, Aberystwyth University, Wetlands International (consortium)
- **License:** Open access with attribution; cite Bunting et al. 2018 (*Remote Sensing*) and the Global Mangrove Watch dataset DOI. Treat as CC BY-equivalent.
- **Supports claims:** global mangrove extent baseline (2010) plus annual change layers 1996–present, derived from ALOS PALSAR and Landsat. Reports loss/gain by country, ecoregion.
- **Access:** Interactive map viewer, GeoTIFF/Shapefile bulk download via UNEP-WCMC Resources and Ocean Data Viewer.
- **Credibility:** Peer-reviewed (*Remote Sensing* 2018), continuously updated; the canonical global mangrove dataset.
- **Why cite on site:** "Mangroves within 5 km of this site declined 6% from 1996 to 2020 (Global Mangrove Watch)" — concrete attribution for any coastal-habitat panel.

### UNEP-WCMC Ocean+ Habitats (global seagrass, saltmarsh, cold-water coral)
- **URL:** https://data.unep-wcmc.org/datasets/7 (note: SSL certificate had expired at time of check — fall back to https://resources.unep-wcmc.org/ for downloads, or https://wesr.unep.org/dc/dataset/gpml-global-distribution-of-mangroves--seagrasses-coral-reefs---saltmarshes)
- **Publisher:** UN Environment Programme World Conservation Monitoring Centre
- **License:** Open with attribution; per-dataset terms in metadata.
- **Supports claims:** global distribution polygons/points for seagrasses, saltmarshes, cold-water corals, warm-water coral reefs, kelp forests.
- **Access:** Shapefile/GeoTIFF download via UNEP-WCMC Resources portal; redistributed via Copernicus Marine (e.g., product `EXT_UNEP_WCMC_SEAGRASSES`).
- **Credibility:** Compiled by UNEP-WCMC with peer-reviewed source data; the standard reference for global habitat extent.
- **Why cite on site:** Seagrass meadow context for sites like Shark Bay, Caribbean turtle-grass beds, Med Posidonia.

### Ocean Biodiversity Information System (OBIS)
- **URL:** https://obis.org/
- **Publisher:** Intergovernmental Oceanographic Commission of UNESCO (IODE programme)
- **License:** Most occurrence records released under CC0 or CC BY (per-dataset; OBIS aggregates Darwin Core records with explicit licenses).
- **Supports claims:** 187M+ species occurrence records across 204,000 marine species (bacteria → whales, surface → 10,900 m), 7,200+ datasets from 99 countries.
- **Access:** Web mapper, REST API (`api.obis.org`), R package `robis`, Python `pyobis`, bulk Darwin Core archives, AWS Open Data registry.
- **Credibility:** UNESCO/IOC-governed, peer-reviewed methodology, cited in 100+ scientific papers annually.
- **Why cite on site:** Encounter pages — "Manta birostris: 2,431 recorded occurrences in OBIS within this region" — strongest provenance for "what you might see here" claims.

### Global Kelp Time Series (Krumhansl/Wernberg et al.)
- **URL:** https://github.com/kelpecosystems/global_kelp_time_series
- **Publisher:** Kelp Ecosystems Research Group (Krumhansl, Wernberg, et al., published in *PNAS* 2016)
- **License:** Code and processed data released open via GitHub (typically MIT/CC BY for data); cite Krumhansl et al. 2016, *PNAS*.
- **Supports claims:** century-scale kelp-forest change trajectories by ecoregion (declining ~38% of regions, stable ~35%, increasing ~27% globally).
- **Access:** GitHub repository (CSV, R scripts).
- **Credibility:** Peer-reviewed *PNAS* publication; meta-analysis of 1,138 sites; widely cited.
- **Why cite on site:** Temperate-water dive locations (California, Tasmania, South Africa, Norway) — "kelp cover in this ecoregion declined X% over the past 50 years (Krumhansl et al. 2016)."

### Mora-Soto Global Giant Kelp Sentinel-2 Dataset
- **URL:** https://github.com/AlejandraMoraSoto/global-kelp-mapping (companion to Mora-Soto et al. 2020, *Remote Sensing*)
- **Publisher:** A. Mora-Soto et al., University of Cambridge / Oxford (peer-reviewed in *Remote Sensing*, 2020)
- **License:** Open with citation; supplementary data via Mendeley Data DOI.
- **Supports claims:** high-resolution (10 m) global distribution of giant kelp (*Macrocystis pyrifera*) and intertidal green algae from Sentinel-2.
- **Access:** GitHub, Mendeley Data, Google Earth Engine community catalog.
- **Credibility:** Peer-reviewed in *Remote Sensing* (MDPI, 2020).
- **Why cite on site:** Precision giant-kelp polygons for Pacific North America, Chile, Tasmania, southern Australia, New Zealand.

---

## Notes and Caveats

- **`data.unep-wcmc.org`** returned an expired-certificate error when fetched on 2026-05-25. The UNEP-WCMC content is still available via `resources.unep-wcmc.org` and `wesr.unep.org` mirrors. Flag this in any direct-link integration; prefer the alternate hosts.
- **Bio-ORACLE** licensing is academic-friendly but not unambiguously CC BY — fine to cite on a public-facing site as long as we attribute Assis et al. (the recommended citations are clearly listed on bio-oracle.org/citations).
- **Copernicus, NASA, NOAA** sources are all unambiguously safe for use on a commercial public site (scubaseason.fun) with attribution.
- **OBIS** records inherit the license of their contributing dataset — when displaying specific occurrence records, fetch and honor the per-record license string returned by the API (`license` field in Darwin Core).
- **Argo** explicitly waives restrictions but requires the standard Argo acknowledgement string.
