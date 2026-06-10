import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Live HTTP reachability check for a deterministic sample of hero and species
// photos. Catches 404s, domain rot, and CDN misconfigurations before they
// reach production. Runs in Node — no browser required.
//
// Sampling: sort URLs for determinism, then take every Nth to stay under ~50
// total requests. Each request uses HEAD (fast, no body transfer); falls back
// to a GET range if the server returns 405.

const root = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const TIMEOUT_MS = 10_000;
const MAX_HERO = 30;
const MAX_SPECIES = 20;

async function probeUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' });
    if (res.status === 405) {
      // Server doesn't support HEAD — try GET with range to avoid downloading full image
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: ctrl.signal,
        redirect: 'follow',
      });
    }
    return {
      ok: res.ok || res.status === 206,
      status: res.status,
      contentType: res.headers.get('content-type') ?? '',
    };
  } finally {
    clearTimeout(timer);
  }
}

function sample<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const stride = Math.floor(items.length / max);
  return items.filter((_, i) => i % stride === 0).slice(0, max);
}

type WithHero = { slug: string; heroImageUrl?: string | null };

const sites: WithHero[] = readJson('src/data/sites.json');
const locs: WithHero[] = readJson('src/data/locations.json');

const heroUrls: Array<{ slug: string; url: string }> = [...locs, ...sites]
  .filter((e): e is WithHero & { heroImageUrl: string } => typeof e.heroImageUrl === 'string')
  .sort((a, b) => a.slug.localeCompare(b.slug))
  .map(e => ({ slug: e.slug, url: e.heroImageUrl }));

const speciesCredits: Record<string, { imageUrl?: string }> = readJson('src/data/species-photo-credits.json');
const speciesUrls: Array<{ name: string; url: string }> = Object.entries(speciesCredits)
  .filter((e): e is [string, { imageUrl: string }] => typeof e[1].imageUrl === 'string')
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, v]) => ({ name, url: v.imageUrl }));

const heroSample = sample(heroUrls, MAX_HERO);
const speciesSample = sample(speciesUrls, MAX_SPECIES);

test.describe('Image reachability — hero photos', () => {
  for (const { slug, url } of heroSample) {
    test(`${slug}`, async () => {
      const result = await probeUrl(url);
      expect(result.ok, `${slug} → HTTP ${result.status} for ${url}`).toBe(true);
      expect(
        result.contentType,
        `${slug} returned non-image content-type "${result.contentType}" for ${url}`,
      ).toMatch(/^image\//);
    });
  }
});

test.describe('Image reachability — species photos', () => {
  for (const { name, url } of speciesSample) {
    test(`${name}`, async () => {
      const result = await probeUrl(url);
      expect(result.ok, `${name} → HTTP ${result.status} for ${url}`).toBe(true);
      expect(
        result.contentType,
        `${name} returned non-image content-type "${result.contentType}" for ${url}`,
      ).toMatch(/^image\//);
    });
  }
});
