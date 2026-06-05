---
reviewer: Claude Code (structural review)
date: 2026-06-05
prd: Affiliate Link Integrity
---

# Structural Review — Affiliate Link Integrity PRD

## Gate Verdict

**CONDITIONAL PASS** — the PRD is largely implementable as written, but contains three numbers that don't match the codebase and one critical gap in the gear data model that would cause FR-G2 to be untestable on current code.

---

## Findings

### 1. Accuracy — location and hotel counts are wrong

The PRD states "424 entries across 169 sites" for hotels and references "69 locations" with tier coverage gaps. The actual codebase has:

- **420** hotel entries (not 424)
- **113** locations in `locations.json`; **107** locationIds referenced in `sites.json` (not 169 — that appears to be the dive-site count the codebase uses elsewhere, not the location count)
- **356** total dive sites

The PRD conflates "sites" (individual dive spots) with "locations" (geographic areas). FR-H5 says "19 of 69 locations currently lack full tier coverage" — the real number is closer to 69 of 107 locations have zero hotel listings at all (38 locationIds have no lodging at all). A developer reading FR-H5 would source hotels for the wrong set.

**Fix:** Replace "169 sites" with "107 locations / 356 dive sites." Recheck the tier-coverage gap count before implementation.

---

### 2. Accuracy — gear's `isAffiliate` field doesn't exist; FR-G2 is partially untestable

The PRD states gear items have `isAffiliate: true` on all entries. In reality, `gear.json` uses a nested `partners` array (e.g. `[{"partner": "amazon", "productId": "...", "url": "...", "commission": 3}]`) and has **no top-level `isAffiliate` field**. All 32 items report `isAffiliate: false` because the field is absent.

This is not just a data discrepancy — it means the PRD's instructions to "confirm the tag is being applied at render time" (FR-G2) and the verifier logic for gear will need to inspect the `partners` array, not a top-level boolean. The `AffiliateLink` component and `enhanceAffiliateUrl` path for gear needs to be clarified; the current code calls `enhanceAffiliateUrl(url, "amazon")` which relies on the URL or partner string, not `isAffiliate`.

**Fix:** Replace all references to gear's `isAffiliate: true` with a note that gear affiliate status is determined by the presence of an `amazon` entry in the `partners` array. FR-G3 assumption should be dropped — it's not applicable.

---

### 3. Decision-readiness — FR-H1 leaves the hardest work undefined

FR-H1 says "each hotel entry must have a URL pointing to the Booking.com property page." It does not specify *how* those URLs are to be sourced — scraping Booking.com's search results, using their Content API, manual lookup, or a script. With 420 entries across 107 locations this is the largest implementation task in the PRD and the most under-specified.

The failure mode is real: an implementer who treats this as a scripting task will get rate-limited or produce incorrect matches; one who treats it as a manual task will take weeks. FR-H4 (remove rather than retain search URLs) compounds this — a wrong automation could silently delete valid entries.

**Fix:** Add a sub-section under FR-H1 specifying the sourcing approach (e.g., "use Booking.com Search API with property-level results, match on name + location, require confidence threshold ≥ X, log all removals to a JSON audit file"). Or explicitly mark this as out-of-scope data work to be done as a separate ticket before implementation of FR-H1.

---

### 4. Completeness — CI integration for FR-V3 has no implementation path

FR-V3 says "CI or a pre-deploy check should run non-network verification on every push." The repo has no CI configuration file visible, and the codebase does not have an existing test runner setup referenced in the PRD. A developer cannot act on FR-V3 without knowing which CI platform to target (GitHub Actions? Vercel build hooks?), what command to run, and where the script lives.

**Fix:** Specify the CI platform and the exact command (e.g., `node scripts/verify-links.mjs --no-network` as a step in `.github/workflows/ci.yml`). If CI infrastructure doesn't exist yet, mark FR-V3 as a follow-up and limit the deliverable to the verification script alone.

---

### 5. Strategic coherence — FTC disclosure is understated

The PRD's FTC section (NFR-D1) says "the existing `/about` disclosure covers all affiliate links — no change required." This is only true if the `/about` page is reachable from every page that displays affiliate links. If hotel and liveaboard links with `isAffiliate: true` appear on location/site pages without an inline disclosure visible near the links, the site may be non-compliant with FTC guidelines (16 CFR 255), which require disclosure *proximate* to the endorsement.

The PRD delegates this entirely to a single page disclosure, which is the minimum defensible interpretation. It should either confirm that the `<AffiliateLink>` component already renders a visible inline disclosure (it applies `rel="nofollow sponsored"` in the DOM, but that's not user-visible), or add a small NFR requiring that a disclosure note appear near any section containing affiliate lodging links.

---

## Minor Notes (non-blocking)

- The PRD correctly identifies 75 unique liveaboard vessel names and 9 operators — these match the codebase.
- The liveaboard partner field in current data is `"LiveaboardBookings"` (not `"DiveBooker"`). FR-L3 adds `partner: "DiveBooker"` but doesn't specify that existing `partner` values need to be migrated. The `enhanceAffiliateUrl` function dispatches on `partner.toLowerCase()`, so a mismatched partner string would silently skip DiveBooker tagging.
- OQ-1 and OQ-2 are resolved inline, which is good. OQ-3 and OQ-4 are deferred but the OQ table is still clean.
- The distinction between "200 unique hotels" and "420 hotel entries" (same hotel repeated across multiple sites in the same location) should be made explicit in the PRD so implementors know they're de-duplicating by label when sourcing Booking.com URLs, not sourcing 420 separate pages.
