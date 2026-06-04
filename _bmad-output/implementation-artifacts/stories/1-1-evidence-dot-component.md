---
baseline_commit: 45036be9b46258e1e5b52287066438ecbc6062e3
status: review
---

# Story 1.1: EvidenceDot Component — Four-State Confidence Badge

As a species chaser evaluating any site,
I want a consistent `EvidenceDot` component that renders one of four states — confirmed, likely, uncertain, or "No sighting records yet" — on both SiteCard and site detail hero,
So that evidence quality is communicated with a single recognizable visual vocabulary across every surface.

## Acceptance Criteria

**Given** `confidence: "high"` passed to `<EvidenceDot>`
**When** the component renders
**Then** a `size-1.5 rounded-full bg-emerald-500` dot renders alongside the text label "Confirmed sighting on record"; dot has `aria-hidden="true"`

**Given** `confidence: "medium"`
**When** the component renders
**Then** dot is `bg-amber-500` with label "Likely"

**Given** `confidence: "low"`
**When** the component renders
**Then** dot is `bg-orange-500` with label "Uncertain"

**Given** `confidence={null}` (no sighting record)
**When** the component renders
**Then** dot is `bg-slate-300` with label "No sighting records yet"
**And** on SiteCard, a tooltip reads "No confirmed occurrence records clustered near this site yet. We are backfilling sighting evidence site by site."

**Given** the component lives at `src/components/evidence-dot.tsx`
**When** both `SiteCard` and the site detail page are updated to use it
**Then** both surfaces render identical dot colors and labels for the same confidence value, eliminating duplicated inline dot logic

**Given** `creatures.length === 0` on the site detail page
**When** the meta badges row renders
**Then** a "No sighting records yet" pill badge appears in the meta row (muted grey, `rounded-full`) before the user needs to scroll

## Tasks/Subtasks

- [x] Create `src/components/evidence-dot.tsx` with 4 confidence states
- [x] Refactor `SiteCard` to use `<EvidenceDot>` instead of inline `CONFIDENCE_DOT` record
- [x] Add "No sighting records yet" pill badge to site detail meta row when `creatures.length === 0`
- [x] Verify build passes with no TypeScript errors

## Dev Notes

- `SiteCard` at `src/components/site-card.tsx` already has inline `CONFIDENCE_DOT` record and the "Sighting evidence pending" fallback — refactor to use the new component
- Site detail page at `src/app/sites/[slug]/page.tsx` — add badge to the meta row (lines ~260-290), which already has "Dive site", country, depth, skill, season, reef state badges
- `EvidenceDot` must be a server component (no 'use client' needed — no interactivity)
- Keep the tooltip (title attribute) on SiteCard's "pending" state for hover context
- Do NOT change the empty-state block inside the species section — only add the badge to the meta row

## Dev Agent Record

### Implementation Plan
Create EvidenceDot component → refactor SiteCard → add hero badge to site detail.

### Debug Log

### Completion Notes

- Created `EvidenceDot` component with 4 states (high/medium/low/null). Server component, no client JS needed.
- Removed inline `CONFIDENCE_DOT` record from `SiteCard`; imported `EvidenceDot` instead. When sighting exists, dot + species name + last confirmed date shown. When null, `EvidenceDot confidence={null} showTooltip` renders "No sighting records yet" with the backfill tooltip.
- Added inline "No sighting records yet" pill badge to site detail meta row (`/sites/[slug]`) conditioned on `creatures.length === 0`. Badge uses `bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200` per UX-DR spec.
- Full Next.js build passes with 356 static site pages generated, no TypeScript errors.

## File List

- src/components/evidence-dot.tsx (new)
- src/components/site-card.tsx (modified)
- src/app/sites/[slug]/page.tsx (modified)

## Change Log

- 2026-06-04: Created EvidenceDot component; refactored SiteCard; added no-records badge to site detail hero meta row. Story status: review.
