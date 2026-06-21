---
name: scuba-season-experience-2026
status: draft
updated: 2026-06-19
product: Scuba Season
version: 1.0.0
design_ref: DESIGN.md
---

# Scuba Season — Experience Design Contract
**Version 1.0 · 2026-06-19**

This document defines the interaction model, information architecture, voice, flows, and accessibility floor for Scuba Season. Visual tokens, component anatomy, and colour rules live in DESIGN.md — this document references that spec rather than repeating it. Developers implement both in tandem.

---

## 1. Foundation

**Product type:** Public web app, free, no paywall. Nonprofit.

**Primary platform:** Desktop browser, first. Responsive down to 375px mobile.

**UI system:** shadcn/ui components + Tailwind v4 utility classes. Visual tokens from DESIGN.md (color, typography, spacing, radius, elevation).

**Rendering:** Next.js App Router. Server components for data-heavy pages (Location detail, Explore grid). Client components for interactive elements (map, upload wizard, scroll reveals, counter animations, species filmstrip).

**No authentication required** to browse, explore, and read reef data. Authentication (via iNaturalist OAuth or email) is required only to submit a sighting. The upload wizard gates at step 1 — before any data is entered.

**Browser support:** Last 2 versions of Chrome, Firefox, Safari, Edge. No IE. No polyfill burden for CSS custom properties or IntersectionObserver.

---

## 2. Information Architecture

### Top-level surfaces

| # | Surface | Path | Purpose |
|---|---|---|---|
| 1 | Homepage | `/` | Discovery entry point, dual CTA (explore + upload) |
| 2 | Explore | `/explore` | Map + card grid browse of all reef locations |
| 3 | Location detail | `/locations/[slug]` | One location: coral trend, species, dive sites |
| 4 | Dive site | `/sites/[slug]` | One dive site: conditions, sighting log, upload nudge |
| 5 | Upload | `/upload` | 3-step sighting submission wizard |
| 6 | Method | `/method` | Source cards, methodology, data-gap disclosure |
| 7 | About | `/about` | Founder narrative, nonprofit mission, contact |

### Nav structure

```
[ScubaSeason logo]    Explore · Method · About    [Upload a sighting ▶]
```

- Logo: links to `/`
- Nav links: IBM Plex Mono 11px, uppercase. Three text links only: Explore, Method, About.
- Upload: yellow CTA button, always rightmost, links to `/upload`. This is not a fourth text link — it is a button.
- No secondary nav, no mega-menu, no dropdown.
- Mobile: hamburger collapses all three text links into a drawer. Upload CTA appears as a full-width yellow button at the bottom of the drawer.

### Breadcrumb

- Location detail: `Explore → [Location name]`
- Dive site: `Explore → [Location name] → [Site name]`
- Upload: no breadcrumb (wizard has its own step indicator)
- Method, About: no breadcrumb

Breadcrumb type: IBM Plex Mono 11px, `#8A949B`. Separator: `·` (middle dot, not slash, not chevron). Current page: `#46545E`, not linked.

### Footer links

`Explore · Method · About · Contact (hello@scubaseason.fun)`

No social links in footer at launch. No newsletter signup. Contact is a mailto link.

---

## 3. Voice and Tone

### Core principles

Scuba Season writes like a diver who happens to have a PhD in marine biology — curious, direct, warmly enthusiastic, and honest about what the data can and cannot say. The voice is Josie's voice.

**Rules:**

1. **No contractions.** It is, not it's. I am, not I'm. We are, not we're. This applies to all UI copy, headings, body text, error messages, and tooltips. The About page is the exception — Josie's narrative voice may use contractions if her draft does.

2. **Digits, not words, for numbers.** "63 sources", not "sixty-three sources". "4 out of 5 recent dives", not "four out of five". Always.

3. **No hyphens in user-facing copy.** Rewrite hyphenated compounds. "Real time" not "real-time". "Photo led" not "photo-led" (or rephrase entirely). Em dashes (—) are fine for sentence-level punctuation.

4. **No negate-then-assert patterns.** Not "We do not hide the data — we surface it all." Instead: "Every data point is visible." Say the positive thing directly.

5. **No jargon or codes.** No IUCN codes (not "NT", "VU", "EN"). No species scientific names in diver-facing UI. No abbreviations that require decoding (DHW, SST, GFW). If it needs a footnote to mean something, rewrite it.

6. **Warm run-ons are welcome.** Josie's voice favours sentences that carry the reader forward rather than stopping hard. A clause that builds naturally on the previous one is not a grammatical error — it is the brand voice.

7. **Exclamation marks are permitted** on confirmation states and moments of genuine enthusiasm. Use at most once per screen. Never on error states.

8. **Plain language.** A 16-year-old with an interest in the ocean should understand every line. If you reach for a word like "aggregates" or "synthesises", try "pulls together" first.

### Tone by surface

| Surface | Tone |
|---|---|
| Homepage | Inviting, confident, quietly exciting |
| Explore / Location / Site | Informative, precise, diver-practical |
| Upload wizard | Clear, encouraging, step-by-step |
| Broadcast confirmation | Celebratory (one exclamation mark is earned here) |
| Error states | Honest, calm, never apologetic to the point of alarm |
| Method | Rigorous, transparent, written for a curious non-expert |
| About | Personal, narrative, Josie's authentic voice — exception to the rules above |

### Copy patterns — do and don't

| Instead of... | Write... |
|---|---|
| "We're aggregating data from 63 sources" | "63 live science sources, pulled together in one place." |
| "Data unavailable" | "This data source is offline. Showing the last known reading." |
| "Upload successful!" (alone) | "Your sighting is on its way to iNaturalist, GBIF, Reef Check, and CoralWatch!" |
| "Sign in to continue" | "Sign in to submit your sighting — it takes 30 seconds." |
| "N/T species" | "Near Threatened" or drop the status label entirely |
| "Your dive-log entry" | "Your dive log entry" |

---

## 4. Component Patterns

### Page hero

**Homepage hero:**
- Full-viewport height photograph (minimum 80vh on mobile)
- Overlay: `linear-gradient(to bottom, rgba(14,28,40,0.25) 0%, rgba(14,28,40,0.65) 100%)`
- H1 in Source Serif 4 300 italic, white, centred or left-aligned (see DESIGN.md sizing)
- Subtitle: IBM Plex Sans 300 18px, white at 85% opacity
- Two CTA buttons side by side: "Explore reefs" (ghost, white border, white text) + "Upload a sighting" (yellow, dark text)
- Ghost button spec: `border: 1.5px solid rgba(255,255,255,0.7)`, `color: #FFFFFF`, `background: transparent`, `border-radius: 2px`. Hover: `background: rgba(255,255,255,0.1)`.
- Button row gap: 16px. On mobile (< 640px): stack vertically, yellow button first.

**Location detail hero:**
- Full bleed, `height: 70vh`, minimum `520px`
- Gradient bottom-anchored: `linear-gradient(to top, rgba(14,28,40,0.80) 0%, transparent 50%)`
- Bottom-anchored: reef health badge + location name (Source Serif 4 300 italic) + region label
- Sticky stats bar slides up from below on scroll past hero

**Dive site hero:**
- `height: 55vh`, same gradient treatment as location detail
- Site name (Source Serif 4 400) + location name above it (IBM Plex Mono 11px, `#FFFFFF` 70%)
- No CTA in hero — CTA lives in the upload nudge card lower on page

### Cards

See DESIGN.md component specs for ReefStateCard and ReefCard. Common rules:

- Cards are never clickable in their entirety as an invisible link wrapper. The Location name is the primary linked element; a secondary "View reef →" link appears at the bottom of the card body.
- "View reef →" uses IBM Plex Mono 11px, `#0E4F6E` (ocean). The arrow is a typographic character, not an icon.
- Cards do not truncate headings with an ellipsis on desktop. Truncate only on mobile at 2 lines maximum.

### Filter pills (Explore)

- Pill row sticks below TopNav on the Explore page (`position: sticky`, `top: 64px`, `z-index: 10`, `background: #FFFFFF`, `border-bottom: 1px solid #E7E6E2`)
- Pill anatomy: IBM Plex Sans 500 12px, `border-radius: 100px`, `border: 1px solid #E7E6E2`, `padding: 8px 16px`
- Resting state: `background: #FFFFFF`, `color: #46545E`
- Active state: `background: #0E1C28`, `color: #FFFFFF`, `border-color: #0E1C28`
- Hover (resting): `border-color: #0E1C28`
- Filter categories: Region · Reef health · Best season · Depth range
- "Clear all" link: IBM Plex Mono 11px, `#0E4F6E`, appears only when any filter is active
- Filter changes update both the map markers and the card grid simultaneously

### Upload wizard steps

Step indicator (top of wizard):

```
① Site  ──────  ② Sighting  ──────  ③ Submit
```

- Step circles: 28px diameter, `border-radius: 50%`
- Completed: `background: #0E1C28`, `color: #FFFFFF`
- Current: `background: #F6C700`, `color: #0E1C28`
- Upcoming: `background: #FFFFFF`, `border: 1.5px solid #E7E6E2`, `color: #8A949B`
- Connector lines: `1px solid #E7E6E2`, turns `#0E1C28` when step is completed
- Step labels: IBM Plex Mono 11px, below circles

Step 1 — Site selection:
- Search input with autocomplete (dive site name + location)
- Selecting a site auto-advances to Step 2 after a 300ms confirmation pulse on the selected site name

Step 2 — Sighting details:
- Photo upload (drag-drop zone + "Choose file" button for keyboard users — both paths required)
- Species tag input (text search, common names only, multi-select up to 8 species)
- Depth field (number input, metres)
- Visibility field (number input, metres)
- Water temperature field (number input, °C)
- Notes textarea (optional, 280 character limit, character counter shown)
- All fields except photo are optional beyond the site selection

Step 3 — Submit:
- Review panel: shows site name, species tags, photo thumbnail
- Sign-in gate: renders inline if user is not authenticated. Options: "Continue with iNaturalist" (OAuth) or "Sign in with email". Gate heading: "One last step — sign in to submit your sighting."
- Authenticated state: shows the user's display name + "Submit" yellow button
- Submit is the only action. No "Save as draft" at launch.

---

## 5. State Patterns

### Loading state

- Use skeleton cards — never spinners
- Skeleton anatomy: grey shimmer on the shape of the loaded element, `background: linear-gradient(90deg, #F5F4F0 25%, #EDECEA 50%, #F5F4F0 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.4s infinite`
- Explore grid: render 9 skeleton ReefCards on initial load
- Location detail stats bar: 3 skeleton stat blocks
- Species filmstrip: 6 skeleton cards (fixed width, same as live cards)
- Respect `prefers-reduced-motion`: if reduced motion, show a static light-grey placeholder with no animation

### Empty state (Explore grid, no filter results)

- Clear the card grid
- Show a single centred block:
  - Heading: Source Serif 4 400 22px: "No reefs match these filters."
  - Body: IBM Plex Sans 300 14px, `#46545E`: "Try removing a filter or broadening your region." (2 sentences max)
  - "Clear all filters" yellow button
- Map remains visible with all markers; filter pills show which filters are active

### Error state (data source unavailable)

- Do not hide the data element
- Show last-known value in its normal position
- Below the value: IBM Plex Mono 11px, `#8A949B`: "Showing last available reading. Live data temporarily unavailable."
- No red error colour on data source unavailability — this is informational, not alarming
- If no reading has ever been fetched: replace the value with "—" and the note: "Data not yet available for this site."

### Upload success

- Full-page confirmation replaces wizard content (not a toast)
- Heading: Source Serif 4 300 italic, `clamp(2rem, 3.5vw, 3rem)`: "Your sighting is on its way!"
- Subheading: IBM Plex Sans 300 18px: "We are broadcasting it to 4 research platforms now."
- Broadcast status list (animated, each row appears with a 400ms stagger):
  - iNaturalist ✓ (green IBM Plex Mono 11px "Submitted" label)
  - GBIF ✓
  - Reef Check ✓
  - CoralWatch ✓
- The checkmarks are text characters, not icons: use `✓` (U+2713) in `#2E7D5B`
- Below the list: "Find your observation on iNaturalist" — IBM Plex Mono 11px, `#0E4F6E`, links to the iNat observation URL
- Two ghost buttons: "Submit another sighting" + "Back to [site name]"

### Upload abandoned mid-wizard

- If a user navigates away after Step 2 (sighting data entered but not submitted), show a browser `beforeunload` confirmation: "Leave? Your sighting details will not be saved."
- Do not implement a custom in-app modal for this — rely on the browser native dialog
- No draft persistence at launch

### 404 state

- Full-page, white background
- Heading: Source Serif 4 300 italic: "This reef is off the map."
- Body: IBM Plex Sans 300 16px: "The location you were looking for does not exist or has moved."
- Yellow "Explore all reefs" button

---

## 6. Interaction Primitives

### Scroll reveals

Implemented with IntersectionObserver. Add `.reveal` class to elements that should animate in. When the element enters the viewport (threshold: 0.15), add `.on` class.

```css
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 500ms ease, transform 500ms ease;
}
.reveal.on {
  opacity: 1;
  transform: none;
}
```

Staggered children: add `.d1` through `.d4` classes with `transition-delay: 0ms, 80ms, 160ms, 240ms` respectively.

Reduced motion: if `prefers-reduced-motion: reduce`, skip the transform and opacity transition entirely. Apply `.on` immediately on observe.

### Counter animation

Used in StatStrip. Count from 0 to final value over 1200ms using an easing function (`easeOutExpo`). Start on IntersectionObserver entry. Respect reduced motion — show the final value without animation.

```ts
// Use requestAnimationFrame loop
// easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
```

### Drag-scroll mosaic (homepage featured reefs)

- `overflow-x: auto`, `cursor: grab`, `user-select: none`
- On `mousedown`: set cursor to `grabbing`, track `startX` and `scrollLeft`
- On `mousemove`: `scrollLeft = startX - (e.pageX - startX offset)`
- On `mouseup` / `mouseleave`: reset cursor
- Touch devices: rely on native scroll momentum, no custom touch handling needed

### Species filmstrip auto-scroll

- `requestAnimationFrame` loop increments `scrollLeft` by 1px per frame
- Pause on `mouseenter` or `focus` within the filmstrip
- Resume on `mouseleave` or when focus leaves the filmstrip
- If `prefers-reduced-motion: reduce`: disable auto-scroll entirely; filmstrip is still manually scrollable

### Nav transparent → solid transition

```ts
window.addEventListener('scroll', () => {
  const nav = document.getElementById('topnav')
  if (window.scrollY > 60) {
    nav.classList.add('nav-solid')
  } else {
    nav.classList.remove('nav-solid')
  }
})
```

`nav-solid` class applies `background: #FFFFFF`, `border-bottom: 1px solid #E7E6E2`, and switches logo/link colours from white to ink. Transition: `background 200ms ease`.

### Coral projection chart hover

- Each data point dot is hoverable
- On hover: show a tooltip with the year and coral cover %, IBM Plex Mono 12px
- Tooltip: `background: #0E1C28`, `color: #FFFFFF`, `border-radius: 4px`, `padding: 6px 10px`
- Projection zone hover: tooltip shows confidence range (e.g., "Projected 28–34% cover")
- Tooltip appears above the cursor, offset 10px

### Upload site autocomplete

- Minimum 2 characters before search fires
- Debounce: 250ms
- Show up to 8 results in a dropdown, `border: 1px solid #E7E6E2`, `border-radius: 4px`, `background: #FFFFFF`
- Each result: site name (IBM Plex Sans 400 14px) + location name (IBM Plex Mono 11px `#8A949B`)
- Keyboard: arrow keys to navigate, Enter to select, Escape to dismiss
- Selecting a site closes the dropdown and advances to Step 2 after 300ms

---

## 7. Accessibility Floor

Target: **WCAG 2.1 AA**. Every new component is reviewed against this floor before merge.

### Colour contrast

- Body text (`#0E1C28` on `#FFFFFF`): contrast ratio 17.5:1 — passes
- Secondary text (`#46545E` on `#FFFFFF`): contrast ratio 7.8:1 — passes
- Muted text (`#8A949B` on `#FFFFFF`): contrast ratio 3.5:1 — passes large text (18px+) only. Use only for labels and eyebrows at 11px where the use is decorative/supplementary and a more legible element carries the same information.
- CTA text (`#0E1C28` on `#F6C700`): contrast ratio 9.3:1 — passes
- Footer body (`#C8CDD1` on `#14191E`): contrast ratio 7.0:1 — passes
- Data colours on white: Improving `#2E7D5B` (6.0:1), Stable `#B98A2E` (3.8:1 — use with bold Mono type), Declining `#C0412B` (5.5:1) — all pass for the data label context where they appear

### Focus management

- All interactive elements have a visible `focus-visible` ring: `outline: 2px solid #F6C700, outline-offset: 2px`
- Exception: in dark contexts (footer, hero overlay links), focus ring uses `#FFFFFF`
- `:focus:not(:focus-visible)` removes the ring for mouse users — it appears only for keyboard navigation
- Upload wizard: when advancing to the next step, programmatically move focus to the step heading (`h2`) at the top of the new step content

### Keyboard navigation

- Tab order follows visual reading order (left to right, top to bottom)
- Species filmstrip: `tabindex="0"` on the scroll container, arrow keys navigate between cards
- Drag-scroll mosaic: accessible as a list of linked cards; drag is enhancement only
- Upload photo zone: keyboard users can tab to the "Choose file" button — this is the primary keyboard path, not the drag zone
- Upload wizard: no step requires drag and drop. Every interaction has a click/keyboard equivalent.
- Filter pills: all pills are `<button>` elements, not styled `<div>` or `<a>` elements
- Map: map markers are keyboard accessible via Leaflet/Mapbox built-in keyboard support; each marker links to its Location detail page

### Screen reader

- Reef health badges: include visually hidden status context. E.g., `<span aria-label="Reef health: Declining">Declining</span>`
- Coral projection chart: `role="img"` on the SVG wrapper, `aria-label` with a full plain-language description of the trend. A visually hidden `<table>` with the underlying data is present in the DOM.
- Species filmstrip: `role="list"` on the container, `role="listitem"` on each card
- Upload broadcast confirmation: broadcast status items use `aria-live="polite"` so screen readers announce each platform confirmation as it appears
- Photo upload: `<input type="file" accept="image/*">` with a descriptive `aria-label`. The drag zone is `aria-hidden="true"` — it is a visual enhancement over the input.

### Motion

- All transition and animation code is wrapped in a `prefers-reduced-motion` check
- Pattern: `@media (prefers-reduced-motion: no-preference) { /* animation */ }`
- Affected: scroll reveals, counter animation, species filmstrip auto-scroll, broadcast confirmation stagger, nav transition
- When reduced motion is active: states appear immediately (no fade/transform); counters show final value; filmstrip does not auto-scroll; broadcast confirmations appear all at once

### Alt text

- Hero photography: meaningful alt text describing what is in the photograph, not the reef name. E.g., `alt="A school of surgeonfish above a bleached coral formation in the Coral Triangle"`.
- Species thumbnails: `alt="[Common name] observed at [site name]"`.
- Logo SVG: `aria-label="Scuba Season"`, `role="img"`.
- Decorative images (none at launch — every image on the site is content-bearing).

---

## 8. Key Flows

### Flow 1 — Marco the recreational diver

**Protagonist:** Marco, 38. Recreational diver, planning a liveaboard trip to the Indo-Pacific. He wants to know which reefs are worth the journey and what species he can realistically expect to see.

**Entry:** Google search — "best reef for reef sharks 2026". Scuba Season ranks for a species probability article or a location page.

**Step 1 — Homepage.**
Marco lands on the homepage. The hero is a full-viewport underwater photograph — a reef wall covered in soft corals and a school of anthias. The headline reads: "The reef atlas built on science, made for divers." Two buttons: "Explore reefs" and "Upload a sighting". He clicks "Explore reefs".

**Step 2 — Explore page.**
The page splits: a map on the left (42% width) showing location pins, a card grid on the right. Cards show reef name, region, health label, and a preview of top species. Marco sees a filter pill bar: Region · Reef health · Best season · Depth range. He selects "Indo-Pacific" from Region and "Improving" from Reef health. The grid updates. The map zooms to the region and highlights the filtered pins. He sees 8 results.

**Step 3 — Location detail (e.g., Raja Ampat).**
Marco clicks "Raja Ampat". He lands on a full-bleed underwater hero — the location name and a green "Improving" badge over the image. A sticky stats bar slides up as he scrolls: coral cover %, water temp, species count, last sighting date. Below: the coral projection chart (solid historical line rising gently, dashed projection continuing the trend). He reads the reef state summary: "Raja Ampat is one of the most biodiverse reef systems on Earth, and the data shows it is holding." Below: a species grid with sighting odds.

**Step 4 — Species grid.**
He scans the species grid. Each species card shows a photo, common name, and sighting odds percentage. He sees "Whitetip reef shark — 82% of recent dives." A confidence note below: "Based on 47 diver-submitted sightings in the last 90 days."

**Climax:** "4 out of 5 recent dives confirmed this species." Marco stops scrolling. He has his answer. He is going to Raja Ampat.

**Step 5 — Dive site selection.**
He scrolls to the dive sites list on the Location page. Picks "Manta Sandy" based on the sighting log preview showing manta rays. Clicks through to the Dive Site page. Reads the field journal. Notes the depth and visibility. Copies the GPS coordinates to his notes app.

**Exit:** Marco bookmarks the page and goes to find a liveaboard operator.

---

### Flow 2 — Yuki the citizen scientist

**Protagonist:** Yuki, 29. Marine biology MSc student, recreational diver. She has just surfaced from a dive at a site in Okinawa. She photographed a hawksbill sea turtle and a crown-of-thorns starfish — an ecologically significant sighting. She wants it in the research record.

**Entry:** Direct — she already knows Scuba Season from a class reference to the Method page.

**Step 1 — Homepage on mobile.**
Yuki opens Scuba Season on her phone, still on the dive boat. She taps the yellow "Upload a sighting" button in the top nav.

**Step 2 — Upload wizard, Step 1: Site.**
The wizard opens full-screen on mobile. Step indicator shows: Site → Sighting → Submit. She types "Okinawa" in the site search field. A dropdown appears with 3 results. She taps "Onna Village Reef, Okinawa". The site name highlights and the wizard auto-advances to Step 2 after 300ms.

**Step 3 — Upload wizard, Step 2: Sighting.**
The photo upload zone: she taps "Choose photo" (not the drag zone — she is on mobile). Her camera roll opens. She selects the turtle photograph. A thumbnail appears in the upload zone. She types "hawksbill" in the species field — autocomplete suggests "Hawksbill sea turtle". She selects it. She adds "Crown-of-thorns starfish" as the second species. Depth: 12m. Visibility: 18m. Notes: "Crown-of-thorns present near table coral at 12m, approx. 6 individuals." She taps "Continue".

**Step 4 — Upload wizard, Step 3: Submit.**
She is not signed in. The sign-in gate appears inline: "Sign in to submit your sighting — it takes 30 seconds." She taps "Continue with iNaturalist" — she already has an iNat account. OAuth handshake. She returns to the wizard, now authenticated. Her iNat display name shows. She taps "Submit".

**Climax:** The broadcast confirmation screen appears. The heading: "Your sighting is on its way!" Four rows appear in staggered sequence, each with a green ✓:
- iNaturalist ✓ Submitted
- GBIF ✓ Submitted
- Reef Check ✓ Submitted
- CoralWatch ✓ Submitted

"Find your observation on iNaturalist" — she taps through and sees her turtle photo already live. The data is in the research record.

**Exit:** Yuki taps "Submit another sighting". She uploads the crown-of-thorns photograph as a second observation.

---

### Flow 3 — Dr. Chen the reef researcher

**Protagonist:** Dr. Akari Chen, 44. Coral reef ecologist at a university in Singapore. She encountered a citation to Scuba Season in a preprint on citizen science data aggregation. She wants to understand the methodology before deciding whether to cite the platform in her own work.

**Entry:** Direct link to `/method` from the preprint reference.

**Step 1 — Method page.**
Dr. Chen lands directly on the Method page. The page is text-rich — more like a paper than a product page. A row of source cards at the top: each card names a data source (NOAA Coral Reef Watch, Global Fishing Watch, iNaturalist, GBIF, CoralWatch, etc.), the type of data it provides, and its refresh frequency. IBM Plex Mono type throughout the data values. Each source card has an external link to the source's own documentation.

**Step 2 — How we read a reef.**
She scrolls to the "How we read a reef" section. A structured explanation: how the three reef health labels (Improving, Stable, Declining) are assigned, which sources contribute to each, and what triggers a label change. No jargon. Each technical term is defined inline on first use.

**Step 3 — Sighting probability.**
She reads the sighting probability methodology: Bayesian inference on the last 90 days of submitted sightings, weighted by diver-reported visibility and depth, cross-referenced with species range data from OBIS. Clear. She can cite this.

**Step 4 — Data gap section.**
At the bottom of the Method page: a "Data gaps" section. A table of known gaps: which reef regions have fewer than 10 sightings in the last 90 days, which species have no submitted photographs. Below the table: "Researchers who want to collaborate on filling these gaps — reach out at hello@scubaseason.fun."

**Climax:** Dr. Chen reads the data-gap table and realises that Scuba Season is pulling together coral cover data, fishing pressure data, and diver sightings into a single per-site read — something no single source she is aware of has done at this scale. The platform is not one source; it is the synthesis of 63 sources into something new. She adds it to her citation list and sends the methodology URL to a colleague.

**Exit:** Dr. Chen opens a new email tab and writes to hello@scubaseason.fun about a potential data partnership.

---

## Appendix: Page-level layout summary

### Homepage
```
[TopNav — transparent over hero]
[Hero — full viewport, dual CTA]
[StatStrip — yellow border rules, 5 stats, counter animation]
[Reef State Trio — 3 photo cards, horizontal at desktop]
[Featured Reef Mosaic — drag-scroll, 4–6 location photos]
[Species Filmstrip — auto-scroll horizontal]
[Citizen Science 50/50 Split — photo left, copy+CTA right]
[Method Strip — brief source count + link to Method page]
[Footer]
```

### Explore
```
[TopNav — solid]
[Filter Pill Bar — sticky below nav]
[Split layout: Map 42% sticky left | Card Grid 58% scrollable right]
[Footer — below card grid, accessible after scrolling]
```

### Location Detail
```
[TopNav — transparent over hero]
[Hero — 70vh, full bleed, location name + health badge]
[Sticky Stats Bar — slides up on hero scroll-past]
[Coral Projection Chart]
[Species Grid — sighting odds]
[Dive Sites List — links to site pages]
[Plan-a-Trip Aside — best season, depth range, nearest airport note]
[Upload Nudge Card — yellow border]
[Footer]
```

### Dive Site
```
[TopNav — transparent over hero]
[Hero — 55vh, site name + parent location]
[Conditions Strip — depth, visibility, water temp, last updated]
[Sighting Field Journal — log of submitted sightings]
[Upload Nudge Card — yellow border]
[Footer]
```

### Upload
```
[TopNav — solid, no hero]
[Wizard Container — centred, max-width 640px]
  [Step Indicator]
  [Step 1: Site selection]
  [Step 2: Sighting details]
  [Step 3: Sign-in gate + submit]
[Broadcast Confirmation — full-screen replacement]
[Footer — visible below wizard on desktop]
```

### Method
```
[TopNav — solid]
[Page header — Source Serif 4, H1]
[Source Cards Grid — 3 col desktop, 2 col tablet, 1 col mobile]
[How We Read a Reef — prose + structured list]
[Sighting Probability — methodology prose]
[Data Gap — table + contact note]
[Footer]
```

### About
```
[TopNav — solid]
[Founder narrative — intentionally text-heavy, Josie's voice]
[Photo of Josie — optional, at her discretion]
[Nonprofit mission statement]
[Contact: hello@scubaseason.fun]
[Footer]
```

The About page is exempt from the "less text, more visual flow" design direction. It is a founder story. Its length, its run-ons, its personal voice — all intentional. Do not simplify it.
