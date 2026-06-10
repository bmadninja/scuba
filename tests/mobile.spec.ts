import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// Drive every test in this file through a phone-sized viewport so we exercise
// the mobile layout (below the `sm`/640px breakpoint, where the inline nav
// collapses into the hamburger menu). We only override the viewport so the
// suite keeps running in the project's chromium browser.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

test.describe('Mobile compatibility', () => {
  test('homepage has no horizontal overflow', async ({ page }) => {
    await page.goto('/', GOTO);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('header collapses the nav into a hamburger menu', async ({ page }) => {
    await page.goto('/', GOTO);
    // The homepage hero renders its own nav over the sticky layout nav, so
    // scope to the hero — the nav the user actually sees at the top.
    const hero = page.getByRole('region', { name: 'Hero' });
    // The hamburger replaces the inline Method/About links on small screens.
    await expect(hero.getByRole('button', { name: 'Menu' })).toBeVisible();
    // The desktop inline nav is hidden below `sm`.
    await expect(
      hero.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeHidden();
  });

  test('hamburger reveals Method and About, and they navigate', async ({
    page,
  }) => {
    await page.goto('/', GOTO);
    const hero = page.getByRole('region', { name: 'Hero' });
    await hero.getByRole('button', { name: 'Menu' }).click();

    const menu = hero.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(menu.getByRole('link', { name: 'Method' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'About' })).toBeVisible();

    await menu.getByRole('link', { name: 'Method' }).click();
    await expect(page).toHaveURL(/\/data/, { timeout: 15_000 });
  });

  test('search box stays within the viewport', async ({ page }) => {
    await page.goto('/', GOTO);
    const hero = page.getByRole('region', { name: 'Hero' });
    const search = hero.getByRole('textbox', { name: /search/i }).first();
    await expect(search).toBeVisible();

    const box = await search.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    // The input must not spill past the right edge of the screen.
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box!.x).toBeGreaterThanOrEqual(-1);
  });

  test('location page has no horizontal overflow', async ({ page }) => {
    await page.goto('/', GOTO);
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 30_000 });
    await card.click();
    await expect(page).toHaveURL(/\/locations\//, { timeout: 15_000 });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('Method page header is navigable on mobile', async ({ page }) => {
    await page.goto('/data', GOTO);
    await page.getByRole('button', { name: 'Menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(menu.getByRole('link', { name: 'About' })).toBeVisible();
    await menu.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about/, { timeout: 15_000 });
  });
});
