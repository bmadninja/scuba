#!/usr/bin/env node
/**
 * Annotate every site's lodging entries with a priceLevel (1–4) inferred from
 * the property name, and clean operator labels so they read as dive operators
 * (not resorts).
 *
 * We do NOT auto-fill "generic search" tier entries — those aren't useful to a
 * traveler. Range coverage will be added by hand-curating named properties.
 *
 * Run: node scripts/enrich-lodging-tiers.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const sitesPath = new URL("../src/data/sites.json", import.meta.url);
const sites = JSON.parse(readFileSync(sitesPath, "utf8"));

function inferPriceLevel(label) {
  const s = label.toLowerCase();
  if (/aggressor|mermaid|damai|nautilus|conscious breath|liveaboard/.test(s)) return 4;
  if (/constance|plataran|halaveli|four seasons|aman|six senses/.test(s)) return 4;
  if (/resort|lodge|key resort|paradise|lalati|havaiki|buddy dive|quo vadis|walindi/.test(s)) return 3;
  if (/hotel|hotels|collection/.test(s)) return 3;
  if (/guesthouse|guesthouses|hostel|apartments|inn/.test(s)) return 2;
  if (/budget|backpacker/.test(s)) return 1;
  return 3;
}

function stripOperatorParenthetical(label) {
  // "Papua Diving (Kri Eco Resort)" → "Papua Diving"
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

let lodgingTouched = 0;
let operatorsTouched = 0;
for (const site of sites) {
  // Drop any prior generic Booking.com tier fillers from earlier runs.
  const cleanedLodging = (site.lodging || []).filter(
    (l) =>
      !/^(Budget|Mid-range|Upscale|Luxury) stays in /.test(l.label || ""),
  );

  site.lodging = cleanedLodging.map((l) => ({
    ...l,
    priceLevel: l.priceLevel ?? inferPriceLevel(l.label),
  }));
  lodgingTouched++;

  site.operators = (site.operators || []).map((l) => {
    const newLabel = stripOperatorParenthetical(l.label);
    if (newLabel !== l.label) operatorsTouched++;
    return { ...l, label: newLabel };
  });
}

writeFileSync(sitesPath, JSON.stringify(sites, null, 2) + "\n");
console.log(
  `lodging touched: ${lodgingTouched} sites; operator labels cleaned: ${operatorsTouched}`,
);
