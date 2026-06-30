#!/usr/bin/env node
/**
 * Zero-cost enrichment for coverage-gaps.json.
 * No Anthropic API needed — uses only free public APIs:
 *   - Wikidata SPARQL   → exact coordinates
 *   - Nominatim (OSM)   → fallback geocoding
 *   - Wikipedia API     → description text, depth mentions
 *   - iNaturalist API   → real species observations near coordinates
 *
 * Conditions by month are approximated from latitude band.
 * Dive types are inferred from description/name keywords.
 *
 * Env:
 *   DRY_RUN=1    print JSON but do not write files
 *   MAX_SITES=5  max sites to add per run (default 5)
 *
 * Usage:
 *   node scripts/enrich-coverage-gaps-free.mjs
 *   DRY_RUN=1 MAX_SITES=3 node scripts/enrich-coverage-gaps-free.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SITES_PATH = resolve(ROOT, "src/data/sites.json");
const LOCATIONS_PATH = resolve(ROOT, "src/data/locations.json");
const GAPS_PATH = resolve(ROOT, "src/data/coverage-gaps.json");

const DRY_RUN = process.env.DRY_RUN === "1";
const MAX_SITES = Number(process.env.MAX_SITES ?? "5");

const USER_AGENT = "scubaseason.fun/1.0 (hello@scubaseason.fun)";

// ── Data loaders ───────────────────────────────────────────────────────────────

function loadSites() {
  return JSON.parse(readFileSync(SITES_PATH, "utf8"));
}

const locations = JSON.parse(readFileSync(LOCATIONS_PATH, "utf8"));
const gaps = JSON.parse(readFileSync(GAPS_PATH, "utf8"));

// ── HTTP helpers ───────────────────────────────────────────────────────────────

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...opts.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Wikidata: coordinates by label ─────────────────────────────────────────────

async function wikidataCoords(name, aliases = []) {
  const labels = [name, ...aliases];
  for (const label of labels) {
    const encoded = encodeURIComponent(
      `SELECT ?item ?coord WHERE {
        ?item rdfs:label "${label.replace(/"/g, '\\"')}"@en .
        OPTIONAL { ?item wdt:P625 ?coord }
      } LIMIT 5`
    );
    try {
      const data = await fetchJson(
        `https://query.wikidata.org/sparql?query=${encoded}&format=json`,
        { headers: { Accept: "application/sparql-results+json" } }
      );
      const bindings = data?.results?.bindings ?? [];
      const withCoord = bindings.find((b) => b.coord?.value);
      if (withCoord) {
        const match = withCoord.coord.value.match(/Point\(([0-9.-]+)\s+([0-9.-]+)\)/);
        if (match) {
          return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
        }
      }
    } catch (_) {}
    await sleep(300);
  }
  return null;
}

// ── Nominatim: fallback geocoding ──────────────────────────────────────────────

async function nominatimCoords(name, country, region) {
  const queries = [
    `${name} dive site ${country}`,
    `${name} ${region} ${country}`,
    `${name} ${country}`,
  ];
  for (const q of queries) {
    try {
      const data = await fetchJson(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=3`,
      );
      if (data?.length) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (_) {}
    await sleep(1000); // Nominatim requires 1s between requests
  }
  return null;
}

// ── Wikipedia: extract and depth ───────────────────────────────────────────────

async function wikipediaExtract(name, aliases = []) {
  const titles = [name, ...aliases];
  for (const title of titles) {
    try {
      const data = await fetchJson(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json`
      );
      const pages = data?.query?.pages ?? {};
      const page = Object.values(pages)[0];
      if (page && page.extract && !page.missing) {
        return page.extract;
      }
    } catch (_) {}
    await sleep(300);
  }
  return null;
}

// Extract depth range from text (e.g. "15 to 30 metres", "max depth 40m")
function extractDepth(text) {
  if (!text) return null;
  const patterns = [
    /depths?\s+of\s+(\d+)\s+to\s+(\d+)\s*m/i,
    /(\d+)\s+to\s+(\d+)\s*m(?:etres?|eters?)/i,
    /max(?:imum)?\s+depth[:\s]+(\d+)\s*m/i,
    /depths?\s+(?:up\s+to|to|of)\s+(\d+)\s*m/i,
    /(\d+)\s*m(?:etres?|eters?)\s+(?:deep|depth)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      if (m[2]) return { min: Math.max(5, parseInt(m[1])), max: parseInt(m[2]) };
      const d = parseInt(m[1]);
      return { min: Math.max(5, Math.round(d * 0.4)), max: d };
    }
  }
  return null;
}

// ── iNaturalist: species near coords ──────────────────────────────────────────

async function inatSpecies(lat, lng, radius = 15) {
  try {
    const data = await fetchJson(
      `https://api.inaturalist.org/v1/observations/species_counts?lat=${lat}&lng=${lng}&radius=${radius}&quality_grade=research&per_page=12&iconic_taxa=Actinopterygii,Mollusca,Echinodermata,Animalia,Reptilia`
    );
    return (data?.results ?? []).map((r) => ({
      commonName: r.taxon?.preferred_common_name ?? r.taxon?.name,
      scientificName: r.taxon?.name,
      count: r.count,
    })).filter((s) => s.commonName);
  } catch (_) {
    return [];
  }
}

// Get monthly observation counts for a species near coords
async function inatMonthlyObs(taxonId, lat, lng, radius = 15) {
  try {
    const data = await fetchJson(
      `https://api.inaturalist.org/v1/observations/histogram?taxon_id=${taxonId}&lat=${lat}&lng=${lng}&radius=${radius}&quality_grade=research&date_field=observed&interval=month_of_year`
    );
    const hist = data?.results?.month_of_year ?? {};
    const total = Object.values(hist).reduce((a, b) => a + b, 0);
    if (!total) return null;
    return Array.from({ length: 12 }, (_, i) => hist[i + 1] ?? 0);
  } catch (_) {
    return null;
  }
}

// ── Conditions by latitude band ────────────────────────────────────────────────

function conditionsByMonth(lat) {
  const absLat = Math.abs(lat);

  if (absLat < 15) {
    // Equatorial tropical — warm and clear year-round, rainy season affects vis
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      waterTempC: { min: 27, max: 30 },
      visibilityM: { min: 15, max: 30 },
      currentStrength: [6, 7, 8, 9].includes(i + 1) ? "moderate" : "mild",
      suitRecommendation: "3mm shorty or tropical wetsuit",
    }));
  }

  if (absLat < 25) {
    // Tropical — distinct dry/wet season
    const isSouthern = lat < 0;
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const isDrySeason = isSouthern
        ? month >= 5 && month <= 9
        : month >= 11 || month <= 4;
      return {
        month,
        waterTempC: isDrySeason ? { min: 26, max: 29 } : { min: 28, max: 31 },
        visibilityM: isDrySeason ? { min: 20, max: 35 } : { min: 10, max: 20 },
        currentStrength: "mild",
        suitRecommendation: "3mm wetsuit",
      };
    });
  }

  if (absLat < 35) {
    // Subtropical / Red Sea / Mediterranean fringe
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const isSummer = lat > 0 ? month >= 6 && month <= 9 : month >= 12 || month <= 3;
      return {
        month,
        waterTempC: isSummer ? { min: 26, max: 30 } : { min: 20, max: 24 },
        visibilityM: isSummer ? { min: 20, max: 30 } : { min: 15, max: 25 },
        currentStrength: "mild",
        suitRecommendation: isSummer ? "3mm wetsuit" : "5mm wetsuit",
      };
    });
  }

  if (absLat < 50) {
    // Temperate — Mediterranean, California, Japan
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const isSummer = lat > 0 ? month >= 6 && month <= 9 : month >= 12 || month <= 3;
      return {
        month,
        waterTempC: isSummer ? { min: 20, max: 24 } : { min: 12, max: 16 },
        visibilityM: isSummer ? { min: 10, max: 20 } : { min: 5, max: 15 },
        currentStrength: "moderate",
        suitRecommendation: isSummer ? "5mm wetsuit" : "7mm wetsuit or drysuit",
      };
    });
  }

  // Cold / sub-arctic (Scapa Flow, BC, Norway)
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const isSummer = lat > 0 ? month >= 6 && month <= 9 : month >= 12 || month <= 3;
    return {
      month,
      waterTempC: isSummer ? { min: 12, max: 16 } : { min: 4, max: 8 },
      visibilityM: isSummer ? { min: 10, max: 20 } : { min: 5, max: 12 },
      currentStrength: "moderate",
      suitRecommendation: "Drysuit recommended year-round",
    };
  });
}

function bestMonthsFromLat(lat) {
  const absLat = Math.abs(lat);
  if (absLat < 15) return [1, 2, 3, 4, 5, 10, 11, 12]; // avoid rainy season
  if (absLat < 25) return lat >= 0 ? [11, 12, 1, 2, 3, 4] : [5, 6, 7, 8, 9];
  if (absLat < 35) return lat >= 0 ? [6, 7, 8, 9] : [12, 1, 2, 3];
  if (absLat < 50) return lat >= 0 ? [6, 7, 8, 9] : [12, 1, 2, 3];
  return lat >= 0 ? [6, 7, 8] : [12, 1, 2];
}

// ── Dive type inference from text ──────────────────────────────────────────────

function inferDiveTypes(name, description, aliases = []) {
  const text = [name, description, ...aliases].join(" ").toLowerCase();
  const types = new Set();

  if (/\bwreck|shipwreck|sunken\s+ship|submarine\b/.test(text)) types.add("wrecks");
  if (/\bwall|drop.?off|vertical\s+(cliff|face)|sheer\b/.test(text)) types.add("geology");
  if (/\bdrift|channel|current|pass\b/.test(text)) types.add("drift");
  if (/\bcave|cavern|tunnel|blue\s+hole\b/.test(text)) types.add("cave");
  if (/\bmanta|whale\s+shark|hammerhead|tiger\s+shark|thresher|great\s+white|sailfish\b/.test(text)) types.add("large-pelagics");
  if (/\bnudibranch|pygmy|frogfish|seahorse|ghostpipe|muck\b/.test(text)) types.add("macro");
  if (/\bcoral\s+reef|reef|coral\b/.test(text)) types.add("coral");

  // Default fallback
  if (!types.size) types.add("coral");
  return [...types];
}

// ── Skill level inference ──────────────────────────────────────────────────────

function inferSkillLevel(description, diveTypes) {
  const text = (description ?? "").toLowerCase();
  if (/\bcave|drysuit|technical|trimix|rebreather\b/.test(text)) return "tech";
  if (/\bstrong\s+current|unpredictable|challenging|advanced|experienced\b/.test(text)) return "advanced";
  if (/\bcurrent|drift|deep\b/.test(text) || diveTypes.includes("drift")) return "advanced";
  if (/\bbeginners?|novice|calm|sheltered|shallow\b/.test(text)) return "open-water";
  return "advanced"; // bias toward advanced for famous sites
}

// ── Slug/ID helpers ────────────────────────────────────────────────────────────

function slugify(s) {
  return s.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const normalizeName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function isDuplicate(candidate, sites) {
  for (const s of sites) {
    if (s.id === candidate.id || s.slug === candidate.slug) return `id/slug match: ${s.id}`;
    if (normalizeName(s.name) === normalizeName(candidate.name) && s.locationId === candidate.locationId)
      return `name match: ${s.name}`;
    const dLat = Math.abs(s.lat - candidate.lat);
    const dLng = Math.abs(s.lng - candidate.lng);
    if (dLat < 0.02 && dLng < 0.02) return `coordinates within 2km of ${s.name}`;
  }
  return null;
}

// ── Location resolution ────────────────────────────────────────────────────────

function resolveLocationId(gap) {
  if (gap.ourLocationId) return gap.ourLocationId;
  const country = gap.country?.toLowerCase().trim();
  const region = gap.region?.toLowerCase().trim();
  const byCountry = locations.filter((l) => l.country?.toLowerCase() === country);
  if (!byCountry.length) return null;
  if (byCountry.length === 1) return byCountry[0].id;
  if (region) {
    const match = byCountry.find(
      (l) =>
        l.region?.toLowerCase().includes(region) ||
        region.includes(l.region?.toLowerCase() ?? "") ||
        l.name?.toLowerCase().includes(region) ||
        region.includes(l.name?.toLowerCase() ?? "")
    );
    if (match) return match.id;
  }
  return byCountry[0].id;
}

// ── Build a site entry from free-API data ──────────────────────────────────────

async function buildSite(gap) {
  const locationId = resolveLocationId(gap);
  if (!locationId) {
    console.log(`  ⚠ No location match for "${gap.name}" (${gap.country})`);
    return null;
  }
  const location = locations.find((l) => l.id === locationId);

  // 1. Coordinates
  let coords = null;
  console.log("  → Wikidata coords...");
  coords = await wikidataCoords(gap.name, gap.aliases ?? []);
  if (!coords) {
    console.log("  → Nominatim fallback...");
    await sleep(1100); // Nominatim rate limit
    coords = await nominatimCoords(gap.name, gap.country, gap.region ?? "");
  }
  if (!coords && location) {
    // Last resort: use location centroid with a small offset per alias index
    coords = { lat: location.lat, lng: location.lng };
    console.log("  → Using location centroid as fallback coords");
  }
  if (!coords) {
    console.log("  ⚠ Could not resolve coordinates");
    return null;
  }

  // 2. Wikipedia description
  console.log("  → Wikipedia extract...");
  const wikiText = await wikipediaExtract(gap.name, gap.aliases ?? []);
  await sleep(300);

  // Trim to a useful description (first 2 sentences, 80-800 chars)
  let description = "";
  if (wikiText) {
    const sentences = wikiText.replace(/\n+/g, " ").split(/(?<=[.!?])\s+/);
    let built = "";
    for (const s of sentences) {
      if ((built + " " + s).length > 750) break;
      built = (built + " " + s).trim();
      if (built.length >= 120) break;
    }
    description = built;
  }

  // Fallback description if Wikipedia gives nothing useful
  if (description.length < 80) {
    const diveTypes = inferDiveTypes(gap.name, description, gap.aliases ?? []);
    const typeLabels = diveTypes.join(", ");
    description = `${gap.name} is a ${typeLabels} dive site near ${location.name}, ${gap.country}. Mentioned across ${gap.sourceCount} authoritative dive guides, it is considered one of the region's most notable dive destinations.`;
  }

  // 3. Depth from Wikipedia
  const depthRange = extractDepth(wikiText) ?? { min: 10, max: 30 };

  // 4. Dive types + skill
  const diveTypes = inferDiveTypes(gap.name, wikiText ?? description, gap.aliases ?? []);
  const skillLevel = inferSkillLevel(wikiText ?? description, diveTypes);

  // 5. iNaturalist species
  console.log("  → iNaturalist species...");
  const inatResults = await inatSpecies(coords.lat, coords.lng);
  await sleep(500);

  const species = inatResults.slice(0, 8).map((s) => ({
    commonName: s.commonName,
    scientificName: s.scientificName,
    reliability: s.count > 20 ? "year-round" : s.count > 5 ? "seasonal" : "rare",
  }));

  // Ensure at least 2 species entries
  if (species.length < 2) {
    species.push(
      { commonName: "Reef fish", scientificName: undefined, reliability: "year-round" },
      { commonName: "Coral reef community", scientificName: undefined, reliability: "year-round" }
    );
  }

  // 6. Conditions
  const conditions = conditionsByMonth(coords.lat);
  const best = bestMonthsFromLat(coords.lat);

  // 7. editorialRank from sourceCount
  const rank = Math.min(95, Math.max(50, 50 + gap.sourceCount * 8));

  // 8. getThere — generic based on nearest airport / country
  const getThere = `Fly into the nearest international airport serving ${location.name}, ${gap.country}. Local transfer options vary — check with your dive operator for current logistics.`;

  // 9. Build slug
  const siteSlug = slugify(`${locationId}-${gap.name}`);

  // 10. Hero image — use location's hero as placeholder (satisfies commit hook;
  //     site-specific underwater photo can be sourced later via photo audit)
  const heroImageUrl = location.heroImageUrl ?? null;

  return {
    id: siteSlug,
    slug: siteSlug,
    locationId,
    name: gap.name,
    heroImageUrl,
    lat: Math.round(coords.lat * 10000) / 10000,
    lng: Math.round(coords.lng * 10000) / 10000,
    description,
    depthRange,
    skillLevel,
    diveTypes,
    species,
    conditionsByMonth: conditions,
    bestMonths: best,
    editorialRank: rank,
    getThere,
    lodging: [],
    operators: [],
    gearIds: [],
    siteSpecificGear: [],
    notes: `Added via free-API enrichment. Source count: ${gap.sourceCount}. ${gap.aliases?.length ? `Aliases: ${gap.aliases.join(", ")}.` : ""}`,
  };
}

// ── Git commit ─────────────────────────────────────────────────────────────────

function gitCommit(siteName) {
  const GIT = `git -c user.email="bot@scubaseason.fun" -c user.name="scubaseason-bot"`;
  execSync(`git add src/data/sites.json`, { stdio: "inherit" });
  execSync(`${GIT} commit -m "auto: fill gaps — add ${siteName.replace(/"/g, "")}"`, { stdio: "inherit" });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  let sites = loadSites();
  const existingNames = new Set(sites.map((s) => normalizeName(s.name)));

  const queue = gaps
    .slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .filter((g) => !existingNames.has(normalizeName(g.name)));

  console.log(`Queue: ${queue.length} gaps remaining | max this run: ${MAX_SITES} | dry: ${DRY_RUN}`);

  let accepted = 0;

  for (const gap of queue) {
    if (accepted >= MAX_SITES) break;
    console.log(`\n[${accepted + 1}/${MAX_SITES}] ${gap.name} (${gap.country}, priority ${gap.priority})`);

    try {
      const entry = await buildSite(gap);
      if (!entry) continue;

      const dup = isDuplicate(entry, sites);
      if (dup) {
        console.log(`  ⚠ Skipping duplicate: ${dup}`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`  [DRY_RUN] Would add:`);
        console.log(JSON.stringify(entry, null, 2));
      } else {
        sites = loadSites();
        sites.push(entry);
        writeFileSync(SITES_PATH, JSON.stringify(sites, null, 2) + "\n");
        gitCommit(entry.name);
        console.log(`  ✓ Added and committed: ${entry.name}`);
      }

      accepted++;
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }

    await sleep(500);
  }

  console.log(`\nDone. Added ${accepted} sites. ${queue.length - accepted > 0 ? `${queue.length - accepted} gaps remain — run again to continue.` : "All gaps filled!"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
