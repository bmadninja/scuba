---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
workflowType: 'research'
lastStep: 5
research_type: 'market'
research_topic: 'Citizen science & biodiversity platforms accepting diver-submitted photos/videos'
research_goals: 'Identify all credible platforms; capture exact upload requirements (photo/video specs, metadata, GPS); discover APIs or programmatic submission options; flag ToS/account constraints on posting on behalf of users; spot existing aggregator tools; produce platform comparison matrix to inform unified upload UX on Scuba Season'
user_name: 'Josie'
date: '2026-06-15'
web_research_enabled: true
source_verification: true
---

# Research Report: Citizen Science & Biodiversity Upload Platforms

**Date:** 2026-06-15
**Author:** Josie
**Research Type:** Market Research

---

## Research Overview

This report maps every legitimate citizen science and biodiversity platform where a scuba diver can contribute underwater photos or species sightings, with the goal of designing a unified "upload once, distribute to many" feature on Scuba Season. Research conducted via parallel web searches across platform documentation, developer APIs, terms of service, and aggregator landscape. All findings verified against primary sources.

**Key finding upfront:** The original concept of Scuba Season creating accounts on all platforms and posting on users' behalf is only viable for two platforms (iNaturalist and MERMAID). The other major platforms (REEF, ReefCheck, CoralWatch) have no public APIs. However, a revised model — where users link their own iNaturalist account via OAuth and Scuba Season posts on their behalf — is fully supported and covers a superset of platforms automatically.

**No aggregator tool like this currently exists.** This is a genuine gap in the conservation tech space.

---

## Platform Landscape

### Tier 1 — Highest reach, direct API path

**iNaturalist** (inaturalist.org)
The single most impactful integration. ~300 million observations, ~400,000 monthly active contributors. A single iNaturalist submission automatically flows into GBIF and OBIS downstream — one API call, three databases reached. Accepts species observations from any taxon (fish, coral, marine invertebrates, cetaceans). Has a full documented write API with OAuth 2.0.
_Source: [ZuBlu citizen science overview](https://www.zubludiving.com/articles/zublu-insights/citizen-science-for-divers), [iNaturalist API docs](https://api.inaturalist.org/v2/docs/)_

**eOceans** (eoceans.co)
Most diver-native platform. 1.6 million observations, 146,000 shark and ray sightings across 14,400 sites in 38 countries. Mobile-first (works offline). Real-time dive logging. Data has directly shaped CITES listings and shark sanctuaries. No public write API found — requires direct partnership contact.
_Source: [eOceans platform](https://eoceans.co/platform/get-involved)_

**MERMAID** (datamermaid.org)
Gold standard for structured coral reef surveys. Run by WCS. Full programmatic write API with OAuth 2.0. Covers Fish Belt Transect, Benthic LIT/PIT, Bleaching Quadrat, Habitat Complexity, and Photo Quadrat methods. OAuth credentials require contacting the team.
_Source: [MERMAID API docs](https://mermaid-api.readthedocs.io/en/latest/)_

### Tier 2 — Coral reef monitoring pipeline (no public APIs)

**CoralWatch** (coralwatch.org) — 477,000 corals assessed, 79 countries. Color-card bleaching assessment method. Now runs on Atlas of Living Australia (BioCollect). No public write API; requires direct ALA partnership.

**CoralNet** (coralnet.ucsd.edu) — AI-powered benthic photo annotation (UCSD). Has an API but it is for running ML classifiers on your images, not submitting new observation records. Core tool for research-grade coral photo annotation.

**ReefCheck** (reefcheck.org) — 102 countries, 17,000+ surveys, 30-year dataset. Admin-reviewed submission only. No API.

**Reef Life Survey** (reeflifesurvey.com) — Professional-grade volunteer surveys. Invitation-only volunteer program with institutional data pipeline. No public write API.

**ReefCloud** (AIMS) — AI coral annotation platform. Researcher-facing tool fed by photo quadrats. No public citizen submission API.

### Tier 3 — Species-specific platforms (all run on iNaturalist)

**iSeahorse** — seahorse sightings (Project Seahorse). Is literally an iNaturalist project (project_id=871). Covering this = one extra `project_id` tag on an iNaturalist submission.

**REEF VFSP** (reef.org) — fish abundance surveys. 300,000+ surveys, 18,000 sites, 30 years. No write API; desktop-only submission. Valuable dataset but closed system.

**Happywhale** (happywhale.com) — 438,000+ whale/dolphin photos, 50,000+ individuals ID'd. Photo-ID matching AI. No write API found.

**Sharkbook / Wildbook for Whale Sharks** (sharkbook.ai) — 50,000+ shark photos, 46 countries. Photo-ID platform. No write API documented.

**PADI AWARE Dive Against Debris** — debris logging app. Data goes to Ocean Conservancy. Mobile app with its own database.

**Marine Debris Tracker** (debristracker.org) — NOAA/UGA. Mobile-first. Its own closed database.

**NASA NeMO-Net** — coral annotation game (NASA). Upload model: NASA feeds images, users classify. Not for diver-submitted field photos.

### Tier 4 — Regional / specialist platforms

| Platform | Focus | Geography | Notes |
|---|---|---|---|
| MINKA | Species observations | Spain/EU | 268K research-grade obs, UN Ocean Decade 2025 endorsement |
| Observadores del Mar / Seawatchers | Marine species | Mediterranean | Feeds 40+ research institutions + GBIF |
| Seasearch | Marine habitats | UK | Paper-based, no photo upload API |
| SEAFAN BleachWatch | Coral bleaching | SE Florida | Florida DEP program |
| Finding Hal / White Abalone Initiative | White abalone | US West Coast | NOAA SCUBA diver network, critically endangered species |
| iSpot | All species | UK/South Africa | Cos4Cloud partner |
| Observation.org / ObsMapp | All species | Europe | 314M+ observations, feeds GBIF |

---

## Upload Requirements Matrix

| Platform | Photo Required? | Accepted Formats | Max File Size | Min Resolution | GPS Required? | Depth Required? | Video? |
|---|---|---|---|---|---|---|---|
| **iNaturalist** | Yes (for Research Grade) | JPEG, PNG, GIF (web); +HEIC (mobile) | 20 MB | None stated | Yes (Research Grade) | No (optional field) | No (animated GIF only) |
| **GBIF (Darwin Core)** | No (URL link only; GBIF doesn't host files) | image/jpeg, image/png, image/tiff; video/mp4 via URL | None (external host) | None stated | Yes (occurrence record) | Optional (DwC field) | Yes (via URL) |
| **CoralWatch** | Optional (supplementary) | Not formally specified | Not specified | Not specified | Yes (mandatory survey field) | Yes (coral depth mandatory) | No |
| **CoralNet** | Yes (core function) | JPEG, PNG | Not specified | Not specified | Optional (custom metadata) | Optional (custom metadata) | No |
| **REEF** | No (count-based database) | N/A | N/A | N/A | No (zone code only) | Yes (max + avg depth) | No |
| **ReefCheck** | Not required (visual transect) | Not specified | Not specified | Not specified | Yes (site description) | Yes (survey metadata) | Discouraged |
| **Reef Life Survey** | Yes (photo quadrats) | Not publicly specified | Not specified | Not specified | Yes | Yes | No |
| **MERMAID** | Only for Photo Quadrat method | JPEG, PJPEG, MPO, PNG | Not stated | 1500 × 1500 px minimum | Yes | Yes | No |
| **Zooniverse** | Researcher uploads only | JPEG, PNG | ~200 KB best practice | Not specified | Varies by project | Varies by project | Yes (some projects) |
| **iSeahorse** | Strongly encouraged | JPEG, PNG, GIF, HEIC | 20 MB (via iNaturalist) | None stated | Yes | Optional (survey form) | No |

### Key cross-platform patterns

- **No platform accepts RAW files.** Shoot RAW in the field, export JPEG before upload. This should be in the pre-dive instructions.
- **Video is nearly absent.** Only GBIF (via external URL) and some Zooniverse projects accept video. iNaturalist's workaround is animated GIF. MERMAID, CoralNet, ReefCheck, and REEF do not accept video.
- **GPS is universally required but implemented differently.** iNaturalist and MERMAID require coordinates in the data record. REEF uses geographic zone codes. CoralNet makes GPS optional.
- **Depth field varies widely.** REEF, MERMAID, and CoralWatch all require depth. iNaturalist has it only as an optional field. MERMAID strips all EXIF metadata from photos — location lives in the survey record, not the file.
- **Scale bars are not required anywhere.** MERMAID uses the physical quadrat frame as scale reference.
- **The practical photo spec for a "works everywhere" photo:** JPEG, under 20 MB, GPS embedded or noted, date/time, ideally 1500px+ on short side. That is the Scuba Season capture brief.

---

## API & Programmatic Submission Capabilities

| Platform | Write API? | Auth Type | Rate Limits | Notes |
|---|---|---|---|---|
| **iNaturalist** | YES — full CRUD | OAuth 2.0 (Code/PKCE/Password) + JWT | 100 req/min, 10k/day | POST observations + photos. `pyinaturalist` Python SDK. App registration requires 2mo+ old account. |
| **GBIF** | Dataset-level only | HTTP Basic Auth | Batch/async, not per-request | No per-record POST. Must publish Darwin Core Archive and register dataset. Not real-time. Observations via iNaturalist flow here automatically. |
| **MERMAID** | YES — full survey submission | OAuth 2.0 Implicit + JWT | Not documented | Full survey creation. Credentials require team contact. Open source on GitHub. |
| **iSeahorse** | YES (via iNaturalist) | OAuth 2.0 (iNaturalist) | Same as iNaturalist | Is an iNaturalist project (id=871). Submit via iNaturalist API with project_id=871. |
| **CoralWatch** | NO public API | — | — | Runs on ALA BioCollect. Partnership required. |
| **CoralNet** | Inference only | Token (username/password) | 100 images/request | API runs ML classifier on hosted images. No observation write or image upload via API. |
| **REEF** | NO | — | — | Web form + desktop uploader only. Closed system. |
| **ReefCheck** | NO | — | — | Admin-reviewed web form only. Closed system. |
| **Reef Life Survey** | NO | — | — | Institutional pipeline, no public write API. |
| **eBird** | NO (read-only) | API key | Not documented | Comparison: even eBird (130M+ records) has no programmatic submission. |
| **Zooniverse** | YES — images for classification | OAuth 2.0 Bearer | Not documented | Posts images FOR volunteers to classify, not for recording diver field observations. Wrong use case. |

---

## Terms of Service & Constraints

### iNaturalist — most important

iNaturalist **explicitly requires per-user OAuth** — posting to a single Scuba Season group account on behalf of multiple users violates their Terms. Each user must individually authenticate with their own iNaturalist account. Quote from their API Recommended Practices: *"If you are creating an application that will allow users to post data to iNaturalist, please do not do it using a group account. Use one of the various OAuth authentication flows to allow users to log in to iNaturalist as themselves."*

Machine-generated content posted with no human oversight is also prohibited and can result in account suspension.

**What this means for the product model:** Scuba Season cannot create one iNaturalist account and post all users' dives under it. The correct model is: users link their own iNaturalist account via OAuth during Scuba Season onboarding, then Scuba Season posts each observation under their personal account.

### MERMAID

Requires per-user OAuth Implicit grant. Also requires the MERMAID logo to appear in any third-party implementation using their API. Automated scraping is prohibited. API credentials must be obtained directly from the team.

### GBIF

Does not accept individual observation submissions at all. GBIF aggregates from endorsed institutional publishers. The right path: iNaturalist Research Grade observations flow into GBIF automatically — this is not an integration Scuba Season needs to build separately.

### REEF, ReefCheck, CoralWatch

No public APIs, no documented developer programs. These would require direct partnership conversations. For now, the best path is providing copy-paste-ready formatted data (date, depth, species, location) so motivated users can manually enter into these systems.

---

## Existing Aggregator Tools

**No tool currently exists that does "submit once, distribute to multiple citizen science platforms."**

The closest things found:
- **iNaturalist → GBIF auto-export** — one-way pipeline, not a submission aggregator
- **Atlas of Living Australia BioCollect** — hosts multiple projects under one infrastructure (including CoralWatch), but is one platform not a cross-platform bridge
- **Cos4Cloud / STAplus (EU, 2020–2023)** — developed an OGC interoperability standard for citizen science observation exchange. Now a ratified standard but no consumer product was released.
- **SeaKeys (South Africa, historical)** — a research project that coordinated parallel submissions to three marine platforms. Closest historical precedent but was manual and not a reusable tool.
- **Darwin Core Archive publishing** — institutional publishers can feed multiple databases from one DwC-A file, but this is institutional data infrastructure, not a user-facing app.

**The gap is real and unoccupied.** The barriers that have prevented this:
1. Most coral/marine platforms lack public APIs (REEF, ReefCheck have none)
2. iNaturalist requires per-user OAuth, making a one-login aggregator architecturally possible but requiring individual user consent per platform
3. Platform schemas are heterogeneous (REEF uses species checklists, iNaturalist uses individual organism observations, MERMAID uses transect-level protocols)
4. GBIF does not accept direct submissions at all

---

## Strategic Synthesis for Scuba Season

### Revised product model

The original concept ("create Scuba Season accounts on all platforms, post on users' behalf") is only viable for 2 platforms. Here is the revised architecture that is both ToS-compliant and achieves the goal:

**Phase 1 — iNaturalist integration (highest ROI)**
- During Scuba Season onboarding, users optionally link their personal iNaturalist account via OAuth
- After each dive, Scuba Season collects: photo(s), species (or "unknown"), GPS location, date, depth (optional), notes
- Scuba Season posts on the user's behalf via the iNaturalist API
- This single action automatically reaches: iNaturalist, GBIF, OBIS, and any iNaturalist project (including iSeahorse via project_id=871)
- **One integration, four databases.**

**Phase 2 — MERMAID integration (coral survey specialists)**
- Contact MERMAID team for OAuth credentials
- For structured survey data (transects, benthic counts), offer MERMAID submission path
- Different data type from iNaturalist — this is for trained divers doing formal surveys, not casual sightings

**Phase 3 — Closed platforms (manual assist)**
- For REEF, ReefCheck, CoralWatch: cannot automate
- Instead, provide a "ready to submit" formatted summary after each dive — pre-filled data that users can copy into those platforms' web forms
- This is better than the current "go to iNaturalist" redirect because it meets users where they are and does the work for them

### Pre-dive capture brief (the UX input)

Based on requirements across all platforms, the minimum viable capture spec that works everywhere:

| Field | Spec | Note |
|---|---|---|
| Photo format | JPEG | Export from RAW in-app or on device |
| Photo size | Under 20 MB | iNaturalist hard limit |
| Photo resolution | 1500px+ on short side | MERMAID minimum; covers all others |
| GPS | Required | Auto-capture on phone; manual entry for dive computers |
| Date/time | Required | Auto-capture |
| Depth | Record it | Required by REEF, MERMAID, CoralWatch |
| Species or "Unknown" | Required for iNaturalist Research Grade | Crowd-ID will handle unknowns |
| What NOT to shoot | No RAW-only, no video for most platforms | Mention in brief |

### Data flow Scuba Season gets back

Once observations are in iNaturalist, Scuba Season already pulls from iNaturalist as one of its 63 sources. This closes the loop: diver uploads via Scuba Season → iNaturalist → back into Scuba Season's reef health data. The diver directly improves the data quality for the dive site they just visited.

---

## Sources

- [ZuBlu — Citizen science for scuba divers](https://www.zubludiving.com/articles/zublu-insights/citizen-science-for-divers)
- [DAN — Advancing Conservation Through Citizen Science](https://dan.org/alert-diver/article/advancing-conservation-through-citizen-science/)
- [iNaturalist API v2 docs](https://api.inaturalist.org/v2/docs/)
- [iNaturalist API Recommended Practices](https://www.inaturalist.org/pages/api+recommended+practices)
- [iNaturalist Terms of Use](https://www.inaturalist.org/pages/terms)
- [pyinaturalist library](https://pyinaturalist.readthedocs.io/)
- [GBIF technical docs: multimedia](https://techdocs.gbif.org/en/data-publishing/multimedia-publishing)
- [GBIF Terms of Use](https://www.gbif.org/terms)
- [MERMAID API documentation](https://mermaid-api.readthedocs.io/en/latest/)
- [MERMAID Terms of Service](https://datamermaid.org/terms-of-service)
- [MERMAID photo preparation](https://datamermaid.org/documentation/image-classification-photos-preparation)
- [CoralWatch survey fields](https://coralwatch.org/monitoring/about-data-entry/)
- [CoralNet API reference](https://coralnet.ucsd.edu/pages/help/api/reference/)
- [REEF VFSP metadata](https://www.reef.org/vfsp-metadata-descriptions)
- [ReefCheck tropical program](https://www.reefcheck.org/tropical-program/)
- [Reef Life Survey](https://reeflifesurvey.com/)
- [eOceans platform](https://eoceans.co/platform/get-involved)
- [Happywhale](https://happywhale.com/)
- [Sharkbook](https://www.sharkbook.ai/)
- [iSeahorse on iNaturalist](https://www.inaturalist.org/projects/iseahorse)
- [MINKA — Ocean Decade](https://oceandecade.org/news/minka-a-species-observation-platform-documenting-biodiversity-one-photo-at-a-time/)
- [Cos4Cloud STAplus](https://cos4cloud-eosc.eu/blog/staplus-ogc-interoperability-citizenscience/)
- [Linking biodiversity platforms with Darwin Core Archives (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3964728/)
- [Atlas of Living Australia BioCollect](https://www.ala.org.au/biocollect-for-citizen-science/)
- [PMC — Marine citizen science review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12055671/)
