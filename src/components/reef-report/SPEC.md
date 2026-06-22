# Reef Report Card — component spec

## What this replaces

The existing "Reef health" section on location pages renders:
1. A prose condition sentence
2. A data card with coral cover text + optional projection chart
3. A metrics row of small cells: Bleached % · Heat stress (DHW) · Heat right now · Reef state

**Replace the metrics row entirely** with the three-pillar reef report card described below. The prose sentence above the card and the projection chart inside the card are unchanged.

---

## Design intent

Answer "should I dive here, and is this a good time to go?" — not "here are some numbers."

Every data point is interpreted before it reaches the user. The raw number is evidence for the verdict, not the headline. No numbers appear inside the pillars themselves.

---

## Structure

```
[verdict badge]   e.g.  ● Excellent diving
[synthesis sentence]    One paragraph that names the key facts and their implication.

┌─────────────────┬─────────────────┬─────────────────┐
│  Coral health   │  Biodiversity   │  Right now      │
│                 │                 │                 │
│  [verdict]      │  [verdict]      │  [verdict]      │
│  [one sentence  │  [one sentence  │  [one sentence  │
│   of context]   │   of context]   │   of context]   │
└─────────────────┴─────────────────┴─────────────────┘
[source line]     MERMAID · iNaturalist · NOAA CRW
```

---

## Verdict badge

Sits above the synthesis sentence. One of four states:

| Label | Colour tone | When |
|---|---|---|
| Excellent diving | green | coral stable/up + biodiversity high + heat ≤ watch |
| Worth diving — check season | amber | coral declining OR heat elevated |
| Reef in recovery | red | coral severely degraded (< ~20%) |
| Data limited | neutral/grey | insufficient data to synthesise |

---

## Synthesis sentence

One paragraph, 2–3 sentences max. Written in Josie's voice (no contractions, warm, plain language, no hyphens). Names the coral cover figure and trend, the biodiversity tier, and the current heat status — then draws the "so what" conclusion for the diver.

Examples by scenario:

**Thriving:**
> Raja Ampat is one of the most biodiverse reefs on the planet — 34% live coral cover, stable over 6 years of surveys, and exceptional marine biodiversity. Thermal stress is mild right now, making this a strong time to visit.

**Under pressure:**
> Lombok's reef is under pressure. Coral cover has fallen from 41% to 28% since 2017, and heat stress is elevated right now. Biodiversity remains moderate. The dry season (May–September) gives the best diving conditions.

**Degraded:**
> Aqaba's reef has lost most of its live coral to bleaching and sedimentation — only 12% cover remains, down from 31% in 2012. Diving here is a conservation experience more than a pristine reef dive.

---

## Three pillars

### Pillar 1 — Coral health

**Data source:** `reef-health.json` → `observed.coralCoverPercent` + `observed.historicalCoralCoverPercent` + `observed.historicalSurveyDate`

**Verdict logic:**

| Verdict | Colour | Condition |
|---|---|---|
| Thriving | green | cover ≥ 30%, no historical decline (or improving) |
| Stable | green | cover ≥ 20%, decline < 5 points since baseline |
| Declining | amber | cover fell > 5 points since baseline |
| Severely degraded | red | current cover < 15% |
| No data | neutral | no MERMAID record for this location |

**Context sentence:** Describes the trend in plain language. If a historical baseline exists, mention both figures and the year span. If not, just state the current reading.

---

### Pillar 2 — Biodiversity

**Data source:** `species-diversity.json` → `speciesRichness` (iNaturalist research-grade, 30 km radius)

**Caveat:** Counts are inflated for urban/coastal locations (Hong Kong, Nice) because terrestrial observations are included. The verdict is calibrated relative to other *reef* destinations, not all 601 locations.

**Verdict logic (vs. reef-destination median ~1,023):**

| Verdict | Colour | Threshold |
|---|---|---|
| Exceptional | green | ≥ 2,000 species |
| High | green | ≥ 1,300 species |
| Moderate | neutral | ≥ 700 species |
| Low | red | < 700 species |
| No data | neutral | missing from species-diversity.json |

**Context sentence:** Translates the tier into what a diver will actually experience ("Expect abundant marine life on every dive" vs "Fewer species than most reef destinations").

---

### Pillar 3 — Right now

**Data source:** `reef-health.json` → `thermalStress.alertLevel` (NOAA CRW, live daily via `fetch-reef-health-live.mjs`)

Alert level mapping:

| NOAA level | Verdict | Colour | Context sentence |
|---|---|---|---|
| `no-stress` | No heat stress | green | Thermally stable. Good conditions for reef health. |
| `watch` | Mild heat stress | amber | Watch-level alert. Some bleaching possible in shallows; deeper dives are unaffected. |
| `warning` | Moderate heat stress | amber | Warning-level stress. Bleaching likely in shallow areas. Plan deeper dives. |
| `alert-1` | High heat stress | red | Alert-level bleaching event ongoing. Avoid shallows; visibility may be reduced. |
| `alert-2` | Severe heat stress | red | Mass bleaching conditions. Reef is actively bleaching across all depths. |
| missing | Heat data unavailable | neutral | NOAA satellite data not available for this location. |

---

## Styling notes

- Three pillars sit in a CSS grid: `repeat(3, minmax(0, 1fr))`, 1px gap, rendered as background colour on a wrapper (so gaps look like dividers).
- Each pillar: icon (Tabler outline, 17–18px) → mono uppercase label → coloured verdict text → grey context sentence. No numbers, no stats row.
- Verdict colours must use the rebrand's semantic token equivalents: green → `--color-text-success` or equivalent, amber → `--color-text-warning`, red → `--color-text-danger`.
- Source attribution sits below the card in 10px mono, e.g. `MERMAID · iNaturalist · NOAA CRW`. Only show sources that actually contributed data for this location.
- The entire section is conditionally rendered: if none of the three pillars have data, fall back to the existing `conditionSentence` text only (no card).

---

## Data availability (as of 2026-06-20)

| Signal | Coverage |
|---|---|
| Coral cover (MERMAID) | 75 of 601 locations |
| Species richness (iNaturalist) | 601 of 601 locations |
| Thermal stress (NOAA CRW) | ~580 locations (excludes landlocked/no-ocean) |

Biodiversity data exists for every location, so every location page will show at least one populated pillar.

---

## Files to touch

| File | Change |
|---|---|
| `src/app/locations/[slug]/page.tsx` | Add `speciesDiversity` to view-model; compute pillar verdicts server-side |
| `src/app/locations/[slug]/location-page-body.tsx` | Replace metrics row with `<ReefReportCard>` component |
| `src/components/reef-report/ReefReportCard.tsx` | New component (create this file) |
| `src/lib/data/species-diversity.ts` | Already exists — `getSpeciesDiversityByLocationId(locationId)` |

The pillar verdict logic (coral/bio/heat → label + colour + sentence) should live server-side in `page.tsx` so `ReefReportCard` receives pre-computed strings and is purely presentational.
