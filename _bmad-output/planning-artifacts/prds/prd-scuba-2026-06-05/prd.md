---
title: Affiliate Link Integrity
status: final
created: 2026-06-05
updated: 2026-06-05
---

# Affiliate Link Integrity

## Problem Statement

scubaseason.fun lists hotels, gear, and dive operators across 356 dive sites spanning 107 locations. The site earns affiliate commission through Amazon (gear), Booking.com via Awin (hotels), and DiveBooker (liveaboards) — programmes that are already approved and have live tracking IDs. However:

1. **Every hotel and liveaboard link resolves to a search results page**, not the specific property. A user clicking "Yenkoranu Homestay" lands on a Booking.com keyword search, not the hotel's own page. That user may find the right result, or may not. This is a broken user experience and forfeits commission — Awin only pays on completed bookings, and a confused search landing increases drop-off.
2. **Affiliate tracking parameters are absent** from all 637 lodging entries (`isAffiliate: false` across the board). Clicks generate zero commission today even where the programmes are live.
3. **Non-affiliate operators appear as unlinked names** in some views, which looks broken. Every listed operator has a real website; it should always be reachable.

The site's mission is to be the most useful scuba research platform, with affiliate revenue covering hosting costs. Both depend on the same fix: links that go exactly where they say they go, with tracking applied.

---

## Goals

1. Every affiliate link resolves to the exact product, property, or operator page — never a search results page, never a 404.
2. All active affiliate programmes have their tracking parameters stamped on every eligible link.
3. Non-affiliate operators always show a working link to their own website.
4. The fix is verifiable: a test suite can confirm destination and parameter correctness without a human clicking every link.

### Non-Goals

- Signing up for new affiliate programmes (out of scope for this initiative)
- Adding affiliate CTAs to new pages or surface areas
- Monetisation strategy or programme prioritisation beyond what is already approved

---

## Active Affiliate Programmes

All four programmes below are approved and have real credentials. Env vars are already defined in the codebase.

| Programme | What it covers | Tracking ID | Env var |
|-----------|---------------|-------------|---------|
| Amazon Associates | Gear | Tag `scubaseason-20` | `NEXT_PUBLIC_AMAZON_TAG` |
| Booking.com via Awin | Hotels | Awin Publisher ID (AID) `2831408` | `NEXT_PUBLIC_BOOKING_AID` |
| DiveBooker | Liveaboards | Partner ID (PID) `645` | `NEXT_PUBLIC_DIVEBOOKER_PID` |
| Travelpayouts | Flights | Affiliate ID (AID) `728836` | `NEXT_PUBLIC_TRAVELPAYOUTS_AID` |

Programmes not yet active (pending approval or TODO): Liveaboard.com, PADI Travel, SCUBAPRO, Bluewater Travel (no programme).

---

## Link Categories & Rules

### Hotels (Booking.com via Awin)

**Current state:** 424 entries across 69 locations (356 sites), all pointing to `booking.com/searchresults.html?ss=...`. `isAffiliate: false` on every entry.

**Required state:**
- Each hotel entry's `url` must be the direct Booking.com property page for that specific hotel (e.g. `https://www.booking.com/hotel/id/yenkoranu-homestay.html`)
- The `AffiliateLink` component's `enhanceAffiliateUrl` must append `?aid=2831408&label=scubaseason` to every Booking.com property URL
- `isAffiliate` must be `true` for all Booking.com entries

**FR-H1:** Each hotel entry in `sites.json` must have a `url` pointing to the Booking.com property page for that specific property, not a search results URL. The implementation approach is: web-search each hotel name + location to find its Booking.com slug, verify the URL resolves to the correct property, then update `sites.json`. The verification script (FR-V1) gates this — any entry still pointing to a search URL at deploy time fails the check.

**FR-H2:** The `enhanceAffiliateUrl` function must append `aid=2831408` and `label=scubaseason` to any Booking.com URL when `NEXT_PUBLIC_BOOKING_AID` is set.

**FR-H3:** All hotel lodging entries must have `isAffiliate: true` once the property URL and tracking are in place.

**FR-H4:** If a specific Booking.com property page cannot be confirmed for a given hotel during implementation, the entry must be removed from `sites.json` rather than retaining a search URL. Accuracy over volume: a broken search is worse than no listing.

**FR-H5:** Each location must have 3–6 hotel options covering at least three price tiers: budget (priceLevel 1), mid-range (priceLevel 2–3), and luxury (priceLevel 4). 19 of 69 locations currently lack full tier coverage and require new hotels to be sourced with confirmed Booking.com property pages during implementation.

---

### Liveaboards (DiveBooker)

**Current state:** 213 entries across 41 locations (356 sites), all pointing to `liveaboard.com/diving/search?destination=...`. Liveaboard.com affiliate is pending approval. DiveBooker (Partner ID `645`) is approved.

**Required state:**
- Liveaboard entries must link to the specific vessel page on DiveBooker (e.g. `https://www.divebooker.com/liveaboard/mv-ambai`)
- `enhanceAffiliateUrl` must append `?afid=645` to DiveBooker URLs
- `isAffiliate: true`, `partner: "DiveBooker"` on all liveaboard entries

**FR-L1:** Each liveaboard entry must have a `url` pointing to the specific vessel's page on DiveBooker, not a search results URL.

**FR-L2:** The `enhanceAffiliateUrl` function must append `afid=645` to any DiveBooker URL when `NEXT_PUBLIC_DIVEBOOKER_PID` is set.

**FR-L3:** All liveaboard entries must have `partner: "DiveBooker"` and `isAffiliate: true`.

**FR-L4:** If a vessel does not have a DiveBooker listing, the entry must link to the vessel or operator's own website (no affiliate tagging, `isAffiliate: false`). 16 of 75 vessels fall into this category; 6 locations (Azores, Coiba, Cuba — Jardines de la Reina, Ningaloo, Nosy Be, Sipadan) depend entirely on these fallback links for liveaboard coverage.

---

### Gear (Amazon Associates)

**Current state:** 32 gear items. Each item has a `partners` array with one Amazon entry containing a direct `/dp/ASIN` URL. Amazon tag `scubaseason-20` is set via `NEXT_PUBLIC_AMAZON_TAG`. There is no top-level `isAffiliate` field on gear items — affiliate status is inferred from the presence of a `partners` entry.

**Required state:** This is largely correct. The gap is verification — confirm the tag is being applied at render time and that none of the ASINs return 404 or redirect to a different product.

**FR-G1:** Every gear item's Amazon URL must resolve to the exact product (not a search, not a redirect to an unrelated item, not a 404).

**FR-G2:** The rendered `<a>` href for every gear link must contain `?tag=scubaseason-20`. Verified by inspecting the `partners[0].url` value after `enhanceAffiliateUrl` processes it — the tag parameter must be present.

**FR-G3:** All 32 gear items currently have an Amazon `partners` entry. No gear items lack a partner link at this time; this requirement is considered met and requires no implementation work.

---

### Operators (non-affiliate)

**Current state:** 9 operators in `operators.json`, all with `affiliateProvider: "direct"` and a `website` field populated. On dive site pages, 185 operator listings appear across sites.

**Required state:**
- Every operator displayed on a site page must show a working link — either to an affiliate booking URL (if an affiliate agreement exists) or to the operator's own website
- A name with no link is not acceptable
- No UTM-stamped link should point to a dead URL

**FR-O1:** Every operator entry rendered on a site page must have a non-empty, valid destination URL (affiliate URL if available, otherwise `website`).

**FR-O2:** The `bookingUrlForOperator` function must always return a non-`#` URL when the operator has a `website` field.

**FR-O3:** Operators with `affiliateProvider: "direct"` must display a "Visit operator site" CTA linking to `website`, not a blank name.

---

### Flights (Travelpayouts)

**Current state:** Travelpayouts Affiliate ID `728836` is provisioned in Notion. No flight links are currently rendered on any page. Flights are out of scope for this initiative.

**FR-F1:** [OUT OF SCOPE — if Travelpayouts links are added in future, `enhanceAffiliateUrl` must append `?marker=728836` to any Travelpayouts/Skyscanner URL.]

---

## FTC / Disclosure

The existing `/about` disclosure covers all affiliate links. No change required. The `<AffiliateLink>` component already applies `rel="nofollow sponsored noopener"` when `isAffiliate: true`.

**NFR-D1:** Once `isAffiliate: true` is set on hotel and liveaboard entries, the `<AffiliateLink>` component already applies `rel="nofollow sponsored noopener"` — no code change needed.

**NFR-D2:** The existing `/about` page disclosure covers all affiliate links site-wide. No inline per-page disclosure is currently rendered on location pages. If FTC guidance requires proximity disclosure (disclosure on the same page as the link, not just `/about`), the `AffiliateDisclosure` component should be re-imported on location pages. This is flagged but not blocking — no FTC action is pending.

---

## Data Integrity Verification

The core deliverable is not just fixing the data, but proving it is correct and keeping it correct.

**FR-V1:** A verification script (or test suite) must be runnable against the live data and confirm:
- No lodging URL is a search results page
- All Booking.com lodging URLs have `?aid=` set
- All DiveBooker lodging URLs have `?afid=` set
- All Amazon gear URLs have `?tag=` set (at render time)
- No URL in any lodging or gear entry returns a 404 or redirect to an unrelated page

**FR-V2:** The verification script must output a clear per-entry pass/fail so broken links are immediately identifiable.

**FR-V3:** A GitHub Actions workflow (`.github/workflows/affiliate-lint.yml`) must run the non-network portions of the verification (parameter presence, URL format — not live HTTP checks) on every push to `main`. It should fail the build if any lodging entry contains a search results URL or is missing its affiliate parameter.

---

## Out of Scope

- New affiliate programme sign-ups
- New page types or affiliate CTA surfaces
- Liveaboard.com integration (pending approval — revisit when approved)
- SCUBAPRO gear programme
- Any visual or UX redesign of the "Where to Stay" or gear sections

---

## Open Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| OQ-1 | Hotels with no verifiable Booking.com property page — remove or keep? | Josie | **Resolved:** remove. Accuracy over volume. |
| OQ-2 | Liveaboards with no DiveBooker listing — fallback or remove? | Josie | **Resolved:** fallback to vessel's own website, `isAffiliate: false`. |
| OQ-3 | Travelpayouts: no flight links exist today. Wire up anywhere in this initiative, or defer? | Josie | **Resolved:** out of scope for this initiative |
| OQ-4 | SCUBAPRO programme (10% gear commission, TODO status) — this initiative or next? | Josie | Deferred — not blocking |
