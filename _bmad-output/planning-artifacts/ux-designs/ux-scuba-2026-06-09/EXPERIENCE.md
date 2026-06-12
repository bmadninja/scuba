---
title: scubaSeason.fun — Experience (Reef Atlas Redesign)
status: final
created: 2026-06-09
updated: 2026-06-09
companion: DESIGN.md
inherits: ../ux-scuba-2026-06-03/EXPERIENCE.md
scope: >
  Information architecture, voice and tone, behavioral component patterns, state
  patterns, interaction primitives, accessibility floor, and key flows for the
  redesigned reef atlas: single-page homepage, slim location page, dive-site
  page, species list, and method page. This is an UPDATE — the inherited
  EXPERIENCE.md remains in force except where restated here. Visual specs live
  in this run's DESIGN.md.
---

# scubaSeason.fun — Experience (Reef Atlas Redesign)

## 1. Foundation

scubaSeason.fun is a **free, public reef atlas** — a research instrument a non scientist can read like a map. The redesign exists to fix one diagnosed problem (Josie's brief): *flows were off, pages like Florida Keys were jam-packed, and it was not clear for a user with zero science background.* The overload was duplication and density, not layout. So the work is dedupe, plain language, and one clear job per surface.

Five behavioral promises govern every surface:

1. **One clear job, one primary action per page.** Home finds a reef. Location leads to one trip. Dive site briefs the dive. Species lists what you'll see. Method explains. Never two competing actions.
2. **Aggressive dedupe — one fact, one home.** If a fact is in the hero pill, it is not also in a stat strip, a sidebar, and the body. The location page's stat strip was deleted because every cell duplicated something else.
3. **Plain language, no jargon.** Write for a person who has never read a coral survey. "Visibility," "Water temperature," "warmer than usual," "near its natural baseline," "Vulnerable" — never "vis," "DHW," "Watch," "VU," or "no data."
4. **Info popups, not page jumps.** Explanations happen in place, in a small popup. A link that *leaves* names where it goes ("…on the Method page →").
5. **Live data, no staleness theater.** No "updated X ago." One "● Live data" signal, then the data speaks. Species sightings are now made live via a new ingest, so "recently logged / last seen" copy is honest and stays.

---

## 2. Information architecture

### 2.1 Routes

```
/                       Home — single-page reef atlas (hero + filter rail + cards/map)
/locations/[slug]       Location detail (slim: intro → reef condition → see → sites → gear → plan)
/sites/[slug]           Dive-site detail (conditions grid + encounter odds + contribute)
/sites/[slug]/species   Species list ("every animal recorded here")
/method                 Method (anchored: reef state → signals → chances → verify → labels → contribute → gaps → research → sources)
/about                  About + nonprofit + affiliate disclosure
```

The old two-page search (landing picker → results, with "Edit search" ping-pong) is **gone**. It is replaced by ONE live atlas: filters on the left, reef cards on the right, globe lights matches. There is no navigation between input and results.

The conceptual hierarchy is unchanged: **Location → Site → Species.** The homepage operates at the Location level. Method is the shared keystone every in-place link points to.

### 2.2 Navigation
**AtlasNav** is the only global nav, sticky on every page: logo (→ home), **Method**, **About**, and the inline reef search. "Atlas" is the homepage / logo itself. Active state = color only.

**AtlasFooter** on every page: free-atlas tagline, `hello@scubaseason.fun`, Site links (Find a reef / Method / About), and a live-source credit line. No newsletter, no social, no personal email, no timestamps.

---

## 3. Voice & tone / microcopy

| Principle | In practice |
|---|---|
| **Expert peer, plain spoken** | Brief a fellow diver who isn't a scientist. Specific, never jargon. |
| **Honest about limits** | "Needs fresh eyes," never "no data." "Diving here documents what remains." |
| **No hyphens in copy** | Reword compounds; em dashes (—) are fine. |
| **No marketing superlatives** | No "world class," "unmissable" except as a navigational label. |
| **Every reef is worth diving** | Never defend a reef or say "still worth diving." Witnessing change = "a reef in transition." |

**Locked microcopy vocabulary:**

| Concept | Say | Never say |
|---|---|---|
| Reef states | Thriving / Under pressure / Witnessing change | paraphrases |
| Thriving | "Near its natural baseline … recovering or healthy, not perfect" | "pristine," "perfect" |
| Live freshness | "● Live data" (once) | "updated 3 days ago," "last synced" |
| In season | "In season" / "Great at other times of year" | "off season" as a scold |
| Evidence gap | "Needs fresh eyes" | "no data," "abandoned" |
| Heat | "warmer than usual" | "DHW Watch," "bleaching alert level 1" |
| Fishing | "Banned" / "protected" (with `(i)`) | "no-take zone" (in body text) |
| Conditions | "Visibility," "Water temperature," "Current," "Depth" | "vis," "temp," abbreviations |
| IUCN | "Vulnerable," "Endangered," "Least concern" | "VU," "EN," "LC" in diver copy |
| Sightings (now live) | "recently logged," "last seen," "Nearly every dive" | (these are honest now — keep) |
| Leaving link | "…on the Method page →" | a bare "Learn more" that jumps silently |

**Reef-state plain definitions** (used verbatim in the popup):
- **Thriving** — "Near its natural baseline and steady. Recovering or healthy, not perfect."
- **Under pressure** — "Below baseline or slipping from heat or fishing, but the reef structure and fish life still hold."
- **Witnessing change** — "Heavy recent loss or bleaching. Diving here documents what remains."

---

## 4. Component patterns (behavioral)

### 4.1 Collapsible filter rail (homepage)
Sticky left column. Each section is a native `<details open>`; the `<summary>` is the section header plus, where relevant, an `(i)` info button. Sections in production order: **When · What to see · Region · Reef state · Evidence gaps · Certification level.**

- **When** — months, multi-select, OR logic; current month is outlined. Empty = "sort by what's good to dive right now."
- **What to see** — collapsible taxonomy groups, multi-select leaves across groups (OR), active-count badge per group, optional endangered-only toggle.
- **Region** — continent checkboxes.
- **Reef state** — three checkboxes (parity with production data model); the primary read is the card pill + popup, not this input.
- **Evidence gaps** — single "Needs fresh eyes" toggle: surfaces reefs nobody has logged recently.
- **Certification level** — cumulative (your ceiling): ticking Advanced shows Advanced and below.

Every change updates results **live** — count, sort, cards, and globe — with no navigation and no page reload. The "N reefs" count sits in an `aria-live="polite"` region.

### 4.2 Cards / Map view toggle
A pill toggle in the results header. **Cards** = reef grid (default). **Map** = the dark globe panel. On mobile, Map falls back to cards (see 4.5). The active segment is visually distinct (white, lifted) and carries `aria-pressed`.

### 4.3 Reef card (place-only)
A photo tile linking to the location page. Bottom band: region eyebrow + reef name. **Ghost pills appear only where they change the read** — a reef-state pill, an "● In season" pill (in season for the selected/current month), or a "needs fresh eyes" pill when the user is filtering evidence gaps. A default, in-season, thriving card may show no pill at all. Witnessing-change cards do not lift on hover.

### 4.4 Info popup (in-place explanation)
Triggered by an `(i)` button anywhere a non scientist might need help: reef state, in season, what to see, certification, evidence gaps, your chances, IUCN tiers, heat, fishing protection. Opens a centered modal over a blurred backdrop; closes on ×, backdrop click, or Escape. Content = plain explanation (paragraphs or tagged rows), optionally ending in a **named Method link**. This pattern **never navigates** — that is its whole point.

### 4.5 3D globe (Map view) — desktop only
Rotating WebGL globe; dots colored by reef state, dimming when filtered out; click a dot → that location. **Desktop only**: three.js mounts only at ≥1000px. On mobile/tablet the Map view does not load the globe — it resolves to the cards grid (or a static reef list). The globe is delight, not the core flow, and must never block finding a reef on a phone. Auto-rotation stops under `prefers-reduced-motion`.

### 4.6 Search box
Inline in the nav. Focus opens a dropdown of location matches (name + country + region) with a reef-state pill per row. Arrow keys move the cursor, Enter navigates, Escape closes. Pressing Enter with no dropdown match routes to a full results surface. The species list and location pages are reachable from results. Sightings being live means search-adjacent "seen recently" copy is honest.

### 4.7 Encounter-odds list (dive-site)
Per species: name + plain chance label ("Nearly every dive," "About 6 in 10 dives," "About 1 in 3 dives," "Now and then") + likelihood bar + a "where" line. A scannable list, not a feed, not tabs. The calculation ("worked out from how often divers logged it over the past year") lives in the `(i)`, not the page body. No "none seen" negatives in body text.

### 4.8 Conditions grid (dive-site)
Four plain-labeled cards — **Depth / Current / Visibility / Water temperature** — each icon + value + one-line sub. `(i)` where a value needs explaining. Spelled-out labels only.

### 4.9 Contribute rows
Per-platform (iNaturalist → GBIF → IUCN), one plain line each, with the deep how-to deferred to Method. Framed as putting a quiet reef "back on the map for everyone."

### 4.10 Plan a trip (location page) — the one primary action
A sticky right-column card (Airbnb "Reserve" model). Expands on-page: Getting there (airport → drive → boat dropdown) and Where to stay. A "See dive operators" action opens an **on-page operators popup**; each operator links to its **own** booking site. We take no commission (nonprofit) — no generic-search CTA, no competing button.

---

## 5. State patterns

| State | Behavior |
|---|---|
| **Live data** | One "● Live data" eyebrow. No timestamps anywhere. |
| **In season vs other** | In-season reefs sort first; a "Great at other times of year" divider separates the rest. Empty month filter = sort by what's good now. |
| **Needs fresh eyes** | Reefs with no recent logs are never "no data"; they're surfaced by the evidence-gaps toggle and carry a fresh-eyes pill when relevant. |
| **No results** | "No reefs match this combination. Remove a filter to widen the search." No illustration. |
| **Witnessing change** | Card does not lift; copy = "a reef in transition / diving here documents what remains." Never softened, never defended. |
| **Sighting recency (live)** | Because sightings ingest live, "last seen / recently logged / Nearly every dive" are accurate and shown plainly. |
| **Coral cover** | Only two data points exist; shown honestly as a decline chart with a dashed projection. Method says the data is thin. |

---

## 6. Interaction primitives

- **Filter → live results.** Any filter change re-renders cards, count, sort, and globe in place. No navigation, no reload. (State may persist to the URL so a filtered view is shareable.)
- **Globe dot → location.** Click a lit dot to open that location. Filtered-out dots dim and shrink.
- **Cards/Map toggle.** Swaps the right pane; on mobile, Map degrades to cards.
- **`(i)` → popup.** Opens an in-place explanation; never navigates.
- **Named Method link → Method page.** The only sanctioned way to leave for an explanation, and it always says so.
- **Reduced motion.** Globe rotation and the live-dot pulse stop under `prefers-reduced-motion`.
- **Escape / backdrop.** Closes any popup and returns focus to its `(i)` trigger.

---

## 7. Accessibility floor

| Pattern | Requirement |
|---|---|
| Filter controls | Real native `<input type="checkbox">` / `<details>` — Tab-reachable, Space/Enter operable. The mockups' `<div onclick>` shims are visual only and must be replaced. |
| Live count | "N reefs" in an `aria-live="polite"` / `role="status"` region. |
| View toggle | `aria-pressed` on Cards/Map; both reachable by keyboard. |
| Info popup | Focus moves into the modal on open and is trapped; Escape and × close it and return focus to the `(i)` trigger; backdrop is `inert`/`aria-hidden` while open. |
| `(i)` buttons | Accessible label ("How this works" / "What this means"), not a bare "i". |
| Globe | Decorative under reduced motion; never the sole path to a reef (cards always available). Each dot is keyboard-reachable or paired with a card list. |
| Decorative dots/icons | `aria-hidden="true"` on live dots, swatches, likelihood bars, leading gear/condition icons. |
| Reef-state & in-season | Conveyed by label text + pill, never color alone (e.g. "● In season" mark + text). |
| IUCN / chances | Text labels, not codes or color alone; `(i)` available for the full explanation. |
| Images | Informative `alt` naming the place (e.g. "Underwater reef at Florida Keys"); never `alt=""` for hero photos. |
| Color contrast | Text on brand tints uses `#1d5d90`/`#1f57c8` for AA; white hero text holds 4.5:1 via the dark gradient band. |
| External links | Operator/affiliate links open in a new tab with "(opens in new tab)" in the accessible name. |

---

## 8. Key flows

### 8.1 Maya finds her trip (the spine flow)
**Protagonist:** Maya, 29, Open Water certified, zero science background. She wants to dive somewhere good in June and would love to see a turtle. A friend sent the link.

1. **Home.** Maya lands on the photo hero — "Find where to dive, and where the ocean needs eyes," with a "● Live data" eyebrow. She scrolls to the atlas. The filter rail is on the left in plain order. She taps **June** under *When* and opens *What to see* → **Turtles** → "Green turtle." Results update **live**: the count drops, in-season reefs jump to the top, the rest fall under "Great at other times of year." She never left the page, never hit a "search" button.

2. **Reading the map.** Curious what "Under pressure" means on a card pill, she taps the `(i)` by the sort line. A popup explains the three labels in plain words — "near its natural baseline, not perfect" — and ends with "See exactly how we calculate this on the Method page →." She doesn't need the Method page; the popup was enough. She flips to **Map** (desktop) and watches her matches light up on the globe; the rest dim. (On her phone later, Map just shows the cards — no broken globe.)

3. **Location — Florida Keys.** She clicks a card. The page opens with a plain editorial paragraph about the Keys, then a **match-context check row**: "✓ June · ✓ green turtle seen recently · ✓ your level." Then **Reef condition** (once): one sentence, a coral-cover decline chart (31% → 14%, dashed to ~2045), "warmer than usual" with an `(i)`, fishing "Banned" with an `(i)`. No stat strip, no repeated facts, no timestamps. **What you'll see** lists species newest-first with spelled-out IUCN tiers. **Dive sites** are simple rows: name · species · depth.

4. **Dive site — Looe Key.** She opens a site. A **conditions grid** spells it out: Depth, Current, Visibility, Water temperature. The **encounter-odds list** tells her plainly: "Green turtle — About 6 in 10 dives — grazing on the reef flat." She taps the chances `(i)` to learn it's "worked out from how often divers logged it over the past year." Because sightings are live, "recently logged" is honest. She can **contribute** her own sighting via iNaturalist; the deep how-to is on Method.

5. **Species list.** From the location she opens "every animal recorded here": type-filter pills (All / Fish / Sharks & rays / Turtles / Invertebrates) with counts, each row showing chance + where + likelihood + spelled-out IUCN.

6. **Plan a trip — the one action.** Back on the location page, the sticky **Plan a trip** card has followed her down. She expands Getting there (airport → drive → boat) and Where to stay, then taps "See dive operators." A popup lists operators, each linking to **its own** booking site. There is no competing button and no commission — it's a nonprofit atlas. Maya books on an operator's site. Done: she found a reef, understood it without any jargon, and reached one clear action.

7. **When she wants the why.** Every explanation she met was a popup. The one time she wanted the full method (how reef state is calculated, how chances are derived, the verify pipeline, the IUCN tiers, the evidence-gap framing), she followed a named "…on the Method page →" link to the **Method** page, where the 63-source list sits collapsed at the bottom — honest, credited, not dumped in her face.

**Design intent:** Maya never read jargon, never saw a duplicate fact, never hit a stale timestamp, never bounced silently between pages, and always had exactly one clear next action. That is the redesign.

### 8.2 Flow at a glance
**Home** (filter → live cards/map, in-season-first sort, info popups, desktop globe) → **Location** (slim: intro → reef condition → see → sites → gear → sticky Plan a trip) → **Dive site** (conditions grid → encounter odds → contribute) → **Species** (every animal, most-likely-first) → **Method** (the keystone for every named explanation link). Reef state and likelihood are always explained via in-place popups that, if the reader wants more, name the Method page.
