#!/usr/bin/env node
/**
 * Backfill "cave" and "drift" diveTypes onto existing sites.
 *
 * Classification is deterministic — no API calls needed.
 *
 * Cave signals (any one sufficient):
 *   - name/description contains: cenote, cavern, swim-through, stalactite,
 *     underground, "swim through", "blue hole" + geological context
 *   - description contains: tunnel(s) used as a dive feature, chimney, shaft,
 *     sinkhole, grotto
 *   - name contains: cave, grotto, cenote
 *
 * Drift signals (any one sufficient):
 *   - description contains: drift, swept, "racing current", "ripping",
 *     "strong current", "channel" in a pelagic/pass context
 *   - 5+ months of "strong" currentStrength AND diveType includes large-pelagics
 *
 * Idempotent: only adds missing tags, never removes existing ones.
 *
 * Usage:
 *   node scripts/backfill-dive-types.mjs          # dry-run (prints plan)
 *   node scripts/backfill-dive-types.mjs --apply  # writes sites.json
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const APPLY = process.argv.includes("--apply");

// --- Cave detection ---

const CAVE_NAME_RE = /\b(cave|cenote|cavern|grotto|pit)\b/i;

const CAVE_DESC_RE =
  /cenote|cavern|swim[\s-]through|stalactite|stalagmite|underground\s+cave|sinkhole|limestone\s+(shaft|chimney)|lava\s+tube|\btunnel(s)?\b.*\b(dive|swim|penetrat)|\b(dive|swim|penetrat).*\btunnel(s)?\b|through\s+(arch|tunnel|chimney)|blue\s+hole.*sink|sink.*blue\s+hole/i;

function isCave(site) {
  if (site.diveTypes.includes("cave")) return false; // already tagged
  const hay = `${site.name} ${site.description}`;
  return CAVE_NAME_RE.test(site.name) || CAVE_DESC_RE.test(hay);
}

// --- Drift detection ---

const DRIFT_DESC_RE =
  /drift\s+(dive|diving|along|the\s+(reef|wall|channel|current|pass)|through\s+(the\s+)?(channel|pass|current|reef|wall))|swept\s+(along|through|by)\s+(the\s+)?(current|flow|tide)|racing\s+current|ripping\s+current|strong\s+(tidal\s+)?current|ferocious\s+current|\bpass\b.*strong.*current|strong.*current.*\bpass\b|pelagic\s+channel|high[\s-]voltage\s+current/i;

function strongCurrentMonths(site) {
  if (!site.conditionsByMonth) return 0;
  return site.conditionsByMonth.filter((m) => m.currentStrength === "strong").length;
}

function isDrift(site) {
  if (site.diveTypes.includes("drift")) return false; // already tagged
  if (DRIFT_DESC_RE.test(site.description)) return true;
  // Secondary signal: persistently strong current at a pelagic or geology site
  if (
    strongCurrentMonths(site) >= 5 &&
    (site.diveTypes.includes("large-pelagics") || site.diveTypes.includes("geology"))
  ) {
    return true;
  }
  return false;
}

// --- Main ---

async function main() {
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));

  const caveAdds = [];
  const driftAdds = [];

  const updated = sites.map((site) => {
    const addCave = isCave(site);
    const addDrift = isDrift(site);
    if (!addCave && !addDrift) return site;

    const newTypes = [...site.diveTypes];
    if (addCave) { newTypes.push("cave"); caveAdds.push(site.name); }
    if (addDrift) { newTypes.push("drift"); driftAdds.push(site.name); }
    return { ...site, diveTypes: newTypes };
  });

  console.log(`\nCave tag → ${caveAdds.length} sites:`);
  caveAdds.forEach((n) => console.log("  +cave  ", n));

  console.log(`\nDrift tag → ${driftAdds.length} sites:`);
  driftAdds.forEach((n) => console.log("  +drift ", n));

  console.log(`\nTotal sites modified: ${caveAdds.length + driftAdds.length - updated.filter((s, i) => isCave(sites[i]) && isDrift(sites[i])).length}`);

  if (!APPLY) {
    console.log("\nDry-run — pass --apply to write changes.");
    return;
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log("\nWrote updated sites.json.");
}

main().catch((err) => { console.error(err); process.exit(1); });
