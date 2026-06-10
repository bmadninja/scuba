---
# scubaSeason.fun — Design System
# Google Labs DESIGN.md format

meta:
  product: scubaSeason.fun
  tagline: A data atlas for the living ocean
  ui_framework: shadcn/ui base-nova + Tailwind v4
  icon_library: lucide
  mode: light-first  # dark class defined but layout body uses bg-white text-slate-900
  status: final
  updated: 2026-06-04

colors:
  brand:
    primary: "#0089de"          # CTA, links, active states, section eyebrows
    dark: "#1d5d90"             # secondary actions, trust, depth
    accent: "#f23d4e"           # alert/danger accents (unused in primary UI)
    ink_dark: "#0e2742"         # hero headline, stat numbers (near-black navy)
    caption_gray: "#718498"     # stat labels, dimmed meta
    link_hover: "#006fb5"       # footer email link hover

  surfaces:
    page: "#ffffff"             # body background (atlas-bg / atlas-paper)
    muted: "#f1f7fb"            # nav bg, search input, row hover, card skeleton, location stat strip (atlas-surface)
    card: "#ffffff"             # all card backgrounds
    footer: "#0b1e32"           # dark ink — footer, dark hero, reef-states section, inspiration section
    live_panel_bg: "#eef8f1"    # home live status panel
    live_panel_border: "#cde9d6"
    info_block: "#f8fafc"       # slate-50 used for detail info blocks

  text:
    primary: "#0f172a"          # slate-900 — headings, card titles (atlas-ink)
    body: "#334155"             # slate-700 — body paragraphs, list content (atlas-ink-2)
    secondary: "#475569"        # slate-600 — hook text, description
    tertiary: "#64748b"         # slate-500 — metadata, dt labels (atlas-mute)
    dimmed: "#94a3b8"           # slate-400 — icons, placeholders
    live_panel_body: "#3d5168"  # live panel paragraph text

  borders:
    default: "#e2e8f0"          # slate-200 — cards, nav bottom, section dividers (atlas-hairline)
    strong: "#cbd5e1"           # slate-300 — stronger hairlines (atlas-hairline-str)
    muted: "#f1f5f9"            # slate-100 — intra-card dividers, facet group bottoms

  reef_states:
    thriving:
      swatch: "#10b981"         # emerald-500 — filter rail dot
      swatch_alt: "#15a05c"     # emerald-700 range — freshness dot, IUCN LC chip
      pill_bg: "bg-emerald-50"
      pill_text: "text-emerald-700"
      pill_ring: "ring-emerald-200"
      dot: "bg-emerald-500"
    pressure:
      swatch: "#0089de"         # brand blue — NOT amber; filter rail dot
      swatch_alt: "#2f6ced"     # dot on location detail page
      pill_bg: "bg-[#eaf1fe]"
      pill_text: "text-[#1f57c8]"
      pill_ring: "ring-[#2f6ced]/20"
      dot: "bg-[#2f6ced]"
    change:
      swatch: "#f43f5e"         # rose — filter rail dot
      swatch_alt: "#e23a3a"     # freshness cold dot, IUCN CR chip
      pill_bg: "bg-rose-50"
      pill_text: "text-rose-700"
      pill_ring: "ring-rose-200"
      dot: "bg-rose-500"

  semantic_pills:
    emerald:
      bg: "bg-emerald-50"
      text: "text-emerald-700"
      ring: "ring-1 ring-inset ring-emerald-200"
      use: thriving state, in-season, beginner skill, IUCN LC
    blue:
      bg: "bg-[#e8f0fe]"        # or bg-[#eaf1fe]
      text: "text-[#1d5d90]"   # or text-[#1f57c8]
      ring: none                # no ring on skill pill; ring-[#2f6ced]/20 on state pill
      use: skill level (open-water+), under pressure state, filter active state
    amber:
      bg: "bg-amber-50"
      text: "text-amber-700"
      ring: "ring-1 ring-inset ring-amber-200"
      use: advanced skill, IUCN VU, snapshot data freshness
    rose:
      bg: "bg-rose-50"
      text: "text-rose-700"
      ring: "ring-1 ring-inset ring-rose-200"
      use: witnessing change state, IUCN CR/EN
    violet:
      bg: "bg-violet-50"
      text: "text-violet-700"
      ring: "ring-1 ring-inset ring-violet-200"
      use: technical skill level
    neutral:
      bg: "bg-slate-100"
      text: "text-slate-700"    # or text-slate-500/text-slate-600
      ring: none                # or ring-1 ring-inset ring-slate-200
      use: off-season, fallback dive type, depth range

  freshness_dots:
    fresh: "#15a05c"            # green — survey within threshold
    stale: "#e8962f"            # amber — aging survey
    cold: "#e23a3a"             # red — survey very old or unknown
    thermal_live: "#15a05c"     # always fresh (NOAA nightly)

  iucn_tones:
    EX_EW: { bg: "#f1f5f9", text: "#1e293b", chip: "#1e293b" }
    CR_EN: { bg: "#fdecea", text: "#c0392f", chip: { CR: "#b91c1c", EN: "#e23a3a" } }
    VU:    { bg: "#fcf2e2", text: "#b9751a", chip: "#e8962f" }
    NT:    { bg: "#f3fce8", text: "#3f6212", chip: "#65a30d" }
    LC:    { bg: "#e7f6ee", text: "#15824c", chip: "#15a05c" }
    DD_NE: { bg: "#f1f5f9", text: { DD: "#64748b", NE: "#94a3b8" }, chip: { DD: "#94a3b8", NE: "#cbd5e1" } }

  heat_ramp:
    a0: "oklch(0.92 0.02 215)"  # baseline / no stress
    a1: "oklch(0.86 0.06 90)"
    a2: "oklch(0.80 0.12 75)"
    a3: "oklch(0.69 0.16 50)"
    a4: "oklch(0.60 0.19 32)"
    a5: "oklch(0.50 0.20 20)"   # severe stress

  data_freshness_pills:
    live: { bg: "bg-emerald-50", text: "text-emerald-800", ring: "ring-emerald-200", dot: "bg-emerald-500" }
    snapshot: { bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200", dot: "bg-amber-500" }
    presence: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", dot: "bg-slate-400" }

typography:
  fonts:
    sans:
      family: "Noto Sans"
      variable: "--font-sans"
      weights: [300, 400, 500, 600, 700, 900]
      fallback: "system-ui, -apple-system, sans-serif"
      role: All UI text — headings, body, labels, navigation. Weight 300 (Light) used for wordmark "scuba" line. Weight 900 (Black) used for wordmark "Season.fun" line.
    mono:
      family: "IBM Plex Mono"
      variable: "--font-mono"
      weights: [400, 500]
      role: Eyebrow labels, data keys, uppercase meta, facet headers, section labels, breadcrumbs, IUCN badges, badges with letter-spacing
    serif:
      family: "Source Serif 4"
      variable: "--font-serif"
      weights: [400, 600]
      role: Referenced in globals.css CSS layer components (atlas-stat-num, atlas-section-head h2, atlas-hero h1, reef card name) but NOT loaded in layout.tsx — those CSS classes map --font-serif to --font-sans at runtime. All rendered text uses Noto Sans.

  note: |
    Despite three font variables being defined, globals.css aliases
    --atlas-serif, --atlas-sans, and --atlas-mono all back to var(--font-sans)
    ("Noto Sans"). The CSS-class atlas system uses the serif-looking scale
    for large numerics and hero heads, but Source Serif 4 is loaded
    and available for future use.

  scale:
    h1_hero:
      classes: "text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl"
      use: Home page hero headline
    h1_page:
      classes: "text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
      use: Location page heading
    h2:
      classes: "text-2xl font-bold tracking-tight text-slate-900"
      use: Section headings within pages
    h3_card:
      classes: "text-base font-semibold text-slate-900"
      use: Card titles (ReefLocationCard)
    h3_site:
      classes: "text-lg font-bold text-slate-900"
      use: Site card title
    eyebrow:
      classes: "text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]"
      use: Section labels above content blocks (brand blue)
    eyebrow_slate:
      classes: "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
      use: Section labels where neutral is needed (conditions, good season, sites count)
    body:
      classes: "text-base leading-7 text-slate-700"
      use: Primary paragraph text
    body_secondary:
      classes: "text-[15px] leading-7 text-slate-600"
      use: Secondary paragraph, extended descriptions
    body_small:
      classes: "text-sm leading-6 text-slate-700"
      use: Card hook text, metadata paragraphs
    caption:
      classes: "text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718498]"
      use: Stat labels in the hero stat row
    caption_meta:
      classes: "text-[11px] leading-5 text-slate-600"
      use: Sighting meta on cards
    data_label:
      classes: "text-xs font-semibold uppercase tracking-wider text-slate-500"
      use: dl > dt within card data sections
    data_value:
      classes: "font-semibold text-slate-900"
      use: dl > dd within card data sections
    stat_number:
      classes: "text-xl font-extrabold leading-none text-[#0e2742]"
      use: Hero stat numbers
    link_nav:
      classes: "text-sm font-medium"
      use: Nav links (color switches between text-slate-700 and text-[#0089de])
    link_inline:
      classes: "text-[#0089de] hover:underline"
      use: Inline body links

rounded:
  card: "rounded-2xl"           # all cards, panels, filter rail, search dropdown, drawers, live panel
  pill: "rounded-full"          # state badges, skill badges, in-season pill, month chips (active), nav links, search input
  month_cell: "rounded-md"      # season calendar cells (location detail page)
  month_chip_filter: "rounded-lg" # filter rail month chips
  filter_opt: "rounded-lg"      # CheckOpt buttons in filter rail
  facet_continent: "rounded-lg" # continent accordion row
  iucn_chip: "rounded"          # inner code chip inside IucnBadge (4px)
  info_block: "rounded-xl"      # detail info blocks (trip duration, dive style, dive level)
  note: "Never use rounded-xl for cards — use rounded-2xl. Never use rounded-xl for pills — use rounded-full."

spacing:
  containers:
    home_page: "mx-auto max-w-6xl px-6"
    location_page: "mx-auto w-full max-w-6xl px-6"
    nav_footer: "mx-auto max-w-[1320px] px-7"
    atlas_wrap_css: "max-width: 1320px; padding: 0 28px"

  vertical_rhythm:
    page_top_padding: "py-10"   # home page
    page_padding: "py-12"       # location and other pages
    section_gap: "mt-10"        # between major sections
    section_gap_large: "mt-12"  # between major sections (atlas explorer)
    hero_section_gap: "gap-6 lg:gap-10"

  card:
    internal_reef: "p-4"        # ReefLocationCard body
    internal_site: "p-5"        # SiteCard body
    internal_filter: "p-5"      # AtlasFilterRail container
    internal_info: "p-5"        # detail info blocks
    grid_gap: "gap-4"           # site card grid
    grid_gap_reef: "gap-5"      # reef location card grid (implied from layout)

  facet:
    group_bottom: "pb-4"
    label_bottom: "mb-2"
    option_gap: "space-y-0.5"
    border: "border-b border-slate-100"

elevation:
  card_default:
    shadow: "0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12)"
    note: Applied inline via style prop on ReefLocationCard and AtlasFilterRail
  card_hover:
    shadow: "0 1px 2px rgba(16,40,70,.03), 0 14px 30px -20px rgba(16,40,70,.18)"
    transform: "-translate-y-[3px]"
    border: "border-[#0089de]/40"
    note: Also applies scale-[1.02] to the inner image
  site_card_hover:
    shadow: "hover:shadow-md"   # Tailwind shadow-md (no custom rgba)
    border: "hover:border-[#0089de]/40"
  search_dropdown:
    shadow: "shadow-md"
  nav:
    bg: "bg-white/90 backdrop-blur"
    border: "border-b border-slate-200"
  note: |
    Always use the rgba(16,40,70) shadow formula for product cards.
    Never use Tailwind shadow-sm/shadow-lg on primary content cards.

---

## Brand & Style

scubaSeason.fun is a data atlas for the living ocean. The aesthetic is scientific precision meets ocean clarity — clean white surfaces, a cool blue brand palette, and data presented with editorial restraint. The product is *light-mode first*; there is no dark mode in production even though a `.dark` CSS class is defined.

The overall feel is: a well-designed reference tool. Not a travel brochure. Trust is established through data freshness signals, transparent methodology, and conservative color use. No gradients in the primary UI (the only gradient is the decorative sparkline on the home live panel).

**Three semantic colors anchor data meaning:**

- Emerald/green (`#10b981`) — health, thriving reefs, fresh data, good conditions
- Blue (`#0089de`) — the brand color *and* the "Under pressure" reef state (this is intentional — blue reads as "caution" in the ocean context without invoking the panic of red)
- Rose/red (`#f43f5e`) — decline, witnessing change, cold/missing data, danger

**Dark hero layout** — The homepage uses a full-bleed dark hero section (`height: 100vh`) with a deep ocean gradient (`#021422` → `#041c33` → `#052745` → `#073060`), caustic ray texture overlays, and a vignette. Nav is `position: absolute` with no background. All hero text is white or rgba(255,255,255,x). Below the hero, the page transitions to a white surface. Dark-ink sections (reef states explainer, inspiration grid) reuse `background: #0b1e32` as section-level backgrounds, not the page body.

---

## Colors

### Brand palette

| Token | Hex | Usage |
|---|---|---|
| `--color-brand` | `#0089de` | CTAs, active nav links, eyebrow labels, filter active state, search focus ring |
| `--color-brand-dark` | `#1d5d90` | Skill level pill text, secondary depth contexts |
| `--color-brand-accent` | `#f23d4e` | Alert/danger (defined, not prominent in primary UI) |
| Ink navy | `#0e2742` | Hero stat numbers, live panel headline |
| Caption gray | `#718498` | Hero stat labels |

### Surface palette

| Role | Value |
|---|---|
| Page background | `#ffffff` |
| Muted surface (`--atlas-surface`) | `#f1f7fb` — nav bg, location stat strip, search input, row hover |
| Card background | `#ffffff` |
| Dark ink (footer, hero, ink sections) | `#0b1e32` |
| Live panel background | `#eef8f1` with `#cde9d6` border |
| Info block (detail page) | `bg-slate-50` (`#f8fafc`) |

### Text scale

| Class | Hex | Usage |
|---|---|---|
| `text-slate-900` | `#0f172a` | H1–H3, card titles |
| `text-slate-700` | `#334155` | Body copy, list items |
| `text-slate-600` | `#475569` | Hook text, secondary paragraphs |
| `text-slate-500` | `#64748b` | Country meta, dt labels, captions |
| `text-slate-400` | `#94a3b8` | Icons, placeholders, decorative separators |
| `text-[#718498]` | `#718498` | Stat strip labels (slightly warmer than slate-400) |

### Reef state pills

Each state has a consistent pill formula: `rounded-full px-2.5–3 py-0.5–1 text-xs font-medium/semibold` with semantic bg/text/ring-inset.

| State | Bg | Text | Ring |
|---|---|---|---|
| Thriving | `bg-emerald-50` | `text-emerald-700` | `ring-1 ring-inset ring-emerald-200` |
| Under pressure | `bg-[#eaf1fe]` | `text-[#1f57c8]` | `ring-1 ring-inset ring-[#2f6ced]/20` |
| Witnessing change | `bg-rose-50` | `text-rose-700` | `ring-1 ring-inset ring-rose-200` |

The "Under pressure" state is **blue, not amber**. This is a deliberate product choice: blue maps to the ocean and the brand, not to the amber/orange danger of fire metaphors. Amber is reserved for IUCN VU (vulnerable) and stale data freshness indicators.

### Skill level pills

| Level | Bg | Text | Ring |
|---|---|---|---|
| Beginner | `bg-emerald-50` | `text-emerald-700` | `ring-1 ring-inset ring-emerald-200` |
| Open water | `bg-sky-50` | `text-sky-700` | `ring-1 ring-inset ring-sky-200` |
| Advanced | `bg-amber-50` | `text-amber-700` | `ring-1 ring-inset ring-amber-200` |
| Technical | `bg-violet-50` | `text-violet-700` | `ring-1 ring-inset ring-violet-200` |

The SiteCard renders skill differently: `bg-[#e8f0fe] text-[#1d5d90]` (blue tint, no ring) — this is a minor inconsistency in the codebase; the ring-variant is the canonical pattern.

### Data freshness pill tones

| Variant | Bg | Text | Ring | Dot |
|---|---|---|---|---|
| Live | `bg-emerald-50` | `text-emerald-800` | `ring-emerald-200` | `bg-emerald-500` |
| Snapshot | `bg-amber-50` | `text-amber-800` | `ring-amber-200` | `bg-amber-500` |
| Presence | `bg-slate-100` | `text-slate-700` | `ring-slate-200` | `bg-slate-400` |

All freshness pills share: `rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ring-1 ring-inset`

---

## Typography

Three typefaces are loaded; at runtime all CSS aliases resolve to Noto Sans:

- **Noto Sans** (`--font-sans`) — all UI text. Weights: 300, 400, 500, 600, 700, 900. Weight 300 (Light) is used exclusively for the wordmark "scuba" line. Weight 900 (Black) is used exclusively for the wordmark "Season.fun" line.
- **IBM Plex Mono** (`--font-mono`) — loaded and available for eyebrow labels and badges that need the mono character but not all components use it explicitly.
- **Source Serif 4** (`--font-serif`) — loaded and available; CSS aliases currently map it back to sans for production rendering.

### Type scale

**Display / Hero H1**
```
text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl
```
Home hero. Semibold (not bold) at display size.

**Page H1**
```
text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl
```
Location page heading. Bold (not semibold).

**H2 — Section heading**
```
text-2xl font-bold tracking-tight text-slate-900
```

**H3 — Card title (ReefLocationCard)**
```
text-base font-semibold text-slate-900
```
Turns `text-[#0089de]` on group hover.

**H3 — Card title (SiteCard)**
```
text-lg font-bold text-slate-900
```
Turns `text-[#0089de]` on group hover.

**Eyebrow (brand blue)**
```
text-xs font-semibold uppercase tracking-[0.18em] text-[#0089de]
```
Used as labels above info blocks (trip duration, dive style, dive level).

**Eyebrow (slate)**
```
text-xs font-semibold uppercase tracking-[0.18em] text-slate-500
```
Used as section labels (Conditions, Good season, sites count).

**Body**
```
text-base leading-7 text-slate-700
```

**Body secondary**
```
text-[15px] leading-7 text-slate-600
```
Extended descriptions, secondary paragraphs.

**Body small**
```
text-sm leading-6 text-slate-700
```
Card hook text, metadata.

**Stat number (hero)**
```
text-xl font-extrabold leading-none text-[#0e2742]
```

**Stat label (hero)**
```
text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718498]
```

**Caption / sighting meta**
```
text-[11px] leading-5 text-slate-600
```

**Data key (dl dt)**
```
text-xs text-slate-500
```
(no uppercase, no tracking — plain small slate-500)

**Data value (dl dd)**
```
mt-0.5 font-semibold text-slate-900
```

---

## Layout & Spacing

### Page containers

| Context | Max-width | Horizontal padding |
|---|---|---|
| Home, Location | `max-w-6xl` (72rem) | `px-6` |
| Nav, Footer | `max-w-[1320px]` | `px-7` |
| Atlas CSS wrap | `1320px` | `28px` |

### Page-level vertical rhythm

- `py-10` — home page
- `py-12` — location and inner pages
- `pt-8` — section start after jump nav
- `mt-10` — between sections (conditions, etc.)
- `border-t border-slate-200 pt-10` — section separator with top border

### Hero layout (home)

Two-column flex layout on `lg`: left column (`flex-1`) + right panel (`lg:w-[340px] lg:shrink-0`). Stacks on mobile. Gap: `gap-6 lg:gap-10`.

### Card grids

- Site cards: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- ReefLocationCard: `grid gap-5` (implied from atlas explorer context)
- Stat strip: `flex items-stretch divide-x divide-slate-200` with each cell `px-5 first:pl-0`

### Filter + content layout (Atlas Explorer)

Two-column grid: filter rail on the left (sticky, `lg:sticky lg:top-24`), card grid on the right. On mobile the rail stacks above the grid and loses its sticky positioning.

### Card internal spacing

- ReefLocationCard body: `p-4`
- SiteCard body: `p-5`
- AtlasFilterRail container: `p-5`
- Info blocks (trip duration, dive style, dive level): `p-5`
- Live panel (home): `p-[18px]`

### Section within card

Cards use `border-t border-slate-100 pt-2.5` or `border-t border-slate-100 pt-3` to visually separate content sections inside a card.

---

## Elevation & Depth

### Card shadow formula

All product cards use the same rgba(16,40,70) shadow family:

**Default:**
```css
box-shadow: 0 1px 2px rgba(16,40,70,.03), 0 12px 30px -20px rgba(16,40,70,.12);
```

**Hover:**
```css
box-shadow: 0 1px 2px rgba(16,40,70,.03), 0 14px 30px -20px rgba(16,40,70,.18);
transform: translateY(-3px);
border-color: rgba(0, 137, 222, 0.4);
```

Additionally, the hero image inside ReefLocationCard scales up on hover: `group-hover:scale-[1.02]`.

### Other elevations

| Element | Shadow |
|---|---|
| SiteCard hover | `shadow-md` (Tailwind default) |
| Search dropdown | `shadow-md` |
| Nav | `bg-white/90 backdrop-blur` — no drop shadow, blur effect only |
| Reef state tooltip (CSS) | `0 4px 14px -2px rgba(0,0,0,0.12)` |
| cmdk palette (CSS) | `0 16px 48px -8px rgba(0,0,0,0.22)` |

---

## Shapes

### Border radius

| Usage | Class | Approx px |
|---|---|---|
| Cards, panels, filter rail, search dropdown, drawers | `rounded-2xl` | ~18px |
| Pills, badges, nav links, season chip (active), search input, state chips | `rounded-full` | 9999px |
| Season calendar cells (location detail), filter rail month chips, CheckOpt buttons | `rounded-lg` / `rounded-md` | 8px / 6px |
| IUCN code chip (inner solid chip) | `rounded` | 4px |
| Info blocks (trip duration, etc.) | `rounded-xl` | ~12px |

**Critical rule:** `rounded-2xl` is the dominant container radius. Do not use `rounded-xl` for cards (it is reserved for sub-card info blocks). Do not use `rounded-lg` for cards.

---

## Components

### AtlasNav

Sticky top header. `sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur`.

On the dark hero (homepage), the nav renders with `position: absolute` over the hero with no background — white/translucent text treatment. On all inner pages it is sticky with `bg-white/95 backdrop-blur`.

**Logo mark (Option D)**

SVG `viewBox="0 0 36 36"`. Circle: `cx="18" cy="18" r="16" fill="#0089de"`. Two wave paths, both `stroke-linecap="round" fill="none"`:
- Primary wave: `d="M5 20 Q9 14 14 17 Q18 20 22 15 Q26 10 31 16"` `stroke="#fff"` `stroke-width="2"`
- Secondary wave: `d="M5 25 Q9 20 13 22 Q17 24 21 20 Q25 16 31 21"` `stroke="rgba(255,255,255,0.4)"` `stroke-width="1.5"`

**Wordmark — stacked, weight-split, line-height 1.0**

| Line | Text | Weight | Size | Letter-spacing | Color (light bg) | Color (dark bg) |
|---|---|---|---|---|---|---|
| Top | `scuba` | 300 (Light) | 0.6875rem | 0.08em | `#94a3b8` | `rgba(255,255,255,0.35)` |
| Bottom | `Season.fun` | 900 (Black) | 1.05rem | −0.05em | `#0f172a` | `#ffffff` |

No color treatment on the `.fun` suffix — it is plain black/white matching the rest of the bottom line. The `.fun` color treatment in the old spec is removed.
- Search: `rounded-full border border-slate-200 bg-[#f1f7fb] py-2 pl-9 pr-4 text-sm` — focus state: `focus:border-[#0089de] focus:bg-white focus:ring-2 focus:ring-[#0089de]/30`
- Nav links: `rounded-full px-3 py-1.5 text-sm font-medium` — active: `text-[#0089de]`, default: `text-slate-700 hover:text-[#0089de]`
- No underline active indicator on nav — color change only
- Search dropdown: `rounded-2xl border border-slate-200 bg-white shadow-md` with `py-1` list and each row `px-4 py-2.5`
- Selected row: `bg-[#f1f7fb]`

### AtlasFooter

Dark ink background: `background: #0b1e32`. Padding: `4rem 3rem 3rem`.

**Three-column grid** (`grid-template-columns: 1fr 1fr 1fr; gap: 3rem`):
- Col 1 — Logo mark + stacked wordmark + tagline (`Source Serif 4` italic, 0.875rem, `rgba(255,255,255,0.35)`, max-width 260px)
- Col 2 — Site links. Column header: 0.625rem/700/tracking-[0.16em] uppercase `rgba(255,255,255,0.25)`. Links: 0.875rem/500 `rgba(255,255,255,0.5)`, hover `#fff`
- Col 3 — Contact. Email: 0.9375rem/600 `#0089de`, hover `#38b0ff`. Note copy: 0.8125rem `rgba(255,255,255,0.3)`

**Hairline divider** between top grid and bottom bar: `border-bottom: 1px solid rgba(255,255,255,0.08)`. `padding-bottom: 3rem` on top grid.

**Bottom bar** (`padding-top: 1.5rem`, flex space-between):
- Copyright: 0.75rem `rgba(255,255,255,0.2)`
- Data attribution note: same size, right-aligned, inline link `rgba(255,255,255,0.3)`

Wordmark in footer uses same weight-split treatment as nav (300/900), colors `rgba(255,255,255,0.3)` / `#fff`.

### ReefLocationCard

Full card anatomy:

```
rounded-2xl border border-slate-200 bg-white
[default shadow formula]
hover:[-translate-y-[3px] border-[#0089de]/40 shadow-hover-formula]
```

**Photo overlay policy (single signal):** Only the reef-state badge sits on the photo. The skill badge and the in-season badge move into the card body meta row. This keeps the underwater photo clean (resolves the "too noisy" overlays). Image must be a real underwater photograph (§ Photo policy below).

1. **Image area** — `aspect-[4/3] overflow-hidden bg-[#f1f7fb]`. Image: `h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]`
2. **State badge** — `absolute left-3 top-3`, `rounded-full px-2.5 py-1 text-xs font-medium` with semantic bg/text/ring. **This is the only overlay on the photo.**
3. *(removed from photo)* Skill badge and in-season badge are no longer overlaid — see body meta row below.
4. **Body** — `p-4`
   - Title: `text-base font-semibold text-slate-900 group-hover:text-[#0089de]`
   - Country: `text-sm text-slate-500`
   - **Meta row** (relocated off photo) — `mt-2 flex flex-wrap items-center gap-1.5`:
     - Skill chip: `rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1d5d90]`
     - In-season chip (when `inSeason`): `rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700`, rendered with a `●` fill + "In season" text (mark + text, not color alone)
   - Hook: `mt-2 line-clamp-2 text-sm leading-6 text-slate-600`
   - Freshness row: `mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] text-slate-600`
     - Each item: dot `h-1.5 w-1.5 rounded-full [freshness-color]` + label text
   - Data row: `mt-3 grid gap-2 border-t border-slate-100 pt-3 text-xs` in 1 or 2 columns
     - `dt text-slate-500` / `dd mt-0.5 font-semibold text-slate-900`

### SiteCard

```
rounded-2xl border border-slate-200 bg-white hover:border-[#0089de]/40 hover:shadow-md
```

1. **Image** — `h-44 w-full object-cover transition group-hover:scale-[1.02]` (fixed height, no aspect ratio)
2. **Body** — `p-5`
   - Top row: country label (`text-xs font-semibold uppercase tracking-wider text-slate-500`) + season pill (`rounded-full px-2 py-0.5 text-[10px] font-semibold`)
   - Site name: `mt-1 text-lg font-bold text-slate-900 group-hover:text-[#0089de]`
   - Description: `mt-2 line-clamp-2 text-sm leading-6 text-slate-600`
   - Sighting row: `mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-slate-600` with confidence dot
   - Pill row: `mt-3 flex flex-wrap items-center gap-1.5`
     - Depth: `rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700`
     - Skill: `rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[11px] font-semibold text-[#1d5d90]`
     - Dive type: `rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700`

### Confidence dot (sighting)

Three states, `size-1.5 shrink-0 rounded-full`:
- High: `bg-emerald-500`
- Medium: `bg-amber-500`
- Low: `bg-orange-500`
- No data: `bg-slate-300`

### IucnBadge

Outer pill: `rounded-full px-3 py-1 text-[11.5px] font-semibold` with tinted bg and category-specific text color (hex-based, see IUCN tones in Colors).

Inner code chip: `rounded text-[10.5px] font-extrabold text-white` with `padding: 3px 6px` (inline style) and solid category-specific background.

Label + population trend + assessed year rendered in the same pill inline, with `font-normal opacity-90` on the trend and `font-normal opacity-80` on the year.

When `assessmentUrl` is present, the whole badge is wrapped in an `<a>` linking to IUCN Red List.

### DataFreshnessLabel

Always rendered as a `<Link href="/data">` (links to the data sources page). Base classes:
```
inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] ring-1 ring-inset
```

Followed by variant tone classes. Each variant prefixes a `h-1.5 w-1.5 rounded-full [dot-color]` dot.

### Atlas filter — two approved layouts

Behavior is in EXPERIENCE.md §4.2. Two visual layouts are approved as peers; the chosen one is decided at build. Both share the token set below. Mockups: [mockups/filter-layout-A-horizontal-bar.html](mockups/filter-layout-A-horizontal-bar.html), [mockups/filter-layout-B-left-rail.html](mockups/filter-layout-B-left-rail.html).

**Layout A — horizontal filter bar.** Sticky bar above results, pins on scroll.
- Bar: `sticky top-0 z-40 bg-white/92 backdrop-blur border-y border-slate-200`, inner `px-12 py-3 flex items-center gap-2 flex-wrap`.
- Category button: `rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-[#0089de] hover:text-[#1d5d90]`. Active: `bg-[#0089de]/8 border-[#0089de] text-[#1d5d90]` with a count badge `rounded-full bg-[#0089de] px-1.5 text-[11px] text-white`. *(Active/tinted text uses `#1d5d90`, not `#0089de` — `#0089de` on a brand tint falls below WCAG AA at this size.)*
- Dropdown panel: `bg-white border border-slate-200 rounded-[0.9rem] shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)] p-3.5`, min-width 240px (wildlife panel wider, ~420px).
- Wildlife sub-group header: `font-mono text-[0.66rem] tracking-[0.14em] uppercase text-slate-400`. Tags as pill options: `rounded-full border border-slate-300 px-2.5 py-1 text-[0.78rem]`; on = `bg-[#0089de]/10 border-[#0089de] text-[#1d5d90] font-semibold` (darkened from `#0089de` for AA on the tint).
- Result grid runs full-width (3-up).

**Layout B — left rail with collapsible groups.** Two-column `grid-cols-[262px_1fr] gap-10`.
- Rail: `sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-y-auto`. Results scroll independently beside it.
- Facet = `<details>`: summary header `font-mono text-[0.7rem] tracking-[0.12em] uppercase text-slate-500` + chevron rotating on open; active-count badge `rounded-full bg-[#0089de] px-1.5 text-[0.62rem] text-white`.
- Checkbox row: `flex items-center gap-2 text-[0.82rem] text-slate-700`; box `h-[15px] w-[15px] rounded border-[1.5px] border-slate-300`; on = `bg-[#0089de] border-[#0089de]` white ✓, label `text-slate-900 font-semibold`.
- **Wildlife nested sub-groups:** inner `<details class="subgrp">`; summary `font-mono text-[0.64rem] tracking-[0.1em] uppercase text-slate-400`; sub-checks indented under a `border-l border-slate-200 pl-2`.

**Shared tokens (legacy rail, retained for B):**
- **FacetGroup** — `border-b border-slate-100 pb-4`. Header: `mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500`
- **CheckOpt** — `rounded-lg px-2.5 py-1.5 text-left text-sm`; off `text-slate-600 hover:bg-slate-50`; on `bg-[#e8f0fe] text-slate-900`. Indicator `h-4 w-4 rounded border`; off `border-slate-300 bg-white`; on `border-[#0089de] bg-[#0089de]` white ✓.
- **Month chips** — `rounded-lg px-1 py-1.5 text-xs font-medium`; off `bg-slate-50 text-slate-600 hover:bg-[#e8f0fe]`; on `bg-[#0089de] text-white`.
- **Region continent row** — accordion; continent checkbox `h-5 w-5 rounded border`; count badge `rounded-full bg-[#0089de] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white`; nested list `ml-6 border-l border-slate-100 pl-2`.
- **Reset link** — `text-xs font-medium text-[#0089de] hover:underline`
- **Active chips bar** — pill `bg-[#0089de]/10 text-[#1d5d90] rounded-full px-2.5 py-0.5 text-[0.76rem] font-semibold` with `×` (text `#1d5d90`, not `#0089de`, for AA on the tint); reef-state chips use the reef-state token tints. Each `×` control carries an accessible label, e.g. "Remove Sharks filter."

### Season calendar (location detail page)

12-cell grid (`grid-cols-12 gap-1`). Each cell: `flex flex-col items-center rounded-md px-1 py-2 text-[11px] font-semibold`.
- In-season: `bg-[#0089de] text-white`
- Off-season: `bg-slate-100 text-slate-400`

### In-page jump nav (location detail)

`flex gap-6 border-b border-slate-200 text-sm font-semibold`. Each link `border-b-2 pb-3`:
- Active: `border-[#0089de] text-slate-900`
- Inactive: `border-transparent text-slate-500 hover:text-slate-900`

### Breadcrumb (location detail)

`flex items-center gap-2 text-sm font-medium text-slate-500`. Back arrow link: `hover:text-[#0089de]`. Separator: `text-slate-300`.

### Live panel (home hero)

`rounded-2xl border border-[#cde9d6] bg-[#eef8f1] p-[18px]`

- Badge: animated `live-dot` class + `text-[#1f8a56]` with bold uppercase tracking label
- Headline: `text-base font-extrabold leading-snug text-[#0e2742]`
- Body: `text-[13px] leading-5 text-[#3d5168]`
- Sparkline: `flex h-10 items-end gap-[2px]` bars with `linear-gradient(180deg,#3fb574,#1c7a4a)` fill
- Footer: `text-[11px] text-[#718498]`

`live-dot` animation: `livepulse` keyframes — `opacity: 1, scale: 1` → `opacity: 0.35, scale: 0.8` at 50%, 2.2s ease-in-out. Disabled at `prefers-reduced-motion`.

### StatStrip

Used in two contexts: (1) the home hero strip below the H1, and (2) the location page stat bar below the hero image.

**Home hero strip** — `flex items-stretch` with `border-left: 1px solid rgba(255,255,255,0.1)` between cells (no divide on first). Each cell `flex flex-col gap-0.2rem padding: 0 2.25rem; first: padding-left 0`.
- Value: `font-size: 1.625rem; font-weight: 800; color: #fff; letter-spacing: -0.025em; line-height: 1`
- Label: `font-size: 0.5875rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.32)`

**Location page stat strip** — full-width bar `background: #f1f7fb; border-bottom: 1px solid #e2e8f0`. Inner: `max-width 1320px; padding: 0 3rem`. Cells: `padding: 1.125rem 2rem; border-right: 1px solid #e2e8f0; first: padding-left 0`.
- Label: `font-size: 0.5875rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b`
- Value: `font-size: 1rem; font-weight: 700; color: #0f172a; letter-spacing: -0.01em`
- Note (optional third line): `font-size: 0.6875rem; color: #64748b`

### Empty state (no dive sites)

`rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center`
- Heading: `text-sm font-semibold text-slate-700`
- Body: `mt-2 text-sm text-slate-500` with inline brand link

### Info block (detail page — trip duration, dive style, dive level)

`rounded-xl border border-slate-200 bg-slate-50 p-5`
- Label eyebrow: `text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]`
- Value: `mt-2 text-sm leading-6 text-slate-700`

### LiveBadge

Reusable pulsing "live" indicator. Used in the home numbers section and anywhere a live-data freshness signal is needed outside the hero.

Container pill: `display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.45rem 0.875rem 0.45rem 0.625rem; border-radius: 999px; background: rgba(21,160,92,0.1); border: 1px solid rgba(21,160,92,0.2); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; color: #15804d`

Inner dot: `width: 7px; height: 7px; border-radius: 50%; background: #15a05c; box-shadow: 0 0 0 3px rgba(21,160,92,0.25)`. Animated with `live-dot` / `livepulse` keyframes (see Live panel section for animation spec).

Not the same as the hero live-dot eyebrow (which is larger and uses `box-shadow: 0 0 0 3px rgba(21,160,92,0.3)` at 7px) — the badge wraps the dot in a pill container.

### FreshnessDot system

Three-state 5px dot used in card footers and sighting rows to signal data recency.

| State | Color | Hex | Use |
|---|---|---|---|
| Fresh | Emerald | `#10b981` | Survey within freshness threshold |
| Stale | Amber | `#e8962f` | Aging survey data |
| Cold | Red | `#e23a3a` | Survey very old or unknown |

Rendered as `width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0`. In card footers: `h-1.5 w-1.5` (6px). Always `aria-hidden`.

### SightingRow

Flex row inside sightings lists on location and site pages.

Container: `display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.375rem; border-bottom: 1px solid #e2e8f0; last-child: border-bottom none`

- **Dot**: 8px circle, freshness-colored (`#10b981` / `#e8962f` / `#e23a3a`), `margin-top: 4px; flex-shrink: 0`
- **Species name**: `font-size: 0.875rem; font-weight: 600; color: #0f172a`
- **Meta line**: `font-size: 0.75rem; color: #64748b; margin-top: 0.15rem`
- **Source label**: `font-size: 0.6875rem; color: #94a3b8; font-family: 'IBM Plex Mono', monospace`
- **Date**: `font-size: 0.75rem; color: #64748b; white-space: nowrap; flex-shrink: 0` — right-aligned

The sightings list container is `border: 1px solid #e2e8f0; border-radius: 1.25rem; overflow: hidden`.

### EditorialHook

A text block on location pages that provides the editorial voice context above the species and reef-science sections.

```
font-family: 'Source Serif 4', serif;
font-size: 1.0625rem;
line-height: 1.8;
color: #334155;
max-width: 640px;
```

Appears immediately after the stat strip, before the species strip. No heading — just the italic serif paragraph. This is the only component in the product that uses Source Serif 4 for body text (not just decorative italic in the hero sub).

### FilterSummaryBar

Active filter summary shown above the atlas card grid when one or more filters are applied.

Layout: `display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem`

Active filter pills use reef-state color families:
- Thriving filter active: emerald bg/text (`bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200`)
- Under pressure filter active: blue bg/text (`bg-[#eaf1fe] text-[#1f57c8] ring-1 ring-inset ring-[#2f6ced]/20`)
- Witnessing change filter active: rose bg/text (`bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200`)
- Other active filters: `bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200`

"Clear filter ×" button: right-aligned, `text-xs font-medium text-slate-500 hover:text-[#0089de]`

### Location hero (location detail)

Full-bleed hero, `height: 68vh; min-height: 520px; overflow: hidden`.
- **Photo layer (required):** real underwater photograph borrowed from the location's own dive sites (EXPERIENCE.md §5.5a), `object-cover`. No bare gradient as the visible surface.
- **Base layer:** the ocean gradient (`linear-gradient(155deg,#041c33,#063a52,#065a70,#087a8a,#0a9a88,#0a8070)`) may sit *under* the photo as a load-in/letterbox base only.
- **Legibility overlay:** dark top-to-bottom gradient `linear-gradient(175deg, rgba(2,20,34,0.45) 0%, rgba(5,39,69,0.25) 55%, rgba(3,25,40,0.55) 100%)` so hero content stays readable on any photo.
- **Bottom fade:** `height: 260px` fade into the next section's background.
- Hero content (breadcrumb, reef-state pill, H1) pinned to the bottom.

The same photo policy applies to the **homepage inspiration grid** cards ("Worth going for" / "Something remarkable"): render the borrowed underwater site photo with `object-cover`, gradient only as a base under it.

### Plan your trip block (location detail)

One sticky right-column block (`rounded-2xl border border-slate-200`, card shadow), **location page only** — not on dive-site pages. Behavior in EXPERIENCE.md §4.13a. Mockup: [mockups/location-plan-your-trip.html](mockups/location-plan-your-trip.html). Visual rule: **equal weight across booking types** — no dominant dark operators panel over a quiet lodging list.

- **Block heading:** `text-[0.95rem] font-bold` + `Getting there` eyebrow.
- **Getting there (leads):** light block `bg-[#f1f7fb] border border-slate-200 rounded-xl p-4`. Structured rows — label `font-mono text-[0.5875rem] uppercase tracking-wide text-slate-500`, content `text-[0.875rem] text-slate-700`.
- **What to book — two adjacent peer groups.** Under a single "What to book" eyebrow, render a **"Where to stay"** sub-group immediately followed by an **"Operators"** sub-group. Each sub-group label: `text-[0.74rem] font-bold text-slate-900` (a `subeyebrow`). Both groups use the identical row treatment and sit directly next to each other — accommodation and operators read as a pair, neither emphasized. Neither uses the old dark `#0b1e32` panel.
  - Each row: `AffiliateLink`, `flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2.5 hover:border-[#0089de]/40`, name `text-[0.86rem] font-semibold` + decorative `→` (`aria-hidden`) in `text-slate-400`. A meta line carries a small `font-mono` tag ("stay + dive" / "books dives on site") and an optional price level.
  - **Combined "Stay + dive"** (liveaboard covering diving): sits in "Where to stay" with the "stay + dive" tag; suppresses a redundant operator row.
  - **No per-row "affiliate" badge** — a single quiet disclosure line at the foot of the block ("Some shop and booking links earn us a commission at no cost to you — full disclosure on the About page"), per §9.5.
- **Removed:** the hardcoded blue "See trip options" button (generic PADI search). No generic-search CTA renders.
- **Witnessing change:** muted treatment per §5.6 — heading "Plan thoughtfully," reduced contrast, links retained (hold text ≥4.5:1).

### Gear section

Behavior in EXPERIENCE.md §4.14. Mockup: [mockups/location-gear-section.html](mockups/location-gear-section.html). **On the location page only** (not dive-site pages). Two layers.
- **Section eyebrow:** `font-mono text-xs uppercase tracking-[0.18em] text-[#0089de]` — "Gear for [location]". Sub-kicker `text-slate-500` — e.g. "Basic kit for 28°C water and Advanced diving, plus what specific sites demand".
- **Layer A (basic kit, location level):** `<ul>` of items, each an emoji/icon (`aria-hidden`) + name + short note (e.g. "3mm shorty — 28°C water"). One list for the whole location. Commercial items get a quiet "Shop →" link (`AffiliateLink`, Amazon). **No per-item "affiliate" badge.**
- **Layer B (site-specific add-ons, grouped by site):** under a "What specific sites demand" label, items are grouped under each **site name** (`text-[0.74rem] font-bold` + a "view site →" link). Each add-on uses a visually distinct advisory treatment (amber-tinted item cards `bg-[#e8962f]/6 border border-[#e8962f]/20 rounded-lg`) with a one-line reason (e.g. "Reef hook — strong current on the corner"). A site with no add-ons does not appear; no empty heading.
- **Disclosure:** one quiet line at the section foot ("Some shop links earn us a commission at no cost to you — full disclosure on the About page"), per §9.5 — not badged per item.

### Photo policy (locations & inspiration)

- Every location-representing surface (location hero, inspiration cards) renders a **real underwater photograph of that location**, sourced by borrowing from the location's own dive sites and gated by `isUnderwaterQualityPhoto()`.
- **Never** a bare CSS gradient as the visible surface; gradient is base/letterbox only.
- **Underwater only** — reject surface, dock, specimen-on-white, studio, and illustration images (project rule `hero_must_be_underwater`).
- Fallback order: location `heroImageUrl` → first underwater-passing site photo → any site photo → `underwaterPhotoUrl()` placeholder.

---

## Do's and Don'ts

### Do

- **DO** use `rounded-2xl` for every structural container: cards, panels, filter rail, search dropdown, drawer overlays.
- **DO** use `rounded-full` for all pills, badges, nav links, and the search input.
- **DO** prefix every data block with an eyebrow label: `text-xs font-semibold uppercase tracking-[0.18em]`. Use brand blue (`text-[#0089de]`) for content labels; use slate-500 (`text-slate-500`) for section labels.
- **DO** show a data freshness indicator on every data point that could age. Use the `DataFreshnessLabel` component with `variant="live"`, `"snapshot"`, or `"presence"`. Always link to `/data`.
- **DO** use `ring-1 ring-inset` on all semantic pills instead of a solid border. Never use a non-inset border on a colored pill.
- **DO** apply `aria-hidden` to all decorative SVGs, colored dots, and sparkline elements.
- **DO** use `details`/`summary` pattern (`.atlas-method` CSS class) for methodology disclosures, not modals or tooltips.
- **DO** use the `rgba(16,40,70)` shadow formula for product cards, applied via inline `style` prop. Do not use Tailwind `shadow-sm` or `shadow-lg` for primary content cards.
- **DO** use `line-clamp-2` on card hook/description text to maintain uniform card heights.
- **DO** use the `live-dot` CSS animation class for any pulsing live-data indicator dot.
- **DO** show freshness dots in the card footer using `h-1.5 w-1.5 rounded-full` with the correct freshness color (`#15a05c` fresh / `#e8962f` stale / `#e23a3a` cold).
- **DO** use `bg-[#f1f7fb]` as the placeholder/skeleton background for image areas before load.
- **DO** wrap IUCN badges in `<a>` linking to `assessmentUrl` when the URL is available.
- **DO** collapse card pill fonts to `text-[11px]` or `text-[10px]` with `font-semibold` — never `text-sm` or larger for status chips.
- **DO** turn card titles to `text-[#0089de]` on group hover.
- **DO** use `border-b-2 border-[#0089de]` for the active tab/jump-nav indicator — never a background highlight.
- **DO** keep "Under pressure" reef state blue (`#0089de` swatch, `#eaf1fe` bg, `#1f57c8` text) — not amber.

### Don't

- **DON'T** use a dark background as the default page surface. The site is light-mode first. `bg-white text-slate-900` is the body. Dark ink (`#0b1e32`) is only used for the full-bleed hero, section-level ink blocks (reef states explainer, inspiration grid), and the footer.
- **DON'T** use `rounded-xl` for cards — it is reserved for sub-card info blocks.
- **DON'T** use `rounded-lg` for primary card containers.
- **DON'T** use Tailwind's default shadow scale (`shadow-sm`, `shadow-lg`) for primary content cards — use the `rgba(16,40,70)` formula only.
- **DON'T** use amber for the "Under pressure" reef state. Amber is reserved for stale data freshness and IUCN VU badges.
- **DON'T** use hyphens (`-`) in user-facing copy. Reword compounds. Em dashes (—) are acceptable.
- **DON'T** use solid borders on semantic state pills — use `ring-1 ring-inset`.
- **DON'T** use gradients in UI chrome (cards, nav, buttons). The only gradient in the product is the decorative sparkline on the home live panel.
- **DON'T** omit `aria-hidden` from decorative dots, icons, and sparkline bars.
- **DON'T** use modals for methodology explanations — use the `<details>/<summary>` pattern.
- **DON'T** mix the freshness dot sizes — use `h-1.5 w-1.5` inside card footers and `h-2 w-2` for the hero live-dot badge.
- **DON'T** render a dive site hero without it being an underwater photograph. The `underwaterPhotoUrl()` utility enforces this server-side.
- **DON'T** render a location hero or homepage inspiration card as a bare gradient. Borrow a real underwater photo from the location's own sites (§ Photo policy). Gradient is base/letterbox only.
- **DON'T** stack reef-state, in-season, and skill badges on a location card photo. Only the reef-state badge sits on the photo; in-season and skill move into the card body meta row.
- **DON'T** give the operators block more visual weight than accommodation on the location page. They are booking peers. And **DON'T** render a synthesized generic-search link (e.g. `padi.com/dive-shop-search?q=…`) as an operator — operators require a real or affiliate URL.
- **DON'T** add active underline indicators to nav links — use color change only (`text-[#0089de]`).
- **DON'T** use `font-bold` for card body text — body is `font-normal` (400). Only card titles, eyebrows, and stat numbers use bold/semibold/extrabold.
