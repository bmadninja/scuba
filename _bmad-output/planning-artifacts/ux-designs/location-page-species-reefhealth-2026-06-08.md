# Location Page — Species & Reef Health Redesign
**Author:** Sally (UX Designer) · **Date:** 2026-06-08  
**Status:** Spec — ready for implementation  
**Scope:** `src/app/locations/[slug]/page.tsx` only

---

## Problem summary

Two sections on the location page fail to communicate useful information to a diver.

| Section | Failure |
|---|---|
| **Reef health** | "What the data says" heading is vague. "Watch" badge is unreadable without context. |
| **Species cards** | No photos load for most species. Placeholder is a dark gradient — communicates nothing. Card sub-copy ("24 days ago · Japanese battleship Nagato") answers the wrong question. Heading "Notable species across all sites" is wordy and cold. |

---

## Section 1 — Reef health

### Current state
```
REEF HEALTH
What the data says

[ Coral cover  ?  ]  56% ↑  up 2 pts since 2014 · 2024
[ Thermal status ? ]                              Watch (amber badge)
```

### Problems
- "What the data says" — journalistic, not utility. Doesn't orient a diver.
- "Watch" badge in isolation — users don't know if this is good, bad, or urgent.

### Redesign

**Section heading:** `Reef condition` (replaces "What the data says")

**Coral cover row** — no change to layout or data. Keep as-is.

**Thermal status row** — replace the standalone badge with an inline plain-language label:

| Alert level | Current display | New display |
|---|---|---|
| `no-stress` | Normal (grey badge) | `Normal — no thermal stress` |
| `watch` | Watch (amber badge) | `Watch — sea temp above normal, no active bleaching` |
| `warning` | Warning (orange badge) | `Warning — elevated heat stress, bleaching risk elevated` |
| `alert-1` | Alert Level 1 (red badge) | `Alert Level 1 — active bleaching likely` |
| `alert-2` | Alert Level 2 (red badge) | `Alert Level 2 — severe bleaching in progress` |

Display as: colored text label (same color as current badge) + em dash + plain English explanation. No pill/badge needed.

Keep the `?` InfoTooltip on "Thermal status" label — it's useful for the definition.

---

## Section 2 — Species cards

### Current state
```
WHAT YOU'LL FIND HERE
Notable species across all sites

[ dark teal gradient ]  [ dark teal gradient ]  [ dark teal gradient ]
Grey Reef Shark          Pygmy Seahorse           Green Sea Turtle
● 24 days ago · Japanese battleship Nagato   ● 24 days ago · Ambon Bay   ● 24 days ago · Heron Island
```

### Problems
1. **No photos load** — `imageUrl` is null for most species. Dark gradient placeholder is worse than no image.
2. **Sub-copy is wrong** — "24 days ago · [dive site name]" answers "where specifically was it logged" not "when can I expect to see it". The site name is implementation detail, not user value.
3. **Heading** — "Notable species across all sites" is long and cold.

### Redesign

#### Heading
```
WHAT YOU'LL FIND HERE
What you'll see here
```
Drop "across all sites" — it's implied.

#### Card layout — two states

**State A: photo exists** (`imageUrl` is non-null)

```
┌─────────────────────────┐
│   [species photo]       │  ← 140px tall, object-fit: cover
├─────────────────────────┤
│ Grey Reef Shark         │  ← species name, bold
│ ● Seen 24 days ago      │  ← dot color: green ≤14 days, amber >14 days
│   Year-round            │  ← reliability label, muted
└─────────────────────────┘
```

**State B: no photo** (`imageUrl` is null or fails to load)

Do NOT show a gradient placeholder. Replace with a species-type icon in a neutral `#f1f5f9` background:

| Species type hint | Icon |
|---|---|
| Shark / ray / manta | 🦈 (or inline SVG silhouette) |
| Turtle | 🐢 |
| Whale / dolphin | 🐬 |
| Fish (other) | 🐟 |
| Octopus / cephalopod | 🐙 |
| Default | 🐠 |

Icon centred on `#f1f5f9` background, 48px, same 140px height as photo state.

Type hint is derived from `animalTags` or `commonName` keyword match — simple string check, no new data needed.

#### Sub-copy

**Remove:** site name from sub-copy entirely.

**New format (two lines):**
```
● Seen [relative time]          ← if lastConfirmedAt exists
  [Reliability label]           ← if reliability exists: "Year-round" / "Seasonal" / "Rare"
```

If neither `lastConfirmedAt` nor `reliability` exists: show nothing below the name.

**Dot color rule** (keep existing): green ≤14 days, amber >14 days, grey if no date.

#### IUCN badge
Keep inline next to species name. Keep `noLink` prop (already fixed — no nested anchor). The `?` tooltip stays.

#### Grid
No change — keep 3-column grid on desktop, same responsive behaviour.

---

## Copy changes

| Location | Before | After |
|---|---|---|
| Species section heading | "Notable species across all sites" | "What you'll see here" |
| Reef health section heading | "What the data says" | "Reef condition" |
| Thermal status display | Badge only ("Watch") | Colored text + plain English ("Watch — sea temp above normal, no active bleaching") |
| Species card sub-copy | "24 days ago · Japanese battleship Nagato" | "Seen 24 days ago" + "Year-round" on second line |

---

## Implementation notes

- **Thermal status plain-English map** — add a `THERMAL_LABEL` constant in `locations/[slug]/page.tsx` keyed by `bleachingAlert` value. Five entries (see table above). Color matches current badge color.
- **Species icon fallback** — add a `getSpeciesIcon(commonName: string): string` helper in the same file. Simple `includes()` keyword check on commonName. Returns an emoji string. Called when `imageUrl` is null/undefined.
- **Remove site name from sub-copy** — delete the ` · ${siteName}` interpolation from wherever it's constructed. The site name was surfaced as context but isn't needed on the location page (user already knows the location).
- **Reliability label** — already in the `Creature` type as `reliability?: "year-round" | "seasonal" | "rare"`. Display it as title-case below the sighting date. Muted color (`#94a3b8`).

---

*Sally — UX Designer · scubaseason.fun location page · 2026-06-08*
