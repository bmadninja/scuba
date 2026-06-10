import { test, expect } from '@playwright/test';

// E2E coverage for the redesigned location detail page (src/app/locations/[slug])
// and its client body (src/components/.../location-page-body.tsx). The existing
// locations.spec.ts only asserts the page loads and 404s; these tests exercise the
// actual redesign surfaces: the reef-condition panel, the "Plan your trip" rail,
// species cards, dive-site rows, and the info popups.
//
// Ari Atoll is the canonical fixture (also used by locations.spec.ts) — it is a
// data-rich reef with coral cover, heat, fishing, species, and sites populated.

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const ARI = '/locations/ari-atoll-maldives';

test.describe('Location page — reef condition section', () => {
  test('renders the "Reef condition" section with a coral-cover chart', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section.getByText('Reef condition').first()).toBeVisible();
    await expect(section.getByText('Coral cover over time')).toBeVisible();
    // The chart is an inline SVG with role="img" and a descriptive aria-label.
    await expect(section.getByRole('img').first()).toBeVisible();
  });

  test('shows the Reef state metric with a label', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    // The "Reef state" label shares its <p> with an info button, so match the
    // metric's info trigger instead (unique, stable accessible name).
    await expect(
      section.getByRole('button', { name: /how we judge this/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Location page — "Plan your trip" rail', () => {
  test('shows the trip card with Best months', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Best months')).toBeVisible();
  });

  test('"Where to stay" expander reveals booking links', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const stay = page
      .locator('details')
      .filter({ has: page.locator('summary').filter({ hasText: 'Where to stay' }) });
    await expect(stay).toBeVisible({ timeout: 15_000 });
    // The disclosure renders open; the helper sentence is part of its body.
    await expect(stay.getByText(/book a place to stay and a dive operator/i)).toBeVisible();
  });

  test('"Getting there" expander is present', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Getting there' }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Location page — what you\'ll see (species)', () => {
  test('renders the species section heading', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText("What you'll see")).toBeVisible({ timeout: 15_000 });
  });

  test('species cards show a "seen" recency line', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText("What you'll see")).toBeVisible({ timeout: 15_000 });
    // Each species card carries a "seen" recency string (e.g. "Seen this week").
    await expect(page.getByText(/seen/i).first()).toBeVisible();
  });
});

test.describe('Location page — dive sites', () => {
  test('lists dive sites that link to /sites/[slug]', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const sites = page.locator('#sites');
    await expect(sites).toBeVisible({ timeout: 15_000 });
    await expect(sites.getByText('Dive sites')).toBeVisible();
    await expect(sites.locator('a[href^="/sites/"]').first()).toBeVisible();
  });

  test('clicking a dive site navigates to its detail page', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const firstSite = page.locator('#sites a[href^="/sites/"]').first();
    await expect(firstSite).toBeVisible({ timeout: 15_000 });
    const href = await firstSite.getAttribute('href');
    await firstSite.click();
    await expect(page).toHaveURL(new RegExp(href!.replace(/\//g, '\\/')));
  });
});

// ── Mobile layout ──────────────────────────────────────────────────────────
// On a phone the two-column body grid collapses to a single column and the
// sticky "Plan your trip" rail becomes static (< 1024px). These run in the
// project's chromium browser with a phone-sized viewport, matching the pattern
// in mobile.spec.ts.
test.describe('Location page — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('has no horizontal overflow on a phone', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('reef condition, species, sites and trip rail all render stacked', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.locator('#reef-condition')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("What you'll see")).toBeVisible();
    await expect(page.locator('#sites')).toBeVisible();
    await expect(page.getByText('Plan your trip')).toBeVisible();
  });

  test('info popup opens and closes on touch', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const trigger = page.getByRole('button', { name: /how we judge this/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    const dialog = page.getByRole('dialog');
    // Retry the click until the dialog opens — the handler is wired on hydration.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });
});

test.describe('Location page — info popups', () => {
  test('an info (i) button opens a modal dialog that closes again', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.locator('#reef-condition')).toBeVisible({ timeout: 15_000 });
    // The reef-state metric carries a "How we judge this" info trigger.
    const trigger = page.getByRole('button', { name: /how we judge this/i }).first();
    await expect(trigger).toBeVisible();
    const dialog = page.getByRole('dialog');
    // Retry the click until the dialog opens — the handler is wired on hydration.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });
});
