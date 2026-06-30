#!/usr/bin/env node
/**
 * Remove terrestrial species contamination from sites.json.
 *
 * iNaturalist queries by lat/lng pick up land animals near coastal sites.
 * This script removes any species entry whose scientific name genus is in
 * the known-terrestrial blocklist, then reports how many were removed and
 * from which sites.
 *
 * Flags:
 *   DRY_RUN=1   print what would be removed, do not write
 *   SITE_ID=xxx  check a single site
 *
 * After running, re-run enrich-species-inat.mjs to top sites back up to
 * the target species count.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SITES_PATH = path.join(ROOT, "src/data/sites.json");

const DRY_RUN = process.env.DRY_RUN === "1";
const SITE_ID = process.env.SITE_ID ?? null;

// Scientific name genera that are definitively non-marine.
// Intentionally omits: Anguilla (cave/freshwater eels), Amblyrhynchus (marine iguana).
const TERRESTRIAL_GENERA = new Set([
  // Lizards & terrestrial reptiles
  "Acanthocercus","Agama","Laudakia","Pseudotrapelus","Gonocephalus",
  "Ctenosaura","Iguana","Amblyrhynchus_skip", // marine iguana — keep
  // Geckos
  "Gehyra","Gekko","Hemidactylus","Phelsuma","Haemodracon","Pristurus","Cryptoblepharus",
  // Skinks
  "Carlia","Chalcides","Chioninia","Emoia","Eutropis","Plestiodon","Scincella",
  "Sphenomorphus","Trachylepis",
  // Chameleons
  "Bradypodion","Brookesia","Chamaeleo","Furcifer","Rieppeleon",
  // Tortoises & freshwater turtles (NOT sea turtles)
  "Testudo","Aldabrachelys","Chelonoidis","Mauremys",
  // Freshwater crustaceans
  "Atyaephyra","Cambaroides","Geothelphusa","Potamon",
  // Birds — raptors
  "Aquila","Gyps","Gypohierax","Neophron","Necrosyrtes","Cathartes","Coragyps",
  "Haliaeetus","Haliastur","Hieraaetus","Icthyophaga","Milvus","Spilornis",
  // Birds — pigeons & doves
  "Alectroenas","Caloenas","Columba","Columbina","Ducula","Geopelia","Ocyphaps",
  "Patagioenas","Ptilinopus","Spilopelia","Starnoenas","Streptopelia","Treron","Zenaida",
  // Birds — passerines & other land birds
  "Acridotheres","Aplonis","Curruca","Cyanocitta","Cyanocorax","Diuca","Garrulus",
  "Hirundo","Leucopsar","Merops","Monticola","Motacilla","Muscicapa","Myiagra",
  "Myiozetetes","Oenanthe","Passer","Perisoreus","Phylloscopus","Rhipidura",
  "Setophaga","Sicalis","Sturnus","Tachornis","Taeniopygia","Terpsiphone","Zonotrichia",
  // Birds — seabirds present above water (not encountered while diving)
  "Nannopterum","Phalacrocorax","Pelecanus","Sula",
]);

function isTerrestrial(sp) {
  if (!sp.scientificName) return false;
  const genus = sp.scientificName.split(" ")[0];
  return TERRESTRIAL_GENERA.has(genus);
}

async function main() {
  const raw = await fs.readFile(SITES_PATH, "utf8");
  const sites = JSON.parse(raw);

  let targets = SITE_ID ? sites.filter((s) => s.id === SITE_ID) : sites;

  let totalRemoved = 0;
  let sitesAffected = 0;

  console.log(`\nTerrestrial species cleanup`);
  console.log(`===========================`);
  if (DRY_RUN) console.log("DRY RUN — no writes\n");
  else console.log("");

  for (const site of targets) {
    if (!site.species?.length) continue;
    const before = site.species.length;
    const bad = site.species.filter(isTerrestrial);
    if (!bad.length) continue;

    console.log(`${site.name}`);
    for (const sp of bad) {
      console.log(`  - ${sp.commonName} (${sp.scientificName})`);
    }

    if (!DRY_RUN) {
      site.species = site.species.filter((sp) => !isTerrestrial(sp));
    }

    totalRemoved += bad.length;
    sitesAffected++;
  }

  if (!DRY_RUN) {
    await fs.writeFile(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
  }

  console.log(`\nDone.`);
  console.log(`  Sites affected: ${sitesAffected}`);
  console.log(`  Species removed: ${totalRemoved}`);
  if (!DRY_RUN && sitesAffected > 0) {
    console.log(`\nRun enrich-species-inat.mjs to top up sites that dropped below target.`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
