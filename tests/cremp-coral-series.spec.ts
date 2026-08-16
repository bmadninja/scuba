import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * CREMP / SECREMP coral-cover series (FWC Fish & Wildlife Research Institute).
 *
 * The Florida reefs are the only ones in the atlas whose coral chart comes from
 * a programme that resurveys the SAME fixed stations every year, so these tests
 * guard two things the rest of the corpus cannot:
 *   1. the series data itself stays well-formed and station-derived, and
 *   2. the deliberate split on a CREMP reef between the headline coral number
 *      (from the reef-health record) and the chart's own last point.
 */

const root = join(__dirname, '..');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const locationSeries = read('src/data/cremp-reef-series.json');
const siteSeries = read('src/data/cremp-site-series.json');

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// ── Data shape ──────────────────────────────────────────────────────────────

test('every CREMP series is a real multi-year run of plausible percentages', () => {
  expect(locationSeries.length).toBeGreaterThanOrEqual(3);
  expect(siteSeries.length).toBeGreaterThanOrEqual(3);

  for (const r of [...locationSeries, ...siteSeries]) {
    const label = r.locationId ?? r.siteId;
    expect(r.sourceId, `${label} must credit CREMP`).toBe('cremp');
    expect(r.methodologyClaimId).toBe('reef-health-cremp');
    expect(r.series.length, `${label} needs 2+ survey years to chart`).toBeGreaterThanOrEqual(2);
    expect(r.series.length).toBe(r.surveyYears);
    expect(r.stationCount, `${label} must name its stations`).toBeGreaterThan(0);

    const years: number[] = r.series.map((p: { year: number }) => p.year);
    expect(years, `${label} years must be ascending and unique`).toEqual(
      [...new Set(years)].sort((a: number, b: number) => a - b),
    );
    expect(Math.min(...years)).toBeGreaterThanOrEqual(1996);
    expect(Math.max(...years)).toBeLessThanOrEqual(2025);

    for (const p of r.series) {
      expect(p.coralCoverPercent, `${label} ${p.year} out of range`).toBeGreaterThanOrEqual(0);
      expect(p.coralCoverPercent, `${label} ${p.year} out of range`).toBeLessThanOrEqual(100);
    }
    // `latest` must be the real tail of the series, not a stale copy.
    const tail = r.series[r.series.length - 1];
    expect(r.latest.year).toBe(tail.year);
    expect(r.latest.coralCoverPercent).toBe(tail.coralCoverPercent);
  }
});

test('the Florida Keys series spans the full 1996 to 2025 record', () => {
  const keys = locationSeries.find((r: { locationId: string }) => r.locationId === 'florida-keys-usa');
  expect(keys, 'Florida Keys CREMP series is missing').toBeTruthy();
  expect(keys.series[0].year).toBe(1996);
  expect(keys.latest.year).toBe(2025);
  expect(keys.surveyYears).toBe(30);
  // Only reefs monitored every year are pooled, so the fall is not a
  // composition artifact of reefs joining the programme later.
  expect(keys.continuousPanel).toBe(true);
  expect(keys.series[0].coralCoverPercent).toBeGreaterThan(keys.latest.coralCoverPercent);
});

test('dive-site series are exact reef matches, not proximity matches', () => {
  const sites = read('src/data/sites.json');
  const siteIds = new Set(sites.map((s: { id: string }) => s.id));
  for (const r of siteSeries) {
    expect(r.matchType, `${r.siteId} must be a same-reef match`).toBe('same-reef');
    expect(siteIds.has(r.siteId), `${r.siteId} has no dive site`).toBe(true);
    expect(r.crempSites.length).toBeGreaterThan(0);
  }
});

// ── Rendering ───────────────────────────────────────────────────────────────

test('Florida Keys charts the CREMP history and credits CREMP', async ({ page }) => {
  await page.goto('/locations/florida-keys-usa', GOTO);
  const section = page.locator('#coral-cover');
  await expect(section).toBeVisible({ timeout: 15_000 });
  await expect(section.getByText('CREMP fixed stations', { exact: false })).toBeVisible();
  // One dot per survey year.
  await expect(section.locator('svg circle[r="4"]')).toHaveCount(30);
});

test('the Florida Keys headline number and chart agree, both on CREMP', async ({ page }) => {
  // The reef-health record cites CREMP itself, so there is exactly one coral
  // number on the page. This replaces an earlier NCRMP-attributed 13%/24% pair
  // that did not match the published record for the Keys reef tract.
  const keys = locationSeries.find((r: { locationId: string }) => r.locationId === 'florida-keys-usa');
  const health = read('src/data/reef-health.json').find(
    (r: { locationId: string }) => r.locationId === 'florida-keys-usa',
  );
  expect(health.observed.sourceIds).toContain('cremp');
  const headline = Math.round(health.observed.coralCoverPercent);
  expect(headline).toBe(Math.round(keys.latest.coralCoverPercent));

  await page.goto('/locations/florida-keys-usa', GOTO);
  // The pillar label is "Coral cover" in the DOM; the caps are a CSS transform.
  const coralPillar = page
    .locator('p', { hasText: /^Coral cover$/ })
    .first()
    .locator('..');
  await expect(coralPillar).toBeVisible({ timeout: 15_000 });
  await expect(coralPillar).toContainText(`${headline}%`);
  // The old contradiction must not come back in either direction.
  await expect(page.locator('#coral-cover')).not.toContainText('reads lower than');
});

test('the Florida Keys reef-state label is unchanged by the corrected number', async ({ page }) => {
  // Both the old 13% and the corrected 4% sit under the model's <25% coral
  // threshold, so the atlas label and its filter counts do not move.
  await page.goto('/locations/florida-keys-usa', GOTO);
  await expect(page.getByText('Declining').first()).toBeVisible({ timeout: 15_000 });
});

test('a dive site on a CREMP station charts its own reef', async ({ page }) => {
  await page.goto('/sites/florida-keys-molasses-reef', GOTO);
  const section = page.locator('#coral-cover');
  await expect(section).toBeVisible({ timeout: 15_000 });
  await expect(section.getByText('Coral on this reef')).toBeVisible();
  await expect(section.getByText('This is a survey of this reef', { exact: false })).toBeVisible();
});

test('a dive site with no monitoring station shows no coral section', async ({ page }) => {
  await page.goto('/sites/florida-keys-benwood-wreck', GOTO);
  await expect(page.locator('main')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#coral-cover')).toHaveCount(0);
});
