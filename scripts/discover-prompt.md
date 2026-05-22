You are autonomously adding dive sites to scubaseason.fun. Complete this task fully without asking questions.

## Your job
1. Read `src/data/sites.json` and `src/data/locations.json`
2. Pick the most editorially important missing dive site (famous, highly-searched, from a location with 0-1 sites)
3. Research it using web search — find depth, coordinates, species, conditions
4. Add it to `src/data/sites.json` in the exact schema below
5. Commit and push to main

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
- heroImageUrl: only real Wikimedia Commons URLs you verified, otherwise null
- description: NO "paradise", "unforgettable", "pristine" — be specific
- Verify facts from at least 2-3 sources before writing
- Do NOT add a site already in sites.json (check by name and coordinates)
- After writing the JSON, run: git add src/data/sites.json && git commit -m "auto: add <site name>" && git push

## When done
Print: DONE: <site name> added successfully
If you cannot find a good site to add (all famous ones are covered), print: EXHAUSTED
