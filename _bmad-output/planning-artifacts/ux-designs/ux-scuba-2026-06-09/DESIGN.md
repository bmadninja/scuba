---
# scubaSeason.fun — Design System (Reef Atlas Redesign)
# Google Labs DESIGN.md format

meta:
  product: scubaSeason.fun
  tagline: A free, public reef atlas — science backed, honestly labelled, free to read
  ui_framework: shadcn/ui base-nova + Tailwind v4
  icon_library: lucide
  mode: light-first
  status: final
  updated: 2026-06-09
  inherits: ../ux-scuba-2026-06-03/DESIGN.md
  note: >
    This is an UPDATE run, not a replacement. Every token, component, and rule
    in ../ux-scuba-2026-06-03/DESIGN.md remains in force unless restated here.
    This file documents the redesigned reef-atlas surfaces (single-page homepage,
    slim location page, dive-site page, species list, method page) and the new
    cross-cutting patterns (collapsible filter rail, Cards/Map toggle, place-only
    reef cards, desktop-only 3D globe, info-popup pattern). Where this file and the
    inherited file conflict on a redesigned surface, THIS file wins; everywhere
    else the inherited spine stands.

colors:
  brand:
    primary: "#0089de"          # CTA, links, active states, eyebrows, filter checked state
    dark: "#1d5d90"             # text on brand tints (AA), secondary depth
    hover: "#007bc7"            # brand link/button hover
    ink: "#0b1e32"              # footer, globe panel, dark sections
    ink_text: "#0f172a"         # slate-900 — headings, card titles
  surfaces:
    page: "#ffffff"
    muted: "#f1f7fb"            # filter chips off-state, view-toggle track, light info blocks
    card: "#ffffff"
    footer: "#081626"           # redesign footer ink (slightly deeper than legacy #0b1e32)
    globe_panel: "#0b1e32"      # dark inset that holds the Map-view globe
  text:
    primary: "#0f172a"
    body: "#334155"
    secondary: "#475569"
    muted: "#64748b"
    dimmed: "#94a3b8"
  borders:
    default: "#e2e8f0"          # slate-200 — section dividers, filter section tops, cards
    strong: "#cbd5e1"
    muted: "#f1f5f9"
  reef_states:                  # carried forward unchanged from inherited system
    thriving:
      swatch: "#10b981"         # emerald — globe dot, filter dot
      pill_bg_light: "#e7f6ee"  # popup tag bg
      pill_text_light: "#15824c"
      card_pill_text: "#6ee7b7" # on dark photo overlay
      card_pill_border: "rgba(110,231,183,0.45)"
    pressure:
      swatch: "#2f6ced"         # blue — NOT amber (deliberate, see Brand & Style)
      pill_bg_light: "#eaf1fe"
      pill_text_light: "#1f57c8"
      card_pill_text: "#93c5fd"
      card_pill_border: "rgba(147,197,253,0.45)"
    change:
      swatch: "#f43f5e"         # rose
      pill_bg_light: "#fdecec"
      pill_text_light: "#c0392f"
      card_pill_text: "#fca5a5"
      card_pill_border: "rgba(252,165,165,0.45)"
  card_overlay_pills:           # pills rendered ON the dark photo gradient of a reef card
    glass_bg: "rgba(8,20,34,0.3)"
    glass_blur: "blur(6px)"
    season_text: "#6ee7b7"
    season_dot: "#34d399"
    eyes_text: "#fcd34d"        # "needs fresh eyes" / evidence-gap accent
    eyes_border: "rgba(252,211,77,0.45)"
    tag_text: "rgba(255,255,255,0.72)"
    tag_border: "rgba(255,255,255,0.24)"
  live_dot:
    color: "#34d399"            # on dark hero
    color_light: "#15a05c"      # on light surfaces
    eyebrow_text: "#86efac"     # "● Live data" eyebrow on the dark hero photo

typography:
  fonts:
    sans:
      family: "Noto Sans"
      weights: [300, 400, 500, 600, 700, 800, 900]
      role: All UI text. 300 = wordmark "scuba" line; 900 = wordmark "Season.fun" line.
    mono:
      family: "IBM Plex Mono"
      weights: [400, 500]
      role: Eyebrows, source labels, uppercase meta, filter section headers, breadcrumbs.
    serif:
      family: "Source Serif 4"
      weights: [400, 600]
      role: Editorial intro / lead paragraphs on location pages. Loaded; available.
  scale:
    h1_hero:
      css: "font-size:clamp(2.2rem,4.5vw,3.4rem); font-weight:800; letter-spacing:-0.035em; line-height:1.03; color:#fff"
      use: Homepage hero headline (on the dark photo).
    h1_page:
      classes: "text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
      use: Location / dive-site / species / method H1.
    h2_section:
      classes: "text-2xl font-bold tracking-tight text-slate-900"
      use: In-page section headings (Reef condition, What you'll see, Dive sites, Method sections).
    results_h2:
      css: "font-size:1.1rem; font-weight:800; letter-spacing:-0.02em; color:#0f172a"
      use: "N reefs" count above the atlas grid.
    eyebrow_brand:
      classes: "text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]"
    eyebrow_slate:
      classes: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
    filter_section_head:
      css: "font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b"
      use: Collapsible filter rail section summaries (When / What to see / Region / Reef state / Evidence gaps / Certification level).
    hero_sub:
      css: "font-size:1.0625rem; line-height:1.55; color:rgba(255,255,255,0.85)"
      use: Homepage hero subline.
    lead_serif:
      css: "font-family:'Source Serif 4',serif; font-size:1.0625rem; line-height:1.8; color:#334155; max-width:640px"
      use: Location page editorial intro paragraph (opens the page).
    body:
      classes: "text-base leading-7 text-slate-700"
    body_small:
      classes: "text-sm leading-6 text-slate-700"
    card_name_on_photo:
      css: "font-size:0.9375rem; font-weight:800; color:#fff; letter-spacing:-0.01em; text-shadow:0 1px 12px rgba(4,18,32,0.4)"
    card_eyebrow_on_photo:
      css: "font-size:0.5625rem; font-weight:700; letter-spacing:0.13em; text-transform:uppercase; color:rgba(255,255,255,0.6)"

rounded:
  card: "1rem"                  # reef cards (redesign); rounded-2xl elsewhere per inherited spine
  panel: "rounded-2xl"          # filter rail context, info blocks, sticky trip card
  globe_panel: "1.2rem"
  pill: "999px"                 # all pills, chips, toggle, filter leaf tags, view toggle
  filter_check_box: "5px"      # checkbox square in filter rail
  month_cell: "0.5rem"
  modal: "1.25rem"             # info popup container
  info_btn: "50%"              # the (i) circle

spacing:
  containers:
    page_wrap: "max-width:1320px; padding:0 3rem"   # nav, hero content, stage, footer
    page_wrap_mobile: "padding:0 1.25rem"
  homepage_stage:
    grid: "grid-template-columns:300px 1fr; gap:2.5rem; align-items:start"
    padding: "2.5rem 3rem 4rem"
    note: "Filter rail = 300px sticky column; results = 1fr."
  filter_rail:
    sticky: "position:sticky; top:78px; max-height:calc(100vh - 96px); overflow:auto"
  results_grid:
    grid: "grid-template-columns:repeat(3,1fr); gap:1rem"
  reef_card:
    height: "175px"            # fixed-height place card (photo fills it)

elevation:
  reef_card_default:
    note: "Flat — the photo + dark gradient overlay IS the card. No drop shadow at rest."
  reef_card_hover:
    transform: "translateY(-3px)"
    shadow: "0 16px 34px -14px rgba(4,18,32,0.45)"
  view_toggle_active:
    shadow: "0 1px 3px rgba(15,23,42,0.14)"   # white active segment lifts off the muted track
  info_popup:
    backdrop: "rgba(8,15,30,0.5); backdrop-filter:blur(2px)"
    modal_shadow: "0 24px 64px -16px rgba(0,0,0,0.4)"
  product_cards:
    note: "Location/dive-site/method content cards keep the inherited rgba(16,40,70) shadow formula."

---

## Brand & Style

scubaSeason.fun is a **free, public reef atlas** — a research instrument for divers, presented so a person with zero science background reads it like a map, not a journal. The aesthetic is unchanged from the inherited system: clean white surfaces, a cool blue brand palette, editorial restraint, real underwater photography, no gradients in UI chrome. Light mode only.

This redesign sharpens one thing: **clarity for a non scientist**. It does that through five moves, applied across every surface:

1. **One job per page, one primary action.** The homepage finds a reef. The location page leads to one trip. The method page explains. Nothing competes.
2. **Aggressive dedupe.** If a fact appears in the hero pill, it does not reappear in a stat strip, a sidebar, and the body. Every fact lives in exactly one place.
3. **Plain language, no jargon.** "Visibility," not "vis." "Warmer than usual," not "DHW Watch." "Near its natural baseline," not "healthy." Spelled-out IUCN tiers, not codes.
4. **Info popups, never page jumps.** In place explanations (reef state, your chances, IUCN, heat, fishing) open a small popup over the page. A link that *leaves* to the Method page always names it in the link text ("…on the Method page →"). Never bounce the reader silently.
5. **Live data, no staleness theater.** No "updated 3 days ago" timestamps anywhere. The data is live; we say so once with a "● Live data" eyebrow and move on. Species sightings are now ingested live, so "recently logged / last seen" copy is honest.

**Three semantic colors anchor reef meaning** (unchanged): emerald `#10b981` = Thriving, blue `#2f6ced` = Under pressure, rose `#f43f5e` = Witnessing change. **Under pressure is blue, never amber** — blue reads as ocean caution without the fire-alarm of orange. Amber is reserved for the "needs fresh eyes" evidence-gap accent and IUCN Vulnerable.

**Dark photo hero.** The homepage opens with a full-bleed underwater photograph (`min-height:56vh`) under a top-to-bottom dark gradient for legibility. Hero content (eyebrow, H1, subline) pins to the bottom band. Below the hero, the page is white.

---

## Colors

### Brand palette

| Token | Hex | Usage |
|---|---|---|
| Primary | `#0089de` | CTAs, links, eyebrows, filter checked box, reset links, (i) hover |
| Dark | `#1d5d90` | Text on brand tints (AA-safe), month chip active text |
| Hover | `#007bc7` | Link/button hover |
| Ink | `#0b1e32` | Globe (Map view) panel |
| Footer ink | `#081626` | Footer background (redesign) |
| Text ink | `#0f172a` | Headings, card titles |

### Reef-state colors (carried forward, unchanged)

| State | Swatch (globe/filter dot) | Light popup bg | Light popup text | Card pill text (on dark photo) |
|---|---|---|---|---|
| Thriving | `#10b981` | `#e7f6ee` | `#15824c` | `#6ee7b7` |
| Under pressure | `#2f6ced` | `#eaf1fe` | `#1f57c8` | `#93c5fd` |
| Witnessing change | `#f43f5e` | `#fdecec` | `#c0392f` | `#fca5a5` |

The three reef states render as **state pills only** (cards, hero, popup). The redesign **removed reef state as a filter input** — see Components → Filter rail. State is an output you read, not a control you set.

### Card overlay pills (on the dark reef-card photo)

Pills sitting on a reef card's photo use a frosted-glass treatment so they stay legible on any image: `background: rgba(8,20,34,0.3); backdrop-filter: blur(6px)`, colored text + translucent border per type. Used sparingly — see "ghost pills only where needed" in Components.

| Pill | Text | Border |
|---|---|---|
| In season | `#6ee7b7` (with `#34d399` dot) | `rgba(110,231,183,0.45)` |
| Needs fresh eyes | `#fcd34d` | `rgba(252,211,77,0.45)` |
| Animal tag | `rgba(255,255,255,0.72)` | `rgba(255,255,255,0.24)` |

### Live-data accent

| Context | Color |
|---|---|
| "● Live data" eyebrow on dark hero | text `#86efac`, dot `#34d399` (pulses) |
| Live dot on light surfaces | `#15a05c` |

### Filter rail control colors

| Control | Off | On |
|---|---|---|
| Checkbox (region, reef state, evidence, cert) | box border `#cbd5e1` | box `#0089de` + white check; reef-state row tint `#eef4ff` |
| Month cell | bg `#f1f7fb`, text `#64748b` | bg `#e8f0fe`, text `#1d5d90`, border `rgba(47,108,237,0.3)`; current month = `outline:2px solid #0089de` |
| Taxonomy leaf tag | white, border `#e2e8f0`, text `#334155` | bg `#0f172a`, white text |
| Endangered toggle | track `#cbd5e1` | track `#f43f5e` (change rose) |
| Cert chip | white, border `#e2e8f0` | bg `#0089de`, white |

---

## Typography

Three families, all Noto Sans at runtime except where Source Serif 4 is explicitly used for the location editorial intro.

- **Hero H1** — `clamp(2.2rem,4.5vw,3.4rem)`, weight 800, `letter-spacing:-0.035em`, line-height 1.03, white with `text-shadow:0 2px 24px rgba(4,18,32,0.4)` for legibility on photo. Max-width 720px.
- **Page H1** (location/dive-site/species/method) — `text-4xl font-bold tracking-tight sm:text-5xl`, slate-900.
- **Section H2** — `text-2xl font-bold tracking-tight`, slate-900. Exactly one heading per concept: "Reef condition," "What you'll see," "Dive sites" — never two headings for the same thing.
- **Filter section header** — `0.72rem / 700 / tracking 0.08em / uppercase / slate-500`, rendered as the `<summary>` of a collapsible `<details>`.
- **Editorial intro (location only)** — Source Serif 4, `1.0625rem / line-height 1.8 / slate-700 / max-width 640px`. Opens the location page before the data.
- **Reef-card name** — `0.9375rem / 800 / white`, on the photo's dark bottom band.

Eyebrows: brand blue (`#0089de`) for content labels, slate-500 for neutral section labels — both `uppercase tracking-[0.18em]`.

---

## Layout & Spacing

### Global frame
`max-width:1320px; padding:0 3rem` for nav, hero content, the homepage stage, and footer. Mobile drops to `1.25rem` horizontal padding.

### Homepage — single page, two zones
The homepage is **one page**, not a landing → results pair. (The two-page picker→results flow was rejected as bad UX.)

1. **Hero zone** — full-bleed photo, `min-height:56vh`, content pinned bottom: "● Live data" eyebrow, H1, subline. No filters, no stats in the hero.
2. **Stage zone** — `grid-template-columns:300px 1fr; gap:2.5rem`. Left = sticky collapsible filter rail (`sticky; top:78px; max-height:calc(100vh-96px); overflow:auto`). Right = results header (count + sort note + Cards/Map toggle) over the reef grid (or the globe panel in Map view).

**Responsive:**
- `≤1000px` — rail un-sticks and stacks above results; reef grid → 2 columns.
- `≤680px` — reef grid → 1 column; all frame padding → 1.25rem.

### Reef results grid
`repeat(3,1fr); gap:1rem` desktop; cards are fixed-height (175px) place cards. In-season reefs first, then a `Great at other times of year` divider, then the rest.

### Location / dive-site body
Two-column `body-grid` (carried from inherited spine): centre = the reef/dive itself, right = orient/plan. Single source for each fact; no stat strip.

---

## Elevation

| Element | Rest | Active / Hover |
|---|---|---|
| Reef card | Flat — photo + gradient is the card surface | `translateY(-3px)` + `0 16px 34px -14px rgba(4,18,32,0.45)` |
| View toggle (Cards/Map) | Track `#f1f7fb`, segments flat | Active segment white + `0 1px 3px rgba(15,23,42,0.14)` |
| Info popup | — | Modal `0 24px 64px -16px rgba(0,0,0,0.4)` over `rgba(8,15,30,0.5)` blurred backdrop |
| Content cards (location, dive-site, method) | inherited `rgba(16,40,70)` formula | inherited hover formula |
| Sticky trip card (location) | inherited card shadow | — |

Witnessing-change reef cards do **not** receive the hover lift (the reef is fading; the interaction reflects that) — carried from inherited spine.

---

## Shapes

| Usage | Radius |
|---|---|
| Reef result card | `1rem` |
| Filter rail / info block / sticky trip card / content cards | `rounded-2xl` (~18px) |
| Globe (Map) panel | `1.2rem` |
| Info popup modal | `1.25rem` |
| All pills, chips, view toggle, taxonomy leaf tags, season pill | `999px` |
| Filter checkbox square | `5px` |
| Month cell | `0.5rem` |
| (i) info button | `50%` (circle) |

Inherited rule holds: `rounded-2xl` is the structural container radius; the only place the redesign drops to `1rem` is the photo-forward reef card, where the tighter radius reads as a map tile.

---

## Components

### AtlasNav (redesign)
Sticky, `rgba(255,255,255,0.95) + backdrop-blur(12px)`, bottom hairline. Logo (wave mark + stacked 300/900 wordmark) at left → scrolls to top. Links right-aligned: **Method**, **About**. (The "Atlas" link is the logo / homepage itself.) Active = color only, no underline. Global reef search lives inline in the nav (see EXPERIENCE.md §search).

### Homepage hero
Full-bleed underwater photo + dark legibility gradient (`linear-gradient(to bottom, rgba(4,18,32,0.32), rgba(4,18,32,0.18) 38%, rgba(4,18,32,0.82))`). Content pinned bottom:
- **Eyebrow:** `● Live data` — pulsing `#34d399` dot + `#86efac` uppercase label. This is the *only* freshness signal; no timestamps.
- **H1:** "Find where to dive, and where the ocean needs eyes."
- **Subline:** one plain sentence on what the atlas reads (coral health, heat, fishing pressure).

### Collapsible filter rail (homepage) — matches production order
Sticky left column, 300px. Header row: **"Filters"** title + **Reset** link (brand blue). Each section is a native `<details open>` whose `<summary>` is the section header + an optional `(i)` info button + a caret that rotates on collapse. **Sections, in this exact order (matches production):**

1. **When** — 12-month grid (`repeat(4,1fr)`), current month outlined `2px #0089de`. `(i)` → "what in season means" popup. Multi-select; OR logic.
2. **What to see** — taxonomy of collapsible `<details class="cat">` groups (Sharks & rays / Turtles / Marine mammals / Fish & critters / Reef & wrecks), each holding multi-select leaf tags (dark-fill when on). Active-count badge per group. `(i)` → popup. (An endangered-only toggle may sit at the foot, rose track when on.)
3. **Region** — checkbox list by continent (Asia / Oceania / Indian Ocean / Americas / Atlantic & Mediterranean).
4. **Reef state** — checkbox list (Thriving / Under pressure / Witnessing change), checked row gets `#eef4ff` tint. `(i)` → reef-state popup. *(Present in the rail per production parity; the state pill on cards is the primary read.)*
5. **Evidence gaps** — single "Needs fresh eyes" checkbox. `(i)` → popup.
6. **Certification level** — checkbox list (Beginner / Open water / Advanced / Technical), cumulative (your ceiling). `(i)` → popup.

**Controls must be real, focusable inputs** (native checkbox/`<details>`), Tab-reachable, Space/Enter operable — the mockup's `<div onclick>` shims are visual only (see EXPERIENCE.md Accessibility floor). Every filter change updates results live; the count lives in an `aria-live` region.

### Results header + Cards/Map toggle
Above the grid: **"N reefs"** count (left) and, right-aligned, a sort note ("Sorted by **in season first**") + a **Cards / Map** pill toggle. The toggle is a `999px` track (`#f1f7fb`); the active segment is white with a `0 1px 3px` lift. Cards view shows the reef grid; Map view swaps in the dark globe panel.

### Reef card (place-only)
A fixed-height (175px) photo tile, `border-radius:1rem`, flat at rest, lifts on hover. The photo fills the card under a bottom-weighted dark gradient. Bottom band content:
- **Region eyebrow** (e.g. "Caribbean") — `0.5625rem / 700 / uppercase / rgba(255,255,255,0.6)`.
- **Reef name** — `0.9375rem / 800 / white`.

**Ghost pills only where needed.** The card is deliberately quiet: photo + region + name carry it. Frosted-glass overlay pills are added **only when a card needs to signal a non-default fact** — e.g. a reef-state pill, an "● In season" pill, or a "needs fresh eyes" pill when the user is hunting evidence gaps. Do not stack three pills on every card; show a pill only when it changes the read. (This is the redesign's answer to the old "too noisy" card.)

The whole card is one link to the location page. Witnessing-change cards do not lift on hover.

### 3D globe (Map view) — desktop only
A rotating WebGL (three.js) globe inside a dark `#0b1e32` panel (`border-radius:1.2rem`), max-width 560px, `aspect-ratio:1/1`, with a soft radial glow. Reef dots are colored by reef state; dots that fall out of the current filter dim to slate and shrink. Clicking a dot navigates to that reef. Auto-rotates slowly.

**Desktop-only / mobile-fallback rule (required):**
- The globe renders only at the desktop breakpoint (≥1000px, where the two-column stage is active).
- On mobile/tablet, the Map view does **not** mount three.js. It falls back to the Cards grid (the toggle may hide the Map option, or Map resolves to a static reef list). Rationale from the decision log: the globe is delight, not clarity; it carries a perf/maintenance tax and must never block the core find-a-reef flow on a phone.
- Respect `prefers-reduced-motion`: stop auto-rotation.

### Info popup (the in-place explanation pattern)
The redesign's signature pattern. A small `(i)` button (15px circle, `1.4px #94a3b8` border, brand on hover) opens a centered modal over a blurred backdrop. Used for: reef state, "in season," what-to-see, certification, evidence gaps, your chances, IUCN tiers, heat, fishing protection.

Modal anatomy: title → optional sub-paragraph → body paragraphs **or** tagged rows (e.g. the three reef-state tags with their tinted swatches + plain definitions) → optional **Method link**. Closes on ×, backdrop click, or Escape.

**Hard rule:** in-place explanation = popup (no navigation). A link that *leaves* to the Method page must name it — "See exactly how we calculate this on the Method page →". Never silently jump the user to another page.

### Slim location page
Opens with the **Source Serif 4 editorial intro** (the place, in plain prose), then:
- **Hero** — full-bleed underwater photo; reef-state pill + H1 ("Florida Keys") + plain locale subtitle ("United States · Caribbean", not a repeated place name) pinned bottom. Optional **match-context check row** when arriving from a search ("✓ June · ✓ green turtle seen recently · ✓ your level") — checks only, no "Matches your search" label.
- **Reef condition** (one H2, appears once) — one plain condition sentence; a **coral-cover decline chart** (e.g. 31% 1987 → 14% today, dashed projection); a one-line heat read ("warmer than usual") with `(i)` → heat popup; a fishing line ("Banned") with `(i)` → protection popup. Reef-state `(i)` and fishing `(i)` popups end with a Method link. No timestamps. No stat strip — every former stat was a duplicate and is removed.
- **What you'll see** (one H2) — species ordered by recency, IUCN tiers spelled out (Vulnerable / Endangered / Least concern); section `(i)` → IUCN explainer popup → Method.
- **Dive sites** (one H2) — simplified site rows: name · species · depth only.
- **Gear** — two minimal layers (basic kit + site-specific), each item a link with a small `↗`, no repeated "Shop," no rental line.
- **Plan a trip** (sticky right card, the page's ONE primary action — Airbnb "Reserve" model). Expands on-page: Getting there (airport → drive → boat dropdown), Where to stay, and a "See dive operators" action that opens an on-page operators popup where each operator links to its **own** booking site (we take no commission — nonprofit).

### Dive-site page
Same system. Unique parts:
- **Conditions grid** — four plain-labeled cards: **Depth / Current / Visibility / Water** (temperature), each with an icon, value, and one-line sub. `(i)` for any that needs explaining. No abbreviations ("Visibility," never "vis").
- **Encounter-odds list** — per species: animal name + a plain **chance label** ("Nearly every dive," "About 6 in 10 dives," "Now and then") + a likelihood **bar** (`enc-fill`) + a **where** line ("Across the shallow coral"). It is a scannable list, not an event feed and not tabs. "How it's worked out" lives in the `(i)`; no "none seen" negatives in the page text.
- **Contribute** — per-platform rows (iNaturalist → GBIF → IUCN framing), one plain line each; deep how-to → Method.
- **Breadcrumb** links up to the location page (planning/booking lives there, not on the dive site).

### Species list page
The "every animal recorded here" destination. Breadcrumb: Atlas / Florida Keys / Looe Key / All species. **Type filter pills** with counts (All / Fish / Sharks & rays / Turtles / Invertebrates). Per row: animal name + chance label + where + likelihood bar + spelled-out IUCN tier. `(i)` for chances and for IUCN, both ending in a Method link. Sorted most-likely-first.

### Method page
The keystone every "…on the Method page →" link points to. Sticky jump-nav with anchored sections (anchors: `#reefstate` → `#rs-label`, `#rs-signals`; `#sightings` → `#si-chances`, `#si-verify`, `#si-labels`; `#divers`; `#researchers`; `#sources`):
- **Reef state** — three reef-state cards (one honest label per reef) + the plain conditions behind each.
- **The signals behind it** — source cards: NOAA heat / Reef Check coral / Global Fishing Watch / iNaturalist sightings, each credited with its cadence.
- **Your chances** — the likelihood logic as a **formula card**.
- **How we verify a sighting** — a 4-step pipeline (photo → research grade → GBIF → IUCN).
- **Conservation labels** — IUCN tiers spelled out.
- **For divers / contribute** — three platforms in depth.
- **Evidence gaps** — honest "needs fresh eyes" framing.
- **For researchers / work with us** — collaboration + hello@scubaseason.fun.
- **Every source we credit** — the full **63-source list, collapsed** behind a disclosure (not dumped inline).

Nonprofit framing throughout; plain language; honest about thin data (coral cover has only two data points).

### Footer (redesign)
Ink `#081626`. Three columns: wordmark + tagline ("A free, public reef atlas. Science backed, honestly labelled, free to read."); **Site** links (Find a reef / Method / About); **Get in touch** (`hello@scubaseason.fun` + a "spotted wrong data? want to collaborate?" line). Bottom bar: "© 2026 scubaSeason.fun · Live data from NOAA, Reef Check, iNaturalist and 60 more public sources." Never Josie's personal email. No timestamps.

---

## Do's and Don'ts

### Do
- **DO** keep the filter rail sections in production order: When · What to see · Region · Reef state · Evidence gaps · Certification level.
- **DO** make every filter control a real, focusable native input (checkbox / `<details>`), Tab-reachable and Space/Enter operable.
- **DO** render reef cards as place-only tiles — photo + region + name — and add an overlay pill **only** when it changes the read (state, in season, needs fresh eyes).
- **DO** use the info-popup pattern for every in-place explanation (reef state, in season, chances, IUCN, heat, fishing, level, evidence gaps).
- **DO** name the Method page in any link that navigates there ("…on the Method page →").
- **DO** gate the 3D globe to desktop and fall back to cards/static list on mobile; honor `prefers-reduced-motion`.
- **DO** signal live data once with "● Live data" — and nowhere else.
- **DO** spell out IUCN tiers (Vulnerable / Endangered / Least concern) and conditions ("Visibility," "Water temperature," "warmer than usual").
- **DO** keep exactly one heading per concept and one primary action per page (location page = the sticky Plan a trip card).
- **DO** keep "Under pressure" blue (`#2f6ced`), never amber.

### Don't
- **DON'T** add an "updated X ago" / "last synced" timestamp anywhere. The data is live; the eyebrow says so.
- **DON'T** reintroduce a stat strip on the location page — every former stat duplicated the hero pill, the decline chart, the sidebar, or the species list.
- **DON'T** repeat a fact across hero, body, and sidebar. One fact, one home.
- **DON'T** silently jump the user to another page for an explanation — use a popup, or name the destination.
- **DON'T** make reef state a primary *input* metaphor on cards; it is an output you read (the rail checkbox exists for parity, but the card pill + popup carry meaning).
- **DON'T** mount three.js on mobile or let a missing globe block the find-a-reef flow.
- **DON'T** stack three overlay pills on every reef card — that is the old noise the redesign removed.
- **DON'T** use hyphens in user-facing copy. Reword compounds; em dashes (—) are fine.
- **DON'T** use jargon: no "vis," no "DHW," no "Watch," no bare IUCN codes, no "no data."
- **DON'T** add a competing CTA next to the location page's Plan a trip card, or take commission on operator links (nonprofit — each operator links to its own site).
- **DON'T** use Josie's personal email in any user-facing copy — `hello@scubaseason.fun` only.
