import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const LOCATION = '/locations/raja-ampat-indonesia';
const SITE = '/sites/raja-ampat-cape-kri';

// ── Story 7.3 — Categorised wildlife filter ────────────────────────────────
test.describe('Wildlife filter taxonomy (7.3)', () => {
  test('filter rail has wildlife sub-groups', async ({ page }) => {
    await page.goto('/', GOTO);
    // Wildlife filter should show categorised groups
    await expect(page.getByText(/sharks.*rays|marine mammals|macro/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.6 — Location card single-signal photo ─────────────────────────
test.describe('Location card cleanup (7.6)', () => {
  test('skill and in-season badges are in body, not photo', async ({ page }) => {
    await page.goto('/', GOTO);
    // Meta row exists with skill chip below card title
    await expect(page.getByText(/Open water|Advanced|Beginner/i).first()).toBeVisible({ timeout: 10_000 });
    // In-season marker uses ● or ○ text
    await expect(page.getByText(/● In season|○ Off season/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.7 — Real underwater photos ────────────────────────────────────
test.describe('Underwater photos (7.7)', () => {
  test('inspiration grid cards have img tags, not bare gradient', async ({ page }) => {
    await page.goto('/', GOTO);
    const featured = page.getByRole('region', { name: 'Featured destinations' });
    await expect(featured.locator('img').first()).toBeVisible({ timeout: 10_000 });
  });

  test('location hero shows a photo', async ({ page }) => {
    await page.goto(LOCATION, GOTO);
    await expect(page.locator('img').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.8 — Location Plan Your Trip rebuild ────────────────────────────
test.describe('Location Plan Your Trip (7.8)', () => {
  test('has Getting there, Where to stay, Who to dive with', async ({ page }) => {
    // Full load needed — Plan Your Trip uses conditional rendering
    await page.goto(LOCATION);
    await expect(page.getByText('Getting there').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Where to stay').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Who to dive with').first()).toBeVisible({ timeout: 15_000 });
  });

  test('affiliate disclosure appears', async ({ page }) => {
    await page.goto(LOCATION);
    await expect(page.getByText(/commission/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.9 — Gear on location page ─────────────────────────────────────
test.describe('Gear section on location page (7.9)', () => {
  test('location page has Gear section with two tiers', async ({ page }) => {
    await page.goto(LOCATION);
    await expect(page.getByText('base kit', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('site-specific', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.10 — Site detail re-sequence ──────────────────────────────────
test.describe('Site detail re-sequence (7.10)', () => {
  test('Overview appears before species section in DOM', async ({ page }) => {
    await page.goto(SITE, GOTO);
    // Check DOM order: Overview section label should appear before the species heading
    const overviewFirst = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('p, h1, h2, h3'));
      const overviewIdx = all.findIndex(el => el.textContent?.trim() === 'Overview');
      const speciesIdx = all.findIndex(el => el.textContent?.includes("What you'll see") || el.textContent?.includes("What you’ll see"));
      return overviewIdx !== -1 && speciesIdx !== -1 && overviewIdx < speciesIdx;
    });
    expect(overviewFirst).toBe(true);
  });

  test('sidebar links to location page for trip planning', async ({ page }) => {
    await page.goto(SITE, GOTO);
    await expect(page.getByRole('link', { name: /plan your trip/i })).toBeVisible({ timeout: 10_000 });
  });
});

// ── FAQ (merged into /data per other session) ─────────────────────────────
test.describe('FAQ section on /data', () => {
  test('/faq redirects to /data', async ({ page }) => {
    await page.goto('/faq');
    await expect(page).toHaveURL(/\/data/);
  });

  test('/data contains FAQ methodology content', async ({ page }) => {
    await page.goto('/data');
    // FAQ content merged into Method page
    await expect(page.getByText(/reef state|DHW|coral cover/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Conditions grid (12-month with highlight) ─────────────────────────────
test.describe('12-month conditions grid', () => {
  test('shows all 12 month abbreviations', async ({ page }) => {
    await page.goto(SITE, GOTO);
    for (const m of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      await expect(page.getByText(m).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('shows temp °C and visibility m', async ({ page }) => {
    await page.goto(SITE, GOTO);
    await expect(page.getByText(/°C/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Viz \(m\)/).first()).toBeVisible({ timeout: 10_000 });
  });
});
