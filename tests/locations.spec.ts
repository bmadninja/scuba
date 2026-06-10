import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

test.describe('Location detail pages (/locations/[slug])', () => {
  test('loads Ari Atoll location page', async ({ page }) => {
    await page.goto('/locations/ari-atoll-maldives', GOTO);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toBeEmpty();
  });

  test('404s on unknown location slug', async ({ page }) => {
    const response = await page.goto('/locations/not-a-real-location-xyz', GOTO);
    expect(response?.status()).toBe(404);
  });
});

test.describe('Static pages', () => {
  test('/about loads', async ({ page }) => {
    await page.goto('/about', GOTO);
    await expect(page.locator('main')).toBeVisible();
  });

  test('/data loads', async ({ page }) => {
    await page.goto('/data', GOTO);
    await expect(page.locator('main')).toBeVisible();
  });
});
