---
title: scubaSeason.fun — Outreach Email Kit (intro · data use · the ask)
status: final
created: 2026-06-09
author: Mary (Business Analyst)
companion: gtm-outreach-reef-atlas-2026-06-09.md
purpose: >
  The reusable email structure for reaching the orgs whose data we already use:
  (1) introduce Josie and why she built it, in the About page voice, (2) acknowledge
  how we already use their data, (3) make a specific, researched ask grounded in a
  real mechanism each org actually offers. No hyphens in any copy (em dashes only).
---

# Outreach Email Kit

Every email has the same three beats. Beat 1 is fixed (your story). Beat 2 is one line
(how we use their data — pulled from `sources.json`). Beat 3 is the researched ask for that
org. Keep it short: intro, one line of data use, one or two concrete asks, one line to close.

---

## Beat 1 — the intro (reusable, your words, from About)

> Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean, frustration from
> planning my own dive trips, and a real concern for what warming water is doing to the corals.
>
> As a diver, the questions I could never answer from a static guide were simple: what is in
> season right now and where can I contribute by taking photos, how is warming affecting the
> specific reef I want to visit, when was a species last seen and what are my real chances of
> seeing it, and which reefs will be gone sooner rather than later so I can prioritize my trips
> with real data instead of guessing. So I built the site I wished existed — a free, public,
> nonprofit reef atlas that a person with zero science background can read like a map.
>
> I am reaching out because the whole atlas is built on public scientific data, yours included,
> and it credits every source openly. I would rather that be a relationship than a one way pull.

**Shorter variant (for forums, DMs, busy inboxes):**

> Hi, I am Josie. I built scubaSeason.fun, a free public nonprofit reef atlas, out of love for
> the ocean and frustration that no one place answered a diver's real questions: what is in
> season, how warming is hitting a specific reef, what I am likely to see, and which reefs are
> slipping fastest. It is built entirely on public science, yours included, and credits every
> source. I would like to make that a relationship rather than a one way pull.

---

## Beat 2 — how we already use your data (one line, pick the org)

| Org | Drop in line |
|---|---|
| **NOAA Coral Reef Watch** | "We use your SST, Degree Heating Weeks, and bleaching alerts as the heat signal behind every reef's plain language state." |
| **CoralWatch** | "We use your Coral Health Chart observations to show bleaching at reefs that have little other monitoring." |
| **REEF** | "We use your Volunteer Fish Survey records to tell divers which species have actually been seen at a site and their real chances of seeing them." |
| **iNaturalist** | "Your research grade observations are our live sightings feed — the recently logged and last seen on every site come from iNaturalist." |
| **Reef Check** | "We use your surveys for observed reef condition wherever local monitoring exists." |
| **Allen Coral Atlas** | "We use your reef habitat maps and bleaching detection to ground what a reef actually is and where it sits." |
| **AIMS LTMP** | "We use your Great Barrier Reef coral cover record to show honest trend lines on Australian reefs." |
| **AGRRA** | "We use your Caribbean reef assessments for coral cover and bleaching across the region." |
| **Global Fishing Watch** | "We use your fishing effort data to show pressure near a reef and to support the Under pressure label." |
| **IUCN Red List** | "We carry each animal's conservation status from your assessments, spelled out in plain language for divers." |
| **Manta Trust / Wildbook / Happywhale** | "We use your photo ID records to show site fidelity, return visits, and seasonality for the animals divers most want to see." |
| **MERMAID / ReefCloud / CREMP** *(not yet used)* | "We do not use your data yet, and we would like to — it closes the biggest gap we have." |

---

## Beat 3 — the ask (researched, per org)

The recurring ask types, generalized into one menu, then the specific asks per org.

### The ASK MENU (six moves; most orgs map to two or three)

1. **Proper data access.** Move us onto your official API or feed so we stop scraping and pull
   the exact, current data — NOAA ERDDAP, ACA via Earth Engine, GFW API token, GBIF download
   API, IUCN API token, MERMAID `mermaidr`, ReefCloud export.
2. **Enrol us as a formal data user / partner.** The standing agreement that states our nonprofit,
   non commercial intent — AIMS download form, GBIF Data User Agreement, GFW registration, the
   Ambassador and Partner programs.
3. **Review our method.** Have your science team confirm we translate your heat, cover, effort, or
   status data into our reef state labels and encounter odds accurately, so we never misstate you.
4. **Secure non commercial permission in writing.** For the restricted licenses — REEF, Happywhale,
   Manta Trust, IUCN — confirm our use qualifies and document it.
5. **Wire the contribution handoff.** Give us the deep link or API that drops a diver straight into
   your own submission flow, pre scoped to the reef — iNat Collection projects, REEF zone lookup,
   MantaBase, CoralWatch chart, the PADI AWARE Conservation Action Portal.
6. **Point us at your gaps, and co promote.** Tell us where you need observers so our "needs fresh
   eyes" surfacing serves your priorities, list us as a featured data user, and share to your base.

### Bucket A — data providers (asks grounded in real mechanisms)

| Org | The specific ask | Mechanism it rides on |
|---|---|---|
| **NOAA Coral Reef Watch** | "Confirm we should pull the daily global 5km CoralTemp SST, DHW, and Bleaching Alert Area via your CoastWatch ERDDAP / PacIOOS THREDDS endpoints, and have your team sanity check how we map DHW thresholds (4 and 8 degree weeks) onto our three reef states." | [ERDDAP data delivery](https://coralreefwatch.noaa.gov/product/5km/tutorial/crw04b_data_delivery.php); [5km methodology](https://coralreefwatch.noaa.gov/product/5km/methodology.php) |
| **Allen Coral Atlas** | "Confirm our CC BY 4.0 attribution string and whether we should consume your v2.0 habitat layers through Google Earth Engine, and tell us how to surface your published accuracy (69% geomorphic, 66% benthic) honestly." | [ACA resources](https://allencoralatlas.org/resources/); [Earth Engine asset](https://developers.google.com/earth-engine/datasets/catalog/ACA_reef_habitat_v2_0) |
| **AIMS LTMP** | "Process our data download request (nonprofit, non commercial, public display with attribution), and confirm whether reef level and sector series are available programmatically from the Reef Dashboard so our GBR trend lines stay current." | [eAtlas LTMP](https://eatlas.org.au/gbr/ltmp-data) |
| **AGRRA** | "Confirm the CC BY 4.0 attribution wording and whether we can pull your Data Explorer layers via the ArcGIS FeatureServer endpoints, and review how we collapse your fish, benthic, and coral metrics into one public reef state." | [AGRRA Data Explorer](https://agrra-data-explorer-oref.hub.arcgis.com/) |
| **Global Fishing Watch** | "Confirm our self registered API token covers nonprofit non commercial display, point us to the Research Accelerator Program for finer resolution near reefs, and review how we turn apparent fishing effort into an Under pressure signal." | [GFW APIs portal](https://globalfishingwatch.org/data/our-apis-portal/) |
| **GBIF** | "We will use the occurrence download API so every pull carries a DOI, register a Derived Dataset for our filtered subset, and cite publishers per your Data User Agreement — can our national Participant Node review and feature the reuse." | [Data User Agreement](https://www.gbif.org/terms/data-user); [derived datasets](https://data-blog.gbif.org/post/derived-datasets/) |
| **IUCN Red List** | "Issue us an API token and confirm our free public atlas qualifies as non commercial, and confirm we are using your category names correctly in plain language copy." | [Red List API](https://api.iucnredlist.org/); [Terms of Use](https://www.iucnredlist.org/terms/terms-of-use) |

### Bucket B — citizen science / contribution handoff (asks)

| Org | The specific ask | Mechanism it rides on |
|---|---|---|
| **iNaturalist** | "Bless us standing up a scubaSeason Umbrella project of per reef Collection projects so our Log this dive button deep links into the right reef's project, confirm the read API pattern for live per place counts, and let us join the Ambassador program." | [iNat projects](https://help.inaturalist.org/en/support/solutions/articles/151000176472-understanding-projects-on-iNaturalist); [API](https://www.inaturalist.org/api) |
| **Reef Check** | "List us as a referral path to the nearest EcoDiver training facility per dive site, give us (or bless us scraping) your country survey coverage so we can flag reefs with thin Reef Check coverage as needing eyes, and sanity check our indicator species framing." | [Coordinators & Teams](https://www.reefcheck.org/tropical-program/coordinators-and-teams/); [Global Reef Tracker](https://www.reefcheck.org/global-reef-tracker/) |
| **REEF** | "Wire our log fish here deep link into your Geographic Zone site lookup, give us written non commercial permission plus a site level frequency feed to validate our encounter odds, and review our odds method against your sighting frequency reports." | [Data entry](https://www.reef.org/reef-survey-data-entry-program-instructions); data@REEF.org |
| **CoralWatch** | "Let us deep link the Coral Health Chart submission from our location pages, apply to your Ambassador program with a scubaSeason logs coral health project, and share chart derived data for reefs we cover." | [Monitoring](https://coralwatch.org/monitoring/); [Ambassadors](https://coralwatch.org/ambassadors/) |
| **PADI AWARE** | "Deep link our contribute flow into the Conservation Action Portal for Dive Against Debris and the 2026 Global Shark & Ray Census, pull the Adopt the Blue map as a stewardship layer, and surface census data gaps so we point divers at under observed reefs." | [AWARE Sharks](https://www.padi.com/aware/sharks); [Adopt a Dive Site](https://padi.com/aware/adopt-a-dive-site) |
| **Manta Trust** | "Deep link manta encounters into the MantaBase submission form, tell us which affiliate project regions most need observers so our needs eyes pins match your priorities, and grant permission to show aggregate manta presence." | [MantaBase submission](https://www.mantatrust.org/mantabase-submission-form); [Affiliate Projects](https://www.mantatrust.org/our-affiliate-projects) |
| **Wild Me / Wildbook** | "Deep link shark, ray, and manta encounters into Sharkbook and Manta Matcher, use your export API for per site individuals seen here counts, and confirm data terms for the photo ID tractable species." | [Sharkbook](https://www.sharkbook.ai/); [Wildbook on GitHub](https://github.com/WildMeOrg/Wildbook) |
| **Happywhale** | "Deep link cetacean encounters from our coastal sites into your submission flow, secure explicit non commercial permission for presence and track data, and use your documented endpoints for whales seen near here and seasonality." | [happywhale.com](https://happywhale.com/); [OBIS-SEAMAP record](https://seamap.env.duke.edu/partner/Happywhale) |

### Bucket C — coral cover data partners (asks; this closes the 2 point gap)

| Org | The specific ask | Mechanism / license |
|---|---|---|
| **CREMP (Florida FWC)** | "Confirm we may ingest your CREMP CSVs and render station level stony coral cover back to the 1990s, attributed as Florida Fish and Wildlife Conservation Commission produced, and point us to canonical download URLs and the update cadence." | Public domain bulk CSV; [CREMP data](https://myfwc.com/research/habitat/coral/cremp/data/); Corals@MyFWC.com — **easiest, richest win** |
| **MERMAID (WCS)** | "We will pull Public and Public Summary benthic cover via mermaidr on a schedule and show your generated citation and logo on each chart — confirm that matches your terms, and could WCS nudge partner projects in our regions to set surveys to Public Summary." | API + `mermaidr`; no permission needed for Public tiers; [data sharing](https://datamermaid.org/documentation/collect-project-data-sharing) — **scalable win for SE Asia / W Indian Ocean** |
| **ReefCloud (AIMS)** | "Grant a standing API key or periodic site level Point Summary export of hard coral cover by year for open access projects in our regions, confirm which projects are flagged fully open, and tell us the attribution lockup you want." | Open Creative Commons NonCommercial; export + gated API; reefcloud@aims.gov.au — **Indo Pacific + GBR** |
| **GCRMN nodes** | "May we reproduce your published regional status and trends figures with full credit, confirm which collated datasets are Public on MERMAID or ReefCloud so we pull site level data legitimately, and connect us to regional node coordinators so our diver observations feed the next Status report." | Reports public; raw data behind Data Sharing Agreements; jeremywicquart@gmail.com, thomas.dallison@icriforum.org — **regional context layer** |

---

## Fully assembled example emails

Four worked examples showing the three beats wired together. Replace the signature line and verify
any named address before sending.

### Example 1 — NOAA Coral Reef Watch
**To:** Caroline Donovan (Caroline.Donovan@noaa.gov), Communications Director, NOAA Coral Reef Conservation Program — or the general inbox coralreefwatch@noaa.gov
**Subject:** A free nonprofit reef atlas built on Coral Reef Watch — two quick asks

Hi Caroline,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean, frustration from planning
my own dive trips, and a real concern for what warming water is doing to the corals. It is a free,
public, nonprofit reef atlas that a person with zero science background can read like a map. I am
reaching out because the whole atlas is built on public science, yours included, and credits every
source openly. I would rather that be a relationship than a one way pull.

We use your SST, Degree Heating Weeks, and bleaching alerts as the heat signal behind every reef's
plain language state, which we label Thriving, Under pressure, or Witnessing change.

Two asks. First, could you confirm we should pull the daily global 5km CoralTemp SST, DHW, and
Bleaching Alert Area through your CoastWatch ERDDAP and PacIOOS THREDDS endpoints, so we source the
right product version rather than scraping. Second, would your team sanity check how we map your DHW
thresholds, the 4 and 8 degree week marks, onto those three states, so we describe your data accurately
to the public.

We take no commission and sell nothing. Thank you for the work behind these products.

Warmly,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 2 — REEF (non commercial data; named contact)
**Subject:** We already show your fish surveys to divers — making it a relationship

Hi Dr Pattengill-Semmens,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean and frustration that no one
place answered a diver's real questions: what is in season, what I am actually likely to see, and
which reefs are slipping fastest. It is a free public nonprofit reef atlas, and it is built on public
science, yours included, with every source credited. I would rather that be a relationship than a one
way pull.

We use your Volunteer Fish Survey records to tell divers which species have actually been seen at a
site and their real chances of seeing them.

Three asks, in order of usefulness to us. Could we wire a log fish here link into your Geographic Zone
site lookup so a diver lands on the correct REEF site record. Could you grant written non commercial
permission for our use, ideally with a site level sighting frequency feed so we can validate our
encounter odds against your method. And would you review how we phrase odds of seeing a species against
your sighting frequency reports, so we represent your data within its limits.

We are a nonprofit, no revenue, no commission. Thank you for the decades of work behind this dataset.

Best,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 3 — iNaturalist (our live backbone)
**Subject:** scubaSeason runs on iNaturalist — a handoff idea and the Ambassador program

Hi Tony,

Hi, my name is Josie. I built scubaSeason.fun, a free public nonprofit reef atlas, out of love for the
ocean and a wish that a diver could see where their photos would actually matter. It is built on public
science, and iNaturalist is the heart of it.

Your research grade observations are our live sightings feed — the recently logged and last seen on
every dive site come from iNaturalist, and our whole contribute story walks a diver from a dive photo
into iNaturalist, on to GBIF, and into the assessments behind a species status.

Three asks. Would you bless us standing up a scubaSeason Umbrella project of per reef Collection projects,
so our Log this dive button deep links a diver into the right reef's project instead of a blank upload.
Could you confirm the read API pattern for pulling live research grade counts per place and taxon, which
powers our needs fresh eyes surfacing. And we would love to join the Ambassador program so this is a named
relationship, not anonymous API use.

No commission, nothing sold. Happy to share our handoff flow first.

With thanks,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 4 — CREMP / Florida FWC (closes the coral cover gap; public domain)
**Subject:** Using CREMP long term cover in a free public reef atlas

Hello CREMP team,

Hi, my name is Josie. I built scubaSeason.fun out of a real concern for what warming water is doing to
the corals, and a frustration that most dive guides show a reef as a fixed pretty place rather than
something that is changing. It is a free public nonprofit reef atlas, built on public science and crediting
every source.

I will be honest that we do not use your data yet, and we very much want to. Our biggest gap is coral cover
over time: for many Florida reefs we hold only two survey points, which is too thin to tell an honest story
of decline or recovery. Your multi decade record for the Keys, Southeast Florida, and the Dry Tortugas is
exactly the depth we need.

Two asks. Could you confirm we may ingest the CREMP CSVs and render station level stony coral cover back to
the 1990s, attributed as Florida Fish and Wildlife Conservation Commission produced with your suggested
citation. And could you point us to the canonical download URLs and the update cadence so we re pull each
new survey year automatically rather than scraping the dashboard.

With appreciation,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 5 — CoralWatch (data we use; Ambassador program)
**To:** Monique Grol (m.grol@uq.edu.au — verify on coralwatch.org/about before sending), Project Manager, CoralWatch — or info@coralwatch.org
**Subject:** Your Coral Health Chart data is on a free reef atlas — a handoff idea

Hi Monique,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean and a real concern for what
warming water is doing to the corals. It is a free public nonprofit reef atlas that a person with zero
science background can read like a map. It is built on public science, yours included, and credits
every source. I would rather that be a relationship than a one way pull.

We use your Coral Health Chart observations to show bleaching at reefs that have little other monitoring,
which feeds how we label a reef Thriving, Under pressure, or Witnessing change.

Three asks. Could we deep link the Coral Health Chart submission from our location pages, so a diver can
log a reef's colour score in the moment. Could I apply to your Ambassador program with a scubaSeason logs
coral health outreach project. And could you share chart derived data for the reefs we cover, which would
help close the thin coral cover record we have at many sites today.

We take no commission and sell nothing. Thank you for fifteen years of volunteer bleaching data.

Warmly,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 6 — Reef Check (data we use; EcoDiver referral)
**Subject:** Sending divers who want to go deeper toward EcoDiver

Hi Dr Freiwald,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean and frustration that a diver had
no single place to understand the reef they were about to visit. It is a free public nonprofit reef atlas,
built on public science, yours included, with every source credited. I would rather that be a relationship
than a one way pull.

We use your surveys for observed reef condition wherever local monitoring exists.

Three asks. Could you let us list the nearest EcoDiver training facility or coordinator on each dive site,
so a diver who wants to go beyond a sighting has a real next step. Could you give us, or bless us pulling,
your country survey coverage so we can flag reefs with thin or stale Reef Check coverage as needing fresh
eyes, pointing divers at your priorities rather than ours. And would you sanity check our indicator species
framing against your EcoDiver indicator list.

We take no commission and sell nothing. We would also be glad to feature Reef Check for any diver ready to
step up to structured monitoring.

Best,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 7 — Allen Coral Atlas (data we use; clean reuse)
**To:** Brianna Bambic (bbambic@asu.edu — verify on the live team page before sending), Field Engagement lead, Allen Coral Atlas — or feedback@allencoralatlas.org
**Subject:** Crediting Allen Coral Atlas correctly on a free reef atlas

Hi Brianna,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean, frustration from planning my own
dive trips, and a real concern for what warming water is doing to the corals. It is a free public nonprofit
reef atlas that reads like a map, not a journal, and it credits every source it is built on, yours included.
I would rather that be a relationship than a one way pull.

We use your reef habitat maps and bleaching detection to ground what a reef actually is and where it sits.

Three asks. Could you confirm our CC BY 4.0 attribution string and which map version to cite. Could you tell
us whether we should consume your v2.0 habitat layers through Google Earth Engine rather than the manual
download flow, for reliability. And could you confirm how to surface your published accuracy honestly, the
69 percent geomorphic and 66 percent benthic figures, plus whether your bleaching monitoring output is
available for us to ingest alongside NOAA.

We take no commission and sell nothing. We would also gladly offer our georeferenced dive site observations
back as candidate validation points.

Best,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 8 — Manta Trust (restricted data; affiliate priorities)
**To:** Clare Baranowski (clare.baranowski@mantatrust.org), Global Database Manager, Manta Trust — cc Frances Budd (frances.budd@mantatrust.org), Relationship Manager
**Subject:** Routing divers who photograph mantas into MantaBase

Hi Clare,

Hi, my name is Josie. I built scubaSeason.fun out of love for the ocean and a wish that a diver could see
where their photos would actually matter. It is a free public nonprofit reef atlas, built on public science,
yours included, with every source credited. I would rather that be a relationship than a one way pull.

We use your photo ID records to show site fidelity and seasonality for mantas, the animals so many divers
travel to see.

Three asks. Could we deep link manta encounters from our location pages straight into the MantaBase
submission form, so a diver who just photographed a manta feeds your ID database and gets a match back.
Could you tell us which affiliate project regions most need observers, so our needs fresh eyes pins match
your priorities rather than ours. And could you grant permission to display aggregate manta presence at the
sites we cover, since your data is restricted, and point me to whether that sits with you centrally or with
the regional affiliate.

We take no commission and sell nothing. Thank you for the work behind IDtheManta.

Warmly,
Josie — scubaSeason.fun — hello@scubaseason.fun

### Example 9 — MERMAID / WCS (not yet used; closes the coral cover gap)
**To:** contact@datamermaid.org (official channel; no personal addresses are public) — attn Dr Iain Caldwell, Lead Data Analyst, and Dr Emily Darling, WCS coral reef monitoring lead
**Subject:** Surfacing Public tier MERMAID reef trends to divers, fully credited

Hello MERMAID team,

Hi, my name is Josie. I built scubaSeason.fun out of a real concern for what warming water is doing to the
corals, and a frustration that most dive guides show a reef as a fixed pretty place rather than something
that is changing. It is a free public nonprofit reef atlas, built on public science and crediting every
source.

I will be honest that we do not use your data yet, and we want to. Our biggest gap is coral cover over time:
for many reefs we hold only two survey points, too thin to tell an honest story of decline or recovery. Your
Public and Public Summary projects would let us show real benthic trends, especially across Southeast Asia
and the Western Indian Ocean where good data is hardest to find.

Two asks. We would pull Public and Public Summary benthic cover via mermaidr on a schedule and show your
generated citation and the MERMAID logo on every chart. Could you confirm that matches your API attribution
terms. And could WCS encourage partner projects in our regions to set their benthic surveys to Public Summary
rather than Private, since a credited public atlas raises their visibility. We would also gladly route diver
collected observations back to interested projects.

We take no commission and sell nothing.

Warm regards,
Josie — scubaSeason.fun — hello@scubaseason.fun

---

## Notes for the sender

- **Lead with the relationship, not the favor.** For every Bucket A and B org the honest framing is
  "we already depend on your data and credit you" — that earns the read. Only Bucket C and PADI AWARE
  open with "we do not use you yet, and we want to."
- **The single highest value ask everywhere is the handoff (move 5)** — it is what turns passive data
  use into the contribution flywheel that is the whole point of the atlas.
- **Get NC permission in writing for REEF, Happywhale, Manta Trust, and IUCN.** We are a nonprofit, which
  fits non commercial terms, but a documented OK protects us as we grow.
- **Two unverified inferences to phrase as questions, not claims:** the AGRRA ArcGIS FeatureServer endpoint
  and an external ACA bleaching feed. Both are asked as "can we / is there," not stated as fact.
- **Easiest first wins:** CREMP (public domain CSV), MERMAID Public Summary, and ReefCloud open projects
  close the coral cover gap with attribution only — no permission gate.
