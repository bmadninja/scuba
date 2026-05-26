# Species Sightings & Marine Biodiversity — Source Research (M3)

Citable data sources for the sighting-evidence layer on scubaseason.fun.
Excludes already-in-`sources.json`: GBIF, OBIS, iNaturalist, Reef Life Survey, IUCN Red List, Manta Trust / IDtheManta, Wildbook (Sharkbook, Whale Shark, Manta Matcher).

All URLs below were verified resolving (HTTP 200 or successful redirect) during research on 2026-05-25. A few URLs that returned 403/timeouts are also included where the source itself is highly credible and well-known to publish to GBIF/OBIS — flagged with a note.

---

## Top 5 picks

Ranked by impact for our sighting-evidence layer (credibility, openness, individual-animal or diver-relevant data, ease of citation):

1. **OBIS-SEAMAP** (Duke University) — gold-standard aggregator for marine megafauna (mammals, seabirds, turtles, sharks, rays). Feeds GBIF/OBIS, CC-licensed contributions, registration-gated bulk download. Single best citation target when claiming "cetaceans/turtles/sharks observed at this site".
2. **Happywhale** — premier crowd-sourced cetacean photo-ID database with proven individual-return-rate data and a GBIF dataset. Directly supports "individual humpback X re-sighted at site Y" claims.
3. **WoRMS (World Register of Marine Species)** — authoritative taxonomic backbone for every marine name we display. Underpins every other source. Webservices API, free, CC BY 4.0.
4. **REEF Volunteer Fish Survey Project** — largest diver-driven fish-sighting dataset (323k+ surveys). Diver-confirmed species lists per site — exactly our audience.
5. **Atlas of Living Australia (ALA)** — CC BY 3.0 AU, 101M+ records, R/Python clients, GBIF Australian node. Best regional backbone for our Australian dive sites.

---

## 1. Photo-ID databases for individual animals

### Happywhale
- **URL**: https://happywhale.com (TLS cert mismatch on www-subdomain; apex resolves; data also mirrored to GBIF)
- **Publisher**: Happywhale (citizen-science nonprofit), data partners include NOAA, AAD, and multiple research groups
- **License**: Contributor-CC (varies); GBIF-published datasets generally CC BY / CC BY-NC
- **What claims it supports**: Individual cetacean re-sightings ("Humpback HW-MN1234 photographed at Silver Bank 2019 and Iceland 2021"), migration corridors, regional encounter rates, individual return frequencies
- **Access**: Web browse, GBIF download for derived occurrences, partner-API for bulk
- **Why credible**: Powers peer-reviewed cetacean research; integrated with the Antarctic Humpback Whale Catalogue and other long-running catalogues
- **Why we'd cite it**: Strongest support for "this individual has been seen here" claims on whale-watching/snorkel dive sites (Silver Bank, Tonga, Iceland, Hervey Bay, Maui)

### OBIS-SEAMAP (Spatial Ecological Analysis of Megavertebrate Populations)
- **URL**: https://seamap.env.duke.edu/
- **Publisher**: Duke University Marine Geospatial Ecology Lab; thematic node of OBIS; publishes to GBIF
- **License**: Contributor-CC (most datasets CC BY or CC BY-NC); registration + 20-word use statement required for bulk download
- **What claims it supports**: Sighting density of marine mammals / seabirds / sea turtles / sharks / rays at lat-lon resolution
- **Access**: Web map, dataset metadata browse, gated bulk download, GBIF/OBIS mirror
- **Why credible**: Self-styled "World Data Center" for marine megavertebrates; peer-reviewed publication backing; >700 datasets
- **Why we'd cite it**: Best single source for "expected megafauna at this location" claims when iNaturalist/GBIF is too sparse

### SEATURTLE.ORG (incl. STAT, Cooperative Marine Turtle Tagging Program)
- **URL**: https://www.seaturtle.org/ (intermittent ECONNREFUSED during research — site is long-standing and indexed; flagging as occasionally flaky)
- **Publisher**: SEATURTLE.ORG Inc.; collaborations with NOAA, USGS, FWS
- **License**: Tag data access varies (often researcher-gated); some satellite tracks published to GBIF/OBIS-SEAMAP
- **What claims it supports**: Turtle tag returns, nesting beach lists, satellite tracks of named turtles
- **Access**: Website browse, STAT (Satellite Tracking and Analysis Tool) maps, request-based bulk
- **Why credible**: Hosts the Marine Turtle Newsletter (peer-reviewed grey literature, 1976–present); the central hub for sea turtle researchers
- **Why we'd cite it**: Anchor for sea-turtle nesting / migration claims on tropical dive sites (Tortuguero, Heron Island, Sipadan, Mnemba)
- *Note: verify URL at runtime — fallback to GBIF-mirrored STAT datasets if intermittent*

### Scripps Whale Acoustics Lab (SWAL)
- **URL**: https://cetus.ucsd.edu/ (apex; www variant fails)
- **Publisher**: Scripps Institution of Oceanography (UC San Diego)
- **License**: Research-share; recordings often CC BY-NC; specific dataset DOIs at UCSD library
- **What claims it supports**: Acoustic presence of cetaceans (blue, fin, beaked, sperm whales) at named ocean basins / seamounts
- **Access**: Researcher request; published datasets via UCSD Library Digital Collections
- **Why credible**: Peer-reviewed publications; long-running NOAA-funded HARP hydrophone arrays
- **Why we'd cite it**: When a dive region (Channel Islands, Southern California Bight) has acoustic-but-not-visual confirmation of whales

---

## 2. Diver-driven citizen science platforms

### REEF Volunteer Fish Survey Project
- **URL**: https://www.reef.org/
- **Publisher**: Reef Environmental Education Foundation (Key Largo, FL), US 501(c)(3)
- **License**: Public database accessible via web reports; data-use terms via direct request — generally permissive for non-commercial citation
- **What claims it supports**: Diver-confirmed fish presence/sighting frequency per site (323,477 surveys as of 2026), grouped by REEF geographic zones
- **Access**: Browse "Explore Database & Reports" interface; bulk data on request
- **Why credible**: Operating since 1993; partnerships with NOAA, FKNMS, national park systems; methodology in peer-reviewed literature
- **Why we'd cite it**: Diver-confirmed data — exactly our audience. Best citation for "fish you can expect to see here, ranked by sighting frequency" on Caribbean/Pacific/Hawaii sites

### Reef Check
- **URL**: https://reefcheck.org/ (data portal: https://data.reefcheck.org)
- **Publisher**: Reef Check Foundation; partners include Aqualink (data hosting), UCLA
- **License**: Aqualink mirror is "completely FREE and open to the public"; original Reef Check dataset citation terms apply
- **What claims it supports**: Diver-collected coral cover, indicator-species (grouper, lobster, butterflyfish, urchin) presence at 17,700+ surveyed reefs in 102 countries
- **Access**: Global Reef Tracker web interface; Aqualink API for the mirror; CSV downloads
- **Why credible**: 25+ year dataset; NOAA / UNEP recognition; methodology peer-reviewed
- **Why we'd cite it**: Reef-health context ("at last Reef Check survey, X% live coral, indicator species present"), supports reef-condition claims per site

### CoralWatch
- **URL**: https://coralwatch.org/
- **Publisher**: University of Queensland, Centre for Marine Science
- **License**: Data submitted via BioCollect / ALA — inherits ALA's CC BY 3.0 AU
- **What claims it supports**: Coral bleaching state by site/date; diver-reported coral health colours
- **Access**: Interactive global map; data via BioCollect ALA portal
- **Why credible**: UQ-academic, 78+ countries, peer-reviewed methodology
- **Why we'd cite it**: Bleaching status claims for specific reefs — useful for "best time to dive" / honest reef-health framing

---

## 3. Acoustic / eDNA / tracking networks

### Ocean Tracking Network (OTN)
- **URL**: https://oceantrackingnetwork.org/
- **Publisher**: Dalhousie University (Halifax, NS), funded by Canada Foundation for Innovation
- **License**: Member data-sharing policy; aggregate detections often published to ERDDAP / OBIS under CC BY
- **What claims it supports**: Acoustically-tagged shark / tuna / salmon / turtle detections at known dive regions (e.g. tagged white sharks pinged near Guadalupe receivers)
- **Access**: members.oceantrack.org portal (gated); aggregate ERDDAP endpoints; OBIS-published subsets
- **Why credible**: 300+ species, 800+ projects, 2,800+ receivers globally; Nature / Science peer-reviewed papers
- **Why we'd cite it**: Strong evidence layer for "tagged shark X was detected at receiver near this dive site"

### Movebank
- **URL**: https://www.movebank.org/
- **Publisher**: Max Planck Institute of Animal Behavior, with NC Museum of Natural Sciences, Senckenberg, U Konstanz
- **License**: Per-study; many public studies CC0 / CC BY via Movebank Data Repository (DOIs issued)
- **What claims it supports**: GPS / Argos tracks of tagged marine animals (sharks, turtles, albatrosses, seals)
- **Access**: Web map, REST API, R package `move2`, study-level DOIs
- **Why credible**: 10.6B+ locations, 9,915 studies, 1,663 taxa; standard tool in movement ecology
- **Why we'd cite it**: "Satellite-tagged loggerhead passed within X km of this site on date" — direct DOI citation possible

### IMOS / AODN (Australia)
- **URL**: https://www.imos.org.au/ and https://portal.aodn.org.au/
- **Publisher**: Integrated Marine Observing System, led by University of Tasmania, NCRIS-funded
- **License**: Open / free access; data-acknowledgement statement required (CC BY-equivalent)
- **What claims it supports**: Acoustic shark tagging detections (IMOS Animal Tracking Facility, formerly AATAMS), reef temperature loggers, BRUVS fish surveys
- **Access**: AODN portal (search/download), THREDDS, ERDDAP, web services
- **Why credible**: Government-funded national observing system; FAIR-compliant; underpins peer-reviewed Aus marine research
- **Why we'd cite it**: Best evidence layer for Australian dive sites (GBR, Ningaloo, Rottnest, Solitary Is)

---

## 4. Marine megafauna observation databases

(OBIS-SEAMAP listed above also fits this category.)

### eBird (for seabirds)
- **URL**: https://ebird.org/ (data download: https://ebird.org/data/download; science page: https://science.ebird.org/en/use-ebird-data)
- **Publisher**: Cornell Lab of Ornithology
- **License**: Open-access with mandatory citation; raw EBD download requires free account / data request
- **What claims it supports**: Seabird sightings at named locations (frigatebirds, boobies, albatrosses, petrels, terns) — including pelagic boat-based eBird checklists from dive day-trips
- **Access**: EBD bulk download, eBird API, `auk` R package; Status & Trends rasters for >2000 species
- **Why credible**: Largest biodiversity citizen-science dataset in existence (>100M checklists), peer-reviewed Status & Trends models, used by IUCN/BirdLife
- **Why we'd cite it**: Top-deck seabird claims for liveaboard / island dive sites (Galápagos, Cocos, Lord Howe, Midway)

### EMODnet Biology
- **URL**: https://emodnet.ec.europa.eu/en/biology
- **Publisher**: European Commission DG MARE; aggregates EurOBIS / VLIZ
- **License**: Open and free; Darwin Core, INSPIRE-compliant, FAIR; per-dataset CC-license metadata
- **What claims it supports**: Species temporal/spatial distributions in European seas (Mediterranean, North Atlantic, Baltic, Black Sea)
- **Access**: Map viewer, WFS/WCS/WMS, R packages (`emodnet.wfs`, `EMODnetWCS`), bulk products
- **Why credible**: EU-government, 1,500+ datasets, INSPIRE-compliant, peer-reviewed products
- **Why we'd cite it**: European dive sites (Med, Norwegian fjords, Azores, UK) — preferred regional alternative to GBIF for finer-grained European data

### NOAA Coral Reef Watch
- **URL**: https://coralreefwatch.noaa.gov/
- **Publisher**: NOAA Satellite and Information Service
- **License**: US federal public-domain (not strictly a sighting source but environmental overlay)
- **What claims it supports**: Bleaching Alert Level, Degree Heating Weeks, SST anomalies at 5km resolution for any reef
- **Access**: NetCDF / GeoTIFF downloads, OPeNDAP, ERDDAP, Google Earth KML, Virtual Stations
- **Why credible**: NOAA operational program since 2000; standard reference in coral bleaching literature
- **Why we'd cite it**: "Current bleaching alert level at this reef" — concrete environmental-context evidence for site pages

---

## 5. Taxonomic backbones

### WoRMS — World Register of Marine Species
- **URL**: https://www.marinespecies.org/
- **Publisher**: Flanders Marine Institute (VLIZ); LifeWatch Belgium
- **License**: CC BY 4.0 (per WoRMS citation policy)
- **What claims it supports**: Authoritative accepted name, synonyms, taxonomic hierarchy, AphiaID, type locality, depth/habitat range for every marine species we display
- **Access**: Webservices (REST/SOAP), match-taxa tools, taxon tree browser, bulk DwC downloads
- **Why credible**: 250,000+ accepted species curated by 250+ taxonomic experts; underpins OBIS, GBIF, EMODnet, FishBase taxonomic alignment
- **Why we'd cite it**: Every species name on the site should be reconciled to a WoRMS AphiaID — the single most important taxonomic citation

### Catalogue of Life (COL)
- **URL**: https://www.catalogueoflife.org/
- **Publisher**: COL Partnership (Species 2000 + ITIS); current host Naturalis Biodiversity Center
- **License**: CC BY 4.0
- **What claims it supports**: Cross-checklist taxonomy across freshwater and marine groups; useful when WoRMS scope doesn't cover (freshwater dive species, semi-aquatic reptiles)
- **Access**: ChecklistBank, COL API, DOI-versioned annual releases
- **Why credible**: Used by GBIF as taxonomic backbone; partner of IUCN, BHL, EOL
- **Why we'd cite it**: Fallback taxonomic citation when WoRMS doesn't cover the taxon

### FishBase
- **URL**: https://fishbase.de/ (verified resolves; mirrors fishbase.org / .se / .us return 403 to WebFetch but resolve in browser)
- **Publisher**: FishBase Consortium; hosted at GEOMAR Helmholtz Centre for Ocean Research Kiel; founders include WorldFish, FIN
- **License**: CC BY-NC 4.0 (textual content; photos retain individual creator copyright)
- **What claims it supports**: Per-fish-species traits — max size, depth range, diet, habitat, IUCN status, common names in 200+ languages, geographic distribution (FAO areas)
- **Access**: Web browse, `rfishbase` R package, SQL dump (research request), GBIF-mirrored distribution data
- **Why credible**: 36,500 species, 2,570 collaborators, peer-reviewed methodology, founding partner of Catalogue of Life
- **Why we'd cite it**: Per-species fact sheets ("max length", "depth range", "diet") on encounter pages — canonical source

### SeaLifeBase
- **URL**: https://www.sealifebase.ca/ (403 to WebFetch but well-established sister of FishBase)
- **Publisher**: FishBase Information and Research Group (FIN), Quantitative Aquatics; partners with UBC Sea Around Us
- **License**: CC BY-NC 3.0
- **What claims it supports**: Same trait coverage as FishBase but for non-fish marine life (invertebrates, mammals, reptiles, algae)
- **Access**: Web browse, `rfishbase` R package supports SeaLifeBase tables, bulk request
- **Why credible**: 75,000+ non-fish marine species; sister project to FishBase with same governance
- **Why we'd cite it**: Octopus / nudibranch / coral / cetacean trait facts on encounter pages

---

## 6. Regional / national biodiversity platforms

### Atlas of Living Australia (ALA)
- **URL**: https://www.ala.org.au/
- **Publisher**: CSIRO; Australian GBIF node; NCRIS-funded
- **License**: CC BY 3.0 Australia
- **What claims it supports**: Any Australian occurrence record (marine + terrestrial); 101M+ records, 9,757 datasets including ALA-hosted BRUVS, Reef Life Survey, AIMS
- **Access**: ALA API (REST), `galah` R/Python packages, BioCollect, bulk download
- **Why credible**: Government infrastructure, GBIF Australian node, hosts most major Aus marine citizen-science datasets
- **Why we'd cite it**: Best primary citation for any Australian dive site (GBR, Ningaloo, Tasmania, Sydney). Often supersedes GBIF query for AU data.

### AIMS (Australian Institute of Marine Science) data centre
- **URL**: https://www.aims.gov.au/ (apex; some paths timeout but apex resolves)
- **Publisher**: AIMS (Australian Government statutory authority)
- **License**: CC BY 4.0 for most products (e.g. Long-Term Monitoring Program coral cover)
- **What claims it supports**: GBR-wide coral cover trends, COTS outbreak status, temperature loggers, fish surveys at specific reefs
- **Access**: AIMS Metadata Catalogue, eAtlas, ERDDAP endpoints
- **Why credible**: Federal research agency; flagship long-term monitoring program (1985–present); peer-reviewed annual reports
- **Why we'd cite it**: Coral cover trend / reef-health claims on GBR-area dive sites

### Encyclopedia of Life (EOL)
- **URL**: https://eol.org/ (403 to WebFetch, well-established)
- **Publisher**: EOL Partnership; current host Smithsonian Institution
- **License**: CC0 / CC BY / CC BY-SA depending on content provider; aggregator with per-record license metadata
- **What claims it supports**: Species profiles aggregating descriptions, images, traits across hundreds of partner sources
- **Access**: REST API, TraitBank bulk downloads
- **Why credible**: Smithsonian-hosted, founded by E.O. Wilson; >1.8M taxa pages
- **Why we'd cite it**: Trait facts (TraitBank) and natural-history descriptions where FishBase/SeaLifeBase don't cover

---

## 7. Coral / invertebrate specific observation networks

### CoralNet
- **URL**: https://coralnet.ucsd.edu/
- **Publisher**: UC San Diego (Kriegman Lab) + Scripps; open-source on GitHub
- **License**: Per-source (public/private flag); platform code MIT-style
- **What claims it supports**: Point-annotated coral cover from underwater images at >7,000 sources globally (5.4M+ images, 290M annotations)
- **Access**: Web browse public sources; export per-source CSV; API for tool builders
- **Why credible**: Peer-reviewed (Beijbom et al. 2015); standard tool for coral image annotation; partnerships with NOAA NCRMP
- **Why we'd cite it**: Coral cover / community-composition claims for sites with public CoralNet sources

### CATAMI Classification Scheme
- **URL**: https://catami.org/
- **Publisher**: IMOS / NESP Marine Biodiversity Hub
- **License**: CC BY 4.0 (Althaus et al. 2015 PLoS ONE methodology paper open access)
- **What claims it supports**: Standardised classification of seabed biota / habitat from imagery — controlled vocabulary when we cite imagery-derived community data
- **Access**: PDF guide + Excel code file + GitHub
- **Why credible**: PLoS ONE peer-reviewed; adopted by Australian government for benthic imagery
- **Why we'd cite it**: Methodological citation when displaying habitat composition for AU sites — supports vocabulary consistency

---

## Dropped / not recommended

- **Eye on the Reef** (eyeonthereef.com.au) — domain is squatted by an unrelated security-services company; the real GBRMPA program endpoint (eyeonthereef.gbrmpa.gov.au) was unreachable during testing and the data is partner-gated.
- **eShark** (eshark.fr / .org) — both URLs ECONNREFUSED; project appears defunct.
- **OceanBiogeographic.org** — ECONNREFUSED; not the canonical OBIS endpoint.
- **FishWatch.gov** — redirects to NOAA Fisheries seafood page; no longer a species-data source.
- **Diveboard** — timeout / unclear current status; not a research-grade dataset.
- **Sharkbase** — ECONNREFUSED; data not openly downloadable.
- **DOSITS** — educational resource, not a sightings/data source.
- **Ocean InfoHub / Ocean Decade / EMODnet apex (non-biology)** — meta-portals, not citation targets in themselves; cite the underlying datasets they point to instead.

---

## Citation hygiene notes

- For every record we surface from these sources, link to either (a) the specific dataset DOI (GBIF / Movebank / Catalogue of Life all issue these) or (b) the source's recommended citation string with last-accessed date.
- Reconcile every species name to a **WoRMS AphiaID** at ingest — this lets us cross-link to all other sources cleanly.
- Prefer CC BY (FishBase, ALA, COL, WoRMS, NOAA CRW, Movebank) over CC BY-NC (some FishBase content, SeaLifeBase) over registration-gated (OBIS-SEAMAP, eBird EBD); honour NC restrictions if the site goes commercial.
- Some long-running marine sites (seaturtle.org, sealifebase.ca, fishbase.us mirrors, eol.org) returned 403/timeouts during WebFetch testing — they are real and active, but our ingest layer should retry/timeout-tolerate them and ideally cache snapshots.
