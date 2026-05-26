# Water Quality & Pollution Sources — Research

Citable data sources for ocean pollution, water quality, nutrient runoff, microplastics, harmful algal blooms (HABs), oil spills, sewage, contaminants, acidification, and runoff. Verified for `scubaseason.fun` "is this reef being poisoned?" framing.

All URLs verified 2026-05-26 via WebFetch. Dead links and advocacy-only sources without primary data were dropped (notably: NOAA Marine Debris Program homepage 403; Surfrider Blue Water Task Force 403; gpml.openearth.org TLS error; theoceancleanup.com lacks open datasets; Ocean Conservancy ICC has no public download endpoint).

---

## Top 5 Picks (Highest Impact)

1. **NCEI Marine Microplastics Database** — only global, location-resolved microplastics dataset with proper download (CSV/JSON/GeoJSON). Direct fit for "microplastic load near this reef" callouts.
2. **NOAA IncidentNews + ERMA** — authoritative oil/chemical spill incident database with interactive maps, raw export, 30+ years of history. Critical for "active spill response zone" panels.
3. **EMODnet Chemistry** — public-domain, gridded, multi-parameter (eutrophication, contaminants, marine litter, acidification) for European seas. Single best Europe-wide pollution layer.
4. **NOAA HAB Operational Forecast System (NCCOS)** — near-real-time HAB bulletins and satellite imagery for Gulf/Florida/Maine/Lake Erie. Direct "active red tide" warnings on US dive site pages.
5. **HAEDAT (IOC-UNESCO / ICES / PICES)** — global historical harmful algal event database, 14,000+ events across 106 countries since 1985. The only worldwide HAB history layer with primary data.

---

## 1. Plastic and Marine Debris

### NCEI Marine Microplastics Database
- **URL:** https://www.ncei.noaa.gov/products/microplastics
- **Map portal:** https://experience.arcgis.com/experience/b296879cc1984fda833a8acc93e31476
- **Publisher:** NOAA National Centers for Environmental Information (NCEI)
- **License:** US government work; effectively public domain. Data attribution requested. Note disclaimer: methods differ across studies, so values are not always directly comparable.
- **Claims supported:** "Microplastic concentrations measured nearby"; "this region has been sampled X times for microplastics"; "no microplastic sampling near this reef".
- **Access:** Interactive GIS map portal + bulk download (CSV, JSON, GeoJSON); filter by geographic region and time period.
- **Credibility:** US federal agency; aggregates peer-reviewed published studies with provenance.
- **Why we'd cite it:** Concrete numerical pollution callout on location pages — the only global, georeferenced microplastic resource we can both query and link.

### LITTERBASE (AWI)
- **URL:** https://litterbase.awi.de/
- **Publisher:** Alfred Wegener Institute (AWI) / Helmholtz
- **License:** Not explicitly stated on landing; synthesizes published literature with attribution. Maps are clearly free to view; treat as browse-only without contacting AWI.
- **Claims supported:** "Documented litter density in this ocean basin"; "species interactions with marine debris observed regionally".
- **Access:** Interactive map portal (browse-only).
- **Credibility:** German federal polar/marine research institute; synthesis of 3,000+ peer-reviewed studies.
- **Why we'd cite it:** Region-scale debris context for "current threat" panels — links to credible synthesis when we don't have a point measurement.

### Global Plastics Hub (UNEP GPML)
- **URL:** https://globalplasticshub.org/ (canonical; redirected from https://digital.gpmarinelitter.org/)
- **Publisher:** UN Environment Programme — Global Partnership on Marine Litter
- **License:** UN open data, attribution required.
- **Claims supported:** "Country-level plastic leakage indicators"; "national plastic action plans".
- **Access:** Interactive data hub with 70+ plastic lifecycle indicators; knowledge library (2800+ items).
- **Credibility:** UN intergovernmental platform.
- **Why we'd cite it:** Country-level pollution policy context — useful for destination-page framing ("this country has/lacks a national action plan").

---

## 2. Microplastics

(Covered above — NCEI Marine Microplastics is the primary, peer-reviewed-data-backed global dataset. LITTERBASE provides the published-literature synthesis layer. No additional standalone microplastic atlas with both open license and global coverage was identified.)

---

## 3. Harmful Algal Blooms (HABs)

### NOAA HAB Operational Forecast System (NCCOS)
- **URL:** https://coastalscience.noaa.gov/science-areas/habs/hab-forecasts/
- **Top-level:** https://oceanservice.noaa.gov/hazards/hab/
- **Publisher:** NOAA National Centers for Coastal Ocean Science
- **License:** US government work; public domain.
- **Claims supported:** "Active red tide forecast"; "seasonal HAB severity outlook"; "satellite-detected bloom this week".
- **Coverage:** Florida, Texas, Gulf of Maine, Lake Erie directly; Pacific Northwest (NANOOS) and California (SCCOOS) via partners.
- **Access:** Near-real-time bulletins (weekly/twice-weekly), satellite imagery, condition reports.
- **Credibility:** US federal operational forecast service.
- **Why we'd cite it:** "Current threat" banner on US Gulf/Florida/New England dive site pages during active blooms.

### HAEDAT — Harmful Algae Event Database
- **URL:** https://haedat.iode.org/
- **Publisher:** IOC-UNESCO with ICES (North Atlantic) and PICES (North Pacific)
- **License:** IOC open data policy; attribution required.
- **Claims supported:** "Documented HAB events at this location since 1985"; "history of shellfish toxicity / fish kills here".
- **Coverage:** 14,000+ events across 106 countries, 1770–present (with regional density variance).
- **Access:** Searchable web database.
- **Credibility:** UN/IOC + ICES + PICES intergovernmental scientific bodies.
- **Why we'd cite it:** Worldwide HAB history — the only global counterpart to NOAA's US-only forecasts. Use for "this site has X recorded HAB events" callouts outside the US.

---

## 4. Nutrient Pollution / Coastal Eutrophication

### EMODnet Chemistry
- **URL:** https://emodnet.ec.europa.eu/en/chemistry
- **Publisher:** European Commission (EMODnet), implemented through SeaDataNet
- **License:** Public domain (aggregated products); attribution required to data providers and EMODnet.
- **Claims supported:** "Elevated dissolved inorganic nitrogen"; "chlorophyll-a anomaly indicates eutrophication"; "documented contaminant concentrations in water/sediment/biota near this reef".
- **Coverage:** All European seas (Baltic, North Sea, Atlantic, Mediterranean, Black Sea).
- **Access:** ERDDAP downloads, CDI Discovery Service, webODV Explorer, products catalogue, map viewer.
- **Credibility:** EU intergovernmental marine data infrastructure.
- **Why we'd cite it:** Primary European nutrient/contaminant/litter layer — single integrated stop for European dive sites.

### EPA National Coastal Condition Assessment (NCCA)
- **URL:** https://www.epa.gov/national-aquatic-resource-surveys/ncca
- **Dashboard:** https://coastalcondition.epa.gov/dashboard
- **Publisher:** US Environmental Protection Agency
- **License:** Public domain.
- **Claims supported:** "EPA rates this estuary as poor/fair/good for nutrient/sediment/contaminant condition".
- **Coverage:** US estuaries and Great Lakes nearshore; assessment years through 2020.
- **Access:** Interactive dashboard; raw dataset downloads via NARS data portal.
- **Credibility:** US federal statistical survey.
- **Why we'd cite it:** Authoritative nutrient/contaminant rating for US coastal dive regions — directly answers "is this water polluted?"

### Water Quality Portal (USGS / EPA / 400+ partners)
- **URL:** https://www.waterqualitydata.us/
- **Publisher:** USGS, EPA, NWQMC cooperative
- **License:** Public domain.
- **Claims supported:** Nutrient levels, bacteria counts, physical/chemical samples at specific monitoring sites.
- **Access:** Web UI + REST API + CSV/Excel downloads; filter by location/date.
- **Credibility:** Joint federal data infrastructure.
- **Why we'd cite it:** Site-specific water-quality measurements for US-adjacent dive locations (Florida Keys, California, Hawaii, USVI, Puerto Rico).

---

## 5. Oil Spills

### NOAA IncidentNews
- **URL:** https://incidentnews.noaa.gov/
- **Publisher:** NOAA Office of Response and Restoration
- **License:** US government work; public domain. Site provides raw data export.
- **Claims supported:** "Documented spill incident here on date X"; "this region has had N oil/chemical incidents since 1985".
- **Access:** Browse by date/location, interactive map, full-text search, Atom/RSS, raw export.
- **Credibility:** US federal agency providing scientific support to 150+ spills annually.
- **Why we'd cite it:** "Recent spill history" callout on dive locations near shipping lanes/ports.

### ERMA — Environmental Response Management Application
- **URL:** https://erma.noaa.gov/
- **Publisher:** NOAA Office of Response and Restoration
- **License:** Public domain (data layers); some layers restricted during active response.
- **Claims supported:** "Active spill response zone"; "vulnerable coastal resources here".
- **Access:** Public interactive mapping tool, regional instances (Gulf, Atlantic, Caribbean, Arctic, Pacific).
- **Credibility:** US federal operational response platform.
- **Why we'd cite it:** Map embed / linkout for active response events and vulnerability layers.

### ITOPF — Oil Tanker Spill Statistics
- **URL:** https://www.itopf.org/
- **Publisher:** International Tanker Owners Pollution Federation
- **License:** Proprietary but freely viewable; statistics publicly available with attribution.
- **Claims supported:** "Annual global tanker spill statistics"; long-term spill trend context.
- **Access:** Annual statistical reports (PDF) and technical information papers.
- **Credibility:** Long-established industry-funded but operationally independent body widely cited by IMO and academic literature.
- **Why we'd cite it:** Macro context paragraph ("global tanker spills have declined since 1970s") rather than per-location callouts.

### EMSA CleanSeaNet
- **URL:** https://emsa.europa.eu/csn-menu.html
- **Publisher:** European Maritime Safety Agency
- **License:** Detection alerts delivered to member states; aggregate statistics public. Per-detection imagery is gated.
- **Claims supported:** "Satellite-detected possible oil discharge events in European waters".
- **Access:** Statistics and overview publicly viewable; raw alerts restricted to participating states.
- **Credibility:** EU agency using Sentinel-1 SAR.
- **Why we'd cite it:** European waters spill-monitoring credibility reference (linkout, not embed). Lower priority since access is gated.

### Cedre
- **URL:** https://www.cedre.fr/en/
- **Publisher:** Centre de documentation, de recherche et d'expérimentations sur les pollutions accidentelles des eaux (France)
- **License:** Publications freely available with attribution.
- **Claims supported:** Spill response technical context; case studies.
- **Access:** Publication library, technical guides.
- **Credibility:** French national reference center for accidental water pollution.
- **Why we'd cite it:** European/French-coast spill case studies and technical citations — secondary reference, not primary data.

---

## 6. Sewage / Coastal Water Quality

### EPA BEACON 2.0
- **URL:** https://beacon.epa.gov/ords/beacon2/r/beacon_apex/beacon2/
- **Publisher:** US Environmental Protection Agency
- **License:** Public domain.
- **Claims supported:** "Beach advisory / closure history at this US coastal site".
- **Access:** Public web database of state-reported advisories and closures.
- **Credibility:** US federal aggregator of state monitoring.
- **Why we'd cite it:** Direct "beach closure rate" callout on US shore-dive locations.

(EEA bathing-water dashboard URLs returned 404 in verification — EEA reorganized this resource recently. EMODnet Human Activities covers European bathing-water as one of its layers and is reachable via the EMODnet entry already listed. Surfrider Blue Water Task Force returned 403 and is dropped as unreliable for automated linking.)

---

## 7. Heavy Metals / Contaminants

### NOAA National Status & Trends (Mussel Watch)
- **URL:** https://products.coastalscience.noaa.gov/nsandt_data/data.aspx
- **Publisher:** NOAA National Centers for Coastal Ocean Science
- **License:** Public domain.
- **Claims supported:** "Documented contaminant levels (metals, PAHs, PCBs, pesticides) in mussels/oysters at this US coastal site"; long-term contaminant trends.
- **Access:** Downloads by geographic location and by study; data categories include biological, chemical, physical, toxicological.
- **Credibility:** Longest-running US coastal contaminant monitoring program (1986–present).
- **Why we'd cite it:** Authoritative contaminant history on US dive locations (Florida Keys, California, Pacific Northwest, Hawaii, Gulf).

### Biogeochemical-Argo
- **URL:** https://biogeochemical-argo.org/
- **Interactive map:** https://maps.biogeochemical-argo.com/
- **Publisher:** International BGC-Argo program (multi-agency)
- **License:** Free, open, no restrictions (Argo data policy).
- **Claims supported:** "Open-ocean oxygen, nitrate, pH, chlorophyll profiles measured by autonomous floats near here".
- **Access:** GDAC bulk download (NetCDF), interactive map, data portals.
- **Credibility:** Internationally coordinated peer-reviewed observational network.
- **Why we'd cite it:** Open-ocean dive sites (atolls, seamounts) far from coastal observatories — only realistic biogeochemistry layer for those locations.

---

## 8. Acidification

### NOAA Ocean Acidification Program (OAP)
- **URL:** https://oceanacidification.noaa.gov/
- **Publisher:** NOAA OAP
- **License:** Public domain.
- **Claims supported:** "Forecast / current ocean acidification chemistry"; "regional adaptation status"; fisheries OA risk indicators.
- **Access:** Resources hub, project search, regional dashboards (e.g., Chesapeake Bay), forecast products.
- **Credibility:** US federal program.
- **Why we'd cite it:** Regional OA context, especially for US Pacific Northwest, Alaska, Gulf, and Atlantic sites.

### GOA-ON — Global Ocean Acidification Observing Network
- **URL:** https://www.goa-on.org/
- **Data portal:** https://portal.goa-on.org/
- **Publisher:** IOC-UNESCO, IAEA, IOCCP, partners
- **License:** Open with attribution.
- **Claims supported:** "Global OA observing assets near this location"; "SDG 14.3.1 indicator status here".
- **Access:** Data Explorer with worldwide contoured layers; SDG 14.3.1 tool; filtered inventory; OA-ICC biological response portal.
- **Credibility:** International intergovernmental observing network.
- **Why we'd cite it:** Non-US acidification context — paired with NOAA OAP gives global coverage.

---

## 9. Sediment / Runoff

### Reef 2050 Water Quality Report Card (Queensland / GBRMPA)
- **Note:** Direct landing pages returned 403 in verification (Queensland gov enforces UA blocking). Resource is well-documented and operational; use the GBRMPA umbrella URL (already in `sources.json`) or direct citation to the annual report card PDF.
- **Most stable entry:** https://www.reefplan.qld.gov.au/ (homepage; the `/tracking-progress` and `/measuring-success` sub-paths return 403 to non-browser clients but are reachable interactively).
- **Publisher:** Queensland Government + Australian Government
- **License:** Creative Commons Attribution (Queensland gov default).
- **Claims supported:** "Catchment runoff loads (sediment, nitrogen, pesticides) to this GBR reef section"; "report card grade for this catchment".
- **Access:** Annual report card PDFs + supporting datasets via Queensland Government open data portal.
- **Credibility:** Joint Australian/Queensland government program with peer-reviewed scientific consensus reports.
- **Why we'd cite it:** Essential for any GBR dive site page — the only authoritative runoff layer for Australia's reef.
- **Caveat for our crawler:** Use the PDF report-card URLs and the Queensland open-data CKAN endpoints rather than the 403-prone HTML pages.

(EMODnet Chemistry, already covered above, is the European-side complement for sediment/runoff parameters.)

---

## Sources Considered but Dropped

| Source | Reason |
|---|---|
| NOAA Marine Debris Program (marinedebris.noaa.gov) | Persistent 403 to automated fetchers; content reachable only interactively. NCEI Microplastics covers the data need. |
| Surfrider Blue Water Task Force | 403 to automated fetchers; advocacy-focused, no clean open-data download. |
| The Ocean Cleanup | No public open-dataset/API; impact dashboard is presentation-only. |
| Ocean Conservancy ICC | Annual PDFs only; no structured open data endpoint. |
| EEA bathing-water dashboards | All tested URLs 404; EEA reorganized this resource. Revisit after EEA stabilizes. |
| GESAMP, IOC-UNESCO root | Working group publications only; no primary dataset for site-level claims. |
| AOML HABs, WHOI HABHub, IOC HABON | URLs ECONNREFUSED / 404 at verification time. |

---

## Suggested Integration Priority

1. **Tier 1 (add now):** NCEI Marine Microplastics, NOAA IncidentNews, ERMA, EMODnet Chemistry, NOAA HAB Operational Forecast System, HAEDAT, NOAA Mussel Watch, EPA BEACON, EPA NCCA, Water Quality Portal.
2. **Tier 2 (add for context paragraphs):** NOAA Ocean Acidification Program, GOA-ON, BGC-Argo, LITTERBASE, Global Plastics Hub, ITOPF, Reef 2050 Report Card (with crawler caveat).
3. **Tier 3 (linkout only):** EMSA CleanSeaNet, Cedre.
