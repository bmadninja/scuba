#!/usr/bin/env node
/**
 * Prints the highest-priority dive-site gaps for the discovery routine to fill.
 * Empty locations (0 sites) first, then thin ones (< MIN_SITES). Prints a JSON
 * array of target locations, or an empty array when the catalog is caught up.
 *
 * Usage:  node scripts/find-site-gaps.mjs [limit]     (default limit 3)
 *   env MIN_SITES  = thin-location threshold (default 3)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const sites = JSON.parse(readFileSync(resolve(ROOT, "src/data/sites.json"), "utf8"));
const locations = JSON.parse(readFileSync(resolve(ROOT, "src/data/locations.json"), "utf8"));

const LIMIT = Number(process.argv[2] ?? "3");
const MIN_SITES = Number(process.env.MIN_SITES ?? "3");

const countFor = (id) => sites.filter((s) => s.locationId === id).length;
const shape = (l) => ({ id: l.id, name: l.name, country: l.country, lat: l.lat, lng: l.lng, siteCount: countFor(l.id) });

const empty = locations.filter((l) => countFor(l.id) === 0).map(shape);
const thin = locations
  .filter((l) => { const n = countFor(l.id); return n > 0 && n < MIN_SITES; })
  .map(shape)
  .sort((a, b) => a.siteCount - b.siteCount);

const targets = [...empty, ...thin].slice(0, LIMIT);
console.log(JSON.stringify(targets, null, 2));
