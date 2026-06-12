#!/usr/bin/env node
/**
 * Enrichment pass for sites.json — adds wall/night/muck diveTypes and
 * derives photography metadata from existing structured data.
 *
 * Classification is deterministic — no API calls.
 *
 * Wall signals (any one):
 *   - site name contains standalone "wall"
 *   - description contains explicit wall-dive phrases
 *
 * Night signals (any one):
 *   - description contains "night dive" / "night diving" / "nocturnal"
 *   - site name contains "night"
 *
 * Muck signals (any one):
 *   - description contains "muck" (dive/diving/site)
 *   - known muck site name matches
 *
 * Photography — derived from existing data, no editorial content:
 *   - lensType: macro / wide-angle / both, inferred from species + diveTypes
 *   - visibility: excellent / good / variable, from conditionsByMonth avg over bestMonths
 *   - highlights: up to 3 tags from species + diveType combos
 *
 * Idempotent: re-running produces identical output.
 *
 * Usage:
 *   node scripts/enrich-sites.mjs           # dry-run
 *   node scripts/enrich-sites.mjs --apply   # writes sites.json
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const APPLY = process.argv.includes("--apply");

// ─── Wall ──────────────────────────────────────────────────────────────────────

const WALL_NAME_RE = /\bwall\b/i;
const WALL_DESC_RE =
  /wall\s+dive|wall\s+diving|dive\s+the\s+wall|along\s+the\s+wall|sheer\s+(wall|drop|cliff)|vertical\s+(wall|drop|cliff|face)|drop[\s-]?off\s+(wall|plunges|descends|falls)|the\s+wall\s+(drops|plunges|descends|falls|slopes)/i;

function isWall(site) {
  if (site.diveTypes.includes("wall")) return false;
  return WALL_NAME_RE.test(site.name) || WALL_DESC_RE.test(site.description ?? "");
}

// ─── Night ────────────────────────────────────────────────────────────────────

const NIGHT_NAME_RE = /\bnight\b/i;
const NIGHT_DESC_RE = /night\s+(dive|diving|dives)|nocturnal\s+(hunt|feed|creat|behav|activ)/i;

function isNight(site) {
  if (site.diveTypes.includes("night")) return false;
  return NIGHT_NAME_RE.test(site.name) || NIGHT_DESC_RE.test(site.description ?? "");
}

// ─── Muck ─────────────────────────────────────────────────────────────────────

const MUCK_DESC_RE = /muck\s+(dive|diving|site|diving\s+paradise)|black[\s-]sand\s+(slope|bottom|muck)/i;
const MUCK_KNOWN_NAMES = /\b(lembeh|hairball|dauin|anilao|dinah|secret\s+bay|padangbai|mabul|kapalai|seraya)\b/i;

function isMuck(site) {
  if (site.diveTypes.includes("muck")) return false;
  return MUCK_DESC_RE.test(site.description ?? "") || MUCK_KNOWN_NAMES.test(site.name ?? "");
}

// ─── Photography ──────────────────────────────────────────────────────────────

const MACRO_SPECIES_RE =
  /nudibranch|frogfish|seahorse|pipefish|seadragon|mantis\s+shrimp|ghost\s+pipefish|pygmy\s+seahorse|ribbon\s+eel|blue[\s-]ringed\s+octopus|mimic\s+octopus|harlequin\s+shrimp|comet\s+fish|dragonet|scorpionfish|crocodilefish|robust\s+ghost/i;

const WIDE_ANGLE_SPECIES_RE =
  /whale\s+shark|manta|humpback|sperm\s+whale|hammerhead|orca|sailfish|marlin|thresher\s+shark|oceanic\s+(whitetip|manta|blacktip)|giant\s+manta|reef\s+manta|mobula/i;

function deriveLensType(site) {
  const speciesText = (site.species ?? []).map((s) => s.commonName).join(" ");
  const hasMacroSpecies = MACRO_SPECIES_RE.test(speciesText);
  const hasWideSpecies = WIDE_ANGLE_SPECIES_RE.test(speciesText);
  const hasMacroDiveType = site.diveTypes.some((t) => t === "macro" || t === "muck" || t === "blackwater");
  const hasWideDiveType = site.diveTypes.some((t) => t === "large-pelagics");

  const macro = hasMacroSpecies || hasMacroDiveType;
  const wide = hasWideSpecies || hasWideDiveType;

  if (macro && wide) return "both";
  if (macro) return "macro";
  if (wide) return "wide-angle";
  // Default: coral reefs are typically wide-angle; geology is wide-angle; wrecks both
  if (site.diveTypes.includes("wrecks")) return "both";
  return "wide-angle";
}

function deriveVisibility(site) {
  const best = new Set(site.bestMonths ?? []);
  const months = (site.conditionsByMonth ?? []).filter((m) => best.has(m.month));
  const relevant = months.length > 0 ? months : (site.conditionsByMonth ?? []);
  if (relevant.length === 0) return "good";

  const avgMin =
    relevant.reduce((sum, m) => sum + (m.visibilityM?.min ?? 10), 0) / relevant.length;

  if (avgMin >= 20) return "excellent";
  if (avgMin >= 10) return "good";
  return "variable";
}

function deriveHighlights(site) {
  const speciesText = (site.species ?? []).map((s) => s.commonName.toLowerCase()).join(" ");
  const types = site.diveTypes ?? [];
  const tags = [];

  if (/whale\s+shark/.test(speciesText)) tags.push("whale shark encounters");
  if (/manta|giant manta|reef manta|oceanic manta/.test(speciesText)) tags.push("manta ray passes");
  if (/hammerhead/.test(speciesText)) tags.push("hammerhead schools");
  if (/nudibranch/.test(speciesText)) tags.push("nudibranch portraits");
  if (/frogfish/.test(speciesText)) tags.push("frogfish close-ups");
  if (/seahorse|pygmy seahorse/.test(speciesText)) tags.push("seahorse macros");
  if (/ghost pipefish/.test(speciesText)) tags.push("ghost pipefish hunting");
  if (/turtle/.test(speciesText) && tags.length < 3) tags.push("sea turtle portraits");
  if (types.includes("blackwater")) tags.push("blackwater drift");
  if (types.includes("wrecks") && tags.length < 3) tags.push("wreck exploration");
  if (types.includes("cave") && tags.length < 3) tags.push("cavern silhouettes");
  if (types.includes("drift") && tags.length < 3) tags.push("drift pelagics");
  if (types.includes("geology") && tags.length < 3) tags.push("volcanic scenics");

  return tags.slice(0, 3);
}

function derivePhotography(site) {
  return {
    lensType: deriveLensType(site),
    visibility: deriveVisibility(site),
    highlights: deriveHighlights(site),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));

  const wallAdds = [];
  const nightAdds = [];
  const muckAdds = [];
  let photoAdds = 0;

  const updated = sites.map((site) => {
    let s = { ...site };
    const newTypes = [...s.diveTypes];

    if (isWall(s)) { newTypes.push("wall"); wallAdds.push(s.name); }
    if (isNight(s)) { newTypes.push("night"); nightAdds.push(s.name); }
    if (isMuck(s)) { newTypes.push("muck"); muckAdds.push(s.name); }

    if (newTypes.length !== s.diveTypes.length) s = { ...s, diveTypes: newTypes };

    // Always (re-)derive photography — idempotent since it's deterministic
    const photography = derivePhotography(s);
    const existingPhoto = s.photography;
    const photoChanged =
      !existingPhoto ||
      existingPhoto.lensType !== photography.lensType ||
      existingPhoto.visibility !== photography.visibility ||
      JSON.stringify(existingPhoto.highlights) !== JSON.stringify(photography.highlights);

    if (photoChanged) { photoAdds++; s = { ...s, photography }; }

    return s;
  });

  console.log(`\nWall tag → ${wallAdds.length} sites:`);
  wallAdds.forEach((n) => console.log("  +wall  ", n));

  console.log(`\nNight tag → ${nightAdds.length} sites:`);
  nightAdds.forEach((n) => console.log("  +night ", n));

  console.log(`\nMuck tag → ${muckAdds.length} sites:`);
  muckAdds.forEach((n) => console.log("  +muck  ", n));

  console.log(`\nPhotography field → ${photoAdds} sites updated`);

  if (!APPLY) {
    console.log("\nDry-run — pass --apply to write changes.");
    return;
  }

  await fs.writeFile(SITES_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log("\nWrote updated sites.json.");
}

main().catch((err) => { console.error(err); process.exit(1); });
