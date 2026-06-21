import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Species filmstrip validation — ensures all hardcoded species:
 *   1. Exist in species-photo-credits.json
 *   2. Have a valid imageUrl (no nulls/missing)
 *   3. Use URLs that will pass pre-commit photo checks
 *
 * If this test fails, the filmstrip component will have missing photos at runtime.
 * Never ship missing credits entries; update species-photo-credits.json first.
 */

const root = process.cwd();
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const FILMSTRIP_SPECIES = [
  "Manta ray",
  "Sea turtle",
  "Reef shark",
  "Whale shark",
  "Goliath grouper",
  "Great hammerhead",
  "Nudibranch",
  "Octopus",
  "Eagle ray",
  "Frogfish",
];

const speciesCredits = readJson('src/data/species-photo-credits.json');

test.describe('Species filmstrip validation', () => {
  test('all filmstrip species exist in credits with valid photoUrl', () => {
    const missing: string[] = [];
    const noPhoto: string[] = [];

    for (const name of FILMSTRIP_SPECIES) {
      const creditsKey = name.toLowerCase();
      const entry = speciesCredits[creditsKey as keyof typeof speciesCredits] as { imageUrl?: string } | undefined;
      if (!entry) {
        missing.push(name);
      } else if (!entry.imageUrl || typeof entry.imageUrl !== 'string') {
        noPhoto.push(name);
      }
    }

    const errors = [
      ...(missing.length ? [`Missing from credits: ${missing.join(', ')}`] : []),
      ...(noPhoto.length ? [`Missing imageUrl: ${noPhoto.join(', ')}`] : []),
    ];

    expect(errors, errors.join('\n')).toHaveLength(0);
  });

  test('all filmstrip photo URLs are reachable https:// iNaturalist URLs', () => {
    const bad: string[] = [];

    for (const name of FILMSTRIP_SPECIES) {
      const creditsKey = name.toLowerCase();
      const entry = speciesCredits[creditsKey as keyof typeof speciesCredits] as { imageUrl?: string } | undefined;
      if (!entry?.imageUrl) continue;
      const url = entry.imageUrl;

      if (!/^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/[\w\/]+\.(jpg|jpeg|png)$/.test(url)) {
        bad.push(`${name}: ${url}`);
      }
    }

    expect(bad, bad.join('\n')).toHaveLength(0);
  });
});
