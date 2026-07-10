import { test, expect } from '@playwright/test';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Month filter buttons ───────────────────────────────────────────────────
// The "When" dropdown pill opens a panel with 12 month-abbreviation buttons.
// Clicking a month toggles it into the `month=` URL param (comma-joined).
test.describe('Month filter', () => {
  test('"When" dropdown shows all 12 month buttons', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await whenPill.click();
    await expect(whenPill).toHaveAttribute('aria-expanded', 'true');
    for (const m of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']) {
      await expect(page.getByRole('button', { name: m, exact: true })).toBeVisible();
    }
  });

  test('clicking a month button updates the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await whenPill.click();
    await page.getByRole('button', { name: 'Jan', exact: true }).click();
    await expect(page).toHaveURL(/month=1\b/);
  });

  test('clicking two months keeps both in the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await whenPill.click();
    await page.getByRole('button', { name: 'Jan', exact: true }).click();
    await page.getByRole('button', { name: 'Jun', exact: true }).click();
    // URLSearchParams encodes the comma as %2C.
    await expect(page).toHaveURL(/month=1(%2C|,)6|month=6(%2C|,)1/);
  });
});

// ── Certification filter ──────────────────────────────────────────────────
// The "Certification" dropdown pill opens a panel with 4 skill-level pills.
test.describe('Certification filter', () => {
  test('cert options are visible: Beginner, Open water, Advanced, Technical', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const certPill = page.getByRole('button', { name: 'Certification', exact: true });
    await expect(certPill).toBeVisible({ timeout: 15_000 });
    await certPill.click();
    await expect(certPill).toHaveAttribute('aria-expanded', 'true');
    for (const cert of ['Beginner', 'Open water', 'Advanced', 'Technical']) {
      await expect(page.getByRole('button', { name: cert, exact: true })).toBeVisible();
    }
  });

  test('selecting "Beginner" reduces the location count', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const count = page.locator('p', { hasText: /^\d+ location/ }).first();
    await expect(count).toBeVisible({ timeout: 15_000 });
    const before = parseInt(await count.innerText(), 10);

    const certPill = page.getByRole('button', { name: 'Certification', exact: true });
    await certPill.click();
    await page.getByRole('button', { name: 'Beginner', exact: true }).click();
    await expect(count).toHaveText(/^\d+ location/);
    const after = parseInt(await count.innerText(), 10);
    expect(after).toBeLessThan(before);
  });
});

// ── Location count ─────────────────────────────────────────────────────────
// The result count is a plain <p> reading "{N} location{s}{ matching filters}".
test.describe('Location count', () => {
  test('shows a numeric location count initially', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const count = page.locator('p', { hasText: /^\d+ location/ }).first();
    await expect(count).toBeVisible({ timeout: 15_000 });
    await expect(count).toHaveText(/^\d+ locations?/);
  });

  test('count updates after deselecting a reef state', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const count = page.locator('p', { hasText: /^\d+ location/ }).first();
    await expect(count).toBeVisible({ timeout: 15_000 });

    // Select all four reef states via the UI — equivalent total to no filter.
    // Wait for the URL to confirm each toggle landed before moving to the next,
    // so the count read afterwards reflects the fully-settled state.
    for (const state of ['Improving', 'Stable', 'Declining', 'Not surveyed']) {
      await page.getByRole('button', { name: state, exact: true }).click();
    }
    await expect(page).toHaveURL(/reef=thriving(%2C|,)pressure(%2C|,)change(%2C|,)unknown/);
    const before = parseInt(await count.innerText(), 10);

    await page.getByRole('button', { name: 'Improving', exact: true }).click();
    await expect(page).toHaveURL(/reef=pressure(%2C|,)change(%2C|,)unknown/);
    const after = parseInt(await count.innerText(), 10);
    expect(after).toBeLessThan(before);
  });
});

// ── Empty state ───────────────────────────────────────────────────────────
test.describe('Empty state', () => {
  test('shows "No matches." when a filter combination has zero results', async ({ page }) => {
    // "NoSuchRegion" never matches any REGION_BUCKET value, guaranteeing 0 results.
    await page.goto('/locations?region=NoSuchRegion', GOTO);
    await expect(page.getByText('No matches.')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Try clearing a filter or broadening the search.')).toBeVisible();
  });
});

// ── Reef state filter ──────────────────────────────────────────────────────
test.describe('Reef state filter', () => {
  test('four reef state filter pills are visible', async ({ page }) => {
    await page.goto('/locations', GOTO);
    for (const state of ['Improving', 'Stable', 'Declining', 'Not surveyed']) {
      await expect(page.getByRole('button', { name: state, exact: true })).toBeVisible({ timeout: 15_000 });
    }
  });

  test('deselecting a reef state persists to the URL', async ({ page }) => {
    await page.goto('/locations', GOTO);
    const improving = page.getByRole('button', { name: 'Improving', exact: true });
    await expect(improving).toBeVisible({ timeout: 15_000 });

    // Select all four reef states via the UI, then deselect one.
    for (const state of ['Improving', 'Stable', 'Declining', 'Not surveyed']) {
      await page.getByRole('button', { name: state, exact: true }).click();
    }
    await expect(improving).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/reef=thriving(%2C|,)pressure(%2C|,)change(%2C|,)unknown/);

    await improving.click();
    await expect(improving).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/reef=pressure(%2C|,)change(%2C|,)unknown/);
  });
});
