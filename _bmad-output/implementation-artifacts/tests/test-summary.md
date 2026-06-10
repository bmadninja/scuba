# Test Automation Summary

## E2E Tests — 17/17 passing (`tests/recent-changes.spec.ts`)

| Group | Test | Status |
|---|---|---|
| Homepage copy | Shows new subline with dive location count | ✅ |
| Homepage copy | Hero CTA reads "Browse all locations →" | ✅ |
| Homepage copy | Hero CTA reads "Best spots this month →" | ✅ |
| Homepage copy | Old copy "What do you want to see?" is gone | ✅ |
| Homepage copy | Old copy "Where's in season now?" is gone | ✅ |
| Atlas filter | "Thermal stress" section heading removed | ✅ |
| Atlas filter | "Certification level" has InfoTooltip button | ✅ |
| Atlas filter | InfoTooltip button is inside section summary | ✅ |
| InfoTooltip | Tooltip text hidden by default | ✅ |
| InfoTooltip | Click opens; click overlay closes | ✅ |
| Location stats | "Reef state" label has InfoTooltip button | ✅ |
| Location stats | "Coral cover" label has InfoTooltip button | ✅ |
| Location stats | Clicking "Reef state" ? shows definition | ✅ |
| Location stats | Clicking "Coral cover" ? shows definition | ✅ |
| Location page | Live sightings feed removed | ✅ |
| IUCN badges | Badged species have InfoTooltip button | ✅ |
| IUCN badges | Clicking shows Red List explanation | ✅ |

## Hero Photo Underwater Audit — 452 images

| Result | Count |
|---|---|
| Passed (genuine underwater) | 375 |
| Failed (not underwater) | 77 |
| Pass rate | 83% |

### Failure categories

| Category | Examples |
|---|---|
| Satellite/aerial | Ari Atoll ESA, Mergui MODIS, Dahlak, Osprey Reef diagram |
| Aquarium tanks | Mahé (Georgia Aquarium whale shark), Beqa (Sentosa nurse shark), Cod Hole (grouper tank), El Hierro (Atlantis tunnel) |
| Surface/dock | Koh Tao arrivals dock, Milford Sound fjord, Speyside harbour |
| Above-water coastal | Havelock Island beach, Bocas del Toro, Fujairah shoreline, Channel Islands hillside |
| Specimen on white | Saba Marine Park shark cutout, Tiger Beach surface shot |
| Wrong subject entirely | Watamu Kenya (Utah desert canyon), Jeju Island (indoor auditorium) |
| Illustrations/diagrams | Blue Magic site (1888 fish on rack), Cuba Black Coral 2 (reef zone diagram) |

### Remediation applied

- **68 replaced** with genuine underwater Wikimedia Commons photos found by parallel agents
- **9 cleared** — no suitable Commons image exists; fallback cenote photo shown
  - Mergui Archipelago, Jeju Island, Speyside Tobago, B-17 Wreck Croatia (Vis),
    HMAS Brisbane, HMAS Tobruk, First Cathedral Lanai Hawaii,
    Eden Rock Grand Cayman, Million Hope Wreck Egypt

## Next Steps

- Re-run audit after any new hero images are added
- Find underwater replacements for the 9 locations where Commons has nothing
- Add filename pattern guards to `photo-quality.ts` for satellite (ESA, MODIS, NASA Goddard) and aquarium patterns
