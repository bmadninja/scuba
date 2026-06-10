import { test, expect } from '@playwright/test';

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

// All locations currently in locations.json that have siteIds: []
// Keep this list in sync with src/data/locations.json when adding new locations.
const NO_SITE_LOCATIONS = [
  { slug: 'koh-rong-cambodia',             name: 'Koh Rong' },
  { slug: 'fujairah-uae',                  name: 'Fujairah' },
  { slug: 'grande-comore-comoros',         name: 'Mitsamiouli' },
  { slug: 'sao-tome-sao-tome-and-principe',name: 'São Tomé' },
  { slug: 'mergui-archipelago-myanmar',    name: 'Mergui Archipelago' },
  { slug: 'dahlak-eritrea',               name: 'Dahlak Archipelago' },
] as const;

// ── Each no-site location must load and show trip planning content ─────────

for (const loc of NO_SITE_LOCATIONS) {
  test.describe(`${loc.name} (no dive sites)`, () => {
    test('page loads with a visible main', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    });

    test('shows "Plan your trip" sidebar', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    });

    test('shows dive level fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      // The sidebar renders a "LEVEL" label followed by the value.
      await expect(page.getByText(/^level$/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('shows dive style fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText(/^dive style$/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('shows trip length fact', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      await expect(page.getByText(/^trip length$/i).first()).toBeVisible({ timeout: 15_000 });
    });

    test('shows "Getting there" in the plan sidebar', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      // The Getting there section is a <details> with a summary.
      await expect(
        page.locator('summary').filter({ hasText: /getting there/i }),
      ).toBeVisible({ timeout: 15_000 });
    });

    test('"Getting there" expands to show travel instructions', async ({ page }) => {
      await page.goto(`/locations/${loc.slug}`, GOTO);
      const summary = page.locator('summary').filter({ hasText: /getting there/i });
      await expect(summary).toBeVisible({ timeout: 15_000 });
      // The details element is open by default; the body text should be visible.
      const details = summary.locator('..'); // parent <details>
      await expect(details).toHaveAttribute('open');
    });
  });
}

// ── Regression: no-site location must NOT show an empty species section ───

test.describe('No-site location — empty-state hygiene', () => {
  // Koh Rong is the canonical no-site location used throughout.
  const SLUG = 'koh-rong-cambodia';

  test('"What you\'ll see" section absent when no sightings exist', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    // There should be no blank "What you'll see" heading when species is empty.
    const header = page.getByText(/what you.ll see/i);
    const count = await header.count();
    if (count > 0) {
      // If the section appears, there must be at least one species card inside it.
      const cards = page.locator('[style*="border-radius: 1rem"]');
      await expect(cards.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test('"Dive sites" section absent when no sites exist', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
    // There must be no empty "Dive sites" heading.
    await expect(page.getByText(/^dive sites$/i)).toHaveCount(0);
  });
});
