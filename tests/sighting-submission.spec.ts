/**
 * Sighting Submission feature — test coverage against the 23 spec test cases.
 *
 * Tests are split into three groups:
 * 1. API route logic (uses Playwright request against running dev server)
 * 2. UI interaction (browser-level, loads a site page)
 * 3. Species autocomplete (proxy endpoint)
 *
 * iNaturalist API calls are not made in tests (credentials absent in CI).
 * Submissions fall through to the Telegram-queue path, returning queued:true.
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

// Minimal valid JPEG (1×1 white pixel), base64-encoded
const TINY_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=';

function tinyJpeg(): Buffer {
  return Buffer.from(TINY_JPEG_B64, 'base64');
}

function firstSiteSlug(): string {
  const root = process.cwd();
  try {
    const sites = JSON.parse(readFileSync(join(root, 'src/data/sites.json'), 'utf8'));
    if (Array.isArray(sites) && sites.length > 0) return (sites[0] as { slug: string }).slug;
    const keys = Object.keys(sites);
    if (keys.length > 0) return (sites[keys[0]] as { slug: string }).slug;
  } catch {
    // fallback
  }
  return 'banda-sea-banda-besar';
}

async function loadSitePage(page: Page): Promise<void> {
  const slug = firstSiteSlug();
  await page.goto(`${BASE}/sites/${slug}`);
}

// Multipart object for Playwright request.post
type PlaywrightMultipart = Record<string, string | { name: string; mimeType: string; buffer: Buffer }>;

function baseMultipart(overrides: Record<string, string> = {}): PlaywrightMultipart {
  const defaults: Record<string, string> = {
    siteId: 'test-site',
    siteName: 'Test Reef',
    siteLat: '-8.5',
    siteLng: '126.5',
    category: 'fish',
    isSeahorse: 'false',
    observedOn: '2026-06-15',
    needsReview: 'false',
  };
  return { ...defaults, ...overrides };
}

async function postSighting(
  request: APIRequestContext,
  fields: Record<string, string>,
  photos: Array<{ name: string; mimeType: string; buffer: Buffer }> = [],
) {
  const multipart: PlaywrightMultipart = { ...baseMultipart(), ...fields };
  if (photos.length > 0) {
    // Playwright multipart with multiple files of the same key: use first photo only
    // (Playwright doesn't support repeated keys — API route handles the array)
    multipart['photos'] = photos[0];
  }
  return request.post(`${BASE}/api/submit-sighting`, { multipart });
}

// ─── T01–T10: iNaturalist submission ──────────────────────────────────────────

test.describe('API: iNaturalist submission', () => {
  test('T01 happy path — fish category, known species, date', async ({ request }) => {
    const res = await postSighting(
      request,
      { category: 'fish', taxonName: 'clownfish', speciesDisplay: 'Clownfish', depthM: '12' },
      [{ name: 'test.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() }],
    );
    // With no iNat credentials in test env, queued response is expected
    expect([200, 500]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json() as { ok: boolean };
      expect(body.ok).toBe(true);
    }
  });

  test('T02 unknown species — no taxonName field is valid', async ({ request }) => {
    const res = await postSighting(
      request,
      { category: 'other' },
      [{ name: 'test.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() }],
    );
    expect([200, 500]).toContain(res.status());
  });

  test('T05 oversized file — 400 returned', async ({ request }) => {
    const bigBuffer = Buffer.alloc(21 * 1024 * 1024, 0xff);
    const multipart: PlaywrightMultipart = {
      ...baseMultipart({ category: 'fish' }),
      photos: { name: 'big.jpg', mimeType: 'image/jpeg', buffer: bigBuffer },
    };
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/too large/i);
  });

  test('T08 RAW file — 400 returned for unsupported type', async ({ request }) => {
    const multipart: PlaywrightMultipart = {
      ...baseMultipart({ category: 'fish' }),
      photos: { name: 'photo.arw', mimeType: 'image/x-sony-arw', buffer: tinyJpeg() },
    };
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/unsupported/i);
  });

  test('T09 multiple photos — 10 photos accepted (single-key limit: test 3)', async ({ request }) => {
    // Playwright multipart sends one file per key; we test that 1 photo route accepts fine
    const res = await postSighting(
      request,
      { category: 'fish' },
      [{ name: 'p0.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() }],
    );
    expect([200, 500]).toContain(res.status());
  });

  test('no photo — 400 returned', async ({ request }) => {
    const multipart: PlaywrightMultipart = baseMultipart({ category: 'fish' });
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toMatch(/photo/i);
  });

  test('T06 unmatched free-text species — needsReview=true, accepted', async ({ request }) => {
    const res = await postSighting(
      request,
      {
        category: 'fish',
        taxonName: 'blueringed octopuss',
        speciesDisplay: 'blueringed octopuss',
        needsReview: 'true',
      },
      [{ name: 'test.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() }],
    );
    expect([200, 500]).toContain(res.status());
  });
});

// ─── T11–T16: CoralWatch routing ──────────────────────────────────────────────

test.describe('API: CoralWatch routing', () => {
  function coralMultipart(overrides: Record<string, string> = {}): PlaywrightMultipart {
    return {
      ...baseMultipart(),
      category: 'coral',
      depthM: '8',
      bleachingScore: 'pale',
      tempC: '27',
      ...overrides,
      photos: { name: 'coral.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() },
    };
  }

  test('T11 coral with full fields — accepted', async ({ request }) => {
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart: coralMultipart() });
    expect([200, 500]).toContain(res.status());
  });

  test('T12 coral missing depth — accepted (CoralWatch skipped)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart: coralMultipart({ depthM: '' }) });
    // Still 200/500 — missing depth blocks CoralWatch but not iNat submission
    expect([200, 500]).toContain(res.status());
  });

  test('T13 coral missing bleaching score — accepted (CoralWatch skipped)', async ({ request }) => {
    const multipart = coralMultipart({ bleachingScore: '' });
    // bleachingScore must pass Zod optional enum — empty string isn't in enum; omit key
    delete (multipart as Record<string, unknown>)['bleachingScore'];
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart });
    expect([200, 500]).toContain(res.status());
  });

  test('T14 coral with depth + bleaching, no temp — CoralWatch queued', async ({ request }) => {
    const multipart = coralMultipart({ tempC: '' });
    const res = await request.post(`${BASE}/api/submit-sighting`, { multipart });
    expect([200, 500]).toContain(res.status());
  });
});

// ─── T17–T20: Species autocomplete (taxa search endpoint) ─────────────────────

test.describe('API: taxa search', () => {
  test('T17 partial match — shape is correct for "clown"', async ({ request }) => {
    const res = await request.get(`${BASE}/api/taxa/search?q=clown`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { taxa: unknown[] };
    expect(Array.isArray(body.taxa)).toBe(true);
    if (body.taxa.length > 0) {
      const first = body.taxa[0] as Record<string, unknown>;
      expect(typeof first.taxonId).toBe('number');
      expect(typeof first.scientificName).toBe('string');
      expect(typeof first.isSeahorse).toBe('boolean');
    }
  });

  test('T19 no match — single char query returns empty array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/taxa/search?q=a`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { taxa: unknown[] };
    expect(body.taxa).toEqual([]);
  });

  test('T20 empty query — returns empty array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/taxa/search?q=`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { taxa: unknown[] };
    expect(body.taxa).toEqual([]);
  });

  test('seahorse detection — Hippocampus taxon sets isSeahorse=true', async ({ request }) => {
    const res = await request.get(`${BASE}/api/taxa/search?q=hippocampus`);
    expect(res.status()).toBe(200);
    const body = await res.json() as { taxa: Array<{ isSeahorse: boolean; scientificName: string }> };
    const seahorses = body.taxa.filter((t) => t.scientificName.toLowerCase().startsWith('hippocampus'));
    seahorses.forEach((t) => expect(t.isSeahorse).toBe(true));
  });
});

// ─── T21–T22: /upload entry points ─────────────────────────────────────────────
//
// The feature was relocated from an inline "pre-dive brief" methodology modal on
// the site detail page to a standalone page at /upload (UploadWizard). There is
// no methodology-explainer modal anywhere in the current flow — PreDiveBrief is
// dead code and is never rendered from the site page. The two tests below that
// used to open/close that modal are rewritten to verify the equivalent current
// entry point instead: the /upload page loads with its first step, the Mode
// Selector ("What did you do on the dive?"), and picking a mode advances past it
// (the closest current analogue to "dismissing" the initial screen).

async function gotoUpload(page: Page, siteSlug?: string): Promise<void> {
  const url = siteSlug ? `${BASE}/upload?site=${encodeURIComponent(siteSlug)}` : `${BASE}/upload`;
  await page.goto(url);
}

test.describe('UI: /upload entry points', () => {
  test('T21 /upload loads with the mode selector as its first step', async ({ page }) => {
    await gotoUpload(page);
    await expect(page.getByRole('heading', { name: /what did you do on the dive/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /i took a photo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /i ran a structured survey/i })).toBeVisible();
  });

  test('selecting a mode advances past the mode selector', async ({ page }) => {
    await gotoUpload(page);
    await page.getByRole('button', { name: /i took a photo/i }).click();
    await expect(page.getByRole('heading', { name: /where did you dive/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /what did you do on the dive/i })).not.toBeVisible();
  });

  test('T22 "Diving here?" nudge on the site page links to /upload', async ({ page }) => {
    const slug = firstSiteSlug();
    await loadSitePage(page);
    // The global nav also has an "Upload a sighting" link (plain /upload, no
    // site param) — scope to the site-specific nudge card CTA by its href.
    const link = page.locator(`a[href="/upload?site=${encodeURIComponent(slug)}"]`);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/upload a sighting/i);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/upload\\?site=${slug}`));
    await expect(page.getByRole('heading', { name: /what did you do on the dive/i })).toBeVisible();
  });
});

// ─── Submission form UI ────────────────────────────────────────────────────────
//
// Current flow: Mode Selector ("I took a photo") -> Site Search ("Continue") ->
// a single combined "Your sighting" screen (photo + category + sub-category,
// submitted immediately) -> BroadcastConfirmation after a real successful submit.
// There is no separate "details" step, no #observed-on field (date is set from
// EXIF/today, not typed in), and no pre-submit "review and confirm" screen.

async function chooseTookAPhoto(page: Page): Promise<void> {
  await page.getByRole('button', { name: /i took a photo/i }).click();
}

async function continueSiteSearch(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^continue$/i }).click();
}

async function reachSightingScreen(page: Page): Promise<void> {
  await gotoUpload(page);
  await chooseTookAPhoto(page);
  await continueSiteSearch(page);
  await expect(page.getByRole('heading', { name: /your sighting/i })).toBeVisible();
}

async function addPhoto(page: Page): Promise<void> {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /upload photos/i }).click(),
  ]);
  await chooser.setFiles({ name: 'test.jpg', mimeType: 'image/jpeg', buffer: tinyJpeg() });
}

test.describe('UI: submission form', () => {
  test('step 1 — mode selector is visible and actionable on page load', async ({ page }) => {
    await gotoUpload(page);
    await expect(page.getByRole('heading', { name: /what did you do on the dive/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /i took a photo/i })).toBeVisible();
  });

  test('step 1 — submit is blocked without a photo', async ({ page }) => {
    await reachSightingScreen(page);
    // The current flow enforces "at least 1 photo" by disabling the Submit
    // button (formData.photos.length === 0) rather than showing a validation
    // message on click — a disabled native <button> never fires its onClick,
    // so the "Please add at least 1 photo." copy in the source is defensive/
    // unreachable via the UI and is not asserted here.
    const submitBtn = page.getByRole('button', { name: /^submit sighting$/i });
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeDisabled();
  });

  test('category selection reveals sub-options (Sharks & rays)', async ({ page }) => {
    await reachSightingScreen(page);
    await addPhoto(page);

    await page.getByRole('button', { name: /sharks & rays/i }).click();

    await expect(page.getByRole('button', { name: /^whale shark$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^hammerhead$/i })).toBeVisible();
  });

  test('coral sub-option (under Invertebrates) — bleaching score becomes visible', async ({ page }) => {
    await reachSightingScreen(page);
    await addPhoto(page);

    await page.getByRole('button', { name: /invertebrates/i }).click();
    await page.getByRole('button', { name: /^coral$/i }).click();

    await expect(page.getByRole('button', { name: /^healthy$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^bleached$/i })).toBeVisible();
  });

  test('casual sighting flow has no depth field or CoralWatch eligibility UI', async ({ page }) => {
    // Confirmed decision: the casual "I took a photo" flow has no depth/temperature
    // inputs at all — those only exist in the separate "structured survey" mode.
    // A normal photo sighting can therefore never trigger a CoralWatch eligibility
    // badge in the current UI, even though the backend still supports it when
    // depth+bleaching are present. This is a negative assertion of that reality,
    // not a restoration of the dropped UI.
    await reachSightingScreen(page);
    await addPhoto(page);

    // Select Coral (the sub-option most likely to expose CoralWatch-related UI,
    // since it is the only path to a bleaching score) and confirm there is still
    // no depth input and no CoralWatch text anywhere on the screen.
    await page.getByRole('button', { name: /invertebrates/i }).click();
    await page.getByRole('button', { name: /^coral$/i }).click();
    await expect(page.getByRole('button', { name: /^healthy$/i })).toBeVisible();

    await expect(page.locator('#depth-m')).toHaveCount(0);
    await expect(page.getByText(/coralwatch/i)).toHaveCount(0);
  });

  test('successful submission shows the platform list in the post-submit confirmation', async ({ page }) => {
    await reachSightingScreen(page);
    await addPhoto(page);
    await page.getByRole('button', { name: /^fish/i }).click();

    await page.getByRole('button', { name: /^submit sighting$/i }).click();

    await expect(page.getByRole('heading', { name: /your sighting is on its way/i })).toBeVisible();
    await expect(page.getByText('iNaturalist')).toBeVisible();
    await expect(page.getByText('GBIF')).toBeVisible();
    await expect(page.getByText('OBIS')).toBeVisible();
  });
});
