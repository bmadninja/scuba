#!/usr/bin/env node
/**
 * AGRRA (Atlantic and Gulf Rapid Reef Assessment) reef-trend ingest.
 *
 * Fetches site-level benthic + fish survey summaries from the public AGRRA Data
 * Explorer ArcGIS FeatureServer and writes per-location multi-year series for
 * live-coral cover and fish biomass into src/data/agrra-reef-series.json.
 *
 * Reef Life Survey (RLS) is the PRIMARY fish-biomass source (global, purpose-
 * built census protocol, clean CC BY 4.0). AGRRA's fish series is a CARIBBEAN
 * FALLBACK: RLS surveys almost none of the wider Caribbean (only ~2 of AGRRA's
 * Caribbean sites), so without this fallback flagship reefs like Cozumel,
 * Roatán, the Belize atolls and the Exuma Cays Blue Park would show no fish
 * trend at all despite AGRRA having the data. page.tsx prefers RLS and uses the
 * AGRRA fish block only where RLS has no series. AGRRA's coral-cover trend is
 * unique — RLS does not provide it.
 *
 * Why a separate file (not coral-cover-series.json):
 *   coral-cover-series.json is fully overwritten by the MERMAID ingest each run.
 *   AGRRA lives in its own file with its own loader so neither ingest can clobber
 *   the other. AGRRA is the Caribbean-standard survey; MERMAID is mostly
 *   Indo-Pacific, so the two barely overlap. Where both cover a location the page
 *   prefers whichever nearby-survey composite has more survey years.
 *
 * Display-only, exactly like MERMAID:
 *   Survey sites are matched to our dive locations by proximity (or a same-country
 *   national composite as a gated fallback), so a nearby AGRRA composite can
 *   differ from a location's hand-reviewed reef-state verdict and headline coral
 *   number. This dataset therefore feeds ONLY the reef card's trend charts. It
 *   never writes reef-health.json and never drives getReefState(). The verdict and
 *   headline stay on the curated reef-health record.
 *
 * Data source (no auth, anonymously queryable):
 *   BaseBySite FeatureServer, org services8.arcgis.com/C2yYpahRgrVlBqfg.
 *   Fields used: SITEYEARMO (survey year), SITELATITU/SITELONGIT (WGS84),
 *   COUNTRYNAM, SITENAME, LCAVG (mean live coral cover %), FBIOMASS (total fish
 *   biomass, g/100 m²). LCAVG/FBIOMASS use -999 as a no-data sentinel, so both
 *   are filtered to >= 0 before use.
 *
 * Matching (hybrid):
 *   1. Proximity — all AGRRA sites within MATCH_RADIUS_DEG of the location are
 *      grouped by survey year (mean per year). Used when >= MIN_TREND_YEARS coral
 *      years result.
 *   2. Country composite — only if proximity is too thin: the location's OWN
 *      country (name-normalised) AGRRA sites, grouped by year, but ONLY when the
 *      nearest same-country AGRRA site is within FALLBACK_RADIUS_DEG (so a Pacific
 *      "Mexico" site never inherits the Caribbean-Mexico trend). Clearly labelled
 *      as a national average in the UI.
 *
 * Idempotency:
 *   The whole file is rebuilt from scratch each run; only agrra-reef-series.json,
 *   plus the AGRRA source entry and the reef-health-agrra methodology note, are
 *   touched. All other data files are left alone.
 *
 * License: AGRRA terms are non-commercial + attribution (and ask for written
 * consent before data goes into a product — a courtesy note to info@agrra.org is
 * advisable). Treated as usable-with-attribution per project policy.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const SERIES_PATH = path.join(ROOT, "src/data/agrra-reef-series.json");
const LOCATIONS_PATH = path.join(ROOT, "src/data/locations.json");
const SOURCES_PATH = path.join(ROOT, "src/data/sources.json");
const METHODOLOGIES_PATH = path.join(ROOT, "src/data/methodologies.json");

const AGRRA_LAYER =
  "https://services8.arcgis.com/C2yYpahRgrVlBqfg/arcgis/rest/services/BaseBySite/FeatureServer/0";
const OUT_FIELDS =
  "SITEYEARMO,SITELATITU,SITELONGIT,LCAVG,FBIOMASS,COUNTRYNAM,SITENAME";
const PAGE_SIZE = 2000;
const PACE_MS = 300;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_PAUSE_MS = 2_000;

// -999 is AGRRA's no-data sentinel for both metrics.
const NO_DATA = 0; // keep only values >= NO_DATA (i.e. drop negatives)

// Proximity radius (~83 km) within which AGRRA survey sites are treated as
// belonging to a location. AGRRA sampling is sparser than MERMAID's, so this is
// a touch wider than MERMAID's 0.5°.
const MATCH_RADIUS_DEG = 0.75;

// A national composite only attaches when the location genuinely sits in that
// country's AGRRA footprint — its nearest same-country survey site must be within
// this radius. Stops e.g. Pacific-coast Mexico inheriting the Caribbean trend.
const FALLBACK_RADIUS_DEG = 1.5;

// A real multi-year trend needs at least this many distinct survey years.
const MIN_TREND_YEARS = 3;
// The fish chart renders from two points; include the fish series when the
// chosen scope has at least this many fish-biomass survey years.
const MIN_FISH_YEARS = 2;

// Locations that fall near reef surveys but are not reefs themselves (inland
// cenotes / freshwater). A proximity match there is a false positive.
const NON_REEF_LOCATION_IDS = new Set(["cenotes-mexico"]);
function isNonReef(loc) {
  return (
    NON_REEF_LOCATION_IDS.has(loc.id) || /cenote|freshwater|lake\b/i.test(loc.id)
  );
}

// Our locations.json country strings -> AGRRA COUNTRYNAM spelling. Only matters
// for the national-composite fallback.
const COUNTRY_ALIASES = {
  "Antigua and Barbuda": "Antigua & Barbuda",
  "Saint Kitts and Nevis": "St. Kitts & Nevis",
  "Saint Vincent and the Grenadines": "St. Vincent & Grenadines",
  "The Bahamas": "Bahamas",
};
function agrraCountryName(country) {
  return COUNTRY_ALIASES[country] ?? country;
}

const AGRRA_CITATION =
  "Kramer, P.R., Roth, L., and Lang, J. AGRRA Database (Atlantic and Gulf Rapid Reef Assessment). Ocean Research & Education Foundation. www.agrra.org.";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchJson(url) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "scubaseason.fun/agrra-ingest" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      const cause = err?.cause?.code || err?.name || String(err);
      if (attempt <= MAX_RETRIES) {
        await sleep(RETRY_PAUSE_MS);
        continue;
      }
      throw new Error(`request failed (${cause}): ${url}`);
    }
    if (res.status >= 500 && attempt <= MAX_RETRIES) {
      await sleep(RETRY_PAUSE_MS);
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}: ${url}`);
    const data = await res.json();
    if (data.error)
      throw new Error(`ArcGIS error: ${JSON.stringify(data.error).slice(0, 200)}`);
    return data;
  }
}

async function fetchAllSites() {
  const sites = [];
  let offset = 0;
  for (let page = 1; ; page++) {
    process.stdout.write(`  page ${page}…\r`);
    const url =
      `${AGRRA_LAYER}/query?where=${encodeURIComponent("1=1")}` +
      `&outFields=${encodeURIComponent(OUT_FIELDS)}` +
      `&returnGeometry=false&resultOffset=${offset}` +
      `&resultRecordCount=${PAGE_SIZE}&f=json`;
    const data = await fetchJson(url);
    const rows = (data.features ?? []).map((f) => f.attributes);
    sites.push(...rows);
    if (!data.exceededTransferLimit || rows.length === 0) break;
    offset += rows.length;
    await sleep(PACE_MS);
  }
  process.stdout.write("\n");
  return sites.filter(
    (r) =>
      typeof r.SITELATITU === "number" &&
      typeof r.SITELONGIT === "number" &&
      typeof r.SITEYEARMO === "number",
  );
}

// ---------------------------------------------------------------------------
// Series building
// ---------------------------------------------------------------------------

// Group site rows into one mean value per survey year for a given field.
function seriesFor(rows, field) {
  const byYear = new Map();
  for (const r of rows) {
    const v = r[field];
    if (typeof v !== "number" || v < NO_DATA) continue;
    const bucket = byYear.get(r.SITEYEARMO) ?? { sum: 0, n: 0 };
    bucket.sum += v;
    bucket.n += 1;
    byYear.set(r.SITEYEARMO, bucket);
  }
  return [...byYear.entries()]
    .map(([year, { sum, n }]) => ({ year, mean: sum / n, n }))
    .sort((a, b) => a.year - b.year);
}

function coralPoints(rows) {
  return seriesFor(rows, "LCAVG").map((p) => ({
    year: p.year,
    coralCoverPercent: Math.round(p.mean * 10) / 10,
  }));
}

function fishPoints(rows) {
  return seriesFor(rows, "FBIOMASS").map((p) => ({
    year: p.year,
    fishBiomassGper100m2: Math.round(p.mean),
  }));
}

const withinRadius = (loc, r, deg) =>
  Math.abs(loc.lat - r.SITELATITU) <= deg &&
  Math.abs(loc.lng - r.SITELONGIT) <= deg;

function nearestSameCountryDeg(loc, sites, countryName) {
  let best = Infinity;
  for (const r of sites) {
    if (r.COUNTRYNAM !== countryName) continue;
    const d = Math.hypot(loc.lat - r.SITELATITU, loc.lng - r.SITELONGIT);
    if (d < best) best = d;
  }
  return best;
}

function buildRecord(loc, sites) {
  // 1. Proximity scope.
  const near = sites.filter((r) => withinRadius(loc, r, MATCH_RADIUS_DEG));
  let scope = "proximity";
  let scopeRows = near;
  let coral = coralPoints(near);
  let country = null;

  // 2. National-composite fallback, gated to the location's own country and
  //    footprint, only if proximity is too thin for a trend.
  if (coral.length < MIN_TREND_YEARS) {
    const cn = agrraCountryName(loc.country);
    const inFootprint = nearestSameCountryDeg(loc, sites, cn) <= FALLBACK_RADIUS_DEG;
    if (inFootprint) {
      const countryRows = sites.filter((r) => r.COUNTRYNAM === cn);
      const countryCoral = coralPoints(countryRows);
      if (countryCoral.length >= MIN_TREND_YEARS) {
        scope = "country";
        scopeRows = countryRows;
        coral = countryCoral;
        country = cn;
      }
    }
  }

  if (coral.length < MIN_TREND_YEARS) return null;

  const fish = fishPoints(scopeRows);
  const coralLatest = coral[coral.length - 1];
  const fishLatest = fish.length ? fish[fish.length - 1] : null;

  const scopeLabel =
    scope === "proximity"
      ? `AGRRA survey sites within ${Math.round(MATCH_RADIUS_DEG * 111)} km`
      : `${country} national AGRRA average`;

  const notes =
    `${scopeRows.length} AGRRA site-surveys, ${scopeLabel}. ` +
    `Live-coral cover across ${coral.length} survey years (${coral[0].year}–${coralLatest.year})` +
    (fish.length >= MIN_FISH_YEARS
      ? `; fish biomass across ${fish.length} years (${fish[0].year}–${fishLatest.year}), used only where RLS has no coverage.`
      : ".") +
    ` Display-only nearby-survey composite — does not set the reef-state verdict or headline coral number. ` +
    AGRRA_CITATION;

  return {
    locationId: loc.id,
    sourceId: "agrra",
    methodologyClaimId: "reef-health-agrra",
    matchType: scope,
    ...(scope === "proximity"
      ? { radiusDeg: MATCH_RADIUS_DEG }
      : { country }),
    surveyEventCount: scopeRows.length,
    coralSurveyYears: coral.length,
    fishSurveyYears: fish.length,
    coral: {
      latest: {
        year: coralLatest.year,
        coralCoverPercent: coralLatest.coralCoverPercent,
      },
      series: coral,
    },
    ...(fish.length >= MIN_FISH_YEARS && {
      fish: {
        latest: {
          year: fishLatest.year,
          fishBiomassGper100m2: fishLatest.fishBiomassGper100m2,
        },
        series: fish,
      },
    }),
    citation: AGRRA_CITATION,
    notes,
    lastReviewedAt: new Date().toISOString().slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Source + methodology registration
// ---------------------------------------------------------------------------

function upsertAgrraSource(sources) {
  const today = new Date().toISOString().slice(0, 10);
  const idx = sources.findIndex((s) => s.id === "agrra");
  const patch = {
    id: "agrra",
    name: "Atlantic and Gulf Rapid Reef Assessment",
    url: "https://www.agrra.org/",
    publisher: "AGRRA Program / Ocean Research & Education Foundation",
    sourceType: "scientific-survey",
    accessedAt: today,
    license:
      "Non-commercial + attribution (AGRRA Terms of Use). Data displayed via the open AGRRA Data Explorer; product use asks for written consent to info@agrra.org.",
    ingestion: "live",
    notes:
      "Standardised rapid reef-assessment protocols and dataset for the wider Caribbean. Live-ingested from the public AGRRA Data Explorer ArcGIS FeatureServer (BaseBySite) for per-location multi-year live-coral-cover trend charts, and for a fish-biomass trend used as a Caribbean fallback where Reef Life Survey has no coverage. Use for Caribbean coral cover, fish biomass, and bleaching observations.",
  };
  if (idx === -1) {
    sources.push(patch);
    console.log("+ registered agrra in sources.json");
    return true;
  }
  const existing = sources[idx];
  const merged = { ...existing, ...patch };
  if (JSON.stringify(existing) !== JSON.stringify(merged)) {
    sources[idx] = merged;
    console.log("~ updated agrra source metadata (ingestion/license/accessedAt)");
    return true;
  }
  return false;
}

function upsertAgrraMethodology(methodologies) {
  const today = new Date().toISOString().slice(0, 10);
  const note = {
    claimId: "reef-health-agrra",
    claimType: "reef-health",
    sourceIds: ["agrra"],
    confidence: "high",
    calculation:
      "Live-coral cover % from LCAVG and total fish biomass (g/100 m², displayed as kilograms per hectare via a lossless ×0.1 conversion) from FBIOMASS in the AGRRA Data Explorer BaseBySite FeatureServer, both filtered to >= 0 to drop the -999 no-data sentinel. Survey sites are grouped into one mean value per survey year. Scope is proximity first — all AGRRA sites within 0.75° (~83 km) of the location centre — falling back to the location's own-country national composite only when proximity yields fewer than three survey years AND the nearest same-country AGRRA site is within 1.5°. A coral series is published only when it spans at least three survey years; the fish series is carried when it spans at least two.",
    limitations:
      "AGRRA is a rapid-assessment programme: sites are not resurveyed on a fixed annual schedule, so survey years are uneven and some gaps are multi-year. Values are proximity or national composites matched to our location centres, not the exact dive site, and the annual mean pools every surveyed site in that scope. These trend charts are display-only: they never set the reef-state verdict or the headline coral-cover number, which stay on the hand-reviewed reef-health record. Reef Life Survey is the primary fish-biomass source; the AGRRA fish series is shown only where RLS has no coverage, and the two use different survey methods so absolute biomass levels are not comparable across sources (within-site trend direction is what the chart conveys).",
    lastReviewedAt: today,
  };
  const idx = methodologies.findIndex((m) => m.claimId === "reef-health-agrra");
  if (idx === -1) {
    methodologies.push(note);
    console.log("+ registered reef-health-agrra in methodologies.json");
    return true;
  }
  if (JSON.stringify(methodologies[idx]) !== JSON.stringify(note)) {
    methodologies[idx] = note;
    console.log("~ updated reef-health-agrra methodology note");
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log(
    "AGRRA live-coral-cover trend ingest" +
      (DRY_RUN ? " (dry run — no writes)" : ""),
  );
  console.log("====================================================");

  const [locationsRaw, sourcesRaw, methodologiesRaw] = await Promise.all([
    fs.readFile(LOCATIONS_PATH, "utf8"),
    fs.readFile(SOURCES_PATH, "utf8"),
    fs.readFile(METHODOLOGIES_PATH, "utf8"),
  ]);
  const locations = JSON.parse(locationsRaw);
  const sources = JSON.parse(sourcesRaw);
  const methodologies = JSON.parse(methodologiesRaw);

  console.log("\nFetching AGRRA BaseBySite survey sites…");
  const sites = await fetchAllSites();
  console.log(`  usable site-surveys: ${sites.length}`);

  const records = [];
  let proximity = 0;
  let countryComposite = 0;
  let withFish = 0;
  let skippedNonReef = 0;

  for (const loc of locations) {
    if (isNonReef(loc)) {
      skippedNonReef++;
      continue;
    }
    const record = buildRecord(loc, sites);
    if (!record) continue;
    records.push(record);
    if (record.matchType === "proximity") proximity++;
    else countryComposite++;
    if (record.fish) withFish++;

    const c = record.coral;
    const f = record.fish;
    console.log(
      `  ${loc.id.padEnd(38)} ${record.matchType.padEnd(9)} ` +
        `coral ${record.coralSurveyYears}yr ${c.series[0].year}–${c.latest.year} ` +
        `(${c.series[0].coralCoverPercent}%→${c.latest.coralCoverPercent}%)` +
        (f
          ? `  fish ${record.fishSurveyYears}yr ${f.series[0].fishBiomassGper100m2}→${f.latest.fishBiomassGper100m2} g/100m²`
          : "  fish —"),
    );
  }

  records.sort((a, b) => a.locationId.localeCompare(b.locationId));

  const sourcesDirty = upsertAgrraSource(sources);
  const methodologiesDirty = upsertAgrraMethodology(methodologies);

  console.log("");
  console.log(`locations with an AGRRA coral series: ${records.length}`);
  console.log(`  proximity:         ${proximity}`);
  console.log(`  country composite: ${countryComposite}`);
  console.log(`  with fish series:  ${withFish}`);
  console.log(`  skipped (non-reef): ${skippedNonReef}`);

  if (DRY_RUN) {
    console.log(
      `\n[dry run] would write ${records.length} records to agrra-reef-series.json. No files changed.`,
    );
    return;
  }

  const writes = [
    fs.writeFile(SERIES_PATH, JSON.stringify(records, null, 2) + "\n"),
  ];
  if (sourcesDirty)
    writes.push(fs.writeFile(SOURCES_PATH, JSON.stringify(sources, null, 2) + "\n"));
  if (methodologiesDirty)
    writes.push(
      fs.writeFile(METHODOLOGIES_PATH, JSON.stringify(methodologies, null, 2) + "\n"),
    );
  await Promise.all(writes);

  console.log(`\nAGRRA reef-trend ingest complete @ ${new Date().toISOString()}`);

  if (records.length === 0) {
    console.error("FAIL: no AGRRA series produced — check the FeatureServer endpoint.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
