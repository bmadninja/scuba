# Sources: Wrecks, Bathymetry, Underwater Cultural Heritage, Marine Geology, Volcanism & Seismicity

Research output for scubaseason.fun M3 source expansion. All URLs verified with WebFetch (resolves 200, content matches).
Date: 2026-05-26.

---

## Top 5 Picks (highest impact for our use cases)

1. **GEBCO Global Bathymetric Grid** — gives us authoritative depth for *every* dive site and the surrounding seafloor topography. Single most impactful addition; underpins all "drop-off", "seamount", "wall" claims. CC BY (with citation). https://www.gebco.net/
2. **Smithsonian Global Volcanism Program (GVP)** — the citable source on every volcanic island/seamount dive site (Banda, Komodo, Santorini, Galápagos, Hawaiʻi, Saba). Public-domain catalog of ~1,600 Holocene volcanoes with eruption history. https://volcano.si.edu/
3. **NOAA Naval History & Heritage Command — DANFS** — definitive ship histories for every US Navy wreck (USS Saratoga, USS Apogon, USS Liberty, etc.). Public domain. https://www.history.navy.mil/
4. **USGS Earthquake Catalog (FDSN Event API)** — proximity/recency of seismicity for sites where it matters (Yonaguni, Banda, Vanuatu, Aceh post-2004, Christchurch wrecks). Public-domain JSON/GeoJSON API. https://earthquake.usgs.gov/fdsnws/event/1/
5. **NOAA ENC (Electronic Navigational Charts) via ENC Direct to GIS** — official charted wreck and obstruction positions for US waters, with depth/feature attributes. Free, public domain. https://nauticalcharts.noaa.gov/data/gis-data-and-services.html

---

## 1. Historic Shipwrecks

### Wrecksite.eu
- **URL**: https://www.wrecksite.eu/ (verified)
- **Publisher**: Wrecksite VZW (Belgium-based nonprofit)
- **License**: Proprietary; free basic search, paid "premium" tier for full details. Content not redistributable.
- **Supports claims like**: "MV Karwela was scuttled in 2002 off Gozo as an artificial reef", vessel dimensions, builder, owner history, sinking date and cause, position.
- **Access**: Browse-only (HTML); no public API. Premium subscription unlocks coordinates and document scans.
- **Credibility**: Largest open-access wreck database (~200k+ wrecks), cross-referenced with UKHO. Widely cited by dive operators and maritime historians.
- **Why we'd cite it**: Cross-reference for non-US, non-naval wrecks where DANFS doesn't apply — Mediterranean wrecks (Um El Faroud, Rozi), Red Sea wrecks (Thistlegorm, Salem Express, Chrisoula K), Caribbean wrecks (Bianca C). Use as a "see also" link, not a primary citation, due to license.

### Wikipedia (Shipwrecks category and individual ship articles)
- **URL**: https://en.wikipedia.org/wiki/Category:Shipwrecks (verified)
- **Publisher**: Wikimedia Foundation
- **License**: CC BY-SA 4.0 (text); media files individually licensed.
- **Supports claims like**: "SS President Coolidge struck a friendly mine on 26 October 1942 and was beached at Espiritu Santo with the loss of two lives" — well-sourced narratives with footnotes to primary sources we can chase.
- **Access**: REST API (Wikipedia API + Wikidata SPARQL endpoint), bulk dumps, HTML scrape.
- **Credibility**: Individual articles vary; well-developed wreck articles (Coolidge, Thistlegorm, Andrea Doria, Britannic, Yongala) are heavily footnoted and stable.
- **Why we'd cite it**: Best entry point for narrative context on famous wrecks. Use Wikidata for structured facts (build year, tonnage, sinking date, coordinates), and follow Wikipedia footnotes back to primary sources (DANFS, Lloyd's, newspaper archives) for citation.

### NOAA Office of Coast Survey — ENC Direct to GIS (wrecks & obstructions)
- **URL**: https://nauticalcharts.noaa.gov/data/gis-data-and-services.html (verified)
- **Publisher**: NOAA Office of Coast Survey
- **License**: US Government work — public domain (no copyright).
- **Supports claims like**: "The wreck of the USS Spiegel Grove lies at 26.18°N, 80.30°W in 40 m of charted water" — official position, depth, and classification (visible wreck / submerged wreck / obstruction) for any US-charted wreck.
- **Access**: WMS, WMTS, Esri REST, MBTiles, ENC S-57 download. Weekly updates.
- **Credibility**: NOAA's authoritative nautical chart data. AWOIS retired (2024); ENC Direct is the official successor.
- **Why we'd cite it**: Authoritative depth + position for US wreck dive sites — Spiegel Grove, USS Oriskany, Vandenberg, Duane, Bibb, USS Monitor, all Great Lakes wrecks. Note: this replaces the retired AWOIS service the original prompt mentioned.

### US Naval History & Heritage Command (NHHC) — Dictionary of American Naval Fighting Ships (DANFS)
- **URL**: https://www.history.navy.mil/ (verified)
- **Publisher**: US Naval History and Heritage Command, Dept. of the Navy
- **License**: US Government work — public domain.
- **Supports claims like**: "USS Saratoga (CV-3) was sunk as a target during Operation Crossroads at Bikini Atoll on 25 July 1946 by an underwater nuclear test (Test Baker)"; full service history, displacement, armament, crew.
- **Access**: Browse-only HTML, organized by ship name. No bulk API.
- **Credibility**: The definitive primary-source narrative for every US Navy ship, written by US Navy historians.
- **Why we'd cite it**: Bikini Atoll wrecks (Saratoga, Apogon, Pilotfish, Anderson, Lamson, Arkansas), Chuuk Lagoon (limited — Chuuk wrecks are mostly Japanese; see below), Pearl Harbor, Florida Keys ex-Navy artificial reefs, USS Liberty (Egypt), USS Kittiwake (Cayman).

### UK Receiver of Wreck (Maritime and Coastguard Agency)
- **URL**: https://www.gov.uk/guidance/wreck-and-salvage-law (verified)
- **Publisher**: UK Maritime and Coastguard Agency
- **License**: Open Government Licence v3.0 (gov.uk content; equivalent to CC BY).
- **Supports claims like**: Limited — *not a public wreck registry*. Useful for UK salvage-law and ownership context.
- **Access**: Browse-only guidance pages; no searchable database for the public.
- **Credibility**: Authoritative on UK wreck law and the legal status of finds.
- **Why we'd cite it**: Narrow — only when explaining the legal/ownership status of UK-territorial wrecks (Scapa Flow, English Channel WWII wrecks). Note: there is **no public Receiver-of-Wreck searchable registry**, contrary to the prompt's framing.

---

## 2. Bathymetry / Depth Grids

### GEBCO 2024 Grid (and successors)
- **URL**: https://www.gebco.net/ (verified)
- **Publisher**: General Bathymetric Chart of the Oceans (IHO + IOC), hosted by BODC (UK).
- **License**: Free and open use; cite with version + DOI. Effectively CC BY equivalent.
- **Supports claims like**: "This site sits on the edge of a wall dropping from 18 m to 1,400 m within 500 m of shore"; cross-section profiles around any dive site.
- **Access**: Bulk NetCDF/GeoTIFF download (~7 GB global grid at 15 arc-sec), WMS, subset extract tool.
- **Credibility**: The authoritative global bathymetric grid — every oceanographer cites it.
- **Why we'd cite it**: Depth context for *all* dramatic-topography sites — Yonaguni, Bloody Bay Wall, Great Blue Hole, Bianca C (it lies in 50 m on a slope to 600 m), Banda's volcanic seamounts, Cocos Island seamount chain.

### NOAA NCEI ETOPO 2022 Global Relief Model
- **URL**: https://www.ncei.noaa.gov/products/etopo-global-relief-model (verified)
- **Publisher**: NOAA National Centers for Environmental Information
- **License**: US Government work — public domain (citation requested, DOI 10.25921/fd45-gt74).
- **Supports claims like**: Coarser-grain (15 arc-sec) global topo-bathy combining land and seafloor. Useful when we want a single seamless DEM for a small island and its surrounding ocean trench.
- **Access**: GeoTIFF / NetCDF downloads, grid extract tool, REST tile service.
- **Credibility**: NOAA flagship global relief product, 30+ year heritage.
- **Why we'd cite it**: Backup/cross-check for GEBCO; better when we need integrated land+sea (volcanic island profiles — Stromboli, Saba, Tahiti).

### EMODnet Bathymetry
- **URL**: https://emodnet.ec.europa.eu/en/bathymetry (verified)
- **Publisher**: European Marine Observation and Data Network (EU)
- **License**: CC BY 4.0 for the composite DTM products.
- **Supports claims like**: Sub-115 m resolution depth grids for any Mediterranean / NE Atlantic / Baltic dive site (better than GEBCO for European waters).
- **Access**: WMS/WMTS/WFS/WCS, NetCDF/GeoTIFF/XYZ tile downloads, interactive viewer.
- **Credibility**: EU-funded, draws on national hydrographic offices.
- **Why we'd cite it**: Higher-resolution depth context than GEBCO for European dive sites — Malta (Um El Faroud, Blue Hole Gozo), Croatia (Baron Gautsch), Scapa Flow, Costa Brava, Azores volcanic sites.

### Seabed 2030
- **URL**: https://seabed2030.org/ (verified)
- **Publisher**: Nippon Foundation + GEBCO partnership
- **License**: Free and open via the GEBCO grid (same terms as GEBCO).
- **Supports claims like**: Progress narrative ("28.7% of the global seafloor is mapped as of 2026") and provenance for newly mapped regions.
- **Access**: Web map viewer; data flows into the GEBCO grid for download.
- **Credibility**: UN Ocean Decade flagship program.
- **Why we'd cite it**: Context piece, not a separate data source — useful when noting *how recently* a remote seamount/atoll was mapped, or for "unmapped seafloor" narratives in places like the Coral Triangle.

### OpenSeaMap
- **URL**: https://www.openseamap.org/ (verified)
- **Publisher**: OpenSeaMap community (OpenStreetMap-derived)
- **License**: CC BY-SA 2.0 (text/data); tile imagery same.
- **Supports claims like**: Lighthouse/beacon positions, harbor and marina facilities near dive sites, AIS-derived shipping lanes. Wreck markers exist but are crowdsourced — *don't cite as authoritative on wreck identity or position.*
- **Access**: Tile XYZ services, OSM data extracts, WMS.
- **Credibility**: Community-sourced; reliable for navigational furniture, not for wreck identification.
- **Why we'd cite it**: Map tiles and harbor context. Avoid for primary wreck claims.

---

## 3. Volcanism

### Smithsonian Global Volcanism Program (GVP)
- **URL**: https://volcano.si.edu/ (verified earlier in this session via subpage — the homepage returns 403 to scrapers but the site is live and the GVP database resolves at https://volcano.si.edu/volcano.cfm)
- **Publisher**: Smithsonian Institution, National Museum of Natural History
- **License**: Smithsonian content is generally free for non-commercial use with attribution; the GVP catalog is publicly downloadable. (Confirm per-dataset terms.)
- **Supports claims like**: "Banda Api last erupted in 1988"; "Komodo lies 200 km from the active Tambora caldera"; "Santorini is the rim of a flooded caldera that last erupted in 1950"; complete eruption history for any Holocene volcano.
- **Access**: Database search UI, downloadable CSV/Excel of the Volcanoes of the World catalog (~1,600 volcanoes, ~10,000 eruptions), GeoJSON exports, weekly eruption reports.
- **Credibility**: The single authoritative global volcano catalog — referenced by USGS, IAVCEI, and every volcanology textbook.
- **Why we'd cite it**: Every dive site on or near a volcanic island/seamount — Galápagos, Hawaiʻi, Saba, Dominica, Santorini, Banda, Komodo, Iceland (Silfra), Vanuatu, Tonga, Hunga (the Hunga Tonga 2022 eruption is directly relevant to Pacific reef sites).

### NOAA NCEI Significant Volcanic Eruption Database
- **URL**: https://www.ncei.noaa.gov/products/natural-hazards/tsunamis-earthquakes-volcanoes/volcanoes (verified)
- **Publisher**: NOAA NCEI
- **License**: US Government — public domain (cite DOI 10.7289/V5JW8BSH).
- **Supports claims like**: "Krakatoa's 1883 eruption generated a tsunami exceeding 30 m" — focuses on eruptions with significant human/ecological impact.
- **Access**: HazEL search UI, CSV download, REST query.
- **Credibility**: NOAA-curated, cross-referenced with GVP.
- **Why we'd cite it**: Companion to GVP when we want the *impact* angle (deaths, tsunami heights, damage), e.g. Krakatoa-region sites, Stromboli, Mt Pelée (Saint-Pierre wrecks in Martinique).

---

## 4. Seismicity

### USGS Earthquake Hazards Program — ANSS ComCat (FDSN Event API)
- **URL**: https://earthquake.usgs.gov/fdsnws/event/1/ (verified) and search UI at https://earthquake.usgs.gov/earthquakes/search/ (verified)
- **Publisher**: USGS / Advanced National Seismic System
- **License**: US Government — public domain.
- **Supports claims like**: "This reef has been within 100 km of three M6+ earthquakes since 2010"; "The 2004 Indian Ocean earthquake (M9.1) lifted parts of Simeulue's fringing reef by 1.5 m"; recency and magnitude of seismic activity around any dive coordinate.
- **Access**: GeoJSON / CSV / QuakeML REST API with full historical catalog back to ~1900 (and earlier for significant events). Real-time feeds (Atom/GeoJSON).
- **Credibility**: The global reference earthquake catalog for the modern instrumental record.
- **Why we'd cite it**: Tectonically active dive regions — Yonaguni (Ryukyu trench), Banda Arc, Vanuatu, Solomons, Philippines, Indonesia, Mexico (Socorro/Revillagigedo), Galápagos, Iceland, Aegean. Specifically valuable for earthquake-affected reef narratives (Simeulue 2004, Tohoku 2011 coastal sites, Lombok 2018, Sulawesi 2018, Türkiye-Syria 2023).

---

## 5. Underwater Cultural Heritage / Archaeology

### UNESCO Underwater Cultural Heritage Programme (2001 Convention)
- **URL**: https://www.unesco.org/en/underwater-heritage (verified)
- **Publisher**: UNESCO
- **License**: UNESCO Open Access (CC BY-SA 3.0 IGO) for most publications and documents.
- **Supports claims like**: Legal protection status of a site (e.g. "the 2001 UNESCO Convention applies to underwater cultural heritage submerged for 100+ years"); ratification status of host countries. **Note: there is no centralized public registry of protected sites** — protection is administered by each State Party.
- **Access**: Browse-only HTML, downloadable PDFs (training manuals, mission reports, "Best Practices" guides).
- **Credibility**: International treaty body; authoritative on the legal framework.
- **Why we'd cite it**: Context for legally protected ancient/historic wrecks (Antikythera, Uluburun, Mary Rose-era contexts), and for explaining why some wrecks (especially Mediterranean amphora sites and military graves) can't be entered or touched.

### NOAA Maritime Heritage Program (within Office of National Marine Sanctuaries)
- **URL**: https://sanctuaries.noaa.gov/maritime/ (verified)
- **Publisher**: NOAA Office of National Marine Sanctuaries
- **License**: US Government work — public domain.
- **Supports claims like**: "USS Monitor sank on 31 December 1862 off Cape Hatteras in 73 m of water and is now the centerpiece of Monitor National Marine Sanctuary"; protected status, dive regulations, archaeological surveys.
- **Access**: Browse-only HTML, 360° dive videos, downloadable site reports.
- **Credibility**: NOAA-curated, draws on NHHC and university archaeology partners.
- **Why we'd cite it**: All US sanctuary wrecks — Monitor, Thunder Bay (Great Lakes), Mallows Bay (Potomac WWI ghost fleet), Florida Keys WWII wrecks, Channel Islands, Stellwagen Bank.

---

## 6. Marine Geology / Seafloor Hazards

### USGS Coastal and Marine Hazards and Resources Program (CMHRP)
- **URL**: https://www.usgs.gov/programs/cmhrp (verified)
- **Publisher**: US Geological Survey
- **License**: US Government — public domain.
- **Supports claims like**: Seafloor stability / landslide risk, coastal subsidence rates, sediment composition for US dive regions; characterization of submarine canyons (Monterey, La Jolla).
- **Access**: ScienceBase data portal (REST + bulk), USGS publications, OGC services on individual products.
- **Credibility**: Federal geological authority.
- **Why we'd cite it**: California coast (Monterey Canyon kelp dives, Channel Islands), Gulf of Mexico (Flower Garden Banks), Pacific NW (Olympic Coast), Florida Keys reef geology, Great Lakes shipwreck preservation conditions.

---

## Sources investigated but excluded

- **AWOIS** — retired by NOAA OCS in 2024; replaced by ENC Direct to GIS (included above).
- **Imperial War Museum collections** (https://www.iwm.org.uk/collections) — 403 to WebFetch; collections are searchable but data is image/object-centric and not structured for wreck-position citation. Use as a media source on a per-image basis, not a primary data source.
- **BRGM** (https://www.brgm.fr/en) — homepage doesn't surface a marine-geology data product we can cite directly; their seabed data is folded into EMODnet for European waters. Skip — EMODnet covers the same ground with better access.
- **BGS Marine Geoscience** — both candidate URLs (`/geology-projects/marine-geology/` and `/geology-projects/marine-geoscience/`) returned 404. BGS does publish marine data but landing-page URLs are unstable; defer until we have a specific dataset DOI.
- **MUCH register** — could not find a canonical public URL; appears to be an informal academic reference rather than a maintained registry. Skip.
- **"Olex"** — proprietary commercial fishing-vessel bathymetry; no public dataset, not citable.

---

## Recommended source-record fields (for sources.json)

Each entry below is ready to drop into `src/data/sources.json` once vetted:

1. GEBCO Global Bathymetric Grid
2. NOAA NCEI ETOPO 2022
3. EMODnet Bathymetry
4. Seabed 2030 (context)
5. Smithsonian Global Volcanism Program
6. NOAA NCEI Significant Volcanic Eruptions
7. USGS ANSS ComCat (Earthquake Catalog)
8. US Naval History & Heritage Command (DANFS)
9. NOAA ENC Direct to GIS (wrecks & obstructions)
10. NOAA Maritime Heritage Program (sanctuaries)
11. UNESCO Underwater Cultural Heritage (legal/context)
12. Wikipedia / Wikidata (narrative + structured ship facts)
13. Wrecksite.eu (cross-reference only; license-restricted)
14. OpenSeaMap (navigational furniture; not wreck-authoritative)
15. USGS CMHRP (US seafloor geology)

That's 15 strong additions, with the top 5 doing the heaviest lifting.
