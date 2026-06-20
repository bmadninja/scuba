---
# DECISIONS.md — Autonomous Redesign Build
All forks, taste calls, and deviations logged here. Append; never overwrite.

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Kept legacy `--atlas-*` CSS variables as aliases to new light tokens | Existing components use `var(--atlas-bg)`, `var(--atlas-ink)` etc. Remapping them to the new light values avoids a mass search-and-replace across all components while maintaining correct rendered output under the new token system. |
| 2 | `ReefHealthBadge` uses `improving/stable/declining` state names; `ReefStateBadge` keeps `thriving/pressure/change` | The data layer uses `thriving/pressure/change`. The new badge is for display purposes and uses the design spec names. The old badge re-exports the new one alongside itself so both work without touching data files. |
| 3 | Logo updated to text-only wordmark (removed SVG water-drop icon) | Design system rule: no icons in UI (UX-DR20). Logo is now Source Serif 4 "Scuba Season" text. `dark` prop kept for API compatibility. |
| 4 | AtlasNav `HeroNav` variant removed | New nav handles transparent/solid state via scroll detection on a single component. The hero variant was only used on pages that are now on the Epic 2 backlog. Removing it reduces duplicate code and avoids the old `hideLayoutNav` complexity for the nav. |
| 5 | Footer hover colors implemented via `<style>` block CSS (not inline `onMouseEnter`) | AtlasFooter is a Server Component. Event handlers cannot be passed in RSC. CSS `:hover` achieves the same hover-to-yellow effect without requiring `"use client"`. |
| 6 | Fixed pre-existing bug in `src/lib/atlas-location.ts` line 177 | 358/380 sites have no `species` field. `s.species.map(...)` crashed with "Cannot read properties of undefined". Added `?? []` null-coalesce guard. Not a data write — guard is in application code only. |
| 7 | Nav search input uses `rounded-sm` (2px radius) not pill shape | Pill search was part of old Kimi rebrand aesthetic. New design uses rectangular elements (border-radius 2px per spec). |
| 8 | `/explore` route not yet created (Epic 3); nav "Explore" link points to `/locations` | Spec says `/explore` but that route is Epic 3 scope. Using `/locations` as fallback so nav is functional on Epic 1 delivery. |
