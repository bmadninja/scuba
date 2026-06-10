import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Homepage copy changes (redesign) ──────────────────────────────────────
// The redesign replaced the old hero CTA buttons ("Browse all locations →",
// "Best spots this month →") and the "Where's in season now?" / "What do you
// want to see?" hero copy with a live atlas stage below a photo hero. The
// atlas rail now carries "What do you want to see?" as a filter section title.
test.describe('Homepage copy changes', () => {
  test('hero shows the redesigned headline', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.getByRole('heading', { name: /where to dive and what you.ll actually see/i }).first(),
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

  test('"What do you want to see?" now exists as a filter section heading', async ({ page }) => {
    await page.goto('/', GOTO);
    // Reused as a filter-rail section title in the redesigned atlas stage.
    await expect(page.getByText(/what do you want to see/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('old hero copy "Where\'s in season now?" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/where.s in season now/i)).toHaveCount(0);
  });
});

// ── Atlas filter rail (redesign) ──────────────────────────────────────────
// The rail is a stack of <details>/<summary> FilterSections. Several headers
// carry a small (i) InfoButton that opens the shared explainer popup.
test.describe('Atlas filter rail', () => {
  test('"Certification level" is a filter section heading', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Certification level' }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('"When" section header has an (i) info button', async ({ page }) => {
    await page.goto('/', GOTO);
    const whenSummary = page.locator('summary').filter({ hasText: 'When' }).first();
    await expect(whenSummary).toBeVisible({ timeout: 15_000 });
    await expect(whenSummary.getByRole('button', { name: 'How this works' })).toBeVisible();
  });

  test('"Certification level" header has an (i) info button', async ({ page }) => {
    await page.goto('/', GOTO);
    const certSummary = page.locator('summary').filter({ hasText: 'Certification level' }).first();
    await expect(certSummary).toBeVisible({ timeout: 15_000 });
    await expect(certSummary.getByRole('button', { name: 'How this works' })).toBeVisible();
  });
});

// ── Atlas info popup interactive behavior ─────────────────────────────────
// The old hover InfoTooltip is gone; the redesign uses a centered modal dialog
// opened from the (i) InfoButton. Test it from the home filter rail.
test.describe('Atlas info popup (via filter rail)', () => {
  test('popup is hidden by default', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Certification level' }).first(),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('clicking a (i) opens the dialog; Escape closes it', async ({ page }) => {
    await page.goto('/', GOTO);
    const certSummary = page.locator('summary').filter({ hasText: 'Certification level' }).first();
    await expect(certSummary).toBeVisible({ timeout: 15_000 });
    await certSummary.getByRole('button', { name: 'How this works' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/experience level/i);

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('info dialog links to the Method page', async ({ page }) => {
    await page.goto('/', GOTO);
    const stateSummary = page.locator('summary').filter({ hasText: 'Reef state' }).first();
    await expect(stateSummary).toBeVisible({ timeout: 15_000 });
    await stateSummary.getByRole('button', { name: 'How this works' }).click();
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

  test('"Heat right now" metric (i) opens the NOAA heat explainer', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const metric = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: 'Heat right now' })
      .first();
    await expect(metric).toBeVisible({ timeout: 15_000 });
    await metric.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await metric.getByRole('button', { name: 'What this means' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/NOAA Coral Reef Watch/i);
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
// The old per-badge IUCN InfoTooltip is gone. The "What you'll see" species
// section header carries a single (i) opening the conservation-labels popup,
// and species cards render spelled-out IUCN labels inline.
test.describe('Location page — IUCN explainer popup', () => {
  // Ari Atoll has IUCN-listed sharks among its recorded species.
  const SLUG = 'ari-atoll-maldives';

  test('"What you\'ll see" header has an IUCN (i) info button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const header = page
      .locator('p:has(button[aria-label])')
      .filter({ hasText: /what you.ll see/i })
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
      .locator('p:has(button[aria-label])')
      .filter({ hasText: /what you.ll see/i })
      .first();
    await expect(header).toBeVisible({ timeout: 15_000 });
    await header.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await header.getByRole('button', { name: 'What the conservation labels mean' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/IUCN Red List/i);
  });
});
