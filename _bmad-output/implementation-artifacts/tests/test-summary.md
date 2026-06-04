# Test Automation Summary

## Framework

**Playwright** — installed as `@playwright/test`, Chromium browser only (local). Config at `playwright.config.ts`.

Run with: `npm test` or `npx playwright test`

## Generated Tests

### E2E Tests

- [x] `tests/homepage.spec.ts` — Hero loads, reef state counts visible, featured destinations, nav link, click-through navigation
- [x] `tests/search.spec.ts` — Empty state, search by location (palau), search by species (manta), no-results, URL pre-fill, result click-through
- [x] `tests/sites.spec.ts` — Sites listing loads with site names, site detail page heading, 404 on unknown slug
- [x] `tests/locations.spec.ts` — Location detail page loads, 404 on unknown slug, /about and /data static pages

## Results

**20/20 tests passing** (3.1s, Chromium)

## Coverage

| Area | Tests |
|---|---|
| Homepage | 5 |
| Search (client-side React) | 6 |
| Sites listing + detail | 5 |
| Locations + static pages | 4 |

## Key notes

- All homepage/sites tests use `waitUntil: 'domcontentloaded'` to avoid waiting for the Unsplash hero image
- Search tests navigate with full `load` wait so React hydrates before `fill()` interactions
- `FEATURED_SLUGS` on homepage don't match location slugs — grid falls back to first 3 atlas locations (Ari Atoll, North Male Atoll, Raja Ampat); tests reflect actual rendered content
- `workers: 3` locally to avoid overwhelming the dev server

## Next Steps

- Run in CI (set `CI=true` for single-worker, no server reuse)
- Add filter tests for the Atlas filter rail on `/sites`
- Add species page tests (`/where-to-see/[species]`)
- Add `/for/[cert]` cert-level page tests
