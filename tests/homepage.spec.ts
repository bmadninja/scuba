import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// `/` is the MARKETING landing page. The atlas (filter rail, reef-state
// controls, live location count) now lives at `/locations`, rendered by
// ExplorePage. Tests are split accordingly.

test.describe('Homepage (marketing)', () => {
  test('loads with hero section', async ({ page }) => {
    await page.goto('/', GOTO);
    // Current title: "Scuba Season — The reef atlas built on science, made for divers."
    await expect(page).toHaveTitle(/Scuba Season/);
    await expect(page.getByRole('region', { name: 'Hero' })).toBeVisible();
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Every reef has a season. Find yours.',
      }),
    ).toBeVisible();
  });

  test('nav has a search box', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.getByRole('textbox', { name: /search reefs/i }).first(),
    ).toBeVisible();
  });

  test('clicking a reef card opens its location page', async ({ page }) => {
    await page.goto('/', GOTO);
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    await card.click();
    await expect(page).toHaveURL(/\/locations\//, { timeout: 15_000 });
  });
});

test.describe('Atlas (/locations)', () => {
  test('shows the three reef-state filter controls', async ({ page }) => {
    await page.goto('/locations', GOTO);
    // Reef-state controls are aria-pressed <button> pills, not checkboxes.
    // Labels were renamed: thriving→Improving, pressure→Stable, change→Declining.
    await expect(
      page.getByRole('button', { name: 'Improving' }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Stable' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Declining' }).first()).toBeVisible();
  });

  test('shows the filter rail and a live location count', async ({ page }) => {
    await page.goto('/locations', GOTO);
    // Filter rail dropdown pills.
    await expect(page.getByRole('button', { name: 'Region' }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: 'When' }).first()).toBeVisible();
    // Count bar reads "{n} location(s)" — not "N reefs".
    await expect(page.getByText(/\d+\s+locations?/).first()).toBeVisible();
  });

  test('shows the map and the location card grid together', async ({ page }) => {
    // The redesign replaced the old Cards / Map view toggle: the atlas now
    // shows the map and the card grid side by side, with no toggle button.
    await page.goto('/locations', GOTO);
    await expect(page.getByRole('button', { name: 'Cards' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Map' })).toHaveCount(0);
    // Card grid renders location cards linking to /locations/{slug}.
    const cards = page.locator('a[href^="/locations/"]');
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });
    expect(await cards.count()).toBeGreaterThan(1);
  });
});
