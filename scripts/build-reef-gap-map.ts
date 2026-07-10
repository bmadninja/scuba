/**
 * Build the internal reef coverage / gap map (R6) → src/data/reef-gap-map.json.
 *
 * One row per location: per-pillar confidence tier + the site badge, computed
 * from the same modules that build the public label so it can never drift.
 * This is a GTM asset (outreach lists like "Blue Parks with no fish-biomass
 * trend"), not consumed by the app UI.
 *
 * Run:  npx tsx scripts/build-reef-gap-map.ts
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildReefGapMap, gapMapSummary } from "../src/lib/data/reef-gap-map";

const rows = buildReefGapMap();
const summary = gapMapSummary(rows);

const out = {
  lastBuiltAt: new Date().toISOString(),
  note: "Internal coverage/gap map. Site × pillar × confidence tier + site badge. GTM outreach asset — not a public UI surface. Regenerate with `npx tsx scripts/build-reef-gap-map.ts`.",
  summary,
  rows,
};

const here = dirname(fileURLToPath(import.meta.url));
const dest = join(here, "..", "src", "data", "reef-gap-map.json");
writeFileSync(dest, JSON.stringify(out, null, 2) + "\n");

console.log(`reef-gap-map.json written: ${rows.length} locations`);
console.log("badge distribution:", JSON.stringify(summary.byBadge));
console.log("pillar coverage:", JSON.stringify(summary.byPillar, null, 2));
