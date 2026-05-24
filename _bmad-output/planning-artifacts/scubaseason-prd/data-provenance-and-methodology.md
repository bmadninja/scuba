---
title: scubaSeason.Fun — Data Provenance & Methodology Requirements
created: 2026-05-22
status: draft
purpose: Cross-cutting requirements for source attribution, confidence, and math display
---

# Data Provenance & Methodology Requirements

## 1. Principle

scubaSeason.Fun must show users where its recommendations come from and how confidence is calculated. This is a product trust feature, not only an internal data-quality practice.

Every animal, seasonality, reef-health, climate, operator, lodging, and bucket-list recommendation should be traceable to named sources and should distinguish verified data from editorial judgment.

## 2. User-Facing Source Display

Each site, location, animal encounter, and bucket-list experience should include a visible "Sources & methodology" surface.

Minimum display:

- Source names with outbound links where allowed
- Last checked date
- Data type: survey, occurrence record, operator report, government monitoring, peer-reviewed paper, citizen science, editorial curation
- Confidence level: high / medium / low
- Short plain-language explanation of what the data can and cannot prove

Example:

> Sightings confidence: Medium. Based on 18 recent occurrence records within 75 km, operator seasonality reports, and regional survey data. Occurrence records confirm presence, but do not measure per-dive probability.

## 3. Internal Data Model Requirements

Add provenance fields to any data model that supports recommendations or claims.

Suggested shared type:

```ts
type DataSource = {
  id: string;
  name: string;
  url?: string;
  publisher?: string;
  sourceType:
    | "scientific-survey"
    | "government-monitoring"
    | "occurrence-record"
    | "citizen-science"
    | "operator-report"
    | "booking-partner"
    | "editorial-curation"
    | "peer-reviewed-paper";
  accessedAt: string;
  license?: string;
  notes?: string;
};

type MethodologyNote = {
  claimId: string;
  claimType:
    | "species-presence"
    | "sighting-probability"
    | "seasonality"
    | "reef-health"
    | "bleaching-risk"
    | "travel-recommendation"
    | "gear-recommendation";
  sourceIds: string[];
  confidence: "high" | "medium" | "low";
  calculation?: string;
  limitations: string;
  lastReviewedAt: string;
};
```

## 4. Animal Sightings Math

Do not present a numeric sighting probability unless the source data includes an effort denominator.

Allowed:

- `positive sightings / eligible surveys`
- `positive dives / logged dives`
- `encounter trips with sightings / total trips`
- Month-specific rates when both month and effort are available

Not allowed:

- Turning occurrence records alone into "% chance to see"
- Treating operator marketing copy as probability
- Combining unrelated sources into a precise percentage without documenting assumptions

When only occurrence records exist, display:

- Last confirmed sighting
- Number of recent records
- Distance from site or region
- Seasonality signal if records cluster by month
- Confidence and limitation note

## 5. Reef Health & Climate Math

Separate observed condition, current risk, and projection.

Observed condition:

- Coral cover %
- Bleached coral %
- Mortality %
- Survey date
- Survey method and source

Current thermal risk:

- NOAA Coral Reef Watch alert level / Degree Heating Weeks when available
- Last updated date

Projection:

- Only show site-specific projections when based on a real time series or credible model
- Otherwise show regional scenario language with uncertainty
- Never invent "reef will be X% bleached in two years" without a documented model

## 6. Editorial Review Workflow

Every future story touching data or recommendations must include acceptance criteria for:

- Source records stored with the claim
- Methodology displayed to users
- Confidence and limitations displayed clearly
- Reviewer can update sources/math without rewriting UI code

Recommended review roles:

- Marine science / conservation reviewer for reef-health and climate claims
- Dive professional or regional operator for site-condition sanity checks
- Product/editorial reviewer for user-facing clarity

## 7. Story Approval Implication

Existing sharded stories should not be approved for build until they are refreshed to include these provenance and methodology requirements where relevant.

At minimum, revise:

- Story 1: Add source and methodology types to data model
- Story 2: Display site-level sources and methodology
- Story 3: Require provenance for flagship content facts
- Story 5/6: Explain how recommendation/filter confidence is determined where surfaced
- Story 8: Keep affiliate source data separate from editorial recommendation data
- Story 9: Store source metadata and extraction methodology during discovery/scraping
- Story 10: Include structured provenance where appropriate without harming SEO clarity
