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
  test('every hero URL is globally unique across locations and sites', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = e.heroImageUrl;
      if (!url) continue;
      if (seen.has(url)) {
        collisions.push(`${e.slug} reuses photo already claimed by ${seen.get(url)}`);
      } else {
        seen.set(url, e.slug);
      }
    }
    expect(collisions, collisions.join('\n')).toHaveLength(0);
  });

  test('photo-quality.ts exports no hardcoded fallback image', () => {
    const src = readFileSync(join(root, 'src/lib/photo-quality.ts'), 'utf8');
    expect(src).not.toContain('UNDERWATER_PHOTO_FALLBACK');
    // No bare https image URL constant should be exported as a fallback.
    expect(src).not.toMatch(/export const \w+\s*=\s*["']https?:\/\/[^"']+\.(jpg|jpeg|png|webp)/i);
  });

  test('no stored hero matches a known surface/aerial/specimen pattern', () => {
    const REJECTED = [
      'copernicus', 'the_great_blue_hole_in_belize', 'agujero_azul',
      'burning_guadalcanal', '_burning', 'aerial', 'satellite', 'lighthouse',
    ];
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = (e.heroImageUrl ?? '').toLowerCase();
      if (url && REJECTED.some((r) => url.includes(r))) bad.push(`${e.slug}: ${e.heroImageUrl}`);
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });

  test('all hero URLs are absolute https image URLs', () => {
    const bad: string[] = [];
    for (const e of [...locations, ...sites]) {
      const url = e.heroImageUrl;
      if (!url) continue;
      if (!/^https:\/\//.test(url)) bad.push(`${e.slug}: ${url}`);
    }
    expect(bad, bad.join('\n')).toHaveLength(0);
  });
});
