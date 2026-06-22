# Handoff: ScubaSeason — Full Site Redesign

## Overview
ScubaSeason.fun is a free public reef atlas for divers. It aggregates 63 live science sources into one honest, diver-facing read per reef — a coral-health **trend** (Improving / Stable / Declining) and a **sighting probability** per species — and lets any diver upload a sighting that gets routed to the right science platforms (iNaturalist, Reef Check, CoralWatch, GBIF).

This package is a ground-up visual + UX redesign of the entire site: a light, editorial, photo-led experience (in the spirit of National Geographic / Oceanographic Magazine) replacing the previous dark, text-heavy version. **Data and information architecture are unchanged — this is a design + copy change.**

## About the Design Files
The files in this bundle are **design references created in HTML/React-via-Babel** — prototypes showing the intended look and behaviour. They are **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment** (the production app is Next.js/React + TypeScript — see `src/`), using its existing components, data layer, and patterns. Treat the HTML as the source of truth for layout, color, type, copy, and interaction.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, copy, and interactions are all specified. Recreate pixel-faithfully using the codebase's component library. Photography is wired via Unsplash/Wikimedia placeholder URLs and drag-drop `<image-slot>`s — production should swap in licensed photography per the **Photography Handoff** doc.

---

## Pages / Views

All pages share a sticky top nav and a dark footer (see Shared Components).

### 1. Homepage (`Homepage Redesign.html`)
- **Purpose:** Emotional entry; communicate value (reef health + what you'll see) and drive to Explore / Upload.
- **Layout:** Full-viewport photo hero → white stats strip → "Three directions" reef-state trio (3-col photo cards) → featured-reef horizontal drag-scroll mosaic → species "sighting odds" auto-scroll filmstrip → citizen-science 50/50 split → method/sources strip → footer.
- **Key components:**
  - **Hero:** full-bleed reef photo, dark bottom gradient (`linear-gradient(to bottom, rgba(8,20,14,.12) 0%, …,.90) 100%)`); H1 in italic serif (Source Serif 4, 300), white; subcopy; scroll hint. No buttons (removed by request).
  - **Stats strip:** 4 cells, white bg, **1.5px `#F6C700` top/bottom rules**; numbers in Source Serif 4 (~2.75rem), "improving now" number in `#0E4F6E`.
  - **Reef-state trio:** 3 cards, each a reef photo + bottom gradient + label "↑ Improving · N reefs" (mono, white) + description. Section divider rules in yellow.
  - **Species filmstrip:** dark band removed → white; auto-scroll; each card = species photo + name + "NN% of recent dives" (the sighting-odds differentiator). **No IUCN codes.**
  - **Citizen science:** photo with a floating white info card ("Routed to the right platforms"); 3 numbered steps; yellow "Upload a sighting →" CTA.

### 2. Explore (`Explore Redesign.html`)
- **Purpose:** Browse/filter all reefs. (This is the primary nav destination.)
- **Layout:** Page head (title + Improving/Stable/Declining legend) → split body: **sticky left map panel (42%)** + scrollable right column (filter pill bar + reef-card grid, 2-up).
- **Components:** Filter bar (white, blur) with State-trend explainer, **Trend** / **When** / **Region** / **What you'll see** (species) dropdowns, "No sightings" toggle, sort `<select>`. Reef cards: photo (no overlay labels — "FRESH"/"THERMAL" removed), name, country, single trajectory line ("↑ Improving · 40→48% coral · 10 yrs"), "You'll likely see", footer "Best season · N surveys". Map dots colored by reef state; hover shows a popup; map↔card highlight link.
- **Note:** The flat SVG `WorldMap` is a placeholder — production should use the real WebGL globe (`src/components/home-globe`).

### 3. Location detail (`Location Redesign.html?id={slug}`)
- **Purpose:** One reef's profile.
- **Layout:** Full-bleed hero (photo + name) → sticky stats bar (Coral cover, Health trend, Best season, Dive sites, Last sighting) → 2-col body (content + sticky trip planner aside).
- **Content sections:** About prose → **"Reef health & where it's heading"** with an SVG coral-cover **projection chart** (solid history → dashed projection to 2031) → Best season strip → **Gear & getting wet** (Wetsuit / Certification / Entry) → What you'll find (species grid, common names only, **no sci-names/IUCN**) → N dive sites list. Aside: **Plan a trip** (Getting there, Where to dive from) + dashed-yellow **Upload card**.

### 4. Dive site (`Dive Site Redesign.html?id={id}`)
- **Purpose:** A named site within a reef; sighting log.
- **Layout:** Photo hero (badges: trend, "✓ Sightings confirmed", peak season) → conditions strip (Depth/Skill/Water temp/Heat stress) → overview → **field-journal sighting log** (species tabs, white card, yellow-bordered success banner "4/5 recent dives confirmed", per-dive rows with photo thumbs) OR empty-state for sites with no records → "how readings are measured" disclosure → Upload block (yellow CTA, "takes seconds").

### 5. Upload a sighting (`Contribute Redesign.html`)
- **Purpose:** Frictionless citizen-science submission. (Filename retains "Contribute"; all visible labels say **Upload**.)
- **Flow:** Identity gate (Submit as guest [yellow] / Sign in via Google/Apple) → 3-step wizard: **1 Site** (pick a location → auto-advances; dive site auto-matched) → **2 Sighting** (photo drop, species chips, count, date, notes) → **3 Submit** (sends to all relevant platforms — no platform choice) → confirmation ("→ feeds GBIF → IUCN Red List", optional save prompt for guests). Stepper "done" state = yellow.

### 6. Method (`Method Redesign.html`)
- **Purpose:** Explain the data. Sections: 01 How the data is built (source cards) · 02 **How we read a reef** (Improving/Stable/Declining photo cards + "How the direction is calculated" formula) · 03 **Will you actually see it?** (sighting-probability + "how the likelihood is measured") · 04 The data gap · 05 Where your sighting goes (platforms) · 06 For researchers.

### 7. About (`About Redesign.html`)
- **Purpose:** Mission, first-person. Hero (diver photo) → lead (gap) → The gap / The bridge → Aggregate / Translate / Activate → **wide manta photo band** → CTA. Text-heavy is intentional here. **Founder "why" copy is a placeholder (`[ Your personal note… ]`) — the client must supply it; do not fabricate.**

---

## Interactions & Behavior
- **Nav:** sticky; transparent over photo heroes, turns solid white on scroll (`window.scrollY > 60`). Logo/links reverse to white over heroes.
- **Scroll reveals:** `IntersectionObserver`, `.reveal` → `.on` (opacity/translate, cubic-bezier(.22,1,.36,1)), staggered `.d1–.d4`. Gate animations behind `prefers-reduced-motion`.
- **Drag-scroll** mosaic; **auto-scroll** species filmstrip (`@keyframes`, pause on hover).
- **Counters** animate on view. **Explore** filters are multi-select, reflected live; map hover ↔ card highlight. **Upload** site-select auto-advances.
- **Coral projection chart:** inline SVG, historical line solid + dashed projection, "now" marker.

## State Management
- `getParam('id')` drives Location/Dive-site. Explore owns filter state (conditions, trends, species, months, region, staleOnly, sortBy) feeding map + grid from one filtered set. Upload wizard: `identity`, `step`, `site`, `species`, `done`. Image-slots persist drops to a sidecar JSON.

## Design Tokens

### Colour (the whole system)
| Token | Hex | Use |
|---|---|---|
| Paper | `#FFFFFF` | **All backgrounds.** No coloured section fills. |
| Brand yellow | `#F6C700` (hover `#FFD83A`, border `#E0B600`) | **Every CTA**, logo mark, section divider rules. Action only. |
| Deep-sea ink | `#0E1C28` | Headings + body text |
| Footer | `#14191E` | The only dark surface |
| Ocean blue | `#0E4F6E` | Rare text accent (never a background) |
| Ink-2 | `#46545E` · Mute `#8A949B` · Hairline `#E7E6E2` | Secondary text / labels / borders |
| Data — Improving | `#2E7D5B` | Reef-health data only |
| Data — Stable | `#B98A2E` | Reef-health data only |
| Data — Declining | `#C0412B` | Reef-health data only |

**Rules:** backgrounds always white; every CTA yellow w/ dark text; yellow only on CTAs/logo/dividers; health colours only on data; no icons/emoji; no IUCN codes or jargon in diver copy. (Full spec: `Branding Guidelines.html`.)

### Type
- Display/headings: **Source Serif 4** (300/400 + italic). Fraunces is used in the brand-guideline doc as an alt display option.
- UI/body: **IBM Plex Sans** (300–600).
- Labels/data/eyebrows: **IBM Plex Mono** (400/500).

### Spacing / radius
- Section rhythm `clamp(56px,8vw,112px)`; gutter via `--gutter`; max width `--maxw`. Radii 2px (buttons), 6–12px (cards). Hairlines 1px; brand divider rules 1.5px.

## Logo
Wordmark **ScubaSeason** (Source Serif 4) + a mark: a yellow disc (`#F6C700`, r=9 in a 20×20 viewBox) with two dark ocean-wave paths clipped to the circle. Reverses to white wordmark on dark/photo. SVG is inline in `Brand()` in `hifi.jsx`.

## Assets / Photography
- Photos are placeholder Unsplash/Wikimedia URLs + drag-drop `<image-slot>`s. **Replace with licensed photography** per `Photography Handoff.html` (≥4000×2667 heroes, sRGB JPEG, colour-graded; ~72 images: hero, reef-state trio, 19 reef cards, 19 location heroes, ~16 species, dive-site heroes, citizen-science, about). Health-matched: thriving→vibrant coral, declining→bleached.
- No icon set — the UI deliberately uses no icons/emoji.

## Files (in this bundle)
| File | What it is |
|---|---|
| `Homepage Redesign.html` … `About Redesign.html` | The 7 page prototypes |
| `hifi.jsx` | Shared React components + REEFS/SPECIES data, TopNav, Footer, Brand, ReefCard, WorldMap, helpers (reefPhoto, coverInfo, etc.) |
| `reef-detail.jsx` | Per-reef detail data (prose, coral then/now, fishing, sites) + trend helpers |
| `hifi.css` / `shared.css` | Component + token styles (note: brand overrides made inline/per-page in HTML take precedence) |
| `image-slot.js` | Drag-drop image placeholder web component (`src` = fallback) |
| `Branding Guidelines.html` | The enforceable white + yellow brand system |
| `Photography Handoff.html` | Image quality/quantity/content spec |

Open each HTML file in a browser to see the live design.
