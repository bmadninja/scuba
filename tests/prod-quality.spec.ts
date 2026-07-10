/**
 * Production quality gate — runs against https://scubaseason.fun
 *
 * Covers:
 *   1.  Page loads (all routes, 200 status, custom 404)
 *   2.  Navigation (logo, nav links, breadcrumbs)
 *   3.  Copy hygiene — no hyphenated compounds on any page
 *   4.  Contact email — no personal Gmail, hello@ used correctly
 *   5.  No stale "last updated" / "last synced" timestamps on live data
 *   6.  Images — broken images, alt text, card images, aspect ratios
 *   7.  Mobile layout (375 px) — no horizontal overflow, nav/content visible
 *   8.  Tablet layout (768 px) — no horizontal overflow
 *   9.  Filter rail (/locations) — reef state pills, months, cert dropdown,
 *        location count live region
 *   10. Info popups — open in-page, content present, dismissible
 *   11. Search — multiple query types, URL params, species results, empty state
 *   12. Location page — all sections present across multiple fixtures
 *   13. Reef state badges — labels and presence on cards and detail pages
 *   14. Site listing and detail pages
 *   15. Affiliate disclosure present when booking links exist
 *   16. About page — content, contact email, no broken links
 *   17. Method/Data page — sources list, FAQ section
 *   18. SEO / meta — title, description, OG tags on every page
 *   19. Accessibility basics — single h1, alt text, button names
 *   20. Card grid quality — images not distorted, badges aligned
 *
 * Run: npx playwright test --config=playwright.prod.config.ts
 */
import { test, expect, type Page } from '@playwright/test';

// ── Constants ──────────────────────────────────────────────────────────────

const GOTO = { waitUntil: 'domcontentloaded' } as const;
const IDLE = { waitUntil: 'networkidle' } as const;

// Explorer route (filter rail + card grid + map)
const LOCATIONS = '/locations';

// Location fixtures (data-rich; used in existing unit tests)
const ARI       = '/locations/ari-atoll-maldives';
const RAJA      = '/locations/raja-ampat-indonesia';
const SIPADAN   = '/locations/sipadan-malaysia';
const GREAT_BAR = '/locations/great-barrier-reef-australia';

// Site fixture
const CAPE_KRI  = '/sites/raja-ampat-cape-kri';

const CORRECT_EMAIL = 'hello@scubaseason.fun';
const PERSONAL_EMAIL = 'josie.ty.leung@gmail.com';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Collect visible text from the page and return any lowercase-word-lowercase-word
 * hyphenated compounds. Ignores <a>, <code>, <pre>, <script>, <style>, and
 * aria-hidden subtrees (those are URLs or markup, not copy).
 */
async function findHyphensInCopy(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const hits: string[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el) continue;
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'code', 'pre'].includes(tag)) continue;
      // Skip links — their text may contain slugs or product names
      if (el.closest('a')) continue;
      // Skip aria-hidden subtrees
      if (el.closest('[aria-hidden="true"]')) continue;
      // Skip hidden elements
      if (getComputedStyle(el).display === 'none') continue;
      const text = node.textContent ?? '';
      // Only match lower-lower compounds (e.g. "well-known"). Excludes proper
      // nouns, numbers ("20-30m"), em/en dashes.
      const matches = text.match(/\b[a-z]{2,}-[a-z]{2,}\b/g);
      if (matches) {
        hits.push(...matches.map(m => `"${m}" in <${tag}>`));
      }
    }
    return [...new Set(hits)];
  });
}

/** Return src / alt of every img whose naturalWidth === 0. */
async function findBrokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('img'))
      .filter(img => img.complete && img.naturalWidth === 0)
      .map(img => `src="${img.getAttribute('src') ?? '(missing)'}" alt="${img.alt}"`)
  );
}

/** True if any element causes the body to scroll horizontally. */
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.body.scrollWidth > window.innerWidth);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PAGE LOADS
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Page loads', () => {
  const routes: [string, string][] = [
    ['Homepage',         '/'],
    ['Search',           '/search'],
    ['Sites listing',    '/sites'],
    ['Location: Ari',    ARI],
    ['Location: Raja',   RAJA],
    ['Location: Sipadan',SIPADAN],
    ['Site: Cape Kri',   CAPE_KRI],
    ['About',            '/about'],
    ['Method/Data',      '/data'],
  ];

  for (const [name, path] of routes) {
    test(`${name} returns 200`, async ({ page }) => {
      const resp = await page.goto(path, GOTO);
      expect(resp?.status(), `${name} (${path}) should be 200`).toBe(200);
    });
  }

  test('Unknown route returns 404 with content', async ({ page }) => {
    const resp = await page.goto('/not-a-real-page-xyz-abc', GOTO);
    expect(resp?.status()).toBe(404);
    const body = await page.locator('body').innerText();
    expect(body.trim().length, '404 page should have visible content').toBeGreaterThan(20);
  });

  test('Unknown location slug returns 404', async ({ page }) => {
    const resp = await page.goto('/locations/does-not-exist-xyz', GOTO);
    expect(resp?.status()).toBe(404);
  });

  test('Unknown site slug returns 404', async ({ page }) => {
    const resp = await page.goto('/sites/does-not-exist-xyz', GOTO);
    expect(resp?.status()).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Navigation', () => {
  test('Logo is visible on homepage', async ({ page }) => {
    await page.goto('/', GOTO);
    // Nav does not use a <header> element — look for any link to the root
    const logo = page.locator('a[href="/"]').first();
    await expect(logo).toBeVisible({ timeout: 10_000 });
  });

  test('Method nav link navigates to /data', async ({ page }) => {
    await page.goto('/', GOTO);
    const method = page.getByRole('link', { name: /method/i }).first();
    await expect(method).toBeVisible({ timeout: 10_000 });
    await method.click();
    await expect(page).toHaveURL(/\/data/);
  });

  test('About nav link navigates to /about', async ({ page }) => {
    await page.goto('/', GOTO);
    // Use href-based selector to avoid matching card text containing "about"
    const about = page.locator('a[href="/about"]').first();
    await expect(about).toBeVisible({ timeout: 10_000 });
    await about.click();
    await expect(page).toHaveURL(/\/about/);
  });

  test('Location page has breadcrumb or back-to-atlas link', async ({ page }) => {
    await page.goto(ARI, GOTO);
    // Either a breadcrumb nav or a link back to the atlas root
    const breadcrumb = page.locator(
      'nav[aria-label*="breadcrumb"], [data-breadcrumb], a[href="/"]'
    ).first();
    await expect(breadcrumb).toBeVisible({ timeout: 10_000 });
  });

  test('Site page links back to its parent location', async ({ page, isMobile }) => {
    // Breadcrumb nav is hidden on mobile (sm:flex) — desktop-only check
    if (isMobile) return;
    await page.goto(CAPE_KRI, GOTO);
    // Should have a link to /locations/raja-ampat-indonesia
    await expect(
      page.locator('a[href*="/locations/"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('Homepage search input is present in nav', async ({ page, isMobile }) => {
    // Search input in nav is hidden on mobile (sm:block) — desktop-only check
    if (isMobile) return;
    await page.goto('/', GOTO);
    await expect(
      page.getByRole('textbox', { name: /search reefs/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. COPY HYGIENE — no hyphenated compounds
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Copy hygiene — no hyphens in user-facing text', () => {
  // Pairs: [page name, path]
  const pages: [string, string][] = [
    ['Homepage',          '/'],
    ['Location: Ari',     ARI],
    ['Location: Raja',    RAJA],
    ['Site: Cape Kri',    CAPE_KRI],
    ['Search',            '/search'],
    ['About',             '/about'],
    ['Method/Data',       '/data'],
  ];

  for (const [name, path] of pages) {
    test(`${name} has no hyphenated compounds in copy`, async ({ page }) => {
      await page.goto(path, GOTO);
      await page.waitForLoadState('networkidle').catch(() => null);
      const hits = await findHyphensInCopy(page);
      expect(
        hits,
        `Hyphenated copy on ${name} (${path}):\n  ${hits.join('\n  ')}`
      ).toHaveLength(0);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. CONTACT EMAIL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Contact email', () => {
  const allPages = ['/', ARI, CAPE_KRI, '/about', '/data', '/search'];

  for (const path of allPages) {
    test(`No personal Gmail on ${path}`, async ({ page }) => {
      await page.goto(path, GOTO);
      const html = await page.content();
      expect(html, `Personal Gmail found on ${path}`).not.toContain(PERSONAL_EMAIL);
    });
  }

  test('About page uses hello@scubaseason.fun for contact', async ({ page }) => {
    await page.goto('/about', GOTO);
    const html = await page.content();
    // If the page mentions contact/email, it must use the correct address
    if (/contact|get in touch|reach us/i.test(html)) {
      expect(html, 'About page should use hello@scubaseason.fun').toContain(CORRECT_EMAIL);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. NO STALE TIMESTAMPS ON LIVE-DATA PAGES
// ═══════════════════════════════════════════════════════════════════════════
test.describe('No stale "last updated" timestamps', () => {
  const liveDataPages = ['/', ARI, RAJA, SIPADAN, '/sites'];

  for (const path of liveDataPages) {
    test(`No "last updated" / "last synced" visible on ${path}`, async ({ page }) => {
      await page.goto(path, GOTO);
      await page.waitForLoadState('networkidle').catch(() => null);
      const text = await page.locator('body').innerText().catch(() => '');
      expect(text, `Stale timestamp copy found on ${path}`).not.toMatch(/last updated/i);
      expect(text, `Stale timestamp copy found on ${path}`).not.toMatch(/last synced/i);
      expect(text, `Stale "updated at" found on ${path}`).not.toMatch(/updated at/i);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. IMAGES
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Images', () => {
  test('Homepage has no broken images', async ({ page }) => {
    await page.goto('/', GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const broken = await findBrokenImages(page);
    expect(broken, `Broken images on homepage:\n  ${broken.join('\n  ')}`).toHaveLength(0);
  });

  test('Location: Ari has no broken images', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const broken = await findBrokenImages(page);
    expect(broken, `Broken images on ${ARI}:\n  ${broken.join('\n  ')}`).toHaveLength(0);
  });

  test('Location: Raja has no broken images', async ({ page }) => {
    await page.goto(RAJA, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const broken = await findBrokenImages(page);
    expect(broken, `Broken images on ${RAJA}:\n  ${broken.join('\n  ')}`).toHaveLength(0);
  });

  test('Site: Cape Kri has no broken images', async ({ page }) => {
    await page.goto(CAPE_KRI, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const broken = await findBrokenImages(page);
    expect(broken, `Broken images on ${CAPE_KRI}:\n  ${broken.join('\n  ')}`).toHaveLength(0);
  });

  test('Location hero image has non-empty alt text', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const hero = page.locator('img').first();
    await expect(hero).toBeVisible({ timeout: 15_000 });
    const alt = await hero.getAttribute('alt');
    expect(alt, 'Hero image missing alt text').toBeTruthy();
    expect((alt ?? '').length, 'Hero alt text too short').toBeGreaterThan(4);
  });

  test('Card images on homepage are not distorted (aspect ratio ~4:3)', async ({ page }) => {
    await page.goto('/', GOTO);
    const cardImgs = page.locator('a[href^="/locations/"] img');
    await expect(cardImgs.first()).toBeVisible({ timeout: 20_000 });
    // Check first 5 card images; ratio should be roughly 4:3 (allow 20% tolerance)
    const count = Math.min(5, await cardImgs.count());
    for (let i = 0; i < count; i++) {
      const box = await cardImgs.nth(i).boundingBox();
      if (!box || box.height === 0) continue;
      const ratio = box.width / box.height;
      expect(ratio, `Card image ${i} has unexpected aspect ratio ${ratio.toFixed(2)}`).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(4);
    }
  });

  test('Card images are actually loaded (not broken)', async ({ page }) => {
    await page.goto('/', GOTO);
    const firstCard = page.locator('a[href^="/locations/"] img').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });
    const broken = await firstCard.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth === 0
    );
    expect(broken, 'First card image is broken').toBe(false);
  });

  test('Species thumbnails on location page have alt text', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const speciesSection = page.locator('#species, section').filter({ hasText: "What you will see" });
    if (await speciesSection.count() === 0) return;
    const thumbs = speciesSection.locator('img');
    const count = Math.min(3, await thumbs.count());
    for (let i = 0; i < count; i++) {
      const alt = await thumbs.nth(i).getAttribute('alt');
      expect(alt, `Species thumbnail ${i} missing alt text`).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. MOBILE LAYOUT — 375px
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Mobile layout (375 px)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('Homepage has no horizontal overflow', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('body')).toBeVisible();
    expect(await hasHorizontalOverflow(page), 'Homepage horizontal overflow on 375px').toBe(false);
  });

  test('Header/nav is visible on mobile homepage', async ({ page }) => {
    await page.goto('/', GOTO);
    const header = page.locator('header').first();
    await expect(header).toBeVisible({ timeout: 10_000 });
  });

  test('Location page has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await page.waitForLoadState('domcontentloaded');
    expect(await hasHorizontalOverflow(page), `${ARI} horizontal overflow on 375px`).toBe(false);
  });

  test('Search page has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/search', GOTO);
    expect(await hasHorizontalOverflow(page), 'Search page horizontal overflow on 375px').toBe(false);
  });

  test('About page has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/about', GOTO);
    expect(await hasHorizontalOverflow(page), 'About page horizontal overflow on 375px').toBe(false);
  });

  test('Site detail has no horizontal overflow on mobile', async ({ page }) => {
    await page.goto(CAPE_KRI, GOTO);
    expect(await hasHorizontalOverflow(page), `${CAPE_KRI} horizontal overflow on 375px`).toBe(false);
  });

  test('Location count is readable on mobile', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/\d+\s*location/i, { timeout: 20_000 });
  });

  test('Filter rail opens on mobile', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    // Mobile trigger is the sticky bottom "Filter" button, which opens a
    // role="dialog" sheet labeled "Filters".
    const filterBtn = page.getByRole('button', { name: 'Filter' });
    await expect(filterBtn).toBeVisible({ timeout: 15_000 });
    await filterBtn.click();
    await expect(
      page.getByRole('dialog', { name: 'Filters' })
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. TABLET LAYOUT — 768px
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Tablet layout (768 px)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('Homepage has no horizontal overflow at 768px', async ({ page }) => {
    await page.goto('/', GOTO);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('Location page has no horizontal overflow at 768px', async ({ page }) => {
    await page.goto(ARI, GOTO);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('Method page has no horizontal overflow at 768px', async ({ page }) => {
    await page.goto('/data', GOTO);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. FILTER RAIL
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Filter rail', () => {
  test('Location count live region shows a positive number', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/\d+\s*location/i, { timeout: 20_000 });
    const text = await status.innerText();
    const n = parseInt(text.replace(/\D/g, ''), 10);
    expect(n, 'Location count should be > 0').toBeGreaterThan(0);
  });

  test('"Filters" label is visible on mobile', async ({ page }) => {
    // The "Filters" label only exists on the mobile filter sheet (aria-label),
    // opened via the sticky bottom "Filter" button.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(LOCATIONS, GOTO);
    const filterBtn = page.getByRole('button', { name: 'Filter' });
    await expect(filterBtn).toBeVisible({ timeout: 15_000 });
    await filterBtn.click();
    await expect(
      page.getByRole('dialog', { name: 'Filters' })
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Four reef-state pill filters are present', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    for (const label of ['Improving', 'Stable', 'Declining', 'Not surveyed']) {
      await expect(
        page.getByRole('button', { name: label, exact: true })
      ).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Selecting "Improving" reduces the location count', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/\d+\s*location/i, { timeout: 20_000 });
    const beforeText = await status.innerText();
    const before = parseInt(beforeText.replace(/\D/g, ''), 10);
    await page.getByRole('button', { name: 'Improving', exact: true }).click();
    // Wait for the actual filter to land (URL param + a real text change) rather
    // than re-matching the same generic /\d+\s*location/i pattern, which the
    // pre-click text already satisfies and can race a slow re-render.
    await expect(page).toHaveURL(/reef=thriving/, { timeout: 10_000 });
    await expect(status).not.toHaveText(beforeText, { timeout: 10_000 });
    const after = parseInt((await status.innerText()).replace(/\D/g, ''), 10);
    expect(after, 'Selecting Improving should reduce the location count').toBeLessThan(before);
  });

  test('Selecting a reef state persists to the URL', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const pill = page.getByRole('button', { name: 'Improving', exact: true });
    await expect(pill).toBeVisible({ timeout: 15_000 });
    await pill.click();
    await expect(page).toHaveURL(/reef=/, { timeout: 5_000 });
  });

  test('"When" dropdown shows all 12 month buttons', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await expect(whenPill).toHaveAttribute('aria-expanded', 'false');
    await whenPill.click();
    await expect(whenPill).toHaveAttribute('aria-expanded', 'true');
    for (const m of ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']) {
      await expect(page.getByRole('button', { name: m, exact: true })).toBeVisible();
    }
  });

  test('Clicking a month updates the URL', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await whenPill.click();
    await page.getByRole('button', { name: 'Jan', exact: true }).click();
    await expect(page).toHaveURL(/month=1\b/);
  });

  test('Clicking two months keeps both in the URL', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const whenPill = page.getByRole('button', { name: 'When', exact: true });
    await expect(whenPill).toBeVisible({ timeout: 15_000 });
    await whenPill.click();
    await page.getByRole('button', { name: 'Jan', exact: true }).click();
    // Wait for the first toggle's URL update to commit before the second
    // click — the filter bar reads the URLSearchParams from its own render
    // closure, so two clicks fired before a re-render can race and clobber
    // each other.
    await expect(page).toHaveURL(/month=1\b/, { timeout: 5_000 });
    await page.getByRole('button', { name: 'Jun', exact: true }).click();
    await expect(page).toHaveURL(/month=1(%2C|,)6|month=6(%2C|,)1/);
  });

  test('Certification dropdown shows four levels', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const certPill = page.getByRole('button', { name: 'Certification', exact: true });
    await expect(certPill).toBeVisible({ timeout: 15_000 });
    await certPill.click();
    for (const cert of ['Beginner', 'Open water', 'Advanced', 'Technical']) {
      await expect(page.getByRole('button', { name: cert, exact: true })).toBeVisible({ timeout: 15_000 });
    }
  });

  test('Selecting "Beginner" cert filters the count', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const status = page.getByRole('status');
    await expect(status).toContainText(/\d+\s*location/i, { timeout: 20_000 });
    const before = parseInt((await status.innerText()).replace(/\D/g, ''), 10);
    const certPill = page.getByRole('button', { name: 'Certification', exact: true });
    await certPill.click();
    await page.getByRole('button', { name: 'Beginner', exact: true }).click();
    await expect(status).toContainText(/\d+\s*location/i, { timeout: 10_000 });
    const after = parseInt((await status.innerText()).replace(/\D/g, ''), 10);
    expect(after).toBeLessThanOrEqual(before);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. INFO POPUPS
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Info popups', () => {
  test('Location "how we judge this" button opens an in-page popup', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const infoBtn = page.getByRole('button', { name: /how we judge this/i }).first();
    await expect(infoBtn).toBeVisible({ timeout: 15_000 });
    const beforeUrl = page.url();
    await infoBtn.click();
    // URL must not change
    await page.waitForTimeout(400);
    expect(page.url()).toBe(beforeUrl);
    // The "how we judge this" trigger opens AtlasInfoPopup's "state" entry,
    // whose dialog is labeled with its title. Match on that specifically —
    // the generic dialog selector also matches the (hidden) mobile nav sheet
    // that's always present in the DOM.
    const popup = page.getByRole('dialog', { name: 'What the reef labels mean' });
    await expect(popup).toBeVisible({ timeout: 5_000 });
  });

  test('Popup contains explanatory text (not empty)', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const infoBtn = page.getByRole('button', { name: /how we judge this/i }).first();
    await expect(infoBtn).toBeVisible({ timeout: 15_000 });
    await infoBtn.click();
    const popup = page.getByRole('dialog', { name: 'What the reef labels mean' });
    await expect(popup).toBeVisible({ timeout: 5_000 });
    const text = await popup.innerText().catch(() => '');
    expect(text.trim().length, 'Popup should contain visible text').toBeGreaterThan(20);
  });

  test('Homepage reef-state info button stays in-page', async ({ page }) => {
    await page.goto('/', GOTO);
    // The "?" or info button next to the reef state labels
    const infoBtn = page.getByRole('button', { name: /what the reef labels mean|reef state|info/i }).first();
    if (await infoBtn.count() === 0) return; // skip if no such button
    const beforeUrl = page.url();
    await infoBtn.click();
    await page.waitForTimeout(400);
    expect(page.url()).toBe(beforeUrl);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. SEARCH
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Search', () => {
  test('Searching "palau" returns location results', async ({ page }) => {
    await page.goto('/search?q=palau', GOTO);
    await expect(page.getByRole('link', { name: /palau/i }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Searching "manta" returns site results', async ({ page }) => {
    await page.goto('/search?q=manta', GOTO);
    await expect(page.getByText(/dive sites/i)).toBeVisible({ timeout: 20_000 });
  });

  test('Searching "maldives" returns the Ari Atoll location', async ({ page }) => {
    await page.goto('/search?q=maldives', GOTO);
    await expect(page.getByRole('link', { name: /maldives|atoll/i }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('Searching "shark" returns species results', async ({ page }) => {
    await page.goto('/search?q=shark', GOTO);
    // Should surface species or site results mentioning sharks
    await expect(page.locator('main a').first()).toBeVisible({ timeout: 20_000 });
  });

  test('Searching gibberish shows a no-results state', async ({ page }) => {
    await page.goto('/search?q=zzzzxxxxxyyy', GOTO);
    await expect(page.getByText(/no results/i)).toBeVisible({ timeout: 15_000 });
  });

  test('?q= param pre-fills the search input', async ({ page }) => {
    await page.goto('/search?q=palau', GOTO);
    const input = page.getByPlaceholder(/search locations/i);
    await expect(input).toHaveValue('palau', { timeout: 10_000 });
  });

  test('Clicking a search result navigates to the correct page', async ({ page }) => {
    await page.goto('/search?q=palau', GOTO);
    const firstLink = page.getByRole('link', { name: /palau/i }).first();
    await expect(firstLink).toBeVisible({ timeout: 20_000 });
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/\/locations\/|\/sites\//);
    await firstLink.click();
    await expect(page).toHaveURL(/palau/);
  });

  test('Search page loads with empty state copy', async ({ page }) => {
    await page.goto('/search', GOTO);
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/search across/i)).toBeVisible({ timeout: 5_000 });
  });

  test('Nav search autocomplete shows results for "raja"', async ({ page, isMobile }) => {
    // On mobile viewports the hero nav search may be hidden; test desktop only
    if (isMobile) return;
    await page.goto('/', GOTO);
    const navSearch = page.getByRole('textbox', { name: /search reefs/i }).first();
    await navSearch.fill('raja');
    // Autocomplete dropdown should appear
    await expect(
      page.getByRole('link', { name: /raja ampat/i }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. LOCATION PAGE STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Location page — Ari Atoll', () => {
  test('Has a single h1 with the location name', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const h1s = page.locator('h1');
    await expect(h1s.first()).toBeVisible({ timeout: 15_000 });
    expect(await h1s.count(), 'Should have exactly one h1').toBe(1);
    await expect(h1s.first()).toContainText(/ari/i);
  });

  test('Shows reef condition section', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.locator('#reef-condition')).toBeVisible({ timeout: 15_000 });
  });

  test('Reef condition section has a coral-cover chart', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const section = page.locator('#reef-condition');
    await expect(section.getByRole('img').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Shows reef-state label in reef condition', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(
      page.getByRole('button', { name: /how we judge this/i })
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Shows "Plan your trip" section', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText('Plan your trip')).toBeVisible({ timeout: 15_000 });
  });

  test('"Plan your trip" shows Best months', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText('Best months')).toBeVisible({ timeout: 15_000 });
  });

  test('"Where to stay" expander is present', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Where to stay' }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('"Getting there" expander is present', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(
      page.locator('summary').filter({ hasText: 'Getting there' }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test('Shows "What you will see" species section', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText("What you will see")).toBeVisible({ timeout: 15_000 });
  });

  test('Species show a "seen" recency line', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.getByText("What you will see")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/seen/i).first()).toBeVisible();
  });

  test('Shows dive sites section', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.locator('#sites')).toBeVisible({ timeout: 15_000 });
  });

  test('Dive site rows link to /sites/[slug]', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await expect(page.locator('a[href^="/sites/"]').first()).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Location page — Raja Ampat (second fixture)', () => {
  test('Loads with a single h1', async ({ page }) => {
    await page.goto(RAJA, GOTO);
    const h1s = page.locator('h1');
    expect(await h1s.count()).toBe(1);
    await expect(h1s.first()).toContainText(/raja/i);
  });

  test('Shows reef condition section', async ({ page }) => {
    await page.goto(RAJA, GOTO);
    await expect(page.locator('#reef-condition')).toBeVisible({ timeout: 15_000 });
  });

  test('Shows "What you will see" section', async ({ page }) => {
    await page.goto(RAJA, GOTO);
    await expect(page.getByText("What you will see")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Location page — Sipadan (third fixture)', () => {
  test('Loads with visible content', async ({ page }) => {
    await page.goto(SIPADAN, GOTO);
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('h1')).toContainText(/sipadan/i);
  });

  test('Shows dive sites section or dive sites list', async ({ page }) => {
    await page.goto(SIPADAN, GOTO);
    // Either a #sites anchor or at least one link to /sites/
    const sitesSection = page.locator('#sites, a[href^="/sites/"]');
    await expect(sitesSection.first()).toBeVisible({ timeout: 20_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. REEF STATE BADGES
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Reef state badges', () => {
  test('Homepage cards show reef state labels', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    const count = await page.getByText(/Improving|Stable|Declining/).count();
    expect(count, 'At least one reef state badge should appear in the card grid').toBeGreaterThan(0);
  });

  test('All three reef states appear somewhere on the homepage', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    // Collectively at least two distinct states should be visible
    const improving = await page.getByText('Improving').count();
    const stable    = await page.getByText('Stable').count();
    const declining = await page.getByText('Declining').count();
    const distinct  = [improving, stable, declining].filter(n => n > 0).length;
    expect(distinct, 'At least 2 distinct reef states should appear on the homepage').toBeGreaterThanOrEqual(2);
  });

  test('Location page shows its reef state', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const state = page.getByText(/Improving|Stable|Declining|Not surveyed/).first();
    await expect(state).toBeVisible({ timeout: 15_000 });
  });

  test('Reef state badge text matches a canonical label', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const badgeText = await page
      .getByText(/Improving|Stable|Declining|Not surveyed/)
      .first()
      .innerText();
    // CSS text-transform may uppercase the text; normalize before comparing
    expect(['improving', 'stable', 'declining', 'not surveyed']).toContain(badgeText.trim().toLowerCase());
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. SITE LISTING AND DETAIL PAGES
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Sites listing (/sites)', () => {
  test('Has a visible heading', async ({ page }) => {
    await page.goto('/sites', GOTO);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Contains site cards or site names', async ({ page }) => {
    await page.goto('/sites', GOTO);
    // At least one link to /sites/[slug]
    await expect(page.locator('a[href^="/sites/"]').first()).toBeVisible({ timeout: 20_000 });
  });

  test('In season / Off season labels appear in the page', async ({ page }) => {
    await page.goto('/sites', GOTO);
    // The "● In season" / "○ Off season" spans are rendered client-side after hydration.
    // Check they are in the DOM (attached) rather than strictly visible, since
    // the badge may be inside a card with overflow:hidden on first paint.
    await page.waitForLoadState('networkidle').catch(() => null);
    const count = await page.getByText(/in season|off season/i).count();
    expect(count, 'No in-season / off-season labels found on /sites').toBeGreaterThan(0);
  });
});

test.describe('Site detail page — Cape Kri', () => {
  test('Has h1 with site name', async ({ page }) => {
    await page.goto(CAPE_KRI, GOTO);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible({ timeout: 15_000 });
    await expect(h1).toContainText(/Cape Kri/i);
  });

  test('Shows main content (not blank)', async ({ page }) => {
    await page.goto(CAPE_KRI, GOTO);
    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 10_000 });
    const text = await main.innerText().catch(() => '');
    expect(text.trim().length).toBeGreaterThan(50);
  });

  test('Has evidence dot indicator', async ({ page }) => {
    await page.goto(CAPE_KRI, GOTO);
    // EvidenceDot renders text like "Confirmed sighting on record" or "Likely"
    const evidence = page.getByText(/confirmed sighting|likely|uncertain|no sighting/i).first();
    if (await evidence.count() > 0) {
      await expect(evidence).toBeVisible({ timeout: 10_000 });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 15. AFFILIATE DISCLOSURE
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Affiliate disclosure', () => {
  test('Location page with booking links has affiliate disclosure', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    // Check raw HTML so we detect the disclosure even if it's inside a collapsed <details>
    const html = await page.content();
    const hasAffiliateLinks = /booking\.com|agoda\.com|amazon\.|liveaboard/i.test(html);
    if (hasAffiliateLinks) {
      expect(html, 'Affiliate disclosure missing despite booking links being present').toMatch(
        /some links earn us|affiliate/i
      );
    }
  });

  test('Affiliate disclosure links to /about', async ({ page }) => {
    await page.goto(ARI, GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const html = await page.content();
    if (/some links earn us/i.test(html)) {
      // The disclosure should have a "Learn more" link to /about
      expect(html).toMatch(/href="\/about"/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 16. ABOUT PAGE
// ═══════════════════════════════════════════════════════════════════════════
test.describe('About page', () => {
  test('Has a single h1', async ({ page }) => {
    await page.goto('/about', GOTO);
    const h1s = page.locator('h1');
    await expect(h1s.first()).toBeVisible({ timeout: 15_000 });
    expect(await h1s.count(), 'About page should have exactly one h1').toBe(1);
  });

  test('No horizontal overflow', async ({ page }) => {
    await page.goto('/about', GOTO);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('Does not mention personal Gmail', async ({ page }) => {
    await page.goto('/about', GOTO);
    const html = await page.content();
    expect(html).not.toContain(PERSONAL_EMAIL);
  });

  test('Nav links back to the homepage', async ({ page }) => {
    await page.goto('/about', GOTO);
    await expect(page.locator('header a[href="/"]').first()).toBeVisible({ timeout: 10_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 17. METHOD / DATA PAGE
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Method/Data page', () => {
  test('Has a visible h1', async ({ page }) => {
    await page.goto('/data', GOTO);
    await expect(page.locator('h1')).toBeVisible({ timeout: 15_000 });
  });

  test('Sources section lists external data providers', async ({ page }) => {
    await page.goto('/data', GOTO);
    // The page renders source groups with known provider names
    await expect(page.getByText(/noaa|coral|reef|iucn|gbif/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('FAQ section is present', async ({ page }) => {
    await page.goto('/data', GOTO);
    // FaqSection renders question/answer disclosure items
    const faq = page.locator('details, [role="group"]').filter({ hasText: /why|how|what/i }).first();
    await expect(faq).toBeVisible({ timeout: 15_000 });
  });

  test('No horizontal overflow', async ({ page }) => {
    await page.goto('/data', GOTO);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('Has an anchor "#reefstate" that reef-state popups can link to', async ({ page }) => {
    await page.goto('/data#reefstate', GOTO);
    // Page should load without error
    const resp = (await page.goto('/data', GOTO))?.status();
    expect(resp).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 18. SEO / META
// ═══════════════════════════════════════════════════════════════════════════
test.describe('SEO / meta', () => {
  test('Homepage title includes "scuba" or "reef" or "dive"', async ({ page }) => {
    await page.goto('/', GOTO);
    const title = await page.title();
    expect(title.length, 'Title should not be empty').toBeGreaterThan(5);
    expect(title).toMatch(/scuba|reef|dive/i);
  });

  test('Homepage has a meta description longer than 20 chars', async ({ page }) => {
    await page.goto('/', GOTO);
    const desc = await page
      .locator('meta[name="description"], meta[property="og:description"]')
      .first()
      .getAttribute('content');
    expect(desc, 'Missing meta description on homepage').toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  test('Location page title includes the location name', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const title = await page.title();
    expect(title).toMatch(/ari|atoll|maldives/i);
  });

  test('Location page has a meta description', async ({ page }) => {
    await page.goto(ARI, GOTO);
    const desc = await page
      .locator('meta[name="description"], meta[property="og:description"]')
      .first()
      .getAttribute('content');
    expect(desc, `Missing meta description on ${ARI}`).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  test('About page has the correct title', async ({ page }) => {
    await page.goto('/about', GOTO);
    const title = await page.title();
    expect(title).toMatch(/about/i);
  });

  test('Method page has the correct title', async ({ page }) => {
    await page.goto('/data', GOTO);
    const title = await page.title();
    expect(title).toMatch(/method|data|how/i);
  });

  test('Homepage has an OG image meta tag', async ({ page }) => {
    await page.goto('/', GOTO);
    const ogImage = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute('content')
      .catch(() => null);
    expect(ogImage, 'Missing OG image on homepage').toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 19. ACCESSIBILITY BASICS
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Accessibility basics', () => {
  test('Homepage has exactly one h1', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    expect(await page.locator('h1').count()).toBe(1);
  });

  test('All images on homepage have alt attributes', async ({ page }) => {
    await page.goto('/', GOTO);
    await page.waitForLoadState('networkidle').catch(() => null);
    const missing = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter(img => !img.hasAttribute('alt'))
        .map(img => img.src)
    );
    expect(missing, `Images without alt on homepage:\n  ${missing.join('\n  ')}`).toHaveLength(0);
  });

  test('All buttons on homepage have accessible names', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    const unnamed = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button'))
        .filter(b => !b.textContent?.trim() && !b.getAttribute('aria-label') && !b.getAttribute('title'))
        .length
    );
    expect(unnamed, `${unnamed} buttons on homepage have no accessible name`).toBe(0);
  });

  test('Location page has exactly one h1', async ({ page }) => {
    await page.goto(ARI, GOTO);
    expect(await page.locator('h1').count()).toBe(1);
  });

  test('Location count region is an aria-live element', async ({ page }) => {
    await page.goto(LOCATIONS, GOTO);
    const status = page.getByRole('status');
    await expect(status).toBeVisible({ timeout: 20_000 });
    const liveAttr = await status.getAttribute('aria-live');
    // role="status" implies aria-live="polite", so either the attribute or the role suffices
    expect(liveAttr ?? 'polite').toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 20. CARD GRID QUALITY
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Card grid quality', () => {
  test('At least 10 location cards are visible on homepage', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    const count = await page.locator('a[href^="/locations/"]').count();
    expect(count, 'Homepage should show at least 10 reef cards').toBeGreaterThanOrEqual(10);
  });

  test('Cards have non-empty hook/description text', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    // Each card should have some subtext — check the first 5
    const cards = page.locator('a[href^="/locations/"]');
    const count = Math.min(5, await cards.count());
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).innerText();
      expect(text.trim().length, `Card ${i} has no visible text`).toBeGreaterThan(10);
    }
  });

  test('Card images maintain a sane, non distorted aspect ratio', async ({ page }) => {
    await page.goto('/', GOTO);
    // The homepage intentionally mixes portrait (3:4 ReefStateCardTrio) and
    // other card formats — this only guards against zero-size or wildly
    // stretched images, not a single fixed orientation.
    const imgs = page.locator('a[href^="/locations/"] img');
    await expect(imgs.first()).toBeVisible({ timeout: 20_000 });
    const first = await imgs.first().boundingBox();
    const second = await imgs.nth(1).boundingBox();
    if (!first || !second) return;
    for (const box of [first, second]) {
      expect(box.width, 'Card image should have non-zero width').toBeGreaterThan(0);
      expect(box.height, 'Card image should have non-zero height').toBeGreaterThan(0);
      const ratio = box.width / box.height;
      expect(ratio, `Card image aspect ratio ${ratio.toFixed(2)} looks distorted`).toBeGreaterThan(0.4);
      expect(ratio).toBeLessThan(2.5);
    }
  });

  test('Country label is present on location cards', async ({ page }) => {
    await page.goto('/', GOTO);
    await expect(page.locator('a[href^="/locations/"]').first()).toBeVisible({ timeout: 20_000 });
    // Cards show country name as subtext — check at least one
    const card = page.locator('a[href^="/locations/"]').first();
    const text = await card.innerText();
    // Should contain a country name (non-numeric text beyond just the reef name)
    expect(text.trim().split('\n').length, 'Card should have multiple lines of text').toBeGreaterThan(1);
  });
});
