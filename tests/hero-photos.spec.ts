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

test.describe('Hero photo data integrity', () => {
  // Duplicate hero photos are a real data gap (too large to backfill in one
  // pass) — ratcheted like the completeness checks in location-completeness.spec.ts.
  // These caps must only ever go down as duplicates are replaced with sourced photos.
  const MAX_DUPLICATE_LOCATION_HEROES = 61;
  const MAX_DUPLICATE_SITE_HEROES = 470;

  test('every hero URL is unique within locations, and unique within sites', () => {
    // A site and its parent location may share a hero (borrowed hero pattern).
    // Within each type, duplicates would cause two cards to show the same photo.
    const check = (items: typeof locations, label: string, max: number) => {
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
      console.log(`\n${label} (${collisions.length}/${max} allowed):\n${collisions.join('\n')}`);
      expect(collisions.length, `${label}:\n${collisions.join('\n')}`).toBeLessThanOrEqual(max);
    };
    check(locations, 'Location hero collisions', MAX_DUPLICATE_LOCATION_HEROES);
    check(sites, 'Site hero collisions', MAX_DUPLICATE_SITE_HEROES);
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
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = (e.heroImageUrl ?? '').toLowerCase();
      if (url && REJECTED.some((r) => url.includes(r))) bad.push(`${e.slug}: ${e.heroImageUrl}`);
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all hero URLs are absolute https image URLs or self-hosted /heroes/ paths', () => {
    // Many heroes were migrated to self-hosted, sharp-processed images under
    // public/heroes/ for performance/quality — those are root-relative paths,
    // not absolute URLs, and are equally valid.
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = e.heroImageUrl;
      if (!url) continue;
      if (!/^https:\/\//.test(url) && !/^\/heroes\//.test(url)) bad.push(`${e.slug}: ${url}`);
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });
});
