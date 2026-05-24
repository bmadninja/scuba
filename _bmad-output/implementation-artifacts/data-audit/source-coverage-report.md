---
title: scubaSeason.Fun — Source Coverage Report
generated: 2026-05-24
status: audit
story: Story 02 — Normalize existing data to source-aware schema
---

# Source Coverage Report

This is a read-only audit of the current dataset against the
Story 01 source/methodology registries. Existing data is preserved.

## Registry size

- Sources: **9**
- Methodology notes: **0**

## Dataset coverage

| Entity | Total | With sourceIds | With methodologyClaimIds | Unknown source refs | Unknown methodology refs |
|---|---:|---:|---:|---:|---:|
| Sites | 184 | 0 (0%) | 0 (0%) | 0 | 0 |
| Locations | 111 | 0 (0%) | 0 (0%) | 0 | 0 |
| Gear | 32 | 0 (0%) | 0 (0%) | 0 | 0 |
| Species entries (across all sites) | 861 | 0 (0%) | 0 (0%) | 0 | 0 |

Location-details records on disk: 109 (narrative copy, no claim audit applied).

## Editorial-only / unsourced claim flags

Fields that *look* like probability, rarity, seasonality, reef condition,
or climate urgency but lack a methodology reference. These are not
automatic rewrites — they are review candidates.

| Flag | Count |
|---|---:|
| `conditions-by-month-without-methodology` | 184 |
| `species-seasonality-without-methodology` | 152 |
| `species-rarity-without-methodology` | 63 |

## Schema drift findings

- `Site.getThere` is a free-text string. Earlier architecture notes
  expected a structured link array. Flagged for later normalization,
  not rewritten in this audit.
- `SpeciesEntry.reliability` (`year-round` / `seasonal` / `rare`) is
  editorial confidence today. Later stories should attach a
  MethodologyNote whenever this becomes user-facing as a probability.
- Discovery script outputs (`scripts/discover-sites.mjs`) merged
  records without durable source records. Preserved as-is; sourceIds
  remain empty until backfilled.

## Next actions

1. Backfill `sourceIds` on locations and sites as encounter/reef-health
   stories land (do not bulk-rewrite preemptively).
2. Treat any new claim added without a methodologyClaimId as a CI
   failure once validate-provenance is wired to a hook.
3. Affiliate fields (`lodging`, `operators`, gear `partners`) remain
   separate from editorial provenance per AC6.
