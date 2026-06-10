import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

test.describe('Homepage atlas', () => {
  test('loads with hero section', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page).toHaveTitle(/scubaSeason\.fun/);
    await expect(page.getByRole('region', { name: 'Hero' })).toBeVisible();
  });

  test('shows the three reef-state filter labels', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText('Thriving').first()).toBeVisible();
    await expect(page.getByText('Under pressure').first()).toBeVisible();
    await expect(page.getByText('Witnessing change').first()).toBeVisible();
  });

  test('shows the filter rail and a live reef count', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText('Filters', { exact: true }).first()).toBeVisible();
    // The result count is an aria-live status region ("N reefs").
    await expect(page.getByRole('status')).toContainText(/reefs/i);
  });

  test('nav has a search box', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.getByRole('textbox', { name: /search reefs/i }).first(),
    ).toBeVisible();
  });

  test('has a Cards / Map view toggle', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('button', { name: 'Cards' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible();
  });

  test('clicking a reef card opens its location page', async ({ page }) => {
    await page.goto('/', GOTO);
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    await card.click();
    await expect(page).toHaveURL(/\/locations\//, { timeout: 15_000 });
  });
});
