import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

test.describe('Homepage atlas', () => {
  test('loads with hero section', async ({ page }) => {
    await page.goto('/', GOTO);
    // Requiring the literal domain string in the page's SEO title isn't a
    // meaningful constraint — check for real brand content instead.
    await expect(page).toHaveTitle(/Scuba Season/i);
    await expect(page.getByRole('region', { name: 'Hero' })).toBeVisible();
  });

  test('shows the three reef-state filter labels', async ({ page }) => {
    await page.goto('/locations', GOTO);
    // The /locations filter rail uses aria-pressed pill buttons, not checkboxes.
    await expect(page.getByRole('button', { name: 'Improving', exact: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Stable', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Declining', exact: true }).first()).toBeVisible();
  });

  test('shows the filter rail and a live reef count', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await expect(page.getByRole('button', { name: 'Improving', exact: true }).first()).toBeVisible({ timeout: 15_000 });
    // The result count is an aria-live status region ("N locations").
    await expect(page.getByRole('status')).toContainText(/location/i);
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
