---
name: Protection outcome display
status: final
updated: 2026-07-09
sources:
  - "reef-pressure.json (manualReefStateBasis, manualReefStateSourceIds)"
  - "location-details.json (extendedDescription)"
  - "blue-parks.json (level, year, parkName)"
---

## Foundation

Responsive web, mobile primary, desktop the wider canvas. No UI system beyond the site's existing tokens; visual identity in DESIGN.md. This is a behavioural pattern layered onto the existing location page, not a new screen.

## Information Architecture

Marine-protection outcomes are distributed across two existing paragraphs on the location page, by job, with a single citations home:

- **Reef-state basis** — the ecological proof: reef state ("Strongly protected and recovering") plus the fish figures (seabream density, fish biomass), with the lead figures emphasised per DESIGN.md `{colors.emphasis-improving}`.
- **Location overview** — the economic + area outcomes (fisher earnings, protected-area expansion) as prose, framed causally: the protection produces the earnings.
- **Reef-state sources row** — every citation lives here (`manualReefStateSourceIds`), never inline and not in a bespoke modal. This is the "info, not page jump" home.

Superseded and removed: a standalone protection block/chips, a `/protection` page, and a Protection nav entry.

## Voice and Tone

Quietly credible, the reef narrating its own recovery. No contractions, no hyphens in copy, digits. Causal honesty: the earnings jump is the protection working (the no-take core is a savings account; fish spill out; fishers earn more). Scope honesty: each figure's source states whether it is Torre-specific or a Mediterranean-reserve average.

## Component Patterns

- **Emphasised figure** — a `**…**`-wrapped span in the basis string renders as a bold green `<strong>`. Behavioural rule: opt-in per reef; unwrapped basis strings render exactly as before.

## State Patterns

Reusable across every Blue Park / MPA reef; the pattern degrades by data available:
- **Rich** — reef with measured outcomes: emphasised ecological figures in the basis, economic/area prose in the overview, full source list.
- **Partial** — only some figures exist: include what is present, drop the rest; no empty scaffolding.
- **Badge-only** — reef is a Blue Park but has no measured outcomes: the existing Blue Park badge stands alone; the basis carries no invented figures.
- **None** — no protection data: unchanged existing behaviour.

## Accessibility Floor

Emphasis is conveyed by weight AND colour together, never colour alone. `<strong>` carries semantic weight for assistive tech. Green `#2E7D5B` on the page paper meets contrast for body text.

## Key Flows

**Jonah — a diver comparing Mediterranean reefs on his phone the night before booking.** He opens Torre Guaceto. The reef-state line reads "Strongly protected and recovering," and two numbers catch his eye in green: fish **3 to 7 times denser** inside the protected zone, biomass **around 8 times** that of fished coast. He scrolls to the overview and reads that the fishers themselves earn far more because the protection works, and that it is expanding. Climax beat: he believes the label — not because it is asserted, but because the numbers and their sources are right there, quietly. He taps a source once to confirm, and books.
