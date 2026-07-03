# I Am Not a Developer. AI Agents Run My Entire Ocean Data Platform.

*By Josie Leung, founder of ScubaSeason*

---

I have been diving for 20+ years, and 3 things kept frustrating me every time I tried to plan a trip.

I kept hearing that climate change was affecting reefs, and I wanted to actually prioritize where I traveled based on that, not guess.

The data that did exist told me a species had been recorded at a site once, but species are not static, they move, so a single record is not the same as a real chance of seeing them. I have shown up at a site expecting to see a hammerhead shark and been told the last one seen there was 30 years ago.

And there was no easy way to contribute back. Every diver takes photos, everyone posts them on social media, and none of it gets aggregated into anything useful.

So I would fly 14 hours, drop into the water, and find out.

I am not a developer. I have never written production code.

I have run a team before. My previous startup was an open source software company with 13 people, including 6 developers, across marketing, business development, and engineering. I was not the technical cofounder, but I worked alongside that team for a few years and know what it feels like to have a proper team, to do code reviews with senior engineers looking over each other's shoulders, to have a BD person whose whole job is managing partner relationships.

That company, unfortunately, did not work out. While I was thinking about what to do next, with the rise of AI, I decided to try building something completely solo, and here is how I did it.

ScubaSeason is deliberately different. It is a public good, not a commercial product.

---

## What I built

ScubaSeason pulls from 63 live data sources (NOAA thermal stress feeds, Global Fishing Watch fishing pressure data, IUCN species status, iNaturalist sightings, coral cover surveys) and updates constantly instead of sitting still like every other dive directory out there. It covers 354 locations, 1,311 dive sites, and 1,244 tracked species so far.

The first piece is the reef state itself. Every site gets one of 3 labels I designed: Improving, Stable, or Declining, based on a formula that weighs live coral cover against a decade old baseline, the worst recorded bleaching alert level, and current fishing pressure. A site earns Improving when coral cover is holding at 40 percent or higher, heat stress has stayed mild, and fishing pressure is low. A site drops to Declining once coral cover falls below 25 percent or a serious bleaching alert has hit. Every label, not just Declining, comes with a trajectory showing where that reef's coral cover is heading, so divers get the same picture whether a reef is thriving or falling apart.

The second piece is the species sighting probability layer. A species being recorded at a site once does not mean you will see it, so this layer aggregates live sighting data into an actual probability by month for that specific site, updating as new observations come in.

The third piece is the upload. Divers can submit a photo and a dive log directly through ScubaSeason, and it gets routed automatically to iNaturalist, GBIF, and other research platforms. Every diver was already taking these photos and posting them somewhere. Now that gets aggregated into something useful instead of disappearing into a social feed.

None of this exists anywhere else in diving. Every other platform is a static directory. This one is live, and it saves divers the work of piecing this together themselves from a dozen different places.

I shared it with a friend and she was genuinely surprised to find out that Raja Ampat in Indonesia is labelled Improving. She had been planning a trip there, and decided to delay it and prioritize sites labelled Declining first instead, so she could see them before they change further. I am not saying every diver should make that choice, but it is exactly the kind of data point I built this for.

There is no team. There are agents. And they are still running.

---

## How I replaced every role

### The research phase (the part no one talks about)

I needed to understand the market, the existing players, where the real gaps were, and which data sources were actually worth integrating. Normally this is months of work for a research team.

I ran a BMAD domain research session (a structured agentic workflow that goes wide across sources, synthesizes findings, and gives you a decision ready output). It looked past PADI, Diveboard, Scuba Earth, Deepblu, and the other existing market players to find where the real opportunity was: every existing directory is static, and it checked whether a live version had been attempted before and why it had not worked. It validated complaints online, identified the 3 user segments worth building for and which features they actually cared about, then went source by source through the 63 data feeds I was considering to work out which were actually worth integrating.

### PRD, user stories, UX specs

I used BMAD agents to write the PRD, break it into epics and user stories, and produce UX specifications for every major flow. I reviewed it closely, gave feedback, and kept tweaking it before any building started, because this stage is so much cheaper to edit than the stage after it. That pushed me to be as specific as possible so nothing got lost in translation. When I worked with actual engineers before, they would ask questions the moment something was ambiguous. Agents do not do that the same way, they make a lot of assumptions instead, so if the brief is not clear, what comes back will not match what you actually wanted. I do a massive brainstorm with them at this stage for exactly that reason.

For any big feature, I still start back at the PRD instead of making quick modifications directly. Small tweaks do not need the full cycle, but anything that changes the product gets the same treatment from scratch, every time.

### Coding

Claude Code handled the full frontend: Next.js, TypeScript, Tailwind. Route architecture, components, data pipelines, bug fixes. I would describe what I wanted, review what came back, flag what was wrong, and iterate.

The parts I found genuinely surprising: it could hold the full context of the codebase across sessions, it caught its own mistakes before I spotted them, and it consistently pushed back when I asked for something that would create problems downstream. It behaved like a senior engineer who happened to be very patient.

### Data sourcing and ingestion

This part did a lot of the heavy lifting, because it required the most judgment and I genuinely could not have done it without agents.

I needed to figure out which of the hundreds of ocean monitoring organizations had data worth integrating, which had accessible APIs, which required account setup and approval, and which were dead ends. An agent ran that research, ranked the sources by data quality and access complexity, and produced a prioritized list with contact emails and API documentation links.

Then agents set up the ingestion pipelines: iNaturalist, GFW, IUCN, NOAA. Scripts that run on a schedule, normalize the data, and update the site automatically.

### QA and testing

Agents generated test cases from the user stories, ran TypeScript type checking, and ran end to end tests. When something broke, and things did break, I described the bug and the agent diagnosed it, proposed a fix, and implemented it.

Two habits made the biggest difference here. I opened as many parallel sessions as possible and kept committing and merging constantly, instead of running everything through one giant session. And whenever I noticed my own prompt was messy, I learned to tell the agent to rewrite it into a clean, specific brief first and confirm it with me before touching any code, orchestrating multiple sub agents in parallel for anything that could run independently.

### Operations setup (the stuff nobody thinks about)

Having worked as a cofounder and COO at my previous startup, I know operations is one of those very time consuming, not glamorous, but essential parts of running a company. Having Claude, and AI in general, made this dramatically easier. I used a combination of Claude Code and OpenClaw (my local agent harness), and between them AI did everything from setting up a transactional email provider to configuring multiple affiliate programs to getting API access approved with data providers, going through their forms, waiting for keys, and wiring the credentials in. I would describe what needed to happen, the agent would research the options, recommend one, walk me through the setup, and in some cases complete it directly.

It is the kind of work that eats days when you do it manually. The agents sped it up dramatically.

### Design

I originally used BMAD for design work, and then switched to Claude's own design tooling once that shipped, which is what I used from there on. I would describe what I wanted visually, it would produce the component, I would react to it, and we would iterate. Every page on ScubaSeason was designed this way.

I am not a designer myself. What I learned is that if you want something that does not look obviously AI produced, you cannot just describe a vibe. I would go through multiple sites looking for things I actually liked, then tell the agent exactly which sites and which elements were the inspiration, and have it design from that.

### Where the site is now

I shipped the MVP with everything described above already built and tested, and it has kept running and growing since. 11 GitHub Actions workflows run on schedule every day: NOAA reef health data refreshes daily, Global Fishing Watch fishing pressure updates weekly, iNaturalist and GBIF sightings refresh weekly, IUCN species status updates monthly, new dive sites are discovered and enriched daily, data gaps get filled automatically, and diver photo and dive log uploads get processed and routed out to iNaturalist and GBIF, with a daily Telegram report landing on my phone telling me what ran, what succeeded, and what needs attention.

I also learned something the hard way on the cost side: I initially had everything running on the most capable models and burned through credits fast, so I audited each workflow and moved the high volume repetitive tasks (site discovery, data enrichment, gap filling) to lighter models. The discover sites workflow now costs about 2 to 3 cents per site. That calibration is not obvious when you start, but it matters.

Beyond the data layer, a product operator runs 5 times every weekday, rotating through strategy review, user research synthesis, prioritization, execution, and reflection, keeping a running decision journal and flagging when something I shipped does not match the positioning I agreed to. A GTM operator runs Monday, Wednesday, Friday, sequencing outreach, drafting emails, and tracking which threads have gone stale. A grants operator looks for funding gaps and flags opportunities worth applying to. Every morning a Telegram message synthesizes what they all decided overnight, tells me what needs my attention, and waits for my approval before anything goes out.

---

## The stack, specifically

- **Claude Code** (Anthropic): coding, debugging, code review, architecture decisions
- **BMAD framework**: structured agentic workflows for research, PRD, UX specs, story generation
- **Scheduled cloud agents**: product operator, GTM operator, morning standup
- **OpenClaw / squish**: my local agent harness, sends the daily Telegram
- **Vercel**: deployment
- **Next.js + TypeScript + Tailwind**: frontend

I started with Claude Code because it was the most capable thing I could get my hands on and I never had a reason to switch.

---

## On trusting AI to do the work

I want to be honest about this because I think a lot of people gloss over it.

Right now, I am completely trusting AI to do the coding. There has been no code audit, not from me and not from anyone else.

That would not have worked at my previous company, because it was a fintech company and we handled real funds. But ScubaSeason is public code pulling from public science sources, and that changes what kind of verification actually matters here. Instead of bringing in a code auditor, I am currently reaching out to science and conservation organizations to collaborate on validating the platform, not just the code itself, but the formula behind the reef state labels and the species sighting probabilities too.

I am not saying this approach works for everything. I am saying it works for this, and I think being clear about where you are trusting AI and where you are not is more useful than pretending you have solved the verification problem.

## What I would tell someone starting now

The biggest shift for me was treating agents as staff, not as autocomplete.

When I wrote a vague prompt I got a vague result. When I wrote a clear brief (here is the role, here is what you know, here is what good looks like, here is what you must not do) I got something I could actually ship.

The second thing: the ongoing operations piece is where the real leverage is. The agents are still working. The data is still refreshing. GTM is still going out. I am not maintaining any of it manually.

One person can now run what used to require a company. I do not think most people have fully absorbed what that means yet.

---

ScubaSeason is live and free at [scubaseason.fun](https://scubaseason.fun), built entirely by AI. If you spot any bugs, I would love to hear about them. I cannot offer a bug bounty, but you will have my heartfelt gratitude. If you dive, or you know someone who does, I would really appreciate your feedback too. And if you are a science or conservation organization, or you are building something similar yourself, I am always happy to partner or share more about how I built this. Feel free to reach out: [josie@scubaseason.fun](mailto:josie@scubaseason.fun).

---

*Josie Leung is the founder of [ScubaSeason](https://scubaseason.fun), a nonprofit reef health atlas. She has been diving for 20+ years and had no technical background when she started this.*

---

**Tags:** Artificial Intelligence, Startup, Entrepreneurship, Automation, Data Science, Software Development, Productivity, Technology
