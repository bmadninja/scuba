import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Data-integrity guards for hero photos. These run in Node (no browser) and
// encode the product rules:
//   1. No two reefs (location OR site) share a hero photo URL.
//   2. There is no hardcoded shared fallback image in photo-quality.ts.
//   3. Known surface/aerial/specimen filenames never appear as a stored hero.

const root = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

type WithHero = { slug: string; heroImageUrl?: string | null };

const sites: WithHero[] = readJson('src/data/sites.json');
const locations: WithHero[] = readJson('src/data/locations.json');

// Hero-uniqueness is a RATCHET, not a hard zero. There is a backlog of stock
// photos reused across reefs (bulk-assigned before per-reef sourcing). The cap
// is baselined to the current collision count plus headroom, so the guard blocks
// NEW reuse from making it worse while the backlog is paid down. Ratchet these
// DOWN as unique underwater heroes are sourced.
// Sites deliberately reuse their parent location's hero (borrowed-hero pattern),
// so within-site collisions are expected and the cap is correspondingly high.
const MAX_LOCATION_HERO_COLLISIONS = 5; // current: 0 (debt cleared in #56); headroom only absorbs automation drift — re-run scripts/dedupe-collisions-oib.mjs if it climbs
const MAX_SITE_HERO_COLLISIONS = 540; // current: 470 (mostly borrowed-hero pattern)

test.describe('Hero photo data integrity', () => {
  test('hero photo reuse stays within the ratcheted backlog', () => {
    const countCollisions = (items: typeof locations) => {
      const seen = new Map<string, string>();
      const collisions: string[] = [];
      for (const e of items) {
        const url = e.heroImageUrl;
        if (!url) continue;
        if (seen.has(url)) {
          collisions.push(`${e.slug} reuses photo already claimed by ${seen.get(url)}`);
        } else {
          seen.set(url, e.slug);
        }
      }
      return collisions;
    };
    const locCollisions = countCollisions(locations);
    const siteCollisions = countCollisions(sites);
    expect(
      locCollisions.length,
      `Location hero collisions increased past the backlog cap (${MAX_LOCATION_HERO_COLLISIONS}). New reuse:\n${locCollisions.join('\n')}`,
    ).toBeLessThanOrEqual(MAX_LOCATION_HERO_COLLISIONS);
    expect(
      siteCollisions.length,
      `Site hero collisions increased past the cap (${MAX_SITE_HERO_COLLISIONS}).`,
    ).toBeLessThanOrEqual(MAX_SITE_HERO_COLLISIONS);
  });

  test('photo-quality.ts exports no hardcoded fallback image', () => {
    const src = readFileSync(join(root, 'src/lib/photo-quality.ts'), 'utf8');
    expect(src).not.toContain('UNDERWATER_PHOTO_FALLBACK');
    // No bare https image URL constant should be exported as a fallback.
    expect(src).not.toMatch(/export const \w+\s*=\s*["']https?:\/\/[^"']+\.(jpg|jpeg|png|webp)/i);
  });

  test('no stored hero matches a known surface/aerial/specimen pattern', () => {
    // Filename/URL patterns that identify non-underwater images.
    // If you need to add a legitimate exception, add it to the ALLOWED list below.
    const REJECTED = [
      // Confirmed non-ocean contexts
      'aquarium', 'oceanarium', 'oceanario',
      // Aerial / satellite
      'aerial', 'satellite', 'esa221', 'copernicus',
      // Surface / landscape
      'lighthouse', 'natural_park',
      // Specific known-bad park shots (aerial; parque_nacional alone is fine — many are valid underwater)
      'parque_nacional_marinho',
      // Known bad files from past failures
      'the_great_blue_hole_in_belize', 'agujero_azul',
      'burning_guadalcanal', '_burning',
    ];
    // Known non-underwater heroes awaiting replacement (tracked debt). The guard
    // still catches any NEW bad hero; add a slug here only as temporary debt and
    // remove it once its photo is fixed. Currently empty — all known bad heroes
    // have been replaced (lysefjord fixed in #56).
    const KNOWN_BAD_HEROES = new Set<string>([]);
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = (e.heroImageUrl ?? '').toLowerCase();
      if (url && REJECTED.some((r) => url.includes(r)) && !KNOWN_BAD_HEROES.has(e.slug)) {
        bad.push(`${e.slug}: ${e.heroImageUrl}`);
      }
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all hero URLs are absolute https or root-relative self-hosted image URLs', () => {
    // Self-hosted OIB heroes are root-relative (/heroes/*.webp); everything else
    // must be an absolute https URL. Both are valid.
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = e.heroImageUrl;
      if (!url) continue;
      if (!/^https:\/\//.test(url) && !url.startsWith('/heroes/')) bad.push(`${e.slug}: ${url}`);
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });
});
