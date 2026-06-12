# Grants Charter — scubaseason.fun

_State file for the grants-operator. Updated every Tue/Thu run. Do not delete sections — append under them._

---

## Pipeline status

| Grant | Deadline | Status | Priority |
|---|---|---|---|
| NatGeo — Developing Future Ocean Stewards | Jun 24, 2026 | Not started | P1 — 13 days |
| Schmidt Marine LOI | TBD — portal verify first | Not started | P2 |
| Agog Open Call | Jun 12, 2026 | SKIPPED — deadline passed, no WebXR commitment | — |
| GFCR inquiry email | No deadline | Not started | P4 |

---

## Cross-cutting blockers (surface until resolved)

- [ ] **Entity name + EIN** — Is scubaseason.fun incorporated? Under what legal name?
- [ ] **Founder bio** — 1 paragraph about Josie Leung for grant applications. Not yet written.
- [ ] **Scientific advisor or named partner org** — No formal advisor listed anywhere. Required for NatGeo.
- [ ] **/data methodology page** — Fully shipped on prod? Needed to back claims in all applications.
- [ ] **501(c)(3) or fiscal sponsor** — Status affects every grant. NatGeo requires nonprofit status.

---

## NatGeo — Developing Future Ocean Stewards

**Deadline:** Jun 24, 2026
**Ask:** Up to $15,000
**Fit:** Citizen reef monitoring, conservation data for divers, nonprofit

### Sections to draft

- [ ] Project description (500 words)
- [ ] Conservation impact statement
- [ ] Budget justification
- [ ] Applicant bio

### Notes

Lead with civic reef-monitoring thesis: divers as citizen scientists, sightings becoming scientific records.
Never overclaim — state only what exists: 356 sites, live NOAA data, iNaturalist ingest, 63 credited sources.

---

## Schmidt Marine LOI

**Deadline:** TBD — verify schmidtmarine.secure-platform.com before drafting
**Fit:** Ocean data, reef monitoring, open data

### Status
Portal not yet verified. Do not draft until confirmed open.

---

## Agog Open Call

**Deadline:** Jun 12, 2026
**Blocker:** Josie must confirm WebXR build commitment before any work here.
**Action needed:** Ask Josie directly via Telegram if committed.

---

## GFCR Inquiry

One short paragraph positioning scubaseason.fun as a reef monitoring tool aligned with GFCR goals.
Not a full application — just a warm intro email.

---

## Draft content

_Operator appends draft sections below this line._

---

## NatGeo — Developing Future Ocean Stewards — Draft Sections

_Drafted 2026-06-12. Ready for Josie's review. Placeholders marked with [brackets] require her confirmation before submission._

### Project Description (500 words)

Coral reefs are changing faster than the science that watches them. A reef that was thriving when a travel blog published its hero photo may be bleached, overfished, or silted by the time a diver books a flight on that recommendation. The gap between published dive marketing and actual reef state is not a minor inconvenience — it is a data problem with real conservation consequences. Divers make decisions on brochure copy. Scientists lack the field observations to track change at the resolution reefs need. And the vast community of people who actually visit these ecosystems — hundreds of millions of dives logged every year — produce almost no structured evidence.

scubaseason.fun was built to close that gap.

It is a live, nonprofit dive atlas that shows the honest state of a reef: thermal stress, bleaching alert level, fishing pressure, species presence backed by real sighting records, and coral habitat maps — updated daily from satellite feeds and the world's largest volunteer survey networks. There are no marketing adjectives. No affiliate framing. No "hidden gems." Every data point carries a source credit, and every source is linkable. The site currently covers 356 dive sites across 113 locations, draws from 63 credited data providers, and integrates live feeds from NOAA Coral Reef Watch, iNaturalist, the REEF volunteer fish survey database (275,000+ surveys), the Allen Coral Atlas, and Green Fins certified operator listings.

The civic reef-monitoring thesis at the center of the project is this: divers are the largest untapped workforce in ocean science. They are already there. They already look. What they lack is a system that routes their attention to the reefs that most need observation — and a pathway that converts what they see into a scientific record.

scubaseason.fun addresses both. Each site page shows not just what species have been observed, but when the last structured survey was submitted and how many sighting records exist. Sites with sparse recent data are surfaced as reefs that "need eyes" — places where a diver's iNaturalist observation or REEF survey submission would materially add to the global record. The atlas makes the gap visible. The diver decides to fill it.

This changes the nature of a dive trip. A diver choosing between two destinations can now ask not just "what will I see?" but "where does my presence as an observer actually matter?" That is a behavioral shift — from passive consumer to active contributor to reef science — and it happens inside an interface divers are already using to plan where to go.

The platform is built on open infrastructure, licensed CC BY-NC, and run as a nonprofit. It was built entirely by one person. The data integrations are real and running, not speculative. The goal is not to replace professional reef monitoring — it is to extend its reach by mobilising the diver community as a distributed sensor network, one site, one species sighting, one coral condition report at a time.

National Geographic funding would allow the project to deepen its methodology transparency (a public /data page explaining every source, its refresh rate, and its known limitations), reach more divers through community outreach, and sustain the infrastructure costs of running live satellite and biodiversity data feeds at scale.

---

### Conservation Impact Statement (250 words)

The most immediate conservation impact of scubaseason.fun is reef state transparency. A diver who can see that a reef is under thermal stress — not from a three-year-old blog post, but from yesterday's NOAA satellite reading — makes a fundamentally different set of decisions: whether to go, what to look for, and whether what they see matches or contradicts the monitoring record.

The second impact is attention routing. The atlas surfaces which reefs have thin or stale observational records. When a diver can see that a site has had no structured fish survey in 18 months, and that the nearest REEF-certified survey point is 40 km away, they have actionable information. They can submit a survey. They can log their sightings. That data flows back into the same networks — iNaturalist, REEF — that scientists draw on. The atlas does not collect its own data; it makes the pipeline legible and the contribution easy.

The third impact is behavioral. Directing diver attention toward under-surveyed reefs shifts the community from a group that consumes reef experiences toward one that actively participates in monitoring them. This is a durable behavior change — divers who understand why their observation matters are more likely to repeat it, teach it, and advocate for the reefs they have contributed to watching.

All data sources are credited, linkable, and attributed to their scientific origin. Data sovereignty is not a footnote — it is architecture. Every claim on the site traces back to a named, verifiable source. That honesty is the foundation of the trust that diver behavior change requires.

---

### Budget Justification (150 words)

The requested $15,000 supports 12 months of operating and development costs for a solo nonprofit project with no staff overhead.

| Line item | Amount | Rationale |
|---|---|---|
| Hosting and infrastructure (Vercel, CDN) | $2,400 | Current production spend; live data pipeline requires always-on deployment |
| Data API access and refresh costs | $1,800 | NOAA, iNaturalist, and third-party biodiversity feeds; some tiers require paid access at scale |
| /data methodology page — design and development | $4,500 | Part-time contract support to ship the public data transparency page; required by multiple grant reviewers |
| Community outreach — email platform and modest paid reach | $2,800 | Newsletter infrastructure and limited social promotion to reach the diver community |
| Contingency | $3,500 | Reserve for unexpected API cost increases or infrastructure scaling |
| **Total** | **$15,000** | |

No funds are allocated to founder salary. All work remains volunteer or contracted at market rate for specific deliverables only.

---

### Applicant Bio — Josie Leung (100 words)

Josie Leung is a Hong Kong-based open-source developer and [X-year] diver who built scubaseason.fun to make reef science legible to the people who visit reefs most: divers. She designed and engineered the entire platform solo — integrating live feeds from NOAA, iNaturalist, the REEF survey network, the Allen Coral Atlas, and 59 additional credited sources — and operates it as a nonprofit under a CC BY-NC license. [Background in Y — e.g., software engineering / data / marine biology — Josie to confirm.] Her work is grounded in the belief that honest evidence, plainly presented, changes how people relate to the ocean.

---

## New opportunities — researched 2026-06-12

_Research conducted 2026-06-12. Deadlines verified against primary sources where possible. "Closed" = current cycle has passed; watch for next cycle. Fit score is 1–5 (5 = perfect fit for scubaseason.fun as a solo-dev nonprofit civic reef atlas)._

---

### Category A — AI for Good / Tech grants and hackathons

| Org + grant name | Deadline | Ask range | Fit | Pitch angle | URL |
|---|---|---|---|---|---|
| **Anthropic — Claude Corps (host org)** | Jul 17, 2026 | $10K grant + free fellow (salary paid by Anthropic) | 5 | scubaseason.fun gets a paid AI fellow to build data tooling; reef nonprofit Reef Environmental Education Foundation is already a named host — strong precedent | https://www.anthropic.com/claude-corps/host |
| **Anthropic — Claude for Nonprofits** | Rolling (no deadline) | 75% discount on Team/Enterprise; API credits available | 4 | Free or near-free Claude API credits to power the reef health model and species enrichment scripts; nonprofit status required (501c3 or fiscal sponsor) | https://www.anthropic.com/news/claude-for-nonprofits |
| **Google.org Impact Challenge: AI for Science** | CLOSED May 1, 2026 — watch for next cycle | $500K–$3M | 4 | Biodiversity monitoring + climate science = exact fit; next cycle likely late 2026 or 2027 | https://blog.google/company-news/outreach-and-initiatives/google-org/impact-challenge-ai-science-open-call/ |
| **Google.org — AI for Nature and Climate Accelerator** | CLOSED May 1, 2026 — watch for next cycle | Up to $350K in Google Cloud credits + 30 days TPU | 4 | Live satellite reef data + iNaturalist API = ideal candidate for cloud compute credits; monitor for 2027 cycle | https://grantedai.com/grants/ai-for-nature-and-climate-accelerator-google-org-24f4f750 |
| **Mozilla Technology Fund** | Rolling (check portal) | Varies ($50K range typical) | 3 | Open-source civic data tool with CC BY-NC license; environmental justice angle on reef data access | https://www.mozillafoundation.org/en/what-we-do/grantmaking/ |
| **Salesforce.org — Catalyst Fund / Accelerator for Nature** | Rolling; watch for next cohort | $50K–$250K (unrestricted) | 3 | Nature-based civic data tool; previous grantees include The Nature Conservancy for field environmental monitoring tech | https://www.salesforce.com/news/stories/salesforce-accelerator-for-nature/ |
| **OceanHackWeek 2026 (OHW26)** | Applications ~Jun–Jul 2026 (check site) | No cash prize — project incubation, mentorship, compute | 4 | **Tech differentiator:** solo dev with live NOAA + iNaturalist APIs + reef health model = ideal project for OHW collaborative sprint; Aug 24–28 at Bamfield Marine Sciences Centre, BC | https://oceanhackweek.org/ |
| **Ocean Tech Hackathon (San Francisco)** | Check site for 2026 dates | Varies; VC-backed prizes | 3 | Live data atlas with Open API ties directly to SF ocean-tech investor community; Pebblebed VC (OpenAI/Sequoia lineage) sponsors venue | https://www.oceantechhackathon.org/ |
| **MIT Energy and Climate Hack** | Watch for Nov 2026 cycle | ~$1K/person per category | 2 | Climate data visualization angle; primarily team-based; worth entering as a showcase | https://www.mitenergyhack.org/ |
| **Microsoft AI for Good Lab Open Call** | CLOSED Feb 2025 — next cycle TBD; Washington State only | $5M pool in Azure credits | 2 | Low fit geographically (WA-based org required); worth monitoring if fiscal sponsor is WA-based | https://www.microsoft.com/en-us/research/academic-program/ai-for-good-lab-open-call/ |
| **Reef Support Hackathons** | Rolling — contact to pitch | Non-cash (data, mentorship, pilot partners) | 5 | Reef Support co-hosts coral hackathons with universities and NGOs; scubaseason.fun's existing data layer could be the challenge dataset | https://www.reef.support/programs/hackathons |
| **EMODnet / Copernicus Open Sea Lab** | Watch for 2026 edition | Non-cash (recognition + EU partner access) | 3 | European ocean data platform; scubaseason.fun's iNaturalist + NOAA integration is exactly what OSL targets; previous edition had 400+ participants | https://emodnet.ec.europa.eu/ |
| **Pacific Dataviz Challenge 2026** | Check site — 2026 theme is climate change | Prize pool $15K+ | 3 | Climate data visualization of reef state across Pacific sites is a natural entry; open to all ages/backgrounds | https://pacificdatavizchallenge.org/ |

**Hackathon tech differentiator note:** For any ocean or climate hackathon, lead with: solo dev, production-deployed (not a prototype), live multi-source data pipeline (NOAA daily satellite + iNaturalist live ingest + REEF 275K+ surveys), 356 sites, CC BY-NC open license. The fact that it is already running in production — not a weekend hack — is the strongest possible differentiator in any hackathon context.

---

### Category B — Ocean / marine conservation nonprofit grants (beyond existing pipeline)

| Org + grant name | Deadline | Ask range | Fit | Pitch angle | URL |
|---|---|---|---|---|---|
| **PADI AWARE Foundation — Community Grant** | Sep–Oct 2026 (next cycle; 2025 cycle closed Oct 3, 2025) | Up to $10K | 5 | Coral reef + citizen science + diver community = exact program match; operating budget must be under $1M; nonprofit or PADI dive center required | https://www.padi.com/aware/community-grants |
| **Save Our Seas Foundation — Small Grants** | Jul 3, 2026 (Stage 1) | Avg $5K (up to ~$15K) | 3 | Early-career researcher framing possible; focus is threatened marine megafauna (sharks/rays) — partial fit via species sightings data layer; reef atlas must be secondary framing | https://saveourseas.com/grants/funding-applications/small-grants/ |
| **Waitt Foundation — ROC Grants** | Rolling monthly | Up to $20K | 2 | Low fit: geographically restricted to Blue Prosperity Coalition partner nations (Azores, Bermuda, Fiji, Micronesia, Samoa, Tonga, Vanuatu); scubaseason.fun sites in those regions could qualify a targeted proposal | https://www.waittfoundation.org/roc-grants |
| **Pure Ocean Fund — Call for Projects** | CLOSED Oct 1, 2025 for 2026 cycle; watch for 2027 call | Up to €80K (€40K/yr × 2 yrs) | 4 | "Protecting Biodiversity and Restoring Marine Ecosystems" challenge track is exact fit; early-career researchers particularly welcome; nonprofit NGOs eligible | https://www.pure-ocean.org/en/call-for-projects/ |
| **Disney Conservation Fund** | Rolling (annual grants; 2026 grants awarded Mar 2026) | Avg ~$360K across 25 grantees | 3 | Conservation tech for marine wildlife corridors is current focus; scubaseason.fun's species movement data + reef corridor mapping is a viable angle; 501c3 required | https://impact.disney.com/environmental-sustainability/nature/ |
| **Tiffany & Co. Foundation** | NOT accepting new LOIs currently — monitor for reopening | $50K–$400K | 4 | Large-scale marine protection focus since 2000; have protected nearly 13M km² of ocean through grantees; civic reef monitoring data platform is strong angle when LOIs reopen | https://www.tiffanyandcofoundation.org/ |
| **Gordon and Betty Moore Foundation** | Invite-only / no open call | Large (typically $500K+) | 2 | Does not accept unsolicited proposals; requires institutional affiliation with a recognized research university or org; revisit if a formal scientific partnership is established | https://www.moore.org/ |
| **David and Lucile Packard Foundation** | Invite-only / no open call | Large | 2 | No open call; proactive grantmaking only; focus on Indonesia, Chile, and US West Coast fisheries + California coastal ecosystems; low fit without institutional co-applicant | https://www.packard.org/initiative/ocean-initiative/ |
| **Bloomberg Philanthropies (Ocean Initiative)** | No open call — funds existing partners | Large ($204M committed) | 1 | Works through named partners (Oceana, Rare, GFW, WCS, Blue Ventures, Coral Vita); not an open grant program; no path for a solo nonprofit without a partner org referral | https://www.bloomberg.org/environment/protecting-the-oceans/ |
| **Oak Foundation (marine)** | Invite-only / no open call | Large | 2 | Focuses on IUU fishing, small-scale fisheries governance, and plastic pollution — only partial thematic fit; no open solicitation; requires existing relationship | https://www.terravivagrants.org/oak-foundation-grants/ |
| **Blue Nature Alliance** | 6-month EOI cycle; next window opens Jan 2027 | Varies (MPA-scale projects) | 1 | Requires proposals to protect ≥100,000 km² of ocean or ≥30% of a country's EEZ; scubaseason.fun is a monitoring/transparency tool, not an MPA creation project — misfit | https://www.bluenaturealliance.org/faqs/ |
| **NFWF Coral Reef Stewardship Fund** | CLOSED Feb 26, 2026; next cycle likely Jan–Feb 2027 | $50K–$200K | 4 | Directly funds coral reef conservation; ~$3.5M available per cycle; scubaseason.fun's citizen-science + NOAA data layer maps well to their monitoring priorities; 501c3 required | https://www.nfwf.org/programs/coral-reef-stewardship-fund |
| **Ocean Startup Challenge (Canada)** | Opens Jun 5, 2026 | Up to $25K | 3 | Canadian startup framing possible if Josie has Canadian ties; blue economy + conservation tech angle strong; TRL 6 and under required | https://www.oceanstartupproject.ca/startup-challenge |

---

### Key cross-cutting notes from this research

1. **Highest-priority new action items (time-sensitive):**
   - **Claude Corps host application — deadline Jul 17, 2026.** scubaseason.fun gets a fully paid AI fellow for 12 months plus a $10K implementation grant. Reef Environmental Education Foundation (marine conservation) is already a named host. This is the closest-fit, fastest-return opportunity found. Blocker: requires 501c3 status and Claude for Nonprofits Team/Enterprise account. Fully remote orgs cannot participate in the Oct 2026 cohort.
   - **PADI AWARE Community Grant — next cycle opens Sep 2026.** Set a calendar reminder. Max $10K, coral reef priority track, nonprofit or PADI dive center required. Best fit of all Category B opportunities for a first application given budget ceiling and thematic alignment.
   - **Save Our Seas Small Grants — Stage 1 deadline Jul 3, 2026.** Worth a fast LOI if the species data layer can be framed as the primary contribution.

2. **Watch list (next cycles not yet open):**
   - Google.org AI for Science / AI for Nature (next cycle likely late 2026 or 2027)
   - Pure Ocean Fund (next call likely Sep–Oct 2026 for 2027 awards)
   - NFWF Coral Reef Stewardship Fund (next RFP likely Jan 2027)
   - Tiffany & Co. Foundation (LOIs currently closed — monitor quarterly)

3. **Requires institutional partner to unlock:**
   - Moore Foundation, Packard Foundation, Bloomberg Philanthropies, Oak Foundation — all invite-only or partner-referral only. These become viable only after a formal scientific advisor or partner org is named (see cross-cutting blockers above).

4. **501c3 / fiscal sponsor urgency:** Claude Corps, PADI AWARE, Disney, NFWF Coral Reef, and most Category A grants all require 501c3 status. Resolving the entity/fiscal sponsor question (see cross-cutting blockers) unlocks the majority of the pipeline.
