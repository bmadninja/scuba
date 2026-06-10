import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Homepage copy changes ─────────────────────────────────────────────────
test.describe('Homepage copy changes', () => {
  test('shows new subline with dive location count', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/Browse \d+ dive locations/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('hero CTA reads "Browse all locations →"', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /browse all locations/i }).first()).toBeVisible();
  });

  test('hero CTA reads "Best spots this month →"', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('link', { name: /best spots this month/i }).first()).toBeVisible();
  });

  test('old CTA copy "What do you want to see?" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/what do you want to see/i)).toHaveCount(0);
  });

  test('old CTA copy "Where\'s in season now?" is gone', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/where.s in season now/i)).toHaveCount(0);
  });
});

// ── Atlas filter rail changes ─────────────────────────────────────────────
test.describe('Atlas filter rail changes', () => {
  test('"Thermal stress" no longer appears as a filter section heading', async ({ page }) => {
    await page.goto('/', GOTO);
    // Wait for atlas filter rail to render
    await expect(page.getByText('Certification level').first()).toBeVisible({ timeout: 15_000 });
    // The facet group used a <details><summary>Thermal stress… — asserting the summary is gone.
    // Note: the sort <select> still has an <option>"Highest thermal stress" — that's fine.
    await expect(
      page.locator('summary').filter({ hasText: 'Thermal stress' })
    ).toHaveCount(0);
  });

  test('"Certification level" facet has an InfoTooltip button', async ({ page }) => {
    await page.goto('/', GOTO);
    const certSection = page.locator('details').filter({ hasText: 'Certification level' }).first();
    await expect(certSection).toBeVisible({ timeout: 15_000 });
    await expect(certSection.getByRole('button', { name: 'More information' })).toBeVisible();
  });

  test('"Certification level" InfoTooltip button is inside the section summary', async ({ page }) => {
    await page.goto('/', GOTO);
    // Verify the tooltip button is within the <summary> of the Certification level facet.
    // (Interactive click test is covered by the location stat strip tests below.)
    const certSummary = page.locator('summary').filter({ hasText: 'Certification level' }).first();
    await expect(certSummary).toBeVisible({ timeout: 15_000 });
    await expect(certSummary.getByRole('button', { name: 'More information' })).toBeVisible();
  });
});

// ── InfoTooltip interactive behavior ─────────────────────────────────────
// Test on the location page where InfoTooltip is in a plain span (no <details> toggle interference).
// Wait for networkidle so React is hydrated before clicking client-side components.
test.describe('InfoTooltip component (via location stat strip)', () => {
  const SLUG = 'raja-ampat-indonesia';

  test('tooltip text is hidden by default', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Reef state' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/overall judgment/i)).toBeHidden();
  });

  test('clicking ? opens tooltip; clicking overlay closes it', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Reef state' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    const btn = statSpan.getByRole('button', { name: 'More information' });

    // Scroll to center to avoid sticky-header occlusion, then open
    await statSpan.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await btn.click({ force: true });
    await expect(page.getByText(/overall judgment/i)).toBeVisible({ timeout: 5_000 });

    // The InfoTooltip overlay (aria-hidden fixed span, z-49) intercepts outside clicks.
    // Click away from the header (top z-50) and tooltip text — bottom of viewport is safe.
    await page.mouse.click(400, 700);
    await expect(page.getByText(/overall judgment/i)).toBeHidden();
  });
});

// ── Location page stat InfoTooltips ───────────────────────────────────────
// raja-ampat-indonesia has full reef health data (reef state + coral cover)
// Selector note: the label <span> contains "Reef state?" (button text included),
// so we match with :has(button) filter instead of exact text.
test.describe('Location page — InfoTooltip on stat labels', () => {
  const SLUG = 'raja-ampat-indonesia';

  test('"Reef state" stat label has an InfoTooltip button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Reef state' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    await expect(statSpan.getByRole('button', { name: 'More information' })).toBeVisible();
  });

  test('"Coral cover" stat label has an InfoTooltip button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Coral cover' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    await expect(statSpan.getByRole('button', { name: 'More information' })).toBeVisible();
  });

  test('clicking "Reef state" ? shows the definition tooltip', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Reef state' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    await statSpan.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await statSpan.getByRole('button', { name: 'More information' }).click({ force: true });
    await expect(page.getByText(/overall judgment/i)).toBeVisible({ timeout: 5_000 });
  });

  test('clicking "Coral cover" ? shows the definition tooltip', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    const statSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: 'Coral cover' }).first();
    await expect(statSpan).toBeVisible({ timeout: 15_000 });
    await statSpan.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await statSpan.getByRole('button', { name: 'More information' }).click({ force: true });
    await expect(page.getByText(/percentage of the reef surface/i)).toBeVisible({ timeout: 5_000 });
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

// ── Location page — IUCN badge InfoTooltip ───────────────────────────────
test.describe('Location page — IUCN badge InfoTooltip', () => {
  // Ari Atoll has Grey reef shark (EN) and White-tip reef shark (VU) in sightings.json
  // The species section heading is "What you'll see here" (rendered for non-witnessing locations).
  const SLUG = 'ari-atoll-maldives';

  test('IUCN-badged species have an InfoTooltip button', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.getByRole('heading', { name: /what you.ll see here/i })).toBeVisible({ timeout: 15_000 });
    // IUCN badge wrapper span: contains badge code (EN/VU/CR/…) + InfoTooltip button
    const iucnBadgeSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: /\b(CR|EN|VU|NT|LC)\b/ }).first();
    await expect(iucnBadgeSpan).toBeVisible({ timeout: 10_000 });
  });

  test('clicking IUCN InfoTooltip shows Red List explanation', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /what you.ll see here/i })).toBeVisible({ timeout: 15_000 });
    const iucnBadgeSpan = page.locator('span:has(button[aria-label="More information"])').filter({ hasText: /\b(CR|EN|VU|NT|LC)\b/ }).first();
    await expect(iucnBadgeSpan).toBeVisible({ timeout: 10_000 });
    await iucnBadgeSpan.scrollIntoViewIfNeeded();
    await iucnBadgeSpan.getByRole('button', { name: 'More information' }).click({ force: true });
    await expect(page.getByText(/IUCN Red List/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
