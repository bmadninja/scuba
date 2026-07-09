import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Reachability check for a deterministic sample of hero and species photos.
// Catches 404s, domain rot, and CDN misconfigurations before they reach
// production. Runs in Node — no browser required.
//
// Two kinds of image URL live in the data:
//   - Absolute URLs (Wikimedia, Ocean Image Bank CDN, …) → live HTTP probe.
//   - Self-hosted relative paths ("/heroes/*.webp") → served by Next from
//     public/, so fetch() cannot resolve them (no base URL) and would throw.
//     For these the correct reachability check is that the file ships in the
//     repo under public/, so we verify it exists on disk.
//
// Sampling: sort URLs for determinism, then take every Nth to stay under ~50
// requests. Each HTTP request uses HEAD (fast); falls back to a GET range on 405.

const root = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const TIMEOUT_MS = 10_000;
const MAX_HERO = 30;
const MAX_SPECIES = 20;

const IMAGE_EXT_RE = /\.(webp|jpe?g|png|gif|avif|svg)$/i;

const HEADERS = {
  // Wikimedia requires a descriptive User-Agent or aggressively rate-limits.
  'User-Agent': 'scubaseason-ci/1.0 (https://scubaseason.fun; hello@scubaseason.fun) image-reachability-check',
};

async function probeUrl(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    let res = await fetch(url, { method: 'HEAD', headers: HEADERS, signal: ctrl.signal, redirect: 'follow' });
    if (res.status === 405) {
      // Server doesn't support HEAD — try GET with range to avoid downloading full image
      res = await fetch(url, {
        method: 'GET',
        headers: { ...HEADERS, Range: 'bytes=0-0' },
        signal: ctrl.signal,
        redirect: 'follow',
      });
    }
    return {
      // 429 = rate-limited: server knows the file exists, URL is not broken
      ok: res.ok || res.status === 206 || res.status === 429,
      status: res.status,
      contentType: res.headers.get('content-type') ?? '',
    };
  } finally {
    clearTimeout(timer);
  }
}

// Dispatch on URL kind: self-hosted relative paths are verified by presence in
// public/ (fetch cannot resolve them); everything else is probed over HTTP.
async function checkReachable(url: string): Promise<{ ok: boolean; status: number; contentType: string }> {
  if (url.startsWith('/')) {
    const onDisk = existsSync(join(root, 'public', url));
    return {
      ok: onDisk,
      status: onDisk ? 200 : 404,
      // Infer a content-type from the extension so the image/* assertion still
      // catches a non-image file wired up as a hero.
      contentType: onDisk && IMAGE_EXT_RE.test(url) ? `image/${url.split('.').pop()!.toLowerCase()}` : '',
    };
  }
  return probeUrl(url);
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
      const result = await checkReachable(url);
      expect(result.ok, `${slug} → HTTP ${result.status} for ${url}`).toBe(true);
      if (result.status !== 429) {
        expect(
          result.contentType,
          `${slug} returned non-image content-type "${result.contentType}" for ${url}`,
        ).toMatch(/^image\//);
      }
    });
  }
});

test.describe('Image reachability — species photos', () => {
  for (const { name, url } of speciesSample) {
    test(`${name}`, async () => {
      const result = await checkReachable(url);
      expect(result.ok, `${name} → HTTP ${result.status} for ${url}`).toBe(true);
      if (result.status !== 429) {
        expect(
          result.contentType,
          `${name} returned non-image content-type "${result.contentType}" for ${url}`,
        ).toMatch(/^image\//);
      }
    });
  }
});
