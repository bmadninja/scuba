import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

test.describe('Homepage', () => {
  test('loads with hero section', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page).toHaveTitle(/scubaSeason\.fun/);
    await expect(page.getByRole('region', { name: 'Hero' })).toBeVisible();
  });

  test('shows reef state counts', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText('Thriving').first()).toBeVisible();
    await expect(page.getByText('Under pressure').first()).toBeVisible();
    await expect(page.getByText('Witnessing change').first()).toBeVisible();
  });

  test('featured destinations grid shows Raja Ampat, Palau, Azores', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText('Raja Ampat').first()).toBeVisible();
    await expect(page.getByText('Blue Corner').first()).toBeVisible();
    await expect(page.getByText('Santa Maria').first()).toBeVisible();
  });

  test('nav has Atlas link', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /atlas/i }).first()).toBeVisible();
  });

  test('clicking a featured destination navigates to its location page', async ({ page }) => {
    await page.goto('/', GOTO);
    // Target the featured destinations region specifically to avoid matching
    // atlas explorer cards lower on the page
    const featured = page.getByRole('region', { name: 'Featured destinations' });
    await featured.getByRole('link', { name: /Raja Ampat/i }).first().click();
    await expect(page).toHaveURL(/raja-ampat/, { timeout: 10_000 });
  });
});
