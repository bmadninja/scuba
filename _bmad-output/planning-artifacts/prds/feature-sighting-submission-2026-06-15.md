# Feature Spec: Sighting Submission

**Status:** Draft  
**Date:** 2026-06-15  
**Author:** Josie  
**Informed by:** [Citizen science platform research](../research/market-citizen-science-upload-platforms-research-2026-06-15.md)

---

## Problem

Scuba Season currently flags reefs that need eyes and directs users to iNaturalist to upload photos. This creates two problems: it takes users off the site, and it provides no guidance on what to capture or how. The result is a broken experience at the exact moment a diver is most motivated to contribute.

---

## Goal

A diver who just visited a reef can upload a photo on Scuba Season with minimal friction. We submit that photo to 5 conservation databases on their behalf — no accounts on those platforms required. The data flows back into Scuba Season's reef health index via our existing 63-source pipeline.

---

## Scope

**In v1:**
- Dive site page trigger (post-dive)
- Pre-dive capture brief (pre-dive)
- Photo upload + minimal metadata collection
- Submission to: iNaturalist, GBIF, OBIS (auto via iNat), iSeahorse (conditional), CoralWatch (weekly batch)
- No user account required

**Out of scope for v1:**
- REEF VFSP (requires structured fish checklist UX — separate feature)
- ReefCheck (requires certified EcoDiver)
- MERMAID (requires structured transect data, separate partnership track)
- Video upload (no platform accepts it meaningfully)
- User submission history / profile

---

## Submission Model

**One submission = one sighting (one species or encounter).** This matches the iNaturalist observation model and is the right granularity for scientific data.

A diver who saw a turtle, a clownfish, and a bleached coral patch submits three separate sightings — each takes under 60 seconds. The form resets after each and offers "Submit another sighting" immediately.

This is not per-dive or per-location — it is per-species-encounter. Multiple sightings from the same dive site on the same day are all welcome and each goes to the right platforms independently.

**Photo limit per sighting:** 10 photos (raised from 5 — a diver photographing a coral patch from multiple angles needs more room). iNaturalist's hard limit is technically higher; 10 is a practical UX cap.

---

## Platform Routing

| Platform | Trigger condition | Submission method | Timing |
|---|---|---|---|
| iNaturalist | All submissions | API (Scuba Season account) | Real-time |
| GBIF | All submissions | Auto via iNaturalist pipeline | ~24h lag |
| OBIS | All submissions | Auto via iNaturalist pipeline | ~24h lag |
| iSeahorse | Species matches Hippocampus spp. | iNaturalist API + project_id=871 | Real-time |
| CoralWatch | Category = Coral | Manual batch export | Weekly |

One Scuba Season account per platform. No per-user OAuth. Observations attributed to Scuba Season as the submitting observer.

---

## Data Model

| Field | Required? | Source | iNaturalist field | CoralWatch field |
|---|---|---|---|---|
| Photo(s) | Yes | User upload (1–10 photos) | `observation_photos` | Supplementary photo |
| Dive site | Yes | Pre-filled from page context | `place_guess` + lat/lon | Reef name + GPS |
| Date | Yes | Pre-filled (today); editable | `observed_on` | Date |
| Category | Yes | User selects: Fish / Coral / Other | Taxon group (routing) | Determines CoralWatch routing |
| Species | No | Autocomplete or free text or "Not sure" | `taxon_name` | N/A |
| Depth | No (required for CoralWatch path) | User enters in metres | Custom observation field | Coral depth |
| Sea temperature | No | User enters in °C | Custom observation field | Sea temperature |
| Bleaching score | No (required for CoralWatch path) | Single-select | Custom observation field | Color chart score |
| Notes | No | Free text, 280 chars | `description` | — |
| GPS coordinates | Yes | Pulled from dive site record silently | `latitude` + `longitude` | GPS co-ordinates |

**CoralWatch path requirements:** CoralWatch queue is only triggered when Category = Coral AND depth AND bleaching score are both provided. Temperature is collected for all submissions (single optional field) and included in CoralWatch batch when present.

---

## User Flows

### Flow A: Pre-dive brief

**Entry point:** Dive site page, any time.

**Trigger:** Persistent card positioned below the reef health summary section, labelled "Planning to dive here?"

**Content:**

> **Planning to dive [Site Name]?**
>
> Your underwater photos help scientists track reef health here in real time. Every sighting you submit feeds directly into the databases that conservation organisations use to monitor coral bleaching, species population shifts, and reef recovery after bleaching events.
>
> **What to photograph:**
> - Fish and marine life — even if you do not know the species
> - Coral — especially anything pale, white, or unusual
> - Anything unexpected — invasive species, debris, unusual behaviour
>
> **How to capture it:**
> - Shoot JPEG (not RAW) — conservation databases cannot accept RAW files
> - Keep location turned on — GPS coordinates are required for scientific records
> - Note your depth and the date
>
> Come back after your dive to submit. It takes under 2 minutes.
>
> [How does this work? →] *(links to methodology infill module)*

**CTA:** "Submit a sighting after your dive →" — anchors to the submission card lower on the page.

**Methodology infill module** (opens as a modal or inline expandable):

> **How your sighting reaches scientists**
>
> When you submit a photo on Scuba Season, we send it to 5 conservation databases on your behalf:
>
> - **iNaturalist** — the world's largest biodiversity observation platform, used by 400,000 active scientists and naturalists monthly. Your photo is reviewed by the community and, once confirmed, reaches Research Grade status.
> - **GBIF (Global Biodiversity Information Facility)** — an intergovernmental network used by researchers in 100+ countries. Research Grade iNaturalist observations flow here automatically.
> - **OBIS (Ocean Biodiversity Information System)** — the global repository for marine species data, used by IUCN, UN Environment, and reef monitoring programmes worldwide.
> - **iSeahorse** (if you photograph a seahorse) — Project Seahorse's global seahorse population database, used to track one of the ocean's most threatened species groups.
> - **CoralWatch** (if you photograph coral) — University of Queensland's global coral bleaching monitor, tracking reef health across 79 countries.
>
> Your sighting at [Site Name] will appear in our reef health data within 24–48 hours and contributes to the reef label and trajectory we show on this page.

---

### Flow B: Post-dive submission

**Entry point:** Dive site page, submission card below reef health summary.

**Card header:** "Dived here recently? Your sighting helps us track reef health at [Site Name]."

**CTA:** "Submit a sighting" — expands inline or opens modal. No page navigation.

---

#### Step 1 — Upload photos

- Drag and drop or tap to select from device
- Accepts: JPEG, PNG, HEIC (converted server-side to JPEG before submission)
- Up to 10 photos, 20 MB each
- Auto-reads EXIF date if present — pre-fills date in Step 3
- Shows thumbnail grid with remove option per photo
- Error states: file too large, unsupported format
- Photo is required — no skip option

---

#### Step 2 — What did you see?

Three large tap targets:

- **Fish or marine life**
- **Coral**
- **Not sure / something else**

Selecting Coral reveals two additional fields inline (depth and bleaching score) that are required for CoralWatch routing. Selecting either of the others hides those fields.

**Species autocomplete:**
- Text input below the category selector: "Species name (optional)"
- As the user types, query the iNaturalist taxon search API (`GET /taxa?q=...&rank=species`) and show up to 6 matching species with common name + scientific name
- If the user selects a match, we store the `taxon_id` for direct iNaturalist submission (more accurate than text search at submission time)
- If the user types something that has no match and hits enter, store the raw text — submit to iNaturalist as `description` text and flag internally for review
- "Not sure" / leaving blank is always valid — iNaturalist community will ID from the photo
- Seahorse detection: if selected taxon is in genus Hippocampus, iSeahorse tag is added automatically (shown as a small badge: "+ iSeahorse")

**Species input filtering approach:**
- No hard restriction — any text is accepted
- Unmatched free-text species are tagged `needs_review` internally before iNat submission
- Matched taxa (via autocomplete selection) bypass review and submit directly
- This keeps the flow fast for knowledgeable divers while giving us a safety net for garbled inputs

---

#### Step 3 — Quick details

Fields shown in order:

1. **Date** — pre-filled today or from EXIF. Date picker. Required.
2. **Depth** — number input, metres. Optional (required if Coral selected and user wants CoralWatch routing).
3. **Sea temperature** — number input, °C. Optional for all submissions. Shown for all categories, not just Coral.
4. **Bleaching score** — shown only if Coral selected. Single-select pill buttons: Healthy / Pale / Bleached / Dead. Maps to CoralWatch color chart. Required for CoralWatch; if skipped, submission goes to iNaturalist only.
5. **Notes** — free text, 280 chars. Optional.

GPS coordinates pre-filled silently from dive site record. Not shown to user.

---

#### Step 4 — Confirm and submit

> **Your sighting at [Site Name]**
> [Photo thumbnails]
> [Category] · [Species if entered] · [Depth if entered] · [Date]
>
> Submitting to:
> — iNaturalist
> — GBIF (via iNaturalist)
> — OBIS (via iNaturalist)
> [— iSeahorse] *(if seahorse)*
> [— CoralWatch queue] *(if coral + depth + bleaching score)*

Primary CTA: "Submit" / Secondary: "Edit"

No email prompt. No account creation.

---

#### Step 5 — Confirmation

> **Submitted. Thank you.**
> Your photo is now part of [Site Name]'s reef record. iNaturalist's community of experts will help identify any unknown species within a few days.

Small print: "Sightings submitted via Scuba Season appear under the ScubaSeason observer account on conservation platforms."

"Submit another sighting →" resets the form to Step 1, keeping the dive site context.

---

## Backend: iNaturalist Submission

**Account:** One `scubaseason` iNaturalist account (`josie@scubaseason.fun`). App registration at `inaturalist.org/oauth/applications` requires the account to be 2+ months old with 10+ observation quality improvements — **account created 2026-06-15, API registration eligible from ~2026-08-15.**

**Submission sequence:**
1. `POST /observations` — lat/lon, date, taxon_id (if matched) or no taxon (if unknown), description (notes + raw species text if unmatched), place_guess
2. `POST /observation_photos` — each photo file as multipart/form-data
3. If Hippocampus taxon: `POST /project_observations` with `project_id=871`

**Rate limits:** 100 req/min, 10,000/day. Not a concern at v1 volume.

**Error handling:** Store submission locally on failure. Retry with exponential backoff, max 3 attempts. If all retries fail, mark as `failed` and trigger Telegram alert (see Notifications). Show user: "We will resubmit your photo within 24 hours."

**Photo prep:** Convert HEIC → JPEG server-side. Do not strip EXIF. Enforce 20 MB limit client-side before upload begins.

---

## Backend: CoralWatch Batch Submission

**Account:** One `ScubaSeason` CoralWatch account.

**Queue:** Coral submissions with depth + bleaching score (and temperature if provided) written to `coralwatch_queue` table with status `pending`.

**Weekly batch job:** Every Monday. Export pending records, submit via CoralWatch web form or CSV (confirm CSV support at account setup). Mark records `submitted`. Trigger Telegram summary on completion (see Notifications).

**CoralWatch field mapping:**

| CoralWatch field | Source |
|---|---|
| Surveyor name | "Scuba Season" |
| Reef name | Dive site name |
| Country | Dive site country |
| GPS co-ordinates | Dive site lat/lon |
| Date | User-submitted date |
| Time | Submission timestamp |
| Sea temperature | User-submitted °C (or "not recorded" if blank) |
| Coral depth | User-submitted depth |
| Conditions | "not recorded" |
| Activity | "Recreational dive" |
| Bleaching score | User-submitted bleaching score |

---

## Notifications: Telegram

All alerts go to Telegram chat_id `1289833065` (Josie / Scuba Season ops). Credentials from `~/.openclaw/openclaw.json` `.channels.telegram`.

**On successful iNaturalist submission:**
> ✅ New sighting submitted — [Site Name]
> [Category] · [Species or "Unknown"] · [Date]
> iNat observation: [observation URL]

**On failed iNaturalist submission (all retries exhausted):**
> ❌ Sighting submission FAILED — [Site Name]
> [Category] · [Date] · Error: [error message]
> Stored locally for manual review.

**On weekly CoralWatch batch (every Monday after batch runs):**
> 🪸 CoralWatch weekly batch complete
> [N] records submitted · [M] pending next week
> Any errors: [list or "none"]

**On weekly CoralWatch batch failure:**
> ❌ CoralWatch batch FAILED
> [N] records stuck in queue · Error: [error message]
> Manual intervention required.

---

## Test Cases

### iNaturalist submission

| # | Scenario | Input | Expected outcome |
|---|---|---|---|
| T01 | Happy path — known species | JPEG photo, "clownfish" (matched taxon), depth 12m, date today | Observation created on iNat with taxon_id, photo attached, Telegram success alert sent |
| T02 | Happy path — unknown species | PNG photo, species blank, "Not sure" category | Observation created on iNat with no taxon, photo attached, iNat community can ID |
| T03 | Seahorse auto-tag | JPEG photo, species "Hippocampus kuda" selected via autocomplete | Observation created on iNat + project_observation for project_id=871 |
| T04 | HEIC file | HEIC photo from iPhone | Converted server-side to JPEG, submitted successfully |
| T05 | Oversized file | 25 MB JPEG | Client-side rejection before upload, error message shown |
| T06 | Unmatched free-text species | "blueringed octopuss" (typo, no autocomplete match) | Stored as `needs_review`, submitted to iNat as description text, internal flag |
| T07 | API failure + retry | iNat API returns 500 | Retry 3x with backoff, if all fail: Telegram error alert, user sees retry message |
| T08 | RAW file upload | .ARW file | Client-side rejection, show "Please export as JPEG" message |
| T09 | Multiple photos | 10 JPEGs | All 10 attached to single iNat observation |
| T10 | EXIF date pre-fill | JPEG with EXIF date 3 days ago | Date field pre-filled with EXIF date, user can override |

### CoralWatch routing

| # | Scenario | Input | Expected outcome |
|---|---|---|---|
| T11 | Coral with full fields | Coral category, depth 8m, bleaching score "Pale", temp 27°C | iNat submission + CoralWatch queue record with all fields |
| T12 | Coral missing depth | Coral category, no depth entered, bleaching score filled | iNat submission only, CoralWatch queue skipped, user informed |
| T13 | Coral missing bleaching score | Coral category, depth 8m, no bleaching score | iNat submission only, CoralWatch queue skipped |
| T14 | Coral with both required | Coral category, depth + bleaching score, no temperature | CoralWatch record queued with temperature = "not recorded" |
| T15 | Weekly batch success | 12 records in queue | All 12 submitted, marked submitted, Telegram batch summary sent |
| T16 | Weekly batch failure | CoralWatch site unreachable | Records remain pending, Telegram failure alert sent |

### Species autocomplete

| # | Scenario | Input | Expected outcome |
|---|---|---|---|
| T17 | Partial match | User types "clown" | Dropdown shows up to 6 taxa including Amphiprion spp. with common names |
| T18 | Exact match selected | User selects "Clownfish (Amphiprion ocellaris)" | taxon_id stored, submits directly to iNat without review flag |
| T19 | No match found | User types "asdfgh" and submits | Raw text stored, `needs_review` flag set, submitted as description |
| T20 | Empty species | User leaves blank | Submitted to iNat as unknown, valid submission |

### Pre-dive brief

| # | Scenario | Expected outcome |
|---|---|---|
| T21 | Methodology modal opens | User clicks "How does this work?" | Modal opens with full org list and data flow explanation |
| T22 | CTA anchor | User clicks "Submit a sighting after your dive →" | Page scrolls to submission card |
| T23 | Mobile collapse | Viewport < 768px | Brief collapses to summary line with expand option |

---

## Open Questions

1. **Attribution wording** — confirm Scuba Season is comfortable with all observations appearing under the ScubaSeason observer account on iNaturalist. This is publicly visible.

2. **Volume threshold for CoralWatch automation** — manual batch becomes unscalable above ~200 coral submissions/week. At that point, pursue ALA/BioCollect API partnership.

3. **Pre-dive brief placement** — sidebar card vs inline below hero. Confirm during UI implementation against current dive site page layout.
