---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-scuba-2026-06-05/prd.md
  - docs/architecture.md
---

# scuba — Affiliate Link Integrity: Epic Breakdown

## Overview

Decomposition of the Affiliate Link Integrity PRD into 4 epics and 11 stories. All 637 lodging links and 32 gear links are fixed, affiliate-tagged, and CI-verified.

## Requirements Inventory

### Functional Requirements

FR-H1: Each hotel entry in `sites.json` must have a `url` pointing to the Booking.com property page for that specific property, not a search results URL. Sourcing: web-search each hotel name + location, verify, update `sites.json`.
FR-H2: `enhanceAffiliateUrl` must append `aid=2831408` and `label=scubaseason` to any Booking.com URL when `NEXT_PUBLIC_BOOKING_AID` is set.
FR-H3: All hotel lodging entries must have `isAffiliate: true` once property URL and tracking are in place.
FR-H4: Hotels with no confirmed Booking.com property page must be removed from `sites.json`.
FR-H5: Each location must have 3–6 hotels covering budget (priceLevel 1), mid-range (2–3), luxury (4). 19 of 69 locations currently lack full tier coverage.
FR-L1: Each liveaboard entry must point to the specific vessel page on DiveBooker, not a search URL.
FR-L2: `enhanceAffiliateUrl` must append `afid=645` to any DiveBooker URL when `NEXT_PUBLIC_DIVEBOOKER_PID` is set.
FR-L3: All DiveBooker liveaboard entries must have `partner: "DiveBooker"` and `isAffiliate: true`.
FR-L4: 16 vessels with no DiveBooker listing must link to the vessel/operator's own website (`isAffiliate: false`). These are the sole liveaboard options for 6 locations.
FR-G1: Every gear Amazon URL must resolve to the exact product (no 404, no unrelated redirect).
FR-G2: Every rendered gear `<a>` href must contain `?tag=scubaseason-20`.
FR-G3: All 32 gear items already have an Amazon `partners` entry — no action required.
FR-O1: Every operator entry rendered on a site page must have a non-empty, valid destination URL.
FR-O2: `bookingUrlForOperator` must never return `"#"` when the operator has a `website` field.
FR-O3: Operators with `affiliateProvider: "direct"` must display a "Visit operator site" CTA linking to `website`.
FR-V1: Verification script confirms: no search URLs, all affiliate params present, no 404s.
FR-V2: Verification script outputs per-entry pass/fail.
FR-V3: GitHub Actions workflow `.github/workflows/affiliate-lint.yml` runs non-network checks on every push to `main`, failing the build on violations.

### NonFunctional Requirements

NFR-D1: `<AffiliateLink>` already applies `rel="nofollow sponsored noopener"` when `isAffiliate: true` — no code change needed once data flags are updated.
NFR-D2: FTC `/about` disclosure covers site-wide. If proximity disclosure is required, re-import `AffiliateDisclosure` on location pages. Flagged, not blocking.

### Additional Requirements (Architecture)

- Static site (SSG): all data changes go into `src/data/*.json`, committed to repo, trigger Vercel redeploy.
- Env vars `NEXT_PUBLIC_BOOKING_AID`, `NEXT_PUBLIC_DIVEBOOKER_PID`, `NEXT_PUBLIC_AMAZON_TAG` must be set on Vercel (Production + Preview + Development).
- `<AffiliateLink>` is a Client Component — must remain so; no conversion to Server Component.
- `enhanceAffiliateUrl` in `src/lib/affiliate.ts` is the single affiliate tagging point; no other files construct affiliate URLs manually.
- CI platform: GitHub Actions; new workflows go in `.github/workflows/`.
- GFW commercial-use ToS: free tier prohibits commercial use. Must resolve before affiliate revenue goes live (separate task, not blocking implementation).
- Credential hygiene: rotate `ScubaSeason2026!@` on any affiliate account where it was used.

### UX Design Requirements

N/A — no new UI surfaces. Existing `<AffiliateLink>` component and "Where to Stay" section remain unchanged.

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR-H1 | Epic 1 | 1.1, 1.2 |
| FR-H2 | Epic 1 | 1.3 |
| FR-H3 | Epic 1 | 1.2 |
| FR-H4 | Epic 1 | 1.2 |
| FR-H5 | Epic 1 | 1.4 |
| FR-L1 | Epic 2 | 2.1, 2.2 |
| FR-L2 | Epic 2 | 2.1 |
| FR-L3 | Epic 2 | 2.1 |
| FR-L4 | Epic 2 | 2.2 |
| FR-G1 | Epic 3 | 3.1 |
| FR-G2 | Epic 3 | 3.2 |
| FR-G3 | — | Already met |
| FR-O1 | Epic 3 | 3.3 |
| FR-O2 | Epic 3 | 3.3 |
| FR-O3 | Epic 3 | 3.3 |
| FR-V1 | Epic 4 | 4.1 |
| FR-V2 | Epic 4 | 4.1 |
| FR-V3 | Epic 4 | 4.2 |
| NFR-D1 | Epic 1/2 | 1.2, 2.1 |
| NFR-D2 | Epic 3 | 3.4 |

## Epic List

- **Epic 1:** Hotel Direct Links & Affiliate Tagging
- **Epic 2:** Liveaboard Direct Links & Affiliate Tagging
- **Epic 3:** Gear & Operator Link Integrity
- **Epic 4:** Automated Link Verification & CI

---

## Epic 1: Hotel Direct Links & Affiliate Tagging

Every "Where to Stay" hotel card points to the specific Booking.com property page and earns Awin commission (AID `2831408`). Each of the 69 locations with hotels has budget, mid-range, and luxury options.

### Story 1.1: Source Booking.com Property URLs for All Hotels

As a site maintainer,
I want a verified list of direct Booking.com property page URLs for all 200 unique hotels currently in `sites.json`,
So that I can replace the 424 search results URLs with accurate deep links.

**Acceptance Criteria:**

**Given** the 200 unique hotel names in `sites.json`
**When** a maintainer runs the hotel URL sourcing process
**Then** each hotel has a verified `booking.com/hotel/...` property URL (not a search results URL)
**And** any hotel whose Booking.com listing cannot be confirmed is flagged for removal

**Given** a hotel URL has been sourced
**When** the URL is opened in a browser
**Then** it resolves to the correct hotel's page (not a search results page or a different property)

**Given** the sourcing process is complete
**When** a maintainer reviews the output
**Then** a manifest lists: verified URLs, hotels flagged for removal, and any needing manual review

---

### Story 1.2: Update `sites.json` Hotel Entries with Property URLs

As a site maintainer,
I want all hotel entries in `sites.json` updated with direct Booking.com property URLs, `isAffiliate: true`, and `partner: "Booking.com"`,
So that users land on the correct hotel page and the site earns Awin commission.

**Acceptance Criteria:**

**Given** the verified URL manifest from Story 1.1
**When** `sites.json` hotel entries are updated
**Then** every hotel `url` field is a `booking.com/hotel/` property URL — no `searchresults.html` URLs remain
**And** every hotel entry has `isAffiliate: true` and `partner: "Booking.com"`
**And** hotels with no confirmed property URL are removed

**Given** `sites.json` is updated and committed
**When** the verification script (Story 4.1) is run
**Then** zero hotel entries fail the "no search URL" check
**And** zero hotel entries fail the "isAffiliate flag" check

---

### Story 1.3: Verify Awin Parameters Apply at Render Time

As a site operator,
I want to confirm that `NEXT_PUBLIC_BOOKING_AID=2831408` is set on Vercel and rendered hotel links contain `?aid=2831408&label=scubaseason`,
So that every hotel click earns Awin commission.

**Acceptance Criteria:**

**Given** `NEXT_PUBLIC_BOOKING_AID=2831408` is set on Vercel
**When** a location page is rendered
**Then** every hotel `<a>` href contains `aid=2831408` and `label=scubaseason`

**Given** `NEXT_PUBLIC_BOOKING_AID` is unset (graceful degradation)
**When** a location page is rendered
**Then** hotel links resolve to the correct property page without the tracking param (no broken links)

**Given** `enhanceAffiliateUrl` receives a Booking.com property URL
**When** it processes the URL
**Then** it appends `aid` and `label` — verified by unit test

---

### Story 1.4: Fill Hotel Tier Gaps for 19 Locations

As a traveller researching a dive trip,
I want budget, mid-range, and luxury accommodation options for every dive location,
So that I can find a place to stay that fits my budget without leaving the site.

**Acceptance Criteria:**

**Given** the 19 locations missing at least one price tier (identified in pre-implementation analysis)
**When** a maintainer sources and adds replacement hotels
**Then** each location has at least one entry at priceLevel 1, one at priceLevel 2–3, and one at priceLevel 4 — all with verified Booking.com property URLs and `isAffiliate: true`

**Given** tier gap-filling is complete
**When** the tier coverage check script is run
**Then** all 69 locations with hotel listings report full B/M/L tier coverage

**Given** a newly added hotel entry
**When** it is committed to `sites.json`
**Then** it has `partner: "Booking.com"`, a direct property URL, `isAffiliate: true`, and a valid `priceLevel` between 1 and 4

---

## Epic 2: Liveaboard Direct Links & Affiliate Tagging

All 213 liveaboard entries move from Liveaboard.com search pages to accurate direct links. 59 vessels link to DiveBooker (PID `645`) and earn commission. 16 vessels link to their own websites. No location loses all its liveaboard options.

### Story 2.1: Update 59 DiveBooker Vessels with Direct URLs & Affiliate Tag

As a site operator,
I want all 59 liveaboards with DiveBooker listings updated to their direct vessel pages with `?afid=645`,
So that every DiveBooker click earns commission.

**Acceptance Criteria:**

**Given** the 59 confirmed DiveBooker vessel URLs from the pre-implementation research sweep
**When** liveaboard entries are updated in `sites.json`
**Then** all 59 vessels have `url` pointing to `divebooker.com/[vessel]-haz[N]` — no `liveaboard.com/diving/search` URLs remain for these vessels
**And** all 59 entries have `partner: "DiveBooker"` and `isAffiliate: true`

**Given** `NEXT_PUBLIC_DIVEBOOKER_PID=645` is set on Vercel
**When** a location page is rendered
**Then** every DiveBooker liveaboard `<a>` href contains `afid=645`

**Given** `enhanceAffiliateUrl` receives a DiveBooker URL
**When** it processes the URL
**Then** it appends `afid=645` — verified by unit test

---

### Story 2.2: Update 16 Non-DiveBooker Vessels with Fallback Own-Website URLs

As a diver planning a liveaboard trip,
I want a direct link to each vessel's own website even if it's not on DiveBooker,
So that I can research and book without hitting a dead end.

**Acceptance Criteria:**

**Given** the 16 vessels with no DiveBooker listing: Aqua Blu Komodo, Avalon Fleet I, Avalon Fleet III (Tortuga), Azores expedition trips (Master Liveaboards), Celebes Explorer, Conscious Breath Adventures – Belle Amie, Jardines Avalon Fleet II, KLM Cajoma IV, MV Chertan, MV Dolphin Dream, MV Hallelujah, MV Spirit of Niugini, MV Yemaya, Nosy Be Princess II, Sun Dancer II (Silver Bank), True North
**When** their entries are updated in `sites.json`
**Then** each has a `url` pointing to the vessel/operator's own website, `isAffiliate: false`, and `partner` set to the operator name

**Given** a fallback vessel entry is rendered on a location page
**When** a user clicks the link
**Then** they land on the vessel/operator's own website (not a search page, not a 404)

**Given** the 6 locations that depend entirely on fallback vessels (Azores, Coiba, Cuba — Jardines de la Reina, Ningaloo, Nosy Be, Sipadan)
**When** their location page is rendered
**Then** at least one liveaboard option is displayed with a working link

---

## Epic 3: Gear & Operator Link Integrity

Gear ASINs verified and tags confirmed. All 9 operators show working website CTAs. FTC disclosure audited.

### Story 3.1: Verify Amazon Gear ASINs Resolve to Correct Products

As a diver shopping for gear,
I want every gear link to land on the exact product listed,
So that I can buy the right item without confusion.

**Acceptance Criteria:**

**Given** the 32 gear items in `gear.json`, each with `partners[0].url` of `amazon.com/dp/[ASIN]`
**When** a maintainer runs the link-check script against all 32 ASINs
**Then** every URL returns HTTP 200 and the product page matches the gear item name
**And** any ASIN returning a 404 or redirecting to an unrelated product is flagged

**Given** a flagged ASIN
**When** the maintainer investigates
**Then** the entry is updated with a correct ASIN or removed if the product is discontinued

---

### Story 3.2: Verify Amazon Tag Renders on All Gear Links

As a site operator,
I want every rendered gear link to contain `?tag=scubaseason-20`,
So that Amazon purchases earn the Associates commission.

**Acceptance Criteria:**

**Given** `NEXT_PUBLIC_AMAZON_TAG=scubaseason-20` is set on Vercel
**When** a location or gear page is rendered
**Then** every Amazon gear `<a>` href contains `tag=scubaseason-20`

**Given** `enhanceAffiliateUrl` receives an Amazon `/dp/` URL
**When** it processes the URL
**Then** it appends `tag=scubaseason-20` — verified by unit test

---

### Story 3.3: Ensure All Operators Have a Working Link

As a diver reading about a dive site,
I want every listed dive operator to show a clickable link to their website,
So that I can contact or book the operator directly.

**Acceptance Criteria:**

**Given** an operator with `affiliateProvider: "direct"` and a populated `website` field
**When** their listing is rendered on a site page
**Then** a "Visit operator site" CTA is displayed linking to `website`
**And** `bookingUrlForOperator` returns the `website` URL — never `"#"`

**Given** `bookingUrlForOperator` is called with any operator that has a `website` field
**When** the function executes
**Then** it returns a non-`"#"` URL — verified by unit test covering all 9 operators

**Given** an operator link is rendered
**When** the HTML is inspected
**Then** it has `rel="nofollow noopener"` (not `sponsored` — no affiliate agreement)

---

### Story 3.4: FTC Disclosure Audit

As the site owner,
I want to confirm affiliate disclosures are visible on pages with affiliate links,
So that the site complies with FTC guidelines.

**Acceptance Criteria:**

**Given** a location page with hotel or liveaboard affiliate links (`isAffiliate: true`)
**When** the page is rendered
**Then** a visible affiliate disclosure is present — either inline on the page or via a clearly accessible link to `/about`

**Given** the `AffiliateDisclosure` component exists in the codebase
**When** a decision is made about disclosure placement
**Then** the decision is documented in `docs/affiliate-setup.md` (inline on location pages vs. `/about`-only)

---

## Epic 4: Automated Link Verification & CI

A verification script catches data errors locally. A GitHub Actions workflow blocks deploys when violations are detected.

### Story 4.1: Build Affiliate Link Verification Script

As a site maintainer,
I want a script that validates all lodging and gear data for affiliate link correctness,
So that I can verify the full dataset locally and catch regressions before they ship.

**Acceptance Criteria:**

**Given** `src/data/sites.json` and `src/data/gear.json` as inputs
**When** `node scripts/verify-affiliate-links.mjs` is run
**Then** it reports PASS/FAIL per entry for:
- No lodging URL contains `searchresults.html` or `/search?`
- All Booking.com entries with `isAffiliate: true` have `aid=` in the URL
- All DiveBooker entries with `isAffiliate: true` have `afid=` in the URL
- All Amazon gear entries have `tag=` in the URL
- All liveaboard entries with `isAffiliate: false` do not point to `liveaboard.com`

**Given** violations exist
**When** output is printed
**Then** each violation shows: entry label, field, expected value, actual value — one line per violation

**Given** all entries pass
**When** the script exits
**Then** exit code is 0 and a summary line is printed (e.g. `✓ 424 hotels, 213 liveaboards, 32 gear — all pass`)

**Given** the `--live` flag is passed
**When** the script runs
**Then** it additionally makes HTTP HEAD requests to all URLs and reports any non-200 responses or redirects outside the expected domain

---

### Story 4.2: Add GitHub Actions Affiliate Lint Workflow

As a site maintainer,
I want affiliate link correctness checked automatically on every push to `main`,
So that bad data can never reach production undetected.

**Acceptance Criteria:**

**Given** a commit is pushed to `main`
**When** the `.github/workflows/affiliate-lint.yml` workflow runs
**Then** it executes `scripts/verify-affiliate-links.mjs` (without `--live`) and fails the build if any violation is found

**Given** the workflow fails
**When** a maintainer views the Actions log
**Then** the specific failing entries are clearly listed

**Given** the workflow passes
**When** Vercel deploys the commit
**Then** the deploy proceeds normally

**Given** the workflow runs on a commit with no changes to `sites.json` or `gear.json`
**When** it executes
**Then** it still runs and completes in under 30 seconds (defence in depth)
