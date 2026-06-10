# Homepage UX Redesign
**Author:** Sally (UX Designer) · **Date:** 2026-06-05  
**Status:** Spec — ready for implementation

---

## Problem statement

The homepage speaks to the team, not to users. "A data atlas for the living ocean" is an internal positioning statement. No user arrives thinking that. They arrive thinking one of four things — and the page fails all of them above the fold.

A second gap: the science org / researcher audience is completely absent. This is the audience that unlocks grant credibility with Schmidt Marine and NatGeo.

---

## The 4 personas

| Persona | Arrives thinking | Current failure |
|---|---|---|
| **Diver with a window** | "Where should I go in [month]?" | Nothing above the fold answers this. The filter is buried 3 scrolls down. |
| **Species chaser** | "Where will I actually see whale sharks?" | `/where-to-see/[species]` exists but is totally undiscoverable from the homepage. |
| **First-timer** | "Is diving for me? What would I even see?" | Served by `/for` and `/dive-in` but neither is linked from the homepage. |
| **Researcher / science org** | "Can you direct divers to our monitoring sites?" | Completely absent from the entire site. |

---

## New page structure (top to bottom)

```
1. HERO                    — what can I do here?
2. IN SEASON NOW           — where to go this month (dynamic)
3. FIND BY SPECIES         — what do you want to see?
4. DIVE WITH PURPOSE       — NEW: citizen science + researcher funnel
5. THE FULL ATLAS          — browse everything (existing, simplified)
6. TRUST STRIP             — data credentials (radically shortened)
```

---

## Section specs

---

### 1. HERO

**One job:** Get the user into the right flow within 5 seconds.

**Headline (replace current):**
```
Find where to dive.
```

**Sub-line (replace current 2-line serif block):**
```
In season now. Real sighting records.
```
Max 8 words. No more than one line. No serif italic.

**Primary actions — two entry points, equal weight:**

```
[ What do you want to see? → ]     [ Where's in season now? → ]
```

- "What do you want to see?" → scrolls to Section 3 (species pills) or opens atlas pre-filtered
- "Where's in season now?" → scrolls to Section 2 (in-season grid)

Both are text links with arrow, not heavy CTA buttons. Light weight — this is a utility site, not a landing page.

**Stat strip (keep, simplify):**
```
[reefCount] locations  ·  [inSeasonCount] in season in [Month]  ·  [sourceCount] data sources
```
Remove "5 km satellite resolution" — too technical for above the fold.

**What to remove from hero:**
- The serif italic subline ("Ongoing science and daily monitoring…") — cut entirely
- "Live · NOAA Coral Reef Watch" eyebrow — cut entirely. Too technical for above the fold; NOAA attribution lives in the trust strip ("38 data sources — NOAA, AIMS…")

---

### 2. IN SEASON NOW

**Replaces:** The hardcoded 3-card "inspiration grid" (Raja Ampat, Palau, Azores)

**Concept:** Show 4–6 locations currently in their best months, sorted by reef state (Thriving first), dynamically calculated from today's date.

**Section header:**
```
EYEBROW:  Diving this month
H2:       Best season right now — [Month] [Year]
```

**Card spec (compact, 4–6 cards in a horizontal scroll on mobile / 2-row grid on desktop):**
- Location name (large)
- Region (small, muted)
- Reef state badge (Thriving / Under pressure / Witnessing change)
- Animal tags — top 2 only
- "In season" green dot indicator

**No editorial curation needed.** Auto-calculated from `inSeason(bestMonths)` filtered to current month. If more than 6 qualify, sort by: Thriving > Under pressure > Witnessing change, then alphabetical.

**Footer link:**
```
View all [n] in-season locations →
```
Links to atlas with month filter pre-applied to current month.

**What this fixes:** Surfaces the most useful answer to the #1 user question ("where should I go now?") without requiring the user to find and operate the filter.

---

### 3. DIVE WITH PURPOSE *(new section)*

**Concept:** Two audiences in one section — recreational divers who want their dive to mean something, and science orgs who need diver-generated data at specific sites.

**Visual layout:** Two-column card inside a dark (navy) background section.

---

#### Left column: FOR DIVERS

**Heading:**
```
Make your dive count.
```

**Body (max 20 words):**
```
When you dive a site that needs data, we'll tell you exactly what to do and where to submit it.
```

**What divers can do — show 3 concrete actions as a minimal list:**

| Icon | Action | Program | Friction |
|---|---|---|---|
| 📸 | Photograph a manta's belly spots | Manta Matcher | Zero — just submit a photo |
| 🪸 | Color-match 10 corals against a chart | CoralWatch | 15 min, no training |
| 🐟 | 10-min fish count at a marked site | REEF / Eye on the Reef | Free online training |

**Displayed on page as 3 icon rows, not a table. Each row:**
- Icon + short action description (one line)
- Program name as a subtle external link
- Friction indicator: "Zero effort" / "10 minutes" / "Free training"

**CTA:**
```
See which sites need your eyes →
```
→ Links to atlas pre-filtered to `freshOnly: true` (sites with oldest survey data, i.e., most data-hungry)

---

#### Right column: FOR RESEARCHERS

**Heading:**
```
Monitoring a reef?
We'll send you fresh eyes.
```

**Body (max 20 words):**
```
136 sites in our atlas have no sighting records. Tell us where you need divers — we'll direct them there.
```

The 136 number is live from the product charter data gap. It's honest, which builds grant credibility.

**CTA:**
```
Get in touch →
```
→ `mailto:` link or `/about#research-partners` anchor (to be decided with Josie)

---

**Why this section matters for grants:**  
Schmidt Marine and NatGeo reviewers will land on this page. Showing that scubaseason.fun actively closes data gaps — and explicitly acknowledges where those gaps are — signals scientific integrity, not boosterism.

---

### 4. THE FULL ATLAS

**Keep `AtlasExplorer` + `AtlasFilterRail` as-is.** No changes to the filter behaviour or layout.

**Section header (simplified):**
```
EYEBROW:  All locations
H2:       [reefCount] reefs across [regions.length] regions
```

The existing sidebar filter rail already handles animal taxonomy correctly — nested `<details>` groups (What to see → Sharks & rays → Sharks / Hammerheads / …; Marine mammals → …; etc.) plus Reef state, Season, Region below. No additional pills row needed.

The "What do you want to see?" hero CTA scrolls to this section. The filter's "What to see" group is open by default so animal options are immediately visible on arrival.

---

### 6. TRUST STRIP

**Replaces:** The current 3-column section with 3-line paragraphs per stat (~120 words total)

**New: 3 one-liners + a link. That's it.**

```
38 data sources — NOAA, AIMS, IUCN, GFW, iNaturalist and more.  [Full source list →]

Live thermal data — re-checked against NOAA's 5 km satellite feed every night.

0 marketing adjectives — if a reef is degraded, we say so.
```

**Background:** Keep `#f8fafc` (light grey). Remove the large ghost numbers (`3.25rem` "38" and "0") — they're decorative noise.

**"Full source list →"** links to `/data`.

---

## What to DELETE entirely

| Section | Why |
|---|---|
| **Reef states explainer section** (between hero and inspiration grid) | Reef state badges already appear inline on every card. The definition belongs on `/about` or a tooltip, not a full homepage section. Removing it saves 1 full scroll. |
| **Serif italic hero subline** | Tone mismatch — feels like a magazine, not a tool. |
| **Ghost stat numbers** in trust strip (`3.25rem` "38" and "0") | Visual decoration that adds no information. |
| **"Filter, sort, or search above"** instruction text | Patronising. The UI is self-explanatory. |

---

## Text budget rule

**12 words max per paragraph on the homepage.** If a thought takes more than that, it belongs on a deeper page. Every section above respects this limit.

---

## Copy changes by section (before → after)

| Location | Before | After |
|---|---|---|
| Hero H1 | "A data atlas for the living ocean." | "Find where to dive." |
| Hero subline | "Ongoing science and daily monitoring — not a one-time write-up." | "In season now. Real sighting records." |
| Metadata title | "scubaSeason.fun — a data atlas for the living ocean" | "scubaSeason.fun — find where to dive" |
| Metadata description | "Browse every tracked reef by coral health, thermal stress and survey freshness…" | "Find dive sites in season now, with real sighting records and live reef health data." |
| Featured section H2 | "Something remarkable, right now" | "Best season right now — [Month]" |
| Atlas section eyebrow | "The full atlas" | "All locations" |
| Atlas section subtext | "[n] locations · [n] regions / Filter, sort, or search above" | "[n] reefs across [n] regions" |

---

## Decisions (confirmed 2026-06-05)

1. **"Get in touch" CTA** → `mailto:hello@scubaseason.fun`
2. **"See which sites need your eyes" link** → atlas pre-filtered to locations with zero sighting records (no dedicated page needed for now)
3. **First-timer flow** → deferred, not a homepage concern
4. **Citizen science display** → Option B: 3-card row (icon, title, 2-line description, external link, effort label)

---

## Implementation notes for dev

- Section 2 (In Season Now): reuse existing `inSeason(bestMonths)` logic already in `page.tsx:112`. Filter `filterLocs` where `inSeason === true`, sort by state priority (thriving → pressure → change), slice to 6.
- Section 3 (Find by Species): import `WILDLIFE_TAXONOMY` from `@/lib/atlas-location` — same source the filter rail uses. Pill click → `/where-to-see/[slug]` where slug maps from tag name, or fallback to atlas with `animals` filter pre-set.
- Section 4 (Dive With Purpose): Static content section, no new data dependencies. The "136 sites" number should be dynamic — compute it the same way `reefCount` is computed, as `allLocs.filter(l => !l.hasSightings).length` or equivalent.
- Section 5 (Atlas): No changes to `AtlasExplorer` component. Header text only.
- Section 6 (Trust Strip): Remove long paragraph JSX, replace with 3 one-line `<p>` elements.

---

*Sally — UX Designer · scubaseason.fun homepage redesign · 2026-06-05*
