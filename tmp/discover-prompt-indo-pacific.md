## Region focus (worker: indo-pacific)

You MUST pick a missing dive site from one of these regions/countries:
Indonesia, Philippines, Malaysia, Thailand, Vietnam, Papua New Guinea, Solomon Islands, Fiji, Vanuatu, Micronesia (Palau/Yap/Chuuk/Pohnpei), French Polynesia, Cook Islands, Tonga, Samoa, Australia, New Zealand, Japan, South Korea, Taiwan, China, Hawaii

If every famous site in this region is already covered, print EXHAUSTED. Do not pick from outside this region.

---

You are autonomously adding dive sites to scubaseason.fun. Complete this task fully without asking questions.

## Your job
1. Read `src/data/sites.json` and `src/data/locations.json`
2. If `src/data/coverage-gaps.json` exists, prefer picks from there (these are sites our competitors cover that we don't — high editorial priority)
3. Otherwise pick the most editorially important missing dive site (famous, highly-searched, from a location with 0-1 sites)
4. Research it using web search — find depth, coordinates, species, conditions, AND a great hero image
5. Add it to `src/data/sites.json` in the exact schema below
6. Commit and push to main

## Schema (add to the JSON array — match this exactly)
```json
{
  "id": "locationId-site-slug",
  "slug": "locationId-site-slug",
  "locationId": "must-match-an-id-from-locations.json",
  "name": "Site Name",
  "heroImageUrl": "https://upload.wikimedia.org/... (Wikimedia Commons only, or null)",
  "lat": 0.0,
  "lng": 0.0,
  "description": "80-800 chars. Concrete, evocative, factual. No fluff words like 'paradise'.",
  "depthRange": { "min": 5, "max": 30 },
  "skillLevel": "open-water|advanced|tech|never-dived",
  "diveTypes": ["coral|large-pelagics|wrecks|macro|geology"],
  "species": [
    { "commonName": "Name", "scientificName": "Optional", "reliability": "year-round|seasonal|rare", "bestMonths": [1,2,3] }
  ],
  "conditionsByMonth": [
    { "month": 1, "waterTempC": {"min": 26, "max": 29}, "visibilityM": {"min": 15, "max": 25}, "currentStrength": "none|mild|moderate|strong", "suitRecommendation": "Tropical wetsuit" }
  ],
  "bestMonths": [1,2,3],
  "editorialRank": 85,
  "getThere": "Nearest airport(s) and how to get to the dive site.",
  "lodging": [],
  "operators": [],
  "gearIds": [],
  "siteSpecificGear": [],
  "notes": "Permits, hazards, access info or null"
}
```

## Rules
- conditionsByMonth MUST have exactly 12 entries (months 1-12)
- description: NO "paradise", "unforgettable", "pristine" — be specific
- Verify facts from at least 2-3 sources before writing
- Do NOT add a site already in sites.json (check by name and coordinates)
- After writing the JSON, run: git add src/data/sites.json && git commit -m "auto: add <site name>" && git push

## Hero image — this matters; spend real effort here

The hero image is what sells the site. It must be:
1. **High resolution** — minimum 1600 px on the long edge. Prefer 3000+ px. Skip thumbnails.
2. **Specifically of this dive site** — not a generic species photo or stock reef shot. An underwater photo taken AT this site, showing the actual landmark/feature/animal that makes the site famous (e.g. the actual wreck for a wreck site, the actual pinnacle, the actual school of hammerheads on THIS seamount, the actual cenote arch). Generic "grey reef shark from Red Sea" stand-ins for a Pacific site = NO.
3. **The most iconic / revered shot you can find** — the image most associated with this site in dive magazines, photography awards, or the site's Wikipedia page hero. If the site has an obvious "money shot" in the diving world, find that one.
4. **From Wikimedia Commons only** — license-safe. Use Wikimedia search and the file's "Original file" link. Verify the URL returns 200 by checking the file page exists.

**Selection process (do this every time):**
1. **Re-read the description you just wrote.** Identify the one thing this site is KNOWN FOR — the WWII wreck, the manta cleaning station, the hammerhead school, the cenote light beam, the cathedral cavern, the sardine bait ball. That signature feature is what the hero photo must depict.
2. Search Wikimedia Commons for the exact site name AND variations (local name, alternate spellings)
3. Also search for the signature feature itself (e.g. Tulamben → "USAT Liberty wreck"; Malapascua → "thresher shark Monad Shoal"; Yonaguni → "Yonaguni underwater ruins")
4. Check the site's English Wikipedia article — its lead image is usually the canonical shot
5. Compare 3-5 candidates against the description. **Reject any candidate whose subject doesn't match what the description says the site is famous for.** A coral-garden photo on a wreck-dive card is WRONG even if location-correct. Match subject to description, not just location.
6. Use the FULL-resolution direct-file URL (not the thumb URL). Format: `https://upload.wikimedia.org/wikipedia/commons/X/XX/Filename.jpg`
7. If no genuinely site-specific high-quality Commons image exists that matches the signature feature, set `heroImageUrl: null`. A null is better than a misleading or off-topic photo.

**Subject-must-match-description checklist:**
- Description mentions a wreck → hero shows that wreck (or any wreck at the site)
- Description mentions a specific animal (manta, hammerhead, thresher, whale shark) → hero shows that animal
- Description mentions a cave / cavern / swim-through / arch → hero shows that geology
- Description mentions a cleaning station / aggregation / bait ball / sardine run → hero shows that behavior or massed school
- Description mentions soft coral / sea fans / kelp forest → hero shows that
- Only when the description is genuinely generic ("classic wall dive, healthy reef life") is a generic reef shot acceptable

## When done
Print: DONE: <site name> added successfully
If you cannot find a good site to add (all famous ones are covered), print: EXHAUSTED
