---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments: []
workflowType: 'research'
lastStep: 6
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

## Executive Summary

The reef fish biodiversity of a place is not one number but four — occurrence, richness, abundance, and biomass — and only the effort-standardized ones (biomass, abundance) honestly move with reef condition. scubaseason.fun already leans on the right measures (RLS biomass, REEF/Reef Check abundance), but treats Reef Life Survey as its primary fish source, and RLS is sparse exactly where the world's richest reefs are: the tropical Indo-Pacific. This research maps the full source landscape and finds that the gap is far more closable — with far less effort and far less permission-seeking — than it first appears.

Three findings reframe the work. **First, the tropical gap is an *open-data* problem, not an access problem:** MERMAID already covers 73 countries and ~12,000 sites across the Coral Triangle and Western Indian Ocean, its fish belt-transect biomass rides the *same public API the repo already calls for coral*, and wiring it is a sibling of the existing RLS script. **Second, the open "biodiversity benchmark" design decision has a published answer:** reef-fish biomass has a citable unfished baseline (B₀ ≈ 1,150 kg/ha, with 600 kg/ha as the diversity-decline threshold), so a raw kg/ha value becomes an honest "% of an unfished reef" — no modeled data required. **Third, AquaMaps cannot chart change over time** — it is a static predicted snapshot — so the real design axis is not "observed now vs. modeled later" but "observed for the trend, modeled as an optional expected-species overlay." That should unblock the parked UX decision.

The recommendation is to build the fish-biodiversity trend on the commercially-clean, effort-standardized survey backbone (RLS + MERMAID + Reef Check/Aqualink + NCRMP/PIFSC), annotate it against the B₀ benchmark, keep occurrence aggregators (GBIF/OBIS/iNaturalist) as current-state richness snapshots rather than trends, and reserve outreach (REEF, CORDIO/GCRMN, WCS) for the residual gaps that open data cannot reach. Full detail, phased roadmap, and source verification follow.

**Key Findings:**

- Fish biodiversity = four distinct measures; only effort-standardized biomass/abundance can honestly chart a trend. Occurrence aggregators are snapshot-only (effort-confounded).
- **MERMAID fish biomass** is open, untapped, and fills RLS's tropical Indo-Pacific gap — same API already used for coral.
- **AquaMaps is a static prediction** — an expected-species baseline, not a trend source. This reframes (and unblocks) the benchmark decision.
- A **published biomass benchmark (B₀ ≈ 1,150 kg/ha)** turns raw survey numbers into a sourced "protection-works" frame — likely the "biodiversity benchmark" the UX flow was asking for.
- The reef-health model runs on coral + heat + fishing only; fish is display-only today. Fish can *rescue* "Not surveyed" sites where coral is silent, bounded so it never overrides a curated coral verdict.
- **Reef Check raw data is now open via the Aqualink API** — the repo's "request-only" note is out of date.
- The trend backbone (RLS, MERMAID, GBIF, OBIS, NCRMP, PIFSC, AIMS) is CC BY / public-domain — commercially clean; NC sources (AquaMaps, REEF, FishBase) are enrichment to keep off the backbone.

**Top Recommendations:**

1. Wire **MERMAID fish biomass** first (highest value, mirrors the RLS script) — closes the tropical gap with open data.
2. **Annotate the biomass chart against B₀ ≈ 1,150 kg/ha** — answers the benchmark question with zero new data.
3. Fix **iNaturalist to a fish taxon filter** for a true richness snapshot (hours of work).
4. Keep fish **display-only** initially; evaluate a **bounded reef-state linkage** (fish rescues "Not surveyed") after MERMAID coverage is visible.
5. Run **outreach (REEF, CORDIO/GCRMN WIO, WCS)** in parallel, only for the residual gaps open data can't fill.

## Table of Contents

1. Research Overview & Methodology
2. Technical Research Scope Confirmation
3. Source Landscape Analysis — four measures, four tiers, have-vs-gap scorecard
4. Integration & Time-Series Mechanics — query shapes, effort standardization
5. Reef-Health Linkage — model grounding, the B₀ benchmark, two integration options
6. Data-Gap Analysis & Outreach Targets — three gap axes, ranked contacts
7. Implementation Approaches & Recommendations — phased roadmap, risks, metrics
8. Research Synthesis & Conclusion
9. Source Reference Index

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

## Implementation Approaches & Recommendations

### Adoption strategy: incremental, mirror what exists

Every recommendation below reuses the repo's proven ingest mold (`fetch-*.mjs` → `*-series.json` → typed accessor → registered `source` + `methodology`). No new dependency, no new infrastructure, no schema change to reef-state. Ship each phase independently; each is valuable alone.

### Implementation Roadmap

**Phase 0 — iNaturalist fish filter (hours, near-zero risk).** In `fetch-species-diversity.mjs`, add a `taxon_id` filter for ray-finned + cartilaginous fishes (Actinopterygii, Elasmobranchii, Holocephali) to `species_counts`. Converts an all-taxa richness proxy (currently inflated by terrestrial taxa at coastal sites) into a true fish-richness snapshot. Smallest possible win.

**Phase 1 — MERMAID fish biomass (highest value).** New `fetch-mermaid-fish-biomass.mjs`, a sibling of `fetch-rls-fish-biomass.mjs`:
- Endpoint: `mermaid_get_summary_sampleevents(limit = NULL)` equivalent REST call (`/v1/summarysampleevents/`), public/public-summary projects, read-only, no token.
- Field: `biomass_kgha_avg` (total standing fish biomass, FishBase length-weight coefficients) per site+date; optionally `biomass_kgha_by_trophic_group_avg` for a trophic breakdown.
- Match: same 0.5° proximity box + `MIN_TREND_YEARS` gate as RLS.
- Write into `fish-biomass-series.json` with `sourceId: "mermaid"`, `methodologyClaimId: "fish-biomass-mermaid"`.
- **This fills RLS's tropical Indo-Pacific gap with open data** (73 countries, Coral Triangle, WIO).

**Phase 2 — Benchmark annotation (answers the UX "biodiversity benchmark" question).** No new data. Annotate the fish-biomass chart against the published unfished baseline **B₀ ≈ 1,150 kg/ha** and the **600 kg/ha** diversity-decline threshold, and register a `methodology` claim citing McClanahan/MacNeil et al. Turns every raw kg/ha into a sourced "% of an unfished reef" frame. Do this right after Phase 1 so the new tropical data lands with meaning.

**Phase 3 — Reef Check via Aqualink (per-site upgrade).** Replace the hand-transcribed regional trends with per-site Aqualink API pulls where sites match, giving real per-site indicator-fish trends back to 1997.

**Phase 4 — US reef fish (NCRMP + PIFSC).** ERDDAP/NCEI ingest for US-territory sites (Hawaii, Marianas, PRIA, Florida, PR, USVI) — richness + density + biomass, government-grade, deep temporal baseline.

**Phase 5 — Bounded reef-health linkage (careful, high value).** Extend `getReefState()` so an effort-standardized fish survey can *satisfy the "surveyed" condition and set a state where coral is absent*, tiered by the biomass thresholds. Guardrail (repo's own rule): fish informs the verdict **only where no coral survey exists**, and a proximity-matched fish trend **never** overrides a hand-reviewed coral classification. Evaluate after Phase 1 reveals how many "Not surveyed" tropical sites this would rescue.

**Phase 6 — AquaMaps expected-species overlay (optional, display-only).** A "what species should occur here" baseline for completeness context — **not a trend**. Mind CC BY-NC if the site monetizes.

**Outreach track (runs in parallel with Phases 3–5):** email REEF (`data@REEF.org`) for bulk raw; CORDIO / GCRMN WIO node and WCS for Indian-Ocean + Coral-Triangle projects not yet public-summary; local MPA managers for hero sites.

### Risks & mitigations

- **Method heterogeneity** (RLS M1 250 m² blocks vs MERMAID belt transects vs Reef Check indicators): co-chart as kg/ha but **label every series by program and never blend across methods silently** — the repo already refuses to merge REEF into Reef Check for this reason.
- **Proximity smear** (0.5° radius ≠ exact site): keep fish display-only by default; gate any state contribution behind the Phase-5 guardrail.
- **License**: keep NC sources (AquaMaps, REEF, FishBase) off the commercial trend backbone.
- **Partial MERMAID coverage**: only public/public-summary projects return data, so coverage < full 12k sites; `log()` what was dropped rather than implying full coverage.
- **Latency**: reuse the existing freshness model (`fresh` ≤ 2 yr).

### Success metrics

- Δ in locations carrying a ≥2-year fish-biomass trend, before vs. after MERMAID (primary).
- Count of tropical Indo-Pacific locations that gain a series they never had.
- Count of "Not surveyed" sites rescued to a real state via fish (if Phase 5 ships).
- Benchmark-annotation coverage (share of fish charts showing the B₀ frame).

_Sources: [mermaidr accessing project data](https://data-mermaid.github.io/mermaidr/articles/accessing_project_data.html), [MERMAID reef-health metrics](https://datamermaid.org/documentation/mermaid-reef-health-metrics), [PNAS critical thresholds](https://www.pnas.org/doi/10.1073/pnas.1106861108), [McClanahan 2018 benchmarks](https://onlinelibrary.wiley.com/doi/10.1111/faf.12268)._

---

## Research Synthesis & Conclusion

### What this research settles

The four original goals resolve cleanly:

- **Landscape** — Fish-biodiversity data spans four tiers: standardized survey programs (trend-capable: RLS, MERMAID, Reef Check, REEF, NCRMP, PIFSC, AIMS), occurrence aggregators (snapshot-only: GBIF, OBIS, iNaturalist, ALA, EMODnet), trait/taxonomy backbones (FishBase, WoRMS), and modeled predictions (AquaMaps). The repo already holds most of the tier-1 backbone; the two biggest omissions — MERMAID fish and Reef Check-via-Aqualink — are both open.
- **Over time** — Only effort-standardized biomass/abundance sources can honestly chart a trend for an area, via one of two proven query shapes (proximity-box or site-code). Occurrence richness is a snapshot, not a trend.
- **Reef-health tie-in** — Fish is display-only today; the highest-integrity linkage is to let an effort-standardized fish survey rescue "Not surveyed" sites where coral is absent, tiered by the B₀ benchmark, never overriding a curated coral verdict.
- **Gaps & outreach** — Most gaps close with open data (MERMAID above all); genuine outreach is a short list (REEF, CORDIO/GCRMN WIO, WCS, local MPA managers) for the residual.

### Strategic impact

The decision that was blocking the UX flow — observed vs. modeled — dissolves once you see that AquaMaps cannot represent change over time. The trend is built on observed surveys; AquaMaps, if used at all, is an orthogonal "expected species" overlay. And the benchmark that gives the whole feature meaning already exists as published science (B₀ ≈ 1,150 kg/ha), so scubaseason.fun can ship an honest, sourced fish-biodiversity-over-time story now, on commercially-clean data, without waiting on anything.

### Recommended next steps

1. Implement **Phase 0 (iNat fish filter)** and **Phase 1 (MERMAID fish biomass)** — small, high-leverage, unblock the tropical gap.
2. Ship **Phase 2 (B₀ benchmark annotation)** immediately after, and take it back to the UX flow as the answer to the "biodiversity benchmark question."
3. Draft the **outreach emails** (REEF, CORDIO/GCRMN, WCS) in parallel.
4. Defer AquaMaps to an optional display-only overlay; defer the reef-state linkage (Phase 5) until MERMAID coverage is measurable.

Hand this document to the dev agent (or `bmad-create-story`) to turn Phases 0–2 into implementable stories.

---

## Source Reference Index

**Standardized survey programs (trend-capable)**
- Reef Life Survey — [reeflifesurvey.com survey data](https://reeflifesurvey.com/survey-data/), [RLS GBIF dataset](https://www.gbif.org/dataset/38f06820-08c5-42b2-94f6-47cc3e83a54a)
- MERMAID — [API docs (PDF)](https://mermaid-api.readthedocs.io/_/downloads/en/latest/pdf/), [aggregated views](https://mermaid-api.readthedocs.io/en/latest/aggregated.html), [mermaidr project data](https://data-mermaid.github.io/mermaidr/articles/accessing_project_data.html), [reef-health metrics](https://datamermaid.org/documentation/mermaid-reef-health-metrics), [coverage/milestones](https://gcrmn.net/2026/04/14/mermaid/), [Indonesia endorsement](https://datamermaid.org/reef-stories/indonesia-and-mermaid-join-forces-to-safeguard-the-future-of-the-coral-triangle)
- Reef Check / Aqualink — [Global Reef Tracker](https://www.reefcheck.org/global-reef-tracker/), [Aqualink tracker](https://aqualink.org/tracker)
- REEF Volunteer Fish Survey — [program](https://www.reef.org/programs/volunteer-fish-survey-project), [database reports](https://www.reef.org/database-reports), [data users May 2025](https://www.reef.org/news/enews/making-it-count-may-2025/putting-it-work-who%E2%80%99s-using-reef-data-may-2025)
- NOAA NCRMP — [NCEI landing (PRIA)](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.nodc:NCRMP-Fish-PRIA), [CoRIS Pacific data](https://www.coris.noaa.gov/monitoring/data_pacific.html), [NCRMP data viz tool](https://ncrmp.coralreef.noaa.gov/pages/ncrmp-data)
- NOAA PIFSC Pacific RAMP — [program page](https://origin-apps-pifsc.fisheries.noaa.gov/cred/pacific_ramp.php)

**Occurrence aggregators (snapshot / richness)**
- GBIF — [SQL downloads](https://techdocs.gbif.org/en/data-use/api-sql-downloads), [API reference](https://techdocs.gbif.org/en/openapi/)
- OBIS — [data access](https://obis.org/data/access/), [AWS open data](https://registry.opendata.aws/obis/), [manual](https://manual.obis.org/access.html)
- EMODnet Biology — [biology portal](https://emodnet.ec.europa.eu/en/biology), [web service docs](https://emodnet.ec.europa.eu/en/emodnet-web-service-documentation), [emodnet.wfs R package](https://docs.ropensci.org/emodnet.wfs/)

**Modeled / predicted**
- AquaMaps — [algorithm & data sources (PDF)](https://www.aquamaps.org/main/AquaMaps_Algorithm_and_Data_Sources.pdf), [AquaMaps on GBIF](https://www.gbif.org/tool/81356/aquamaps-predicted-range-maps-for-aquatic-species), [Wikipedia overview](https://en.wikipedia.org/wiki/AquaMaps)

**Biomass benchmark science**
- [PNAS — critical thresholds for reef fisheries](https://www.pnas.org/doi/10.1073/pnas.1106861108)
- [McClanahan et al. 2018 — community biomass benchmarks (Fish and Fisheries)](https://onlinelibrary.wiley.com/doi/10.1111/faf.12268)
- [Global baselines & benchmarks for fish biomass](https://www.researchgate.net/publication/330528804_Global_baselines_and_benchmarks_for_fish_biomass_Comparing_remote_reefs_and_fisheries_closures)

**Regional monitoring / outreach**
- GCRMN — [about](https://gcrmn.net/about-gcrmn/), [WIO workshop 2025](https://gcrmn.net/2025/02/20/wio-workshop-2025/)
- WCS MERMAID — [wcs.org](https://www.wcs.org/our-work/species/coral/mermaid)

### Methodology & confidence

All access-mechanism, license, and coverage claims were verified against primary sources (API docs, dataset landing pages, program pages) during research on 2026-07-10; the repo "have vs. gap" column was grounded against actual ingest code (`fetch-rls-fish-biomass.mjs`, `fetch-reef-abundance.mjs`, `fetch-mermaid-coral-cover.mjs`, `reef-state.ts`, `fish-biomass-series.ts`). Confidence is **high** for open-API sources (MERMAID, GBIF, OBIS, NCRMP, RLS/AODN) and **medium** where exact per-endpoint limits (MERMAID pagination/rate limits) or current commercial-use terms (REEF) require confirmation at implementation time.

---

**Research Completion Date:** 2026-07-10
**Author:** Josie (facilitated by Mary, Business Analyst)
**Source Verification:** All non-obvious claims cited to primary sources; repo claims grounded in code.
**Confidence Level:** High for the core recommendations; medium on implementation-time specifics noted above.
