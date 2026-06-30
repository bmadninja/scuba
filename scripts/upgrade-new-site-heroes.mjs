#!/usr/bin/env node
/**
 * Upgrade hero photos for the 16 sites added via free-API enrichment.
 * Those sites inherited their location's placeholder hero — this script
 * finds site-specific underwater Pexels photos for each one.
 *
 * Env:
 *   PEXELS_API_KEY   required
 *   DRY_RUN=1        log matches but don't write
 *
 * Usage:
 *   PEXELS_API_KEY=xxx node scripts/upgrade-new-site-heroes.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { pexelsSearch } from "./lib/photo-sources.mjs";
import { loadRegistry, isUsed, markUsed, saveRegistry } from "./lib/photo-registry.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");

const DRY_RUN = process.env.DRY_RUN === "1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tryPexels(queries) {
  for (const q of queries) {
    const results = await pexelsSearch(q, { perPage: 8 });
    await sleep(300);
    const pick = results.find((r) => r.srcWidth >= 1600 && !isUsed(r.url));
    if (pick) return { ...pick, query: q };
  }
  return null;
}

// Keywords that indicate a terrestrial (non-marine) species — skip these in queries
const TERRESTRIAL_RE = /lizard|gecko|iguana|anole|snake|frog|toad|slug|snail|insect|beetle|butterfly|moth|bird|bat|monkey|rat|mouse|deer|otter|seal(?!\s+shark)|sea\s+lion|penguin|albatross|booby|frigate|pelican|heron|egret|cormorant|crab(?!\s*:)|cray(?:fish)?|shrimp(?!\s*:)/i;
// Only use a species name in a Pexels query if it looks marine
function isMarineSpecies(name) {
  if (!name) return false;
  if (TERRESTRIAL_RE.test(name)) return false;
  return /shark|ray|turtle|whale|dolphin|reef|fish|eel|octopus|squid|jellyfish|sea\s|coral|nudibranch|cuttlefish|barracuda|trevally|grouper|snapper|wrasse|angelfish|butterflyfish|lionfish|moray|manta|tuna|mackerel|sardine|anchovy|clownfish|anemone|sea\s+star|starfish|urchin|sea\s+cucumber|crab|lobster|crayfish|shrimp|prawn|oyster|clam|mussel|scallop|worm|sea\s+slug|seahorse|pipefish|scorpion|frogfish|blenny|goby|damsel|parrotfish|surgeonfish|tang|trigger|puffer|boxfish|trumpet|flutemouth|needlefish|flyingfish|remora|cleaner|hawkfish|cardinalfish|basslet|anthias|chromis|dascyllus|humbug|bannerfish|moorish|batfish|sweetlip|emperor|bream|mullet|milkfish/i.test(name);
}

function buildQueries(site, locName) {
  const marineSpecies = (site.species || [])
    .map((s) => s.commonName)
    .filter(isMarineSpecies)
    .slice(0, 2);

  const typeQueries = [];
  if (site.diveTypes?.includes("wrecks")) typeQueries.push("shipwreck underwater coral fish");
  if (site.diveTypes?.includes("cave")) typeQueries.push("underwater cave diving blue");
  if (site.diveTypes?.includes("large-pelagics")) typeQueries.push("shark ocean underwater diving");
  if (site.diveTypes?.includes("drift")) typeQueries.push("drift diving reef fish underwater");
  if (site.diveTypes?.includes("macro")) typeQueries.push("nudibranch macro underwater reef");
  if (site.diveTypes?.includes("coral")) typeQueries.push("coral reef fish underwater");

  return [
    marineSpecies[0] ? `${marineSpecies[0]} underwater reef` : null,
    marineSpecies[1] ? `${marineSpecies[1]} underwater ocean` : null,
    ...typeQueries,
    locName ? `${locName} reef diving underwater` : null,
    "scuba diving reef fish underwater",
    "coral reef tropical fish underwater",
  ].filter(Boolean);
}

async function main() {
  if (!process.env.PEXELS_API_KEY) { console.error("PEXELS_API_KEY required"); process.exit(1); }

  await loadRegistry();
  const sites = JSON.parse(readFileSync(SITES_PATH, "utf8"));
  const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));
  const locById = new Map(locations.map((l) => [l.id, l]));

  const targets = sites.filter((s) => (s.notes || "").startsWith("Added via free-API"));
  console.log(`Targeting ${targets.length} free-API sites for hero upgrade`);

  let hits = 0;
  for (const site of targets) {
    const loc = locById.get(site.locationId);
    console.log(`\n→ ${site.name} (${site.locationId})`);
    const queries = buildQueries(site, loc?.name);
    const photo = await tryPexels(queries);
    if (photo) {
      console.log(`  ✓ ${photo.query} → ${photo.url.slice(0, 70)}...`);
      if (!DRY_RUN) {
        site.heroImageUrl = photo.url;
        markUsed(photo.url);
        hits++;
      } else {
        console.log(`  [DRY_RUN] would set hero`);
        hits++;
      }
    } else {
      console.log(`  ✗ no match found`);
    }
    await sleep(200);
  }

  if (!DRY_RUN && hits > 0) {
    writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
    await saveRegistry();
    const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
    execSync(`git add src/data/sites.json`, { stdio: "inherit" });
    execSync(`${GIT} commit -m "photos: upgrade heroes for ${hits} free-API sites (Pexels)"`, { stdio: "inherit" });
    console.log(`\nDone. Upgraded ${hits}/${targets.length} site heroes and committed.`);
  } else {
    console.log(`\nDone. ${hits} would be upgraded.`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
