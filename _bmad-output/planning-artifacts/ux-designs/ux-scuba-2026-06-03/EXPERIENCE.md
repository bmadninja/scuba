---
title: scubaSeason.Fun — Experience
status: draft
created: 2026-06-03
updated: 2026-06-03
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
/                          Home — Atlas Explorer (globe + filter + location cards)
/locations/[slug]          Location detail (reef science, sites, species, planning)
/sites                     Sites catalogue (search + filter)
/sites/[slug]              Site detail (briefing, species, conditions, planning)
/where-to-see/[species]    Species encounter page (cross-site evidence)
/for/[cert]                Cert-level landing pages (never-dived → tech)
/data                      Data methodology + transparency index
/about                     About + affiliate disclosure + roadmap
/faq                       FAQ (metric calculation explanations)
```

### 2.2 Conceptual hierarchy

The mental model is: **Location → Site → Species.** A location is a reef system or dive area (e.g. Tubbataha, Raja Ampat). A site is a specific dive within that location (e.g. Bird Rock). A species is a creature that may be sighted at one or more sites.

The Atlas Explorer operates at the Location level. The Sites catalogue operates at the Site level. Where-to-see pages invert the hierarchy: start from a species, arrive at sites.

### 2.3 Navigation

**AtlasNav** is the only global navigation surface. It is sticky at the top of every page.

- Logo: `scubaSeason.Fun` — the `.fun` segment renders in {colors.brand-ocean}. Clicks go to `/`.
- Three primary nav links: **Atlas** (`/`), **Method** (`/data`), **About** (`/about`).
- Active state: {colors.brand-ocean} text. No underline, no background, no heavy indicator — the active link is distinguished by color alone.
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
**Result rows:** Each row shows the location name, country, and a reef-state pill ({colors.reef-thriving/pressure/witnessing} background).
**Keyboard behavior:**
- `ArrowDown` / `ArrowUp` move the selection cursor through results; the cursor wraps at ends.
- `Enter` navigates to `/locations/[slug]` for the selected result.
- `Escape` closes the dropdown and clears focus.
**Mouse behavior:** Click on a result navigates to that location. Click outside the search widget (detected via `mousedown` on `document`) closes the dropdown.
**Close behavior:** Input clears on navigation (`setQ("")`). Dropdown closes on Escape, outside click, or successful navigation.
**Empty query:** Dropdown does not open; no results shown.
**No results:** Dropdown does not render (no "no results" state in the search widget — the filter rail handles that at the explorer level).

### 4.2 AtlasFilterRail

Left column of the AtlasExplorer grid (`grid lg:grid-cols-[260px_1fr]`). Always visible on desktop. Behavior on mobile not specified in codebase — assume collapsed/drawer pattern follows DESIGN.md FilterBar spec.

**Filter groups:**
1. **Reef state** — three checkboxes: Thriving / Under pressure / Witnessing change. All three on by default. Toggling removes that reef state from results. Unchecking all three produces a no-results state.
2. **Certification** — four checkboxes: Beginner / Open water / Advanced / Technical. **Cumulative filter:** selecting "Advanced" shows all locations accessible to Advanced or less skilled divers (Beginner + Open water + Advanced). This matches how divers plan — you select your ceiling, not an exact level.
3. **Region** — five checkboxes by continent order: Asia / Oceania / Indian Ocean / Americas / Atlantic & Mediterranean.
4. **Month** — twelve checkboxes Jan–Dec. Filters to locations where that month is within `bestMonths`. Multiple months are OR logic (show locations in season for any selected month).
5. **Thermal stress** — four checkboxes: No stress / Watch / Elevated / Heat alert. Maps to `heatLevel` integer buckets (0 / 1 / 2 / ≥3).
6. **Wildlife** — six checkboxes: Sharks / Mantas / Turtles / Whales / Dolphins / Dugongs. Filters on `animalTags`.
7. **Fresh eyes only** — single toggle. When on, shows only locations where `lastSurveyDays` is null (unknown) or high (stale/cold). Used to find reefs that need new survey data.

**Sort options** (rendered as a select or segmented control at the top of the card grid):
- Best season (default)
- Oldest surveys first
- Highest thermal stress
- Name

**URL sync:** All filter state is persisted to the querystring on every change using `router.replace` (no full navigation). Parameters: `c` (conditions), `m` (months), `s` (skill), `r` (region), `h` (heat), `a` (animals), `fresh` (fresh-only toggle), `sort`. Default values are omitted from the URL.

**Active filter chips:** When any non-default filter is active, chips render in the results header area showing each active filter value. Each chip has an × dismiss button that removes only that value. A "Reset all filters" text link resets to defaults.

**No-results state:** When filtered results are empty, show:
1. A summary of which filters are active (as chips with individual remove buttons).
2. A "Reset all filters" link.
3. No card grid, no empty-state illustration.

### 4.3 ReefLocationCard

Destination-level card. Links to `/locations/[slug]`.

**Layout:** Stack — 4:3 hero image, then body content.

**Image area:**
- 4:3 aspect ratio, `object-cover`, full card width.
- Top-left overlay: reef state badge + "In season now" badge (if `inSeason === true`). Both are pill-shaped with ring-inset border.
- Bottom-right overlay: skill badge (Beginner / Open water / Advanced / Technical), same pill style.
- Image scales to `scale(1.02)` on card hover (500ms transition).

**Body:**
- Location name: `text-base font-semibold`, transitions to {colors.brand-ocean} on hover.
- Country: `text-sm`, {colors.text-muted}.
- Hook: 2-line clamp, `text-sm leading-6`.
- **Freshness line** (below a thin divider): two dot + label pairs at `text-[11px]`.
  - Thermal dot: always green (`#15a05c`) + "Thermal: today" — thermal data is always from the nightly sync.
  - Survey dot: color computed from `lastSurveyDays` via `freshness()` — green (<365d), amber (1–3y), red (>3y), red if null. Label: "Last eyes underwater: [year]" or "Last eyes underwater: unknown".
- Coral cover and best season stats render below the freshness line (exact layout per DESIGN.md).

**Hover state:** Card lifts 3px (`-translate-y-[3px]`), border transitions to {colors.brand-ocean}/40, shadow increases.

**Globe-selection state:** When the corresponding globe marker is clicked, the card receives `ring-2 ring-[#0089de] ring-offset-2`. This is the only way a card can appear "selected" — there is no persistent selection state.

### 4.4 SiteCard

Site-level card. Links to `/sites/[slug]`.

**Layout:** Image (fixed `h-44`) + body.

**Image area:** Fixed height, `object-cover`, scales `1.02` on hover.

**Body:**
- Country (uppercase, tracking-wider, muted) + in-season pill, inline row.
- In-season pill: "● In season" (emerald) or "○ Off season" (slate). Color and fill both change — not color alone.
- Site name: `text-lg font-bold`, transitions to {colors.brand-ocean} on hover.
- Description: 2-line clamp.
- **Headline sighting row:** confidence dot + species common name (bold) + "· last confirmed [relative time]". If no sighting data: muted dot + "Sighting evidence pending." Never blank — always shows a state.
- **Chip row:** depth range chip, skill level chip (with `+` suffix to indicate "this level or above"), and up to one dive-type chip. Chips are `rounded-full` pill style.

**Hover state:** Border transitions to {colors.brand-ocean}/40, shadow appears.

### 4.5 DataFreshnessLabel

Pill component used wherever a data claim needs a provenance label. Always links to `/data` for full methodology.

**Three variants:**
1. **Live** — green dot + "Live · [source] · updated [date]". Used for NOAA CRW thermal data. Source defaults to "NOAA CRW." The dot renders in `bg-emerald-500`.
2. **Snapshot** — amber dot + "Snapshot · [method] · surveyed [date]". When the survey is >2 years old, appends "(N years ago)". The dot renders in `bg-amber-500`.
3. **Presence** — slate dot + "Presence data · [source] · no population trend." Used for GBIF/OBIS occurrence records with no trend data.

All variants render at `text-[10.5px] font-semibold uppercase tracking-[0.1em]`. The entire pill is a link — clicking navigates to `/data`.

### 4.6 IucnBadge

Inline badge on species cards. Renders the IUCN Red List status abbreviation (LC, NT, VU, EN, CR, EW, EX, DD). Flat, no elevation — consistent with {components.ReefStateBadge} flatness rule.

### 4.7 Methodology disclosure (details/summary)

Used wherever a data claim needs explanation. Implemented as a native HTML `<details>/<summary>` element.

- Summary row: info circle icon (lucide:info, 14px, {colors.text-muted}) + short label (e.g. "How is this calculated?").
- Expanded: full methodology text + source list.
- No animation required — native browser disclosure behavior.
- Never modal. Always inline at the point of the claim.

### 4.8 AffiliateLink

Wraps any commercial partner link. Behavior: renders as an external link with a visible disclosure marker. The affiliate disclosure is stated on the About page; individual links do not duplicate the full disclosure text.

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
| Coral cover | No records | Panel not rendered; no empty bar |
| Sighting evidence | No `sightings` records for site | "Sighting evidence pending" chip on SiteCard; no species section on site detail |
| Last survey | `lastSurveyDays` null | "Last eyes underwater: unknown" with red freshness dot |
| Fishing pressure | `fishingPressure === "unknown"` | Reef science stamp not rendered on site detail |

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
- Site/location name transitions to {colors.brand-ocean}.
- Card border transitions to {colors.brand-ocean}/40.
- Card or image has a subtle lift/scale (see §4.3 and §4.4).
- Transition duration: 200–500ms depending on property.

### 6.4 External link behavior

Affiliate links and partner links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`). Internal navigation never opens a new tab.

### 6.5 Disclosure drawers

All methodology and source disclosures use `<details>/<summary>`. No JavaScript required. Toggle is handled by the browser. No animation. The disclosure does not affect surrounding layout when open — it expands inline.

---

## 7. Page flows

### 7.1 Home — Atlas Explorer flow

1. User lands on `/`.
2. Above the fold: hero area with stat row (reef count, source count, update cadence) and a brief product hook.
3. Below: `AtlasExplorer` fills the viewport — globe left, filter rail left, card grid right.
4. Default state: all reef states active, no month/skill/region/wildlife filters, sorted by best season.
5. Globe auto-rotates at low speed. Markers are colored by reef state ({colors.reef-thriving/pressure/witnessing}).
6. User can interact via globe (click marker → highlight card) or filter rail (narrow by any facet).
7. Every filter change updates the URL. Card count + sort row updates above the grid.
8. User clicks a ReefLocationCard → navigates to `/locations/[slug]`.

### 7.2 Location detail flow

1. Arrive from: Atlas card click, global search result, or direct link.
2. Breadcrumb: "← Atlas" / country.
3. Reef state pill (dot + label) directly below breadcrumb.
4. H1: location name. Metadata row: country · region · best season.
5. Jump nav tabs (Overview / Conditions / Dive sites) — in-page anchor links.
6. **Overview section:** description paragraph, optional extended description.
7. **Conditions section:**
   - Good season month grid (12 cells, current month highlighted with `ring-2`).
   - Coral cover panel: two horizontal bars — decade ago and today. Each bar has a `DataFreshnessLabel` (snapshot variant).
   - Fishing pressure panel: labeled level (Low / Moderate / High / Very high) with `DataFreshnessLabel`.
   - Bleaching alert: NOAA CRW current level label with `DataFreshnessLabel` (live variant).
8. **Dive sites section:** grid of SiteCards for all sites at this location. Each card is in-season aware.
9. Species encounters by location (encounter cards — cinematic 21:9 ratio per DESIGN.md).
10. Operators / lodging / gear: affiliate links, clearly labeled.
11. Planning block: `getThere` text, conditions summary.

### 7.3 Site detail flow

1. Arrive from: SiteCard click, location page sites section, direct link.
2. Breadcrumb: Atlas / Location / Site name.
3. "← Back to [Location]" link below breadcrumb.
4. **Meta badges row:** "Dive site" label · country · depth range · skill level · season status · reef state pill (ml-auto, right-aligned).
5. H1: site name.
6. Hero image: `h-72 rounded-2xl object-cover`. Always an underwater photograph.
7. Description paragraph.
8. Optional briefing note: blue-tinted panel with site-specific diver advisory.
9. Optional reef science stamp: inline banner showing coral cover %, fishing level. Links to the parent location page. Only rendered when `coralCover` or `fishingPressure` data exists.
10. **"What you'll see" section:**
    - Top-right: `DataFreshnessLabel` showing survey method and date.
    - Methodology disclosure (`<details>/<summary>`, "How is this calculated?").
    - Species grid: each card shows photo, common name, scientific name, IUCN badge, reliability label (Year round / Seasonal / Rare), best months chips, and sighting evidence row (confidence dot + record count + radius + last confirmed `<time datetime="...">` element).
    - Sources disclosure: collapsible list of data sources.
    - Photo credits disclosure: collapsible list of iNaturalist attributions.
11. **"Conditions" section:**
    - Season calendar: 12 monthly cells. Current month gets `ring-2` (not color alone).
    - Conditions table: month × (water temp / visibility / current). Current month column is highlighted.
    - Current level chips: color-coded by strength (none / mild / moderate / strong).
12. **"Gear & planning" section:**
    - Site-specific gear list.
    - Wreck details (if applicable).
    - "Book this trip" CTA card: routes to parent location page (`/locations/[slug]`).
13. Duplicate "Planning a trip?" inline block at bottom: also routes to location page.

### 7.4 Species encounter flow

1. Entry point: species name links within the site detail "What you'll see" section.
2. Route: `/where-to-see/[species]`.
3. Content: all sites across the Atlas where the species has confirmed or likely presence, ordered by confidence then recency.
4. Each result links to the relevant `/sites/[slug]`.

### 7.5 Cert-level landing flow

Routes: `/for/never-dived`, `/for/open-water`, `/for/advanced`, `/for/rescue`, `/for/divemaster`, `/for/tech`.

These pages filter the Atlas to locations accessible at the given certification level, using the same cumulative skill filter logic as AtlasFilterRail. They serve as SEO entry points and wayfinders — the diver selects their level once and lands on a pre-filtered Atlas view.

### 7.6 Data / methodology flow

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
| Links | All links have a visible focus state (browser default or custom `ring-2` focus ring in {colors.brand-ocean}) |
| Keyboard navigation | Search dropdown: full arrow key + Enter + Escape support. All interactive elements reachable by Tab in DOM order |
| Color contrast | Text on all surface layers must meet WCAG AA (4.5:1 for small text, 3:1 for large text) against {colors.surface-base} and {colors.surface-card} |

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
- Visually distinguishable from editorial links.
- Grouped in "Operators" / "Lodging" sections on location pages and in the "Gear & planning" / "Book this trip" sections on site pages.
- Never interleaved with data claims or editorial descriptions.
- Accompanied by the full affiliate disclosure on the About page.
