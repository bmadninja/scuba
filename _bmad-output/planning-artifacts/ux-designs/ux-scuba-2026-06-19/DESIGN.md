---
name: scuba-season-rebrand-2026
status: draft
updated: 2026-06-19
product: Scuba Season
tagline: The reef atlas built on science, made for divers.
ui_framework: shadcn/ui + Tailwind v4
design_system_version: 1.0.0
pages: [homepage, explore, location-detail, dive-site, upload, method, about]
---

# Scuba Season — Visual Design Contract
**Version 1.0 · 2026-06-19**

This document is the implementation contract for the Scuba Season visual rebrand. Developers build from this spec. Designers approve deviations in writing before they ship. Where this document conflicts with older designs, this document wins.

---

## 1. Brand & Style

Scuba Season is a reef atlas — part authoritative reference, part living field journal. The visual language takes its cues from editorial natural-science publishing: National Geographic, Oceanographic Magazine, and the dive log notebooks divers actually carry. The aesthetic is clean, photograph-led, and unhurried. Science lives in the data; beauty lives in the images.

**Design pillars:**

1. **Photo-first.** Reef and species photography carries emotional weight. The UI steps aside for it. No decorative illustrations, no stock-style lifestyle photography — only authentic underwater imagery.

2. **Editorial clarity.** Text is set with care. Hierarchy is legible at a glance. The reader should never need to hunt for the point.

3. **Data with dignity.** Reef health labels, species sighting odds, and source counts are data — they get their own data-specific colour treatment and monospace type. They are never dressed up as marketing.

4. **Yellow as action.** Brand yellow (`#F6C700`) marks exactly one thing: something the user can do. Every CTA, every interactive trigger, every logo mark. If it is yellow, it is actionable. If it is not a CTA or logo element, it is not yellow.

5. **One dark surface.** The footer. Everywhere else is white. No dark-mode toggle, no dark card variants, no grey section fills.

---

## 2. Colors

### Full token table

| Token name | Hex | Tailwind alias | Use |
|---|---|---|---|
| `--color-paper` | `#FFFFFF` | `paper` | All page backgrounds, card backgrounds, modal surfaces |
| `--color-brand-yellow` | `#F6C700` | `brand-yellow` | CTA backgrounds, logo mark, 1.5px section divider rules |
| `--color-brand-yellow-hover` | `#FFD83A` | `brand-yellow-hover` | CTA hover state only |
| `--color-brand-yellow-border` | `#E0B600` | `brand-yellow-border` | CTA focus ring, CTA pressed border |
| `--color-ink` | `#0E1C28` | `ink` | All headings, body text, CTA text on yellow |
| `--color-ink-2` | `#46545E` | `ink-2` | Secondary body text, card subtitles |
| `--color-mute` | `#8A949B` | `mute` | Labels, timestamps, muted metadata |
| `--color-ocean` | `#0E4F6E` | `ocean` | Rare text accent only — links within prose, not backgrounds |
| `--color-hairline` | `#E7E6E2` | `hairline` | All borders, dividers (except brand divider rules) |
| `--color-footer` | `#14191E` | `footer-bg` | Footer background — the only dark surface |
| `--color-footer-text` | `#C8CDD1` | `footer-text` | Footer body copy |
| `--color-data-improving` | `#2E7D5B` | `data-improving` | Reef health: Improving badge text + icon |
| `--color-data-stable` | `#B98A2E` | `data-stable` | Reef health: Stable badge text + icon |
| `--color-data-declining` | `#C0412B` | `data-declining` | Reef health: Declining badge text + icon |

### Rules

- **Backgrounds:** always `#FFFFFF` except the footer. No tinted section fills, no grey washes, no light-yellow washes.
- **Yellow:** CTAs, logo, 1.5px divider rules only. Never a section background, never a card fill, never a tooltip.
- **Health colours:** data elements exclusively — badges, chart lines, label chips. Never used decoratively.
- **Ocean blue:** text accent only. Never a button colour, never a background.
- **Hairline borders:** default to `#E7E6E2`. Do not substitute grey or alpha variants.

---

## 3. Typography

All three typefaces are loaded from Google Fonts. Load Source Serif 4 and IBM Plex Sans via `next/font/google`. IBM Plex Mono loads as a secondary font-face.

### Source Serif 4

**Role:** Display, all headings (H1–H3), pull quotes, editorial callouts.

| Use case | Weight | Style | Size |
|---|---|---|---|
| Hero H1 | 300 | italic | `clamp(2.75rem, 5vw, 5rem)` |
| Section H2 | 400 | normal | `clamp(2rem, 3.5vw, 3rem)` |
| Card H3 | 400 | normal | `1.375rem` (22px) |
| Pull quote | 300 | italic | `clamp(1.5rem, 2.5vw, 2.25rem)` |
| Location name (hero) | 300 | italic | `clamp(2.5rem, 4.5vw, 4.5rem)` |

Line height for display: 1.15. Letter spacing: −0.01em on sizes above 2.5rem.

### IBM Plex Sans

**Role:** All body copy, UI chrome, nav links, card body text, form fields, button labels, captions.

| Use case | Weight | Size |
|---|---|---|
| Body / card copy | 300 | `1rem` (16px) |
| Secondary body | 300 | `0.875rem` (14px) |
| Nav links | 400 | `0.75rem` (12px) |
| Button label | 500 | `0.8125rem` (13px) |
| Caption | 300 | `0.8125rem` (13px) |
| Form input | 400 | `1rem` (16px) |
| Filter pill label | 500 | `0.75rem` (12px) |

Line height for body: 1.6. Line height for UI labels: 1.2.

### IBM Plex Mono

**Role:** Data labels, eyebrows, stat values, reef health badges, species sighting odds, source counts, data-gap notes, method page source cards.

| Use case | Weight | Size |
|---|---|---|
| Stat value (hero strip) | 500 | `clamp(2rem, 3.5vw, 3.5rem)` |
| Eyebrow / section label | 400 | `0.6875rem` (11px), letter-spacing 0.08em, uppercase |
| Reef health badge | 500 | `0.6875rem` (11px), uppercase |
| Species sighting odds | 500 | `1.125rem` (18px) |
| Data note | 400 | `0.75rem` (12px) |
| Source count | 400 | `0.6875rem` (11px) |

Never use IBM Plex Mono for running prose or button labels.

### Type scale summary

```
--font-display:  'Source Serif 4', Georgia, serif
--font-body:     'IBM Plex Sans', system-ui, sans-serif
--font-mono:     'IBM Plex Mono', 'Courier New', monospace
```

---

## 4. Layout & Spacing

### Grid

- Max content width: **1320px**, centered
- Outer gutter: **28px** on desktop, **16px** on mobile (375px)
- Column system: 12-column CSS grid with `gap: 28px`
- Breakpoints (Tailwind v4 custom): `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1320px`

### Section rhythm

Vertical padding between major page sections:

```css
padding-block: clamp(56px, 8vw, 112px);
```

Apply uniformly. Do not mix ad-hoc section padding values — use this token.

### Component spacing

| Context | Value |
|---|---|
| Card inner padding | `24px` desktop, `16px` mobile |
| Stat strip row padding | `32px` top/bottom |
| Nav height | `64px` |
| Filter pill bar height | `52px` |
| Upload wizard step padding | `40px` |
| Form field gap | `20px` |
| Footer padding | `64px` top/bottom |

### Responsive behaviour

- Homepage hero: full-viewport height on desktop, 80vh minimum on mobile
- Explore map: 42% viewport height sticky; collapses to a pinned strip (120px) on mobile with a "Map" toggle button
- Location detail: sidebar aside (`plan-a-trip`) moves below main content on screens under 1024px
- Species filmstrip: horizontal scroll on all screen sizes

---

## 5. Elevation & Depth

Scuba Season is flat. There are no drop shadows on cards in the resting state. Depth is communicated through spacing, hairline borders, and photography contrast — not shadow layers.

| State | Treatment |
|---|---|
| Card resting | `border: 1px solid #E7E6E2`, no shadow |
| Card hover | `border-color: #0E1C28` (ink), no shadow, `transition: border-color 150ms ease` |
| Modal / upload wizard | `box-shadow: 0 8px 40px rgba(14,28,40,0.12)` — this is the one permitted shadow |
| Sticky nav (solid state) | `border-bottom: 1px solid #E7E6E2`, no shadow |
| Toast / confirmation | `box-shadow: 0 4px 16px rgba(14,28,40,0.10)` |

Never apply `box-shadow` to reef-state cards, species cards, or stat strips.

---

## 6. Shapes

- **Button radius:** `border-radius: 2px` — all buttons, all sizes
- **Card radius:** `border-radius: 8px` — reef-state cards, species cards, site cards in explore grid
- **Photo card radius (mosaic):** `border-radius: 6px`
- **Badge / chip radius:** `border-radius: 2px`
- **Filter pill radius:** `border-radius: 100px` (fully rounded)
- **Wizard step indicator:** `border-radius: 50%` (circle)
- **Input field radius:** `border-radius: 4px`
- **Tooltip radius:** `border-radius: 4px`

Logo mark: SVG circle with wave paths. Do not substitute with a rounded-rectangle.

---

## 7. Components

### TopNav

**Structure:** Sticky container, full width. Two states: transparent (over photo hero) and solid (scrollY > 60px).

- Transparent state: logo wordmark and nav links render in `#FFFFFF`. Upload CTA button renders in `#F6C700` with `#0E1C28` text (always, regardless of hero background).
- Solid state: `background: #FFFFFF`, `border-bottom: 1px solid #E7E6E2`. Logo and links switch to `#0E1C28`.
- Logo: "ScubaSeason" in Source Serif 4 weight 400 + yellow circle SVG mark to the left. Total lockup height: 32px.
- Nav links: Explore · Method · About — IBM Plex Mono 11px, uppercase, letter-spacing 0.08em. Gap between links: 32px.
- Upload CTA: `background: #F6C700`, `color: #0E1C28`, `border-radius: 2px`, `padding: 10px 20px`, IBM Plex Sans 500 13px. Hover: `background: #FFD83A`. Focus: `outline: 2px solid #E0B600, outline-offset: 2px`.
- Mobile (< 768px): hamburger icon opens a full-screen drawer. Upload CTA stays visible in drawer footer as full-width button.
- Transition: `background 200ms ease, border-color 200ms ease`.

```tsx
// shadcn/ui: use Sheet for mobile drawer, no Dialog
// Nav state driven by scroll event listener; threshold 60px
```

---

### StatStrip

**Location:** Below homepage hero, above reef-state trio. Appears on homepage only.

- Full-width, white background, `border-top: 1.5px solid #F6C700`, `border-bottom: 1.5px solid #F6C700`
- 3 to 5 stats, evenly distributed in a flex row
- Each stat cell: eyebrow label (IBM Plex Mono 11px, uppercase, `#8A949B`) above, value (IBM Plex Mono 500, `clamp(2rem, 3.5vw, 3.5rem)`, `#0E1C28`) below
- Counter animation: `countUp` triggered on IntersectionObserver entry; respect `prefers-reduced-motion` (show final value immediately if reduced motion)
- Dividers between stat cells: `1px solid #E7E6E2`, no divider after the last cell
- Padding: `32px` top/bottom, `28px` left/right outer gutter

Stats to display: 63 live science sources · reef sites tracked · species catalogued · sightings submitted · [fifth stat TBD with data team]

---

### ReefStateCard

**Location:** Homepage reef-state trio section. Three cards in a row.

- Full-bleed photo background, `border-radius: 8px`, `overflow: hidden`
- Photo overlaid with a gradient: `linear-gradient(to top, rgba(14,28,40,0.75) 0%, transparent 55%)`
- Card height: `480px` desktop, `360px` mobile
- Bottom-anchored text: reef state badge + location name
- Reef state badge: IBM Plex Mono 11px uppercase, colour from health token (improving/stable/declining), `background: rgba(255,255,255,0.12)`, `border: 1px solid currentColor`, `border-radius: 2px`, `padding: 3px 8px`
- Location name: Source Serif 4 400, 22px, `#FFFFFF`
- Region label: IBM Plex Mono 11px, `#FFFFFF` at 70% opacity, above the name
- On hover: scale photo `transform: scale(1.03)`, `transition: transform 400ms ease`. Card border switches to `#0E1C28`.
- Cards link to their Location detail page.

---

### SpeciesFilmstrip

**Location:** Homepage, between featured-reef mosaic and citizen-science split.

- Horizontally scrolling row of species cards, auto-scroll at `1px/frame` (approximately 0.5s per card width), pause on hover/focus
- Each card: `width: 220px`, `flex-shrink: 0`, `border-radius: 8px`, `border: 1px solid #E7E6E2`
- Card contents: species photo (top, 140px height, `object-fit: cover`), common name (IBM Plex Sans 400 14px, `#0E1C28`), location name (IBM Plex Mono 11px, `#8A949B`), sighting odds (IBM Plex Mono 500 18px, `#0E1C28`)
- Sighting odds label: IBM Plex Mono 11px uppercase `#8A949B` above the value
- No sci-names. No IUCN codes. Common names only.
- Auto-scroll pauses when `prefers-reduced-motion: reduce` — filmstrip is still manually scrollable
- Keyboard: focus on any card pauses auto-scroll; arrow keys move between cards

---

### ReefCard (Explore grid)

**Location:** Explore page scrollable card grid.

- `border: 1px solid #E7E6E2`, `border-radius: 8px`, `background: #FFFFFF`
- Photo: top of card, `height: 180px`, `object-fit: cover`, `border-radius: 8px 8px 0 0`
- Card body padding: `16px`
- Location name: Source Serif 4 400 22px, `#0E1C28`
- Region + country: IBM Plex Mono 11px, `#8A949B`, below name
- Reef health badge: inline, right-aligned or below region label
- Two data points: coral cover % + water temp, IBM Plex Mono 400 12px, `#46545E`
- Hover state: `border-color: #0E1C28`
- Selected state (when map marker is active): `border-color: #F6C700`, `border-width: 2px`
- Grid layout: 3 columns desktop, 2 columns tablet (768px), 1 column mobile

---

### UploadCTA

**Location:** Nav (primary), homepage citizen-science split section (secondary), dive site page (tertiary nudge card).

**Primary (nav button):** Defined in TopNav above.

**Secondary (homepage split section):**
- Left half: full-bleed photo of a diver photographing a reef
- Right half: white background, `padding: 48px`
- Eyebrow: IBM Plex Mono 11px uppercase, `#8A949B`: "Citizen science"
- Heading: Source Serif 4 300 italic, `clamp(2rem, 3.5vw, 3rem)`, `#0E1C28`
- Body: IBM Plex Sans 300 16px, `#46545E`, max 3 sentences
- CTA button: yellow, label "Upload a sighting", links to `/upload`
- Sub-note: IBM Plex Mono 11px `#8A949B` below button: "Auto-submitted to iNaturalist, GBIF, Reef Check, CoralWatch."

**Tertiary (dive site nudge card):**
- `border: 1.5px solid #F6C700`, `border-radius: 8px`, `padding: 24px`, `background: #FFFFFF`
- Heading: Source Serif 4 400 22px
- Body: 1–2 sentences, IBM Plex Sans 300 14px
- Yellow button, same spec as primary

---

### SightingLog

**Location:** Dive site page, below conditions strip.

- Section heading: "Field Journal" — Source Serif 4 400, H3
- Each sighting entry: `border-bottom: 1px solid #E7E6E2`, `padding: 20px 0`
- Entry row: diver avatar (24px circle, `background: #E7E6E2` initials fallback) + diver name (IBM Plex Sans 400 14px) + date (IBM Plex Mono 11px `#8A949B`)
- Species tags: IBM Plex Mono 11px, `background: #F5F4F0`, `border: 1px solid #E7E6E2`, `border-radius: 2px`, `padding: 2px 8px` — common names only
- Conditions row: depth (m), visibility (m), water temp (°C) — IBM Plex Mono 400 12px, `#46545E`
- Photo thumbnail: 80px x 60px, `border-radius: 6px`, `object-fit: cover`, appears right-aligned if a photo was submitted
- Empty state: "No sightings logged yet for this site. Be the first." + yellow Upload button
- Load more: ghost button (IBM Plex Sans 500 13px, `border: 1px solid #E7E6E2`, no background, `border-radius: 2px`)

---

### CoralProjectionChart

**Location:** Location detail page, below sticky stats bar.

- Inline SVG, no third-party charting library unless the data team approves Recharts
- X axis: years (historical + 5-year projection)
- Y axis: coral cover percentage
- Historical line: solid, `stroke: #2E7D5B` (improving) or `#C0412B` (declining) or `#B98A2E` (stable) matching the reef's current label
- Projection line: dashed (`stroke-dasharray: 4 4`), same colour at 60% opacity
- "Now" marker: vertical rule, `stroke: #8A949B`, label "Today" in IBM Plex Mono 11px
- Data point dots: `r: 4`, filled with same line colour
- Confidence band: `fill` at 10% opacity around projection line
- Chart background: white, no grid lines (use only light Y-axis tick marks at `stroke: #E7E6E2`)
- Accessible: `role="img"`, `aria-label` with a plain-language summary of the trend; a `<table>` fallback is hidden off-screen

---

### Footer

- `background: #14191E` — the only dark surface
- Content: max-width 1320px, gutter 28px
- Top row: logo wordmark (white) + nav links (IBM Plex Mono 11px, `#C8CDD1`) — Explore · Method · About · Contact
- Contact email: `hello@scubaseason.fun` — never a personal email
- Second row: brief mission line (IBM Plex Sans 300 14px, `#C8CDD1`), max 1 sentence
- Third row: legal + data attribution (IBM Plex Mono 11px, `#8A949B`): CC BY-NC license note, iNaturalist/GBIF/NOAA attribution
- Padding: `64px` top/bottom
- No dark-mode variants. Footer is always dark.

---

### ReefHealthBadge

**Used in:** ReefStateCard, ReefCard, Location detail hero, Sticky stats bar.

**Anatomy:**

```
[  Improving  ]
```

- Type: IBM Plex Mono 500, 11px, uppercase, letter-spacing 0.06em
- Padding: `3px 8px`
- Border-radius: `2px`
- Border: `1px solid currentColor`
- Background: transparent (on white backgrounds) or `rgba(255,255,255,0.12)` (on photo overlays)
- Colours: `#2E7D5B` (Improving), `#B98A2E` (Stable), `#C0412B` (Declining)
- Three states only. No "Unknown" badge — if health state cannot be determined, the badge is omitted entirely.
- Accessible: `aria-label="Reef health: [state]"` on the badge element

---

### DataNote

**Used in:** below sighting odds in species cards, below stat values in stats bar, data-unavailable inline message, sighting log metadata.

A small informational label that contextualises a data value. Not a tooltip — it is always visible.

- Type: IBM Plex Mono 400, 11px, `#8A949B`
- No border, no background
- Max 80 characters — if longer, rewrite the copy
- Example: "Based on 47 sightings in the last 90 days."
- Example: "Showing last available reading. Live data temporarily unavailable."
- Example: "Data not yet available for this site."

---

### FilterPill

**Used in:** Explore page filter bar.

- Two states: resting and active (see Section 4 — Layout for full spec)
- Filter bar renders as a `<div role="group" aria-label="Filter reefs">` containing individual `<button>` elements
- Active pills include a visually hidden "remove" affordance: pressing Enter/Space on an active pill deactivates it. No ✕ icon — deactivation is communicated through the active/resting state toggle.
- "Clear all" is a separate `<button>` rendered as a text link in IBM Plex Mono 11px `#0E4F6E` (ocean), visible only when at least one filter is active
- Filter bar does not wrap to a second line on desktop — if all filters are active, the bar scrolls horizontally with `overflow-x: auto`

---

### BroadcastConfirmation

**Used in:** Upload wizard, post-submit.

Replaces the wizard content on successful submission. Full-screen within the wizard container.

- Background: `#FFFFFF`
- Heading: Source Serif 4 300 italic, `clamp(2rem, 3.5vw, 3rem)`, `#0E1C28`
- Subheading: IBM Plex Sans 300 18px, `#46545E`
- Platform rows: 4 items, each with: platform name (IBM Plex Sans 400 14px, `#0E1C28`) + checkmark (IBM Plex Mono 500, `#2E7D5B`, character `✓`) + status label (IBM Plex Mono 11px, `#2E7D5B`)
- Row stagger animation: `transition-delay: 0ms, 400ms, 800ms, 1200ms` on each row's opacity (0 → 1)
- Reduced motion: all 4 rows appear immediately
- iNaturalist link below rows: IBM Plex Mono 11px, `#0E4F6E`
- Two ghost buttons: "Submit another sighting" + "Back to [site name]"
- No yellow in this screen. The yellow was the action; the action is complete.

---

## 8. Do's and Don'ts

### Do

1. **Do put yellow only on actions.** Every CTA is yellow. Every yellow element is a CTA or logo element. There are no yellow decorative elements.
2. **Do use health colours exclusively for data.** `#2E7D5B`, `#B98A2E`, and `#C0412B` appear only on reef health badges, chart lines, and label chips — never as decorative accents on cards, section headings, or icons.
3. **Do write species names in plain English.** Common names only. No scientific names in diver-facing copy. No IUCN codes anywhere.
4. **Do let photography carry emotional weight.** Hero sections and reef-state cards should use the highest-quality authentic underwater photography available. The UI frame steps back.
5. **Do keep all backgrounds white except the footer.** If a design asks for a tinted section, a grey wash, or a coloured band — the answer is no. White, then footer dark. Those are the only two options.

### Don't

1. **Don't add icons or emoji to the UI.** The design system has no icon set. Data states are communicated through colour, type, and text labels. If you feel the urge to add an icon, write a word instead.
2. **Don't use hyphens in user-facing copy.** No hyphenated compounds. Rewrite the phrase. Em dashes are permitted for sentence punctuation.
3. **Don't use a box-shadow on cards in their resting state.** Cards are flat with a hairline border. Shadow appears only on modals, the upload wizard, and toasts.
4. **Don't show timestamps on live data.** Data freshness is implied by the "live sources" positioning. Timestamps on individual data points undermine the clean editorial feel and invite questions about staleness. If data is unavailable, show the last-known value with a single inline note — not a timestamp.
5. **Don't add a dark-mode toggle.** The rebrand is a clean break from dark mode. There is one dark surface (the footer). Implementing a toggle is out of scope and conflicts with the design direction.
