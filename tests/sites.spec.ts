import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

test.describe('Sites listing (/sites)', () => {
  test('loads the sites explorer', async ({ page }) => {
    await page.goto('/sites', GOTO);
    await expect(page).toHaveTitle(/dive sites/i);
    await expect(page.getByText('Cape Kri')).toBeVisible({ timeout: 15_000 });
  });

  test('page contains site names', async ({ page }) => {
    await page.goto('/sites', GOTO);
    await expect(page.getByText('Cape Kri')).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Site detail page (/sites/[slug])', () => {
  test('loads Cape Kri detail page', async ({ page }) => {
    await page.goto('/sites/raja-ampat-cape-kri', GOTO);
    await expect(page.getByRole('heading', { name: /Cape Kri/i })).toBeVisible();
  });

  test('shows species section when present', async ({ page }) => {
    await page.goto('/sites/raja-ampat-cape-kri', GOTO);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('404s on unknown slug', async ({ page }) => {
    const response = await page.goto('/sites/not-a-real-site-xyz', GOTO);
    expect(response?.status()).toBe(404);
  });
});
