---
story: 8
title: Animal sighting evidence and rarity system
status: Draft for Approval
type: evidence-system
depends_on: [1, 3]
repo_status: not-built
---

# Story 8 — Animal Sighting Evidence and Rarity System

## Story

As a diver chasing rare animals, I need to see sighting confidence, last confirmed records, and rarity in a way that is honest about uncertainty.

## Context

This story prevents the product from turning weak data into false certainty. It powers "hardest to spot" and target-animal pages.

## Acceptance Criteria

- AC1: Add data structures for sighting evidence records.
- AC2: Support evidence types: survey effort, occurrence record, citizen science, operator report, editorial curation.
- AC3: Numeric probability is only allowed when denominator data exists.
- AC4: Occurrence-only evidence shows last confirmed sighting, recent record count, proximity, and seasonality signal.
- AC5: Add elusiveness bands with methodology explanation.
- AC6: Add "hardest to spot" list backed by documented scoring.
- AC7: QA can inspect the inputs behind each displayed confidence label.

## QA Notes

- Confirm unsupported probability claims fail validation.
- Confirm rare/low-confidence animals render careful limitation copy.
