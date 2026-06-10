/**
 * Lightweight taxonomy classifier for the per-site "all species" list.
 *
 * Our `SpeciesEntry` records carry no explicit taxon group, so we derive a
 * coarse bucket from the scientific genus (preferred) and a common-name
 * keyword fallback. Buckets match the species-list filter pills:
 * Fish / Sharks & rays / Turtles / Invertebrates, plus an "Other" catch-all
 * (marine mammals, reptiles) so nothing is hidden from the "All" view.
 */

export type SpeciesGroup = "fish" | "shark" | "turtle" | "invert" | "other";

export const SPECIES_GROUP_LABELS: Record<SpeciesGroup, string> = {
  fish: "Fish",
  shark: "Sharks & rays",
  turtle: "Turtles",
  invert: "Invertebrates",
  other: "Other",
};

/** Order pills are rendered in. "all" is prepended by the page. */
export const SPECIES_GROUP_ORDER: SpeciesGroup[] = [
  "fish",
  "shark",
  "turtle",
  "invert",
  "other",
];

/** Emoji icon shown when no species photo is available. */
export const SPECIES_GROUP_ICON: Record<SpeciesGroup, string> = {
  fish: "\u{1F420}", // tropical fish
  shark: "\u{1F988}", // shark
  turtle: "\u{1F422}", // turtle
  invert: "\u{1FAB8}", // coral
  other: "\u{1F30A}", // ocean wave
};

// Genus / family fragments that signal sharks, rays, skates and kin.
const SHARK_RAY_GENERA = [
  "carcharhinus",
  "ginglymostoma",
  "sphyrna",
  "galeocerdo",
  "triaenodon",
  "stegostoma",
  "rhincodon",
  "negaprion",
  "carcharias",
  "carcharodon",
  "isurus",
  "prionace",
  "notorynchus",
  "heterodontus",
  "orectolobus",
  "chiloscyllium",
  "hemiscyllium",
  "nebrius",
  "eucrossorhinus",
  "squalus",
  "squatina",
  "mustelus",
  "triakis",
  "hexanchus",
  "manta",
  "mobula",
  "aetobatus",
  "dasyatis",
  "hypanus",
  "bathytoshia",
  "taeniura",
  "neotrygon",
  "himantura",
  "urobatis",
  "myliobatis",
  "pteroplatytrygon",
  "rhinoptera",
  "gymnura",
  "torpedo",
  "narcine",
  "rhina",
  "rhynchobatus",
  "pristis",
  "raja",
  "bathyraja",
  "leucoraja",
  "amblyraja",
  "potamotrygon",
];

const TURTLE_GENERA = [
  "chelonia",
  "eretmochelys",
  "caretta",
  "dermochelys",
  "lepidochelys",
  "natator",
];

// Invertebrate genera/keywords are broad; we lean on common-name keywords
// for these because the data spans corals, molluscs, crustaceans and worms.
const OTHER_GENERA = [
  // marine mammals
  "tursiops",
  "stenella",
  "delphinus",
  "orcinus",
  "globicephala",
  "megaptera",
  "balaenoptera",
  "physeter",
  "zalophus",
  "neophoca",
  "arctocephalus",
  "phocarctos",
  "eumetopias",
  "callorhinus",
  "halichoerus",
  "phoca",
  "dugong",
  "trichechus",
  "eubalaena",
  // reptiles (non-turtle)
  "crocodylus",
  "laticauda",
  "hydrophis",
];

function genusOf(scientificName: string | undefined): string | null {
  if (!scientificName) return null;
  const first = scientificName.split(",")[0].trim().toLowerCase();
  const genus = first.split(/\s+/)[0];
  return genus || null;
}

const SHARK_RAY_WORDS =
  /\b(shark|ray|skate|sawfish|guitarfish|manta|stingray|wedgefish|numbfish|torpedo ray|eagle ray|devil ray|wobbegong)\b/i;
const TURTLE_WORDS = /\bturtle\b/i;
const OTHER_WORDS =
  /\b(dolphin|whale|seal|sea lion|fur seal|manatee|dugong|orca|porpoise|crocodile|sea krait|sea snake|otter)\b/i;
const INVERT_WORDS =
  /\b(coral|crab|lobster|shrimp|prawn|octopus|squid|cuttlefish|nautilus|nudibranch|sea slug|flatworm|worm|anemone|urchin|sea star|starfish|brittle star|feather star|crinoid|sea cucumber|sponge|jellyfish|jelly|gorgonian|sea fan|sea whip|hydroid|hydrocoral|clam|scallop|oyster|mussel|conch|snail|barnacle|krill|bryozoan|tunicate|sea squirt|zoanthid)\b/i;

/**
 * Classify a species into a coarse taxon group. Crocodilefish, lionfish,
 * etc. are fish despite "croc"/"lion" substrings, so word-boundary matching
 * and genus checks come first.
 */
export function classifySpecies(
  commonName: string,
  scientificName?: string,
): SpeciesGroup {
  const genus = genusOf(scientificName);

  if (genus) {
    if (SHARK_RAY_GENERA.includes(genus)) return "shark";
    if (TURTLE_GENERA.includes(genus)) return "turtle";
    if (OTHER_GENERA.includes(genus)) return "other";
  }

  const name = commonName.toLowerCase();
  // "Crocodilefish" / "lionfish" / "catfish" are fish — guard before keywords.
  if (/fish\b/.test(name) && !/jellyfish|cuttlefish/.test(name)) {
    // Most "...fish" common names are bony fish; sharks/rays rarely end in
    // "fish" except via the words handled above.
    if (!SHARK_RAY_WORDS.test(name)) return "fish";
  }

  if (TURTLE_WORDS.test(commonName)) return "turtle";
  if (SHARK_RAY_WORDS.test(commonName)) return "shark";
  if (OTHER_WORDS.test(commonName)) return "other";
  if (INVERT_WORDS.test(commonName)) return "invert";

  return "fish";
}
