# Data Sources — full intake register

**Author:** Mary (Business Analyst) · BMad
**Date:** 2026-07-10
**Built from ground truth:** `src/data/sources.json` (80 entries), the scheduled GitHub Actions in `.github/workflows/`, the fetch scripts in `scripts/`, and `.claude/data-sources-usage-report.md`.
**Why this exists:** the method panel's "science we build on" section lists static academic citations. This is the other half — every *data* source we actually intake, and exactly how each one is used. Three honest tiers: **live** (auto-refreshed on a schedule), **ingested** (real data, loaded once, static), **credited only** (named as a reference, no data ingested yet).

---

## Headline

80 sources in the registry. The honest shape of how they feed the site:

| Tier | Count | What it means |
|---|---|---|
| **Live feeds** | **7** | An API is polled on a schedule; a fresh upstream record changes the site on the next run |
| **Ingested, not live** | ~22 | Real data sits in our JSON as provenance, loaded once via backfill, not auto-refreshed |
| **Credited only** | ~37 | Named as the reference behind a methodology claim; no value on the site comes from it yet |
| **Per-site evidence** | ~14 | Study/report sources added recently as the named evidence behind specific reefs (Med, Honduras, Wakatobi, Philippines, Derawan) |

Lead with **7 live feeds**, never "80 live data feeds." (Note: OBIS went live since the 2026-07-08 report, which still counted 6. `getLiveSourceCount()` on the /data page should now read 7.)

---

## Tier 1 — LIVE feeds (7) · this is the "real-time data" claim

Each has a fetch script hit an API and write a data file, on a cron. Cadence is read straight from the workflow crons.

| Source | Publisher | What we pull | How we use it | Feeds reef health? | Script → file | Cadence (UTC) |
|---|---|---|---|---|---|---|
| **NOAA Coral Reef Watch** | NOAA | SST, SST anomaly, Degree Heating Weeks, bleaching alert (0–4) | The thermal-stress read in the reef-health verdict; the "Heat" pill and modal | **Yes — Thermal pillar** | `fetch-reef-health-live.mjs` → `reef-health.json` | **Daily** 06:30 |
| **Global Fishing Watch** | GFW (Oceana + SkyTruth + Google) | AIS apparent fishing hours at 0.1°, within 50 km per site | Fishing-pressure band, reconciled with MPA status → protected / paper-park read; boat-traffic pill | **Yes — Fishing pillar** | `fetch-fishing-pressure.mjs` → `fishing-pressure.json` | **Daily** 07:00 |
| **IUCN Red List** | IUCN | Conservation status (LC→EX) + population trend | Species rarity / conservation badges | No (species layer) | `fetch-iucn-status.mjs` → `iucn-status.json` | **Daily** 07:10 |
| **MERMAID** | Wildlife Conservation Society | Open benthic survey summaries, matched within 0.5° | Observed live-coral-cover % and the coral-cover-over-time chart | **Yes — Coral pillar (chart)** | `fetch-mermaid-coral-cover.mjs` → `reef-health.json` / `coral-cover-series.json` | **Weekly** Mon 07:00 |
| **iNaturalist** | Cal Academy + NatGeo | Research-grade observations: last-confirmed, recent counts, observed-month seasonality; also species richness | Species sightings, "last confirmed" recency, seasonality strip; the "species logged" context count | No (species / context) | `fetch-sightings-live.mjs` → `sightings.json`; `fetch-species-diversity.mjs` → `species-diversity.json` | **Weekly** Wed 08:00 (sightings, sharded 6×) + Tue 07:00 (diversity) |
| **GBIF** | GBIF Secretariat | Aggregated occurrence records | Sightings fallback where iNaturalist has no research-grade record; species presence | No (species layer) | `fetch-sightings-live.mjs` → `sightings.json` | **Weekly** Wed 08:00 |
| **OBIS** | IOC-UNESCO | Marine occurrence records | Presence + seasonality alongside GBIF (newly promoted to live) | No (species layer) | `fetch-sightings-live.mjs` → `sightings.json` | **Weekly** Wed 08:00 |

**Reef-health takeaway:** of the four pillars, **two are live** (thermal daily, coral cover weekly via MERMAID) and **one is live for pressure** (fishing daily via GFW). The fourth pillar, **fish biomass, is NOT live** — it sits in Tier 2 (RLS, loaded once). That is the single biggest freshness gap in the reef-health label.

Also scheduled but not a data feed: `fetch-coral-cover.yml` (monthly, 1st) re-validates NCRMP + AGRRA citation URLs — an integrity check, not fresh data.

---

## Tier 2 — Ingested, not live (~22) · real data, static until re-run

Record counts = how many records in `src/data/*.json` carry that source id (from the 2026-07-08 trace).

**Reef health — coral surveys** (backfilled as the named survey behind a reef's observed coral condition):
- **ICRI** (40), **GCRMN** (38), **Reef Check** (27), **AGRRA** (27), **Reef Life Survey** (10), **AIMS LTMP** (9), **NCRMP** (8), **GBRMPA** (4), **Allen Coral Atlas** (3)

**Reef health — fish biomass** (the state pillar that is not yet live):
- **Reef Life Survey / IMOS-AODN** → `fish-biomass-series.json`, **57 locations** with a fish-biomass trend. Display only today; the scoring rewrite promotes it to a state pillar.

**Reef health — protection & pressure:**
- **Blue Parks Award** (23) — genuinely-enforced-protection signal (e.g. Torre Guaceto)
- **MPAtlas** (10 records; only ~5 applied to `mpaStatus`) — protection-quality classification
- **WDPA / Protected Planet** (1) — protected-area existence
- **Reef gravity** (Andrello 2022 / Cinner 2018) → `reef-gravity.json` — a *derived* universal fishing-pressure level (built, not yet wired into scoring; not a single sources.json id)

**Species sightings & megafauna encounters:**
- **OBIS-SEAMAP**, **Wildbook** (97) — photo-ID return visits (sharks, whale sharks, mantas), **Manta Trust** (26) — aggregation-site fidelity

**Wrecks & geology:** DANFS / Naval History (13), NOAA Maritime Heritage (9), NOAA ENC Direct (1), Smithsonian Volcanism (1)

**Editorial & training:** scubaSeason editorial (53, excluded from external count), DAN (1), PADI (1)

---

## Tier 3 — Credited only (~37) · reference behind a claim, no data ingested

Named in `methodologies.json` as the source a claim *should* rest on, rendered on the /data credits page, but feeding no value yet. This is the roadmap layer.

- **Conditions & forecast** (backs `dive-conditions-forecast`): NOAA CO-OPS, IBTrACS, ECMWF Open, ERA5, HYCOM, Copernicus Marine, NOAA CoastWatch, NOAA NDBC
- **Water quality & pollution** (backs `water-quality-pollution`): NCEI Microplastics, NOAA ERMA, EMODnet Chemistry, NOAA HAB Forecast, HAEDAT, GOA-ON, NOAA Mussel Watch, Global Mangrove Watch
- **Bathymetry, wrecks, hazards** (backs `wreck-history-bathymetry`): GEBCO, USGS Earthquake, OpenSeaMap
- **Reef-health supporting refs**: NASA PO.DAAC, NASA Ocean Color, Argo, **CoralWatch** (also a sighting-submission destination; `coralwatch-queue.json` holds 8 pending), IMOS/AODN, WRI Reefs at Risk, Ocean Health Index, IPCC SROCC
- **Species supporting refs**: OBIS-SEAMAP, **Happywhale**, **REEF** (raw-data outreach is HIGH priority — would move to a fish-biomass feed), Ocean Tracking Network, WoRMS, FishBase, Atlas of Living Australia
- **Protection / operator refs**: Green Fins
- **Travel-industry context**: DEMA, SSI

## Tier 4 — Per-site evidence sources (~14) · the named study behind one reef

Added as the citation behind a specific location's reef-state or recovery story, not a feed:
- Med MPAs: **Melià et al. 2020** (Torre Guaceto), **Guidetti et al. 2014**
- Honduras / Tela Bay: Coral Reef Alliance, Operation Wallacea, Mongabay 2025
- Wakatobi: Operation Wallacea long-term, Hamdani et al. 2024, Ocean Science Journal 2024 (Kaledupa)
- Philippines: Oceana Panaon 2020, Coral Cay Conservation (Southern Leyte), LAMAVE (Sogod Bay)
- Derawan: ResearchGate recruitment record, MDPI Sensors 2024, WWF Indonesia

---

## Reef-health label — the pillar-to-source map, at a glance

| Pillar | Role | Live source | Ingested / static sources | Freshness |
|---|---|---|---|---|
| **Coral cover** | State | MERMAID (weekly) | AIMS, GCRMN, AGRRA, Reef Check, NCRMP, GBRMPA, Allen Coral Atlas | Mixed — live chart, static label |
| **Fish biomass** | State | **none** | RLS / IMOS-AODN (57 sites) | **Static — the freshness gap** |
| **Thermal stress** | Pressure | NOAA CRW (daily) | — | Live, best covered |
| **Fishing pressure** | Pressure | GFW (daily) | MPAtlas, WDPA, Blue Parks, reef gravity (derived) | Live effort + static protection |

---

## Two fixes this surfaces

1. **The method panel should name the live feeds, not only the academic papers.** Add a short "our live data" line: thermal stress refreshes daily from NOAA Coral Reef Watch, fishing effort daily from Global Fishing Watch, coral cover weekly from MERMAID. That is the credibility the static citations do not carry.
2. **The live count is already correct.** `getLiveSourceCount()` filters `ingestion === "live"` straight from `sources.json`, so it self-updated to **7** when OBIS was marked live. No code change needed. Just make sure any hand-written "6 live feeds" copy on the /data page is updated to 7.
