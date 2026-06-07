/**
 * Shared hero URL registry — enforces global uniqueness across site, location,
 * and encounter heroes so the same image never appears as a hero in two places.
 *
 * Registry file: src/data/used-hero-urls.json
 * Format: { "<url>": "<slug-that-claimed-it>" }
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
export const REGISTRY_PATH = path.join(ROOT, "src/data/used-hero-urls.json");

let registry = null;

export async function loadRegistry() {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf8");
    registry = JSON.parse(raw);
  } catch {
    registry = {};
  }
  return registry;
}

export function isUsed(url) {
  if (!registry) throw new Error("Registry not loaded — call loadRegistry() first");
  return Boolean(url && url in registry);
}

export function markUsed(url, claimedBy) {
  if (!registry) throw new Error("Registry not loaded — call loadRegistry() first");
  if (url) registry[url] = claimedBy;
}

export async function saveRegistry() {
  if (!registry) return;
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
}
