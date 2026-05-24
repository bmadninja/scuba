---
story: 9
title: Reef health and climate data model
status: Draft for Approval
type: climate-data
depends_on: [1]
repo_status: not-built
---

# Story 9 — Reef Health and Climate Data Model

## Story

As an editor, I need reef-health and climate data stored separately as observed condition, current thermal risk, and projection so the product can educate without overclaiming.

## Context

Climate urgency is a key storytelling layer, but it must separate what was observed, what satellites indicate now, and what models project.

## Acceptance Criteria

- AC1: Add reef-health data types for observed condition, thermal stress, and projection.
- AC2: Thermal stress supports NOAA Coral Reef Watch fields: DHW, HotSpot, SST anomaly, alert level, date.
- AC3: Observed condition supports coral cover, bleaching %, mortality %, survey method, survey date.
- AC4: Projection fields require source, method, scenario, and uncertainty.
- AC5: Site/location records can link to reef-health records.
- AC6: Validation prevents projection claims without methodology.

## Source Requirements

- NOAA Coral Reef Watch for thermal stress
- AIMS/NCRMP/GCRMN/Reef Check/AGRRA/RLS/local monitoring as available for observed condition
- Published models or transparent local trend methods for projection

## QA Notes

- Verify observed/current/projected are not conflated in data or copy.
