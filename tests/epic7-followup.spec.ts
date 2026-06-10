import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const SITE_SLUG = 'raja-ampat-cape-kri';
const SPECIES_SLUG = 'blacktip-reef-shark';

// ── Gear page removed ─────────────────────────────────────────────────────
test.describe('Gear page removed', () => {
  test('/gear returns 404', async ({ page }) => {
    const response = await page.goto('/gear', GOTO);
    expect(response?.status()).toBe(404);
  });
});

// ── Location-first nav ────────────────────────────────────────────────────
test.describe('Location-first nav', () => {
  test('nav has Atlas, Method, About — not Sites', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /^Atlas$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^Method$/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /^About$/i }).first()).toBeVisible();
    // Sites must not appear in the nav (it may still be in footer)
    const navEl = page.getByRole('navigation').first();
    await expect(navEl.getByRole('link', { name: /^Sites$/i })).toHaveCount(0);
  });
});

// ── Clickable species cards ───────────────────────────────────────────────
test.describe('Clickable species on site detail (Epic 7 follow-up)', () => {
  test('species card is a link to per-site species page', async ({ page }) => {
    await page.goto(`/sites/${SITE_SLUG}`);
    // The "What you'll see" section renders creature cards as links
    const link = page.getByRole('link', { name: /blacktip reef shark/i }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    const href = await link.getAttribute('href');
    expect(href).toMatch(/\/sites\/raja-ampat-cape-kri\/species\//);
  });

  test('clicking a species card navigates to the species detail page', async ({ page }) => {
    await page.goto(`/sites/${SITE_SLUG}`);
    const link = page.getByRole('link', { name: /blacktip reef shark/i }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(page).toHaveURL(/\/sites\/raja-ampat-cape-kri\/species\//);
  });
});

// ── Per-site species detail page ──────────────────────────────────────────
test.describe('Per-site species detail (/sites/[slug]/species/[species])', () => {
  const URL = `/sites/${SITE_SLUG}/species/${SPECIES_SLUG}`;

  test('loads successfully', async ({ page }) => {
    await page.goto(URL);
    await expect(page.locator('main')).toBeVisible();
  });

  test('shows species common name in heading', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole('heading', { name: /blacktip reef shark/i })).toBeVisible({ timeout: 10_000 });
  });

  test('has link back to site page', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByRole('link', { name: /Cape Kri/i }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('404s on unknown species slug', async ({ page }) => {
    const response = await page.goto(`/sites/${SITE_SLUG}/species/not-a-real-species-xyz`, GOTO);
    expect(response?.status()).toBe(404);
  });
});

// ── Where-to-see pages removed — redirects to 404 ────────────────────────
test.describe('Where-to-see routes removed', () => {
  test('/where-to-see/hammerhead-schools returns 404', async ({ page }) => {
    const response = await page.goto('/where-to-see/hammerhead-schools', GOTO);
    expect(response?.status()).toBe(404);
  });
});

// ── Cert landing pages (/for/[cert]) ──────────────────────────────────────
test.describe('Cert landing pages (/for/[cert])', () => {
  test('/for/open-water loads with destinations', async ({ page }) => {
    await page.goto('/for/open-water');
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText(/Open Water/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('/for/advanced loads', async ({ page }) => {
    await page.goto('/for/advanced');
    await expect(page.locator('main')).toBeVisible();
  });

  test('404s on unknown cert slug', async ({ page }) => {
    const response = await page.goto('/for/not-a-real-cert-xyz', GOTO);
    expect(response?.status()).toBe(404);
  });
});
