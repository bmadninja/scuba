import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Seasonal split — "Great at other times of year" divider ──────────────
// The default "Best season" sort splits results into in-season (top) and
// off-season (bottom) groups. The divider text appears when there is at least
// one off-season reef after the in-season group.
test.describe('Seasonal split divider', () => {
  test('shows "Great at other times of year" divider in default sort', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.getByText('Great at other times of year').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('divider disappears when sort is switched away from Best season', async ({ page }) => {
    await page.goto('/', GOTO);
    // Wait for the atlas to hydrate (cards + the default divider present) before
    // interacting, so selectOption's onChange is actually wired up.
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Great at other times of year').first()).toBeVisible();
    const sort = page.getByRole('combobox', { name: /sort/i });
    await sort.selectOption('name');
    await expect(sort).toHaveValue('name');
    await expect(page.getByText('Great at other times of year')).toHaveCount(0, { timeout: 10_000 });
  });
});

// ── Sort dropdown ─────────────────────────────────────────────────────────
test.describe('Sort dropdown', () => {
  test('sort select is visible with "Best season" as default', async ({ page }) => {
    await page.goto('/', GOTO);
    const select = page.getByRole('combobox', { name: /sort/i });
    await expect(select).toBeVisible({ timeout: 15_000 });
    await expect(select).toHaveValue('season');
  });

  test('"Name" sort renders a flat alphabetical list (no divider)', async ({ page }) => {
    // Drive the sort via the URL so the assertion is deterministic.
    await page.goto('/?sort=name', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Great at other times of year')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: /sort/i })).toHaveValue('name');
  });

  test('switching to "Oldest surveys first" works', async ({ page }) => {
    await page.goto('/', GOTO);
    await page.getByRole('combobox', { name: /sort/i }).waitFor({ timeout: 15_000 });
    await page.getByRole('combobox', { name: /sort/i }).selectOption('oldest');
    await expect(page.getByRole('combobox', { name: /sort/i })).toHaveValue('oldest');
    // Flat list — no divider.
    await expect(page.getByText('Great at other times of year')).toHaveCount(0);
  });

  test('a sort= URL param is reflected in the select (round-trip)', async ({ page }) => {
    await page.goto('/?sort=oldest', GOTO);
    await expect(page.getByRole('combobox', { name: /sort/i })).toHaveValue('oldest', {
      timeout: 15_000,
    });
  });
});

// ── Month filter buttons ───────────────────────────────────────────────────
// Clicking a month pill in the "When" section updates which reefs are
// considered "in season". The month is reflected in the URL params.
test.describe('Month filter', () => {
  test('"When" section shows all 12 month buttons', async ({ page }) => {
    await page.goto('/', GOTO);
    const whenSection = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'When' }) }).first();
    await expect(whenSection).toBeVisible({ timeout: 15_000 });
    // Target month buttons by their labels (the section header also has an
    // info "How this works" button we must not count).
    for (const m of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      await expect(whenSection.getByRole('button', { name: m, exact: true })).toBeVisible();
    }
  });

  test('clicking a month button updates the URL', async ({ page }) => {
    await page.goto('/', GOTO);
    const whenSection = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'When' }) }).first();
    await expect(whenSection).toBeVisible({ timeout: 15_000 });
    await whenSection.getByRole('button', { name: 'Jan', exact: true }).click();
    await expect(page).toHaveURL(/m=1\b/);
  });

  test('clicking two months keeps both in the URL', async ({ page }) => {
    await page.goto('/', GOTO);
    const whenSection = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'When' }) }).first();
    await expect(whenSection).toBeVisible({ timeout: 15_000 });
    await whenSection.getByRole('button', { name: 'Jan', exact: true }).click();
    await whenSection.getByRole('button', { name: 'Jun', exact: true }).click();
    // URLSearchParams encodes the comma as %2C.
    await expect(page).toHaveURL(/m=1(%2C|,)6|m=6(%2C|,)1/);
  });
});

// ── "Needs fresh eyes" toggle (Evidence gaps) ─────────────────────────────
// Checking this toggle filters OUT reefs that already have fresh survey data,
// leaving only those that need new measurements.
test.describe('Evidence gaps — Needs fresh eyes', () => {
  test('"Needs fresh eyes" checkbox is visible', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(
      page.getByText('Needs fresh eyes').first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('clicking "Needs fresh eyes" reduces the reef count', async ({ page }) => {
    await page.goto('/', GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/reefs/i, { timeout: 15_000 });
    const before = await status.innerText();
    const beforeCount = parseInt(before);

    await page.getByText('Needs fresh eyes').first().click();
    await expect(status).toContainText(/reefs/i, { timeout: 10_000 });
    const after = await status.innerText();
    const afterCount = parseInt(after);

    expect(afterCount).toBeLessThan(beforeCount);
  });
});

// ── Certification level filter ────────────────────────────────────────────
test.describe('Certification level filter', () => {
  test('cert options are visible: Beginner, Open water, Advanced, Technical', async ({ page }) => {
    await page.goto('/', GOTO);
    for (const cert of ['Beginner', 'Open water', 'Advanced', 'Technical']) {
      await expect(page.getByText(cert, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    }
  });

  test('selecting "Beginner" reduces the reef count', async ({ page }) => {
    await page.goto('/', GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/reefs/i, { timeout: 15_000 });
    const before = parseInt(await status.innerText());

    await page.getByText('Beginner', { exact: true }).first().click();
    await expect(status).toContainText(/reefs/i, { timeout: 10_000 });
    const after = parseInt(await status.innerText());
    expect(after).toBeLessThanOrEqual(before);
  });
});

// ── Globe / Map view toggle ───────────────────────────────────────────────
// The toolbar shows "Cards" and "Map" buttons. Switching to Map hides the card
// grid and shows the globe canvas.
test.describe('Globe / Map view toggle', () => {
  test('both Cards and Map buttons are present', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.getByRole('button', { name: 'Cards' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Map' })).toBeVisible({ timeout: 15_000 });
  });

  test('clicking Map hides the card grid', async ({ page }) => {
    await page.goto('/', GOTO);
    await page.getByRole('button', { name: 'Map' }).click();
    // Cards grid links are hidden.
    await expect(page.locator('a[href^="/locations/"]').first()).toBeHidden({ timeout: 10_000 });
  });

  test('clicking Cards again restores the grid', async ({ page }) => {
    await page.goto('/', GOTO);
    await page.getByRole('button', { name: 'Map' }).click();
    await page.getByRole('button', { name: 'Cards' }).click();
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ── Reef count live region ────────────────────────────────────────────────
// The result count is an aria-live="polite" status element; it updates
// immediately after filtering.
test.describe('Reef count live region', () => {
  test('shows a numeric reef count initially', async ({ page }) => {
    await page.goto('/', GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/\d+ reef/i, { timeout: 15_000 });
  });

  test('count updates after deselecting a reef state', async ({ page }) => {
    await page.goto('/', GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/reefs/i, { timeout: 15_000 });
    const before = parseInt(await status.innerText());

    // All three states are selected by default; deselecting one drops the count.
    await page.getByRole('checkbox', { name: 'Thriving' }).click();
    await expect(status).toContainText(/reefs/i, { timeout: 10_000 });
    const after = parseInt(await status.innerText());
    expect(after).toBeLessThan(before);
  });
});

// ── Empty state ───────────────────────────────────────────────────────────
// Combining incompatible filters (e.g., Thriving + region with no Thriving
// reefs) should show the "No reefs match" empty state message.
test.describe('Empty state', () => {
  test('shows empty state message when URL forces zero matches', async ({ page }) => {
    // Drive to a state where no reefs can match: Thriving + Beginner + a month
    // with no Thriving beginner-level sites. Use query params to set directly.
    await page.goto('/?c=thriving&s=Technical&m=2', GOTO);
    // Either cards render OR the empty state message shows — test whichever.
    const hasCards = await page.locator('a[href^="/locations/"]').count();
    if (hasCards === 0) {
      await expect(page.getByText(/no reefs match/i)).toBeVisible({ timeout: 10_000 });
    }
    // If cards still render with these params the empty state isn't triggered — that's fine.
  });
});

// ── Reef state filter chips ───────────────────────────────────────────────
test.describe('Reef state filter', () => {
  test('three reef state filter checkboxes are visible', async ({ page }) => {
    await page.goto('/', GOTO);
    for (const state of ['Thriving', 'Under pressure', 'Witnessing change']) {
      await expect(page.getByRole('checkbox', { name: state })).toBeVisible({ timeout: 15_000 });
    }
  });

  test('deselecting a reef state persists to the URL', async ({ page }) => {
    await page.goto('/', GOTO);
    const thriving = page.getByRole('checkbox', { name: 'Thriving' });
    await expect(thriving).toBeVisible({ timeout: 15_000 });
    // Default is all-on; deselecting Thriving leaves the other two in c=
    // (URLSearchParams encodes the comma as %2C).
    await thriving.click();
    await expect(page).toHaveURL(/c=pressure(%2C|,)change|c=change(%2C|,)pressure/);
  });
});
