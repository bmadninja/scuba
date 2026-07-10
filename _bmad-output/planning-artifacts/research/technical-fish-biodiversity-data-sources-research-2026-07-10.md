---
stepsCompleted: [1, 2, 3]
inputDocuments: []
workflowType: 'research'
lastStep: 4
research_type: 'technical'
research_topic: 'Fish Biodiversity Data Sources'
research_goals: 'Landscape scan of all fish-biodiversity data sources vs. what the repo already has wired; best technical approach to display an area fish biodiversity over time; how to tie the fish-biodiversity signal into the existing reef-health model; data-gap analysis to identify organizations to reach out to for data access.'
user_name: 'Josie'
date: '2026-07-10'
web_research_enabled: true
source_verification: true
---

# Research Report: Technical — Fish Biodiversity Data Sources

**Date:** 2026-07-10
**Author:** Josie
**Research Type:** technical

---

## Research Overview

Technical research into fish-biodiversity data sources for scubaseason.fun, in service of four goals: (1) a complete landscape of available sources mapped against what the repo already ingests; (2) the best technical path to display an area's fish biodiversity **over time**; (3) how that signal ties into the existing reef-health model; (4) a data-gap analysis that names the organizations to approach for access. Every non-obvious access/license claim is verified against a primary source (API docs, dataset landing pages, license text), and the "what we have" column is grounded against the actual repo code, not memory.

**Methodology:** current web data with source verification, multi-source validation for critical claims, confidence levels applied where a source is credible but live access could not be confirmed, and an explicit *observed-vs-modeled* axis kept in frame to arm the open "biodiversity benchmark" design decision (design toward observed sources now vs. wait until AquaMaps is wired).

---

## Technical Research Scope Confirmation

**Research Topic:** Fish Biodiversity Data Sources
**Research Goals:** Landscape scan vs. what is wired; best approach to display fish biodiversity over time; reef-health linkage; data-gap → outreach analysis.

**Scope:**

- Source Landscape — exhaustive inventory scored on access mechanism, license, spatial coverage, taxonomic scope, and what "biodiversity" each actually measures
- Time-Series Feasibility — which sources can support an over-time view of one area, and by what query mechanics
- Reef-Health Linkage — display-only vs. verdict-feeding integration, unit reconciliation, ecological logic
- Gap Analysis → Outreach — geographic/taxonomic/temporal gaps and the orgs to contact, with access path per source

**Cross-cutting axis:** observed (survey) vs. modeled (predicted) data, to inform the AquaMaps decision.

**Scope Confirmed:** 2026-07-10

---

## Source Landscape Analysis

### The core distinction: what "fish biodiversity" actually measures

"Fish biodiversity" is not one number. Sources measure four different things, and the choice of which to display over time depends on which of these you mean:

| Measure | What it is | Responds to | Charts a trend? |
|---|---|---|---|
| **Occurrence / presence** | "species X was recorded here" | sampling effort (confounded) | only with an effort caveat |
| **Richness** | count of distinct species per effort/area | effort + real diversity | yes, if effort-standardized |
| **Abundance / density** | individuals per area or per survey | fishing, protection, recruitment | yes |
| **Biomass** (kg/ha) | mass per area | fishing & protection (the honest "protection works" signal) | yes |
| **Modeled range** | *predicted* probability of occurrence | environmental envelope, not observation | **no — static snapshot** |

The repo's current fish story leans on **biomass** (RLS) and **abundance** (REEF, Reef Check), plus an all-taxa **richness** proxy (iNaturalist). That's the right instinct: biomass and effort-standardized abundance are the measures that actually move with reef condition.

### Tier A — Standardized reef-fish survey programs (biomass / abundance / richness, genuine time-series)

These are the sources that can honestly chart fish biodiversity *over time* for a fixed area, because each is a repeat, fixed-effort survey with dates.

- **Reef Life Survey (RLS)** — *wired* (`fetch-rls-fish-biomass.mjs`). Global M1 fish-transect biomass/abundance/richness via the open IMOS AODN geoserver (WFS/CSV, no auth). Also mirrored as a [GBIF dataset](https://www.gbif.org/dataset/38f06820-08c5-42b2-94f6-47cc3e83a54a). Strong on temperate/Mediterranean/Australian reefs; **sparse in the tropical Indo-Pacific** by its own methodology note.
- **MERMAID** — *partially wired* (coral only, `fetch-mermaid-coral-cover.mjs`). The same public `/v1/summarysampleevents/` endpoint carries **fish belt-transect biomass (kg/ha)**, aggregated at sample-event level with `biomass_kgha_by_trophic_group_avg` and `biomass_kgha_by_fish_family_avg` fields; biomass is computed from FishBase length-weight coefficients. No token for public/public-summary data; `mermaidr` R client exists. Coverage is concentrated in the **tropical Indo-Pacific — exactly RLS's blind spot.** ([API docs](https://mermaid-api.readthedocs.io/_/downloads/en/latest/pdf/), [reef-health metrics](https://datamermaid.org/documentation/mermaid-reef-health-metrics))
- **Reef Check (via Aqualink)** — *wired as regional trends only, hand-transcribed*. **Fact update:** raw per-site Reef Check data (17,000+ surveys back to 1997, incl. fish belt-transect indicators like parrotfish >20 cm as an overfishing indicator) is now **free and open through the Aqualink Global Reef Tracker, which exposes a documented API** — no longer request-only. ([Global Reef Tracker](https://www.reefcheck.org/global-reef-tracker/), [Aqualink](https://aqualink.org/tracker))
- **REEF Volunteer Fish Survey Project** — *wired* (`fetch-reef-abundance.mjs`). Roving Diver Technique density index (%SF × DEN), per-year via the Geographic Area Report CSV export. Strong in Caribbean/US/Tropical Eastern Pacific; thin in Med/Indo-Pacific.
- **NOAA NCRMP** — *registered (`ncrmp`), not fetched for fish*. Stationary Point Count surveys catalog **richness, numeric density, and biomass** for US reefs (Hawaii, Marianas, PRIA, Am. Samoa, Florida, PR, USVI, Flower Garden Banks). Raw packages on NCEI; status-and-trends via the NCRMP Data Visualization Tool. ([NCEI landing](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.nodc:NCRMP-Fish-PRIA), [CoRIS](https://www.coris.noaa.gov/monitoring/data_pacific.html))
- **NOAA PIFSC Pacific RAMP** — *not registered*. Long-term Pacific reef-fish monitoring since 2000 across >50 US Pacific islands/atolls; **data served via ERDDAP/OPeNDAP** (machine-readable). Deeper temporal baseline than NCRMP for the Pacific. ([Pacific RAMP](https://origin-apps-pifsc.fisheries.noaa.gov/cred/pacific_ramp.php))
- **AIMS Long-Term Monitoring Program** — *registered (`aims-ltmp`)*. GBR reef-fish + coral trends since 1985; ERDDAP/eAtlas access. Best for GBR-area sites.

### Tier B — Occurrence aggregators (presence → computed richness)

Broad taxonomic and geographic coverage, but effort is **not** standardized — so richness-over-time from these is confounded by how many observers showed up. Best for a "how many fish species have been recorded near here" richness figure with an effort caveat, and for gap-filling species lists.

- **GBIF** — *registered*. REST + **SQL Download API** supports polygon predicates, taxon filters (`Actinopterygii`, `Elasmobranchii`), summary/count views and **species occurrence "cubes"**; DOI-citable downloads. ([SQL downloads](https://techdocs.gbif.org/en/data-use/api-sql-downloads))
- **OBIS** — *registered*. Marine-only, 161M records, WoRMS-aligned; REST API plus a **GeoParquet mirror on AWS** for large programmatic pulls. Cleaner than GBIF for marine richness by area. ([data access](https://obis.org/data/access/), [AWS open data](https://registry.opendata.aws/obis/))
- **iNaturalist** — *wired* (`fetch-species-diversity.mjs`) but counts **all taxa**, not fish. A `taxon_id` filter to ray-finned + cartilaginous fishes converts it to a true fish-richness signal with zero new infrastructure.
- **Atlas of Living Australia** — *registered*. Australian GBIF node; `galah` client; supersedes GBIF for AU sites.
- **EMODnet Biology** — *not registered*. WFS/WMS for occurrence **and gridded abundance products**; `emodnet.wfs` R client. Best regional fill for European seas (Med, Atlantic Europe) where RLS/REEF are thin. ([biology portal](https://emodnet.ec.europa.eu/en/biology))
- **OBIS-SEAMAP** — *registered*. Megafauna (sharks/rays/turtles/mammals), not reef fish per se; complements the sightings layer.

### Tier C — Trait & taxonomic backbones (reference, not temporal)

- **FishBase** — *registered*. Per-species traits, length-weight coefficients (the same ones MERMAID uses for biomass), IUCN status, distribution. `rfishbase` client.
- **WoRMS** — *registered*. Authoritative marine taxonomy (AphiaID) — reconcile every species name here at ingest so all sources cross-link.
- **SeaLifeBase** — non-fish marine trait sister of FishBase.

### Tier D — Modeled / predicted distributions (AquaMaps)

- **AquaMaps** — *not registered*. Computer-generated **predicted** range maps for ~33,500 fish/mammal/invertebrate species on a 0.5° ocean grid, built **on top of** FishBase/SeaLifeBase + OBIS/GBIF occurrences. License **CC BY-NC 3.0** (non-commercial). Also published as a [GBIF tool](https://www.gbif.org/tool/81356/aquamaps-predicted-range-maps-for-aquatic-species). ([algorithm & sources](https://www.aquamaps.org/main/AquaMaps_Algorithm_and_Data_Sources.pdf))

  **Decisive finding for the benchmark decision:** AquaMaps is a **static predicted snapshot** (current public set restored from the v10/2019 release). It answers *"which species are expected to occur here"* — it **cannot show change over time**, because it isn't a repeat observation series. So for a "fish biodiversity **over time**" display, AquaMaps is the wrong instrument for the trend axis. Its real value is orthogonal: an *expected-species baseline* to contextualize what observed surveys do or don't find (a denominator for completeness), and a gap-filler where no survey program reaches. That reframes the design question — it's not "observed now vs. modeled later," it's **"observed for the trend, modeled as an optional expected-baseline overlay."**

### What we have vs. what's open (summary)

| Source | Measures | Access | Time-series? | Repo status |
|---|---|---|---|---|
| RLS | biomass/abund/richness | open WFS (AODN) | ✅ | wired |
| MERMAID fish | biomass kg/ha | open API | ✅ | **coral only — fish untapped** |
| Reef Check / Aqualink | indicator density | **open API (Aqualink)** | ✅ | regional-only, hand-keyed |
| REEF | density index | CSV export | ✅ | wired |
| NCRMP | richness/density/biomass | NCEI + viz tool | ✅ | registered, not fetched |
| PIFSC Pacific RAMP | fish density/biomass | ERDDAP | ✅ | **not registered** |
| AIMS LTMP | fish + coral | ERDDAP/eAtlas | ✅ | registered |
| GBIF | occurrence→richness | REST/SQL API, DOI | ⚠️ effort-confounded | registered |
| OBIS | occurrence→richness | REST + AWS parquet | ⚠️ effort-confounded | registered |
| iNaturalist | richness | REST API | ⚠️ | wired (all-taxa, not fish) |
| EMODnet Biology | occurrence + gridded | WFS | ⚠️/partial | **not registered** |
| FishBase / WoRMS | traits / taxonomy | API | ✗ reference | registered |
| AquaMaps | **predicted** range | download / GBIF | ✗ **static** | not registered |

_Sources: [MERMAID API](https://mermaid-api.readthedocs.io/_/downloads/en/latest/pdf/), [MERMAID reef-health metrics](https://datamermaid.org/documentation/mermaid-reef-health-metrics), [AquaMaps algorithm & data sources](https://www.aquamaps.org/main/AquaMaps_Algorithm_and_Data_Sources.pdf), [AquaMaps on GBIF](https://www.gbif.org/tool/81356/aquamaps-predicted-range-maps-for-aquatic-species), [NCRMP/NCEI](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.nodc:NCRMP-Fish-PRIA), [CoRIS Pacific data](https://www.coris.noaa.gov/monitoring/data_pacific.html), [PIFSC Pacific RAMP](https://origin-apps-pifsc.fisheries.noaa.gov/cred/pacific_ramp.php), [OBIS data access](https://obis.org/data/access/), [OBIS on AWS](https://registry.opendata.aws/obis/), [GBIF SQL downloads](https://techdocs.gbif.org/en/data-use/api-sql-downloads), [EMODnet Biology](https://emodnet.ec.europa.eu/en/biology), [Reef Check Global Reef Tracker](https://www.reefcheck.org/global-reef-tracker/), [Aqualink tracker](https://aqualink.org/tracker), [RLS GBIF dataset](https://www.gbif.org/dataset/38f06820-08c5-42b2-94f6-47cc3e83a54a)._

---

## Integration & Time-Series Mechanics

### The two query shapes for an "over-time-by-area" display

Every viable source reduces to one of two integration patterns, both already proven in the repo's ingest layer:

1. **Spatial-proximity shape** (RLS pattern, `fetch-rls-fish-biomass.mjs`). Draw a bounding box / radius around the location centre (repo uses 0.5° ≈ 55 km), pull every survey with a date inside it, group by year, aggregate per-survey metrics, and emit a yearly mean. Portable to **MERMAID** (`mermaid_get_summary_sampleevents(limit = NULL)` returns every public/public-summary project's sample events **by site and date, with lat/lon — no project ownership required, read-only GET**), and to **GBIF/OBIS** polygon+taxon queries. ([mermaidr accessing project data](https://data-mermaid.github.io/mermaidr/articles/accessing_project_data.html), [MERMAID aggregated views](https://mermaid-api.readthedocs.io/en/latest/aggregated.html))
2. **Site-code shape** (REEF pattern, `fetch-reef-abundance.mjs`). Maintain a vetted crosswalk `locationId → program zone/site id`, then query one calendar-year window per year. More precise (no proximity smear) but needs a hand-built map per source. Reef Check via **Aqualink's API** fits here (site-keyed).

Both fit the repo's existing pipeline unchanged: **fetch → normalize → write `*-series.json` in `src/data` → typed accessor in `src/lib/data` → register a `source` + `methodology`**. Adding MERMAID fish or NCRMP is a new `fetch-*.mjs` in the exact mold of the RLS script — no new infrastructure, no new dependency.

### Access mechanisms by source (all fit the pipeline)

| Protocol | Sources | Format |
|---|---|---|
| Open WFS (OGC) | RLS/AODN, EMODnet Biology | CSV / GML |
| REST JSON | MERMAID, GBIF, OBIS, iNaturalist | JSON |
| ERDDAP / OPeNDAP | PIFSC Pacific RAMP, AIMS LTMP | CSV / NetCDF |
| CSV export | REEF Geographic Area Report | CSV |
| Documented API | Reef Check (Aqualink) | JSON |
| Bulk archive | NCRMP (NCEI), OBIS (AWS GeoParquet) | CSV / Parquet |

### The crux: effort standardization decides what you can honestly chart

- **Biomass / abundance sources are already effort-standardized** (fixed transect area, logged survey count): RLS, MERMAID, Reef Check, REEF, NCRMP, PIFSC. A rising line = more fish per unit survey = a real signal. **These are the only sources safe for a clean "fish biodiversity over time" trend.**
- **Occurrence aggregators are NOT effort-standardized**: GBIF, OBIS, iNaturalist. Detected-richness-over-time rises as more observers show up, so an upward line can be pure observer growth, not more fish. If used temporally, they must be shown as *cumulative detected richness* or normalized by record count, and explicitly caveated — never as a bare "diversity is increasing" claim. Their honest use is a **current-state richness snapshot** ("N fish species recorded near here") and species-list gap-filling.

This confirms the design instinct: build the trend on **observed biomass/abundance**, and treat richness-from-occurrence as a companion snapshot, not a trend line.

---

## Reef-Health Linkage

### How the model actually works today (grounded in `src/lib/data/reef-state.ts`)

`getReefState()` derives one of four states — **Improving / Stable / Declining / Not surveyed** (internal keys `thriving`/`pressure`/`change`/`unknown`) — from exactly three inputs: **coral cover, thermal-stress alert level, and fishing pressure**. Critically:

- **Fish biomass is not an input.** `fish-biomass-series.ts` is explicitly *display-only* ("never a reef-state input"). The fish chart sits beside the coral chart but does not touch the verdict.
- A location returns **"unknown"** unless it has a coral-cover survey **or** a thermal reading. Fishing pressure alone does not qualify a reef as "surveyed."
- The model is deliberately conservative: a comment in the RLS ingest states proximity-matched fish data must **never override a hand-reviewed classification**.

### The benchmark that makes a raw kg/ha number mean something

A standing insight from the fisheries-ecology literature (McClanahan, MacNeil et al.) gives published, citable thresholds for reef-fish biomass:

- **Unfished baseline B₀ ≈ 1,150–1,200 kg/ha** (from remote reefs + oldest no-take parks)
- **~600 kg/ha** — the point where fish diversity begins to decline
- **300–600 kg/ha** — the sustainable-yield (BMMSY) window
- Conservation target ~1,150 kg/ha where ecological processes are maintained

([PNAS — critical thresholds](https://www.pnas.org/doi/10.1073/pnas.1106861108), [McClanahan 2018 benchmarks](https://onlinelibrary.wiley.com/doi/10.1111/faf.12268), [global baselines & benchmarks](https://www.researchgate.net/publication/330528804_Global_baselines_and_benchmarks_for_fish_biomass_Comparing_remote_reefs_and_fisheries_closures))

**This likely answers the open "biodiversity benchmark question" directly:** the benchmark is **B₀ (~1,150 kg/ha)**. An RLS/MERMAID value of, say, 140 kg/ha stops being a floating number and becomes *"~12% of an unfished reef"* — an honest, sourced, protection-works frame that needs no modeled data at all.

### Two integration options

**Option A — Keep fish display-only, add benchmark context (low risk).** Chart RLS + MERMAID biomass beside coral, annotated against B₀ and the 600 kg/ha diversity threshold. The coral-driven verdict is untouched; no proximity match can corrupt a curated state. This is the safe default and already a UX upgrade.

**Option B — Let fish *rescue* "Not surveyed", bounded (higher value).** Because the model returns "unknown" without a coral or thermal reading, a site with strong RLS/MERMAID fish transects but no coral survey is labelled "Not surveyed" today — even though a fish transect *is* eyes underwater. The cleanest promotion: **let an effort-standardized fish survey satisfy the "surveyed" condition and set a state where coral is silent**, using the biomass thresholds to tier it. Guardrail, per the repo's own rule: fish informs the verdict **only where coral is absent**, or nudges within a band — it never overrides a hand-reviewed coral classification.

**Recommended path:** ship **A** now (it's the benchmark the UX flow is asking for, and it unblocks the design without touching state logic), then evaluate **B** as a scoped enhancement once MERMAID fish coverage is in and you can see how many "Not surveyed" tropical sites it would rescue.

---

## Data-Gap Analysis & Outreach Targets

### The gaps come in three axes

**1. Geographic.** RLS is thin across the tropical Indo-Pacific / Coral Triangle; REEF is thin in the Med and Indo-Pacific. **This is mostly closable with open data, not outreach:** MERMAID runs **73 countries and ~12,000 sites**, is government-endorsed in Indonesia, and is strong across the Coral Triangle, Timor-Leste, Mozambique and the Western Indian Ocean — precisely RLS's blind spot ([MERMAID milestones](https://gcrmn.net/2026/04/14/mermaid/), [Indonesia endorsement](https://datamermaid.org/reef-stories/indonesia-and-mermaid-join-forces-to-safeguard-the-future-of-the-coral-triangle)). The residual after MERMAID: reefs with no standardized program at all (parts of the Red Sea, West Africa, remote Pacific outside US territories).

**2. Temporal.** Two distinct problems: (a) **single-survey sites** — RLS/MERMAID visited once, so there is no trend to chart (structural; no source fixes it except repeat surveys); (b) **latency** — annual-to-biennial survey cadence means "current" fish data is often 1–2 years old, which the repo's own freshness model already accounts for (`fresh` ≤ 2 yr).

**3. Taxonomic / measurement.** Biomass sources answer "how much fish" but not "how many species"; occurrence sources answer richness but with confounded effort. No single source gives clean effort-standardized *richness* trends globally — RLS species-richness-per-transect is the closest, and it inherits RLS's geographic gaps.

### Coverage after wiring the open sources (do this before any outreach)

The honest headline: **most of the gap closes with sources that need no permission.** In priority order, all open-access:

| # | Source | Fills | Access | Outreach needed? |
|---|---|---|---|---|
| 1 | **MERMAID fish** | tropical Indo-Pacific biomass | open API | **No** |
| 2 | **iNaturalist (fish-filtered)** | richness snapshot everywhere | open API | No |
| 3 | **Reef Check / Aqualink** | indicator density, 100+ countries | open API | No |
| 4 | **NCRMP + PIFSC RAMP** | US reef fish (Pacific/Caribbean/FL) | NCEI / ERDDAP | No |
| 5 | **GBIF / OBIS (fish predicate)** | richness fill where surveys absent | open API/DOI | No |
| 6 | **EMODnet Biology** | European seas | open WFS | No |

### Outreach targets — for the residual only

Ranked by value-per-effort once the open sources are in:

1. **REEF (Reef Environmental Education Foundation)** — for **bulk raw survey files** beyond the public Geographic Area Report the repo already uses (finer site-level resolution, full species matrices). Access path: email **data@REEF.org** / Dr. Christy Pattengill-Semmens; historically permissive for science/non-commercial. ⚠️ Confirm commercial terms if the site monetizes. ([REEF data users](https://www.reef.org/news/enews/making-it-count-may-2025/putting-it-work-who%E2%80%99s-using-reef-data-may-2025))
2. **CORDIO East Africa / GCRMN Western Indian Ocean node** — reef-fish monitoring for Kenya, Tanzania, Mozambique, Seychelles, Comoros, Madagascar, where open coverage is thin. Access path: the GCRMN regional committee / CORDIO directly; increasingly funneled through MERMAID, so ask whether their MERMAID projects can be set to "public summary." ([GCRMN WIO](https://gcrmn.net/2025/02/20/wio-workshop-2025/))
3. **WCS (Wildlife Conservation Society)** — runs MERMAID; holds Coral Triangle + Mozambique projects, some kept private rather than public-summary. Access path: partner via MERMAID and request public-summary flips, or a WCS data-sharing agreement. ([WCS MERMAID](https://www.wcs.org/our-work/species/coral/mermaid))
4. **Local MPA managers / Blue Parks partners** — site-specific fish series for flagship locations, exactly the precedent the repo already set with Tubbataha (Saving Philippine Reefs / CCEF). Highest-quality, lowest-scalability; reserve for hero sites.
5. **OBIS-SEAMAP** — for the megafauna sightings layer (sharks/rays/turtles), not core reef fish: registration + a short use statement unlocks bulk download.

### Cross-cutting license flag for outreach and design

If scubaseason.fun is (or becomes) commercial, the **non-commercial** sources need a negotiated term or a display-only posture: **AquaMaps (CC BY-NC 3.0), REEF (non-commercial), FishBase (some content CC BY-NC), SeaLifeBase (CC BY-NC)**. The trend backbone — **RLS, MERMAID, GBIF, OBIS, NCRMP, PIFSC, AIMS (CC BY / public domain)** — is commercially clean. Design the benchmark on the clean-license trend sources; treat NC sources as enrichment you can drop.

---

<!-- Content will be appended sequentially through research workflow steps -->
