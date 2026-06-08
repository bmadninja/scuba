---
title: scubaseason.fun — Citizen Science MVP
status: draft
created: 2026-06-07
updated: 2026-06-07
---

# scubaseason.fun — Citizen Science MVP

## Problem Statement

9–14 million recreational divers enter the ocean every year and observe marine ecosystems that science institutes are struggling to monitor at scale. Those institutes default to expensive robots, remote sensing, and specialist expeditions — not because local expertise is inferior, but because they don't know where to find it and don't trust what they can't credential.

The platforms divers use today (PADI, Diveboard, iNaturalist) are either trip-booking tools or observation logs. None of them help a diver understand *what is happening* to the reef they're about to visit, *why it matters*, or *what they can do about it*. The science exists; it just isn't reaching the people who are already there.

scubaseason.fun already sits at the highest-intent moment in a diver's journey: site research before a dive. The MVP adds a science and education layer that transforms static site information into a meaningful picture of reef health — and positions the platform to mobilize divers as citizen scientists in future phases.

This is not about collecting data yet. It is about building the understanding, trust, and narrative that makes data collection possible later.

---

## Goals

1. Make scubaseason.fun the most informative dive research platform — not just logistics (hotels, operators, liveaboards) but reef health, ecological context, and what is changing.
2. Surface the science on every dive site page: reef status, what monitoring shows, what the diver will encounter and why.
3. Explain the data gap in plain language — that shallow-water reef systems are among the least-monitored ecosystems on earth, and that divers are uniquely positioned to help.
4. Plant the foundation for future citizen science participation: interest capture, narrative framing, and the data model scaffolding that observation collection will build on.
5. Establish scubaseason.fun's nonprofit identity clearly: this platform exists to serve divers and science, not to monetize attention.

### Non-Goals (this MVP)

- Observation submission by divers or operators (Phase 2)
- AI species identification (Phase 2)
- Science data export pipeline / Darwin Core Archive integration (Phase 3)
- Boat operator / local community contribution pathways (Phase 2)
- eDNA collection programs (Phase 3+)
- Dive computer data integration (Phase 3+)
- Corporate TNFD biodiversity data product (Phase 4)
- Native iOS/Android app (mobile web only)
- Real-time bleaching event alerts (Phase 3+)

---

## User Segments

### Recreational Divers (Planning a Trip)
The primary audience. Researching a site before diving — looking for conditions, what species to expect, what to watch for. Currently underserved on the "what is happening to this reef" question. The MVP closes that gap and seeds the motivation to contribute in future phases.

### Science-Curious Divers
A subset of recreational divers who already care about reef health but don't know where to direct that interest. The education layer gives them context and a mental model; the future citizen science pipeline gives them action. The MVP is what creates this user.

### Boat Operators and Dive Guides (Awareness, Not Contribution Yet)
Aware of scubaseason.fun as the platform their clients use for trip research. At MVP, no contribution flow exists for them — but the reef status context on site pages is useful to them and builds familiarity before Phase 2 introduces their specific onboarding.

### Science Partners (Awareness, Not Integration Yet)
Marine research institutes and NGOs who may discover scubaseason.fun through the education layer and the Seabed 2030 framing. At MVP, no data pipeline exists — but the positioning establishes credibility for future partnership conversations.

---

## Features

### F1 — Reef Status Layer

**What it is:** A prominent, science-backed reef health indicator on every dive site page, tied to the existing three-state classification in the scubaseason.fun data model.

**FR-1.1:** Every dive site page must display the reef status indicator using the existing three-state classification: Thriving / Under pressure / Witnessing change. The indicator must be visually prominent — above the fold on mobile, visible without scrolling.

**FR-1.2:** Each reef status must display a 150–250 word in-context explanation of what that status means for this specific site: what conditions the diver is likely to encounter, what is driving the reef's current state, and what trajectory monitoring data suggests.

**FR-1.3:** The reef status explanation must be written in plain language accessible to a non-scientist diver. No jargon without immediate definition. Tone is informative and honest, not alarmist or marketing-inflected.

**FR-1.4:** Where monitoring data exists for a site (coral cover %, bleaching history, recorded species counts), it must be surfaced alongside the reef status — even if the data is sparse or dated. A data gap is better communicated than concealed. If no data exists, the display must say so explicitly.

**FR-1.5:** Reef status values must be maintainable by the scubaseason.fun team without a code deploy — stored in the site data, updatable via the existing data pipeline.

---

### F2 — "Why This Matters" Science Context Module

**What it is:** A module on every dive site page that connects the individual site to the broader ocean data gap — explaining Seabed 2030, the monitoring shortfall, and why the diver in front of this screen is already more useful to science than they know.

**FR-2.1:** Every dive site page must include a "Why this matters" module positioned after the reef status section. It must explain, in 100–150 words:
- That shallow-water reef systems are among the least-monitored ocean environments
- That recreational divers already observe what science cannot afford to monitor continuously
- The Seabed 2030 context: that only a fraction of shallow reef habitat is mapped to any useful resolution

**FR-2.2:** The module must include a specific, true data point about the ocean mapping gap (e.g. that only 25.7% of shallow-water areas are mapped to navigational resolution as of 2026) to make the gap concrete and credible.

**NFR-2.1:** The module must not reference future features, invite signups, or imply that scubaseason.fun currently collects observation data or has science partnerships. The module closes with the data gap framing — no call to action beyond awareness.

---

### F3 — Dive Site Information Completeness

**What it is:** Improvements to the depth and accuracy of per-site information, making scubaseason.fun the most comprehensive dive research resource — better than PADI, Diveboard, and aggregator travel sites on the information that matters to a diver planning a trip.

**FR-3.1:** Every dive site page must display, where data exists:
- Reef status (FR-1.1)
- Best dive season (months)
- Typical visibility range (meters)
- Typical water temperature range (°C) by season
- Depth range (shallow, recreational max, technical max where applicable)
- Current strength and type (none / mild / strong / variable / expert-only)
- Notable species (top 5–10 with common and scientific names)
- What the site is known for (wreck / wall / coral garden / pelagic / cave / macro)

**FR-3.2:** Where a data field is missing for a site, the page must display the field with a "data not yet available" state rather than omitting the field entirely. The absence of data must be legible.

**FR-3.3:** Species listings must link to a species detail page (or anchor section) with a brief ecological description, conservation status, and where else in the scubaseason.fun database the species has been recorded.

**NFR-3.1:** No fabricated or AI-hallucinated site data. All fields must be sourced from the existing dataset, published dive guides, or verifiable public monitoring records. Uncertainty is preferable to invention.

---

### F4 — Nonprofit and Science Identity Layer

**What it is:** Clear, consistent communication of scubaseason.fun's nonprofit mission across the site — so divers, science partners, and operators understand why this platform exists and how it differs from commercial booking tools.

**FR-4.1:** The site must include a dedicated "About" or "Mission" page that explains:
- scubaseason.fun is a nonprofit
- Affiliate revenue (hotels, liveaboards, gear) funds operations, not profit
- The long-term goal: bridging recreational divers and marine science
- The platform's data principles: open science, CC-licensed observation data in future phases, no selling user data

**FR-4.2:** The site footer must include a one-line mission statement visible on every page.

**FR-4.3:** The affiliate disclosure (currently on /about) must remain current and accurate. No change to FTC compliance posture required.

---

## Product Roadmap

The following are not MVP features but are directional commitments that should inform architecture and content decisions made in this phase.

### Phase 2 — Observation Collection (Next)

Adds the ability for divers to submit structured observations (species sightings, debris, water conditions) tied to specific sites. Includes:
- Observation submission form on every site page
- Account creation for contributors (recreational diver, dive guide, boat operator roles)
- AI-assisted species identification (CoralNet Deploy for coral/invertebrates, Fishial.AI for fish)
- Contribution feedback loop: show each contributor what their data revealed
- Boat operator and dive guide onboarding with elevated trust flagging

### Phase 3 — Science Data Pipeline

Routes validated observations to scientific databases in Darwin Core Archive (DwC-A) format, compatible with GBIF, OBIS, and GCRMN. Includes:
- Observation validation pipeline
- DwC-A export endpoint for authenticated science partners
- CC BY 4.0 licensing for observation records (GBIF-eligible)
- First science partner agreements (manual onboarding)
- Pilot with MARUM BlueDOT program for dive computer depth/temperature data contribution to Seabed 2030

### Phase 4 — Ecosystem Partnerships and Data Products

**Wildflow.ai partnership:** Wildflow.ai operates at a precision layer scubaseason.fun does not — exact-meter resolution conservation planning informed by current and hydrodynamic modeling (e.g. identifying that a restoration intervention should be placed here and not five meters to the left because of upstream current patterns). scubaseason.fun's role is the broad awareness and mobilization layer; Wildflow.ai's role is precision conservation execution. These are complementary, not competitive.

A formal partnership could route scubaseason.fun's aggregated observation data to Wildflow.ai's planning models, and surface Wildflow.ai's restoration site intelligence back to scubaseason.fun users ("this site has an active restoration project — here's what to watch for"). Explore: data sharing agreement, co-branded science content, referral to dive operators participating in Wildflow.ai restoration programs.

Other Phase 4 directions: TNFD corporate biodiversity data product (verified buyer market: 500+ companies filing TNFD disclosures, NatureMetrics $25M Series B); eDNA collection program with physical sample kit partnerships.

---

## Data Model Notes

The following additions are required at MVP (minimal; observation infrastructure is Phase 2):

- **Site** — ensure `reefStatus`, `bestSeason`, `visibilityRange`, `tempRange`, `depthRange`, `currentType`, `notableSpecies`, `siteType` fields are populated and schema-complete
- **Species** — add `conservationStatus`, `ecologicalDescription`, `siteOccurrences` (derived)
Phase 2 will add: Observation, ObservationSpecies, Contributor, SciencePartner entities. Architecture decisions at MVP should not preclude these additions.

---

## Non-Functional Requirements

**NFR-P1 — Performance:** All dive site pages must load within 2 seconds on a 4G mobile connection. Reef status and science context must be present in the initial server render (not client-fetched).

**NFR-M1 — Mobile-first:** The reef status module and "Why this matters" module must be fully readable and functional on a 375px wide mobile screen. Interest form must work on iOS Safari and Android Chrome.

**NFR-A1 — Accessibility:** Reef status indicator must not rely on color alone — include a text label. All new modules meet WCAG 2.1 AA.

**NFR-T1 — Nonprofit tone:** All copy must reflect scientific honesty and community stewardship. No overpromising on future capabilities. No competitive framing against other platforms. No marketing inflation of reef status severity. Language review required before launch.

**NFR-D1 — Data integrity:** No fabricated site data. Where fields are empty, display a legible "not yet available" state. Do not interpolate or estimate values not in the source dataset.

---

## Success Metrics

| Metric | Target (3 months post-launch) | Counter-metric |
|--------|-------------------------------|----------------|
| Reef status coverage | 100% of dive site pages display a reef status indicator | % of pages showing "unknown" status |
| Science context module | Present on 100% of dive site pages | Module load errors |
| Time on site page | +20% vs. baseline (more information = longer engagement) | Bounce rate regression |
| Diver awareness | Qualitative: divers can articulate why scubaseason.fun is different from a booking site | — |

---

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| OQ-1 | Reef status data completeness: how many of the 356 sites have enough monitoring data to populate FR-1.4 with real figures vs. "not yet available"? | Josie / Data | Open |
| OQ-2 | Wildflow.ai: is there an existing contact or relationship to open a partnership conversation? What data sharing would they want from scubaseason.fun? | Josie | Open |
| OQ-3 | Interest form: which email platform for Phase 2 waitlist (Mailchimp, Buttondown, other)? Needs to be low-cost / nonprofit-tier. | Josie | Open |
| OQ-4 | Species data: current species listings on site pages — are common and scientific names both present in the dataset, or only one? | Josie / Data | Open |
| OQ-5 | Seabed 2030 / BlueDOT (MARUM): no current relationship. Worth a cold outreach now to establish a Phase 3 partnership pipeline? | Josie | Deferred |

---

## Out of Scope

- Observation submission by divers or operators (Phase 2)
- AI species identification
- Science data export / Darwin Core Archive pipeline
- Boat operator contribution flows
- eDNA collection
- Dive computer integrations
- Corporate TNFD data product
- Native mobile app
- Real-time alerts
- Wildflow.ai integration (Phase 4 — explore relationship now, build later)
