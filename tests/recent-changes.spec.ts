import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Homepage copy changes (redesign) ──────────────────────────────────────
// The redesign replaced the old hero CTA buttons ("Browse all locations →",
// "Best spots this month →") and the "Where's in season now?" / "What do you
// want to see?" hero copy with a photo hero carrying a single serif headline.
test.describe('Homepage copy changes', () => {
  test('hero shows the redesigned headline', async ({ page }) => {
    await page.goto('/', GOTO);
    // The marketing hero (<section aria-label="Hero">) H1.
    await expect(
      page.getByRole('heading', { name: /every reef has a season\. find yours\./i }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('old hero CTA "Browse all locations →" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /browse all locations/i })).toHaveCount(0);
  });

  test('old hero CTA "Best spots this month →" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /best spots this month/i })).toHaveCount(0);
  });

  test('old hero copy "Where\'s in season now?" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/where.s in season now/i)).toHaveCount(0);
  });
});

// ── Atlas info popup interactive behavior ─────────────────────────────────
// The redesign uses a centered modal dialog (AtlasInfoPopup) opened from the
// small (i) InfoButton. The old filter-rail placement is gone; the popup now
// lives on the location page's "Reef condition" metrics, so exercise the
// open / Escape-close / Method-link mechanics there.
test.describe('Atlas info popup (via location page)', () => {
  const SLUG = 'raja-ampat-indonesia';

  test('popup is hidden by default', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Reef state' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('clicking a (i) opens the dialog; Escape closes it', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Reef state' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await metric.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await metric.getByRole('button', { name: 'How we judge this' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/what the reef labels mean/i);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('info dialog links to the Method page', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Reef state' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await metric.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await metric.getByRole('button', { name: 'How we judge this' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByRole('link', { name: /method page/i })).toBeVisible();
  });
});

// ── Location page — reef condition info popups (replaces old stat strip) ───
// The old stat strip with hover InfoTooltips for "Reef state" / "Coral cover"
// is gone. The redesigned "Reef condition" block shows Heat right now / Fishing
// / Reef state metrics, each with an (i) InfoButton opening the shared popup.
test.describe('Location page — reef condition info popups', () => {
  const SLUG = 'raja-ampat-indonesia';

  test('"Reef state" metric has an (i) info button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Reef state' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await expect(metric.getByRole('button', { name: 'How we judge this' })).toBeVisible();
  });

  test('clicking the "Reef state" (i) opens the reef-labels explainer', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Reef state' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await metric.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await metric.getByRole('button', { name: 'How we judge this' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/what the reef labels mean/i);
  });

  test('the Heat row shows a plain verdict, never the word "Watch"', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    // The final card carries the heat read as a plain verdict on the Heat row
    // (Safe now / Warming / Bleaching now) — never NOAA jargon or the word "Watch".
    await expect(section.getByText('Heat', { exact: true })).toBeVisible();
    await expect(section.getByText(/Safe now|Warming|Bleaching now/)).toBeVisible();
    await expect(section.getByText('Watch', { exact: true })).toHaveCount(0);
  });
});

// ── Location page — sightings feed removed ────────────────────────────────
test.describe('Location page — sightings feed removed', () => {
  test('"Live from iNaturalist" section is no longer rendered', async ({ page }) => {
    await page.goto('/locations/raja-ampat-indonesia', GOTO);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByText('Live from iNaturalist')).toHaveCount(0);
  });
});

// ── Location page — IUCN explainer (replaces per-badge InfoTooltip) ────────
// The old per-badge IUCN InfoTooltip is gone. The "What you will see" species
// section header (an <h2>) carries a single (i) opening the conservation-labels
// popup, and species cards render spelled-out IUCN labels inline.
test.describe('Location page — IUCN explainer popup', () => {
  // Ari Atoll has IUCN-listed sharks among its recorded species.
  const SLUG = 'ari-atoll-maldives';

  test('"What you will see" header has an IUCN (i) info button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const header = page
      .locator('h2:has(button[aria-label])')
      .filter({ hasText: /what you will see/i })
      .first();
    await expect(header).toBeVisible({ timeout: 15_000 });
    await expect(
      header.getByRole('button', { name: 'What the conservation labels mean' }),
    ).toBeVisible();
  });

  test('clicking the IUCN (i) shows the Red List explanation', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const header = page
      .locator('h2:has(button[aria-label])')
      .filter({ hasText: /what you will see/i })
      .first();
    await expect(header).toBeVisible({ timeout: 15_000 });
    await header.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await header.getByRole('button', { name: 'What the conservation labels mean' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/IUCN Red List/i);
  });
});
