---
story: 4
title: Diver profile (cert + recency) + inline banner
status: Draft
epic: F2 — Filter UX
prd_refs: [FR2.1a]
arch_refs: ["§4 State Management"]
ux_refs: ["§3 First-visit prompt"]
depends_on: [1]
---

# Story 4 — Diver profile (cert + recency) + inline banner

## Story

As a first-time visitor, I want a non-intrusive inline prompt asking my cert and last-dive recency so the site adapts recommendations and gear to me without forcing a modal.

## Context

Cert level and dive recency are core to the broadened target-user strategy. This story creates the persistent profile primitive that later filters and gear recommendations read, while keeping the experience skippable and lightweight.

## Acceptance Criteria

- AC1: First visit shows a thin inline banner directly under the top filter bar (UX §3): "Tell us your dive level — we'll tailor sites & gear. [cert ▾] [last dive ▾] [Skip]"
- AC2: Selecting values writes `localStorage.diverProfile = { cert, recency, setAt }` and dismisses the banner.
- AC3: Skip dismisses the banner with no profile written; banner does not reappear in subsequent visits.
- AC4: A persistent header chip "👤 AOW · last dive 3 mo ago ✎" appears once a profile is set; clicking opens an edit popover with the same two fields.
- AC5: `useDiverProfile()` hook in `src/lib/hooks/use-diver-profile.ts` exposes `{ profile, setProfile, clearProfile }` and is the only sanctioned read path. SSR-safe (returns `null` on server).
- AC6: Setting a profile pre-fills the cert/recency filter facets used by Story 5 (no hard dependency — Story 5 reads `useDiverProfile()` when it lands).
- AC7: No modal anywhere. No cookie required (localStorage only).

## Dev Notes

- Architecture §4: diver profile lives in `localStorage`, exposed via custom hook. Do not add a global store.
- Cert values: `'never-dived' | 'open-water' | 'advanced' | 'rescue' | 'divemaster' | 'tech'` (matches `SkillLevel` from arch §2).
- Recency values: `'never' | 'lt-6mo' | '6-24mo' | 'gt-2yr'`.
- Banner is a client component. The chip is a client component. Everything else stays server-rendered.

## Tasks

- [ ] Create `src/lib/hooks/use-diver-profile.ts` with SSR-safe localStorage access
- [ ] Create `src/components/diver-profile/banner.tsx` (first-visit inline)
- [ ] Create `src/components/diver-profile/chip.tsx` (persistent header)
- [ ] Create `src/components/diver-profile/edit-popover.tsx`
- [ ] Mount banner + chip in `src/app/layout.tsx` (or appropriate shell)
- [ ] Test: fresh localStorage shows banner; skip persists dismiss; edit chip works

## File Pointers

- Create: `src/lib/hooks/use-diver-profile.ts`, `src/components/diver-profile/*`
- Modify: `src/app/layout.tsx`

## References

- PRD §2 Target User, §5 FR2.1a
- Architecture §4 State Management
- UX §3 First-visit prompt
