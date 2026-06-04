# Data Models — scubaseason.fun

All TypeScript types defined in `src/lib/data/types.ts`. All data stored in `src/data/*.json`.

## Core Entity Hierarchy

```
Location (113)
 └── Site[] (356, via locationId)
      └── SpeciesEntry[] (embedded)
      └── SightingEvidence[] (442, by siteId)
      └── WreckRecord[] (30, by siteId)

Location
 └── ReefHealthRecord[] (116, by locationId or siteId)
 └── ReefPressureRecord (108, by locationId)
 └── FishingPressureRecord (113, by locationId)
 └── CoralCoverSnapshot (13 jurisdictions, by appliesTo[])
 └── WaterQualityRecord (23, by locationId)
 └── LocationDetails (109, by id)
 └── Encounter[] (11, via inAtlasLocationId / nearbyAtlasLocationIds)

Encounter
 └── EncounterRegion[] (embedded)
 └── Operator[] (9, via operatorIds)

IucnStatus (258, keyed by lowercased scientific name)
SpeciesPhotoCredit (520, keyed by lowercased scientific/common name)
DataSource (63, registry — referenced by sourceIds on most entities)
MethodologyNote (18, registry — referenced by methodologyClaimIds on most entities)
```

## Primary Types

### Location
Top-level atlas entry (a diving region or destination):
```typescript
interface Location {
  id: string             // kebab-case unique ID
  slug: string           // URL slug (same as id usually)
  name: string
  country: string
  region: string
  countryCode: string    // ISO 3166-1 alpha-2
  lat: number
  lng: number
  description: string
  bestMonths: number[]   // 1–12
  siteIds: string[]
  heroImageUrl?: string
  sourceIds?: string[]
  methodologyClaimIds?: string[]
}
```

### Site
A specific dive site (child of Location):
```typescript
interface Site {
  id: string
  slug: string
  locationId: string
  name: string
  lat: number; lng: number
  description: string    // 80–800 chars
  depthRange: { min: number; max: number }
  skillLevel: SkillLevel
  diveTypes: DiveType[]
  species: SpeciesEntry[]
  conditionsByMonth: ConditionsMonth[]  // exactly 12 entries
  bestMonths: number[]
  editorialRank: number  // 1–100
  heroImageUrl?: string
  getThere: string       // ≥40 chars
  lodging: PartnerLink[]
  operators: PartnerLink[]
  gearIds: string[]
  siteSpecificGear: SiteGearItem[]
  notes?: string
  sourceIds?: string[]
  methodologyClaimIds?: string[]
}
```

### SpeciesEntry (embedded in Site)
```typescript
interface SpeciesEntry {
  commonName: string
  scientificName?: string
  reliability: "year-round" | "seasonal" | "rare"
  bestMonths?: number[]    // required when reliability = "seasonal"
  depthRange?: { min: number; max: number }
  sourceIds?: string[]
  methodologyClaimIds?: string[]
  imageUrl?: string        // iNaturalist CDN URL
}
```

### SightingEvidence
Aggregated occurrence evidence per site+species:
```typescript
interface SightingEvidence {
  id: string
  siteId: string
  speciesCommon: string
  speciesScientific?: string
  lastConfirmedAt: string | null   // ISO date
  recentRecordCount: number        // GBIF/OBIS record count
  proximityRadiusKm: number
  seasonalityMonths: number[]
  confidence: Confidence
  sourceIds: string[]
  methodologyClaimIds: string[]
  notes?: string
}
```

Note: `probabilityPercent` is **explicitly forbidden** by the methodology. No per-dive probabilities without an effort denominator.

### ReefHealthRecord
```typescript
interface ReefHealthRecord {
  id: string
  locationId?: string
  siteId?: string          // exactly one of locationId or siteId must be set
  observed?: ObservedReefCondition
  thermalStress?: ThermalStress
  projection?: ReefProjection
  divingOutlook?: string
  methodologyClaimIds: string[]
  lastReviewedAt: string
}

interface ObservedReefCondition {
  surveyDate: string
  surveyMethod: string
  coralCoverPercent?: number
  bleachedPercent?: number
  mortalityPercent?: number
  historicalCoralCoverPercent?: number
  historicalSurveyDate?: string
  sourceIds: string[]
  notes?: string
}

interface ThermalStress {
  asOf: string
  alertLevel: BleachingAlertLevel   // "no-stress"|"watch"|"warning"|"alert-1"|"alert-2"
  degreeHeatingWeeks?: number
  sstAnomalyC?: number
  hotspotC?: number
  sourceIds: string[]
  source?: "noaa-crw-live"
  fetchedAt?: string
}
```

### ReefPressureRecord
```typescript
interface ReefPressureRecord {
  id: string
  locationId: string
  mpaStatus: "no-protection" | "designated-multi-use" | "strict-mpa" | "no-take"
  mpaSinceYear?: number
  mpaName?: string
  fishingPressure: "low" | "moderate" | "high" | "very-high" | "unknown"
  topPressures: string[]          // e.g. ["tourism", "anchor damage"]
  greenFinsOperatorCount?: number
  visitorImpactNote: string
  methodologyClaimIds: string[]
  lastReviewedAt: string
}
```

### FishingPressureRecord
```typescript
interface FishingPressureRecord {
  locationId: string
  radiusKm: number                // always 50 km
  current: { year: number; fishingHours: number }
  historical?: { year: number; fishingHours: number }  // 4 years prior
  fetchedAt: string
  source: "global-fishing-watch"
}
```

### CoralCoverSnapshot
Jurisdiction-level NOAA NCRMP / AGRRA reference data:
```typescript
interface CoralCoverSnapshot {
  id: string
  label: string
  program: "NOAA NCRMP" | "AGRRA" | "NOAA Pacific NCRMP"
  programUrl: string
  method: string
  current: { year: number; coverPercent: number }
  historical?: { year: number; coverPercent: number }
  sourceUrl: string
  sourceLabel: string
  notes?: string
  appliesTo: string[]    // locationIds this snapshot covers
}
```

### Encounter
Bucket-list marine encounter:
```typescript
interface Encounter {
  id: string; slug: string; name: string
  category: EncounterCategory
  speciesCommon?: string; speciesScientific?: string
  shortDescription: string
  bestMonths: number[]
  difficulty: EncounterDifficulty
  requiredExperience: string
  ethicsNotes: string
  conservationNotes: string
  limitations: string
  confidence: Confidence
  regions: EncounterRegion[]
  operatorIds: string[]
  sourceIds: string[]; methodologyClaimIds: string[]
  bucketListRank?: number
  heroImageUrl?: string
}

interface EncounterRegion {
  name: string; country: string
  status: "primary" | "secondary" | "emerging" | "closed"
  inAtlasLocationId?: string
  nearbyAtlasLocationIds?: string[]
  whyHere: string
  bestMonthsAtRegion: number[]
  statusNote?: string
}
```

### IucnStatus
```typescript
interface IucnStatus {
  scientificName: string    // lowercased binomial
  commonName?: string
  category: "EX"|"EW"|"CR"|"EN"|"VU"|"NT"|"LC"|"DD"|"NE"
  categoryLabel: string
  populationTrend?: string
  lastAssessedYear?: number
  assessmentUrl?: string
  source: "iucn-red-list"
  fetchedAt: string
}
```

### Provenance Types

```typescript
interface DataSource {
  id: string; name: string; url?: string; publisher?: string
  sourceType: SourceType; accessedAt: string; license?: string; notes?: string
}

interface MethodologyNote {
  claimId: string; claimType: ClaimType; sourceIds: string[]
  confidence: Confidence; calculation?: string; limitations: string
  lastReviewedAt: string
}
```

Every data claim in the system references `sourceIds[]` (pointing to `DataSource` records) and `methodologyClaimIds[]` (pointing to `MethodologyNote` records). The `validate-provenance.mjs` script enforces this integrity at CI time.

## Reef State Classification

**Three states** computed by `src/lib/data/reef-state.ts`:

| State | Color | Decision rule |
|---|---|---|
| `thriving` | `#10b981` (green) | coralCover ≥ 40% (or null) AND alertRank ≤ 1 AND fishing is low/unknown |
| `pressure` | `#0089de` (blue) | Everything else |
| `change` | `#f43f5e` (pink) | coralCover < 25% OR alertRank ≥ 3 (alert-1 or alert-2) |

Alert levels ranked: `no-stress=0`, `watch=1`, `warning=2`, `alert-1=3`, `alert-2=4`.

The `change` check runs first (most severe), then `thriving`, with `pressure` as the default.

## Enum Types Summary

```typescript
type SkillLevel = "never-dived" | "open-water" | "advanced" | "rescue" | "divemaster" | "tech"
type DiveType = "large-pelagics" | "coral" | "macro" | "wrecks" | "geology" | "blackwater"
type BleachingAlertLevel = "no-stress" | "watch" | "warning" | "alert-1" | "alert-2"
type MpaStatus = "no-protection" | "designated-multi-use" | "strict-mpa" | "no-take"
type FishingPressureLevel = "low" | "moderate" | "high" | "very-high" | "unknown"
type Confidence = "high" | "medium" | "low"
type SourceType = "scientific-survey" | "government-monitoring" | "occurrence-record"
  | "citizen-science" | "operator-report" | "booking-partner" | "editorial-curation" | "peer-reviewed-paper"
type ClaimType = "species-presence" | "sighting-probability" | "seasonality" | "reef-health"
  | "bleaching-risk" | "travel-recommendation" | "gear-recommendation"
type GearCategory = "mask" | "snorkel" | "fins" | "boots" | "wetsuit" | "drysuit" | "bcd"
  | "regulator" | "computer" | "light" | "reel-smb" | "reef-hook" | "gloves" | "hood" | "bag" | "specialty"
type WreckVesselType = "freighter" | "tanker" | "warship" | "submarine" | "aircraft"
  | "ferry" | "fishing" | "cable-layer" | "research" | "tug" | "other"
type WreckSunkCause = "wartime-attack" | "scuttled-artificial-reef" | "scuttled-disposal"
  | "accident" | "storm" | "unknown"
type LodgingTier = "budget" | "mid" | "upscale" | "luxury" | "liveaboard"
type FlightHub = "us-west" | "us-east" | "europe" | "asia" | "oceania"
type EncounterCategory = "shark-aggregation" | "ray-aggregation" | "pelagic-migration"
  | "cage-dive" | "blackwater" | "mating-event" | "spawning-event" | "cleaning-station" | "cephalopod-aggregation"
type EncounterDifficulty = "beginner" | "intermediate" | "advanced" | "expert"
```

## Data Integrity Rules (enforced by validate-provenance.mjs)

- Every `sightingEvidence` record must have `sourceIds` and `methodologyClaimIds`; `probabilityPercent` is **forbidden**
- Every `reefHealth` record must reference exactly one of `locationId` or `siteId`
- Every `reefHealth.observed.sourceIds` and `thermalStress.sourceIds` must resolve to known sources
- Every `methodology.claimType = "sighting-probability"` must have a `calculation` field
- Sources with `accessedAt` > 365 days old produce warnings
- `methodologies.limitations` must be non-empty
