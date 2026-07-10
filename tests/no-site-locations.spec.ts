import { test, expect } from '@playwright/test';
import locationsData from '../src/data/locations.json';
import sitesData from '../src/data/sites.json';

/**
 * Locations that have no entries in sites.json must still surface useful
 * trip planning information from location-details.json: dive level, dive
 * style, trip duration, and getting-there instructions.
 *
 * If this test fails for a new location it means either:
 *   (a) the location is missing a location-details.json entry, or
 *   (b) the location-details entry is missing one of the required fields.
 *
 * Fix: add/complete the entry in src/data/location-details.json.
 */

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// Derived at test-run time so this list never drifts out of sync as site
// data is added. NOTE: a location's own `siteIds` field is NOT the source
// of truth the app uses for this — src/app/locations/[slug]/page.tsx calls
// getSitesByLocationId(location.id), which filters sites.json by
// `site.locationId === location.id`. Several locations carry a stale empty
// `siteIds: []` even though sites.json has real entries pointing at them
// (e.g. wakatobi-indonesia), so we must match the app's actual logic here
// rather than trusting `siteIds`, or this list wrongly includes locations
// that do have real dive sites.
type LocationRecord = { id: string; slug: string; name: string };
type SiteRecord = { locationId: string };

const locationIdsWithSites = new Set(
  (sitesData as SiteRecord[]).map((s) => s.locationId),
);

const NO_SITE_LOCATIONS = (locationsData as LocationRecord[])
  .filter((loc) => !locationIdsWithSites.has(loc.id))
  .map((loc) => ({ slug: loc.slug, name: loc.name }));

// As of writing, every location has at least one real site cross-referenced
// via sites.json — this is a legitimate, positive data-completeness state,
// not a data-shape error, so the parameterized tests below simply generate
// zero cases rather than failing the suite. If a genuinely site-less
// location is ever added again, this list (and the tests) will pick it up
// automatically.

// ── Each no-site location must load and show trip planning content ─────────

for (const loc of NO_SITE_LOCATIONS) {
  test.describe(`${loc.name} (no dive sites)`, () => {
    test('page loads with a visible main', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
    });

    test('shows "Plan your trip" sidebar', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 45_000 });
    });

    test('shows dive level fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      // The sidebar renders a "LEVEL" label followed by the value.
      await expect(page.getByText(/^level$/i).first()).toBeVisible({ timeout: 45_000 });
    });

    test('shows dive style fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText(/^dive style$/i).first()).toBeVisible({ timeout: 45_000 });
    });

    test('shows trip length fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText(/^trip length$/i).first()).toBeVisible({ timeout: 45_000 });
    });

    test('shows "Getting there" in the plan sidebar', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      // The Getting there section is a <details> with a summary.
      await expect(
        page.locator('summary').filter({ hasText: /getting there/i }),
      ).toBeVisible({ timeout: 45_000 });
    });

    test('"Getting there" expands to show travel instructions', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      const summary = page.locator('summary').filter({ hasText: /getting there/i });
      await expect(summary).toBeVisible({ timeout: 45_000 });
      // The details element is open by default; the body text should be visible.
      const details = summary.locator('..'); // parent <details>
      await expect(details).toHaveAttribute('open');
    });
  });
}

// ── Regression: no-site location must NOT show an empty species section ───

test.describe('No-site location — empty-state hygiene', () => {
  // Reuses the same live-derived NO_SITE_LOCATIONS list rather than a
  // hardcoded slug (Koh Rong picked up real sites since this was written —
  // same drift this file exists to prevent). Skips gracefully if no
  // genuinely site-less location currently exists.
  test.skip(
    NO_SITE_LOCATIONS.length === 0,
    'No location with zero real sites currently exists in the data — nothing to check the empty-state against.',
  );
  const SLUG = NO_SITE_LOCATIONS[0]?.slug;

  test('"What you will see" section absent when no sightings exist', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
    // There should be no blank "What you will see" heading when species is empty.
    const header = page.locator('h2', { hasText: /what you will see/i });
    const count = await header.count();
    if (count > 0) {
      // If the section appears, there must be at least one species card inside it.
      const cards = page.locator('[style*="border-radius: 1rem"]');
      await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('"Dive sites" section absent when no sites exist', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.locator('main')).toBeVisible({ timeout: 45_000 });
    // There must be no empty "Dive sites" heading.
    await expect(page.getByText(/^dive sites$/i)).toHaveCount(0);
  });
});
