# Data sources, in plain language

_A deep dive for Josie. Written 2026-07-08. This builds on `.claude/data-sources-usage-report.md` and corrects a few things in it after tracing every claim through the actual code. This is analysis only. No source or data files were changed._

---

## The one-paragraph version

Scuba Season lists 65 sources on the /data page. Only 6 of those are wired to pull fresh data on a schedule. The other 59 are either real data we loaded once and left in place (about 22 of them), or names we credit as the reference behind a method without pulling a single value from them yet (exactly 37 of them). I confirmed the 37 number by scanning every data file in `src/data/` for each source id: 37 of them appear nowhere as the origin of any value on the site. The /data page is honest about this. It says "6 of these are live data feeds," and that number comes straight from the code. But there is one soft spot worth knowing about, and the live feeds are not all equally live. Details below.

---

## Question 1: what does "ingested" actually mean?

"Ingested" means a value on the site can be traced back to a real record from a named source. There are two flavors, and the difference matters.

### Flavor A: a live feed (traced end to end)

Take **species richness from iNaturalist**. This is a genuinely live feed and a clean example of the full flow:

1. **The source.** iNaturalist is a citizen-science site where divers and naturalists upload photos of what they saw. Other people confirm the species until it reaches "research grade."
2. **The script.** [`scripts/fetch-species-diversity.mjs`](scripts/fetch-species-diversity.mjs) reads every location in `src/data/locations.json`, and for each one calls the iNaturalist API endpoint `https://api.inaturalist.org/v1/observations/species_counts` with the location's latitude and longitude and a 30 km radius. It asks: how many distinct research-grade species have been logged near here?
3. **The data file.** It writes the answer to [`src/data/species-diversity.json`](src/data/species-diversity.json). Each entry looks like this:
   ```json
   { "locationId": "addu-atoll", "speciesRichness": 266, "radiusKm": 30,
     "qualityGrade": "research", "source": "inaturalist", "fetchedAt": "2026-07-07" }
   ```
   Note the two honesty markers: `source` (where it came from) and `fetchedAt` (when we last pulled it).
4. **The schedule.** [`.github/workflows/fetch-species-diversity.yml`](.github/workflows/fetch-species-diversity.yml) runs that script automatically every Tuesday at 07:00 UTC (`cron: "0 7 * * 2"`) and pushes the refreshed file straight to the main branch, which auto-deploys. So a burst of new iNaturalist logs near a reef raises that reef's "species richness" number within a week, with no human involved.
5. **The page.** The location page ([`src/app/locations/[slug]/page.tsx`](src/app/locations/[slug]/page.tsx)) imports this through `@/lib/data/species-diversity` and renders the richness figure.

That is the whole loop: **iNaturalist API → fetch-species-diversity.mjs → species-diversity.json → location page.** A real observation upstream changes a real number on the site.

The other genuinely live feeds work the same way, each with its own script, file, and nightly-or-weekly schedule that pushes to main:

| Source | Script | Data file | Cadence | Feeds |
|---|---|---|---|---|
| NOAA Coral Reef Watch | `fetch-reef-health-live.mjs` | `reef-health.json` | daily 06:30 UTC | heat-stress / bleaching-alert read |
| Global Fishing Watch | `fetch-fishing-pressure.mjs` | `fishing-pressure.json` | daily 07:00 UTC | fishing-pressure band |
| IUCN Red List | `fetch-iucn-status.mjs` | `iucn-status.json` | weekly Mon 07:10 UTC | conservation status per species |
| MERMAID | `fetch-mermaid-coral-cover.mjs` | `coral-cover-series.json` | weekly Mon 07:00 UTC | observed coral-cover trend |
| iNaturalist | `fetch-species-diversity.mjs` | `species-diversity.json` | weekly Tue 07:00 UTC | species richness per site |

All five carry `fetchedAt` and `source` on every record. I confirmed `reef-health.json`, `fishing-pressure.json`, and `iucn-status.json` were each last committed by their own automated job on 2026-07-07 or 2026-07-08 with messages like "nightly NOAA CRW thermal-stress refresh." These are real and current.

> **Correction to the earlier report.** It said MERMAID feeds `coral-cover.json`. It does not. MERMAID feeds **`coral-cover-series.json`** (a multi-year coral-cover series per location, tagged `"sourceId": "mermaid"`). `coral-cover.json` is a different, static file — see Flavor B.

### Flavor B: ingested once via backfill (the difference)

Now take a **coral reef survey like NCRMP / AGRRA**. This is ingested, but not live. The flow stops earlier:

1. Someone (or a one-time script) reads published survey reports and records the numbers by hand.
2. Those numbers sit in [`src/data/coral-cover.json`](src/data/coral-cover.json). The file even says so in its own header comment: _"Jurisdiction-mean coral cover from public NCRMP (NOAA) and AGRRA reports. Built by scripts/fetch-coral-cover.mjs. Each entry cites a published source... lastReviewedAt is when the citation was last verified by hand."_ A typical entry:
   ```json
   { "id": "florida-keys", "program": "NOAA NCRMP",
     "current": { "year": 2022, "coverPercent": 6.7 },
     "historical": { "year": 2014, "coverPercent": 6.2 },
     "sourceUrl": "https://repository.library.noaa.gov/view/noaa/55949" }
   ```
3. There is a script and even a monthly workflow, but it does not hit a live data API for a value. It is a citation-refresh: the coral-cover numbers are fixed at the year of the published report (2022, 2014). A new dive near Florida Keys does nothing to this file. It only changes when a human finds a newer published report.

The same "loaded once, then static" pattern covers the regional coral series from **GCRMN** (in `coral-cover-regional.json`, decadal points like 1983 → 2019), the wreck histories from **DANFS** and **NOAA Maritime Heritage** (`wrecks.json`), the protection signals from **Blue Parks** and **MPAtlas** (`blue-parks.json`, `reef-pressure.json`), and the megafauna photo-ID references from **Wildbook** and **Manta Trust** (`sightings.json`).

**The plain-English difference:** a live feed re-answers its question on a timer. A backfilled source answered its question once, and the answer stays put until a person updates it. Both are legitimate. Backfill is fine for things that barely change (a 1943 shipwreck, a survey published in 2022). It is weaker for anything time-sensitive.

### The soft spot you should know about

The most-quoted example of "live ingestion" is actually the shakiest one in production right now. There is a live **sightings** pipeline: [`scripts/fetch-sightings-live.mjs`](scripts/fetch-sightings-live.mjs) queries iNaturalist (with GBIF as a fallback) for each site and species, computes "last confirmed," "recent record count," and seasonality months, and is scheduled weekly. But two things are true:

- The committed [`src/data/sightings.json`](src/data/sightings.json) is still the **old synthetic snapshot**, not live output. Every one of its 442 records lists `sourceIds: ["gbif", "obis"]` and carries **none** of the live markers (`source`, `fetchedAt`, `verified`, `obsId`) that the live script writes. Its last real commit was 2026-06-15.
- The reason it lags: unlike the five feeds above, [`.github/workflows/fetch-sightings.yml`](.github/workflows/fetch-sightings.yml) does **not** push to main. It **opens a pull request** for human review each week. That review PR has not been merged, so the synthetic data is what ships.

This is a deliberate safety gate (citizen-science records deserve a human glance before they go live), not a bug. But it means the /data page's line that sightings are "ingested live so a fresh log counts right away" is currently aspirational for the sightings panel specifically. The iNaturalist **richness** feed (Flavor A above) is genuinely live; the iNaturalist/GBIF **sightings** feed is built, scheduled, and waiting on a merge.

> **Update (2026-07-08).** Two things were done after this section was first written:
> 1. **The real reason the PR sits is deeper than "unmerged."** The sightings workflow **times out at GitHub's 6-hour job ceiling on every run** — the ingest now makes one paced call per queryable pair, and there are 10,079 pairs (400+ minutes), so the job is cancelled before it can produce a fresh PR. Pull request #23 is 3-week-old data from the last run that happened to finish.
> 2. **Both are now addressed.** The /data page was corrected to say **5 live feeds, not 6** (GBIF's only live path was this broken pipeline) in [PR #40], and a fix that shards the ingest into 6 parallel jobs so it completes well under 6 hours is in [PR #41]. Once #41 merges and the workflow runs, the sightings refresh completes and can be reviewed and merged normally — restoring GBIF to a genuine 6th live feed.
>
> [PR #40]: https://github.com/bmadninja/scuba/pull/40
> [PR #41]: https://github.com/bmadninja/scuba/pull/41

Practical read: of the 6 advertised live feeds, 5 are fresh in production today (NOAA CRW, GFW, IUCN, MERMAID, iNaturalist richness). GBIF is the weakest of the six, because its only live pathway is that pending sightings pipeline.

---

## Question 2: what does "credited" mean, and why are we not using them?

"Credited" means a source is named in [`src/data/methodologies.json`](src/data/methodologies.json) as one of the references behind a published claim type, and it is listed on the /data credits page, but **no value on the site actually comes from it.** I verified this the hard way: I scanned all 27 data files in `src/data/` and counted how many times each of the 65 source ids appears as the origin of a value. Exactly **37 ids scored zero.** Not one value on the site traces to them.

Here are four, each confirmed to have (a) no fetch script, (b) no appearance in any data file as provenance, and (c) a specific claim it is supposed to back:

### Copernicus Marine Service
- **Credited against:** the `dive-conditions-forecast` claim (wave, wind, current, water temp) and the `reef-health-aims-noaa` claim, in `methodologies.json`.
- **Supposed to back:** near-real-time and forecast sea-surface temperature, currents, chlorophyll, oxygen, pH. Its own note in `sources.json` calls it "the best single source for live anomaly cards on location pages."
- **Reality:** zero provenance, no fetch script. The entire forecast layer it belongs to is unbuilt — there are no "conditions" cards on location pages at all.
- **Why:** **auth-gated.** Copernicus Marine requires a registered account and a credentialed API (the Toolbox / MOTU download service), not a simple open URL. Combined with the fact that the whole conditions feature is not yet built, this is a not-yet-built-and-gated source.

### ERA5 reanalysis (via Copernicus Climate Data Store)
- **Credited against:** `dive-conditions-forecast` — specifically the "typical conditions in October at this location" climatology framing.
- **Supposed to back:** hourly historical atmosphere-and-ocean reanalysis back to 1940.
- **Reality:** zero provenance, no fetch script.
- **Why:** **hard.** ERA5 needs a Climate Data Store API key, a licence acceptance step, and downloads huge gridded files (GRIB/NetCDF) that must be subset and averaged. This is a real engineering job, not a quick REST call.

### GEBCO bathymetry grid
- **Credited against:** the `wreck-history-bathymetry` claim (depth context at walls, drop-offs, pinnacles).
- **Supposed to back:** ocean-floor depth at any dive site.
- **Reality:** zero provenance, no fetch script. Depth context on site pages, where present, comes from the site records themselves, not from GEBCO.
- **Why:** **medium — open but bulky.** GEBCO is free and public domain (CC0), so no auth barrier. But it ships as a global gridded dataset (NetCDF) or map tiles, not a "give me the depth at this point" API. Turning it into a per-site depth number means downloading and sampling the grid. Doable, just not wired.

### NCEI Marine Microplastics
- **Credited against:** the `water-quality-pollution` claim (alongside 7 other pollution/chemistry networks).
- **Supposed to back:** "how plasticky is this water" framing at coastal sites.
- **Reality:** zero provenance, no fetch script. And here is the sharpest example of the gap: the file that this claim ostensibly produces, [`src/data/water-quality.json`](src/data/water-quality.json), is populated **entirely** by `editorial-curation` (23 entries), plus a few reef-survey citations (`gcrmn`, `icri`, `reef-check`). **None** of the 8 pollution networks it credits — NCEI Microplastics, NOAA ERMA, EMODnet Chemistry, HAB Forecast, HAEDAT, GOA-ON, Mussel Watch, Global Mangrove Watch — contribute a single value. The water-quality panel is hand-written editorial with a scientific reference list attached, not an ingest of those networks.
- **Why:** **not-yet-built.** The pollution layer was scoped and credited, but the data plumbing was never built; editorial content stands in for it.

### The honest summary of "why not"

The 37 credited sources fall into four "why not" buckets:

1. **The feature they belong to is not built yet** (the conditions/forecast layer, the pollution/water-quality layer). Most of the 37 are here. The methodology entry, confidence level, and limitations text are all written — the pipeline simply does not exist.
2. **Auth-gated or paywalled** access (Copernicus Marine, ERA5/CDS, parts of IMOS/AODN, Ocean Tracking Network).
3. **Open but heavy** — big grids or model outputs that need real processing (GEBCO, HYCOM, Argo, NASA PO.DAAC, NASA Ocean Color, ECMWF).
4. **Not really "feeds" at all** — reference reports and trade bodies that exist to be cited, not queried (IPCC SROCC, WRI Reefs at Risk, Ocean Health Index, DEMA, SSI). These will likely always be credited-only, and that is correct.

Importantly, this is a roadmap-and-integrity layer, not padding. `methodologies.json` already writes down, for each unbuilt claim, exactly what it should be sourced from, at what confidence, with what limitations. That is a good discipline: it says what "done" looks like before the work is done.

---

## Question 3: is listing 64 credited sources honest?

Mostly yes, with one line to watch.

**What the /data page actually does.** The count is not hard-coded. [`src/app/data/page.tsx`](src/app/data/page.tsx) calls `getLiveSourceCount()` and `getExternalSourceCount()` from [`src/lib/data/sources.ts`](src/lib/data/sources.ts). The live count returns `sources.filter(s => s.ingestion === "live").length`, which is exactly **6**. The external count excludes only the internal `editorial-curation` tag, giving **64**. So the numbers on the page are computed from the same data file this whole analysis is based on — they cannot silently drift.

**The honest part.** The page's key sentence reads: _"6 of these are live data feeds we pull automatically on a schedule: NOAA Coral Reef Watch, Global Fishing Watch, iNaturalist, GBIF, the IUCN Red List and MERMAID... The rest are the peer reviewed and government datasets we credit and build our methodology on, plus our own editorial notes where we say so."_ That is a fair and clear statement of the live-vs-credited split. It does **not** claim all 64 are live. A reader is told plainly that 6 are feeds and the rest are references. That is the honest framing, and it is good.

**The two lines to watch:**

1. **GBIF is named in the live-6 list, but its only live path is the pending sightings PR** (see Question 1's soft spot). If challenged, "iNaturalist and GBIF are live" is defensible for iNaturalist (richness ships weekly) but thin for GBIF today. Merging the sightings refresh PR would make this fully true. Until then, the cleanest claim is "5 feeds are live in production, a 6th (live sightings) is scheduled and pending review."
2. **"Live" describes the pipe, not the freshness of every panel.** The sightings panel a visitor sees is still the synthetic snapshot even though the sightings pipeline is "live." Nobody is lied to, but the word "live" is doing more work than the shipped data supports for that one panel.

Neither is a false statement on the page as written. They are places where the story is one merge away from matching the words. **The number to lead with externally is 6 live feeds, never 64.** Conflating 64 credited sources with "64 live data feeds" would be the single claim on that page that does not survive scrutiny — but the page does not currently make that mistake.

---

## Question 4: the upgrade path — quick wins vs genuinely hard

Of the 37 credited-only sources, here is how much work each would take to become a real ingested feed, grouped so you can see the quick wins. The test for "quick" is: open REST API, no login, and it answers a per-location question directly.

### Quick wins (open REST, no auth, per-point) — do these first
- **OBIS** — a marine occurrence database with an open API nearly identical to GBIF, which we already ingest. Turning it live is basically copying the GBIF fallback we already wrote. High value (it strengthens sightings and seasonality), low effort.
- **USGS Earthquake Catalog** — clean open REST, filter by coordinate and radius. Would back the "sits near an active fault" line at Indonesia/Japan/Philippines/Aegean sites.
- **NOAA Tides & Currents (CO-OPS)** — open REST, no key. Easy to wire; the catch is coverage is US-only, so it helps a minority of sites.
- **NOAA CoastWatch / OceanWatch** — served through ERDDAP, which is genuinely per-coordinate friendly (you can request a value at a lat/lng). One of the easier ways to get real SST / chlorophyll onto location pages.
- **Atlas of Living Australia** — GBIF-style open API; easy, but only useful for Australian / Coral Sea sites.
- **Smithsonian Global Volcanism Program** and **WoRMS / FishBase** — small or open reference APIs; easy to pull, but lower user-facing payoff (context and taxonomy rather than a headline number).

### Medium lift (open, but bulk or grid data that needs processing)
- **GEBCO** (depth grid — download once, sample per point)
- **NOAA NDBC** buoys (open real-time text feeds, but sparse station coverage)
- **IBTrACS** (open cyclone-track archive — download and spatially filter; mostly a one-time job that rarely changes)
- **Global Mangrove Watch**, **HAEDAT**, **NASA Ocean Color**, **NASA PO.DAAC** (open, but large satellite/registry data needing subsetting)

### Genuinely hard (auth-gated, paywalled, or heavy models)
- **Copernicus Marine** and **ERA5** — account + credentialed API + large downloads. These are the anchor sources for the whole conditions/forecast feature, so building that feature means taking these two on.
- **ECMWF Open**, **HYCOM**, **Argo**, **IMOS/AODN** — large model or profile outputs over specialist protocols (GRIB, THREDDS).
- **Ocean Tracking Network**, **REEF**, **Happywhale**, **CoralWatch**, **Green Fins** — restricted, permission-based, or simply have no public read API for our use. Several of these are better approached as **partnerships** than as scrapes. (CoralWatch and MERMAID also appear on the "submit once, we push to platforms" routing in the upload flow — that is us writing *to* them, separate from ingesting *from* them.)
- **EMODnet Chemistry**, **GOA-ON**, **NOAA Mussel Watch**, **NOAA ERMA**, **NOAA HAB Forecast** — the water-quality/pollution set. A mix of portals, WFS services, and regional bulletins; collectively a real project, which is why the water-quality panel is editorial for now.

### Not really feeds (leave as credited references)
- **IPCC SROCC**, **WRI Reefs at Risk**, **Ocean Health Index** — static peer-reviewed reports and annual scores. Correct to cite, wrong to treat as live feeds.
- **DEMA**, **SSI**, **PADI** — trade and training bodies, used for context and skill-level language, not data.
- **OpenSeaMap** — tiles, useful only as a cross-reference overlay.

**If you want the single highest-return move:** merge the sightings pipeline fix ([PR #41](https://github.com/bmadninja/scuba/pull/41)), let the sharded workflow run, and merge the fresh-data PR it opens — that makes the 6th feed (GBIF/iNaturalist sightings) genuinely live. Then wire **OBIS** on the same sharded machinery (near-free given GBIF is done). Those turn the live story into 7 real feeds with almost no new engineering. After that, the biggest *new* capability is the conditions layer, but that means committing to the hard Copernicus/ERA5 work.

---

## What I corrected from the first report

For the record, tracing every claim to code turned up three things the earlier `data-sources-usage-report.md` got wrong or glossed:

1. **MERMAID feeds `coral-cover-series.json`, not `coral-cover.json`.** `coral-cover.json` is static NCRMP/AGRRA backfill.
2. **The live sightings claim is overstated.** The committed `sightings.json` is still the synthetic snapshot; the live iNaturalist/GBIF sightings ingest is scheduled but gated behind an unmerged review PR. The genuinely live iNaturalist feed in production is species *richness* (`species-diversity.json`), which the first report did not mention.
3. **Minor count drift.** GCRMN provenance is 48 records, not 38 (the first report undercounted). The headline tier split — 6 live, ~22 ingested-static, 37 credited-only, 65 total — is otherwise correct and now independently verified by scanning every data file.
