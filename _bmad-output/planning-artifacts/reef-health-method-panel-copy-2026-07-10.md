# Reef Health — "How this is measured" panel copy

**Author:** Mary (Business Analyst) · BMad
**Date:** 2026-07-10
**For:** the expandable "how is this measured / learn more" panel on each location page, and the linked Method page. Written for two readers at once: a diver who wants to trust the label, and a marine scientist who wants to check and correct it.
**Copy rules applied:** labels are Improving / Stable / Declining / Not surveyed; no hyphens; no contractions; contact is hello@scubaseason.fun. Curly-brace fields are filled per site at render time. Diver-facing sentences can take a further josie-voice pass before ship.

---

## Panel title

**How we read this reef**

## Intro (the model, plainly)

We describe a reef with one word. To get there we look at two things about the reef itself, and two forces acting on it.

**What the reef is:** how much living coral is on it, and how much fish life it holds. These two build the label.

**What is acting on it:** how hot the water has been, and how much fishing is happening around it. These two do not set the label on their own. They can hold a reef back from Improving, and a serious heat alert can push it to Declining, because that is damage happening right now. A warming trend or some passing boats, on their own, never make us call a reef Declining.

We always lead with the weaker of the two reef signals, because a reef is only as healthy as its thinnest part.

---

## Per-pillar cards (one card per pillar, filled for this site)

Each card carries: what it measures, the value here, how sure we are, and where the number comes from. The confidence line is the honest part. It tells you whether we are showing a real direction over time, a simple before and after, a single reading, or nothing yet.

**Confidence, in four steps:**
- **Measured trend** — 3 or more surveys across at least 4 years. We can show a real direction.
- **Before and after** — 2 surveys. We can say it rose or fell, but this is not a trend line.
- **Single reading** — 1 survey. We can show the level today, not a direction.
- **Not on file yet** — no data here. This reef is waiting for a survey.

### Card 1 — Coral cover  *(builds the label)*

- **What it is:** the share of the seabed covered by living hard coral. This only comes from divers and scientists counting it in the water. No satellite can see it.
- **Here:** {coralCoverPercent}% living coral{, was coralCoverBefore% in beforeYear}.
- **Confidence:** {Measured trend | Before and after | Single reading | Not on file yet}.
- **Source:** {survey program, e.g. AIMS Long Term Monitoring, GCRMN, MERMAID, Reef Check}.

### Card 2 — Fish life  *(builds the label)*

- **What it is:** how much fish life the reef holds, measured as fish weight per hectare on a standard swim. We compare it against what a reef like this could hold if it were barely fished. Fish life responds fast to fishing and protection, which is why it is our clearest sign that protection is working.
- **Here:** {biomassKgHa} kg per hectare, about {standingPercent}% of what this reef could hold.
- **Confidence:** {Measured trend | Before and after | Single reading | Not on file yet}.
- **Source:** Reef Life Survey, a global network of trained volunteer and scientist divers.

### Card 3 — Heat  *(a pressure, gates the label)*

- **What it is:** how much heat stress the water has built up, from satellite. What matters is heat piling up over weeks, not one warm day. When enough builds up, coral bleaches, and the label can move to Declining.
- **Here:** {heatLabel, e.g. Around usual | Warmer than usual | Bleaching likely}. {sstAnomaly}°C above the usual for the season.
- **Confidence:** live satellite reading, refreshed regularly.
- **Source:** NOAA Coral Reef Watch.

### Card 4 — Fishing  *(a pressure, gates the label)*

- **What it is:** how much fishing pressure the reef is under. We use two reads together. One is satellite tracking of larger fishing boats. The other is a global model of fishing pressure that also covers small local boats the satellites miss. Where a reef is protected and the water is quiet, that is a sign the protection is holding.
- **Here:** {protectionLabel, e.g. Fishing banned | Patrolled | Limited | Open}. Boat traffic {quiet | moderate | busy}{, busy despite protection}.
- **Confidence:** live satellite reading for boats; a fixed pressure level from the model.
- **Source:** Global Fishing Watch, and reef gravity from Andrello and Cinner.

---

## How the label is decided

We turn the two reef signals into a level from 1 to 5 each, then take the lower one.

- **Improving** — strong reef signals, no active heat alert, fishing low or the reef fully protected, and nothing slipping.
- **Stable** — still rewarding to dive, but below its natural baseline, or slipping under heat or fishing.
- **Declining** — heavy recent loss, an active bleaching alert, or a clear measured fall. Diving here documents what remains.
- **Not surveyed** — no coral survey and no heat reading on file. We do not guess a state from missing data. A single logged dive can change that.

---

## The science we build on

For scientists who want to check our reasoning, here is the published work behind each step.

- **The overall shape** follows the Mesoamerican Reef Health Index from the Healthy Reefs Initiative, which builds one reef score from several reef signals, fish life among them.
- **Fish life against a natural baseline** follows MacNeil and colleagues, 2015, on unfished reef fish biomass and how long depleted reefs take to recover, and Edgar and colleagues, 2014, showing that well enforced fully protected reserves hold far more fish and shark life than fished coasts.
- **Fishing pressure** follows Cinner and colleagues, 2016 and 2018, and Andrello and colleagues, 2022, on reef gravity, and Paolo and colleagues, 2024, showing that satellite vessel tracking misses most smaller boats.
- **Heat stress** follows the NOAA Coral Reef Watch method for degree heating weeks and bleaching alerts.

---

## What we know is imperfect

We would rather show you the limits than hide them.

- Satellites cannot see living coral. Coral cover only comes from people counting it underwater, so many reefs have thin coverage.
- Satellite boat tracking misses most small local fishing boats, so a quiet chart does not always mean a quiet reef.
- Some readings come from the nearest surveyed reef, not the exact dive site.
- Two surveys are a before and after, never a trend.
- Species logged is shown for context only. It reflects how often a reef is dived, not how healthy it is, so it never touches the label.
- A protected reef can still read Declining. Protection is not shelter from heat.

---

## Help us get it right

Are you a marine scientist, a reef monitor, or a local operator who knows this reef? Tell us where this reading is wrong, or send us data that would fill a gap. We read every note.

**hello@scubaseason.fun**
