#!/usr/bin/env node
/**
 * Affiliate link integrity verifier.
 *
 * Offline checks (always run — also used by CI):
 *   - No lodging URL is a search results page
 *   - Booking.com entries have isAffiliate=true
 *   - DiveBooker entries have isAffiliate=true and partner="DiveBooker"
 *   - Gear Amazon URLs have a /dp/ ASIN path (not a search URL)
 *
 * Online checks (run with --live):
 *   - HTTP HEAD each URL and report non-200 responses
 *
 * Exit code 1 if any offline check fails (so CI fails the build).
 *
 * Run: node scripts/verify-affiliate-links.mjs [--live]
 */
import { readFileSync } from "node:fs";

const LIVE = process.argv.includes("--live");

const sites = JSON.parse(
  readFileSync(new URL("../src/data/sites.json", import.meta.url), "utf8"),
);
const gear = JSON.parse(
  readFileSync(new URL("../src/data/gear.json", import.meta.url), "utf8"),
);

const BOOKING_SEARCH_RE = /booking\.com\/searchresults/;
const LIVEABOARD_SEARCH_RE = /liveaboard\.com\/diving\/search/;
const BOOKING_PROPERTY_RE = /booking\.com\/hotel\//;
const DIVEBOOKER_RE = /divebooker\.com\//;
const AMAZON_DP_RE = /amazon\.com\/dp\//;
const AMAZON_SEARCH_RE = /amazon\.com\/s\?/;

let failures = 0;
let warnings = 0;

function fail(msg) {
  console.error(`  FAIL  ${msg}`);
  failures++;
}

function warn(msg) {
  console.warn(`  WARN  ${msg}`);
  warnings++;
}

function pass(msg) {
  if (process.env.VERBOSE) console.log(`  pass  ${msg}`);
}

// ─── Hotels ──────────────────────────────────────────────────────────────────

console.log("\n=== Hotels (Booking.com) ===");
for (const site of sites) {
  for (const lodging of site.lodging ?? []) {
    if (lodging.kind !== "hotel" && lodging.kind !== "resort") continue;
    const ctx = `[${site.slug}] ${lodging.label}`;

    if (BOOKING_SEARCH_RE.test(lodging.url)) {
      fail(`${ctx} — still a search URL: ${lodging.url}`);
      continue;
    }
    if (!BOOKING_PROPERTY_RE.test(lodging.url)) {
      warn(`${ctx} — not a Booking.com property URL: ${lodging.url}`);
      continue;
    }
    if (!lodging.isAffiliate) {
      fail(`${ctx} — Booking.com URL but isAffiliate=false`);
      continue;
    }
    pass(ctx);
  }
}

// ─── Liveaboards ─────────────────────────────────────────────────────────────

console.log("\n=== Liveaboards ===");
for (const site of sites) {
  for (const lodging of site.lodging ?? []) {
    if (lodging.kind !== "liveaboard") continue;
    const ctx = `[${site.slug}] ${lodging.label}`;

    if (LIVEABOARD_SEARCH_RE.test(lodging.url)) {
      fail(`${ctx} — still a liveaboard.com search URL`);
      continue;
    }
    if (BOOKING_SEARCH_RE.test(lodging.url)) {
      fail(`${ctx} — still a Booking.com search URL`);
      continue;
    }

    if (lodging.partner === "DiveBooker") {
      if (!DIVEBOOKER_RE.test(lodging.url)) {
        fail(`${ctx} — partner=DiveBooker but URL not on divebooker.com: ${lodging.url}`);
        continue;
      }
      if (!lodging.isAffiliate) {
        fail(`${ctx} — DiveBooker URL but isAffiliate=false`);
        continue;
      }
      pass(ctx);
    } else if (lodging.partner === "direct") {
      if (!lodging.url || lodging.url === "#") {
        fail(`${ctx} — direct partner but URL is empty or '#'`);
        continue;
      }
      if (lodging.isAffiliate) {
        warn(`${ctx} — direct partner but isAffiliate=true`);
      }
      pass(ctx);
    } else {
      warn(`${ctx} — unexpected partner '${lodging.partner}' for liveaboard`);
    }
  }
}

// ─── Gear (Amazon) ───────────────────────────────────────────────────────────

console.log("\n=== Gear (Amazon) ===");
for (const item of gear) {
  for (const p of item.partners ?? []) {
    if (p.partner !== "amazon") continue;
    const ctx = `[gear] ${item.name}`;

    if (AMAZON_SEARCH_RE.test(p.url)) {
      // Search URLs are intentional for items without a specific ASIN
      warn(`${ctx} — Amazon search URL (no ASIN): ${p.url}`);
      continue;
    }
    if (!AMAZON_DP_RE.test(p.url)) {
      fail(`${ctx} — Amazon URL not a /dp/ product page: ${p.url}`);
      continue;
    }
    pass(ctx);
  }
}

// ─── Live HTTP checks ─────────────────────────────────────────────────────────

if (LIVE) {
  console.log("\n=== Live HTTP checks ===");
  const urls = new Map();

  for (const site of sites) {
    for (const l of site.lodging ?? []) {
      if (l.url && l.url !== "#") {
        if (!urls.has(l.url)) urls.set(l.url, []);
        urls.get(l.url).push(`[${site.slug}] ${l.label}`);
      }
    }
  }
  for (const item of gear) {
    for (const p of item.partners ?? []) {
      if (p.url) {
        if (!urls.has(p.url)) urls.set(p.url, []);
        urls.get(p.url).push(`[gear] ${item.name}`);
      }
    }
  }

  let checked = 0;
  for (const [url, labels] of urls) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: { "User-Agent": "scubaseason-affiliate-checker/1.0" },
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 404) {
        fail(`HTTP 404: ${url}\n    ${labels[0]}`);
      } else if (res.status >= 400) {
        warn(`HTTP ${res.status}: ${url}\n    ${labels[0]}`);
      } else {
        pass(`${res.status} ${url}`);
      }
    } catch (e) {
      warn(`Fetch error for ${url}: ${e.message}`);
    }
    checked++;
    if (checked % 50 === 0) process.stderr.write(`  …checked ${checked}/${urls.size}\n`);
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n─────────────────────────────────────────");
if (failures === 0 && warnings === 0) {
  console.log("✓ All checks passed");
} else {
  if (warnings > 0) console.warn(`⚠ ${warnings} warning(s)`);
  if (failures > 0) console.error(`✗ ${failures} failure(s)`);
}
process.exit(failures > 0 ? 1 : 0);
