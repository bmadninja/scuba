# I Am Not a Developer. I Used AI Agents to Build, Staff, and Run an Entire Ocean Conservation Platform. Alone.

*By Josie Leung, founder of ScubaSeason*

---

I have been diving for 20+ years and the thing that frustrated me every single time I tried to plan a trip was that there was no live data anywhere. Forum threads from 2019. TripAdvisor reviews that told me the dive shop was friendly. Nothing about whether the reef was still alive. Nothing about whether there was any realistic chance of seeing the species I was hoping to encounter. So I would fly 14 hours, drop into the water, and find out.

I am not a developer. I have never written production code.

I have run a team before. My previous startup had 13 people across marketing, business development, software engineering, backend, and infrastructure. We sold services, handled real money, and operated in an environment where security and quality were genuinely non-negotiable. I know what it feels like to have a proper team, to do code reviews with senior engineers looking over each other's shoulders, to have a BD person whose whole job is managing partner relationships.

ScubaSeason is deliberately different. It is a public good, not a commercial product. And building it alone with AI has forced me to think carefully about where I actually need human verification and where I can trust the agents to do the work.

I built a reef health atlas anyway, and I want to tell you exactly how, because I think most people are dramatically underestimating what is now possible for a single person with no technical background.

---

## What I built

ScubaSeason pulls from 63 data sources (NOAA thermal stress feeds, Global Fishing Watch fishing pressure data, IUCN species status, iNaturalist sightings, coral cover surveys) and classifies every dive site with one of 3 labels I designed: Thriving, Under Pressure, or Witnessing Change.

114 locations. 356 dive sites. 258 tracked species. A species sighting probability layer that updates live as observations come in, so you can see the realistic chance of encountering specific marine life at each site before you book. For sites labelled Witnessing Change, a trajectory that shows where coral cover is going based on the rate of decline, so divers can understand what is actually at risk and when.

I shared it with a friend and she was genuinely surprised to find out that Komodo and Raja Ampat, both in Indonesia, are Thriving. She said it made her want to delay her original trip and prioritize those instead. That is the whole point, really. The data existed. It just was not in a form anyone could use.

There is no team. There are agents. And they are still running.

---

## How I replaced every role

Here is the honest version of what building this actually looked like.

### The research phase (the part no one talks about)

Before I wrote a single line of code I needed to understand the market, the users, the competitors, and which data sources were actually worth integrating. Normally this is months of work for a research team.

I ran a BMAD domain research session (a structured agentic workflow that goes wide across sources, synthesizes findings, and gives you a decision ready output). It audited 5 competitors: PADI, Diveboard, Scuba Earth, Deepblu, ScubaEarth. It confirmed the core pain point: every existing directory is static. It validated complaints online. It identified the 3 user segments worth building for and which features they actually cared about.

That took a day, not a quarter.

### PRD, user stories, UX specs

I used BMAD agents to write the PRD, break it into epics and user stories, and produce UX specifications for every major flow. I reviewed them, gave feedback, they revised. The output was specific enough that the engineering agents could implement directly from them without me translating anything.

I have run this cycle 4 times as the product evolved. Each time it takes hours, not weeks.

### Coding

Claude Code handled the full frontend: Next.js, TypeScript, Tailwind. Route architecture, components, data pipelines, bug fixes. I would describe what I wanted, review what came back, flag what was wrong, and iterate.

The parts I found genuinely surprising: it could hold the full context of the codebase across sessions, it caught its own mistakes before I spotted them, and it consistently pushed back when I asked for something that would create problems downstream. It behaved like a senior engineer who happened to be very patient.

### Data sourcing and ingestion

This is the part I am most proud of, because it required the most judgment and I genuinely could not have done it without agents.

I needed to figure out which of the hundreds of ocean monitoring organizations had data worth integrating, which had accessible APIs, which required account setup and approval, and which were dead ends. An agent ran that research, ranked the sources by data quality and access complexity, and produced a prioritized list with contact emails and API documentation links.

Then agents set up the ingestion pipelines: iNaturalist, GFW, IUCN, NOAA. Scripts that run on a schedule, normalize the data, and update the site automatically.

### QA and testing

Test cases generated from the user stories. TypeScript type checking. End to end testing. When something broke (and things broke), I described the bug and the agent diagnosed it, proposed a fix, and implemented it. I learned more about debugging from watching that process than I had in years of using software professionally.

### Operations setup (the stuff nobody thinks about)

Starting a company is genuinely operations heavy, and none of it is glamorous. Setting up a transactional email provider. Configuring an affiliate program. Getting API access approved with data providers, going through their forms, waiting for keys, wiring the credentials in. I used a combination of Claude Code and OpenClaw (my local agent harness) to set most of this up. I would describe what needed to happen, the agent would research the options, recommend one, walk me through the setup, and in some cases complete it directly.

It is the kind of work that eats days when you do it manually. I barely noticed it.

### Design

Claude handles design work and layout. I would describe what I wanted visually, it would produce the component, I would react to it, and we would iterate. Every page on ScubaSeason was designed this way. I have a strong point of view on what looks good and I know immediately when something is wrong, but I could not have built any of it myself.

### What still runs today

Shipping the site was the beginning of the ongoing part. 11 GitHub Actions workflows run on schedule every day: NOAA reef health data refreshes daily, Global Fishing Watch fishing pressure updates weekly, iNaturalist and GBIF sightings refresh weekly, IUCN species status updates monthly, new dive sites are discovered and enriched daily, and data gaps get filled automatically, with a daily Telegram report landing in my phone telling me what ran, what succeeded, and what needs attention.

I also learned something the hard way on the cost side: I initially had everything running on the most capable models and burned through credits fast, so I audited each workflow and moved the high volume repetitive tasks (site discovery, data enrichment, gap filling) to lighter models. The discover sites workflow now costs about 2 to 3 cents per site. That calibration is not obvious when you start, but it matters.

Beyond the data layer, a product operator runs 5 times every weekday, rotating through strategy review, user research synthesis, prioritization, execution, and reflection, keeping a running decision journal and flagging when something I shipped does not match the positioning I agreed to. A GTM operator runs Monday, Wednesday, Friday, sequencing outreach, drafting emails, and tracking which threads have gone stale. Every morning a Telegram message synthesizes what they all decided overnight, tells me what needs my attention, and waits for my approval before anything goes out.

I am the only human in the loop.

---

## The stack, specifically

- **Claude Code** (Anthropic): coding, debugging, code review, architecture decisions
- **BMAD framework**: structured agentic workflows for research, PRD, UX specs, story generation
- **Scheduled cloud agents**: product operator, GTM operator, morning standup
- **OpenClaw / squish**: my local agent harness, sends the daily Telegram
- **Vercel**: deployment
- **Next.js + TypeScript + Tailwind**: frontend

I did not evaluate 20 tools and pick the best ones. I started with Claude Code because it was the most capable thing I could get my hands on and I never had a reason to switch.

---

## On trusting AI to do the work

I want to be honest about this because I think a lot of people gloss over it.

When I ask an agent to review code, it is not the same as a senior engineer at my previous company sitting across from a junior engineer and catching things from experience and instinct. I know that. I am not pretending otherwise.

What I do instead is the same thing I did at my previous company: bring in external reviewers for the things that matter most. At a commercial startup you get auditors to read the code before a release. Here, as I bring on conservation organization partners, having domain experts review whether the reef health classifications make scientific sense is part of how I plan to validate the data layer. Same principle, different context.

For everything else, the honest answer is that I have calibrated my trust based on the stakes. GitHub Actions running a data refresh and failing visibly is a recoverable problem. A security vulnerability in a commercial product handling payments is not. ScubaSeason is a free public tool. That changes the risk profile and it changes how much trust I extend.

I am not saying this approach works for everything. I am saying it works for this, and I think being clear about where you are trusting AI and where you are not is more useful than pretending you have solved the verification problem.

## What I would tell someone starting now

The biggest shift for me was treating agents as staff, not as autocomplete.

When I wrote a vague prompt I got a vague result. When I wrote a clear brief (here is the role, here is what you know, here is what good looks like, here is what you must not do) I got something I could actually ship.

The second thing: the ongoing operations piece is where the real leverage is. Most "I built this with AI" stories end at launch. The interesting part is that the agents are still working. The data is still refreshing. GTM is still going out. I am not maintaining any of it manually.

One person can now run what used to require a company. I do not think most people have fully absorbed what that means yet.

---

ScubaSeason is live and free at scubaseason.fun. If you dive, or you know someone who does, I would love your feedback. And if you are building something similar, I am genuinely happy to share more about the setup: hello@scubaseason.fun.

---

*Josie Leung is the founder of ScubaSeason (scubaseason.fun), a nonprofit reef health atlas. She has been diving for 20+ years and had no technical background when she started this.*
