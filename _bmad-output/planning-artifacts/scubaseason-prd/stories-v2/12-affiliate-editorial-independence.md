---
story: 12
title: Affiliate finalization with editorial independence
status: Draft for Approval
type: monetization-delta
depends_on: [1, 2]
repo_status: partially-built
---

# Story 12 — Affiliate Finalization With Editorial Independence

## Story

As the operator, I need affiliate links, disclosure, and click tracking completed while making it clear that editorial ranking and confidence are not driven by commission.

## Context

Affiliate components exist, but monetization must not pollute source confidence or recommendation math.

## Acceptance Criteria

- AC1: Affiliate links render correct `rel` attributes and fire events.
- AC2: Vercel Analytics integration is installed and mounted if chosen.
- AC3: Affiliate disclosure appears near every affiliate block and on `/about`.
- AC4: Affiliate data is stored separately from source/methodology confidence.
- AC5: No ranking code uses commission or affiliate availability.
- AC6: UI can show non-affiliate operator links without penalizing them.
- AC7: QA can verify editorial independence with a simple code/data check.

## QA Notes

- Verify tracking event fires.
- Verify sponsored and non-sponsored links differ correctly.
- Verify no commission field influences sort order.
