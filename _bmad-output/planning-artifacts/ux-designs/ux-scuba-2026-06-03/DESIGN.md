---
# scubaSeason.fun — Design System
# Google Labs DESIGN.md format

meta:
  product: scubaSeason.fun
  tagline: A data atlas for the living ocean
  ui_framework: shadcn/ui base-nova + Tailwind v4
  icon_library: lucide
  mode: light-first  # dark class defined but layout body uses bg-white text-slate-900

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
    muted: "#f1f7fb"            # nav bg, footer bg, search input, row hover, card skeleton (atlas-surface)
    card: "#ffffff"             # all card backgrounds
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
      weights: [400, 500, 600, 700]
      fallback: "system-ui, -apple-system, sans-serif"
      role: All UI text — headings, body, labels, navigation
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

- Emerald/green — health, thriving reefs, fresh data, good conditions
- Blue — the brand color *and* the "Under pressure" reef state (this is intentional — blue reads as "caution" in the ocean context without invoking the panic of red)
- Rose/red — decline, witnessing change, cold/missing data, danger

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
| Muted surface (`--atlas-surface`) | `#f1f7fb` — nav bg, footer bg, search input, row hover |
| Card background | `#ffffff` |
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

- **Noto Sans** (`--font-sans`) — all UI text. Weights: 400, 500, 600, 700.
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

- Logo: `text-lg font-semibold tracking-tight text-slate-900` with `.fun` suffix in `text-[#0089de]`
- Search: `rounded-full border border-slate-200 bg-[#f1f7fb] py-2 pl-9 pr-4 text-sm` — focus state: `focus:border-[#0089de] focus:bg-white focus:ring-2 focus:ring-[#0089de]/30`
- Nav links: `rounded-full px-3 py-1.5 text-sm font-medium` — active: `text-[#0089de]`, default: `text-slate-700 hover:text-[#0089de]`
- No underline active indicator on nav — color change only
- Search dropdown: `rounded-2xl border border-slate-200 bg-white shadow-md` with `py-1` list and each row `px-4 py-2.5`
- Selected row: `bg-[#f1f7fb]`

### AtlasFooter

`border-t border-slate-200 bg-[#f1f7fb]`. Two-column grid at sm: left brand block + right nav links. Bottom bar: `border-t border-slate-200 pt-6` with `text-xs text-slate-400` on both sides.

### ReefLocationCard

Full card anatomy:

```
rounded-2xl border border-slate-200 bg-white
[default shadow formula]
hover:[-translate-y-[3px] border-[#0089de]/40 shadow-hover-formula]
```

1. **Image area** — `aspect-[4/3] overflow-hidden bg-[#f1f7fb]`. Image: `h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]`
2. **State badge** — `absolute left-3 top-3`, `rounded-full px-2.5 py-1 text-xs font-medium` with semantic bg/text/ring
3. **Skill badge** — `absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-xs font-medium` with semantic bg/text/ring
4. **Body** — `p-4`
   - Title: `text-base font-semibold text-slate-900 group-hover:text-[#0089de]`
   - Country: `text-sm text-slate-500`
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

### AtlasFilterRail

Container: `rounded-2xl border border-slate-200 bg-white p-5` with card shadow formula. Sticky at `lg:top-24`.

**FacetGroup** — `border-b border-slate-100 pb-4` wrapper. Header: `mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500`

**CheckOpt** button — `rounded-lg px-2.5 py-1.5 text-left text-sm`:
- Off: `text-slate-600 hover:bg-slate-50`
- On: `bg-[#e8f0fe] text-slate-900`

Checkbox indicator inside CheckOpt — `h-4 w-4 rounded border`:
- Off: `border-slate-300 bg-white`
- On: `border-[#0089de] bg-[#0089de]` with `text-white` checkmark

**Month chips** — `rounded-lg px-1 py-1.5 text-xs font-medium`:
- Off: `bg-slate-50 text-slate-600 hover:bg-[#e8f0fe]`
- On: `bg-[#0089de] text-white`

**Region continent row** — expand/collapse accordion. Continent checkbox: `h-5 w-5 rounded border`. Count badge when active: `rounded-full bg-[#0089de] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white`. Nested region list: `ml-6 border-l border-slate-100 pl-2`.

**Reset link** — `text-xs font-medium text-[#0089de] hover:underline`

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

### Hero stat strip (home)

`flex items-stretch divide-x divide-slate-200`. Each cell: `flex flex-col gap-0.5 px-5 first:pl-0`.
- Number: `text-xl font-extrabold leading-none text-[#0e2742]`
- Label: `text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718498]`

### Empty state (no dive sites)

`rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center`
- Heading: `text-sm font-semibold text-slate-700`
- Body: `mt-2 text-sm text-slate-500` with inline brand link

### Info block (detail page — trip duration, dive style, dive level)

`rounded-xl border border-slate-200 bg-slate-50 p-5`
- Label eyebrow: `text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0089de]`
- Value: `mt-2 text-sm leading-6 text-slate-700`

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

- **DON'T** use a dark background as the default page surface. The site is light-mode first. `bg-white text-slate-900` is the body.
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
- **DON'T** add active underline indicators to nav links — use color change only (`text-[#0089de]`).
- **DON'T** use `font-bold` for card body text — body is `font-normal` (400). Only card titles, eyebrows, and stat numbers use bold/semibold/extrabold.
