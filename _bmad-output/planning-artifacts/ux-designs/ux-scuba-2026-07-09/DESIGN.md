---
name: Protection outcome display
status: final
updated: 2026-07-09
colors:
  emphasis-improving: "#2E7D5B"
typography:
  emphasis-weight: 700
---

## Brand & Style

Quietly credible. The protection story is told in the reef's own narrative voice, not in a stat wall. Numbers earn attention through one restrained emphasis treatment, never through cards, badges, or colour blocks. The takeaway to leave a reader with is simply: protection actually works.

## Colors

- `emphasis-improving` `#2E7D5B` — the site's existing "Improving" green. Used only to emphasise the key protection figures inline in the reef-state basis. No new colours introduced.

## Typography

- Protection figures inside the reef-state basis render at `emphasis-weight` 700 in `emphasis-improving`. Everything around them stays in the standard reef-state body style (`--font-sans`, `#4A5568`). Two weights only: body 400, emphasised figure 700.

## Components

No new component. The design is a text-emphasis convention plus reuse of two existing surfaces:
- **Reef-state basis paragraph** (location page) — carries the ecological proof, with the lead figures emphasised.
- **Location overview paragraph** — carries the economic + area outcomes as prose.
- **Reef-state sources row** — the single citations home (existing).

### Emphasis convention
Wrap a figure in `**…**` inside the `manualReefStateBasis` string. The renderer (`emphasizeBasis` in `location-page-body.tsx`) converts each wrapped span to `<strong>` in `emphasis-improving`. Plain text passes through untouched, so the convention is opt-in per reef and safe for every other basis string.

## Do's and Don'ts

- Do lead with the ecological proof (fish recovery); it is the "protection works" claim.
- Do keep the eye-popping economic number (e.g. $10,500) in prose, not as a giant stat — understatement reads as more credible here, not less.
- Do keep the honest scope caveat with the figure's source (Torre-specific vs Mediterranean-reserve average).
- Don't build a separate protection block, page, or nav entry — the outcomes live in the reef's own narrative.
- Don't emphasise more than the two or three figures that carry the story; blanket bolding kills the quiet.
- Don't duplicate a figure across the reef-state basis and the overview — one home each.
