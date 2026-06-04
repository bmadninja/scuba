---
title: scubaSeason.Fun — Experience
status: final
created: 2026-06-03
updated: 2026-06-04
companion: DESIGN.md
scope: >
  Information architecture, voice and tone, component behavior, state
  patterns, interaction primitives, accessibility floor, and key user flows.
  Visual specifications (colors, spacing, typography) live in DESIGN.md and
  are cross-referenced here with {colors.X} / {typography.X} / {spacing.X}
  syntax only.
---

# scubaSeason.Fun — Experience

## 1. Product character

scubaSeason.fun is a **research instrument for divers, not a travel brochure.** Every interaction pattern follows from this premise: the user comes with a real question (where can I dive with mantas in October? how degraded is this reef?) and leaves with a specific, honest answer — including "we don't know yet."

The experience is built on three behavioral promises:
1. **Honesty over optimism.** When data is absent, uncertain, or stale, say so — clearly, inline, never hidden.
2. **No gates.** No modals, no paywalls, no sign-up prompts interrupt an information flow. Disclosures are inline and collapsible.
3. **Shareability.** Any filtered view, any data claim, any page can be linked. Filter state lives in the URL.

---

## 2. Information architecture

### 2.1 Route hierarchy

```
/                               Home — Atlas Explorer (globe + filter + location cards)
/locations/[slug]               Location detail (reef science, sites, species, planning)
/locations/[slug]?state=stressed  Same template — Witnessing change / Under pressure variant
/sites                          Sites catalogue (search + filter)
/sites/[slug]                   Site detail (briefing, species, conditions, planning)
/where-to-see/[species]         Species encounter page (cross-site evidence)
/{location}/{site}/species/[slug]  Species detail page (full species profile at a site)
/search?q=                      Search results page (full results beyond nav dropdown)
/for/[cert]                     Cert-level landing pages (never-dived → tech)
/data                           Data methodology + transparency index
/about                          About + affiliate disclosure + roadmap
/faq                            FAQ (metric calculation explanations)
```

**Note on mobile:** All routes above respond to mobile viewports — same URL, responsive layout. Mobile-specific layout behavior (filter drawer, stat strip horizontal scroll) is described per-component below.

**Note on stressed/witnessing location variant:** `/locations/[slug]` uses the same template for all reef states. Reef state is a data property — the UI adapts (see §7.2 and §5.6), not the route.

### 2.2 Conceptual hierarchy

The mental model is: **Location → Site → Species.** A location is a reef system or dive area (e.g. Tubbataha, Raja Ampat). A site is a specific dive within that location (e.g. Bird Rock). A species is a creature that may be sighted at one or more sites.

The Atlas Explorer operates at the Location level. The Sites catalogue operates at the Site level. Where-to-see pages invert the hierarchy: start from a species, arrive at sites.

### 2.3 Navigation

**AtlasNav** is the only global navigation surface. It is sticky at the top of every page.

- Logo: `scubaSeason.Fun` — the `.fun` segment renders in {colors.brand}. Clicks go to `/`.
- Three primary nav links: **Atlas** (`/`), **Method** (`/data`), **About** (`/about`).
- Active state: {colors.brand} text. No underline, no background, no heavy indicator — the active link is distinguished by color alone.
- **Global reef search** lives inline in the nav, right of the links.

**AtlasFooter** appears on every page below the main content:
- Tagline, contact email `hello@scubaseason.fun`, footer nav links (Data sources, About, FAQ).
- Copyright line and a brief data disclaimer.
- No newsletter capture, no social links, no upsell.

---

## 3. Voice and tone

### 3.1 Principles

| Principle | What it means in practice |
|---|---|
| **Expert peer, not salesperson** | Write as if briefing a fellow diver, not selling a holiday. |
| **Honest about limits** | "Limited survey data available" is preferred over "data coming soon." |
| **Conversational precision** | Use specific language: "Last eyes underwater: 2019" not "Survey: historical." |
| **First-person when appropriate** | The About page uses "I've been bamboozled one too many times" — this is intentional and correct. |
| **No hyphens in copy** | Never use `-` in user-facing strings. Reword compound adjectives. Em dashes (—) are fine. |
| **No marketing superlatives** | Copy does not call anything "world-class," "unmissable," or "bucket-list" unless it is a navigational label. |

### 3.2 Data labeling vocabulary

These exact phrases are used throughout the product and must be consistent:

| Concept | Correct label | Never say |
|---|---|---|
| Thermal monitoring data | "Live · NOAA CRW · updated [date]" | "real-time data," "current conditions" |
| Field survey data | "Snapshot · [method] · surveyed [date]" | "recent survey," "up to date" |
| Occurrence records only | "Presence data · GBIF/OBIS · no population trend" | "confirmed population" |
| Last known survey | "Last eyes underwater: [year]" | "last updated," "last checked" |
| Survey age > 3 years | Append "(N years ago)" to the snapshot label | omit the age |
| No data | "Unknown" or "Limited survey data available" | leave blank, show "—" |

### 3.3 Reef state labels

Always use the exact three-state vocabulary. These labels are product-defined and must not be paraphrased:

- **Thriving** — healthy reef, good coral cover, low pressure
- **Under pressure** — fishing pressure, bleaching risk, declining trend
- **Witnessing change** — documented loss, historic bleaching, degraded state

### 3.4 Affiliate link treatment

Affiliate links are labeled inline at the point of use. The about page contains a full affiliate disclosure. There is no dark pattern around commercial links — they are marked, not hidden.

---

## 4. Component patterns (behavioral)

### 4.1 AtlasNav — global search

**Trigger:** Input receives focus.
**Open state:** Dropdown renders below the input, max 8 results, filtered by `name + country + region` against the query string.
**Result rows:** Each row shows the location name, country, and a reef-state pill ({colors.reef-states.thriving} / {colors.reef-states.pressure} / {colors.reef-states.change} background, per state).
**Keyboard behavior:**
- `ArrowDown` / `ArrowUp` move the selection cursor through results; the cursor wraps at ends.
- `Enter` navigates to `/locations/[slug]` for the selected result.
- `Escape` closes the dropdown and clears focus.
**Mouse behavior:** Click on a result navigates to that location. Click outside the search widget (detected via `mousedown` on `document`) closes the dropdown.
**Close behavior:** Input clears on navigation (`setQ("")`). Dropdown closes on Escape, outside click, or successful navigation.
**Empty query:** Dropdown does not open; no results shown.
**No results (dropdown):** Dropdown does not render — no "no results" state in the nav dropdown. For full results, the user is directed to `/search?q=` (see §4.9).

### 4.2 Atlas filter (AtlasFilterRail)

**Layout — two approved arrangements (chosen at build time).** The filter behavior below is layout-agnostic. Two visual arrangements are approved as peers; either may be implemented and both inherit the identical behavior, taxonomy, and state rules in this section. Mockups: [mockups/filter-layout-A-horizontal-bar.html](mockups/filter-layout-A-horizontal-bar.html), [mockups/filter-layout-B-left-rail.html](mockups/filter-layout-B-left-rail.html). See DESIGN.md for the visual spec of each.

- **Layout A — horizontal filter bar.** A bar above the results, one dropdown per filter category. Wildlife is a single dropdown holding the full categorised taxonomy. Frees the result grid to run full-width (photo-forward, suits casual discovery). The globe sits above or below at full width.
- **Layout B — left rail with collapsible groups.** A left column (`grid lg:grid-cols-[260px_1fr]`), each filter category a collapsible `<details>` group. Wildlife is one facet containing nested, collapsible sub-groups. All facets are reachable without leaving the rail (power filtering).

**Sticky behavior (both layouts):** The filter surface is sticky and scrolls independently of the results. Only the results list scrolls under it — the filter never scrolls away with the cards. Layout A: the bar pins to the top of the viewport on scroll. Layout B: the rail is `position: sticky` with its own overflow scroll (`max-height: calc(100vh - …)`), pinned while the result grid scrolls beside it. *(This corrects the prior behavior where scrolling the card grid also moved the filter side.)*

**Mobile:** Filters collapse behind a "Filters" button in the results header and open as a full-height drawer. Drawer backdrop click or an in-drawer "Done" button closes it. The wildlife taxonomy renders as collapsible sub-groups inside the drawer.

**Filter groups:**
1. **Reef state** — three checkboxes: Thriving / Under pressure / Witnessing change. All three on by default. Toggling removes that reef state from results. Unchecking all three produces a no-results state.
2. **Certification** — four checkboxes: Beginner / Open water / Advanced / Technical. **Cumulative filter:** selecting "Advanced" shows all locations accessible to Advanced or less skilled divers (Beginner + Open water + Advanced). This matches how divers plan — you select your ceiling, not an exact level.
3. **Region** — five checkboxes by continent order: Asia / Oceania / Indian Ocean / Americas / Atlantic & Mediterranean.
4. **Month** — twelve checkboxes Jan–Dec. Filters to locations where that month is within `bestMonths`. Multiple months are OR logic (show locations in season for any selected month).
5. **Thermal stress** — four checkboxes: No stress / Watch / Elevated / Heat alert. Maps to `heatLevel` integer buckets (0 / 1 / 2 / ≥3).
6. **Wildlife — categorised taxonomy.** Replaces the prior 6 flat tags. The underlying data is rich (536 distinct species across 356 sites); `animalTags` is derived at build time in `atlas-location.ts`. Wildlife is presented as **named sub-groups**, each holding individual encounter tags. Proposed grouping (final tags subject to the data-coverage rule below):

   | Sub-group | Tags |
   |---|---|
   | **Sharks & rays** | Sharks · Hammerheads · Rays & mantas · Eagle rays |
   | **Marine mammals** | Whales · Dolphins · Seals & sea lions · Dugongs |
   | **Reptiles & pelagics** | Sea turtles · Large pelagics · Reef fish |
   | **Macro & critters** | Cephalopods · Frogfish & seahorses · Nudibranchs · Corals & inverts |

   **Data-coverage rule (no empty filters):** Every tag must resolve to ≥1 location in the live data or it is not rendered. Each new tag requires a corresponding derivation rule in `atlas-location.ts` mapping it to species actually present at sites. Tags are filtered on the derived `animalTags`; selecting tags across sub-groups is OR logic. A sub-group header may show a count badge of active tags within it.
7. **Fresh eyes only** — single toggle. When on, shows only locations where `lastSurveyDays` is null (unknown) or high (stale/cold). Used to find reefs that need new survey data.

**Accessibility of the filter controls (required — extends §8).** *The `.working/`/`mockups/` filter files are static visual references; production controls must meet the following, which the mockups do not themselves demonstrate.*
- **Real, focusable controls.** Every filter option is a native `<input type="checkbox">` inside its `<label>`, or a `<button role="checkbox" aria-checked>` / `aria-pressed` toggle. No non-focusable `<span>` toggles. Every option is Tab-reachable and operable with Space/Enter (WCAG 2.1.1, 4.1.2).
- **Layout A dropdown triggers.** Each category button has `aria-expanded`, `aria-controls` (pointing at its panel), and `aria-haspopup="true"`. `Escape` closes the open panel and returns focus to its trigger. Opening a panel moves focus into it; closing returns focus to the trigger.
- **Layout B groups.** Use native `<details>/<summary>` for facet groups and wildlife sub-groups (browser-handled expand/collapse state, no ARIA workaround) — this is the model to follow.
- **Mobile drawer.** On open, move focus to the drawer's first control and **trap focus** within it; `Escape` and the "Done" button close it and return focus to the "Filters" trigger. Background content is `inert`/`aria-hidden` while open.
- **Count badges.** Every numeric active-count badge (category button, sub-group header) pairs the number with visually-hidden text, e.g. "2 active filters" — never a bare digit.
- **Sticky filter + scroll.** The sticky bar/rail must not trap focus or obscure focused results; ensure focused result cards scroll into view and the sticky surface reflows (does not clip) at 200% zoom. (The sticky bar is not modal — no focus trap; the trap requirement is the mobile drawer only.)
- **Live result count.** The "Showing N locations" count updates on every filter change, so it lives in an `aria-live="polite"` / `role="status"` region — screen-reader users hear the new count when they toggle a filter.

**Sort options** (rendered as a select or segmented control at the top of the card grid):
- Best season (default)
- Oldest surveys first
- Highest thermal stress
- Name

**URL sync:** All filter state is persisted to the querystring on every change using `router.replace` (no full navigation). Parameters: `c` (conditions), `m` (months), `s` (skill), `r` (region), `h` (heat), `a` (animals), `fresh` (fresh-only toggle), `sort`. Default values are omitted from the URL.

**Active filter chips:** When any non-default filter is active, a filter summary bar appears directly below the filter strip (above the card grid). Each active value renders as a colored pill with an × dismiss button that removes only that value. Pill color matches the filter category (reef state pills use the reef-state token; other filters use {colors.brand}/10 tint with {colors.brand} text). A "Reset all filters" text link at the right end of the bar resets all filters to defaults. Card count updates live in the bar ("Showing 12 locations"). On mobile, this bar appears below the "Filters" button row.

**Chip overflow:** If the active filter bar contains more chips than fit in one line, it wraps to a second line (no truncation, no "…more" expand). Chip ordering: reef state first, then cert, then region, then month, then thermal, then wildlife, then fresh-only.

**No-results state:** When filtered results are empty, show:
1. A summary of which filters are active (as chips with individual remove buttons).
2. A "Reset all filters" link.
3. No card grid, no empty-state illustration.

### 4.3 ReefLocationCard

Destination-level card. Links to `/locations/[slug]`.

**Layout:** Stack — 4:3 hero image, then body content.

**Image area:** *(Single-signal photo — overlays reduced to keep the underwater photo clean.)*
- 4:3 aspect ratio, `object-cover`, full card width. Always a real underwater photograph (see §5.5 / DESIGN.md photo policy).
- **Top-left overlay: reef state badge only.** Pill-shaped, dot + label, ring-inset border. This is the *only* element overlaid on the photo.
- No skill badge and no "In season now" badge on the photo — these move into the card body meta row (below). The photo carries one status signal, not three.
- Image scales to `scale(1.02)` on card hover (500ms transition).

**Body:**
- Location name: `text-base font-semibold`, transitions to {colors.brand} on hover.
- Country: `text-sm`, {colors.muted}.
- **Meta row** (relocated off the photo): skill/cert chip (Beginner / Open water / Advanced / Technical) + "In season now" chip (when `inSeason === true`). Quiet pill style, sits beneath the title/country. The in-season chip uses both a fill/empty mark and text, never color alone (see §8).
- Hook: 2-line clamp, `text-sm leading-6`.
- **Freshness line** (below a thin divider): two dot + label pairs at `text-[11px]`.
  - Thermal dot: always green (`#15a05c`) + "Thermal: today" — thermal data is always from the nightly sync.
  - Survey dot: color computed from `lastSurveyDays` via `freshness()` — green (<365d), amber (1–3y), red (>3y), red if null. Label: "Last eyes underwater: [year]" or "Last eyes underwater: unknown".
- Coral cover and best season stats render below the freshness line (exact layout per DESIGN.md).

**Hover state:** Card lifts 3px (`-translate-y-[3px]`), border transitions to {colors.brand}/40, shadow increases.

**Witnessing change variant:** Cards in the "Witnessing change" reef state do not receive the hover lift or shadow increase. The card is visually quieter — the reef is fading, and the interaction should reflect that. The reef state badge still renders; no cheerful animations are applied.

**Globe-selection state:** When the corresponding globe marker is clicked, the card receives `ring-2 ring-[#0089de] ring-offset-2`. This is the only way a card can appear "selected" — there is no persistent selection state.

### 4.4 SiteCard

Site-level card. Links to `/sites/[slug]`.

**Layout:** Image (fixed `h-44`) + body.

**Image area:** Fixed height, `object-cover`, scales `1.02` on hover.

**Body:**
- Country (uppercase, tracking-wider, muted) + in-season pill, inline row.
- In-season pill: "● In season" (emerald) or "○ Off season" (slate). Color and fill both change — not color alone.
- Site name: `text-lg font-bold`, transitions to {colors.brand} on hover.
- Description: 2-line clamp.
- **Headline sighting row:** confidence dot + species common name (bold) + "· last confirmed [relative time]". If no sighting data: muted dot + "Sighting evidence pending." Never blank — always shows a state.
- **Chip row:** depth range chip, skill level chip (with `+` suffix to indicate "this level or above"), and up to one dive-type chip. Chips are `rounded-full` pill style.

**Hover state:** Border transitions to {colors.brand}/40, shadow appears.

### 4.5 DataFreshnessLabel

Pill component used wherever a data claim needs a provenance label. Always links to `/data` for full methodology.

**Three variants:**
1. **Live** — green dot + "Live · [source] · updated [date]". Used for NOAA CRW thermal data. Source defaults to "NOAA CRW." The dot renders in `bg-emerald-500`.
2. **Snapshot** — amber dot + "Snapshot · [method] · surveyed [date]". When the survey is >2 years old, appends "(N years ago)". The dot renders in `bg-amber-500`.
3. **Presence** — slate dot + "Presence data · [source] · no population trend." Used for GBIF/OBIS occurrence records with no trend data.

All variants render at `text-[10.5px] font-semibold uppercase tracking-[0.1em]`. The entire pill is a link — clicking navigates to `/data`.

### 4.6 IucnBadge

Inline badge on species cards. Renders the IUCN Red List status abbreviation (LC, NT, VU, EN, CR, EW, EX, DD). Flat, no elevation — consistent with ReefStateBadge flatness rule.

### 4.7 Methodology disclosure (details/summary)

Used wherever a data claim needs explanation. Implemented as a native HTML `<details>/<summary>` element.

- Summary row: info circle icon (lucide:info, 14px, {colors.muted}) + short label (e.g. "How is this calculated?").
- Expanded: full methodology text + source list.
- No animation required — native browser disclosure behavior.
- Never modal. Always inline at the point of the claim.

### 4.8 AffiliateLink

Wraps any commercial partner link. Behavior: renders as an external link with a visible disclosure marker. The affiliate disclosure is stated on the About page; individual links do not duplicate the full disclosure text.

**Accessibility (required, applies everywhere AffiliateLink appears — Plan-your-trip, Gear, sidebar operators):**
- **New-tab announcement.** Since these open `target="_blank"` (§6.4), the accessible name must include "(opens in new tab)" (visible or visually-hidden). Unannounced context changes fail expectations for SR and cognitive users.
- **Self-describing name.** The accessible name must identify the destination, e.g. "Book Damai II liveaboard (opens in new tab)" — not a bare operator/hotel name, and not just a "→". A trailing "→" glyph is decorative and `aria-hidden="true"`. Any inline tag ("stay + dive", "affiliate") is part of the accessible name.

### 4.9 Search results page (`/search?q=`)

When the user presses Enter in the nav search input (rather than selecting a dropdown result), or submits a query that yields no dropdown results, they are routed to `/search?q=[query]`.

**Layout:** Full-page results surface. Sticky nav at top. Results grid below.

**Result types (in priority order):**
1. Location matches (name + country + region).
2. Site matches (name + location name).
3. Species matches (common name + scientific name).

**Each result row:** Category pill (Location / Site / Species) + primary name + secondary metadata (country or location name) + reef state pill (for location and site results).

**No results state:** "No results for '[query]'" heading. Suggestions: "Try searching for a location name, species common name, or a country." No illustration.

**URL:** Query state in `?q=` parameter. Shareable and server-renderable.

### 4.10 Active filter state (filter summary bar)

See §4.2 for full behavioral spec. Summary:
- Filter summary bar appears below the filter strip when any non-default filter is active.
- Active value renders as a colored pill with × dismiss.
- Pill colors: reef state uses reef-state tokens; all other filters use {colors.brand}/10 tint + {colors.brand} text.
- "Reset all filters" link at right end.
- Card count ("Showing N locations") updates live.
- On mobile: bar appears below the "Filters" trigger button, not inside the drawer.

### 4.11 Live sightings feed

A feed surface showing recent iNaturalist observations for a location or site. Sorted by recency, newest first.

**Freshness indicator per entry:**
- Green dot: observation within 30 days.
- Amber dot: observation 31–90 days ago.
- Slate dot: observation >90 days ago.

**Each entry shows:** freshness dot + species common name + site name + iNaturalist observation ID (linked to `inaturalist.org/observations/[id]`) + date (in `<time dateTime="[ISO]">` element).

**No entries state:** "No recent sightings recorded. Be the first — submit via iNaturalist." (Links to iNaturalist project page if configured.)

**Update cadence:** Feed data syncs from iNaturalist nightly. The feed header shows "Updated [date]" using the DataFreshnessLabel live variant.

**Streaming/polling:** No real-time streaming. Static nightly sync. Do not imply live push updates.

### 4.12 Stat strip

A horizontal row of 6 key facts about the Atlas, rendered in the hero area of the homepage above the AtlasExplorer grid.

**Structure per stat:** Label (e.g. "Locations tracked") / Value (e.g. "94") / Note (e.g. "across 6 regions"). All three fields required.

**Layout:** Horizontal flex row. Hairline vertical dividers between stats (`border-r border-ink/10`). Background: {colors.surface}. Padding: consistent with hero section.

**Responsive:** On mobile, the stat strip scrolls horizontally (`overflow-x-auto`, no visible scrollbar). All 6 stats remain accessible via swipe.

**Sourcing:** Values are pulled from the same data layer as the Atlas cards at build time. The stat strip does not show stale counts — it rebuilds on each deploy.

**Animation:** Numbers do not animate or count up. Static values only. No scroll-triggered counters.

### 4.13 How-to-dive section

A numbered instructional section explaining the dive planning methodology. Appears on the homepage below the AtlasExplorer and on cert-level landing pages.

**Structure:** 4 steps, numbered 01–04.

**Per step layout:**
- Step number: large muted display figure (`text-7xl font-bold`, color: {colors.muted}/30, `select-none`).
- Step title: bold, `text-xl font-semibold`.
- Step description: Source Serif 4, italic, `text-base`.

**Arrangement:** 2-column grid on desktop (steps 01–02 left, 03–04 right), single column on mobile.

### 4.13a Plan your trip block (location detail)

The single planning surface — and it lives on the **location page only** (the dive-site page carries no booking; see §7.3). Mockup: [mockups/location-plan-your-trip.html](mockups/location-plan-your-trip.html). Replaces the prior arrangement where a dark, high-emphasis operators block visually dominated a quiet getting-there + lodging list, and a hardcoded "See trip options" button always linked to a generic PADI search.

**Information order (top to bottom) — answers "how do I get there, and what do I book?":**
1. **Getting there** (leads). Renders the structured `getThereStructured` when present (nearest hub → transfer to sites → optional liveaboard note); falls back to the `getThere` text. This is the first thing a trip planner needs.
2. **What to book** — accommodation and operators sit **directly next to each other as two labeled, equal-weight peer groups**: a "**Where to stay**" group immediately followed by an "**Operators**" group, same card/list treatment and heading scale. Neither dominates; they read as a pair, not a hierarchy.

**Booking-type logic:**
- **Liveaboard that covers diving** → surfaced as a single combined "Stay + dive" option. When present and covering the dive, a redundant separate operator entry for the same trip is suppressed (a liveaboard *is* the dive operation). Data signal: lodging `kind: "liveaboard"`.
- **Hotel/resort accommodation** → "Where to stay" peer block. If a resort also books dives, note it inline ("books dives on site") so the user knows an operator is not separately required.
- **Operators** → shown only when backed by a **real or affiliate URL** (`isAffiliate === true`, or a non-template partner URL). Synthesized generic-search URLs (e.g. `padi.com/dive-shop-search?q={name}`) are **not** rendered as operators — this removes the dead Ogasawara-style link.
- **No real operator and no dive-capable lodging** → show Getting there + accommodation only. Do not invent operators, do not show a generic search button.

**Affiliate treatment:** Each commercial link uses `AffiliateLink` and is clearly marked (§9.5). The full disclosure lives on the About page.

**Witnessing change variant:** Muted treatment per §5.6 — heading softens to "Plan thoughtfully," links remain, hierarchy quiets. No links removed.

**Sticky:** The block remains sticky in the location page's right column on desktop, consistent with prior behavior, so the booking path is reachable without hunting.

### 4.14 Gear section

Tells divers what kit they need. Mockup: [mockups/location-gear-section.html](mockups/location-gear-section.html). **Lives on the location page only** — the dive-site page carries no gear section (it links up to the location page, alongside booking; see §7.3). Built from the intact data layer (`Site.gearIds`, `Site.siteSpecificGear: SiteGearItem[]`), aggregated across the location's sites. Two layers:

- **Layer A — basic kit (location level).** The standard set for the location, adapting to the region's **water temperature** (wetsuit thickness) and **skill level**. One list for the whole location. Accuracy is mandatory: a wrong wetsuit thickness for the water temp breaks trust — the recommendation must be correct or absent (see journey §10.2 critical requirement).
- **Layer B — site-specific add-ons, grouped by site.** Specialist gear individual sites demand, e.g. a **reef hook for strong current** at one site, dive light for overhangs at another, SMB for blue-water drift exits. Aggregated from each site's `siteSpecificGear` and **grouped under the site name**, with each group linking down to that site. Only renders items present in data; a site with no add-ons does not appear in Layer B.

**Placement:**
- **Location detail page** — full Layer A + Layer B, in the page body (§7.2). Each gear item has a quiet "Shop →" link (`AffiliateLink`, Amazon Associates). **No per-item "affiliate" badge** — disclosure is handled once at the section level (see Disclosure below).
- **Dive-site page** — no gear section; the site sidebar's "Part of [location]" card links up to the location page where gear lives.

**Disclosure:** One quiet disclosure line at the foot of the section ("Some shop links earn us a commission at no cost to you — full disclosure on the About page"). This satisfies the marked-not-hidden affiliate policy (§9.5) at the section level instead of badging every row.

**Empty state:** If a site has no `siteSpecificGear`, render Layer A only; never show an empty Layer B heading.

**Accessibility:** Each layer is a semantic list — `<ul>` with one `<li>` per gear item — so screen readers get item count and list boundaries. The leading emoji/icon per item is decorative (`aria-hidden="true"`); the text name and reason carry the meaning (e.g. the Layer B reason "Reef hook — strong current on the corner" is text, not conveyed by the icon). Gear shop links follow the AffiliateLink rules in §4.8.

---

## 5. State patterns

### 5.1 Data freshness states

Three freshness states apply to all time-sensitive data points. These states are purely behavioral — the visual encoding (dot color) is in DESIGN.md.

| Key | Condition | Behavioral implication |
|---|---|---|
| `fresh` | `lastSurveyDays < 365` | Present as authoritative. No age caveat needed. |
| `stale` | `lastSurveyDays 365–1095` | Present with the year. Consider noting the survey age. |
| `cold` | `lastSurveyDays > 1095` or null | Always show the age or "unknown." The "Fresh eyes only" filter surfaces these specifically. |

Thermal data is always `fresh` by convention — it updates nightly from NOAA CRW and the dot is always green. There is no stale/cold thermal state.

### 5.2 Reef state classification

Three states, computed from coral cover + fishing pressure + bleaching alert. Full computation rules in project memory (`project_data_strategy.md`). States are never user-editable.

### 5.3 In-season state

Computed at request time: `site.bestMonths.includes(currentUTCMonth)`. Shown as:
- "In season now" badge on location cards (top-left overlay).
- "● In season" / "○ Off season" pill on site cards.
- Season calendar cells with `ring-2` on the current month column.

In-season state is never shown for "always in season" sites — if `bestMonths` is empty, no badge renders.

### 5.4 No-results state (AtlasExplorer)

Triggered when the filter combination returns zero locations. The card grid is replaced by:
1. Active filter summary (chips with × dismissal).
2. "Reset all filters" link.

No illustrations, no calls to action beyond resetting filters.

### 5.5 Missing data states

| Data type | When absent | Display |
|---|---|---|
| Hero image | `heroImageUrl` null | `underwaterPhotoUrl()` falls back to a placeholder; never a broken image |

#### 5.5a Photo sourcing policy (locations & inspiration cards)

Every location-representing surface must render a **real underwater photograph of the place it represents** — never a CSS gradient as the primary surface, never a mismatched stock image. The reference standard is the `where-to-see/[species]` page, which renders real underwater photos.

- **Source of truth:** Locations carry no image of their own. The location's photo is **borrowed from its own dive sites** — `atlas-location.ts` already computes this, preferring a site photo that passes `isUnderwaterQualityPhoto()` (underwater-only gate, per the project rule that every hero must be an underwater photograph). Because the photo comes from the location's sites, it matches the location.
- **Surfaces that must render the borrowed photo:**
  - **Location detail hero** — currently draws a gradient only; must render the borrowed underwater photo behind the hero content. **Alt text:** informative, naming the location (and ideally the source site), e.g. "Underwater reef at [location]" — never `alt=""`. The gradient base layer (when a photo is present) is decorative. Hero content must sit within the dark bottom band of the legibility overlay so white text holds 4.5:1 on any photo (add a localized scrim behind the H1/breadcrumb if needed).
  - **Homepage inspiration grid** ("Worth going for" / "Something remarkable") — featured cards currently draw gradients; must render the borrowed underwater photo.
- **Fallback order:** (1) location's own `heroImageUrl` if ever populated → (2) first site photo passing the underwater check → (3) any site photo → (4) the underwater placeholder from `underwaterPhotoUrl()`. The gradient may remain only as a base layer *under* the photo (for load-in / letterboxing), never as the visible surface when a photo exists.
- **Underwater-only:** Reject surface/dock/specimen/illustration images at every tier (project rule `hero_must_be_underwater`).
| Coral cover | No records | Panel not rendered; no empty bar |
| Sighting evidence | No `sightings` records for site | "Sighting evidence pending" chip on SiteCard; no species section on site detail |
| Last survey | `lastSurveyDays` null | "Last eyes underwater: unknown" with red freshness dot |
| Fishing pressure | `fishingPressure === "unknown"` | Reef science stamp not rendered on site detail |

### 5.6 Stressed / Witnessing change location variant

When a location's reef state is "Under pressure" or "Witnessing change," the location detail page applies the following behavioral differences:

- **Planning CTAs suppressed:** The `PlanYourTripBlock` renders in a muted style — operator links still appear but the primary "Book this trip" heading is replaced with "Plan thoughtfully." No CTA is removed, but the hierarchy is softened.
- **Reef science panel leads:** The coral cover and fishing pressure panels are promoted to the top of the Overview section, above the descriptive copy. The data tells the story first.
- **Degraded-reef honest label:** An inline callout (not a banner, not a modal) states: "This reef is experiencing documented loss. Survey data, depth, and species records are current." Tone is informational, never discouraging.
- **No hover lift on location cards:** See §4.3 Witnessing change variant — lift animation is suppressed.
- **Species evidence expectations:** In the "What you'll see" section, uncertain and presence-only records are more likely. The evidence framing (outlined ghost dots, "presence data only" labels) must be accurate and not softened.
- **Under pressure** state: CTAs are not suppressed — only Witnessing change applies the muted CTA treatment. Under pressure locations render planning CTAs at full prominence.

---

## 6. Interaction primitives

### 6.1 Globe → card highlight

**Trigger:** User clicks a colored marker on the PlanetGlobe.
**Effect:** The corresponding ReefLocationCard receives `ring-2 ring-[#0089de] ring-offset-2`. The page scrolls to bring the card into view.
**Reset:** The ring is removed when: (a) another marker is clicked, or (b) the globe click is deselected.
**Purpose:** Lets users explore geographically and find the card without scanning.

### 6.2 Filter → URL sync

**Trigger:** Any filter change in AtlasFilterRail.
**Effect:** `router.replace` updates the URL querystring without a full navigation. The card grid re-renders with filtered results. The sort select and active chip row also update.
**Sharing:** The resulting URL can be copied and shared. A recipient lands on the same filtered view.
**Back button:** Because `router.replace` is used (not `router.push`), filter changes do not create browser history entries — the back button returns the user to the page they came from, not the previous filter state.

### 6.3 Card hover

On both ReefLocationCard and SiteCard:
- Site/location name transitions to {colors.brand}.
- Card border transitions to {colors.brand}/40.
- Card or image has a subtle lift/scale (see §4.3 and §4.4; suppressed for Witnessing change cards).
- Transition duration: 200–500ms depending on property.

### 6.4 External link behavior

Affiliate links and partner links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Internal navigation never opens a new tab.

### 6.5 Disclosure drawers

All methodology and source disclosures use `<details>/<summary>`. No JavaScript required. Toggle is handled by the browser. No animation. The disclosure does not affect surrounding layout when open — it expands inline.

---

## 7. Page flows

### 7.1 Home — Atlas Explorer flow

1. User lands on `/`.
2. Above the fold: stat strip (§4.12) — 6 key facts, horizontal row — and a brief product hook.
3. How-to-dive section (§4.13) renders below the hero, before the AtlasExplorer grid.
4. `AtlasExplorer` fills the viewport — globe left, filter rail left, card grid right.
5. Default state: all reef states active, no month/skill/region/wildlife filters, sorted by best season.
6. Globe auto-rotates at low speed. Markers are colored by reef state: {colors.reef-states.thriving} / {colors.reef-states.pressure} / {colors.reef-states.change}.
7. User can interact via globe (click marker → highlight card) or filter rail (narrow by any facet).
8. Every filter change updates the URL. Card count + sort row updates above the grid. Active filter summary bar appears when any filter is active.
9. User clicks a ReefLocationCard → navigates to `/locations/[slug]`.

### 7.2 Location detail flow

1. Arrive from: Atlas card click, global search result, or direct link.
2. **Hero image:** real underwater photograph borrowed from the location's own dive sites (§5.5a). Renders behind the hero content (breadcrumb, reef-state pill, H1). No bare gradient — the gradient is at most a base layer under the photo.
3. Breadcrumb: "← Atlas" / country.
4. Reef state pill (dot + label) directly below breadcrumb.
5. H1: location name. Metadata row: country · region · best season.
6. Jump nav tabs (Overview / Conditions / Dive sites) — in-page anchor links.
7. **Overview section:**
   - If reef state is Witnessing change: reef science panel (coral cover bars, fishing pressure) renders first, before descriptive copy. Degraded-reef honest label renders (§5.6).
   - Otherwise: description paragraph, optional extended description, then reef science data.
8. **Conditions section:**
   - Good season month grid (12 cells, current month highlighted with `ring-2`).
   - Coral cover panel: two horizontal bars — decade ago and today. Each bar has a `DataFreshnessLabel` (snapshot variant).
   - Fishing pressure panel: labeled level (Low / Moderate / High / Very high) with `DataFreshnessLabel`.
   - Bleaching alert: NOAA CRW current level label with `DataFreshnessLabel` (live variant).
9. **Dive sites section:** grid of SiteCards for all sites at this location. Each card is in-season aware.
10. Species encounters by location (encounter cards — cinematic 21:9 ratio per DESIGN.md).
11. **Gear section** (full — see §4.14): Layer A basic kit for the location (region water temp + skill), then Layer B site-specific add-ons aggregated across the location's sites and grouped by site name (e.g. "Blue Corner — reef hook for strong current"), each group linking down to that site. Gear lives here, not on the dive-site page. Never invents gear absent from site data.
12. **Plan your trip block** (restructured — see §4.13a): logical order with equal weight across booking types — **Getting there leads**, then **what to book** (accommodation and operators as peers). Liveaboard lodging that covers diving is surfaced as a combined "stay + dive" option and suppresses a redundant separate operator. No generic-search CTA button. If reef state is Witnessing change, renders in muted style per §5.6.

### 7.3 Site detail flow

**Two-column model (clarified).** Mockup: [mockups/site-layout-resequence.html](mockups/site-layout-resequence.html). The confusing prior flow mixed marine conditions into the planning sidebar (sidebar ran depth profile → location → thermal conditions → operators, so "conditions" sat between context and booking). Corrected split:
- **Centre column = the dive itself**, read top to bottom: **about this site (first)** → what you'll see → conditions → how to dive. All marine-conditions content (including the thermal/live panel) lives here, in the Conditions section, where conditions belong. Gear is not on the dive-site page — it lives on the location page (§4.14).
- **Right sidebar = orient only**, a short clean narrative: Depth profile (visual orientation) → Part of [location] (geographic context, links up to plan the trip). **No booking on the dive site** — operators and accommodation live on the location page (§4.13a). No conditions content competes in the sidebar. Nothing is rendered in two competing places.

**Centre column order — About leads.** "About this site" is **first**: orient the reader on what the site *is* before listing species and data.
1. Arrive from: SiteCard click, location page sites section, direct link.
2. Breadcrumb: Atlas / Location / Site name.
3. "← Back to [Location]" link below breadcrumb.
4. **Meta badges row:** "Dive site" label · country · depth range · skill level · season status · reef state pill (ml-auto, right-aligned). This is the single source of depth/skill/season meta — not duplicated in the sidebar.
5. H1: site name.
6. Hero image: `h-72 rounded-2xl object-cover`. Always an underwater photograph.
7. **"About this site" (first content section):** description / history — what the site is (the wall, the current-swept corner, any wreck history). Optional briefing note (blue-tinted advisory) and optional reef science stamp (coral cover %, fishing level, links to parent location; only when data exists) sit here.
8. **"What you'll see" section:**
    - Top-right: `DataFreshnessLabel` showing survey method and date.
    - Methodology disclosure (`<details>/<summary>`, "How is this calculated?").
    - Species grid: each card shows photo, common name, scientific name, IUCN badge, reliability label (Year round / Seasonal / Rare), best months chips, and sighting evidence row (confidence dot + record count + radius + last confirmed `<time datetime="...">` element).
    - Sources disclosure: collapsible list of data sources.
    - Photo credits disclosure: collapsible list of iNaturalist attributions.
9. **"Conditions" section:**
    - Season calendar: 12 monthly cells. Current month gets `ring-2` (not color alone).
    - Conditions table: month × (water temp / visibility / current). Current month column is highlighted.
    - Current level chips: color-coded by strength (none / mild / moderate / strong).
    - **Thermal status (NOAA CRW live panel)** — relocated here from the sidebar. DHW + SST anomaly + status label with `DataFreshnessLabel` (live variant). This is conditions content and belongs in the Conditions section.
10. **"How to dive this site" section:** numbered sequence (time arrival → descend & orient → work with current → surface & debrief). This is the last centre-column section — gear is not here; it lives on the location page (§4.14).

**Right sidebar order (orient only):**
- **Depth profile** — depth visualization, min/max labels.
- **Part of [location]** — parent location card, with a "View location & plan your trip →" link to the location page (where getting-there, operators, accommodation, **and gear** live). No operators list and no gear on the site page.

*(Removed: operators / booking from the sidebar — planning is location-page only; the standalone thermal panel — now in Conditions; the duplicate bottom "Planning a trip?" block.)*

### 7.4 Species encounter flow (`/where-to-see/[species]`)

1. Entry point: species name links within the site detail "What you'll see" section, or direct SEO arrival.
2. Route: `/where-to-see/[species]`.
3. **Species hero:** full-width underwater hero image for the species. Ethics note (if applicable). IUCN badge. Best months strip.
4. **Site list:** all sites across the Atlas where the species has confirmed or likely presence, ordered by confidence then recency. Each site renders as a SiteCard with the species sighting row foregrounded.
5. **Filter/sort controls:** filter by region and reef state; sort by confidence (default), recency, or alphabetical.
6. **No sites state:** "No sites with recorded [species name] sightings. Records are updated nightly from iNaturalist." Link to submit an observation.

### 7.5 Species detail flow (`/{location}/{site}/species/[slug]`)

1. Entry point: species card click within a site detail "What you'll see" section.
2. Route: `/{location}/{site}/species/[slug]`.
3. **Species hero:** full-width underwater photo of the species, captioned with iNaturalist attribution.
4. **Breadcrumb:** Atlas / Location / Site / Species name.
5. **Species profile block:** common name (H1), scientific name (italic subtitle), IUCN badge, description paragraph.
6. **At this site:** sighting evidence rows — confidence dot, record count, radius, last confirmed date, iNaturalist observation IDs (linked). DataFreshnessLabel for the sighting data.
7. **Seasonality:** 12-month calendar showing which months have observation records. Current month `ring-2`.
8. **Methodology disclosure:** `<details>/<summary>` — "How confidence is calculated."
9. **Also seen nearby:** up to 3 other sites within the same location where the species has records.
10. **See all [species name] sites:** link to `/where-to-see/[species]`.

### 7.6 Search results flow (`/search?q=`)

1. **Entry:** User presses Enter in the nav search input, or is routed from the dropdown's "See all results" link (if configured).
2. **Layout:** Full page. Results grouped by type (Locations / Sites / Species) with type headers.
3. **Result rendering:** See §4.9 for row layout.
4. **No results:** "No results for '[query]'" + suggestions (§4.9).
5. **Refine:** Search input is pre-populated with the current query. Editing and re-submitting updates results without a page reload.

### 7.7 Cert-level landing flow

Routes: `/for/never-dived`, `/for/open-water`, `/for/advanced`, `/for/rescue`, `/for/divemaster`, `/for/tech`.

These pages filter the Atlas to locations accessible at the given certification level, using the same cumulative skill filter logic as AtlasFilterRail. They serve as SEO entry points and wayfinders — the diver selects their level once and lands on a pre-filtered Atlas view.

### 7.8 Data / methodology flow

Route: `/data`.

The user can arrive from any `DataFreshnessLabel` (all variants link to `/data`). The page explains:
- Live vs snapshot distinction.
- Region baselines and how reef state is classified.
- Data sources table (name, type, update cadence, coverage).
- Methodology for each metric (coral cover, fishing pressure, bleaching alerts, species sightings).

No interactive elements — pure reference content.

---

## 8. Accessibility floor

These behaviors are required on all surfaces:

| Pattern | Requirement |
|---|---|
| Decorative elements | `aria-hidden="true"` on all decorative SVGs, sparkline bars, reef-state dots, and confidence dots |
| Search input | `aria-label="Search reefs"` (or equivalent descriptive label) |
| Globe markers | `aria-label="[location name] — [reef state]"` on each clickable marker |
| Filter checkboxes | `aria-pressed` attribute reflecting checked state |
| Disclosure drawers | Native `<details>/<summary>` — no ARIA workarounds needed |
| Season calendar | Month abbreviations visible as text in each cell; current month highlighted via `ring-2` in addition to any color change (ring is not color-only) |
| Timestamps | Wrap in `<time dateTime="[ISO string]">` for all "last confirmed" and survey date displays |
| Images | `alt` attribute on every `<img>`. Decorative images: `alt=""`. Informative images: meaningful description (site name at minimum) |
| Confidence indicators | Always pair confidence dot with a text label (e.g. "Confirmed," "Likely," or the confidence value). Never dot alone |
| In-season indicator | Pill uses both a filled/empty circle character (● / ○) and text ("In season" / "Off season") — not color alone |
| Links | All links have a visible focus state (browser default or custom `ring-2` focus ring in {colors.brand}) |
| Keyboard navigation | Search dropdown: full arrow key + Enter + Escape support. All interactive elements reachable by Tab in DOM order |
| Color contrast | Text on all surface layers must meet WCAG AA (4.5:1 for small text, 3:1 for large text) against {colors.surface} background |

---

## 9. Key cross-cutting patterns

### 9.1 No modal interruptions

The product never launches a modal to gate content, capture email, or display a disclosure. Every disclosure is inline (`<details>/<summary>`). Every CTA is a standard link or button within the content flow.

### 9.2 Inline vs. sidebar disclosures

All data provenance, methodology, source citations, and photo credits are inline — at the exact point of the claim they qualify. No footnotes, no separate pages for individual disclosures (the `/data` page is a reference, not where disclosures live).

### 9.3 Progressive disclosure hierarchy

1. **Glanceable:** Freshness dot + short label visible by default on every time-sensitive value.
2. **On demand:** `DataFreshnessLabel` pill links to `/data` for deeper context.
3. **In-place:** `<details>/<summary>` drawer expands methodology text and source list at the point of use.
4. **Deep reference:** `/data` page for full methodology, sources table, and update cadences.

### 9.4 URL-driven state

Filter state (AtlasExplorer), page routes, and all navigational state live in the URL. No application state is stored in cookies or localStorage except the FirstVisitBanner dismissal (one-time, non-critical). This means:
- Filtered views are shareable by copying the address bar.
- Refreshing the page restores the same state.
- Server-side rendering can produce correct HTML for any filter combination (SEO-safe).

### 9.5 Affiliate link policy

Affiliate and operator partner links are:
- Rendered via the `AffiliateLink` component.
- Visually distinguishable from editorial links (a "Shop →" / booking affordance, not an inline editorial link).
- Grouped in the "Where to stay" / "Operators" peer groups on location pages (booking is location-page only, §4.13a) and in the Gear section on site pages.
- Never interleaved with data claims or editorial descriptions.
- **Disclosed at the group/section level, not badged per item.** For repeated commercial lists (gear items, operator/lodging rows) a single quiet disclosure line at the foot of the section satisfies "marked, not hidden" — individual rows do not carry an "affiliate" tag.
- Accompanied by the full affiliate disclosure on the About page.

---

## 10. Named user journeys

These journeys describe **intent-driven paths** — a real person with a specific goal moving across multiple pages. They complement the page flows in §7, which describe what renders on each route. These describe *why* someone arrives and *what they need to feel* at the climax.

Design implication for each journey: every surface that appears as a step must be self-orienting. A user arriving cold on `/sites/[slug]` from Google must reach a booking decision without ever visiting the Atlas.

---

### 10.0 — Susan: the casual browser on her phone

**Protagonist:** Susan, 34, open-water certified, casual diver. On her phone, planning a trip for later this year. Wants to discover something remarkable — not filter a database.

**Trigger:** A friend shares a link to scubaseason.fun. Susan taps it, lands on the Atlas home `/` on her phone.

**Journey:**

1. **Homepage — mobile Atlas** — Susan sees the stat strip first: "94 locations tracked across 6 regions." The globe renders below the fold; above it, the how-to-dive steps (§4.13) orient her in 4 numbered sentences. She scrolls past. The filter rail is collapsed — a "Filters" button sits above the card grid.

2. **Browsing without filtering** — Susan does not tap Filters. She scrolls the card grid. Each card: 4:3 hero image (underwater, always), reef state badge, in-season badge. She's drawn to an "In season now" card for Raja Ampat. Reef state: Thriving. She taps it.

3. **Location detail — Raja Ampat** — Reef state pill ("Thriving") is the first thing she reads below the breadcrumb. Coral cover bars: 42% (2014) → 38% (2022). The {colors.reef-states.thriving} teal pill and the "Snapshot · AIMS · surveyed 2022 (4 years ago)" freshness label are both visible without scrolling. Susan doesn't read the methodology — she trusts the tone. She scrolls to dive sites, taps Manta Sandy.

4. **Site detail** — Hero image: mantas in open water. Meta badges: depth 5–28m, Open water+. "What you'll see": manta ray with a filled confidence dot — "Seasonal · Oct–Apr · Last confirmed 3 months ago · 34 records within 12km." The date is a `<time>` element. Susan screenshots the page.

   **Climax beat — success path:** Susan sees the sticky `PlanYourTripBlock`. "Getting there: fly Sorong." Two lodging options. She taps a dive resort affiliate link. New tab opens. She texts her dive buddy the location URL. Session ends with 3 pages, 1 affiliate tap, 1 share.

5. **Failure path A — Witnessing change location:**

   Susan browses to a location showing "Witnessing change" — she taps a card she saw near the Great Barrier Reef. The location detail loads. The reef science panel is at the top (§5.6): coral cover bars show 28% (2014) → 14% (2022). The degraded-reef honest label reads: "This reef is experiencing documented loss. Survey data, depth, and species records are current."

   The `PlanYourTripBlock` renders in muted style: heading reads "Plan thoughtfully" rather than "Book this trip." Operator links are still present. Susan pauses. She reads the coral cover bars. She decides not to book — but she copies the URL and shares it with her dive club with a note: "I had no idea it was this bad."

   **Design intent:** The honest label does not deter all users — it converts the motivated conservationist (Mia) and deters the casual tourist who would have been disappointed. Susan's share is a success state even without an affiliate click. The product told the truth.

6. **Failure path B — species search, no results:**

   Susan taps the search input and types "lionfish." The dropdown shows 0 matching locations (lionfish is a widespread invasive — no Atlas locations are tagged with it specifically). The dropdown does not render.

   Susan presses Enter. She is routed to `/search?q=lionfish`. The results page shows: 0 location matches, 0 site matches, 2 species record matches (presence data only, no site with tagged sightings). The no-results heading reads: "No dive sites with recorded lionfish sightings." Suggestion copy: "Try searching for a location name, a country, or a species commonly associated with a destination (e.g. 'manta ray', 'whale shark')."

   Susan taps the search input and types "manta" instead. The dropdown shows 6 results. She taps Raja Ampat. She's back on track.

   **Design intent:** The search failure is a soft dead-end — it names the problem, gives a plausible next query, and does not abandon the user. The "/search" route always renders something (even if that something is a clear no-results message with direction).

**Critical design requirement:** Susan never filled a filter form. She discovered by browsing. The card grid at default state must be legible and tempting without any filter interaction — reef state badges, in-season badges, and hero images are the primary discovery surface for casual mobile browsers.

---

### 10.1 — Rafa: the species chaser

**Protagonist:** Rafa, 34, Divemaster, 200+ logged dives. Specifically wants whale sharks. Plans 3–6 months in advance. Uses dive forums and Google to research.

**Trigger:** Google search "best time to see whale sharks scuba diving." Lands on `/where-to-see/whale-sharks`.

**Journey:**

1. **Species landing** (`/where-to-see/whale-sharks`) — Hero names the encounter. IucnBadge (when enabled), ethics note, best months strip. Rafa scans the top 6 sites; each SiteCard shows a confidence dot ({colors.evidence-confirmed} coral, filled) and "Last confirmed [relative time]." He needs to see a *date* — not a category — to trust the record.

2. **Decision point — region selection.** Primary regions are listed with reef state pills: {colors.reef-states.thriving} for Thriving, {colors.reef-states.pressure} for Under pressure, {colors.reef-states.change} for Witnessing change. Rafa picks a Thriving region. Clicks through to `/locations/ningaloo`.

3. **Location page** — Reef state pill (Thriving, {colors.reef-states.thriving} teal) appears directly below the breadcrumb — Rafa sees it before reading anything else. Coral cover bars show current vs. decade-ago. Fishing pressure panel. He scrolls to the site grid, clicks `Navy Pier, Exmouth`.

4. **Site detail** — Hero image (underwater, always). Meta badges row: depth range, skill level, season status, reef state. "What you'll see" section: whale shark card — {colors.evidence-confirmed} filled dot, "Seasonal · April–June · Last confirmed [date] · 12 records within 20km." `<time dateTime="...">` element on the date (screen readers read it correctly).

   **Climax beat:** Rafa checks the 12-month conditions grid for April. Water temp 23°C, visibility 15–25m, current: mild. He sees what he needs. He scrolls right — the sticky `PlanYourTripBlock` is already in view. He clicks the Skyscanner affiliate link.

5. **Exit state:** New tab opens on Skyscanner pre-filled for Exmouth. Rafa has his decision and his search open. Session ends with 4+ pages viewed, one affiliate click.

**Critical design requirement:** The confidence dot on the species card must pair with a *specific date* and *record count*, not a category label alone. "12 records" is evidence. "High confidence" is not.

---

### 10.2 — Priya: the new Open Water diver

**Protagonist:** Priya, 26, just certified Open Water last month. Wants a "safe first real trip." Has no gear yet.

**Trigger:** Instagram reel about Maldives diving. Taps a link that opens `/for/open-water`.

**Journey:**

1. **Cert landing page** (`/for/open-water`) — Page immediately frames her experience level back to her (depth limit, training context, safety note with DAN link). She feels seen, not sold to. Location grid shows only Open Water-accessible sites. She browses.

2. **Filter interaction** — Priya taps the month chip for December (her travel window). Grid narrows. She sees "Thriving" badges ({colors.reef-states.thriving} teal) and gravitates toward them.

3. **Decision point — location.** She clicks a Maldives location card. On the ReefLocationCard: 4:3 hero image scales slightly on hover, reef state badge top-left, in-season badge alongside it. She clicks through to `/locations/maldives`.

4. **Location detail** — Season calendar shows December is in-season (cell has {colors.brand} fill). Coral cover shows "Snapshot · AIMS · surveyed 2022 (4 years ago)" — the amber freshness dot signals this is real data with an honest age. She clicks into Banana Reef.

5. **Site detail** — Depth range: 5–18m (reassuring). Skill level pill: "Open water+." "What you'll see": mantas, reef sharks — each with a filled confidence dot. Gear section shows Layer A: BCD, regulator, 3mm shorty (for 28°C water). Layer B: "No reef hook needed — current is mild." Amazon Associates affiliate link on the BCD.

   **Climax beat:** Priya taps the BCD link. New tab opens on Amazon. She also taps the lodging affiliate link for a resort. She doesn't book yet, but she has two tabs open and a specific destination in mind.

6. **Exit state:** 5+ pages, 2 affiliate clicks (gear + lodging). Highest-value affiliate session type — beginner full-kit purchase intent.

**Critical design requirement:** Layer A gear items must visibly adapt to the site's water temperature (wetsuit thickness) and skill level. A 3mm shorty recommendation for 22°C water breaks trust. The gear recommendation must be accurate or it must be absent.

---

### 10.3 — Mia: the conservation reader

**Protagonist:** Mia, 41, Advanced diver, dives 2–3x per year. Cares deeply about reef health. Has read about coral bleaching. Not actively planning a trip.

**Trigger:** Google search "great barrier reef coral bleaching diving." Lands on `/data` or `/faq`.

**Journey:**

1. **Data transparency page** (`/data`) — Mia reads the live vs. snapshot distinction. She trusts the product immediately because it says what it can't see. The `<details>/<summary>` methodology drawers (§4.7) let her go as deep as she wants without the page feeling dense. Progressive disclosure hierarchy (§9.3) is working.

2. **Atlas exploration** — She navigates to `/` (Atlas link in nav). She selects the "Witnessing change" filter ({colors.reef-states.change} in the rail). Globe dims to show only degraded locations. Cards carry the ReefStateBadge in the "witnessing" state.

3. **Location detail — degraded reef** — She clicks a card in the Great Barrier Reef. Reef science panel leads (§5.6, §7.2): coral cover bars — decade ago (28%) and today (14%). The `DataFreshnessLabel` (snapshot variant, amber dot) shows "Snapshot · AIMS LTMP · surveyed 2022 (4 years ago)." Fishing pressure: High. DHW bleaching alert: Watch. Degraded-reef honest label renders. Diving outlook note present.

4. **Site detail** — She reads the reef science stamp (inline banner: coral cover 14%, fishing level high, links to parent location). "What you'll see" section: some species show {colors.evidence-uncertain} outlined ghost dots — rare, uncertain, historical records only. She notices the honest framing and trusts it.

   **Climax beat:** Mia copies the location page URL and shares it in her dive club WhatsApp group with a note about the data. She hasn't booked anything. This is a success — she's an organic acquisition channel.

5. **Exit state:** `/data` → Atlas → location → site. No affiliate click expected. Value: social share, return visit, grant reviewer credibility pathway.

**Critical design requirement:** The "Witnessing change" state must never be softened visually. The {colors.reef-states.change} value is intentionally more alarming than Thriving — the reef is in loss, and the color should reflect that. Do not apply hover lifts or cheerful animations to witnessing-change cards (§4.3 and §5.6).

---

### 10.4 — James: the returning diver

**Protagonist:** James, 38, AOW, hasn't dived in 3 years. Wants "somewhere easy to shake the rust off." Planning a January trip.

**Trigger:** Direct URL from a friend. Lands on the Atlas home `/`.

**Journey:**

1. **Atlas home** — Globe auto-rotates. James sees the filter rail. He clicks "Advanced" in the Certification facet (cumulative — shows all AOW-appropriate and below). He clicks "January" in the Month facet. The URL updates; the globe and card grid re-filter live.

2. **First-visit banner** (if built — OQ-4) — The inline banner between the filter bar and globe: "Tell us your dive level — we'll tailor sites & gear." James selects "Advanced Open Water" + "2+ years ago." The banner dismisses; `localStorage.diverProfile` is set. Filter rail pre-fills to match.

3. **Location card scanning** — Cards show in-season badge, reef state, survey freshness dot. James gravitates toward Thriving ({colors.reef-states.thriving} teal) locations in Asia for January.

4. **Location detail** — Good season grid: January cell is highlighted. Conditions summary shows water temp, visibility. He reads the dive style copy ("relaxed drift with strong thermoclines — ideal for a refresher").

5. **Site detail** — Depth range within AOW limits. "What you'll see" section has well-documented species with filled confidence dots. Gear section Layer A: "5mm wetsuit, BCD, computer" — correct for Advanced.

   **Climax beat:** He clicks an operator affiliate link that has the note "refresh course available." New tab opens.

6. **Exit state:** 4+ pages, operator affiliate click. If the first-visit banner is not built, the journey still works — the cert filter achieves the same result, just with more friction.

**Critical design requirement:** The "cumulative cert filter" behavior (§4.2 — selecting Advanced shows Beginner + OW + Advanced sites) must be clearly communicated to the user at the filter UI level. A tooltip or inline label — "Shows all sites accessible at this level or below" — prevents confusion.

---

### 10.5 — Alex: the cold SEO arrival

**Protagonist:** Alex, any cert, Googles "best time to dive Komodo" and lands directly on `/sites/batu-bolong`. Has never seen the Atlas. No prior context.

**Trigger:** Google organic result. Lands cold on a site detail page.

**Journey:**

1. **Cold landing — site detail** — Alex has no context about the product. The page must orient them in 3 seconds. The hero strip delivers: site name (4xl, bold), location breadcrumb ("Komodo, Indonesia"), reef state badge (ReefStateBadge), in-season badge. The hero image is underwater (always — enforced by `underwaterPhotoUrl()` utility).

2. **Search intent resolved** — Alex's query was "best time to dive Komodo." The 12-month conditions grid (§7.3 step 11) answers this immediately — the current month column has `ring-2`, and the best months strip shows which months are peak season.

3. **Species curiosity** — "What you'll see" section is the second thing Alex reads. Bumphead parrotfish: {colors.evidence-confirmed} filled dot, "Year round · Last confirmed [date] · 8 records within 15km." Manta ray: {colors.evidence-likely} outlined ring — "Seasonal · April–October."

4. **Decision point — plan or bounce?** The sticky `PlanYourTripBlock` is visible in the right column the entire time Alex has been reading. Getting there (Labuan Bajo hub), two lodging options, two dive operators. Alex hasn't had to scroll to find this — it followed them down the page.

   **Climax beat:** Alex clicks a lodging affiliate link. This is a cold-to-conversion without ever visiting the Atlas.

5. **Related sites** — At the bottom of the page, "Related Sites" shows 3 nearby Komodo sites. Alex clicks one — now they're in the product, not just on one page.

6. **Exit state:** 2+ pages (cold single-page → related site click is a win), 1 affiliate click. This is the highest-volume acquisition path — SEO rankings on site + species queries drive the majority of new visitors.

**Critical design requirement:** The site detail page is the product's front door for most users. Every section must make sense without the Atlas. The breadcrumb ("Atlas / Indonesia / Komodo / Batu Bolong") is navigational context, not required for comprehension. The `PlanYourTripBlock` must be sticky before the user reaches the conditions grid — the booking call to action must never require scrolling to find.
