---
title: scubaSeason.Fun — Personas, Bucket-List Encounters & Climate Research Addendum
created: 2026-05-22
status: draft
purpose: Research-first expansion before story approval
depends_on:
  - prd.md
  - architecture.md
  - data-provenance-and-methodology.md
---

# Personas, Bucket-List Encounters & Climate Research Addendum

## 1. Product Shift

The product should support guided intent paths, not only filters.

The current filter model answers:

> "Show me sites matching these facets."

The expanded model should also answer:

> "I am this kind of diver. What should I do next?"

and:

> "I want to see this animal or bucket-list event. Where, when, how likely, how hard, and what is changing environmentally?"

## 2. Primary Personas

### Persona A — Absolute Beginner / Certification Seeker

Intent:

- "I want to learn to dive."
- "Where should I get certified?"
- "What is safe and beginner-friendly?"
- "What gear do I actually need now vs later?"

Decision factors:

- Course availability: Discover Scuba / Open Water
- Calm conditions, shallow sites, easy logistics
- Reputable dive centers
- Medical/safety readiness
- Last-mile travel simplicity
- Starter gear recommendations

Recommended product flow:

1. User chooses "I want to learn to dive."
2. Ask lightweight readiness questions: swimming comfort, destination preference, budget, travel timing.
3. Recommend beginner-friendly destinations and certification paths.
4. Show why: calm water, training operators, easy logistics, season, safety notes.
5. Link to training/dive centers and starter gear.

Evidence sources:

- PADI course pages and certification FAQ for course structure and basic prerequisites
- DAN safety/refresher guidance for conservative safety framing
- Local operator/course listings for availability
- Existing site data for conditions and seasonality

Important limitation:

scubaSeason.Fun should not certify users or replace instructor judgment. It should recommend training paths and locations, then send users to certified agencies/operators.

### Persona B — Returning Diver

Intent:

- "I am certified, but I have not dived in years."
- "Where can I restart safely?"

Decision factors:

- Recency: especially 1+ years or 2+ years
- Refresher availability
- Easy conditions and supervised first dives
- Low-current sites
- Gear refresh / computer familiarity

Evidence sources:

- DAN Return to Diving Safely and refresher guidance
- Operator listings that mention refresher / reactivate / check dive options
- Site condition data

### Persona C — Advanced Species-Chaser

Intent:

- "I want to see hammerheads / mantas / whale sharks / thresher sharks."
- "Where is best this month?"
- "What are my odds?"
- "How technical or difficult is it?"

Decision factors:

- Species presence and seasonality
- Sighting reliability and last confirmed sighting
- Dive difficulty: current, depth, remoteness, liveaboard-only, blue-water risk
- Required cert/experience
- Conservation and climate context

Recommended product flow:

1. User chooses animal or encounter.
2. Show ranked destinations by season, confidence, difficulty, and urgency.
3. Explain evidence: sightings/surveys/operators/occurrence records.
4. Show caveat: "presence confirmed" vs "probability measured."

### Persona D — Bucket-List Experience Planner

Intent:

- "I want to do the sardine run."
- "I want to cage dive with great whites."
- "I want the world's best manta / hammerhead / blackwater / spawning aggregation trip."

Decision factors:

- Experience type and ethical considerations
- Season window
- Operator specialization
- Required skill level
- Logistics and cost
- Environmental/conservation risk

Recommended product flow:

1. Browse "Bucket List" experiences.
2. Each experience has a canonical guide page.
3. Guide links to sites/locations/operators.
4. Evidence and confidence are visible.

## 3. New Data Type: Encounter

The current `Site` model is not enough for bucket-list experiences. Add an `Encounter` model that can represent a species, event, or experience across multiple sites.

Suggested type:

```ts
type Encounter = {
  id: string;
  slug: string;
  title: string;
  encounterType:
    | "species"
    | "migration"
    | "aggregation"
    | "cage-dive"
    | "night-dive"
    | "blackwater"
    | "wreck"
    | "geology"
    | "conservation";
  summary: string;
  targetSpecies?: SpeciesEntry[];
  bucketListRank?: number;
  difficulty: "beginner" | "open-water" | "advanced" | "expert" | "technical";
  ethicalNotes?: string;
  conservationNotes?: string;
  bestMonths: number[];
  locations: EncounterLocation[];
  sourceIds: string[];
  methodologyIds: string[];
};

type EncounterLocation = {
  locationId: string;
  siteIds?: string[];
  seasonMonths: number[];
  reliability: "high" | "medium" | "low" | "unknown";
  evidenceType:
    | "survey-effort"
    | "occurrence-records"
    | "operator-reports"
    | "citizen-science"
    | "editorial";
  lastConfirmedSighting?: string;
  estimatedChanceBand?: "common" | "possible" | "rare" | "unknown";
  difficultyNotes: string;
};
```

## 4. Bucket-List Experience Candidates

Initial set to research:

- Sardine run — South Africa
- Great white cage diving — South Africa / Australia / Guadalupe if access changes
- Hammerhead schools — Cocos, Galapagos, Socorro, Bimini
- Whale sharks — Maldives, Philippines, Ningaloo, Mexico, Djibouti
- Manta cleaning stations — Maldives, Raja Ampat, Komodo, Socorro
- Thresher sharks — Malapascua
- Mobula ray aggregations — Baja / Sea of Cortez
- Blackwater diving — Kona / Philippines / Palau
- Coral spawning — Great Barrier Reef / Caribbean / Red Sea where documented
- Mandarin fish dusk spawning — Philippines / Indonesia
- Muck macro holy grail — Lembeh / Anilao
- Giant cuttlefish aggregation — Whyalla, South Australia

Each candidate needs:

- Season window
- Best-known sites/locations
- Skill level and safety notes
- Evidence sources
- Confidence and limitations
- Conservation / climate context

## 5. "Hardest To Spot" Animals

Create a rarity or elusiveness index that does not fake precision.

Suggested dimensions:

- Geographic range narrowness
- Seasonal window narrowness
- Depth / technical barrier
- Nocturnal or behavior-specific visibility
- Number of recent verified records near diveable sites
- Survey effort availability
- Operator specialization required

Display example:

> Elusiveness: Very High. Confirmed in the region, but recent records are sparse and sightings depend on season, depth, and specialist operators. Treat this as a target, not a promise.

Avoid:

- "90% chance" unless denominator data exists
- Ranking based only on marketing copy
- Treating social posts as verified records without flags

## 6. Animal Sighting Source Strategy

Source hierarchy:

1. Survey datasets with effort denominator: best for probability
2. Repeated operator logs with trip counts: useful if accessible
3. Reef Life Survey / scientific observations: useful for fish and reef species presence
4. OBIS / GBIF occurrence records: useful for last confirmed presence and geography
5. Citizen science / photo ID databases: useful for charismatic megafauna if records are dated/geotagged
6. Operator/editorial claims: useful for narrative and leads, not probability

Display rule:

- Use "chance" only for sources with effort denominator.
- Use "confidence" for mixed sources.
- Use "last confirmed" for occurrence-only evidence.

## 7. Reef Health & Climate Storytelling

Goal:

Show users what is changing underwater in a way that is visually clear, emotionally compelling, and scientifically careful.

Site detail page should eventually include a "Reef health & climate" section with:

- Current thermal stress / bleaching alert
- Latest observed reef condition if available
- Historical trend where data exists
- What this means for divers
- What this does not prove
- Conservation links / responsible travel notes

Visual ideas:

- Reef health status card: Healthy / Stressed / Bleaching Watch / Severe Heat Stress / Recovering / Unknown
- Timeline: last surveys, bleaching events, recovery periods
- "Go now?" framing as "What may change" rather than exploitative last-chance tourism
- Before/after photo support only when rights and dates are clear

Copy principle:

Use urgency with responsibility:

> This reef is under increasing thermal stress. Visiting responsibly can support local operators and conservation, but the goal is not to consume a disappearing place. Understand what is changing and choose operators who reduce impact.

## 8. Climate Source Strategy

Use three separate evidence tracks:

### Current Thermal Stress

Primary source:

- NOAA Coral Reef Watch daily 5km products: Degree Heating Weeks, HotSpot, SST anomaly, Bleaching Alert Area

Use for:

- Current bleaching risk
- Recent heat stress
- Alert-level display

Limitations:

- Satellite/grid-based heat stress is not the same as observed bleaching at a specific dive site.
- Depth, local currents, storms, and reef structure can change local outcomes.

### Observed Reef Condition

Sources by region:

- AIMS Long-Term Monitoring Program for Great Barrier Reef
- NOAA National Coral Reef Monitoring Program for US coral jurisdictions
- GCRMN regional/global reports for broad trends
- Reef Life Survey habitat data where available
- Reef Check / AGRRA / local monitoring programs when accessible

Use for:

- Coral cover
- Bleaching or mortality observations
- Long-term trend context

Limitations:

- Coverage is uneven across dive destinations.
- Survey cadence varies.
- Some sources are regional, not site-specific.

### Projection / Future Risk

Use only when credible:

- Published models
- Regional assessments
- Repeated local time series with transparent method

Avoid:

- Site-specific "in two years this reef will be X% bleached" claims without a model.
- Converting global climate statements into precise local predictions.

## 9. Math Rules

### Sighting Probability

Allowed formula:

```text
sighting_probability = positive_survey_events / eligible_survey_events
```

Where:

- `positive_survey_events` = dives/surveys/trips where target species was observed
- `eligible_survey_events` = dives/surveys/trips in the relevant location/season where the species could have been recorded

Confidence modifiers:

- Recent records get more weight than old records
- Site-specific records get more weight than regional records
- Survey data gets more weight than marketing/editorial data
- Larger sample size increases confidence

### Occurrence-Only Evidence

Do not calculate sighting probability.

Display:

```text
last_confirmed_sighting = max(eventDate)
recent_record_count = records within time window
seasonality_signal = count(records by month)
confidence = based on recency + source quality + proximity
```

### Reef Health

Observed condition:

```text
observed_health = reported coral cover / bleaching / mortality from survey source
```

Thermal stress:

```text
thermal_stress = NOAA Degree Heating Weeks + Bleaching Alert Area
```

Projection:

```text
projection = only from cited model or transparent local trend method
```

## 10. Implications For Story Approval

Before moving to SM -> Dev -> QA, revise the story queue to include:

- Persona flows and recommendation paths
- Encounter model and bucket-list guide pages
- Sources and methodology UI
- Sighting confidence and rarity display
- Reef health/climate data model and UI
- Data ingestion/audit tooling for sources

Do not approve a story that asks Dev to build a recommendation without specifying:

- What data source supports it
- What calculation, if any, is used
- What confidence/limitation is displayed
- How an expert reviewer can update or challenge the claim

## 11. Initial Source Links

- NOAA Coral Reef Watch: https://coralreefwatch.noaa.gov/main/
- NOAA CRW DHW product: https://www.coralreefwatch.noaa.gov/product/5km/index_5km_dhw.php
- NOAA CRW ERDDAP DHW dataset: https://coastwatch.noaa.gov/erddap/griddap/noaacrwdhwDaily
- Allen Coral Atlas methods: https://www.allencoralatlas.org/methods
- GCRMN 2020 report: https://gcrmn.net/2020-report/
- AIMS Long-Term Monitoring Program: https://www.aims.gov.au/research-topics/monitoring-and-discovery/monitoring-great-barrier-reef/long-term-monitoring-program
- AIMS 2024/25 GBR condition summary: https://www.aims.gov.au/monitoring-great-barrier-reef/gbr-condition-summary-2024-25
- Reef Life Survey data: https://reeflifesurvey.com/survey-data/
- GBIF Occurrence API: https://techdocs.gbif.org/en/openapi/v1/occurrence
- OBIS portal: https://portal.obis.org/
- DAN Return to Diving Safely: https://dan.org/safety-prevention/return-to-diving-safely/
- DAN Diving Skills Refresher: https://dan.org/safety-prevention/return-to-diving-safely/diving-skills-refresher/
- PADI Discover Scuba Diving: https://store.padi.com/en-us/courses/discover-scuba-diving/p/discover-scuba-diving/
- PADI Scuba Certification FAQ: https://www.padi.com/help/scuba-certification-faq
