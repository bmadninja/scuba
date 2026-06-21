#!/usr/bin/env node
/**
 * Species filmstrip validator — ensures all hardcoded filmstrip species
 * exist in species-photo-credits.json with valid, reachable photo URLs.
 *
 * Run manually:
 *   node scripts/validate-species-filmstrip.mjs
 *
 * Exits 1 if any species is missing or has no photo — blocks deployment.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const CREDITS_PATH = path.join(ROOT, 'src/data/species-photo-credits.json');

const FILMSTRIP_SPECIES = [
  'Manta ray',
  'Sea turtle',
  'Reef shark',
  'Whale shark',
  'Goliath grouper',
  'Great hammerhead',
  'Nudibranch',
  'Octopus',
  'Eagle ray',
  'Frogfish',
];

const creditsJson = JSON.parse(await fs.readFile(CREDITS_PATH, 'utf8'));

const errors = [];

for (const name of FILMSTRIP_SPECIES) {
  const creditsKey = name.toLowerCase();
  const entry = creditsJson[creditsKey];

  if (!entry) {
    errors.push(`❌ "${name}" (key: "${creditsKey}") missing from species-photo-credits.json`);
    continue;
  }

  if (!entry.imageUrl || typeof entry.imageUrl !== 'string') {
    errors.push(`❌ "${name}" has no imageUrl in species-photo-credits.json`);
    continue;
  }

  // Validate URL format (allow both iNaturalist and static inaturalist URLs, both jpg and png)
  if (!/^https:\/\/(inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/[\w\/]+\.(jpg|jpeg|png)$/.test(entry.imageUrl)) {
    errors.push(`❌ "${name}" has invalid photo URL: ${entry.imageUrl}`);
    continue;
  }

  console.log(`✓ "${name}"`);
}

if (errors.length > 0) {
  console.error('\n' + errors.join('\n'));
  console.error('\nFix by adding/updating entries in src/data/species-photo-credits.json');
  process.exit(1);
}

console.log(`\n✅ All ${FILMSTRIP_SPECIES.length} species valid`);
