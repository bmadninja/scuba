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
  test('renders the "How this reef is doing" card led by the reef-state verdict', async ({ page }) => {
    await page.goto(ARI, GOTO);
    // The section keeps its id="reef-condition"; the final card titles it
    // "How this reef is doing", leads with the verdict, and lists four rows.
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section.getByRole('heading', { name: 'How this reef is doing' })).toBeVisible();
    await expect(section.getByRole('link', { name: /how we measure this/i })).toBeVisible();
    // The four pillar rows.
    await expect(section.getByText('Coral cover', { exact: true })).toBeVisible();
    await expect(section.getByText('Fish life', { exact: true })).toBeVisible();
    await expect(section.getByText('Fishing', { exact: true })).toBeVisible();
  });

  test('the card leads with a verdict and consolidates sources into one line', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    // The overall reef-state verdict word (any of the four labels). A pillar row
    // can repeat the word, so assert at least one is visible.
    await expect(section.getByText(/^(Improving|Stable|Declining|Not surveyed)$/).first()).toBeVisible();
    // There is no per-site confidence badge chip.
    await expect(section.getByText(/of 4 signals on file/i)).toHaveCount(0);
    // One consolidated source line at the foot of the card.
    await expect(section.getByText(/^Sources ·/)).toBeVisible();
  });

  test('the Heat row shows a plain verdict, never the word "Watch"', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section.getByText('Heat', { exact: true })).toBeVisible();
    await expect(section.getByText(/Safe now|Warming|Bleaching now/)).toBeVisible();
    await expect(section.getByText('Watch', { exact: true })).toHaveCount(0);
  });

  test('shows the Reef state verdict led by the label', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    // The card leads with the "Reef state" eyebrow and the big verdict word. It
    // carries the "How we measure this" method link plus a reef-state (i) that
    // opens the labels explainer, but never the old "how we judge this" trigger.
    await expect(section.getByText('Reef state', { exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: /how we judge this/i })).toHaveCount(0);
  });
});

test.describe('Location page — "Plan your trip" rail', () => {
  test('shows the trip card with Best months', async ({ page }) => {
    await page.goto(ARI, GOTO);
    // The "Plan your trip" rail is the right-hand <aside>; scope the "Best months"
    // label to it (TripSnapshot is no longer rendered on the location page, so
    // there is only one, but scoping keeps the intent explicit and future-proof).
    const rail = page.locator('aside').filter({ hasText: 'Plan your trip' });
    await expect(rail.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    await expect(rail.getByText('Best months').first()).toBeVisible();
  });

  test('"Where to stay" expander reveals booking links', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const stay = page
      .locator('details')
      .filter({ has: page.locator('summary').filter({ hasText: 'Where to stay' }) });
    await expect(stay).toBeVisible({ timeout: 15_000 });
    // The redesign ships this disclosure COLLAPSED (defaultOpen=false), so its
    // body is hidden until the summary is clicked.
    const body = stay.getByText(/book a place to stay and a dive operator/i);
    await expect(body).toBeHidden();
    await stay.locator('summary').filter({ hasText: 'Where to stay' }).click();
    await expect(body).toBeVisible();
    // Opening it reveals the booking links (lodging / operator affiliate links).
    await expect(stay.getByRole('link').first()).toBeVisible();
  });

  test('"Getting there" expander is present', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Getting there' }).first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Location page — what you\'ll see (species)', () => {
  // The redesign has no #species id; the species block is the <section> whose
  // heading now reads "What you will see".
  const speciesSection = (page: import('@playwright/test').Page) =>
    page.locator('section').filter({ has: page.getByRole('heading', { name: 'What you will see' }) });

  test('renders the species section heading', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByRole('heading', { name: 'What you will see' })).toBeVisible({ timeout: 15_000 });
  });

  test('species cards show a "seen" recency line', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = speciesSection(page);
    await expect(section).toBeVisible({ timeout: 15_000 });
    // Each species card carries a "seen" recency string (e.g. "Seen 3 months ago").
    await expect(section.getByText(/seen/i).first()).toBeVisible();
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
    // Species block has no id post-redesign — anchor on its heading instead.
    await expect(page.getByRole('heading', { name: 'What you will see' })).toBeVisible();
    await expect(page.locator('#sites')).toBeVisible();
    await expect(page.getByText('Plan your trip')).toBeVisible();
  });

  test('info popup opens and closes on touch', async ({ page }) => {
    await page.goto(ARI, GOTO);
    // The reef-state popup is gone; the shared AtlasInfoPopup is still exercised
    // via the always-present sighting-broadcast info button.
    const trigger = page.getByRole('button', { name: 'Learn how broadcasts work' }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    // Scope by the popup's accessible name: on the mobile viewport the persistent
    // off-canvas nav drawer is also role="dialog", so a bare getByRole('dialog')
    // would match two elements and fail strict mode.
    const dialog = page.getByRole('dialog', { name: 'How sighting broadcasts work' });
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
    const trigger = page.getByRole('button', { name: 'Learn how broadcasts work' }).first();
    await expect(trigger).toBeVisible();
    // Scope by accessible name so the popup is matched unambiguously (see the
    // mobile touch test — a nav drawer can also carry role="dialog").
    const dialog = page.getByRole('dialog', { name: 'How sighting broadcasts work' });
    // Retry the click until the dialog opens — the handler is wired on hydration.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('the reef-state (i) button opens the "What the reef labels mean" explainer', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section).toBeVisible({ timeout: 15_000 });
    // The (i) sits beside the "Reef state" verdict eyebrow and opens INFO.state.
    const trigger = section.getByRole('button', { name: 'What the reef labels mean' });
    await expect(trigger).toBeVisible();
    const dialog = page.getByRole('dialog', { name: 'What the reef labels mean' });
    // Retry the click until the dialog opens — the handler is wired on hydration.
    await expect(async () => {
      await trigger.click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 15_000 });
    // The explainer lists the reef-state labels a diver reads on the card.
    await expect(dialog.getByText('Improving', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Not surveyed', { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
  });
});
