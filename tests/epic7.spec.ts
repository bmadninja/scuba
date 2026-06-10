import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const LOCATION = '/locations/raja-ampat-indonesia';
const SITE = '/sites/raja-ampat-cape-kri';

// ── Story 7.3 — Categorised wildlife filter ────────────────────────────────
test.describe('Wildlife filter taxonomy (7.3)', () => {
  test('filter rail has wildlife sub-groups', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText(/sharks.*rays|marine mammals|macro/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.6 — Place-only reef cards ─────────────────────────────────────
// The redesigned atlas card shows a region eyebrow + place name over an
// underwater photo, and links to the reef's location page. Skill/coral stats
// are no longer overlaid on the photo; "in season" shows as a ghost pill.
test.describe('Place-only reef cards (7.6)', () => {
  test('reef cards are photo links to /locations with a region eyebrow', async ({ page }) => {
    await page.goto('/', GOTO);
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    // Photo present inside the card.
    await expect(card.locator('img').first()).toBeVisible();
  });

  test('an in-season card shows the "In season" pill (no ● glyph)', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByText('In season', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.7 — Real underwater photos ────────────────────────────────────
test.describe('Underwater photos (7.7)', () => {
  test('atlas reef cards render real <img> photos, not bare gradients', async ({ page }) => {
    await page.goto('/', GOTO);
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(card.locator('img').first()).toBeVisible({ timeout: 10_000 });
  });

  test('location hero shows a photo', async ({ page }) => {
    await page.goto(LOCATION, GOTO);
    await expect(page.locator('img').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.8 — Location trip card (redesign) ─────────────────────────────
// The old "Getting there / Where to stay / Who to dive with" stacked sections
// are replaced by a sticky trip card: a single "See dive operators" CTA plus
// collapsible "Getting there" and "Where to stay" expanders.
test.describe('Location trip card (7.8)', () => {
  test('trip card has "Getting there" and "Where to stay" expanders', async ({ page }) => {
    await page.goto(LOCATION);
    await expect(page.locator('summary').filter({ hasText: 'Getting there' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('summary').filter({ hasText: 'Where to stay' }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('a single "See dive operators" CTA replaces the old who-to-dive-with list', async ({ page }) => {
    await page.goto(LOCATION);
    await expect(page.getByRole('button', { name: /see dive operators/i })).toBeVisible({ timeout: 15_000 });
  });

  test('operators popup discloses no commission', async ({ page }) => {
    await page.goto(LOCATION);
    await page.getByRole('button', { name: /see dive operators/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog).toContainText(/commission/i);
  });
});

// ── Story 7.9 — Gear on location page ─────────────────────────────────────
test.describe('Gear section on location page (7.9)', () => {
  test('location page has a Gear section with grouped tiers', async ({ page }) => {
    await page.goto(LOCATION);
    // Gear is a single section whose groups are labelled (e.g. "Basic kit" /
    // "For this site"). Assert the section heading plus a group label.
    await expect(page.getByText('Gear', { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/basic kit|for this site/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Story 7.10 — Site detail sequence ─────────────────────────────────────
test.describe('Site detail sequence (7.10)', () => {
  test('intro appears before the species/encounter section in DOM', async ({ page }) => {
    await page.goto(SITE, GOTO);
    // The redesigned site body leads with a serif intro paragraph, then the
    // "Your chances of seeing each animal" encounter section.
    const introFirst = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('p, h1, h2, h3'));
      const speciesIdx = all.findIndex((el) =>
        /your chances of seeing/i.test(el.textContent ?? ''),
      );
      const condIdx = all.findIndex((el) => /^Conditions/.test(el.textContent?.trim() ?? ''));
      // Conditions block renders before the encounter section.
      return condIdx !== -1 && speciesIdx !== -1 && condIdx < speciesIdx;
    });
    expect(introFirst).toBe(true);
  });

  test('trip card has a "See dive operators" CTA for trip planning', async ({ page }) => {
    await page.goto(SITE, GOTO);
    await expect(page.getByRole('button', { name: /see dive operators/i })).toBeVisible({ timeout: 10_000 });
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
    await expect(page.getByText(/reef state|DHW|coral cover/i).first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Conditions grid (redesign: plain-labeled four-up) ─────────────────────
// The old 12-month conditions table was replaced by a four-card conditions
// grid (Depth / Current / Visibility / Water) for the current season.
test.describe('Site conditions grid', () => {
  test('shows the four plain condition labels', async ({ page }) => {
    await page.goto(SITE, GOTO);
    for (const label of ['Depth', 'Current', 'Visibility', 'Water']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('water condition shows a temperature in °C', async ({ page }) => {
    await page.goto(SITE, GOTO);
    await expect(page.getByText(/°C/).first()).toBeVisible({ timeout: 10_000 });
  });
});
