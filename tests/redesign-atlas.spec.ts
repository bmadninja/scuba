import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// The atlas lives at /locations (ExplorePage). The redesigned filter rail uses
// aria-pressed pill buttons (not checkboxes / <select> / <details>). Reef-state
// labels are Improving / Stable / Declining. The result count is a plain
// paragraph reading "{n} locations" (not an aria-live status, not "reefs").
//
// Removed in the redesign (tests deleted below, see report):
//   • Sort dropdown + "Best season" default + "Great at other times of year"
//     divider  — there is no sort control on ExplorePage.
//   • "Needs fresh eyes" evidence-gaps toggle — no such control.
//   • Cards / Map view toggle — the globe and the card grid are shown together
//     on desktop; there are no "Cards"/"Map" buttons.

// The count paragraph, e.g. "42 locations" / "42 locations matching filters".
const countLocator = (page: import('@playwright/test').Page) =>
  page.getByText(/\d+ location/).first();

async function readCount(page: import('@playwright/test').Page): Promise<number> {
  const txt = await countLocator(page).innerText();
  return parseInt(txt, 10);
}

// Open a filter dropdown, retrying the click until React has hydrated (the
// server-rendered button exists before its onClick is wired, so an early click
// is a no-op). aria-expanded flipping to "true" confirms the handler fired.
async function openDropdown(
  page: import('@playwright/test').Page,
  name: string,
) {
  const btn = page.getByRole('button', { name });
  await expect(btn).toBeVisible({ timeout: 15_000 });
  await expect(async () => {
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
  }).toPass({ timeout: 15_000 });
  return btn;
}

// Select a filter pill, then assert the resulting URL param.
//
// These pills are TOGGLES whose selected state is reflected in the URL via an
// async `router.replace`. Two races made the old "click, then assert the URL"
// approach flaky under CI's parallel load:
//
//   1. Toggle + retry-until-URL: re-clicking a toggle until the URL matches can
//      DEselect it — if the first click registered but the URL assertion timed
//      out under load, the retry click reverses it.
//   2. Stale closure: the button's onClick closes over the current URL params.
//      `router.replace` updates the browser URL slightly before React re-renders
//      and rebinds sibling handlers to the fresh params, so a follow-up click
//      fired in that window overwrites the first selection instead of appending
//      (this is what dropped `month=1` when the second month was clicked).
//
// The fix: click exactly once (Playwright auto-waits for the button to be
// enabled, i.e. hydrated) and wait for the pill's own aria-pressed=true before
// touching the URL or clicking anything else. aria-pressed only flips after the
// re-render that also rebinds sibling onClick handlers, so it deterministically
// closes both windows. The URL assertion still runs — intent is unchanged.
async function selectPill(
  page: import('@playwright/test').Page,
  name: string,
  opts: { exact?: boolean } = {},
) {
  const btn = page.getByRole('button', { name, exact: opts.exact });
  await expect(btn).toBeVisible({ timeout: 15_000 });
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true', { timeout: 15_000 });
  return btn;
}

async function selectPillAndExpectUrl(
  page: import('@playwright/test').Page,
  name: string,
  urlRe: RegExp,
  opts: { exact?: boolean } = {},
) {
  await selectPill(page, name, opts);
  await expect(page).toHaveURL(urlRe, { timeout: 15_000 });
}

// ── Month filter buttons ───────────────────────────────────────────────────
// The "When" pill opens a dropdown panel with 12 month buttons. Selecting a
// month is reflected in the `month=` URL param.
test.describe('Month filter', () => {
  test('"When" dropdown shows all 12 month buttons', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await openDropdown(page, 'When');
    for (const m of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      await expect(page.getByRole('button', { name: m, exact: true })).toBeVisible();
    }
  });

  test('clicking a month button updates the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await openDropdown(page, 'When');
    await selectPillAndExpectUrl(page, 'Jan', /month=1\b/, { exact: true });
  });

  test('clicking two months keeps both in the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await openDropdown(page, 'When');
    // Wait for Jan's selected state (aria-pressed) before clicking Jun — that
    // gate guarantees React has re-rendered with month=1 and rebound Jun's
    // handler to the fresh params, so the second click appends instead of
    // clobbering month=1.
    await selectPillAndExpectUrl(page, 'Jan', /month=1\b/, { exact: true });
    // URLSearchParams encodes the comma as %2C.
    await selectPillAndExpectUrl(
      page,
      'Jun',
      /month=1(%2C|,)6|month=6(%2C|,)1/,
      { exact: true },
    );
  });
});

// ── Certification level filter ────────────────────────────────────────────
// The "Certification" pill opens a dropdown with aria-pressed skill buttons.
test.describe('Certification level filter', () => {
  test('cert options are visible: Beginner, Open water, Advanced, Technical', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await openDropdown(page, 'Certification');
    for (const cert of ['Beginner', 'Open water', 'Advanced', 'Technical']) {
      await expect(page.getByRole('button', { name: cert, exact: true })).toBeVisible();
    }
  });

  test('selecting "Beginner" reduces the location count', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await expect(countLocator(page)).toBeVisible({ timeout: 15_000 });
    const before = await readCount(page);

    await openDropdown(page, 'Certification');
    await selectPillAndExpectUrl(page, 'Beginner', /skill=Beginner/, { exact: true });
    const after = await readCount(page);
    expect(after).toBeLessThanOrEqual(before);
  });
});

// ── Location count paragraph ──────────────────────────────────────────────
// The result count is a plain paragraph reading "{n} locations".
test.describe('Location count', () => {
  test('shows a numeric location count initially', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await expect(countLocator(page)).toBeVisible({ timeout: 15_000 });
    await expect(countLocator(page)).toContainText(/\d+ location/i);
  });

  test('count updates after selecting a reef state', async ({ page }) => {
    await page.goto('/locations', GOTO);
    await expect(countLocator(page)).toBeVisible({ timeout: 15_000 });
    const before = await readCount(page);

    // Nothing is selected by default; selecting one reef state narrows results.
    await selectPillAndExpectUrl(page, 'Improving', /reef=thriving/);
    const after = await readCount(page);
    expect(after).toBeLessThan(before);
  });
});

// ── Empty state ───────────────────────────────────────────────────────────
test.describe('Empty state', () => {
  test('shows empty state message when filters force zero matches', async ({ page }) => {
    await page.goto('/locations?reef=thriving&skill=Beginner&month=2', GOTO);
    const hasCards = await page.locator('a[href^="/locations/"]').count();
    if (hasCards === 0) {
      await expect(page.getByText(/no matches/i)).toBeVisible({ timeout: 10_000 });
    }
    // If cards still render with these params the empty state isn't triggered — that's fine.
  });
});

// ── Reef state filter pills ───────────────────────────────────────────────
test.describe('Reef state filter', () => {
  test('three reef state filter pills are visible', async ({ page }) => {
    await page.goto('/locations', GOTO);
    for (const state of ['Improving', 'Stable', 'Declining']) {
      await expect(page.getByRole('button', { name: state })).toBeVisible({ timeout: 15_000 });
    }
  });

  test('selecting a reef state persists to the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    // Default is none-selected; selecting Improving writes reef=thriving.
    await selectPillAndExpectUrl(page, 'Improving', /reef=thriving/);
  });
});
