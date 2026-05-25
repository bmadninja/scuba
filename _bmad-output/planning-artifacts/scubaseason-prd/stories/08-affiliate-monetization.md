---
story: 8
title: Affiliate links, disclosure, click events
status: Draft
epic: F5 — Affiliate Monetization
prd_refs: [FR5.1, FR5.2, FR5.3, FR5.4, FR5.5]
arch_refs: ["§7 Affiliate Plumbing"]
depends_on: [2, 3]
---

# Story 8 — Affiliate links, disclosure, click events

## Story

As the operator, I need a single `<AffiliateLink>` component, FTC disclosure blocks, and Vercel Analytics click events — so every affiliate surface (gear, lodging, flights, operators) ships consistent UI, attribution, and tracking.

## Context

Monetization is deliberately layered after the core research experience exists. This story wires the dual funnel from the PRD while preserving the trust constraint that editorial ranking cannot be influenced by commission.

## Acceptance Criteria

- AC1: `<AffiliateLink>` component renders `<a target="_blank" rel="nofollow sponsored noopener">`, fires the correct event type (`gear_click` / `lodging_click` / `flight_click` / `operator_click`) to Vercel Analytics with `{site_id, partner, product_id}` (FR5.4, arch §7).
- AC2: `isAffiliate: false` links render same UI without the "earns commission" indicator and without the sponsored rel (FR5.1).
- AC3: `<AffiliateDisclosure>` component placed at the bottom of any block containing affiliate links — Plan-Your-Trip block, Gear block (FR5.3). `/about` has the full disclosure policy.
- AC4: Site detail page Tier A gear filtered by diver profile cert level (FR1.4 + Story 4). Each gear card renders multiple partner options from `Gear.partners[]`; primary CTA = first partner with valid URL.
- AC5: Vercel Analytics integration: package installed, `<Analytics />` mounted in root layout, events fire and appear in Vercel dashboard within minutes of click.
- AC6: At least Amazon Associates affiliate tag wired into one real gear item end-to-end as proof. Booking.com + Skyscanner affiliate IDs wired into at least one flagship site's lodging/flights blocks (PRD A5).
- AC7: No paid placement (FR5.5) — recommendations are editorial. No code path biases ranking by affiliate commission.

## Dev Notes

- `src/lib/affiliate.ts`, `src/components/affiliate-link.tsx`, `src/components/affiliate-disclosure.tsx` exist — audit; the plumbing may already be partly in place.
- This story depends on Story 3 (flagship content) for real partner data, and Story 2 (detail page) to host the blocks.
- Vercel Analytics is cookieless per arch §1 / PRD A7 — no cookie banner needed (NFR5).

## Tasks

- [ ] Audit existing affiliate files
- [ ] Finalize `<AffiliateLink>` API + event firing
- [ ] Finalize `<AffiliateDisclosure>` + place at every required surface
- [ ] Mount `<Analytics />` in root layout
- [ ] Wire one real Amazon tag, one real Booking.com tag, one real Skyscanner tag as proof
- [ ] Update `/about` with full disclosure policy

## File Pointers

- Modify: `src/lib/affiliate.ts`, `src/components/affiliate-link.tsx`, `src/components/affiliate-disclosure.tsx`, `src/app/about/page.tsx`, `src/app/layout.tsx`
- Reference: Story 2 detail page, Story 3 flagship sites' partner arrays

## References

- PRD §5 F5, §11 A5/A6/A7
- Architecture §7
