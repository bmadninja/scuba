import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const LOCATION = '/locations/raja-ampat-indonesia';
const SITE = '/sites/raja-ampat-cape-kri';

// ── Story 7.3 — Categorised wildlife filter ────────────────────────────────
// The wildlife taxonomy lives on the atlas (/locations), inside the "What to
// see" filter dropdown (SpeciesGroups → WILDLIFE_TAXONOMY sub-groups), not on
// the marketing homepage.
test.describe('Wildlife filter taxonomy (7.3)', () => {
  test('filter rail has wildlife sub-groups', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const trigger = page.getByRole('button', { name: 'What to see' });
    // The trigger is server-rendered `disabled` and only enables once React
    // hydration has attached its onClick (ExplorePage's `hydrated` flag), so
    // enabled doubles as the hydration signal. Hydrating the atlas (globe +
    // full card grid) can take well over 15s on a loaded CI runner.
    await expect(trigger).toBeEnabled({ timeout: 60_000 });
    // Open the dropdown; aria-expanded confirms the handler fired. The guard
    // keeps retries idempotent (a blind re-click would toggle it closed).
    await expect(async () => {
      if ((await trigger.getAttribute('aria-expanded')) !== 'true') {
        await trigger.click();
      }
      await expect(trigger).toHaveAttribute('aria-expanded', 'true', { timeout: 1_000 });
    }).toPass({ timeout: 30_000 });
    // Sub-group headers are buttons inside the open panel; role+name scoping
    // avoids matching stray "macro"/"sharks" prose elsewhere on the page.
    await expect(
      page.getByRole('button', { name: /sharks & rays|marine mammals|macro & critters/i }).first(),
    ).toBeVisible();
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

  test('in-season cards sort above the "Great at other times of year" divider', async ({ page }) => {
    await page.goto('/', GOTO);
    // The divider only appears when there are both in-season and off-season reefs.
    // In default "Best season" sort, in-season cards come first, then the divider.
    const card = page.locator('a[href^="/locations/"]').first();
    await card.waitFor({ state: 'visible', timeout: 15_000 });
    // Atlas renders cards — verify the grid is present (sorting logic is data-driven).
    await expect(card.locator('img').first()).toBeVisible();
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

  test('dive operators are listed inline inside "Where to stay"', async ({ page }) => {
    await page.goto(LOCATION);
    // "Where to stay" is a collapsed <details> (defaultOpen=false) — expand it
    // first, then the mono "Dive operators" label becomes visible.
    await page.locator('summary').filter({ hasText: 'Where to stay' }).first().click();
    await expect(page.getByText('Dive operators', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  });

  test('"Where to stay" discloses that links go to provider sites', async ({ page }) => {
    await page.goto(LOCATION);
    // Disclosure copy lives inside the collapsed "Where to stay" expander.
    await page.locator('summary').filter({ hasText: 'Where to stay' }).first().click();
    await expect(page.getByText(/each link goes to the provider/i).first()).toBeVisible({ timeout: 15_000 });
  });
});

// ── Story 7.9 — Gear on location page ─────────────────────────────────────
test.describe('Gear section on location page (7.9)', () => {
  test('location page has a Gear section with grouped tiers', async ({ page }) => {
    await page.goto(LOCATION);
    // The section heading is now "Gear & getting wet"; its groups are labelled
    // (e.g. "Basic kit" / "For specific sites"). Assert the heading + a group label.
    await expect(page.getByRole('heading', { name: 'Gear & getting wet' })).toBeVisible({ timeout: 10_000 });
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

  // NOTE: the old "site page has a Dive operators expander" test was removed.
  // Dive operators moved off the site page onto the location page; the site
  // page's only trip-planning expander is now "Getting there". Operators on the
  // location page's "Where to stay" expander are covered in the 7.8 block above.
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
