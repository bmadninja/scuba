---
title: scubaSeason.fun — Go To Market Outreach Research (Reef Atlas)
status: final
created: 2026-06-09
author: Mary (Business Analyst)
source_of_truth: >
  Anchored to the in development reef atlas redesign in
  _bmad-output/planning-artifacts/ux-designs/ux-scuba-2026-06-09/
  (DESIGN.md, EXPERIENCE.md, the 2026-06-09 .working HTML mockups) and the live
  src/data/sources.json — NOT the earlier citizen science PRD.
scope: >
  Who to share the reef atlas with at launch: diver communities (demand) and
  research institutions (supply + credibility), with named contacts where public,
  outreach angles, priority tiers, and ready to send drafts.
geographic_scope: Global, density ranked
contact_depth: Named contact where public, else official channel
---

# scubaSeason.fun — Go To Market Outreach Research

**The product (source of truth = the reef atlas redesign):** a free, public, nonprofit
**reef atlas** — *"Find where to dive, and where the ocean needs eyes."* Divers filter
reefs by month, region, or species they want to see, and read each reef's health in plain
language (**Thriving / Under pressure / Witnessing change**). Each site shows encounter
odds worked out from divers' own logs ("Green turtle — about 6 in 10 dives"), and the atlas
surfaces reefs that **"need fresh eyes"** (nobody has logged them recently). Sightings ingest
**live**. Divers **contribute** observations through **iNaturalist → GBIF → IUCN**. Built from
**63 public scientific sources**, no data of its own. No commission, no monetization.
Contact: **hello@scubaseason.fun**.

**The one hook that runs through everything:** *the reef you are diving may be one science
has no recent eyes on, and your dive log becomes a real scientific record.* Never lead with
trip booking.

---

## Are we already working with them? Data use vs partnership

**Short answer: we already USE the data of almost every org below, but we PARTNER with none of
them.** The atlas is built entirely from their public datasets and credits all 63 on the Method
page. That credit is one directional — we consume, we attribute, and most of these organizations
have no idea scubaSeason.fun exists. **REEF (reef.org) is the clearest case:** we already ingest
their 275,000+ diver fish surveys to back our species presence and encounter odds claims — so we
*are* using them, exactly the way we use the others. What is missing is a relationship.

So "are we using them?" and "are we partnering with them?" are two different questions, and the
whole point of this GTM is to convert the first into the second.

**Status legend used in every table below:**

| Mark | Meaning |
|---|---|
| **● Live ingest** | Pulled automatically on a schedule and live on the site now. Today this is **only iNaturalist** (the weekly sightings ingest via `scripts/fetch-sightings-live.mjs`), which is also our one active contribute target. |
| **◐ Data used + credited** | Their public data is in `sources.json`, surfaced on the site, and credited on the Method page. One directional. **No partnership, no contact, no co promotion.** |
| **○ Not used yet** | Net new. No data flowing and no relationship — a pure prospect. |
| **Partnership: none** | True for every org right now. We hold **zero** formal partnerships, data agreements (beyond GBIF's standing data user terms), or co promotion deals. |

**Why convert data use into partnership at all:**
1. **Ethics / nonprofit good faith.** We are built 100% on their work. A nonprofit consuming a
   citizen science network's data silently, while that network's own volunteers are our exact target
   users, should be a relationship, not a one way pull.
2. **Co promotion.** Their volunteer audiences (REEF ~18k divers, Reef Check 100+ countries, CoralWatch
   130+ countries) ARE our demand side. A blessing or a shoutout is the cheapest high trust reach we
   can get.
3. **License de risking.** Several we already use are non commercial or attribution restricted —
   **REEF, Happywhale, IUCN Red List, Manta Trust** — where a real relationship protects us as we
   grow. (We are a nonprofit, but a documented OK matters.)
4. **The contribution flywheel.** Using their data is passive. Partnership lets us route divers back
   INTO their pipelines (Reef Check EcoDiver, REEF surveys, iNaturalist), which is the entire "where
   the ocean needs eyes" thesis.

**The punchline for prioritization:** the warmest P1 targets are not cold prospects — they are orgs
whose data we *already depend on*. The opening line writes itself: "we are already built on your data
and we credit you; we would like to make that a relationship."

---

## Recommended first 10 outreach moves

Sequenced so credibility compounds: lock partner endorsements first, start the slow gatekept
channels in parallel, then open the broad diver firehose only once you can say "in partnership
with…".

| # | Move | Why first | Channel |
|---|------|-----------|---------|
| 1 | **Email REEF** — partners@REEF.org / Dr Christy Pattengill-Semmens | Warmest fit; their volunteers ARE the user; dedicated partnerships intake | Demand + Supply(B) |
| 2 | **Email Reef Check** — Dr Jan Freiwald / ecodiver@reefcheck.org | Global EcoDiver network in 100+ countries; "needs eyes" = their survey gaps | Demand + Supply(B) |
| 3 | **Email CoralWatch** — info@coralwatch.org + Ambassador Program | Their reef health model mirrors our plain language states; join now Ambassador route | Supply(B) |
| 4 | **Email NOAA Coral Reef Watch** — Caroline Donovan, Comms Director (Caroline.Donovan@noaa.gov) | The authoritative bleaching source behind our reef state classification; credibility anchor | Supply(A) |
| 5 | **Email Green Fins** — partnerships@reef-world.org | "We point to reefs that need eyes, you point to operators who dive them responsibly" | Supply(A) |
| 6 | **Modmail r/scuba** before any post | Gatekept and slow; an honest "I built a free nonprofit tool, is this allowed?" outperforms a stealth drop | Demand |
| 7 | **Email ScubaBoard owner Pete "NetDoc" Murray** (self promo is banned outright) | Largest English dive forum; partner/mod path is the ONLY route | Demand |
| 8 | **DM Girls that Scuba** as a partnership (65k, conservation leaning, 17 sub groups) | Admin gated; runs its own conservation programs, so a partner post fits | Demand |
| 9 | **Email AGRRA** — info@agrra.org (CC BY 4.0 Caribbean reef data) | Closes the coral cover gap for Caribbean reefs; license already fits our credit everything model | Supply(C) |
| 10 | **Email ReefCloud / MERMAID** — coral cover time series | Directly fixes the thin "2 data points per reef" coral cover problem | Supply(C) |

**Sequencing rule:** moves 1–5 (partner emails) and 6–7 (gatekept forums) run in parallel from day one because both are slow. Broad Facebook group posting (P2 below) happens **only after** a partner endorsement exists to cite.

---

## Cross cutting rules (apply to every message)

- **Nonprofit framing only.** No commission, no affiliate, no monetization language anywhere.
- **No hyphens** in any scubaSeason.fun copy (reword compounds; em dashes — are fine).
- **Respect self promo rules.** ScubaBoard bans self promo threads outright; most large dive FB
  groups ban link drops; r/scuba wants modmail first. Where flagged, a moderator/partner approach
  is the only route — assume "ask first" everywhere.
- **Contacts verified 2026-06-10.** Confirmed off live org pages: NOAA CRW (Caroline Donovan, Comms
  Director, Caroline.Donovan@noaa.gov; coordinator Dr Derek Manzello), Manta Trust (Clare Baranowski,
  Global Database Manager; Frances Budd, Relationship Manager), MERMAID (official channel
  contact@datamermaid.org; attn Iain Caldwell / Emily Darling). **Still verify before sending:**
  Allen Coral Atlas (Brianna Bambic, bbambic@asu.edu) and CoralWatch (Monique Grol, m.grol@uq.edu.au)
  were surfaced from bios, not a canonical staff page.

---

# Audience 1 — Divers (demand side)

Density note: biggest active markets, ranked — US/Caribbean, SE Asia (Philippines/Indonesia/
Thailand), Australia, Red Sea/Egypt, Mexico. Highest leverage = the citizen science networks,
whose audiences already believe "your logs matter" — these are partner plays, not link drops.

### P1 — citizen science networks (warmest fit; partner plays)

> All three are **already data sources we use and credit** — these are conversions, not cold prospects.

| Target | Already using? (how) | Size / activity | Fit | Best entry point | Tier |
|---|---|---|---|---|---|
| **REEF** — [reef.org](https://www.reef.org/programs/volunteer-fish-survey-project) | **◐ Yes** — 275k+ fish surveys back our diver confirmed species presence + encounter odds (NC license). Partnership: none | 300k+ surveys, ~17–18k volunteer divers; world's largest marine life sightings DB | Exact thesis: divers logging species into a scientific record | info@REEF.org; data@REEF.org | P1 |
| **Reef Check (EcoDiver)** — [reefcheck.org](https://www.reefcheck.org/) | **◐ Yes** — observed reef condition where local surveys exist. Partnership: none | EcoDiver teams in 102 countries; 600+ surveys/yr | Trained citizen science divers; "needs eyes" = their survey gaps | rcinfo@reefcheck.org; [contact](https://www.reefcheck.org/get-involved/contact/) | P1 |
| **CoralWatch** — [coralwatch.org](https://coralwatch.org/) | **◐ Yes** — observed bleaching claims at lower monitoring sites (CC BY 4.0). Partnership: none | Volunteers in 130+ countries | Reef health in plain language IS their model | Official site contact (UQ program) | P1 |

### P1 — highest reach diver communities

| Target | Size / activity | Self promo | Best entry point | Tier |
|---|---|---|---|---|
| **r/scuba** — [reddit.com/r/scuba]( 8  | ~111k members, active daily | Modmail BEFORE posting | "Message the Mods" / modmail | P1 |
| **ScubaBoard — Marine Science & Conservation** — [scubaboard.com](https://scubaboard.com/community/forums/) | Largest English dive forum | **Self promo banned**; partner/mod path only | Owner Pete "NetDoc" Murray, NetDoc@ScubaBoard.com; cc Michelle Ehrenberg | P1 |
| **Girls that Scuba (FB)** — [facebook.com/groups/girlsthatscuba]( 10  | 65k+ (largest women's dive community); 17 sub groups | Admin gated; partner post only | Via girlsthatscuba.com (they run conservation programs) | P1 |

### P2 — large general dive Facebook groups (admin permission required)

| Target | Size | Entry point | Tier |
|---|---|---|---|
| **Scuba Diving Worldwide** — [fb](https://www.facebook.com/groups/ScubaDiving/) | ~33k+, very active | Message admins; official channel only | P2 |
| **Dive Talk (FB + 300k+ YT)** — [fb](https://www.facebook.com/groups/divetalk/) | Group + 300k YouTube (Gus & Woody) | Pitch as a creator collab via divetalk.com | P2 |
| **PADI Divers Around the World** — [fb](https://www.facebook.com/groups/PADIDiversAroundWorld/) | 55k+ | Group admins | P2 |
| **Scuba Diving Group (bentdivers)** — [fb](https://www.facebook.com/groups/bentdivers/) | ~53k+ | Group admins | P2 |
| **Scuba Diving USA** — [fb](https://www.facebook.com/groups/DiveUSA/) | Large US focused | Group admins | P2 |

### P2 — regional density

| Target | Notes | Entry point | Tier |
|---|---|---|---|
| **GTS regional sub groups (incl. SE Asia/Indonesia)** | 17-group network; flagship events in Indonesia | GTS partnership channel | P2 |
| **Cancun/Riviera Maya cenote & reef groups** | Active Mexico density Q&A community | Group admins | P2 |
| **Reef Check / EcoDiver Thailand (Koh Tao)** | SE Asia's training hub | Reef Check rcinfo@reefcheck.org | P2 |

### P3 — Discord, smaller forums, creators

| Target | Notes | Entry point | Tier |
|---|---|---|---|
| **r/diving** | Smaller, broader (incl. freediving) | Modmail first | P3 |
| **Scuba / Modern Diver's Community Discord** | Small but tight knit; good for early feedback | DM server admin | P3 |
| **Jonathan Bird's Blue World** | Emmy winning marine science creator | Official channel | P3 |
| **Ocean conservation creators** (Watermelodie, Andriana_Marine) | Engaged conservation audiences | Official channel | P3 |

> Honesty flags: FB member counts drift (order of magnitude). Most FB group admins had no public
> named contact, so those read "official channel only." Public scuba Discords are thin; treat P3
> Discords as early feedback only.

---

# Audience 2 — Researchers / institutions

## Bucket A — orgs whose data we already surface and credit

Angle: *"We put your data in front of recreational divers at the exact moment they research a
dive, fully credited and linked — we'd love your blessing, a relationship, or to be listed as a
data user."* **Every org in this bucket is already a live data source (◐) we credit; none is a
partner yet.**

| Org | Already using? — how we surface it now | Best contact | Terms / program | Tier |
|---|---|---|---|---|
| **NOAA Coral Reef Watch** | **◐** SST / SST anomaly / DHW / bleaching alerts → the heat signal in reef state. Partnership: none | Caroline Donovan, Comms Dir, NOAA CRCP — Caroline.Donovan@noaa.gov *(verify)* | Public domain; formal [citation recs](https://coralreefwatch.noaa.gov/satellite/docs/recommendations_crw_citation.php) | P1 |
| **Allen Coral Atlas (ASU)** | **◐** Global reef habitat maps + bleaching detection → reef geography layer. Partnership: none | feedback@allencoralatlas.org; Brianna Bambic bbambic@asu.edu | CC BY 4.0; attribution required; active engagement function | P1 |
| **Reef Check Foundation** | **◐** Observed reef condition where local surveys exist. Partnership: none | ecodiver@reefcheck.org; [partners](https://www.reefcheck.org/get-involved/partners-supporters/) | Aqualink data integration precedent | P1 |
| **REEF** | **◐** 275k+ fish surveys → diver confirmed species presence + encounter odds. Partnership: none | partners@REEF.org; Hilary Penner (Dir. Program Dev) | NC license (attribution; commercial needs permission); dedicated partnerships email | P1 |
| **Green Fins (UNEP + Reef-World)** | **◐** Verified responsible operator directory → operator flags in trip recs. Partnership: none | partnerships@reef-world.org | Active comms team; mission aligned nonprofit | P1 |
| **CoralWatch (UQ)** | **◐** Coral Health Chart → observed bleaching at low monitoring sites. Partnership: none | [contact](https://coralwatch.org/about/); [media](https://coralwatch.org/news/media/) | CC BY 4.0; partners w/ NOAA + PADI AWARE | P2 |
| **Manta Trust (IDtheManta)** | **◐** Manta photo ID → aggregation site fidelity + seasonality. Partnership: none | info@mantatrust.org | No explicit license — confirm; courts dive tourism | P2 |
| **Happywhale** | **◐** Cetacean photo ID → return rate + seasonality claims. Partnership: none | Ted Cheeseman ted@happywhale.com; Ken Southerland | Free research/NC; commercial needs permission; shares via GBIF | P2 |
| **AGRRA / Perry Institute** | **◐** Caribbean rapid reef assessment → Caribbean coral cover + bleaching. Partnership: none | [Collaborate](http://www.perryinstitute.org/our-work/collaborate-with-us/) | Standardized open data (CC BY 4.0 per RCIIMS) | P2 |
| **Wildbook / Wild Me** | **◐** Photo ID platforms → return visit documentation. Partnership: none | opensource@wildme.org | CC BY 4.0; open source; feeds GBIF/OBIS; 501(c)(3) | P3 |
| **Marine Conservation Inst. (MPAtlas)** | **◐** Protection quality layer → "paper park vs enforced" MPA claims. Partnership: none | Maria Lopez Bringuier maria.lopez@marine-conservation.org; info@mpatlas.org | CC BY 4.0; has [Data Use](https://marine-conservation.org/data-use/) policy | P3 |
| **PADI AWARE Foundation** | **○ Not used yet** — distinct from PADI cert data; net new prospect (Dive Against Debris / shark ray census). Partnership: none | [Become a Partner](https://www.padi.com/aware/partners) | Formal (donor oriented) — frame as data/mission only | P3 |
| **GBIF** | **◐/●** Aggregated occurrence records; the middle of our live iNat→GBIF pipeline. Partnership: standing data user terms only | per dataset admins; info via gbif.org | **Binding** [data user agreement](https://www.gbif.org/terms/data-user); cite DOIs | P3 |
| **AIMS (LTMP)** | **◐** GBR coral cover / bleaching / COTS → GBR site condition. Partnership: none | media@aims.gov.au; [contact](https://www.aims.gov.au/about/contact-us) | CC BY 4.0; confirm reuse | P3 |
| **ICRI / GCRMN** | **◐** ICRI discovery layer for regional reef status reports; GCRMN benthic aggregations for coral cover. Partnership: none | [contact form](https://icriforum.org/contact/) | Rotating secretariat; endorsement > data | P3 |

> Data feeds, no outreach needed (cite per terms only): USGS Earthquake Catalog, GEBCO, HYCOM,
> ECMWF/Copernicus, raw NASA/NOAA satellite feeds. Mostly attribution compliance (cite per terms),
> pursue opportunistically: OBIS, WoRMS, FishBase, GBRMPA, IUCN Red List, ALA, Global Fishing Watch,
> Global Mangrove Watch, WRI Reefs at Risk, Ocean Health Index, OTN, NOAA NCRMP. Industry bodies
> (SSI, DEMA) are distribution plays, not data co promo.

## Bucket B — programs that GAIN OBSERVERS when divers contribute

Angle: *"We route motivated, already in the water divers into YOUR observer pipeline at the moment
they care most — we can drive volume; let's coordinate the handoff and explore co promotion."*
iNaturalist + GBIF are P1 as **pipeline infrastructure** (our backbone); the species/reef programs
are the high leverage co promotion targets.

| Program | Already using? | Observer gain | Best contact | Tier |
|---|---|---|---|---|
| **iNaturalist (+ Seek)** | **● Live ingest** — our weekly sightings feed AND our one active contribute target. Partnership: none (no Ambassador status yet) | Backbone: photo → research grade → GBIF → Red List | Tony Iwane (Outreach); help@inaturalist.org; [Ambassador](https://www.inaturalist.org/pages/network-join) | P1 |
| **GBIF** | **◐/●** Middle of the live pipeline; occurrence records used. Partnership: data user terms only | Aggregates research grade records for assessors | info@gbif.org; Dir. Joe Miller | P1 |
| **Reef Check (EcoDiver)** | **◐** Data used (reef condition). Partnership: none | Structured transect surveys (fish/inverts/substrate) | Dr Jan Freiwald; ecodiver@reefcheck.org | P1 |
| **REEF — Volunteer Fish Survey** | **◐** Data used (275k surveys → encounter odds). Partnership: none | Roving diver fish counts | Dr Christy Pattengill-Semmens; data@reef.org | P1 |
| **PADI AWARE** (Dive Against Debris, 2026 Shark & Ray Census) | **○ Not used yet** — net new. Partnership: none | Largest underwater citizen science DB; 100k+ divers, 117 countries | [Become a Partner](https://www.padi.com/aware/partners) | P1 |
| **Manta Trust (MantaBase)** | **◐** Data used (manta photo ID). Partnership: none | Manta photo ID, 5,000+/yr → IUCN | info@mantatrust.org | P2 |
| **Wild Me / Wildbook** (Sharkbook, Manta Matcher, Whale Shark) | **◐** Data used (photo ID return visits). Partnership: none | AI photo ID mark recapture | info@wildme.org | P2 |
| **Happywhale** | **◐** Data used (cetacean return-rate/seasonality). Partnership: none | Cetacean photo ID, AI matching | Ted Cheeseman ted@happywhale.com | P2 |
| **CoralWatch (UQ)** | **◐** Data used (bleaching at low monitoring sites). Partnership: none | Coral Health Chart bleaching; PADI specialty | Monique Grol (PM); info@coralwatch.org | P2 |
| **Reef Life Survey** | **◐** Data used (effort denominators for sighting probabilities). Partnership: none | Rigorous trained volunteer transects | Dr Rick Stuart-Smith, Rick.StuartSmith@utas.edu.au | P2 |
| **eOceans** | **○ Not used yet** — closed platform; needs follow up. Partnership: none | App logging of sharks/rays/conditions; 1.6M+ obs | Dr Christine Ward-Paige (founder) | P2 |
| **Eye on the Reef (GBRMPA)** | **○ Not used yet** — GBRMPA reports used, but not this sightings app. Partnership: none | GPS tagged GBR reef-health/COTS/bleaching app | GBRMPA Townsville | P2 |
| **iSeahorse (Project Seahorse, UBC)** | **○ Not used yet** — but iNat powered, so our live handoff already reaches it. Partnership: none | Seahorse sightings (96% from divers) → IUCN | Dr Sarah Foster | P2 |
| **IUCN SSC Shark Specialist Group** | **○ Not used yet** — distinct from Red List (which we use). Partnership: none | Diver shark/ray records fill Data Deficient gaps | [EOI/contact]( 28  | P3 |
| **Seasearch (MCS UK)** | **○ Not used yet** — net new (UK/Ireland). Partnership: none | UK/Ireland diver habitat/species records | info@seasearch.org.uk; regional coordinators | P3 |
| **Seagrass-Watch** | **○ Not used yet** — net new. Partnership: none | Standardized seagrass monitoring | per region local contacts | P3 |

> **Leverage insight:** iSeahorse is iNaturalist powered and 96% of its sightings come from divers —
> the cleanest proof that our iNat handoff already works for a species program. Pre tag the iSeahorse
> iNat project and IUCN feeding seahorse data comes essentially for free.

## Bucket C — new data sources we could get data from (not yet integrated)

Angle: *"Your dataset would close a real gap in a free public reef atlas — can we access/ingest it,
and credit you?"* Weighted toward the coral cover time series gap (currently ~2 points/reef).

| Source | Already using? | Gap it fills | Access + license | Best contact | Tier |
|---|---|---|---|---|---|
| **ReefCloud (AIMS)** — [reefcloud.ai](https://reefcloud.ai/) | **○ Net new** | **Coral cover trends (core)** — aggregated standardized benthic estimates | Open platform; confirm reuse license | AIMS ReefCloud team (official channel) | P1 |
| **MERMAID (WCS)** — [datamermaid.org](https://datamermaid.org/) | **○ Net new** | **Coral cover + SE Asia/Indian Ocean/Pacific** | API + `mermaidr`; per project Public/Summary/Private | [contact us](https://datamermaid.org/contact-us); Iain R. Caldwell (Lead Data Analyst) | P1 |
| **AGRRA** — [agrra.org](https://www.agrra.org/) | **◐ Partly** — AGRRA already credited; this deepens to full cover time series | **Coral cover + Caribbean** (2,000+ reefs, 29 countries) | Open; **CC BY 4.0**; Data Explorer + OBIS | info@agrra.org | P1 |
| **CREMP (Florida FWC/FWRI)** — [myfwc.com](https://myfwc.com/research/habitat/coral/cremp/data/) | **○ Net new** | **Deep multi decade cover** (Keys, SE FL, Dry Tortugas) | Open download; public domain | Corals@MyFWC.com | P1 |
| **AIMS LTMP** — [eatlas](https://eatlas.org.au/gbr/ltmp-data) | **◐ Partly** — AIMS LTMP already credited; this pulls the full GBR time series | GBR coral cover time series (1992–present) | Open via AIMS Data Explorer (use intent form) | AIMS Data Explorer | P2 |
| **Reef Check Global Reef Tracker** | **◐ Partly** — Reef Check already credited; this adds bulk cover data | Coral cover + 40+ country citizen science | Free/open DB; confirm bulk/API | reefcheck.org contact | P2 |
| **REEF Volunteer Fish Survey** | **◐ Yes (raw upgrade)** — already used; request raw effort data for richer odds | Diver sightings beyond iNat/GBIF (encounter odds) | Public reports; raw on request | data@REEF.org | P2 |
| **Global Coral Bleaching Database 1980–2020** (van Woesik) — [figshare](https://doi.org/10.6084/m9.figshare.c.5314466) | **○ Net new** | Field observed bleaching beyond NOAA CRW (34,846 records) | Open figshare; cite authors | Direct download | P2 |
| **OBIS / Diveboard** — [obis.org](https://obis.org/) | **◐ Partly** — OBIS used; Diveboard scuba dataset within it is net new | Scuba specific sightings (encounter odds) | Fully open; OBIS API; CC per dataset | OBIS API (no outreach) | P2 |
| **KSLOF Global Reef Expedition** — [livingoceansfoundation.org](https://www.livingoceansfoundation.org/global-reef-expedition/) | **○ Net new** | Cover baselines + Indian Ocean/Pacific/Red Sea | Public; confirm bulk license | Official channel | P3 (single epoch) |
| **GCRMN regional nodes** — [gcrmn.net/regions]( 38  | **◐ Partly** — GCRMN aggregate used; node level data is net new | Regional cover (Red Sea, ROPME, S Asia, W Indian Ocean, E Asia) | Partnership required; varies by node | Per node Regional Coordinators | P3 (brokered) |
| **CARICOMP (UWI)** | **○ Net new** | Historical Caribbean cover (1992–2007) | Legacy; archived | UWI Jamaica Data Mgmt Centre | P3 (legacy) |

> Still thin after this pass: dedicated **eDNA repositories** and **eOceans** showed no clear
> open/partnership data channel — flag for targeted follow up before outreach. Allen Coral Atlas is
> habitat mapping (extent, not cover over time), so it does not fix the trend gap.

---

# Ready to send drafts

> All drafts: nonprofit framing, no monetization, no hyphens (em dashes only), from
> **hello@scubaseason.fun**. Replace `[Name]`. Verify any named address before sending.

## Diver channels

### Draft — Partnership email to REEF / Reef Check / CoralWatch (P1)
**Subject:** A free nonprofit reef atlas that points divers to reefs needing fresh eyes

Hello [name / team],

I help run scubaSeason.fun, a free public nonprofit reef atlas. It has no data of its own. It is
built entirely from public scientific sources and exists to send divers toward reefs that science
has lost recent sight of.

A diver filters reefs by month, region, or the species they hope to see, then reads each reef's
health in plain language, Thriving, Under pressure, or Witnessing change. Each site shows encounter
odds worked out from how often divers have logged that animal there over the past year, and we
surface reefs where nobody has logged anything recently as reefs that need fresh eyes. Divers can
contribute their own sightings straight through iNaturalist into GBIF.

Your volunteers already live this idea. I would love to explore whether we can point our users
toward your survey program, credit your data correctly, and help close the observation gaps you
care about. No commission, no monetization, nonprofit on both sides.

Could I share a short walkthrough?

Warmly,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — ScubaBoard moderator request (self promo is banned; partner only)
**To:** NetDoc@ScubaBoard.com (cc Michelle Ehrenberg)
**Subject:** Permission to share a free nonprofit reef tool in Marine Science & Conservation

Hi Pete,

I know ScubaBoard does not allow self promotion in new threads, so I am reaching out first rather
than posting.

I help run scubaSeason.fun, a free nonprofit reef atlas built only from public scientific sources.
It points divers toward reefs that science has no recent eyes on, shows each reef's health in plain
language, and lets divers turn a dive log into a real scientific record through iNaturalist and GBIF.
There is no monetization of any kind.

I think it genuinely belongs in the Marine Science & Conservation discussion, but only with your
blessing and in whatever form you prefer, a single intro thread, a mention in an existing one, or
nothing at all if you would rather not. Whatever keeps the board clean works for me.

Thank you for considering it,
[Name] — hello@scubaseason.fun

### Draft — r/scuba modmail (before any post)
**Subject:** OK to share a free nonprofit reef atlas? Want to follow your rules

Hi mods,

Before posting anything I wanted to check with you. I help run scubaSeason.fun, a free nonprofit
reef atlas with no ads and no monetization. It points divers to reefs that science has no recent
eyes on, shows each reef's health in plain language, and lets a dive log become a real scientific
record through iNaturalist into GBIF.

Would a single honest intro post be welcome, and if so is there a format or flair you prefer? Happy
to do an AMA style thread instead if that fits better. I would rather ask than break a rule.

Thanks,
[Name]

### Draft — r/scuba post (only if mods approve)
**Title:** I built a free nonprofit reef atlas that shows you which reefs science has no recent eyes on

Most dive maps tell you where it is pretty. This one tells you where the ocean needs eyes.

scubaSeason.fun is free, nonprofit, and has no data of its own. It pulls from public scientific
sources to show each reef's health in plain language, Thriving, Under pressure, or Witnessing change.
You filter by month, region, or the species you want to see, and each site shows encounter odds like
"Green turtle, about 6 in 10 dives" worked out from divers' logs over the past year.

The part I care about most: it surfaces reefs nobody has logged recently and flags them as needing
fresh eyes. If you dive one of those, your sighting, logged through iNaturalist into GBIF, becomes a
real scientific record. No commission, no booking, no catch.

Would love your honest feedback on the reef health wording and the encounter odds. What would make
this actually useful on your next trip?

### Draft — Facebook group admin DM (permission first)
Hi [admin name],

I run a free nonprofit project, scubaSeason.fun, and I respect that the group does not allow random
link drops, so I am asking you first.

It is a reef atlas built only from public scientific data. It shows divers which reefs science has
lost recent sight of, reads each reef's health in plain language, and turns a dive log into a real
scientific record through iNaturalist. No ads, no selling, nonprofit.

Would you be open to me sharing it once with the group, or would you rather post it yourself in
whatever words you like? Totally fine either way, I just did not want to step on the rules.

Thank you for keeping the group good,
[Name] — hello@scubaseason.fun

### Draft — Creator collab DM (Dive Talk / YouTube creators)
Hi [names],

Big respect for the community you have built. I help run scubaSeason.fun, a free nonprofit reef
atlas, no ads and nothing to sell.

The hook your audience might enjoy: it shows which reefs science has no recent eyes on, reads reef
health in plain language, and turns a viewer's dive log into a real scientific record through
iNaturalist and GBIF. The emotional pull is not "book a trip," it is "the reef you are about to dive
may be one nobody has logged in a year, and you could be the one who does."

If it resonates, I would love to walk you through it for a possible segment or shoutout. No payment
expected, this is a nonprofit, just genuine alignment.

Thanks either way,
[Name] — hello@scubaseason.fun

## Bucket A — credited source orgs

### Draft — NOAA Coral Reef Watch
**To:** Caroline.Donovan@noaa.gov
**Subject:** Crediting Coral Reef Watch on a free reef atlas for divers

Hi Caroline,

I run scubaSeason.fun, a free public nonprofit reef atlas. Our tagline is "find where to dive, and
where the ocean needs eyes." We translate reef health into plain language for recreational divers —
Thriving, Under pressure, or Witnessing change — at the exact moment they research a dive.

Coral Reef Watch is central to that. Your satellite heat stress and bleaching products are how a
diver on our atlas learns a reef is under pressure right now. We credit CRW openly on our Method
page, follow your citation recommendations, and link back to your portal.

I wanted to reach out for two reasons. First, to make sure we are crediting and citing CRW the way
you would want. Second, to ask whether you would be open to a light relationship — being listed as a
data user on our side, and anything that helps your bleaching alerts reach more divers.

We take no commission and sell nothing. Everything is built from 63 public scientific sources, all
openly credited.

Would you be open to a short call?

Warm regards,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — Allen Coral Atlas
**To:** feedback@allencoralatlas.org (cc bbambic@asu.edu)
**Subject:** Putting Allen Coral Atlas maps in front of divers — crediting + a relationship

Hi Allen Coral Atlas team,

I run scubaSeason.fun, a free public nonprofit reef atlas that helps recreational divers find where
to dive and see where the ocean needs eyes. We surface reef health in plain language at the moment
someone is researching a dive.

Your global reef maps and monitoring are part of how we show divers the reef they are about to
visit. We credit Allen Coral Atlas on our Method page and link back, following your attribution terms.

I would love to confirm we are crediting you correctly, ask for your blessing, and explore being
listed as a data user — plus anything that helps your maps reach more of the divers who care about
these reefs.

We are a nonprofit, take no commission, and openly credit all 63 public data sources we build on.

Open to a quick call?

Best,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — Green Fins (Reef-World Foundation)
**To:** partnerships@reef-world.org
**Subject:** Pointing divers toward reefs that need eyes — and toward Green Fins operators

Hi Reef-World team,

I run scubaSeason.fun, a free public nonprofit reef atlas — "find where to dive, and where the ocean
needs eyes." We help recreational divers choose where to dive and understand reef health in plain
language.

There is a natural fit here. We point divers toward reefs that need attention; Green Fins points them
toward operators who dive those reefs responsibly. We reference Green Fins context on our Method page
and link back.

I would love to explore a relationship — cross linking where it makes sense, making sure we represent
Green Fins accurately, and helping your standard reach more divers at the planning moment.

We are a nonprofit, take no commission, and credit every one of our 63 public data sources.

Open to a short call?

Warm regards,
[Name] — scubaSeason.fun — hello@scubaseason.fun

## Bucket B — observer gaining programs

### Draft — iNaturalist (to Tony Iwane / cc help@inaturalist.org)
**Subject:** Routing recreational divers into iNaturalist at the surface interval

Hi Tony,

I run scubaSeason.fun, a free nonprofit reef atlas with a simple mission: help people find where to
dive, and show them where the ocean needs eyes. We take no commission and sell nothing.

iNaturalist is the backbone of our contribute pipeline. When a diver surfaces having photographed an
animal, we walk them straight into uploading it to iNaturalist with location, so the community can
confirm it to research grade and it can flow onward to GBIF and inform Red List assessments. We frame
iNaturalist as the place a dive becomes science.

I understand new Network site applications are paused, so I am writing about two things. First, we
would love guidance on being a clean marine on ramp that sends well formed, well located observations
your way. Second, we would like to explore joining the Ambassador Program so we can promote
iNaturalist consistently to an audience that is already underwater and motivated.

Could we find 20 minutes to talk? Happy to share our handoff flow in advance.

With thanks,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — Reef Check (to Dr Jan Freiwald / cc ecodiver@reefcheck.org)
**Subject:** Sending motivated divers into EcoDiver training

Hi Dr Freiwald,

I run scubaSeason.fun, a free nonprofit reef atlas. Our tagline is find where to dive, and where the
ocean needs eyes. We take no commission.

Many of our divers start by casually logging what they see, then want to do something more rigorous.
That is exactly the moment we would like to route them to Reef Check EcoDiver training and the nearest
coordinator or training facility, so they can produce real monitoring grade transect data instead of
one off sightings.

Could we coordinate so the handoff works cleanly — a deep link to EcoDiver training and a way to
surface the closest coordinator by region? We would also be glad to feature Reef Check prominently for
any diver looking to step up to structured monitoring, and we would welcome co promotion if that is
useful to you.

Would a short call make sense?

Best,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — REEF (to Dr Christy Pattengill-Semmens)
**Subject:** Growing your volunteer fish surveyor base from already in the water divers

Hi Dr Pattengill-Semmens,

I run scubaSeason.fun, a free nonprofit reef atlas that nudges recreational divers to turn dives into
data. No commission, nothing sold.

The Volunteer Fish Survey Project is a natural destination for our divers. We reach people at the
moment they care most, right after a dive, when they want their fish sightings to count. We would
like to route divers in REEF regions to your survey method and training so they become recurring
volunteer surveyors rather than one time loggers.

Could we coordinate the handoff — linking to your training and survey resources — and explore co
promotion? I would love to learn what kind of incoming divers are most useful to you so we can pre
qualify the referral.

Thank you for the decades of work behind this dataset.

Best,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — PADI AWARE (via Become a Partner form)
**Subject:** Referral partner — routing divers into Dive Against Debris and the Shark & Ray Census

Hello PADI AWARE team,

I run scubaSeason.fun, a free nonprofit reef atlas built to motivate recreational divers to contribute
marine observations. We earn no commission.

We would like to become a referral partner. At the moment a diver logs or plans a dive, we can route
them into Dive Against Debris and into the new Global Shark and Ray Census, deep linking to the AWARE
app and the Conservation Action Portal. Our whole reason to exist is to catch motivated divers and
point them at the program where their effort matters most, and AWARE is one of the strongest fits
anywhere.

I am submitting through your partner path since I could not find a named partnerships contact publicly.
Could you direct me to the right person to coordinate the handoff and discuss co promotion?

With appreciation,
[Name] — scubaSeason.fun — hello@scubaseason.fun

## Bucket C — new data partners

### Draft — ReefCloud / AIMS
**To:** ReefCloud team (via reefcloud.ai) / AIMS partnerships
**Subject:** Crediting ReefCloud benthic trends in a free public reef atlas

Hello ReefCloud team,

I help run scubaSeason.fun, a free nonprofit reef atlas with the mission "find where to dive, and
where the ocean needs eyes." It is built entirely from public data and credits every source. We
classify each reef as Thriving, Under pressure, or Witnessing change using NOAA heat data, reef
surveys, and Global Fishing Watch.

Our biggest gap today is coral cover over time. For many reefs we hold only two survey points, which
is too thin to tell an honest story of decline or recovery. ReefCloud's aggregated, standardized
benthic trends would close that gap directly, and we would credit ReefCloud and AIMS prominently on
every reef where your data appears.

Could you point me to the right way to access reef level cover trends for reuse in a free public tool,
along with your licensing terms? Happy to share exactly how attribution would appear before anything
goes live.

With thanks,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — MERMAID (WCS)
**To:** MERMAID team (datamermaid.org/contact-us)
**Subject:** Surfacing Public tier MERMAID reef trends to divers, fully credited

Hello MERMAID team,

scubaSeason.fun is a free nonprofit reef atlas built only from public data, crediting every source. We
show divers where reefs are thriving and where the ocean needs eyes, and we want to add real
coral cover trends rather than the two thin survey points we often have today.

MERMAID's Public and Public Summary project data would let us show contributors' benthic trends to the
diving public, with attribution flowing back to each monitoring team behind every reef. We are
comfortable working through the API or the mermaidr package and honoring each project's sharing level.

Could you confirm the cleanest path for a nonprofit to consume Public tier aggregates, the licensing
terms, and any attribution wording you would like us to use? We would love to show MERMAID's network
the reach their data earns in a public facing tool.

Warm regards,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — AGRRA
**To:** info@agrra.org
**Subject:** Lighting up Caribbean reefs with AGRRA indicators in a free atlas

Hello AGRRA team,

I work on scubaSeason.fun, a free nonprofit reef atlas built entirely from public data, with full
credit to every source. We classify reefs as Thriving, Under pressure, or Witnessing change and show
divers where the ocean needs attention.

The AGRRA database is the richest Caribbean reef health record we know of, and its CC BY 4.0 license
fits our credit everything model perfectly. We would like to ingest your benthic cover and coral
condition indicators to give Caribbean reefs the time depth our atlas currently lacks, with clear
AGRRA attribution on each reef.

Could you direct this to whoever manages data access, and confirm the best download path through your
Data Explorer for ongoing reuse? Glad to share our attribution layout for your review.

Thank you,
[Name] — scubaSeason.fun — hello@scubaseason.fun

### Draft — CREMP / Florida FWC FWRI
**To:** Corals@MyFWC.com
**Subject:** Using CREMP long term cover data in a free public reef atlas

Hello CREMP team,

scubaSeason.fun is a free nonprofit reef atlas built from public data, crediting every source. We help
divers see where reefs are thriving and where they are under pressure, and we are working to show
honest coral cover trends over time.

CREMP's multi decade benthic record for the Florida Keys, Southeast Florida, and the Dry Tortugas is
exactly the depth we need. Today many of our Florida reefs carry only two data points, so your
time series would turn flat snapshots into real decline or recovery stories, credited to FWC and FWRI.

We can pull the geodatabase and CSV files from the FWC GIS portal. Before we publish, could you confirm
there are no reuse restrictions for a nonprofit public tool, and the citation wording you prefer?

With appreciation,
[Name] — scubaSeason.fun — hello@scubaseason.fun

---

## Caveats for the operator

- **Verify named addresses before sending.** NOAA (Donovan), ASU/Allen (Bambic), and a few research
  contacts came from search summaries, not a single canonical staff page.
- **GBIF has a binding data user agreement** — cite DOIs; this is compliance, not co promo.
- **PADI AWARE's partner program is donor oriented** — keep framing strictly data/mission, never money.
- **Self promo gates are real:** ScubaBoard bans it outright; most large FB groups ban link drops;
  r/scuba wants modmail first. Lead with partner endorsements so later broad posts have cover.
- **Coral cover gap is the highest value data win:** ReefCloud, MERMAID, AGRRA, CREMP directly fix the
  thin "2 points per reef" problem. AGRRA (CC BY 4.0) and CREMP (public domain) are the lowest friction.
- **Follow ups flagged:** dedicated eDNA repositories and eOceans data access need a targeted second pass.
