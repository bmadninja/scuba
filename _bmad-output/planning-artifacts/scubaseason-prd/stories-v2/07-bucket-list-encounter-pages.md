---
story: 7
title: Bucket-list encounter pages
status: Draft for Approval
type: new-route
depends_on: [3, 6]
repo_status: not-built
---

# Story 7 — Bucket-List Encounter Pages

## Story

As a bucket-list diver, I need dedicated encounter pages that explain the experience, where and when to do it, required skill, ethics, conservation context, and evidence quality.

## Context

Some dreams are bigger than one site page. Sardine run, great white cage diving, hammerheads, and coral spawning deserve guide pages that connect to sites and locations.

## Acceptance Criteria

- AC1: Add `/encounters` index and `/encounters/[slug]` detail route.
- AC2: Each detail page shows overview, best locations, season calendar, difficulty, ethics/conservation, sources, methodology, and limitations.
- AC3: Pages link to relevant sites and locations.
- AC4: Pages are statically generated from `encounters.json`.
- AC5: Metadata and sitemap include encounter URLs.
- AC6: Empty or low-confidence encounters can be draft-hidden from production listing.

## QA Notes

- Verify pages are crawlable.
- Verify source/methodology section is visible.
- Verify no unsourced ranking appears.
