/**
 * Location completeness tests.
 *
 * These tests guard against locations being published without the minimum
 * content a user needs to plan a dive trip. Failures here indicate either
 * a data gap in src/data/sites.json / src/data/location-details.json that
 * needs to be filled, or a regression in how the location page assembles
 * its props.
 *
 * Data audit tests (no-browser) live at the top; browser E2E tests follow.
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain-JS zod schema shared with the discovery routine
import { SiteSchema } from '../scripts/lib/site-schema.mjs';

const GOTO = { waitUntil: 'domcontentloaded' } as const;

// Required, non-empty fields every published location must carry. Numbers are
// finiteness-checked (a legitimate lat/lng of 0 must pass).
const LOCATION_REQUIRED_STRINGS = ['id', 'slug', 'name', 'country', 'region', 'countryCode', 'description'] as const;

// ── Data helpers (run at test time, no browser needed) ────────────────────

function loadData() {
  const root = path.join(process.cwd(), 'src/data');
  const locations = JSON.parse(fs.readFileSync(path.join(root, 'locations.json'), 'utf8'));
  const sites     = JSON.parse(fs.readFileSync(path.join(root, 'sites.json'), 'utf8'));
  const details   = JSON.parse(fs.readFileSync(path.join(root, 'location-details.json'), 'utf8'));

  const sitesByLoc: Record<string, typeof sites> = {};
  for (const s of sites) {
    sitesByLoc[s.locationId] ??= [];
    sitesByLoc[s.locationId].push(s);
  }
  const detailsById: Record<string, (typeof details)[0]> = {};
  for (const d of details) detailsById[d.id] = d;

  return { locations, sites, sitesByLoc, detailsById };
}

// ── 1. Every location must have at least one dive site ────────────────────
// Hard failure if the count gets WORSE. The 6 known no-site locations are a
// backlog — each one needs dive sites added to src/data/sites.json.
// Reduce MAX_NO_SITE_LOCATIONS toward 0 as sites are added.

const MAX_NO_SITE_LOCATIONS = 6;

test(`no more than ${MAX_NO_SITE_LOCATIONS} locations are missing dive sites`, () => {
  const { locations, sitesByLoc } = loadData();
  const missing = locations
    .filter((l: { id: string }) => !sitesByLoc[l.id]?.length)
    .map((l: { id: string; name: string; country: string }) => `${l.name}, ${l.country} (${l.id})`);

  console.log(`\nLocations with NO dive sites (${missing.length}/${MAX_NO_SITE_LOCATIONS} allowed):\n${missing.map((m: string) => '  • ' + m).join('\n')}`);
  expect(missing.length, `New location added without any dive sites:\n${missing.join('\n')}`).toBeLessThanOrEqual(MAX_NO_SITE_LOCATIONS);
});

// ── 1b. Every dive site must satisfy SiteSchema (hard, zero tolerance) ─────
// This is the data-integrity gate. Any site missing/!malformed required info
// (null scientificName, empty bestMonths, <2 species, over-long description,
// invalid diveTypes, null getThere/editorialRank, etc.) fails the build.
// The discovery routine enforces this on write; this test guards the corpus
// against regressions and bad manual edits.

test('every dive site passes SiteSchema validation', () => {
  const { sites } = loadData();
  const invalid: string[] = [];

  for (const s of sites) {
    const parsed = SiteSchema.safeParse(s);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 4)
        .map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      invalid.push(`${s.name ?? '(no name)'} (${s.id ?? '(no id)'}) → ${issues}`);
    }
  }

  expect(invalid, `Dive sites failing schema validation:\n${invalid.join('\n')}`).toHaveLength(0);
});

// ── 1c. Every location must have its structural fields populated (hard) ────
// Structural fields are always derivable and must never be blank. heroImageUrl
// is handled separately as a ratchet (it needs a sourced underwater photo).

test('every location has all structural fields populated', () => {
  const { locations } = loadData();
  const gaps: string[] = [];

  for (const l of locations) {
    const missing: string[] = [];
    for (const f of LOCATION_REQUIRED_STRINGS) {
      if (typeof l[f] !== 'string' || !l[f].trim()) missing.push(f);
    }
    if (!Number.isFinite(l.lat)) missing.push('lat');
    if (!Number.isFinite(l.lng)) missing.push('lng');
    if (!Array.isArray(l.bestMonths) || l.bestMonths.length === 0) missing.push('bestMonths');
    if (missing.length) gaps.push(`${l.name ?? l.id} (${l.id}) → ${missing.join(', ')}`);
  }

  expect(gaps, `Locations with missing structural fields:\n${gaps.join('\n')}`).toHaveLength(0);
});

// ── 1d. Location hero images (ratchet) ─────────────────────────────────────
// Each location should carry a sourced underwater hero photo. 3 known gaps
// (Koh Rong, Grande Comore, São Tomé) await images. Reduce as photos land.

const MAX_LOCATIONS_NO_HERO = 6; // 6 remote no-site locations have no Wikimedia underwater photo

test(`no more than ${MAX_LOCATIONS_NO_HERO} locations are missing a hero image`, () => {
  const { locations } = loadData();
  const missing = locations
    .filter((l: { heroImageUrl?: string }) => typeof l.heroImageUrl !== 'string' || !l.heroImageUrl.trim())
    .map((l: { id: string; name: string }) => `${l.name} (${l.id})`);

  console.log(`\nLocations missing hero image (${missing.length}/${MAX_LOCATIONS_NO_HERO} allowed):\n${missing.map((m: string) => '  • ' + m).join('\n')}`);
  expect(missing.length, `Hero-image gap increased — add an underwater hero to:\n${missing.join('\n')}`).toBeLessThanOrEqual(MAX_LOCATIONS_NO_HERO);
});

// ── 2. Every location must have a location-details entry ──────────────────

test('every location has a location-details entry', () => {
  const { locations, detailsById } = loadData();
  const missing = locations
    .filter((l: { id: string }) => !detailsById[l.id])
    .map((l: { id: string; name: string }) => l.id);

  expect(missing, `Missing location-details entries:\n${missing.join('\n')}`).toHaveLength(0);
});

// ── 3. Every location-details entry must have required fields ─────────────

test('every location-details entry has level, style, duration, and getting-there', () => {
  const { detailsById } = loadData();
  const gaps: string[] = [];

  for (const d of Object.values(detailsById) as Array<{
    id: string;
    diveLevel?: string;
    diveStyle?: string;
    tripDuration?: string;
    goodToKnow?: Array<{ title: string; body: string }>;
  }>) {
    const missing = [];
    if (!d.diveLevel?.trim())    missing.push('diveLevel');
    if (!d.diveStyle?.trim())    missing.push('diveStyle');
    if (!d.tripDuration?.trim()) missing.push('tripDuration');
    const hasGetThere = d.goodToKnow?.some(g =>
      g.title.toLowerCase().includes('getting there')
    );
    if (!hasGetThere) missing.push('goodToKnow["Getting there"]');
    if (missing.length) gaps.push(`${d.id}: missing ${missing.join(', ')}`);
  }

  expect(gaps, `Detail entries with missing required fields:\n${gaps.join('\n')}`).toHaveLength(0);
});

// ── 4. Locations with sites must have lodging entries ─────────────────────
// Ratchet: cap at current known gap count. Fail if new locations lose lodging;
// pass (with logged list) while the backlog is being filled.
// To tighten: reduce MAX_LODGING_GAPS when data is added.

const MAX_LODGING_GAPS = 32; // reduce this as hotels are added

test(`no more than ${MAX_LODGING_GAPS} locations with sites are missing lodging`, () => {
  const { locations, sitesByLoc } = loadData();
  const missing: string[] = [];

  for (const loc of locations) {
    const locSites = sitesByLoc[loc.id] ?? [];
    if (!locSites.length) continue;
    const lodging = locSites.flatMap((s: { lodging?: unknown[] }) => s.lodging ?? []);
    if (!lodging.length) missing.push(`${loc.name} (${loc.id})`);
  }

  console.log(`\nLocations missing lodging (${missing.length}/${MAX_LODGING_GAPS} allowed):\n${missing.map(m => '  • ' + m).join('\n')}`);
  expect(missing.length, `Lodging gap increased — add hotels to these locations:\n${missing.join('\n')}`).toBeLessThanOrEqual(MAX_LODGING_GAPS);
});

// ── 5. Lodging URLs must be direct pages, never search results ────────────

test('all lodging URLs are direct hotel/property pages, not search results', () => {
  const { sites } = loadData();
  const BAD_PATTERNS = [
    'searchresults.html',
    '/search?',
    '/search/',
    'q=',
    'ss=',
    'dive-shop-search',
    '/dive-shop',
  ];
  const bad: string[] = [];

  for (const site of sites) {
    for (const l of (site.lodging ?? [])) {
      const url: string = l.url ?? '';
      if (BAD_PATTERNS.some(p => url.includes(p))) {
        bad.push(`${site.id} → "${l.label}": ${url}`);
      }
    }
  }

  expect(bad, `Lodging links that are search pages (must be direct booking URLs):\n${bad.join('\n')}`).toHaveLength(0);
});

// ── 6. Locations with sites must have at least one dive operator ──────────
// Ratchet: same pattern as lodging. Reduce MAX_OPERATOR_GAPS as ops are added.

const MAX_OPERATOR_GAPS = 24;

test(`no more than ${MAX_OPERATOR_GAPS} locations with sites are missing dive operators`, () => {
  const { locations, sitesByLoc } = loadData();
  const missing: string[] = [];

  for (const loc of locations) {
    const locSites = sitesByLoc[loc.id] ?? [];
    if (!locSites.length) continue;
    const ops = locSites.flatMap((s: { operators?: unknown[] }) => s.operators ?? []);
    if (!ops.length) missing.push(`${loc.name} (${loc.id})`);
  }

  console.log(`\nLocations missing operators (${missing.length}/${MAX_OPERATOR_GAPS} allowed):\n${missing.map(m => '  • ' + m).join('\n')}`);
  expect(missing.length, `Operator gap increased — add operators to:\n${missing.join('\n')}`).toBeLessThanOrEqual(MAX_OPERATOR_GAPS);
});

// ── 7. Species cards: every displayed species must have a photo ───────────
// Ratchet: 79 known gaps — mostly "schooling" behavior entries and a few
// unusual subjects (bone fossils, black coral colonies). Reduce MAX_SPECIES_NO_PHOTO
// as images are sourced. "Schooling X" entries need a photo of a solo individual
// of that species from iNaturalist or similar CC-licensed source.

const MAX_SPECIES_NO_PHOTO = 79;

test(`no more than ${MAX_SPECIES_NO_PHOTO} species entries are missing a photo`, () => {
  const { sites } = loadData();
  const missing: string[] = [];

  for (const site of sites) {
    for (const sp of (site.species ?? [])) {
      if (!sp.imageUrl?.trim()) {
        missing.push(`${site.id} → ${sp.commonName ?? sp.scientificName ?? '?'}`);
      }
    }
  }

  console.log(`\nSpecies without photos (${missing.length}/${MAX_SPECIES_NO_PHOTO} allowed):\n${missing.slice(0, 20).map(m => '  • ' + m).join('\n')}${missing.length > 20 ? `\n  ... and ${missing.length - 20} more` : ''}`);
  expect(missing.length, `Species photo gap increased — add photos for:\n${missing.slice(0, 10).join('\n')}`).toBeLessThanOrEqual(MAX_SPECIES_NO_PHOTO);
});

// ── Browser E2E: spot-check a rich location renders all sections ──────────
// Raja Ampat is the most data-rich location — used as the canonical check.

test.describe('Location page — Raja Ampat (rich data spot-check)', () => {
  const SLUG = 'raja-ampat-indonesia';

  test('shows "Plan your trip" with Getting there', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('summary').filter({ hasText: /getting there/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('"Where to stay" section present and open', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    const section = page.locator('summary').filter({ hasText: /where to stay/i });
    await expect(section).toBeVisible({ timeout: 15_000 });
    const details = section.locator('..');
    await expect(details).toHaveAttribute('open');
  });

  test('at least one lodging link is present and goes to a direct URL', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    // All lodging links are anchors inside the "Where to stay" details
    const staySection = page.locator('details').filter({
      has: page.locator('summary').filter({ hasText: /where to stay/i }),
    });
    const links = staySection.getByRole('link');
    const count = await links.count();
    expect(count, 'Expected at least one lodging link').toBeGreaterThan(0);

    // Verify none of them are search result pages
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await links.nth(i).getAttribute('href') ?? '';
      expect(href, `Lodging link ${i} must not be a search URL`).not.toMatch(
        /searchresults|\/search\?|q=|ss=|dive-shop/,
      );
    }
  });

  test('at least one dive operator link is present', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
    // Operator section label
    await expect(
      page.getByText(/dive operators/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('species cards each have a loaded photo', async ({ page }) => {
    await page.goto(`/locations/${SLUG}`, GOTO);
    // Wait for species section to appear
    const speciesHeader = page.getByText(/what you.ll see/i).first();
    await expect(speciesHeader).toBeVisible({ timeout: 15_000 });

    // All <img> inside species cards must have a non-empty src
    const speciesSection = page.locator('section').filter({
      has: page.locator('p').filter({ hasText: /what you.ll see/i }),
    });
    const imgs = speciesSection.locator('img');
    const imgCount = await imgs.count();
    expect(imgCount, 'Expected species photos').toBeGreaterThan(0);

    for (let i = 0; i < imgCount; i++) {
      const src = await imgs.nth(i).getAttribute('src') ?? '';
      expect(src, `Species card ${i} must have a photo src`).toBeTruthy();
      // Must not be a placeholder or empty image
      expect(src).not.toMatch(/placeholder|blank|1x1|empty/i);
    }
  });
});
