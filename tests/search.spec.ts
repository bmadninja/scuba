import { test, expect } from '@playwright/test';

// The /search page has two inputs with aria-label="Search reefs" (nav + page).
// Target the page's own input by its unique placeholder text.
const pageInput = (page: import('@playwright/test').Page) =>
  page.getByPlaceholder('Search locations, sites, or species…');

// Wait for React to hydrate by clicking the input before filling
async function searchFor(page: import('@playwright/test').Page, query: string) {
  await pageInput(page).click();
  await pageInput(page).fill(query);
}

test.describe('Search (/search)', () => {
  test('loads with empty state', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();
    await expect(pageInput(page)).toBeVisible();
    await expect(page.getByText(/search across/i)).toBeVisible();
  });

  test('searching "palau" returns location results', async ({ page }) => {
    await page.goto('/search');
    await searchFor(page, 'palau');
    await expect(page.getByText('Locations')).toBeVisible({ timeout: 15_000 });
    // Link text is "Blue Corner Palau · Micronesia" — country name matches /palau/i
    await expect(page.getByRole('link', { name: /palau/i }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('searching "manta" returns species encounter results', async ({ page }) => {
    await page.goto('/search');
    await searchFor(page, 'manta');
    await expect(page.getByText(/species encounters/i)).toBeVisible({ timeout: 15_000 });
  });

  test('searching gibberish shows no-results state', async ({ page }) => {
    await page.goto('/search');
    await searchFor(page, 'zzzzxxxxxyyy');
    await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 15_000 });
  });

  test('?q= param pre-fills the search box', async ({ page }) => {
    await page.goto('/search?q=palau');
    await expect(pageInput(page)).toHaveValue('palau');
  });

  test('clicking a result navigates to the right page', async ({ page }) => {
    await page.goto('/search?q=palau');
    await expect(page.getByRole('link', { name: /palau/i }).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /palau/i }).first().click();
    await expect(page).toHaveURL(/palau/);
  });
});
