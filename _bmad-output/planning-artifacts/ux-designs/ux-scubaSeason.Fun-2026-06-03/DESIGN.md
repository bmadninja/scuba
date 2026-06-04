---
title: scubaSeason.Fun — Design
status: draft
created: 2026-06-03
updated: 2026-06-03
ui_system: shadcn/ui base-nova
color_mode: dark-only

colors:
  # Ocean brand palette — extends shadcn base-nova neutral tokens
  brand-ocean:     "#0089de"   # primary CTA, links, active states
  brand-deep:      "#1d5d90"   # depth/trust, secondary actions
  brand-coral:     "#f23d4e"   # accent, rarity badges, alerts
  brand-teal:      "#00b8d4"   # ocean surfaces, globe water, reef-healthy state

  # Reef state semantic colors
  reef-thriving:   "#00b8d4"   # teal — healthy reef
  reef-pressure:   "#f59e0b"   # amber — under pressure
  reef-witnessing: "#6b7280"   # muted grey — witnessing change / historic loss

  # Evidence confidence semantic colors
  evidence-confirmed: "#f23d4e"   # coral, solid — confirmed presence
  evidence-likely:    "#0089de"   # ocean blue, outlined — high likelihood
  evidence-uncertain: "#6b7280"   # muted, ghost — rare / uncertain

  # Dark theme surface scale (from globals.css dark tokens)
  surface-base:    "oklch(0.145 0 0)"   # page background
  surface-card:    "oklch(0.205 0 0)"   # card/panel background
  surface-raised:  "oklch(0.269 0 0)"   # muted/secondary/popover
  surface-border:  "oklch(1 0 0 / 10%)" # subtle border

  # Text scale
  text-primary:    "oklch(0.985 0 0)"
  text-muted:      "oklch(0.708 0 0)"

typography:
  sans:    "'Noto Sans', system-ui, -apple-system, sans-serif"
  mono:    "Geist Mono, monospace"
  # No display face — functional legibility over personality
  scale:
    xs:   "0.75rem / 1.25"   # 12px — captions, timestamps, source attribution
    sm:   "0.875rem / 1.5"   # 14px — body small, filter labels, chips
    base: "1rem / 1.6"       # 16px — body copy
    lg:   "1.125rem / 1.5"   # 18px — section labels, card titles
    xl:   "1.25rem / 1.4"    # 20px — subsection headings
    2xl:  "1.5rem / 1.3"     # 24px — section headings
    3xl:  "1.875rem / 1.2"   # 30px — page headings
    4xl:  "2.25rem / 1.1"    # 36px — hero site name
  weight:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700

rounded:
  sm:   "calc(0.625rem * 0.6)"   # ~3.75px — tags, chips, badges
  md:   "calc(0.625rem * 0.8)"   # ~5px — buttons, inputs
  lg:   "0.625rem"               # 10px — cards, popovers
  xl:   "calc(0.625rem * 1.4)"   # ~8.75px — panels, modals
  full: "9999px"                 # pills, avatar, filter chips

spacing:
  # 4px base grid
  1:  "0.25rem"   # 4px
  2:  "0.5rem"    # 8px
  3:  "0.75rem"   # 12px
  4:  "1rem"      # 16px
  6:  "1.5rem"    # 24px
  8:  "2rem"      # 32px
  12: "3rem"      # 48px
  16: "4rem"      # 64px
  page-x: "clamp(1rem, 4vw, 2rem)"   # horizontal page padding

components:
  FilterBar:
    height: "3rem"
    bg: "{colors.surface-card}"
    border-bottom: "1px solid {colors.surface-border}"
    # Collapsed: shows Filter button + active chip row
    # Expanded: full drawer slides down, flat layout, no nested accordions
  FilterChip:
    bg: "{colors.brand-ocean}"
    text: "{colors.text-primary}"
    radius: "{rounded.full}"
    height: "1.75rem"
    padding: "0 0.75rem"
    dismiss-icon: "X (lucide:x), 14px"
  SiteCard:
    bg: "{colors.surface-card}"
    radius: "{rounded.lg}"
    border: "1px solid {colors.surface-border}"
    hover-border: "{colors.brand-ocean}"
    image-ratio: "16/9"
    hero-image: "object-cover, full width"
  HeroStrip:
    # 1-row strip — NOT full-bleed. Research tool, not travel brochure.
    height: "auto"
    padding: "1.5rem {spacing.page-x}"
    bg: "{colors.surface-card}"
    layout: "site name + location + badges left | hero photo right (max 40% width)"
  PlanYourTripBlock:
    bg: "{colors.surface-raised}"
    radius: "{rounded.xl}"
    position: "sticky, top: 5rem"
    width: "1fr (of 2-col grid)"
    disclosure: "inline at bottom of block, text-xs muted"
  ReefStateBadge:
    # Flat, no elevation — per prior design pass
    radius: "{rounded.sm}"
    variants:
      thriving:    "bg: teal/15, text: {colors.reef-thriving}, border: teal/30"
      pressure:    "bg: amber/15, text: {colors.reef-pressure}, border: amber/30"
      witnessing:  "bg: grey/10, text: {colors.reef-witnessing}, border: grey/20"
  EvidenceDot:
    # Species/sighting confidence indicator
    size: "10px"
    variants:
      confirmed:  "filled {colors.evidence-confirmed}"
      likely:     "outlined {colors.evidence-likely}, 1.5px stroke"
      uncertain:  "outlined {colors.evidence-uncertain}, 1.5px stroke, 60% opacity"
  ConditionsGrid:
    # 12-column month grid on site detail pages
    cell-height: "2.5rem"
    cell-min-width: "2rem"
    temperature: "gradient fill: deep-blue → teal → warm-orange per temp range"
    peak-months: "border: 2px solid {colors.brand-coral}"
  GlobeContainer:
    bg-gradient: "linear-gradient(to bottom, #0a3d5c, #0f2a4a)"
    atmosphere-color: "#a8e6ff"
    atmosphere-altitude: 0.18
    auto-rotate-speed: 0.2
    pin-color: "#ff6b5b"
    pin-selected-scale: 1.4
    pin-selected-outline: "2px white"
    country-highlight: "rgba(255, 167, 138, 0.45)"
  FirstVisitBanner:
    height: "2.75rem"
    bg: "{colors.surface-raised}"
    border-bottom: "1px solid {colors.surface-border}"
    # Dismisses to localStorage; no repeat on subsequent visits
  EncounterCard:
    # Bucket-list encounter index cards
    bg: "{colors.surface-card}"
    radius: "{rounded.lg}"
    hero-ratio: "21/9"   # cinematic — encounters are epic
  DataSourceDisclosure:
    # Inline methodology/source badge on evidence cards
    style: "text-xs, muted, lucide:info icon left, expandable on click"
---

# scubaSeason.Fun — Brand & Style

**Product character:** A research instrument for divers, not a travel brochure. The visual language is measured, data-confident, and underwater-anchored — like a well-designed field guide, not a resort booking site. Depth and honesty are the brand promise; the UI should feel like it's telling you the truth.

**Tone:** Expert-peer, not salesperson. The product knows what it knows and says so — including when data is absent or uncertain.

**One-sentence test for any new visual decision:** "Does this make the data easier to trust, or is it decoration?"

---

# Colors

## Brand Palette

The palette reads as deep ocean — not tropical-resort teal, not tech-startup blue. It earns its colors from the dive environment itself.

| Token | Value | Use |
|---|---|---|
| `brand-ocean` | `#0089de` | Primary CTAs, active filters, links, focus rings |
| `brand-deep` | `#1d5d90` | Secondary actions, depth indicators, nav |
| `brand-coral` | `#f23d4e` | Accent, rarity, "confirmed sighting" indicators, seasonal badges |
| `brand-teal` | `#00b8d4` | Globe ocean, reef-Thriving state, live/real-time freshness |

## Reef State Semantic Colors

Three reef states carry semantic weight site-wide. Never use these colors for unrelated meaning.

| State | Color | When |
|---|---|---|
| Thriving | `#00b8d4` teal | Healthy reef, good coral cover, low pressure |
| Under pressure | `#f59e0b` amber | Fishing pressure, bleaching risk, declining trend |
| Witnessing change | `#6b7280` muted grey | Documented loss, historic bleaching, degraded state |

## Evidence Confidence Colors

Species and sighting confidence uses a consistent three-state dot language throughout the product.

| State | Rendering | When |
|---|---|---|
| Confirmed presence | Filled coral dot `#f23d4e` | iNaturalist/RLS/citizen-science confirmed |
| High likelihood | Outlined ocean-blue ring `#0089de` | Operator-reported, seasonal pattern |
| Rare / uncertain | Outlined muted ghost | Single record, low-confidence, historical only |

## Surface Scale (dark-only)

| Layer | Token | Color |
|---|---|---|
| Page | `surface-base` | `oklch(0.145 0 0)` near-black |
| Card / panel | `surface-card` | `oklch(0.205 0 0)` dark grey |
| Raised / muted | `surface-raised` | `oklch(0.269 0 0)` lighter dark grey |
| Border | `surface-border` | `oklch(1 0 0 / 10%)` subtle white |

---

# Typography

Single typeface: **Noto Sans**. No decorative or display faces — the product's character comes from data depth and honest copy, not font personality.

| Role | Size | Weight | Notes |
|---|---|---|---|
| Site name (hero) | 4xl / 36px | 700 | Only use on `/sites/[slug]` hero strip |
| Page heading | 3xl / 30px | 700 | Section titles (Overview, Species & What You'll See) |
| Section heading | 2xl / 24px | 600 | Sub-sections within a detail page |
| Card title | lg / 18px | 600 | Site name on cards |
| Body | base / 16px | 400 | All editorial copy |
| Label / UI | sm / 14px | 500 | Filter labels, button text, chip labels |
| Caption / attribution | xs / 12px | 400 | Source, date, photo credit, affiliate disclosure |

**Mono** (Geist Mono): coordinates, depth ranges, condition values in the conditions grid only. Not used for code.

---

# Layout & Spacing

**4px base grid.** All spacing is a multiple of 4px.

Page horizontal padding: `clamp(1rem, 4vw, 2rem)` — comfortable reading width without fixed breakpoints.

**Content max-width:** 1280px, centered.

**Detail page grid:**

```
Desktop (≥1024px):
┌───────────────────────────────────────────────────────┐
│  Hero strip (full width, 1-row)                       │
├──────────────────────────────────┬────────────────────┤
│  Left: editorial (1.5fr)         │ Right: Plan Your   │
│  — Overview                      │ Trip (1fr, sticky) │
│  — Species & What You'll See     │                    │
│  — Conditions grid               │                    │
│  — Season calendar               │                    │
│  — Gear (Tier A + Tier B)        │                    │
│  — Related sites                 │                    │
└──────────────────────────────────┴────────────────────┘

Mobile (< 1024px): single column. Plan Your Trip → sticky bottom button → drawer.
```

**Landing page grid:** globe (full width) + filter bar pinned above it.

**Sites list `/sites`:** 3-column card grid (desktop), 2-col (tablet), 1-col (mobile).

---

# Elevation & Depth

Dark-first: elevation is expressed through surface lightness, not box-shadows.

| Layer | Surface token | Use |
|---|---|---|
| Base | `surface-base` | Page background, globe background |
| Raised | `surface-card` | Cards, filter bar, hero strip |
| Overlay | `surface-raised` | Dropdowns, popovers, sticky Plan Your Trip panel |
| Focus ring | `brand-ocean` 2px | Keyboard focus on all interactive elements |

No heavy drop-shadows. Subtle 1px border (`surface-border`) separates cards from background.

---

# Shapes

**Card radius:** `rounded-lg` (10px) — friendly but not playful.
**Chip/badge radius:** `rounded-full` (9999px) — pills for filter chips, IUCN badges, reef-state badges.
**Button radius:** `rounded-md` (~5px) — slightly softer than square.
**Globe container:** no radius — full-bleed rectangular zone.

---

# Components

See YAML frontmatter for token values. Behavioral specs live in EXPERIENCE.md.

## FilterBar
Collapsed state: horizontal bar, `surface-card` bg, 3rem height. Left: "Filter ▾" button. Right: active-filter chip row (pills, `brand-ocean` fill). Chevron toggles drawer.

Expanded state: drawer slides down below the bar, all facets in a flat grid, no nested accordions. "Reset" bottom-left, "Apply" bottom-right (apply is live on desktop — button is mobile safety net only).

## SiteCard
16/9 hero image (object-cover), site name (lg/600), location (sm/muted), top-3-species icon strip, best-months strip (colored dots), "Detail →" link. Hover: border shifts to `brand-ocean`.

## PlanYourTripBlock
Sticky panel, `surface-raised` bg, `rounded-xl`. Three sub-blocks: Getting there (flights icon), Where to stay (bed icon), Who to dive with (dive mask icon). Each has 2–4 affiliate links. Disclosure line at bottom: "Some links earn us a commission." in xs/muted.

## ReefStateBadge
Flat pill, no elevation. State-colored background at 15% opacity, state-colored text and border. Appears on site cards (bottom-left) and detail page hero strip.

## EvidenceDot + species row
10px dot before species name. Confirmed = filled coral. Likely = outlined ocean-blue. Uncertain = outlined muted, 60% opacity. Tooltip on hover: explains confidence level and source.

## ConditionsGrid
12-column table (Jan–Dec). Temperature uses color gradient. Current strength uses bar width. Peak months have `brand-coral` border. All cells keyboard-accessible with tooltip for full values.

## FirstVisitBanner
Single-row banner between filter bar and globe. `surface-raised` bg. Copy: "Tell us your dive level — we'll tailor sites & gear." Two inline selects (cert / last dive) + "Skip" text link. Fills `localStorage.diverProfile` on change. Never shown again after dismiss.

## DataSourceDisclosure
Inline, xs, muted. Lucide `info` icon left. Single line: "Source: [provider], [date]". Click expands methodology drawer in-place.

---

# Do's and Don'ts

**Do:**
- Lead with evidence. Species confidence, reef state, and sighting recency should be immediately visible on any data surface.
- Keep affiliate surfaces honest. Disclosed, secondary in visual weight — never the primary call to action.
- Use empty states explicitly. "No survey on file" is not implied health. Blank ≠ clean.
- Match visual weight to data confidence. Uncertain data should look uncertain.
- Treat the globe as a discovery tool, not decoration. Every pin leads somewhere real.

**Don't:**
- Full-bleed hero photography as primary visual. We're a research tool. The data is the hero.
- Modal gates on first visit. The inline banner is the pattern.
- Use reef-state colors for anything unrelated to reef state.
- Pad thin data with marketing language. "Limited survey data available" is better than a hopeful description.
- Dark patterns on affiliate links. No ambiguous "Book Now" buttons that look like native actions.
