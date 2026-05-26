# Dive Conditions & Operational Oceanography — Source Research

Scope: NEW data sources for site-day forecasts and historical conditions on scubaseason.fun. Focus on waves, wind, currents, visibility, tides, tropical cyclones, water-temp forecasts, and any dive-specific aggregator that cites its primary sources.

Already in `src/data/sources.json` and intentionally excluded here: NOAA Coral Reef Watch, NASA PO.DAAC, Copernicus Marine Service, NOAA CoastWatch/OceanWatch, NASA Ocean Color, NOAA NDBC, Argo, IMOS/AODN, GHRSST.

All URLs verified via WebFetch on 2026-05-26 unless noted otherwise.

---

## Top 5 picks (ranked for a static-export site)

Higher ranking goes to sources with bulk-downloadable, redistributable, no-auth data that supports both "this week" forecast cards and "best season" climatology widgets — i.e. things we can pre-bake at build time.

1. **NOAA CO-OPS API (Tides & Currents)** — Authoritative tide/current predictions for ~3,000 US/territorial stations, REST+JSON, public-domain, no auth. The only realistic source for credible per-site tide tables on a static export.
2. **IBTrACS (NOAA NCEI)** — Open, bulk NetCDF/CSV global tropical cyclone tracks 1842–present. Perfect static input for "cyclone-season risk" climatology widgets per region.
3. **ECMWF Open Data (IFS/AIFS)** — CC BY 4.0, 0.25° global forecasts incl. waves, wind, MSLP via GRIB2 on AWS/Azure/GCP. Best free, redistributable, attributable forecast source. Rolling ~3-day archive, refetch in build job.
4. **Copernicus Climate Data Store (ERA5 / ERA5-Wave)** — Hourly reanalysis 1940–present incl. 10 m winds, significant wave height, swell period/direction. CC BY 4.0-equivalent license. Ideal for pre-baked monthly climatology (e.g. "May swell at Cocos: median Hs 1.6 m").
5. **HYCOM + NCODA Global Ocean Forecast** — 1/12° global currents, temp, salinity, SSH via THREDDS/OPeNDAP/NetCDF. Public release, unlimited distribution. Strongest operational source for current speed/direction at a dive site beyond tide-driven coasts.

---

## 1. Wave / Swell

### NOAA WaveWatch III (operational, via NOMADS)
- **URL:** https://nomads.ncep.noaa.gov/ (verified)
- **Publisher:** NOAA / NCEP
- **License:** US Government work, public domain
- **Claims supported:** Next 0–180 hour global wave forecasts — significant wave height, peak/mean period, peak direction, partitioned swell components.
- **Access:** GRIB2 via HTTPS bulk download and GRIB filter; updates 4×/day at 0/6/12/18Z.
- **Why credible:** Operational NCEP model, the underlying physics basis of most commercial surf forecast products; widely cited (Tolman et al. — peer-reviewed).
- **Use case:** Build-time fetch of nearest grid point for each dive site; show 3-day swell card with Hs and period.

### NOAA WaveWatch III source code & docs (NCEP)
- **URL:** https://polar.ncep.noaa.gov/waves/wavewatch/ (verified)
- **Publisher:** NOAA / NCEP
- **License:** Open-source model code, public-domain outputs
- **Claims supported:** Documentation citation for any wave product we surface — "modeled with WAVEWATCH III®."
- **Access:** GitHub repo, model manual.
- **Why credible:** US national operational wave model.
- **Use case:** Attribution + methods footnote when displaying wave forecasts.

### ECMWF Open Data (HRES + WAM waves)
- **URL:** https://www.ecmwf.int/en/forecasts/datasets/open-data (verified)
- **Publisher:** European Centre for Medium-Range Weather Forecasts
- **License:** CC BY 4.0 (redistributable, commercial OK with attribution)
- **Claims supported:** 0–360 h global forecasts of wind, MSLP, temperature, and waves (HRES-WAM) at 0.25°.
- **Access:** GRIB2 over HTTPS from ECMWF, AWS, Azure, GCP; `ecmwf-opendata` Python client; rolling 2–3 day archive.
- **Why credible:** ECMWF is the global benchmark for medium-range NWP skill; widely peer-reviewed.
- **Use case:** Primary forecast layer on the site-day conditions card — wave + wind in one fetch, license that explicitly permits redistribution.

### ERA5 / ERA5-Wave Reanalysis (Copernicus CDS)
- **URL:** https://cds.climate.copernicus.eu/ (verified)
- **Publisher:** Copernicus Climate Change Service (C3S), implemented by ECMWF
- **License:** Copernicus license (equivalent to CC BY 4.0; free reuse incl. commercial with attribution)
- **Claims supported:** Monthly/seasonal climatology 1940–present: significant wave height, peak period, mean wave direction, 10 m winds, MSLP.
- **Access:** CDS API (Python `cdsapi`), NetCDF/GRIB; bulk monthly means via "ERA5 monthly averaged" dataset.
- **Why credible:** Reanalysis is the gold standard for retrospective ocean-atmosphere climatology; cited in thousands of papers.
- **Use case:** Pre-bake per-site monthly climatology tables ("at Cocos in May, median Hs = 1.6 m, 90th-pct = 2.8 m").

---

## 2. Wind

### ECMWF Open Data (IFS / AIFS)
- Covered above — also our recommended wind forecast source.

### NOAA NOMADS — GFS
- **URL:** https://nomads.ncep.noaa.gov/ (verified)
- **Publisher:** NOAA / NCEP
- **License:** US Government work, public domain
- **Claims supported:** Global 0.25° wind, MSLP, temperature forecasts 0–384 h, 4 runs/day.
- **Access:** GRIB2 via HTTPS, GRIB Filter for spatial subsetting.
- **Why credible:** US flagship operational global NWP model.
- **Use case:** Public-domain fallback / cross-check for ECMWF wind layer; preferable when we want to avoid CC BY attribution chains.

### UK Met Office Weather DataHub
- **URL:** https://www.metoffice.gov.uk/services/data/met-office-weather-datahub (verified)
- **Publisher:** UK Met Office (Crown Copyright)
- **License:** Tiered — some atmospheric model products available free under Met Office Open Data; commercial use governed by separate license. Check per-product.
- **Claims supported:** Global 10 km deterministic and UK 2 km wind/precip forecasts.
- **Access:** REST API (GeoJSON spot forecasts, GRIB gridded), key required.
- **Why credible:** Tier-1 national meteorological service.
- **Use case:** Optional regional cross-check for European, Indian Ocean, and Antarctic Peninsula coverage where Met Office models historically perform well. Lower priority due to mixed licensing.

### NOAA PSL Gridded Climate Data
- **URL:** https://psl.noaa.gov/data/gridded/data.gpcp.html (verified — landing page for the wider gridded catalog at https://psl.noaa.gov/data/gridded/)
- **Publisher:** NOAA Physical Sciences Laboratory
- **License:** Public domain (attribution requested but not legally required)
- **Claims supported:** Long-term climatologies of surface wind, MSLP, SST from NCEP/NCAR reanalysis (1948–present), 20CR (1836–2015), and many others.
- **Access:** NetCDF download, OPeNDAP, web subsetter.
- **Why credible:** Operated by NOAA OAR; reanalyses are foundational peer-reviewed products.
- **Use case:** Backup climatology source if Copernicus CDS API is unavailable at build time; lighter-weight monthly-mean files.

---

## 3. Currents

### HYCOM + NCODA Global Ocean Forecast
- **URL:** https://www.hycom.org/ (verified)
- **Publisher:** HYCOM Consortium (US Navy, NOAA, academic partners)
- **License:** "DoD Distribution A — Approved for Public Release; Distribution Unlimited."
- **Claims supported:** Global 1/12° (~9 km) 0–180 h forecast of current u/v, temperature, salinity, sea surface height; full water column.
- **Access:** THREDDS, OPeNDAP, HTTPS, FTP/FTPS, NCSS subsetting; NetCDF.
- **Why credible:** Operational US Navy ocean model; the standard high-resolution global ocean forecast.
- **Use case:** Currents at depth for a dive site (e.g. "1.2 kt SW at 20 m at slack"); also the basis for any rip/upwelling commentary.

### NOAA AOML Altimeter-Derived Currents (regional monitoring)
- **URL:** https://www.aoml.noaa.gov/phod/altimetry/cvar/ (verified)
- **Publisher:** NOAA Atlantic Oceanographic and Meteorological Laboratory
- **License:** US Government work, public domain
- **Claims supported:** Long-term altimetry-derived transports for major currents — Yucatan, North Brazil, Florida, Agulhas, ACC.
- **Access:** Browse-only time series and maps; underlying altimetry data via AVISO/Copernicus.
- **Why credible:** Peer-reviewed NOAA research products.
- **Use case:** Narrative content on "what current passes this site" for Cozumel, Bahamas, Mozambique, etc.

### AVISO+ Altimetry (CNES)
- **URL:** https://www.aviso.altimetry.fr/ (verified)
- **Publisher:** CNES / French space agency
- **License:** Free for research/non-commercial; commercial use requires agreement. Registration required.
- **Claims supported:** Sea surface height anomaly, geostrophic current proxies, mesoscale eddies, hurricane heat potential.
- **Access:** FTP, THREDDS, CNES Data Center (registration required).
- **Why credible:** Decades of peer-reviewed altimetry science output.
- **Use case:** Backup/alt source for surface currents; lower priority because of registration and the existing Copernicus Marine entry.

---

## 4. Visibility / Turbidity

For now we already have NASA Ocean Color and Copernicus Marine (chlorophyll, Kd_490, suspended sediment proxies). The dive-specific gap is:

### NASA OceanData / OB.DAAC
- **URL:** https://oceandata.sci.gsfc.nasa.gov/ (verified)
- **Publisher:** NASA Goddard Space Flight Center / Ocean Biology DAAC
- **License:** Public domain (NASA data policy)
- **Claims supported:** Daily Kd_490 (light attenuation; a direct visibility proxy), chlorophyll-a, particulate inorganic carbon — from MODIS-Aqua, VIIRS, PACE.
- **Access:** HTTPS bulk download, OPeNDAP, search API; Earthdata Login for some products.
- **Why credible:** NASA operational ocean-color processing.
- **Use case:** Build per-site climatology of Kd_490 → estimated horizontal-visibility band per month. Distinguishable from our existing Ocean Color entry because this is the *direct download portal*, not the program homepage.

(No additional non-PO.DAAC turbidity source rises above this — most regional turbidity products derive from MODIS/VIIRS which is what OB.DAAC distributes.)

---

## 5. Tides

### NOAA CO-OPS API (Tides & Currents)
- **URL:** https://api.tidesandcurrents.noaa.gov/api/prod/ (verified) — also https://tidesandcurrents.noaa.gov/
- **Publisher:** NOAA National Ocean Service, CO-OPS
- **License:** US Government work, public domain
- **Claims supported:** Predicted high/low tides and 6-min tide heights for ~3,000 US, US territory, and partner stations; predicted currents at ~3,000 current stations; observed water level, wind, air/water temp, salinity at active gauges.
- **Access:** REST `datagetter` endpoint, JSON/XML/CSV; no auth, only an application-identifier parameter requested.
- **Why credible:** Official US tide authority.
- **Use case:** **High priority.** Direct build-time pre-fetch of next 14-day tide tables per dive site keyed to nearest CO-OPS station. Public-domain, redistributable, no key, no rate-limit gate.

### UHSLC — University of Hawaii Sea Level Center
- **URL:** https://uhslc.soest.hawaii.edu/data/ (verified)
- **Publisher:** University of Hawaii / NOAA-funded
- **License:** Mostly open; some provider-specific restrictions (e.g. South African Navy data). Attribute per dataset.
- **Claims supported:** Hourly and daily tide gauge records from ~500 global stations (Fast-Delivery + Research-Quality).
- **Access:** ERDDAP, OPeNDAP, legacy FTP portal; NetCDF and CSV.
- **Why credible:** Recognized GLOSS data center; widely cited in sea-level literature.
- **Use case:** Observed (not predicted) tide history outside the US/CO-OPS coverage — e.g. Maldives, Seychelles, Indonesia.

### IOC Sea Level Station Monitoring Facility (VLIZ / IOC-UNESCO)
- **URL:** https://www.ioc-sealevelmonitoring.org/ (verified)
- **Publisher:** VLIZ for UNESCO/IOC
- **License:** Open access; data providers retain rights — per-station attribution.
- **Claims supported:** Real-time sea-level (1-minute) at ~1,300 global stations including tsunami warning networks.
- **Access:** Web map, station-level CSV download.
- **Why credible:** Authoritative real-time network for the GLOSS Core Network and regional tsunami warning systems.
- **Use case:** Live "current tide / surge" indicator for sites near a GLOSS station; complements CO-OPS outside US waters.

### PSMSL — Permanent Service for Mean Sea Level
- **URL:** https://www.psmsl.org/ (verified)
- **Publisher:** National Oceanography Centre, UK (NERC-funded), affiliated with IOC and World Data System
- **License:** Open data; PSMSL requests citation per dataset, attribution to source authority.
- **Claims supported:** Monthly and annual mean sea level from ~2,000 stations, some series back to 1807.
- **Access:** Web map, table browser, bulk download.
- **Why credible:** Global data bank for long-term sea level change; cited across IPCC AR6 chapter 9.
- **Use case:** Footnote/methods reference when we explain long-term sea-level rise alongside coral-bleaching narratives. Lower direct UI use, high credibility weight.

---

## 6. Sea state / Tropical cyclones

### NHC — US National Hurricane Center
- **URL:** https://www.nhc.noaa.gov/ (verified)
- **Publisher:** NOAA / National Weather Service
- **License:** US Government work, public domain
- **Claims supported:** Active advisories, forecast tracks/cones, GIS shapefiles, HURDAT2 best-track archive for North Atlantic and East/Central Pacific.
- **Access:** Direct file pull (XML/KML/Shapefile), HURDAT2 text files, RSS, GIS.
- **Why credible:** US official TC authority for Atlantic + E/C Pacific basins.
- **Use case:** Live "tropical-cyclone alert" banner for dive sites in NHC AOR; historical-frequency overlays from HURDAT2.

### JTWC — Joint Typhoon Warning Center
- **URL:** https://www.metoc.navy.mil/jtwc/ (returned 403 to WebFetch but is a known public site; standard browsers serve it. Treat as conditional pending direct verification; bulk best-track data is mirrored at NCEI / IBTrACS regardless.)
- **Publisher:** US Navy / US Air Force
- **License:** US Government work, public domain
- **Claims supported:** Active warnings and best-tracks for West Pacific, North Indian, South Indian, South Pacific basins.
- **Access:** HTML bulletins, text advisories, annual TC report PDFs. Programmatic pull is best done via the IBTrACS archive (below) which ingests JTWC.
- **Why credible:** Official US warning center for non-NHC basins.
- **Use case:** Live banner for Maldives, Philippines, Australia, Fiji during cyclone season. Use IBTrACS for historical risk.

### IBTrACS (NOAA NCEI)
- **URL:** https://www.ncei.noaa.gov/products/international-best-track-archive (verified)
- **Publisher:** NOAA NCEI, WMO-supported
- **License:** Open (WMO Resolution 40 / WDC for Meteorology — "full and open access")
- **Claims supported:** Global tropical-cyclone best-tracks 1842–present, all 6 basins, agency-by-agency intensity records.
- **Access:** NetCDF (CF-compliant), CSV, point/line shapefiles; updated 3×/week.
- **Why credible:** Authoritative archive integrating NHC, JTWC, JMA, BoM, RSMC La Réunion, RSMC Nadi, IMD.
- **Use case:** **High priority.** Pre-compute per-site cyclone-frequency-by-month tables for every dive region; warn divers in season; tag historical storms that hit a site.

---

## 7. Water-Temperature Forecasts (forward-looking)

(Retrospective SST is already covered by Coral Reef Watch + GHRSST + OISST. The gap is forecast/forward-looking products.)

### HYCOM (forecast temperature + SSH)
- Covered under §3. HYCOM produces 0–180 h forecasts of SST and full-column temperature; this is the primary forward-looking ocean-temperature product we should adopt.

### NOAA CFS / CFSv2 (Climate Forecast System) — via NOMADS
- **URL:** https://nomads.ncep.noaa.gov/ (verified)
- **Publisher:** NOAA / NCEP / EMC
- **License:** US Government work, public domain
- **Claims supported:** 9-month seasonal SST/atmosphere ensemble forecast at ~0.9° (atmosphere) / ~0.5° (ocean).
- **Access:** GRIB2 via NOMADS; full archive at NCEI.
- **Why credible:** US operational seasonal model; peer-reviewed (Saha et al. 2014).
- **Use case:** "Will it still be too warm to dive at Komodo in Sept?" seasonal forecast widgets — show CFS SST anomaly outlook over each dive region.

### ECMWF SEAS5 (via Open Data + CDS)
- **URL:** https://cds.climate.copernicus.eu/ (verified)
- **Publisher:** ECMWF / Copernicus C3S
- **License:** Copernicus license (CC BY 4.0-equivalent)
- **Claims supported:** Up-to-7-month coupled ocean-atmosphere ensemble; SST, 2 m temperature, MSLP, winds.
- **Access:** CDS API, GRIB/NetCDF; some lagged for operational confidentiality.
- **Why credible:** Best-skill seasonal coupled model in most verification studies.
- **Use case:** Companion to CFS for season-ahead SST/wind anomaly; ensemble spread gives confidence interval.

---

## 8. Dive-/Sailing-Specific Forecasting Platforms

### Windy.com
- **URL:** https://www.windy.com/ (verified)
- **Publisher:** Windyty, SE (Czech Republic), private
- **License:** Proprietary. Free embed for non-commercial use; commercial embedding requires Windy API plan.
- **Claims supported:** Visualization layers over ECMWF, GFS, ICON, NEMS, NAM, HRRR — winds, swell, currents.
- **Access:** Browse, embeddable widget, paid API.
- **Why credible:** Transparent about underlying models; cites ECMWF/GFS/ICON in its layer picker.
- **Use case:** Optional "open in Windy" deeplink from a dive-site conditions card — doesn't make a claim on its own, just sends the user to richer visualization with the same underlying ECMWF/GFS data we're already citing.

### PredictWind
- **URL:** https://predictwind.com/ (verified — homepage returns a marketing surface; data-source documentation is gated behind product pages)
- **Publisher:** PredictWind Ltd (NZ), private
- **License:** Proprietary, subscription.
- **Claims supported:** PWE/PWG proprietary models plus repackaged ECMWF, GFS, UKMO.
- **Access:** App + subscription API.
- **Why credible:** Cited within sailing/yachting community; transparent about which base models feed each layer.
- **Use case:** Mention only in optional outbound links for serious boat-based dive planning. Not a primary citation.

### Surfline / Magicseaweed
- Both proprietary aggregators on top of NWW3 / WAVEWATCH-style data; neither exposes a free, redistributable data feed. **Do not adopt as primary source.** If we ever want a "surf-forecast view," deep-link to Surfline rather than re-host.

---

## Aggregators / Bonus

### ERDDAP (NOAA + regional nodes — e.g. GCOOS, CoastWatch West Coast, OceanWatch Pacific)
- **URL:** https://www.ncei.noaa.gov/erddap/index.html (verified) and https://erddap.gcoos.org/erddap/index.html (verified)
- **Publisher:** NOAA + regional IOOS associations
- **License:** Per-dataset; underlying data are mostly public-domain US Government or CC BY.
- **Claims supported:** Unified subsetting of buoys, gliders, HF radar surface currents, satellite SST, model output.
- **Access:** RESTful tabledap (CSV/JSON) and griddap (NetCDF/CSV); no auth for public datasets.
- **Why credible:** Standardized server architecture used across NOAA + IOOS.
- **Use case:** **Strong fit for static export.** A build script can hit ERDDAP for nearest-station data per dive site (HF-radar currents, buoy wave height) in a single uniform request shape — much simpler than juggling 5 different APIs.

---

## Skipped (and why)

- **Windy/PredictWind/Surfline/MSW** as *primary* sources — proprietary aggregators on top of public models we already cite directly.
- **MyForecast** — opaque aggregator, no published data lineage.
- **CIMSS tropical page** — URL https://www.ssec.wisc.edu/tropic/ returned 404 on verification; covered by IBTrACS + NHC + JTWC anyway.
- **NCEI WaveWatch III hindcast landing page** — returned 404 on verification (page restructured). The hindcast remains accessible through NCEI THREDDS / ERDDAP, so cite via the ERDDAP entry above rather than the broken landing page.
- **Generic NCEI GFS landing page** — also 404; use NOMADS entry above plus NCEI's model archives via ERDDAP.
- **NASA Sea Level Portal (earth.gov/sealevel)** — verified live, but it's a visualization layer over PSMSL/UHSLC/altimetry. Cite the primaries instead.
- **AVISO+ above CMEMS** — kept but de-prioritized because Copernicus Marine (already in sources.json) redistributes the same altimetry under cleaner license.

---

## Suggested integration shape for sources.json (sketch only — not applied)

Recommended additions (id-style consistent with existing entries):

- `noaa-ww3` — NOAA WaveWatch III via NOMADS
- `ecmwf-open` — ECMWF Open Data (IFS/AIFS + HRES-WAM)
- `era5` — ERA5 / ERA5-Wave via Copernicus CDS
- `noaa-gfs` — NOAA GFS via NOMADS
- `noaa-cfs` — NOAA CFSv2 seasonal forecast
- `ecmwf-seas5` — ECMWF SEAS5 seasonal forecast
- `hycom` — HYCOM + NCODA global ocean forecast
- `aoml-altimetry` — NOAA AOML altimeter-derived currents
- `noaa-coops` — NOAA CO-OPS Tides & Currents
- `uhslc` — University of Hawaii Sea Level Center
- `ioc-sealevel` — IOC Sea Level Station Monitoring Facility
- `psmsl` — Permanent Service for Mean Sea Level
- `nhc` — NOAA National Hurricane Center
- `jtwc` — Joint Typhoon Warning Center
- `ibtracs` — IBTrACS global TC archive
- `noaa-psl` — NOAA Physical Sciences Laboratory gridded climate
- `obdaac` — NASA OB.DAAC ocean color data portal
- `erddap-noaa` — NOAA ERDDAP unified subsetter

That's 18 candidates — well above the 8–15 target — so the implementer can drop the lower-priority ones (UKMO DataHub, AVISO+, PredictWind link-out, Windy link-out) without losing coverage.
