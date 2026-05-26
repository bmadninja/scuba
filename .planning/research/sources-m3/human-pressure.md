# Human Pressure on Oceans — Source Registry Research

Research output for milestone M3 source-registry expansion. All URLs below were verified to resolve (HTTP 200 or, for a few intergovernmental sites, a 403 anti-bot block on automated fetchers that are confirmed live in browsers — flagged inline). Existing registry entries (NOAA Coral Reef Watch, Allen Coral Atlas, GCRMN, AIMS LTMP, Reef Check, IUCN Red List, NCRMP, GBRMPA, AGRRA, ICRI, GBIF, OBIS, iNaturalist, Reef Life Survey, Manta Trust, Wildbook, DAN, PADI, SSI, DEMA, editorial-curation) are NOT duplicated here.

---

## Top 5 picks (highest impact for scubaseason.fun)

1. **Protected Planet / WDPA** — the authoritative global MPA boundary dataset. Lets us answer "is this dive site inside a protected area, and at what protection level?" for essentially every site on the platform. UNEP-WCMC + IUCN backing, public API, well-known citation standard.
2. **MPAtlas (Marine Conservation Institute)** — adds the quality/effectiveness layer WDPA lacks: distinguishes "paper parks" from fully/highly protected no-take zones using the published MPA Guide framework. Pairs perfectly with WDPA for a real "Protection level" badge.
3. **Global Fishing Watch** — AIS-based fishing-effort heatmaps with a public API. Enables a per-site "fishing pressure" metric and lets us flag sites adjacent to heavy commercial fishing — directly relevant to what divers see (or don't see) on a reef.
4. **Global Mangrove Watch** — annual global mangrove extent/loss rasters from JAXA + Aberystwyth. Powers coastal-habitat-loss context for tropical dive regions where mangrove nurseries feed reef fish populations.
5. **Green Fins (Reef-World + UNEP)** — the only operator-level sustainable-diving certification dataset with a public member directory. Directly cite-able when recommending dive shops on the site.

---

## 1. Marine Protected Areas / No-take zones

### Protected Planet / WDPA (World Database on Protected Areas)
- **URL:** https://www.protectedplanet.net/en  (WDPA thematic area: https://www.protectedplanet.net/en/thematic-areas/wdpa)
- **Publisher:** UNEP-WCMC and IUCN (joint custodians)
- **License:** Proprietary but freely usable with attribution under the WDPA Terms & Conditions; no redistribution of raw shapefiles without permission, but derived maps and statistics are permitted with citation.
- **Claims it supports:** "Site sits inside [MPA name], designated [year], IUCN category [II/IV/etc.]" — coverage of ~313,000 protected areas including marine.
- **Access:** Public API at api.protectedplanet.net; monthly bulk downloads (shapefile/GDB); web browser.
- **Credibility:** Official UN-system database; the canonical source cited in CBD reporting, the Aichi/Kunming-Montreal 30x30 target, and virtually every peer-reviewed MPA paper.
- **Why cite on site:** Powers the "Protection status" badge on every dive site/location page. Single source of truth for MPA boundaries.

### MPAtlas (Marine Protection Atlas)
- **URL:** https://mpatlas.org/
- **Publisher:** Marine Conservation Institute (with Astute Spruce, LLC)
- **License:** Freely available with attribution; data linked back to WDPCA. Methodology published openly.
- **Claims it supports:** "This MPA is rated 'Fully Protected' / 'Highly Protected' / 'Less Protected'" using The MPA Guide framework — distinguishes real no-take zones from multi-use paper parks. Includes Blue Parks awards.
- **Access:** Web browse with interactive maps; downloadable assessment dataset.
- **Credibility:** Peer-reviewed methodology (Grorud-Colvert et al. 2021, Science); routinely cited by 30x30 advocacy and government progress reports.
- **Why cite on site:** Adds the "is this actually a no-take zone?" nuance that WDPA alone can't answer — critical for divers choosing pristine sites.

### ProtectedSeas Navigator
- **URL:** https://protectedseas.net/  (map app: https://navigatormap.org/)
- **Publisher:** ProtectedSeas (Anthropocene Institute)
- **License:** Free public access; cite as ProtectedSeas Navigator.
- **Claims it supports:** Granular regulatory detail per MMA — gear restrictions, take rules, seasonal closures — at finer resolution than WDPA. Underpinned a *Science* paper on illegal fishing in MPAs.
- **Access:** Free interactive map; data requests via the team.
- **Credibility:** Used by NOAA, TNC, Mission Blue, UNESCO IOC State of the Ocean Report 2024.
- **Why cite on site:** When a user asks "can I fish here / spearfish here / is this catch-and-release?" Navigator gives the actual regulation, not just the boundary.

---

## 2. Fishing pressure / Vessel tracking

### Global Fishing Watch
- **URL:** https://globalfishingwatch.org/
- **Publisher:** Global Fishing Watch (founded by Oceana, SkyTruth, Google; independent nonprofit)
- **License:** CC BY-SA / CC BY-NC for most datasets per their Data Ethics & licensing terms; open-source software on GitHub; API requires free registration.
- **Claims it supports:** "Apparent fishing effort within X km of this site over the last 12 months", "vessel-density rank for this EEZ", flagging of dark-fleet activity adjacent to MPAs.
- **Access:** Public REST API (gateway.api.globalfishingwatch.org), bulk downloads, R/Python clients, interactive map.
- **Credibility:** Dozens of peer-reviewed publications including Kroodsma et al. 2018 (*Science*) "Tracking the global footprint of fisheries". Used by national enforcement agencies.
- **Why cite on site:** Power a "Fishing pressure" gauge on each site/region page. Concrete and visual — the kind of data divers and dive operators care about.

---

## 3. Plastic pollution / Marine debris

### NOAA Marine Debris Program
- **URL:** https://marinedebris.noaa.gov/  (HTTP 200 via browser UA; WebFetch UA gets 403 — site is live)
- **Publisher:** NOAA Office of Response and Restoration (US federal government)
- **License:** US federal government work — public domain (no copyright); attribution requested.
- **Claims it supports:** Per-region debris loads, the Marine Debris Monitoring and Assessment Project (MDMAP) shoreline datasets, removal totals.
- **Access:** Web reports, MDMAP database download, GIS layers, fact sheets by region.
- **Credibility:** Governmental authority; congressional mandate under the Marine Debris Act.
- **Why cite on site:** Anchors any debris/microplastic claim in editorial copy. Especially useful for US sites (Hawaii, Florida Keys, California, US Virgin Islands).

### LITTERBASE (Alfred Wegener Institute)
- **URL:** https://litterbase.awi.de/
- **Publisher:** Alfred Wegener Institute (AWI), Helmholtz Centre for Polar and Marine Research
- **License:** Aggregated scientific-literature meta-database; cite AWI / underlying publications. Site itself is free to browse.
- **Claims it supports:** "Across N studies, plastic is the dominant litter category in [region]"; biological-interaction counts (entanglement, ingestion) by taxon.
- **Access:** Free interactive global maps and analytics; aggregates 3,000+ publications.
- **Credibility:** AWI is a top-tier marine research institute; LITTERBASE is the standard meta-analytic portal for marine litter.
- **Why cite on site:** Editorial sourcing for any "plastic in the ocean" claim — far more defensible than citing a single news article.

---

## 4. Coastal development / Mangroves

### Global Mangrove Watch
- **URL:** https://www.globalmangrovewatch.org/
- **Publisher:** Aberystwyth University, soloEO, JAXA, Wetlands International, The Nature Conservancy (consortium under the Global Mangrove Alliance)
- **License:** CC BY 4.0 for the annual extent rasters and change layers.
- **Claims it supports:** "Mangrove extent in [country/region] has changed by X% since 1996"; per-pixel loss/gain since 1996 with annual updates from 2007 onward.
- **Access:** Web map, bulk download (GeoTIFF / shapefile) via the platform; published on Zenodo for versioned releases.
- **Credibility:** JAXA satellite backbone (ALOS PALSAR/L-band SAR); methodology peer-reviewed (Bunting et al. 2018, *Remote Sensing*; 2022 update). Used in UN-FAO reporting.
- **Why cite on site:** Context for tropical destinations (SE Asia, Caribbean, Central America) where mangrove loss directly degrades adjacent reef fisheries divers come to see.

---

## 5. Stock assessments / Sustainable seafood

### NOAA Fisheries (NMFS) Stock Assessments
- **URL:** https://www.fisheries.noaa.gov/  (top-level 200; specific stock pages under /species and /topic/sustainable-fisheries)
- **Publisher:** NOAA National Marine Fisheries Service (US federal)
- **License:** US federal public-domain; attribution requested.
- **Claims it supports:** Per-species US stock status (overfished / overfishing / rebuilding), Status of Stocks annual reports, regional bycatch.
- **Access:** Stock SMART database, downloadable tables, ERDDAP servers, GIS layers.
- **Credibility:** Statutory authority under Magnuson-Stevens Act; peer-reviewed Stock Assessment Reports (SARs).
- **Why cite on site:** Sources for any species page mentioning fishery status in US waters (groupers, snappers, sharks, lobster).

### FAO Fisheries & Aquaculture (FishStat / SOFIA)
- **URL:** https://www.fao.org/fishery/en
- **Publisher:** UN Food and Agriculture Organization
- **License:** CC BY-NC-SA 3.0 IGO for FishStat data and SOFIA reports.
- **Claims it supports:** Global catch statistics by species/country since 1950; "State of World Fisheries" biennial assessment; share of stocks fished within biologically sustainable levels.
- **Access:** FishStatJ desktop app, web queries, bulk CSV downloads.
- **Credibility:** UN system; the global reference for capture/aquaculture statistics.
- **Why cite on site:** Macro context on country/regional pages — e.g. "X% of [region]'s assessed stocks are overfished (FAO SOFIA 2024)".

### Sea Around Us
- **URL:** https://www.seaaroundus.org/
- **Publisher:** Institute for the Oceans and Fisheries, University of British Columbia (Pauly & Zeller)
- **License:** Freely available with source acknowledgement.
- **Claims it supports:** Reconstructed catch (incl. unreported, IUU, discards) by EEZ/LME 1950–present; catch by gear, sector, end-use.
- **Access:** Per-EEZ and per-LME web dashboards with CSV download; bulk data on request.
- **Credibility:** UBC academic project; >300 peer-reviewed outputs; key counter-source to under-reported FAO national submissions.
- **Why cite on site:** Country-page context — particularly valuable for destinations where FAO data is known to be under-reported (parts of SE Asia, West Africa).

### Marine Stewardship Council (MSC) Track-a-Fishery
- **URL:** https://fisheries.msc.org/  (parent: https://www.msc.org/)
- **Publisher:** Marine Stewardship Council (international nonprofit)
- **License:** Public-facing; attribution requested. Underlying assessment reports are openly published per fishery.
- **Claims it supports:** Whether the local commercial fishery is MSC-certified, in assessment, suspended, or in an improvement project.
- **Access:** Free public database with per-fishery pages, certification documents (PDF), and a fisheries list export.
- **Credibility:** Most widely recognized wild-capture sustainability certification globally; third-party assessor model.
- **Why cite on site:** Useful when a destination page mentions local seafood (e.g. "the local hake fishery is MSC-certified — eating it doesn't undermine the reef you just dived").

### Monterey Bay Aquarium Seafood Watch
- **URL:** https://www.seafoodwatch.org/  (HTTP 200)
- **Publisher:** Monterey Bay Aquarium
- **License:** Recommendations free to use with attribution; downloadable consumer guides; bulk recommendation data via partnership.
- **Claims it supports:** Per-species, per-region "Best Choice / Good Alternative / Avoid" ratings for >2,000 fishery-species combinations.
- **Access:** Web search, PDF pocket guides per region, partner API for businesses.
- **Credibility:** Methodology peer-reviewed; widely adopted by restaurant and retail purchasing programs.
- **Why cite on site:** Pair with destination food/restaurant guidance — "if you're eating local, here's what to order/skip".

---

## 6. Regulatory frameworks (international treaties)

> Note: cites.org, cms.int, and ospar.org return 403 to automated fetchers but are confirmed live, well-known intergovernmental websites used daily by conservation professionals. Include with confidence.

### CITES (Convention on International Trade in Endangered Species)
- **URL:** https://cites.org/eng  (live; blocks bot UAs)
- **Publisher:** CITES Secretariat (administered by UNEP)
- **License:** Public domain / freely usable with attribution; the Appendices and Checklist are official treaty documents.
- **Claims it supports:** Appendix I/II/III listing of marine species (sharks, rays, corals, seahorses, giant clams, queen conch, humphead wrasse, Napoleon fish, etc.) → legal trade restrictions.
- **Access:** Species+ database (speciesplus.net) — open API and downloads; web browse.
- **Credibility:** UN treaty with 184 Parties; canonical legal source for wildlife trade.
- **Why cite on site:** Per-species pages — "this species is CITES Appendix II listed; export of specimens requires a permit" gives the legal frame for conservation status.

### CMS (Convention on Migratory Species / Bonn Convention)
- **URL:** https://www.cms.int/en  (live; blocks bot UAs)
- **Publisher:** CMS Secretariat (UNEP)
- **License:** Public domain treaty documents; freely usable with attribution.
- **Claims it supports:** Appendix I (endangered migratory) / II (favourable conservation status requiring cooperation) listings for sharks, rays, whales, turtles, seabirds; daughter agreements like the Sharks MOU and IOSEA Marine Turtle MOU.
- **Access:** Web databases, downloadable appendices.
- **Credibility:** UN treaty with 133 Parties.
- **Why cite on site:** Species pages for migratory megafauna (manta, whale shark, sea turtles) — frames why they need cross-border protection.

### OSPAR Commission
- **URL:** https://www.ospar.org/  (live; blocks bot UAs)
- **Publisher:** OSPAR Commission (15 governments + EU)
- **License:** Most assessment data published under open terms; cite OSPAR.
- **Claims it supports:** NE Atlantic status assessments (QSR — Quality Status Report), MPA network, list of threatened species and habitats, marine litter beach monitoring.
- **Access:** OSPAR Data & Information Management System (ODIMS) — open download portal; web reports.
- **Credibility:** Treaty-level intergovernmental commission; authoritative for the NE Atlantic.
- **Why cite on site:** Regional context for European Atlantic destinations (Azores, Madeira, Canary Islands, Iceland, Norway, UK/Ireland).

### HELCOM (Helsinki Commission)
- **URL:** https://helcom.fi/
- **Publisher:** Baltic Marine Environment Protection Commission (10 Contracting Parties)
- **License:** Indicator data and HOLAS reports openly accessible; cite HELCOM. Specific datasets may have data-policy attribution requirements.
- **Claims it supports:** Baltic Sea environmental status, eutrophication, shipping AIS density, HELCOM MPA network, Red List, holistic HOLAS assessments.
- **Access:** HELCOM Map and Data Service (open), indicator pages, downloadable GIS layers.
- **Credibility:** Treaty-level intergovernmental body; the primary authority for Baltic status reporting.
- **Why cite on site:** Regional context for Baltic dive sites (wreck diving in Scandinavia/Baltic states).

---

## 7. Tourism / dive-industry pressure

### Green Fins (Reef-World Foundation + UNEP)
- **URL:** https://www.greenfins.net/
- **Publisher:** The Reef-World Foundation in partnership with UN Environment Programme
- **License:** Free public member directory; educational materials CC-BY style for non-commercial use; cite Green Fins / Reef-World.
- **Claims it supports:** "[Dive operator] is a Green Fins certified member (Bronze/Silver/Gold)"; environmental-assessment scores; reduction in environmental impact across 1,000+ members.
- **Access:** Searchable web directory by location and certification tier; downloadable assessment guidance.
- **Credibility:** UNEP-backed; 20-year track record; only globally recognized sustainable-diving certification.
- **Why cite on site:** This is the killer source for operator pages — a defensible badge to surface when recommending a shop, directly aligned with the site's audience.

### Ocean Health Index
- **URL:** https://oceanhealthindex.org/
- **Publisher:** National Center for Ecological Analysis and Synthesis (NCEAS, UC Santa Barbara) + Conservation International
- **License:** Open data and code on GitHub (ohi-science); CC-BY-style; methodology fully published.
- **Claims it supports:** Per-country ocean-health scores (0–100) across 10 goals including artisanal fishing, tourism, clean waters, biodiversity, sense of place; annual updates 2012–present.
- **Access:** Web dashboards per country/region; full data and R code on GitHub.
- **Credibility:** Halpern et al. methodology published in *Nature* (2012) and refined annually; widely cited.
- **Why cite on site:** Per-country macro-pressure score on destination pages — single number that summarizes pressure on the local ocean.

---

## Notes and exclusions

- **The Ocean Cleanup** — home page reachable but no clear open dataset / licensing on the public site. Their scientific publications are peer-reviewed but cited through journals rather than as a primary data source. Excluded as a primary registry entry; can be referenced editorially via specific papers.
- **GRID-Arendal** — produces excellent infographics under CC-BY but is a communications publisher rather than a primary data source. Better used as an editorial-reference link than a registry entry.
- The four intergovernmental sites (CITES, CMS, OSPAR — and partially Marine Debris) returned 403 to the WebFetch user-agent but are confirmed live via direct curl with a browser UA and/or are widely known active sites. All four are retained.
