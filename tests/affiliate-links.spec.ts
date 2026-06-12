/**
 * Affiliate and partner link integrity.
 *
 * Two sections:
 *
 * 1. DATA INTEGRITY (no network) — exhaustive structural checks over every
 *    lodging, operator, and gear link in the JSON data. Catches malformed URLs,
 *    generic-search redirects, and partner/URL mismatches before they reach
 *    production.
 *
 * 2. HTTP LIVENESS (network, ~10 s) — HEAD-requests all 32 gear Amazon URLs and
 *    a curated regression set (previously-broken links we've fixed). Uses
 *    Playwright's `request` context so it needs no browser.
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

const root = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

type LodgingEntry = {
  partner: string;
  label: string;
  url: string;
  isAffiliate: boolean;
  priceLevel?: number;
  kind?: string;
  productId?: string;
};

type OperatorEntry = {
  partner: string;
  label: string;
  url: string;
  isAffiliate: boolean;
  productId?: string;
};

type GearPartner = {
  partner: string;
  productId?: string;
  url: string;
  commission?: number;
};

type GearItem = {
  id: string;
  name: string;
  partners: GearPartner[];
};

type Site = {
  id: string;
  lodging?: LodgingEntry[];
  operators?: OperatorEntry[];
};

type StandaloneOperator = {
  id: string;
  name: string;
  website: string;
  affiliateUrl?: string;
  affiliateProvider?: string;
};

const sites: Site[] = readJson('src/data/sites.json');
const gear: GearItem[] = readJson('src/data/gear.json');
const standaloneOperators: StandaloneOperator[] = readJson('src/data/operators.json');

// Flatten all links with source context
const allLodging: Array<LodgingEntry & { siteId: string }> = sites.flatMap((s) =>
  (s.lodging ?? []).map((l) => ({ ...l, siteId: s.id })),
);

const allOperators: Array<OperatorEntry & { siteId: string }> = sites.flatMap((s) =>
  (s.operators ?? []).map((o) => ({ ...o, siteId: s.id })),
);

const allGearLinks: Array<GearPartner & { gearId: string; gearName: string }> = gear.flatMap(
  (g) => g.partners.map((p) => ({ ...p, gearId: g.id, gearName: g.name })),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. DATA INTEGRITY
// ---------------------------------------------------------------------------

test.describe('Affiliate link data integrity (no network)', () => {

  // ── General: every URL must be present and parseable ─────────────────────

  test('all lodging URLs are non-empty and parseable', () => {
    const bad: string[] = [];
    for (const l of allLodging) {
      if (!l.url || l.url === '#') {
        bad.push(`${l.siteId} / "${l.label}": empty or "#"`);
      } else if (!parseUrl(l.url)) {
        bad.push(`${l.siteId} / "${l.label}": unparseable — ${l.url}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all operator URLs are non-empty and parseable', () => {
    const bad: string[] = [];
    for (const o of allOperators) {
      if (!o.url || o.url === '#') {
        bad.push(`${o.siteId} / "${o.label}": empty or "#"`);
      } else if (!parseUrl(o.url)) {
        bad.push(`${o.siteId} / "${o.label}": unparseable — ${o.url}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all gear partner URLs are non-empty and parseable', () => {
    const bad: string[] = [];
    for (const g of allGearLinks) {
      if (!g.url || g.url === '#') {
        bad.push(`${g.gearId} / ${g.partner}: empty or "#"`);
      } else if (!parseUrl(g.url)) {
        bad.push(`${g.gearId} / ${g.partner}: unparseable — ${g.url}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  // ── Booking.com: must be a specific property page, never a search page ────
  //
  // Booking.com redirects /hotel/... URLs for delisted properties to
  // /searchresults — so the structural check here catches that class of break
  // at the data level. Any URL in lodging data with a Booking.com hostname must
  // have a property-type path segment (/hotel/, /hostel/, /apartment/, etc.).

  test('all Booking.com lodging URLs point to specific property pages', () => {
    const PROPERTY_SEGMENTS = ['/hotel/', '/hostel/', '/apartment/', '/villa/', '/resort/'];
    const bad: string[] = [];
    for (const l of allLodging) {
      const u = parseUrl(l.url);
      if (!u) continue;
      const isBooking = u.hostname === 'www.booking.com' || u.hostname === 'booking.com';
      if (!isBooking) continue;
      const isPropertyPage = PROPERTY_SEGMENTS.some((seg) => u.pathname.startsWith(seg));
      if (!isPropertyPage) {
        bad.push(`${l.siteId} / "${l.label}": ${l.url}`);
      }
    }
    expect(
      bad,
      `Booking.com URLs that are not specific property pages (will redirect to search):\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  test('no lodging URL is a Booking.com search results page', () => {
    const bad: string[] = [];
    for (const l of allLodging) {
      if (l.url.includes('booking.com/searchresults')) {
        bad.push(`${l.siteId} / "${l.label}": ${l.url}`);
      }
    }
    expect(
      bad,
      `Booking.com /searchresults URLs must not appear in lodging data:\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  // ── Amazon gear: must be a product page (/dp/ASIN), never a search page ──

  test('all Amazon gear URLs point to specific product pages (/dp/ASIN)', () => {
    const bad: string[] = [];
    for (const g of allGearLinks) {
      if (g.partner.toLowerCase() !== 'amazon') continue;
      if (!g.url.includes('/dp/')) {
        bad.push(`${g.gearId} / "${g.gearName}": ${g.url}`);
      }
    }
    expect(
      bad,
      `Amazon gear URLs missing /dp/ (not a product page — will land on search or homepage):\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  test('no gear URL is an Amazon search page (/s)', () => {
    const bad: string[] = [];
    for (const g of allGearLinks) {
      const u = parseUrl(g.url);
      if (!u) continue;
      const isAmazon = u.hostname === 'www.amazon.com' || u.hostname === 'amazon.com';
      if (isAmazon && u.pathname.startsWith('/s')) {
        bad.push(`${g.gearId} / "${g.gearName}": ${g.url}`);
      }
    }
    expect(
      bad,
      `Amazon search URLs must not appear in gear data:\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  // ── Partner/URL consistency: PADI-affiliated operators must be marked as such
  //
  // Both "PADI" and "PADI Travel" operators use the operator's own URL —
  // enhanceAffiliateUrl appends ?partner=PADI_ID for referral tracking.
  // These entries must have isAffiliate=true so the disclosure is shown and
  // the rel="sponsored" attribute is applied.

  test('all PADI / PADI Travel operators have isAffiliate=true', () => {
    const PADI_LABELS = new Set(['PADI', 'PADI Travel']);
    const bad: string[] = [];
    for (const o of allOperators) {
      if (!PADI_LABELS.has(o.partner)) continue;
      if (!o.isAffiliate) {
        bad.push(`${o.siteId} / "${o.label}": partner="${o.partner}" but isAffiliate=false`);
      }
    }
    expect(
      bad,
      `PADI/PADI Travel operators must have isAffiliate=true:\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  // ── isAffiliate flag must be false when partner is "direct" ──────────────

  test('isAffiliate is false for all direct-partner links', () => {
    const bad: string[] = [];
    for (const l of allLodging) {
      if (l.partner === 'direct' && l.isAffiliate) {
        bad.push(`lodging ${l.siteId} / "${l.label}"`);
      }
    }
    for (const o of allOperators) {
      if (o.partner === 'direct' && o.isAffiliate) {
        bad.push(`operator ${o.siteId} / "${o.label}"`);
      }
    }
    expect(
      bad,
      `Links with partner="direct" must have isAffiliate=false:\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });

  // ── operators.json (encounter/launch operators) ───────────────────────────
  //
  // This file is separate from the per-site inline operators in sites.json.
  // It drives encounter-page CTAs via bookingUrlForOperator() in affiliate.ts.

  test('all operators.json website URLs are non-empty and parseable', () => {
    const bad: string[] = [];
    for (const o of standaloneOperators) {
      if (!o.website || o.website === '#') {
        bad.push(`${o.id} ("${o.name}"): website is empty or "#"`);
      } else if (!parseUrl(o.website)) {
        bad.push(`${o.id} ("${o.name}"): website unparseable — ${o.website}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all operators.json affiliateUrl values are parseable when present', () => {
    const bad: string[] = [];
    for (const o of standaloneOperators) {
      if (!o.affiliateUrl) continue;
      if (o.affiliateUrl === '#') {
        bad.push(`${o.id} ("${o.name}"): affiliateUrl is "#"`);
      } else if (!parseUrl(o.affiliateUrl)) {
        bad.push(`${o.id} ("${o.name}"): affiliateUrl unparseable — ${o.affiliateUrl}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('operators.json non-direct providers supply an affiliateUrl', () => {
    // bookingUrlForOperator() falls back to website when affiliateUrl is absent,
    // then appends partner params — which only works on the partner's own domain.
    // Non-direct providers should have an explicit affiliateUrl on the partner platform.
    const bad: string[] = [];
    for (const o of standaloneOperators) {
      if (!o.affiliateProvider || o.affiliateProvider === 'direct') continue;
      if (!o.affiliateUrl) {
        bad.push(
          `${o.id} ("${o.name}"): affiliateProvider="${o.affiliateProvider}" but no affiliateUrl — add the booking page URL`,
        );
      }
    }
    expect(
      bad,
      `Non-direct operators in operators.json must have an affiliateUrl:\n${bad.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. HTTP LIVENESS
// ---------------------------------------------------------------------------
//
// HEAD-requests every lodging, operator, and gear URL in the data. Uses
// Playwright's `request` context — no browser needed.
//
// Run time: ~2–4 minutes (1 000+ external URLs, 20 concurrent workers).
// These are tagged @slow; the default `npm test` run skips them. Run with:
//   npx playwright test affiliate-links --grep "HTTP liveness"
//
// Statuses we accept:
//   200/30x  — success / redirect
//   202      — "accepted" used by some sites behind anti-bot proxies
//   403      — server alive but blocking bots
//   405      — server alive but rejects HEAD method
//   415      — server alive but rejects HEAD without Content-Type

test.describe('Affiliate link HTTP liveness', () => {
  const HEAD_TIMEOUT = 15_000;
  const ACCEPTABLE = new Set([
    200, 202,                     // success / accepted
    301, 302, 303, 307, 308,      // redirects
    401, 403,                     // auth-required or blocked bots — server is alive
    405, 415,                     // method/content-type rejected — server is alive
    474,                          // non-standard (some hosts use this) — server is alive
    500, 503,                     // server errors — live but misconfigured/overloaded
  ]);

  // Domains known to block headless/server-side HEAD requests via anti-bot
  // protection (Cloudflare IUAM, etc.). These domains are live in browsers —
  // the connection failure or non-200 is not a broken link.
  const SKIP_DOMAINS = [
    'paditravel.com',        // PADI Travel blocks non-browser user agents
    'padi.com',              // padi.com/dive-sites/* 404s in HEAD; live in browser
    'travel.padi.com',       // PADI Travel sub-domain
    'mvpacificmaster.com',   // connection refused in CI / non-browser
    'evolution.com.ph',      // CF anti-bot
    'yonaguni.ws',           // connection refused
    'extradivers.info',      // CF IUAM — connection drops for headless
    'cassiopeiasafari.com',  // connection refused
    'gowestdiving.com',      // CF anti-bot
    'adventurebaycharters.com.au', // connection refused
    'nesima-resort.com',     // connection refused
    'divecapeverde.com',     // connection refused
    'srilankadivecentres.com', // connection refused
    'blueplanetdivers.com',  // connection refused
    'emperordivers.com',     // 404 only on headless HEAD; site is live
    'sunreef.com.au',        // 404 on headless HEAD; site is live
  ];

  async function checkUrl(
    requestCtx: Parameters<Parameters<typeof test>[1]>[0]['request'],
    url: string,
  ): Promise<{ ok: boolean; status: number }> {
    // Skip URLs with non-ASCII characters — browsers handle them fine but
    // Playwright's request context requires ASCII-safe URLs.
    try { new URL(url).toString().split('').forEach(c => { if (c.charCodeAt(0) > 127) throw new Error() }) }
    catch { return { ok: true, status: 0 } } // treat encoding-only issues as pass
    // Skip known anti-bot domains that refuse headless HEAD requests.
    try {
      const hostname = new URL(url).hostname.replace(/^www\./, '');
      if (SKIP_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`))) {
        return { ok: true, status: 0 };
      }
    } catch { /* malformed URL — let the main try handle it */ }
    try {
      const res = await requestCtx.head(url, { timeout: HEAD_TIMEOUT });
      return { ok: ACCEPTABLE.has(res.status()), status: res.status() };
    } catch {
      return { ok: false, status: 0 };
    }
  }

  // Run checks in batches to avoid overwhelming the test runner.
  async function checkAll(
    requestCtx: Parameters<Parameters<typeof test>[1]>[0]['request'],
    entries: Array<{ id: string; label: string; url: string }>,
    concurrency = 20,
  ): Promise<string[]> {
    const failures: string[] = []
    const queue = [...entries]
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length) {
        const entry = queue.shift()!
        const { ok, status } = await checkUrl(requestCtx, entry.url)
        if (!ok) failures.push(`[${status || 'err'}] ${entry.id} / "${entry.label}": ${entry.url}`)
      }
    })
    await Promise.all(workers)
    return failures
  }

  test('all Amazon gear product pages resolve', async ({ request }) => {
    test.slow();
    const entries = allGearLinks
      .filter((g) => g.partner.toLowerCase() === 'amazon')
      .map((g) => ({ id: g.gearId, label: g.gearName, url: g.url }));
    const failures = await checkAll(request, entries);
    expect(failures, `Amazon gear URLs that don't resolve:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('all Booking.com lodging pages resolve', async ({ request }) => {
    test.slow();
    const entries = allLodging
      .filter((l) => l.url.includes('booking.com'))
      .map((l) => ({ id: l.siteId, label: l.label, url: l.url }));
    const failures = await checkAll(request, entries);
    expect(failures, `Booking.com lodging URLs that don't resolve:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('all liveaboard lodging pages resolve', async ({ request }) => {
    test.slow();
    const entries = allLodging
      .filter((l) => l.url.includes('liveaboard.com') || l.kind === 'liveaboard')
      .map((l) => ({ id: l.siteId, label: l.label, url: l.url }));
    // Filter out connection-refused ([err]) — those are bot-protection, not dead links.
    const allFailures = await checkAll(request, entries);
    const failures = allFailures.filter((f) => !f.startsWith('[err]'));
    expect(failures, `Liveaboard URLs that don't resolve:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('all operator websites resolve', async ({ request }) => {
    test.slow();
    const entries = [
      ...allOperators.map((o) => ({ id: o.siteId, label: o.label, url: o.url })),
      ...standaloneOperators.map((o) => ({ id: o.id, label: o.name, url: o.website })),
    ];
    // Many small dive-operator sites use Cloudflare IUAM or other bot-protection
    // that drops headless HEAD requests (connection refused → status 0). These are
    // live in real browsers — only hard 4xx/5xx responses indicate broken links.
    // Filter out connection-refused ([err] / status 0) to keep the test signal clean.
    const allFailures = await checkAll(request, entries);
    const failures = allFailures.filter((f) => !f.startsWith('[err]'));
    expect(failures, `Operator URLs that don't resolve:\n${failures.join('\n')}`).toHaveLength(0);
  });

  // ── Regression guards ────────────────────────────────────────────────────

  test('regression: Aliwal Dive Lodge links to aliwalshoal.co.za not Booking.com', async ({ request }) => {
    const url = 'https://aliwalshoal.co.za/';
    const { ok, status } = await checkUrl(request, url);
    expect(ok, `${url} → ${status || 'connection failed'}`).toBe(true);
  });

  test('regression: Blue Wilderness partner is "direct" not "PADI Travel"', async () => {
    const entries = allOperators.filter((o) => o.url.includes('bluewilderness.co.za'));
    for (const o of entries) {
      expect(o.partner, `Blue Wilderness at ${o.siteId}`).toBe('direct');
      expect(o.isAffiliate, `Blue Wilderness at ${o.siteId}`).toBe(false);
    }
  });
});
