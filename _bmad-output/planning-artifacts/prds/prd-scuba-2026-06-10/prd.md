---
title: AI Trip Planner Assistant
status: draft
created: 2026-06-10
updated: 2026-06-10
---

# PRD: AI Trip Planner Assistant
*Working title — confirm.*

## 0. Document Purpose

This PRD is for the scubaseason.fun team (Josie as PM/owner) and the downstream UX, architecture, and engineering workflows that will build the feature. It defines a grounded conversational assistant that helps a visitor go from "I want to dive somewhere" to "I know where, when, and where to book" without scubaseason.fun building a booking engine. Vocabulary is anchored in §3 Glossary; features are grouped in §4 with globally numbered FRs nested under them; assumptions are tagged inline as `[ASSUMPTION]` and indexed in §9. The site already carries the data this assistant stands on (356 dive sites, 113 locations, seasonality, species, reef health, operator and lodging links with price signals) — this PRD treats that data layer as a given and specifies the assistant on top of it. It does not redefine the data model.

## 1. Vision

scubaseason.fun knows things no general AI knows: which reefs are still thriving, when the mantas show up, what condition a reef is in right now, and which operators actually run a site. Today a visitor has to navigate pages to assemble that into a trip. The AI Trip Planner Assistant turns that navigation into a conversation. A diver asks "where in the Caribbean is good and affordable in February" and gets an answer grounded in the site's own data, with the reasoning shown and a direct path to book through the operators and lodging the site already links.

The assistant leads with the site's unfair advantage — proprietary reef and season data — and supplements with the language model's general travel knowledge (rough flight logistics, "you would fly into X") clearly labeled as general guidance, never presented as live or authoritative. It is honest by design: when it does not have something (live fares, exact trip totals), it says so and points the diver to where they can find out, rather than inventing a number. For a nonprofit whose entire brand is data credibility, that honesty is the feature, not a limitation.

Critically, the assistant is a funnel, not a service. It does not take payments, hold bookings, or operate trips. It carries the diver right up to the affiliate handoff — the existing operator and lodging links — and lets them book there. This gives scubaseason.fun the full "discover to book" journey feel without the cost or liability of building real booking infrastructure.

## 2. Target User

### 2.1 Jobs To Be Done

- **Functional:** "Help me decide where and when to dive based on what I want to see, my budget level, and the season — without reading ten pages."
- **Functional:** "Tell me roughly how I would get there and what it costs, so I can judge feasibility before I commit."
- **Emotional:** "Reassure me this reef is worth visiting and in good enough shape that the trip is worth it."
- **Emotional:** "I want to trust the answer — I do not want to be sold to or misled."
- **Social:** "Help me plan a trip I can confidently propose to my dive buddy or partner."
- **Contextual:** "I am browsing on my phone in spare moments, not sitting down to research for an hour."

### 2.2 Non-Users (v1)

- **Operators and dive shops** — this is a consumer trip-planning aid, not a B2B listing or lead-management tool.
- **Divers seeking live, bookable inventory and real-time prices** — the assistant funnels to affiliate partners for that; it is not a booking or fare engine.
- **Researchers / data consumers** — the assistant answers trip questions, not bulk data or methodology queries (the existing data pages and methodology notes serve that need).

### 2.3 Key User Journeys

- **UJ-1. Marcus wants the cheapest good Caribbean diving and is honest about his budget.**
  - **Persona + context:** Marcus, late 20s, open-water certified, two weeks of vacation and a tight budget. Wants warm-water reef diving but cost is the deciding factor.
  - **Entry state:** Unauthenticated, lands on the homepage on his laptop, sees the chat affordance, opens it.
  - **Path:** Types "where in the Caribbean is cheapest to dive?" → assistant compares locations using real price signals (lodging price tiers, operator price ranges) and replies with two or three picks that *lean budget*, each with a one-line why and the best months → Marcus asks "what about February specifically?" → assistant cross-references seasonality and conditions and narrows it.
  - **Climax:** Marcus gets a ranked, reasoned shortlist ("Bonaire and Cozumel both lean budget and February is solid for both") with the reef-condition note and a clear "I do not track live fares, but here is where to book" handoff.
  - **Resolution:** Marcus clicks through to a Bonaire operator affiliate link to check real prices. He leaves with a destination decision made.
  - **Edge case:** he asks "what is the exact total for a week?" — the assistant states it gives relative affordability, not dollar totals yet, and points to the location page and operator links for real numbers.

- **UJ-2. Lena is timing a bucket-list animal encounter.**
  - **Persona + context:** Lena, advanced diver, flexible dates, wants to see mantas and does not care about cost. The *when* matters more than the *where*.
  - **Entry state:** On a location page on her phone, opens the assistant from the floating affordance.
  - **Path:** "When and where can I dive with manta rays?" → assistant draws on encounter/species seasonality data and returns the strongest regions with their best months and a confidence note → Lena asks "is the reef there in good shape?" → assistant surfaces the reef-condition classification and the plain-English diving outlook.
  - **Climax:** Lena gets a season-accurate, condition-aware recommendation she trusts because it cites the site's data.
  - **Resolution:** She taps through to the encounter page and operator link to plan dates.

- **UJ-3. Priya checks feasibility before she pitches the trip.**
  - **Persona + context:** Priya, planning a couples trip from the US East Coast, needs a gut-check on logistics before she raises it with her partner.
  - **Entry state:** Mid-conversation, has already settled on a destination with the assistant.
  - **Path:** "How would we get there from the East Coast?" → assistant gives general routing guidance ("you would typically fly into the nearest hub, then a transfer or short connection"), clearly labeled as general guidance, using the site's "getting there" notes where present and model knowledge otherwise → Priya asks about price → assistant gives the relative cost level and is explicit it does not have live fares.
  - **Climax:** Priya has enough to judge "this is doable" without being misled by a fake price.
  - **Resolution:** She bookmarks the location page and shares it with her partner.

## 3. Glossary

- **Assistant** — the AI Trip Planner Assistant: the conversational feature defined by this PRD. One per site, surfaced as a floating widget.
- **Reef Data** — scubaseason.fun's own structured dataset: dive sites, locations, seasonality (best months, conditions by month), species, reef-health and reef-condition records, operators, and lodging. The authoritative grounding source.
- **Reef Condition Classification** — the site's three-state framing of reef health: Thriving, Under pressure, Witnessing change. Surfaced by the Assistant when relevant to a destination.
- **Grounding** — restricting the Assistant's factual claims to Reef Data retrieved for the query (a retrieval-augmented step), so reef/season/species/operator facts come from the dataset, not model memory.
- **General Travel Guidance** — non-grounded supplementary answers (flight routing, rough logistics) drawn from the language model's training knowledge, always labeled as general and never presented as live or site-verified.
- **Price Tier** — a relative affordability signal derived from existing data: lodging `priceLevel` (1 budget to 4 luxury) and operator `priceRangeUSD`. The Assistant uses Price Tiers to answer affordability questions in v1.
- **Trip Cost Estimate** — the site's designed-but-unpopulated dollar-level cost record (flights per hub, per-night lodging, dive-day cost, fees). A future grounding source; not available in v1.
- **Affiliate Handoff** — the moment the Assistant directs a diver to an existing operator or lodging affiliate link to book. The Assistant's terminal action; it never processes a booking itself.
- **Free LLM Tier** — a no-credit-card language-model API tier (e.g. Google Gemini free tier or Groq) used to power the Assistant without incurring billing.
- **Honesty Gap Response** — the Assistant's required behavior when asked for something it cannot ground (live fares, exact totals, data it lacks): state the limit plainly and redirect, never fabricate.

## 4. Features

### 4.1 Grounded Reef-Data Conversation

**Description:** The core capability. A visitor asks a natural-language trip question and the Assistant answers using Reef Data retrieved for that query — where to dive, when, what they will see, and what condition the reef is in. The Assistant performs a Grounding step (retrieve relevant sites/locations/seasonality/species/reef-health records) before answering, and its reef/season/species claims come only from that retrieved data. Where a claim maps to a specific location, site, or encounter, the Assistant links to that page so the diver can verify and go deeper. Realizes UJ-1, UJ-2, UJ-3.

**Functional Requirements:**

#### FR-1: Natural-language reef-data query

A visitor can ask the Assistant a free-text question about where, when, and what to dive and receive an answer grounded in Reef Data. Realizes UJ-1, UJ-2.

**Consequences (testable):**
- Reef, season, species, and operator facts in the answer trace to retrieved Reef Data records, not model memory. [ASSUMPTION: a retrieval step over the existing JSON datasets is the grounding mechanism; exact retrieval design is for architecture.]
- A query naming a destination plus a month returns recommendations consistent with that location's `bestMonths` and `conditionsByMonth`.
- When the answer references a specific location, site, or encounter, it includes a link to that page.

#### FR-2: Season-aware recommendation

A visitor can ask "when" or "what is good in [month]" and the Assistant ranks or filters destinations by seasonality. Realizes UJ-2.

**Consequences (testable):**
- A month-specific query excludes or down-ranks destinations whose `bestMonths` exclude that month.
- Species or encounter questions return best-months and a confidence note where the data carries one.

#### FR-3: Reef-condition awareness

A visitor can ask about reef health or quality for a destination and the Assistant surfaces the Reef Condition Classification and the plain-English diving outlook. Realizes UJ-2.

**Consequences (testable):**
- Where a reef-health record exists for the destination, the answer reflects its classification and `divingOutlook`; it never invents a condition for a destination lacking a record (Honesty Gap Response applies).

### 4.2 Affordability via Price Tiers (dollars later)

**Description:** The Assistant answers "where is cheapest / most affordable" using the relative price signals the site already has — lodging `priceLevel` and operator `priceRangeUSD` — and frames answers as *leans budget / mid / upscale*, never as dollar totals. The feature is designed so that when Trip Cost Estimate data is populated later, the Assistant upgrades to dollar ballparks without a redesign. Realizes UJ-1, UJ-3.

**Functional Requirements:**

#### FR-4: Relative affordability comparison

A visitor can ask which destinations are cheaper and the Assistant compares them by Price Tier. Realizes UJ-1.

**Consequences (testable):**
- The Assistant ranks destinations using lodging `priceLevel` and/or operator `priceRangeUSD` and states the basis in plain language (e.g. "leans budget on lodging and dive operators").
- The Assistant does not state a dollar trip total in v1; a request for one triggers an Honesty Gap Response pointing to the location and operator pages.

#### FR-5: Dollar-ballpark upgrade path

The system is structured so that populated Trip Cost Estimate data, when available, lets the Assistant give dollar ranges without changing the conversational contract. Realizes UJ-1.

**Consequences (testable):**
- The affordability logic reads from a single source that can be swapped/extended from Price Tier to Trip Cost Estimate without changing FR-4's user-facing behavior. [ASSUMPTION: implemented as a capability flag/data check, not a separate feature.]

**Notes:** `[NOTE FOR PM]` Populating Trip Cost Estimate is a separate data-curation effort, tracked as a non-goal for this MVP (see §5) but the load-bearing follow-on that unlocks the full "cheapest" promise.

### 4.3 General Travel Guidance (labeled supplement)

**Description:** For questions outside Reef Data — chiefly "how do I get there" and rough logistics — the Assistant supplements with the language model's general knowledge, always clearly labeled as general guidance and never as live or site-verified. It prefers the site's existing "getting there" notes where present and falls back to model knowledge otherwise. It does no live web lookups. Realizes UJ-3.

**Functional Requirements:**

#### FR-6: Labeled travel-logistics guidance

A visitor can ask how to reach a destination and receive general routing guidance, visibly distinguished from grounded Reef Data answers. Realizes UJ-3.

**Consequences (testable):**
- Logistics answers carry a visible "general guidance" label or framing.
- Where a site `getThere` / `getThereStructured` note exists, the answer uses it; otherwise it uses model knowledge and still labels it general.
- The Assistant performs no live web request to answer (see FR-11).

**Out of Scope:**
- Live flight schedules, real fares, visa/entry-requirement guarantees.

### 4.4 Affiliate Booking Handoff

**Description:** The Assistant's terminal action is to point the diver to the existing operator and lodging affiliate links for the chosen destination so they can book there. The Assistant never collects payment, holds a reservation, or operates a trip. Affiliate links use the site's existing affiliate tagging. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-7: Operator and lodging handoff

When a visitor has converged on a destination, the Assistant surfaces the relevant operator and/or lodging affiliate links. Realizes UJ-1.

**Consequences (testable):**
- Handoff links are the site's existing affiliate-tagged operator/lodging URLs for that destination; the Assistant introduces no new booking surface.
- The Assistant never asks for payment details, dates-to-reserve, or personal booking info.
- Affiliate framing complies with the site's affiliate-disclosure approach. [ASSUMPTION: existing disclosure component/policy applies to assistant-surfaced links.]

### 4.5 Honesty and Anti-Hallucination Guardrails

**Description:** Because data credibility is the brand, the Assistant must fail honestly. When it lacks grounded data for a factual claim (live fares, exact totals, an undocumented destination, anything outside Reef Data and reasonable general guidance), it gives an Honesty Gap Response: states the limit plainly and redirects. It does not fabricate prices, sightings, conditions, or operators.

**Functional Requirements:**

#### FR-8: Honesty Gap Response

When a query asks for information the Assistant cannot ground, it states it does not have that information and redirects to where the diver can find it. Realizes UJ-1, UJ-3.

**Consequences (testable):**
- Asked for a live fare or exact trip total, the Assistant declines to invent one and points to operator/location pages.
- Asked about a destination with no Reef Data record, the Assistant says it does not cover that location rather than generating reef facts for it.

#### FR-9: No fabricated entities

The Assistant must not invent operators, dive sites, species presence, prices, or reef conditions not present in Reef Data.

**Consequences (testable):**
- Operator and site names in answers exist in Reef Data; a spot-check set of adversarial prompts ("name a cheap operator in [obscure place]") yields an Honesty Gap Response, not a fabricated operator.

**Feature-specific NFRs:**
- A documented prompt/grounding contract constrains the model to retrieved data for factual claims; this contract is testable against a fixed adversarial prompt suite before launch.

### 4.6 Chat Widget Surface

**Description:** The Assistant is surfaced as a floating affordance available across the site (leaning bottom-right), openable into a chat panel, dismissible, and mobile-friendly. Copy follows the site voice and the no-hyphen rule; contact CTAs use hello@scubaseason.fun.

**Functional Requirements:**

#### FR-10: Floating chat widget

A visitor can open, converse with, and dismiss the Assistant from a persistent floating affordance on any page. Realizes UJ-1, UJ-2, UJ-3.

**Consequences (testable):**
- The affordance appears on all primary pages and does not obscure key content or CTAs on mobile.
- The panel supports a multi-turn conversation within a session.
- All Assistant-authored copy obeys the no-hyphen rule for user-facing text.

**Notes:** `[NOTE FOR PM]` Exact placement (bottom-right vs other), open/closed default, and whether it persists conversation across pages are UX decisions — flagged for the UX workflow.

### 4.7 Free-Tier Model Integration

**Description:** The Assistant runs on a Free LLM Tier with no credit card. Requests route through a server-side proxy so the API key is never exposed client-side, and so the grounding/retrieval step runs server-side. The integration explicitly avoids live web-search grounding (the billable part); grounding is over Reef Data only.

**Functional Requirements:**

#### FR-11: Server-proxied free-tier model calls

The Assistant calls the Free LLM Tier through a server-side endpoint that performs grounding and never exposes credentials to the client. Realizes all UJs.

**Consequences (testable):**
- No model API key is present in client-delivered code.
- The model integration uses model knowledge plus Reef Data retrieval only; it issues no live web-search/grounding calls.
- The provider is swappable (Gemini or Groq) behind the endpoint. [ASSUMPTION: a thin provider abstraction; exact provider chosen in architecture.]

**Feature-specific NFRs:**
- Graceful degradation: if the free-tier quota is exhausted or the provider errors, the Assistant shows a friendly fallback (e.g. "the assistant is resting, try the search and location pages") rather than a broken state.

## 5. Non-Goals (Explicit)

- **We are not building a booking engine.** No payments, no reservations, no inventory, no cart. The Assistant funnels to existing affiliate links and stops there.
- **We are not providing live prices or fares.** No real-time fare lookups, no dollar trip totals in v1.
- **We are not becoming a general travel chatbot.** The Assistant's reason to exist is Reef Data; general travel guidance is a labeled supplement, not the product.
- **We are not doing live web-search grounding.** That is the billable path and is explicitly excluded to stay on the Free LLM Tier.
- **We are not populating Trip Cost Estimate data as part of this build.** Dollar-level affordability is a follow-on data effort (see §6.2).
- **We are not building accounts, history, or personalization.** v1 is anonymous, single-session.

## 6. MVP Scope

### 6.1 In Scope

- Grounded reef-data conversation (FR-1, FR-2, FR-3).
- Relative affordability via Price Tiers, structured for a later dollar upgrade (FR-4, FR-5).
- Labeled general travel guidance, no live web (FR-6).
- Affiliate operator/lodging handoff (FR-7).
- Honesty and anti-hallucination guardrails with an adversarial test pass (FR-8, FR-9).
- Floating chat widget across the site (FR-10).
- Server-proxied free-tier model integration with graceful degradation (FR-11).

### 6.2 Out of Scope for MVP

- Dollar-level trip cost answers — blocked on populating Trip Cost Estimate data. `[NOTE FOR PM]` This is the emotionally load-bearing deferral: Josie's original "where is cheapest" question is only *fully* answered once this lands. Revisit immediately after MVP proves the assistant is used.
- Live fares, flight schedules, real-time availability — deferred indefinitely; belongs to affiliate partners.
- Accounts, saved trips, cross-session memory, personalization — v2 candidates.
- Multi-language support — follows site direction.
- Voice input / output.

## 7. Success Metrics

**Primary**
- **SM-1**: Assistant engagement rate — share of sessions that open the Assistant and send at least one message. Target: a meaningful baseline established in first month, then growth. Validates FR-1, FR-10.
- **SM-2**: Affiliate handoff rate — share of Assistant conversations that result in a click to an operator/lodging affiliate link. Validates FR-7.

**Secondary**
- **SM-3**: Grounded-answer rate — share of factual Assistant answers traceable to Reef Data in a sampled audit. Target: high (this is the credibility metric). Validates FR-1, FR-8, FR-9.
- **SM-4**: Honesty Gap Response correctness — on an adversarial prompt suite, share where the Assistant correctly declines/redirects instead of fabricating. Target: very high before launch. Validates FR-8, FR-9.

**Counter-metrics (do not optimize)**
- **SM-C1**: Handoff rate at the expense of honesty — do not increase SM-2 by pushing affiliate links when the diver has not converged or by overstating destinations. Counterbalances SM-2. A rise in SM-2 paired with a fall in SM-3/SM-4 is a regression, not a win.
- **SM-C2**: Engagement via gimmick — do not inflate SM-1 with intrusive popups or dark patterns that hurt trust. Counterbalances SM-1.

## 8. Open Questions

1. Which Free LLM Tier provider to standardize on first — Gemini free tier vs Groq — given quota limits against expected traffic? (architecture)
2. What is the grounding/retrieval design over the existing JSON data — in-memory retrieval, embeddings, or a structured query layer? (architecture)
3. How is per-session rate limiting / abuse protection handled on a free tier with a shared key? (architecture, cost guardrail)
4. Does the existing affiliate-disclosure policy fully cover assistant-surfaced links, or is new disclosure copy needed? (legal/brand)
5. Widget placement, default state, and cross-page conversation persistence. (UX)
6. What is the trigger and rough sizing for the Trip Cost Estimate population effort that unlocks FR-5? (PM follow-on)

## 9. Assumptions Index

- §4.1 FR-1 — Grounding is implemented as a retrieval step over the existing JSON datasets; exact design deferred to architecture.
- §4.2 FR-5 — The dollar-ballpark upgrade is a capability flag/data check over a single affordability source, not a separate feature.
- §4.4 FR-7 — The existing affiliate-disclosure component/policy applies to assistant-surfaced links.
- §4.7 FR-11 — A thin provider abstraction makes Gemini/Groq swappable; provider chosen in architecture.

---

## Cross-Cutting NFRs

- **Latency:** Assistant first-token / first-response should feel conversational; a perceptible "thinking" state is acceptable but multi-second dead air is not. (target set in architecture against the chosen provider)
- **Reliability / degradation:** quota exhaustion or provider error degrades gracefully to a friendly fallback that routes to search and location pages (see FR-11 NFR).
- **Accessibility:** the widget meets the site's accessibility bar — keyboard operable, screen-reader labeled, dismissible, not a focus trap.
- **Mobile:** fully usable on mobile; does not obscure primary content or CTAs.
- **Observability:** log enough to measure SM-1 through SM-4 (engagement, handoff, grounded-answer audit sampling) without storing PII.

## Constraints and Guardrails

### Safety / Credibility
- Anti-hallucination is a launch gate, not a nice-to-have: FR-8 and FR-9 must pass a fixed adversarial prompt suite (SM-4) before the widget goes live. The brand cannot afford a confidently wrong reef or price claim.
- General Travel Guidance must always be visibly labeled so a diver never mistakes model knowledge for site-verified data.

### Privacy
- v1 is anonymous and single-session: no accounts, no stored conversation tied to identity. Conversations may be logged in aggregate/anonymized form for quality and metric purposes only; no PII collection.
- Inputs are sent to a third-party model provider — disclose this appropriately and avoid soliciting personal data in-chat.

### Cost
- The defining constraint: stay on the Free LLM Tier, no credit card. No live web-search grounding (the billable feature). Rate limiting / abuse protection (Open Question 3) protects the shared free quota. If usage ever exceeds free limits, the decision to add paid capacity is an explicit, separate call — not an automatic overflow into billing.

## Aesthetic and Tone

- **Voice:** a knowledgeable, honest dive-shop friend — warm, plain-spoken, never salesy. It volunteers what it does not know.
- **Anti-references:** a pushy upsell bot; a generic corporate chatbot; an over-eager assistant that pretends to know fares or invents operators.
- **Copy rules:** no hyphens in user-facing copy (reword compounds; em dashes are fine); contact CTAs use hello@scubaseason.fun; consistent with the site's dark "ocean abyss + aqua" theme and existing typography.

## Information Architecture

- **Surface:** a single floating affordance available site-wide, leaning bottom-right, opening into a dismissible chat panel. It is an overlay on existing pages, not a new route or page.
- **Entry points:** primarily the floating affordance; optionally contextual prompts on high-intent pages (homepage, location pages) deferred as a UX decision.
- **Exit point:** the Affiliate Handoff — links out to existing operator/lodging pages and affiliate URLs; the Assistant does not create new destination pages.
