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
- Search Wikimedia Commons for the exact site name AND variations (local name, alternate spellings)
- Also search for the site's signature feature (e.g. for Yonaguni Monument: "Yonaguni underwater ruins")
- Check the site's English Wikipedia article — its lead image is usually the canonical shot
- Compare 3-5 candidates. Pick the one that is most specific + highest resolution
- Use the FULL-resolution direct-file URL (not the thumb URL). Format: `https://upload.wikimedia.org/wikipedia/commons/X/XX/Filename.jpg`
- If no genuinely site-specific high-quality Commons image exists, set `heroImageUrl: null` rather than using a generic stand-in. A null is better than a misleading photo.

## When done
Print: DONE: <site name> added successfully
If you cannot find a good site to add (all famous ones are covered), print: EXHAUSTED
