---
baseline_commit: 45036be9b46258e1e5b52287066438ecbc6062e3
status: review
---

# Story 1.4: Evidence Coverage Validation Script

As a developer merging a data update,
I want a script that counts sites with no sighting records and exits non-zero when that count is ≥ 20,
So that FR48 is enforced automatically and regressions are caught before deployment.

## Acceptance Criteria

**Given** `sightings.json` and `sites.json` exist
**When** `node scripts/validate-evidence-coverage.mjs` runs
**Then** it counts every site whose `id` has no matching `siteId` with `recentRecordCount > 0`
**And** if count ≥ 20: prints `FAIL: {N} sites have zero sighting evidence (threshold: <20)` and exits code 1
**And** if count < 20: prints `PASS: {N} sites have zero sighting evidence` and exits code 0

**Given** `npm run validate:evidence` runs
**When** it completes
**Then** it produces the same pass/fail output and exit code

## Tasks/Subtasks

- [x] Create `scripts/validate-evidence-coverage.mjs`
- [x] Wire into `package.json` as `validate:evidence`
- [x] Confirm PASS with current 0 zero-evidence sites

## Dev Agent Record

### Completion Notes

- Created `scripts/validate-evidence-coverage.mjs`. Counts sites in sites.json with no sightings.json entry where `recentRecordCount > 0`. PASS threshold: <20.
- Note: `backfill-sightings.mjs` already existed and had been run — 356 sites, 0 zero-evidence. The gate confirms this.
- Added `validate:evidence` to package.json scripts.

## File List

- scripts/validate-evidence-coverage.mjs (new)
- package.json (modified — added validate:evidence script)

## Change Log

- 2026-06-04: Created evidence coverage validator. FR48 gate passing at 0 zero-evidence sites.
