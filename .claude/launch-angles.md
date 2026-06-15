# scubaseason.fun — Launch PR Angles

*Last updated: 2026-06-12*

---

## Sequencing

| Angle | Status | Unlock condition |
|---|---|---|
| Angle 2 — Founder story | **Ready now** | No dependencies |
| Angle 1 — Product story | **Hold** | First data partnership live (MERMAID → Reef Check → REEF.org) |

Run Angle 2 first. It doesn't need partners. Once the first org signs on, the product story has "validated in partnership with X" and the forecast claims have scientific backing — then pitch Angle 1.

**Next action for Angle 1 unlock:** Implement MERMAID API (no negotiation needed). Then email Reef Check (rcinfo@reefcheck.org). First reply = green light to pitch product story.

---

## Angle 1 — The Product Story *(hold until first data partnership)*

**"63 Data Sources. 3 Labels. The First Platform That Predicts When Your Favorite Reef Will Be Gone."**

- **Story type:** Product launch / category creation / science translation

- **The gap it fills:** Two things exist today. Static dive directories (PADI, Diveboard, Scuba Earth, Deepblu) — user reviews, GPS pins, no science. And peer-reviewed ocean research — accurate, thorough, unreadable by anyone booking a dive trip. Nobody has bridged them. scubaseason.fun ingests 63 live data sources — NOAA thermal stress, Global Fishing Watch fishing pressure, IUCN species status, coral cover surveys, iNaturalist sightings and more — and translates them into three labels a diver can act on: **Thriving, Under Pressure, Witnessing Change.** Not a badge on top of a directory. A new category.

- **The prediction element — this is the real story:** The platform doesn't just show current reef state. It uses the data trajectory to forecast where a reef is going. A site classified as Witnessing Change — coral cover down 16 percentage points since 2010 — has a projected timeline. Divers can see not just "this reef is struggling" but "at this rate, here is what remains." Science has had this data for years. No one has translated it into a consumer-facing forecast. Until now.

- **Species sightings probability — live:** The platform shows likelihood of encountering specific species at each site, updated continuously from iNaturalist and GBIF ingest. Not "people have seen manta rays here" — a living probability that updates as sightings come in.

- **The concrete numbers:**
  - 63 data sources ingested
  - 114 locations, 356 dive sites
  - 258 IUCN-tracked species with population trend
  - Coral cover: Cozumel −16pp since baseline, Bonaire −15pp, North Male Maldives −17pp (Witnessing Change)
  - Raja Ampat, Fakarava, Palau: Thriving — coral >40%, stable or gaining, low fishing pressure
  - Nonprofit

- **Why now:** Platform is live. Evergreen for trade and conservation press. Fresh for sustainable travel.

**Who to reach:**
- *Hakai Magazine* — the science translation angle: "63 sources, 3 labels, a forecast — what it looks like when ocean science finally becomes useful for the people who love reefs"
- *SCUBA Diving Magazine / Diver (UK) / Sport Diver / X-Ray Mag* — core audience product story; this is what they've been waiting for
- *Outside Magazine* — "The platform that tells you not just if the reef is alive, but how long it has left"
- *Condé Nast Traveler / Travel + Leisure* (sustainable travel desk) — book smarter; the reef health forecast as a trip planning tool
- *Mongabay Oceans / Inside Climate News* — conservation angle: making 14 years of reef decline data legible to 6 million recreational divers
- *Science / Nature Climate Change* (journalist beat, not the journals) — the forecast methodology is a story for science reporters covering ocean futures

**Proof needed before pitching:**
- One specific reef trajectory example with the forecast framing (Cozumel or Bonaire — strongest before/after in the data)
- One species sighting probability example: site name + species + current probability
- Confirm "63 sources" — exact count from the data pipeline

---

## Angle 2 — The Founder Story

**"She Replaced an Entire Company With AI Agents. The Platform Runs Itself."**

- **Story type:** Founder / future-of-work / AI infrastructure
- **The real scope — every role that doesn't exist:**

  | Role | What the agents did |
  |---|---|
  | Market researcher | Competitor analysis (PADI, Diveboard, Scuba Earth, Deepblu), user pain point validation, confirmed complaints online |
  | Product manager | PRD writing, user stories, epics, prioritization, positioning decisions — 5x daily product operator still running |
  | UX designer | UX specifications, component design, homepage architecture |
  | Engineer | Full Next.js + TypeScript frontend: route architecture, components, data pipelines, bug fixes |
  | QA | Test case generation, TypeScript checking, end-to-end testing |
  | Data engineer | Researched which ocean monitoring sources were useful; set up accounts; built ingestion pipelines for iNaturalist, GFW, IUCN, NOAA |
  | Ops | Account setup for data providers; ongoing weekly data refresh routines |
  | PR / GTM | Outreach sequencing, email drafts, partner contact management |
  | Grant writer | NatGeo, Schmidt Marine, GFCR pipeline; deadline tracking; draft sections |
  | Chief of staff | Daily morning standup: synthesizes all operators, sends one Telegram to Josie, waits for approval before agents run |

- **What makes it different from every other "I built this with AI" story:** The build ended. The team didn't. The agents still run. Weekly data refresh. Daily product decisions. GTM emails going out Mon/Wed/Fri. Grants being drafted Tue/Thu. A morning briefing arriving every day. One person. No engineers. No employees. The platform maintains itself.

- **The one-sentence version:**
  > "A non-technical founder used AI agents to do every job that would normally require a company — market research, product specs, UX design, coding, QA, data pipelines, GTM, grant writing — and then set the agents up to keep running. She gets a Telegram every morning telling her what happened overnight."

**Who to reach:**
- *Fast Company* — "Most Creative People" / "Work Smarter"; the ops-replacement frame is their format
- *Wired* — Backchannel; "what it looks like when one person IS the team"
- *The Atlantic* — technology section; the org structure that doesn't exist
- *Bloomberg Businessweek* — future of work; nonprofit + full-stack ops replacement as a case study
- *TechCrunch* — solo founder, AI infrastructure, nonprofit differentiator
- *Indie Hackers* — submit as a product story with the full stack breakdown; audience will replicate it
- *Lenny's Newsletter* — replaced PM + eng + QA + data ops + grants with agents; his audience wants the playbook
- *Latent Space / Pragmatic Engineer* — technical deep-dive on the agent architecture

**Proof needed before pitching:**
- Walk through 3–4 specific agent-run tasks concretely (not "agents helped me code" — "an agent researched five ocean monitoring APIs and ranked them by data quality and access complexity")
- Confirm which tools/harnesses: Claude Code, OpenClaw/squish, scheduled cron agents
- One sentence on what the morning Telegram looks like

---

## Combined pitch frame

> "A non-technical founder used AI agents to do every job that would normally require a company — and then left them running. The platform classifies 114 reef dive sites as Thriving, Under Pressure, or Witnessing Change using live NOAA and Global Fishing Watch data. No engineers. No employees. She gets a Telegram every morning."

---

## Sequencing recommendation

Run them separately. Trade/travel press cares about the product; they don't care about the AI. Tech/AI press cares about how it was built; they'll cover the platform as context. Pitching both in one note dilutes both.

**Suggested order:**
1. Product story first to dive trade press — establishes scubaseason.fun as a real thing with credibility
2. Founder story 2–3 weeks later to tech/AI press — now there's coverage to point to
