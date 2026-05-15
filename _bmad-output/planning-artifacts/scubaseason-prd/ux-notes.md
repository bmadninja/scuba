---
title: scubaSeason.Fun — UX Notes
created: 2026-05-15
scope: lightweight UX pass on three unresolved visuals (globe, filters, detail page)
---

# UX Notes

Lightweight UX captured to unblock implementation. Not a full UX spec — just enough to code without making visual decisions ad hoc.

## 1. Globe — Direction A (Ocean-bright)

**Goal:** make the globe approachable and ocean-themed instead of dark/army-green.

- **Earth texture:** daytime Earth, oceans tinted teal. Replace current `earth-night.jpg` with `earth-day.jpg` (also from `three-globe` examples) or a custom-tinted version.
- **Country highlight:** light coral fill for highlighted dive countries (~`rgba(255, 167, 138, 0.45)` cap, slightly darker side). Drops the army-green clash. Highlight = "this country has dive sites you can filter into."
- **Pins:**
  - Drop-pin shape with a small diving-mask glyph in the head (SVG inline). Replaces the current dot-and-stem combo.
  - Default fill: deep coral `#ff6b5b` (warm — pops against teal ocean and tan land)
  - Selected: same shape, scaled 1.4x, white outline 2px, soft outer glow
  - In-season pin: filled coral. Out-of-season: outlined coral on white, 60% opacity (still visible — divers still want to know the location exists)
- **Atmosphere:** keep cyan glow but soften (`atmosphereAltitude` 0.18, color `#a8e6ff`)
- **Background:** lighter sea-themed gradient — replace `#020817 → #020617` with `#0a3d5c → #0f2a4a` (deep aquatic, not space-black)
- **Auto-rotate:** keep, but slow further (`0.2` not `0.35`) — the current speed reads as restless.

## 2. Filter UX — Layout ii (Top bar, collapsible)

**Component structure:**

```
┌─────────────────────────────────────────────────────────┐
│ [Filter ▾]  [Active chips: November ✕] [Open Water ✕]   │  ← collapsed (default)
└─────────────────────────────────────────────────────────┘

When expanded:
┌─────────────────────────────────────────────────────────┐
│ [Filter ▴]                                              │
│  When:  [Jan][Feb][Mar]...[Nov*][Dec]                   │
│  Cert:  [Never][OW][AOW*][Rescue][DM+][Tech]            │
│  Last dive: [Never][<6mo][6-24mo][2yr+]                 │
│  Region: [Indo-Pacific▾]  Style: [Liveaboard▾]          │
│  Dive types: ☐ Pelagics ☑ Coral ☐ Macro ☐ Wrecks        │
│  Species: [thresher shark________________ 🔍]           │
│  [Reset]                                       [Apply]  │
└─────────────────────────────────────────────────────────┘
```

- **Default state:** collapsed bar across top of page, shows "Filter" button + chip row of active filters
- **Expanded state:** click chevron → drawer slides down, all facets visible at once. No accordion-within-accordion — flat is faster
- **Active filter chips:** persistent above results even when filter drawer is collapsed. Click X on chip → removes filter, results update live
- **Apply behavior:** filters apply live on toggle (no Apply button needed for individual facets); Apply button exists only as a mobile UX safety net — desktop changes are live
- **URL sync:** every change writes to URL (FR2.2) — shareable
- **Mobile:** bar becomes a sticky bottom "Filter (3)" button; tapping opens full-screen filter sheet

## 3. First-visit Cert/Recency Prompt — Inline Banner (per layout ii)

- **Where:** thin banner directly under the top filter bar, above the globe
- **Copy:** "Tell us your dive level — we'll tailor sites & gear. [Open Water ▾] [Last dive: <6 months ▾] [Skip]"
- **Behavior:** filling sets `localStorage.diverProfile`, pre-fills relevant filters, dismisses banner. Skip dismisses with no profile.
- **Re-edit:** a persistent header chip "👤 AOW · last dive 3 mo ago ✎" allows editing anytime
- **No modal.** Modals on first visit are aggressive for a casual-looking entry product. Inline is friendlier and the species-chaser audience won't be bothered.

## 4. Detail Page — Layout y (Two-column dashboard)

**Desktop grid:**

```
┌──────────────────────────────────────────────────────────┐
│  [Hero strip: site name · location · in-season badge]    │
├────────────────────────────────────┬─────────────────────┤
│                                    │ ┌─ Plan Your Trip ─┐│
│  Overview                          │ │ ✈ Getting there  ││
│                                    │ │   [SkyScanner →] ││
│  Species & What You'll See         │ │ 🏨 Where to stay ││
│                                    │ │   [Booking →]    ││
│  Conditions (12-month grid)        │ │   [Liveaboard →] ││
│                                    │ │ 🤿 Who to dive   ││
│  Season Calendar                   │ │   with           ││
│                                    │ │   [PADI Travel →]││
│  Gear — Tier A (Base kit)          │ └──────────────────┘│
│  Gear — Tier B (Site-specific)     │ (sticky on scroll)  │
│                                    │                     │
│  Related Sites                     │                     │
└────────────────────────────────────┴─────────────────────┘
```

- **Hero:** 1-row strip, not full-bleed. Site name, location, in-season badge, hero photo right-aligned within strip. Cuts hero-image dominance — research tool, not travel brochure.
- **Left column (1.5fr):** all editorial content, scrolls naturally
- **Right column (1fr):** sticky `Plan Your Trip` block on scroll. Affiliate-rich, always in view. Gear blocks live in the LEFT column inline with content — they're part of the research flow, not a sidebar.
  - Rationale for gear-in-content: gear recommendation reads better as part of "you'll need X for this site" prose than as a sidebar list.
- **Affiliate disclosure:** small "Some links earn us a commission. [Learn more]" at the bottom of the sticky block + footer link.
- **Mobile:** single-column. `Plan Your Trip` becomes a sticky bottom button → opens drawer. Gear blocks inline.

## 5. Open Visual Items (defer until after first build)

- Typography scale (using shadcn/Tailwind defaults for now — fine for MVP)
- Icon set choice (Lucide is fine — diving mask glyph drawn custom)
- Hero image sourcing — defer to image-rights resolution (PRD A8)
- Empty states beyond filter no-match (FR2.3 already covers this)
- Dark mode toggle — site is already dark-themed; no light mode for MVP

## Decisions captured

- Globe: **A** (Ocean-bright)
- Filter layout: **ii** (Top bar, collapsible)
- First-visit prompt: inline banner (not modal)
- Detail page: **y** (Two-column dashboard with sticky Plan Trip; gear inline in content)
