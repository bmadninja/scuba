---
story: 6
title: Advanced species-chaser flow
status: Draft for Approval
type: persona-flow
depends_on: [3, 4]
repo_status: partial-filter-support
---

# Story 6 — Advanced Species-Chaser Flow

## Story

As an advanced diver, I need to choose a target animal or encounter and see where to go, when to go, how difficult it is, and how confident the evidence is.

## Context

The current filters support broad dive types like large pelagics, but they do not yet answer "I want hammerheads, where should I go?"

## Acceptance Criteria

- AC1: User can choose a target animal or encounter from a searchable list.
- AC2: Results show best locations/sites, best months, difficulty, logistics, and evidence confidence.
- AC3: Results distinguish "confirmed presence" from "high likelihood."
- AC4: Last confirmed sighting appears when available.
- AC5: If only occurrence records exist, UI avoids numeric probability and explains why.
- AC6: User can continue from the flow into site/location/encounter pages.

## Source Requirements

- OBIS/GBIF/RLS/citizen-science/operator sources depending on species
- Methodology note for ranking
- Limitation note for probability vs presence

## QA Notes

- Test hammerhead, manta, whale shark, thresher shark, and blackwater paths.
- Confirm rare species do not get fake precise odds.
