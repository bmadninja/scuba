#!/usr/bin/env node
/**
 * MPAtlas MPA-status pipeline.
 *
 * Replaces the regional-template guesses in backfill-reef-pressure.mjs with
 * real MPA Guide assessments (Marine Conservation Institute / MPAtlas), so
 * each reef location's `mpaStatus` reflects its actual level of protection
 * AND whether that protection is implemented vs merely designated on paper.
 *
 * ── Two modes ────────────────────────────────────────────────────────────
 *
 *   --full  (default)
 *     Point-in-polygon of every reef-pressure location's lat/lng against the
 *     MPAtlas assessed-zone polygons in data/external/mpatlas-zones.geojson.
 *     Each dive site resolves to the exact zone it sits in — no aggregation,
 *     no centroid guessing. This is the correct, license-clean pipeline.
 *
 *     The GeoJSON comes from the official MPAtlas download (geodatabase),
 *     which is behind a login at https://guide.mpatlas.org/data/download/
 *     Convert it once with:  ogr2ogr -f GeoJSON mpatlas-zones.geojson MPAtlas.gdb <layer>
 *     and drop it at data/external/mpatlas-zones.geojson.
 *
 *     If that file is absent the script prints instructions and exits 0 (same
 *     pattern as fetch-fishing-pressure.mjs with a missing token) — it never
 *     invents data and never touches reef-pressure.json.
 *
 *   --spot-check[=N]
 *     No local dataset needed. Hits the MPAtlas live JSON API for a small
 *     representative sample (default 12 sites) to demonstrate the mapping and
 *     quantify how far the current template values are off. Centroid-matched,
 *     so lower confidence than --full — every match reports its distance.
 *
 * ── Output ───────────────────────────────────────────────────────────────
 *
 *   Always writes a REVIEW artifact only — never mutates reef-pressure.json:
 *     .claude/mpa-status-review.md    human-readable diff (template vs MPAtlas)
 *     .claude/mpa-status-review.json  machine-readable, ready to apply once approved
 *
 *   Applying the reviewed values to reef-pressure.json is a deliberate second
 *   step (guarded by mpaStatusSource: "manual" locks). This is the
 *   "make sure the data is right before it goes live" gate.
 *
 * ── Note on the live API ─────────────────────────────────────────────────
 *
 *   mpatlas.org/robots.txt disallows */api/*. The --spot-check mode is a
 *   one-off, rate-limited QA measurement (~12 sites), not a production feed.
 *   The --full pipeline uses the licensed offline download and hits no API.
 */

import fs from "node:fs/promises";
import path from "node:path";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const RP_PATH = path.join(ROOT, "src/data/reef-pressure.json");
const LOC_PATH = path.join(ROOT, "src/data/locations.json");
// Standalone MPAtlas protection for locations that match an assessed zone but
// have no editorial reef-pressure record. Pure assessment data (no invented
// pressure/visitor copy); the app reads it as a fallback for mpaStatus.
const MPA_STATUS_PATH = path.join(ROOT, "src/data/mpa-status.json");
const GEOJSON_PATH = path.join(ROOT, "data/external/mpatlas-zones.geojson");
const REVIEW_MD = path.join(ROOT, ".claude/mpa-status-review.md");
const REVIEW_JSON = path.join(ROOT, ".claude/mpa-status-review.json");

// Point sits outside every assessed polygon, but within this many km of the
// nearest scored zone's boundary → a "near-miss" recovery. A rough dive
// centroid often lands just outside a small reef reserve's polygon.
const NEAR_MISS_KM = 5;
// At or under this boundary gap the near-miss is treated as confident enough to
// auto-apply (medium); between it and NEAR_MISS_KM it is held for review (low).
const NEAR_MISS_CONFIDENT_KM = 1;

const API_BASE = "https://mpatlas.org/api/v1/internal";
const UA = "scubaseason-data-qa (hello@scubaseason.fun)";
const PACE_MS = 450;
// Above this centroid distance a spot-check match is flagged low-confidence.
const NEAR_KM = 75;
// Hard ceiling for accepting any centroid match at all.
const MAX_KM = 300;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── MPA Guide → our MpaStatus enum ──────────────────────────────────────
//
// levelOfProtection: f=fully h=highly l=lightly m=minimally u/n=unassessed
// stage:             a=actively-managed i=implemented d=designated p=proposed
//
// The stage gate is the whole point: a "fully protected" MPA that is only
// designated (not implemented) is a paper park → designated-multi-use, NOT
// no-take. That distinction is what the template lookup could never make.
// Level codes appear as single letters in the live API and as words in the
// CSV export ("full"/"high"/"light"/"minimal"/"incompatible"/"unknown").
const LEVEL = {
  f: "fully", h: "highly", l: "lightly", m: "minimally", n: "minimally", u: "unknown",
  full: "fully", high: "highly", light: "lightly", minimal: "minimally",
  incompatible: "incompatible", unknown: "unknown",
};
const STAGE = {
  a: "actively-managed", i: "implemented", d: "designated", p: "proposed",
  "actively managed": "actively-managed", implemented: "implemented",
  designated: "designated", proposed: "proposed",
};

function normLevel(code) {
  return LEVEL[String(code ?? "").trim().toLowerCase()] ?? "unknown";
}
function normStage(code) {
  return STAGE[String(code ?? "").trim().toLowerCase()] ?? "designated";
}

// MPA Guide 2-char stage+level code (e.g. "if" = implemented + fully). Built
// from the normalized level/stage so it is consistent whether the source spelt
// them as codes or words.
const LEVEL_CHAR = { fully: "f", highly: "h", lightly: "l", minimally: "m", incompatible: "n", unknown: "u" };
const STAGE_CHAR = { "actively-managed": "a", implemented: "i", designated: "d", proposed: "p" };
function mpaGuideCode(levelCode, stageCode) {
  return `${STAGE_CHAR[normStage(stageCode)] ?? "u"}${LEVEL_CHAR[normLevel(levelCode)] ?? "u"}`;
}

function mapMpaStatus(levelCode, stageCode) {
  const level = normLevel(levelCode);
  const stage = normStage(stageCode);
  const implemented = stage === "implemented" || stage === "actively-managed";
  if (level === "fully") return implemented ? "no-take" : "designated-multi-use";
  if (level === "highly") return implemented ? "strict-mpa" : "designated-multi-use";
  // lightly / minimally / incompatible protection = an MPA on paper, not a
  // no-take or strict reserve, regardless of stage.
  if (level === "lightly" || level === "minimally" || level === "incompatible")
    return "designated-multi-use";
  return null; // unknown / unassessed → no confident value
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function api(pathAndQuery) {
  const res = await fetch(`${API_BASE}${pathAndQuery}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${pathAndQuery}`);
  return res.json();
}

// ── Offline CSV join (the no_geo export) ─────────────────────────────────
//
// The no_geo export has no polygons or coordinates, so we cannot resolve a
// dive site by location. The only join keys it offers are wdpa_id (which our
// locations do not store) and site name. This mode matches on country + name
// and reports confidence honestly — it is a coverage map, not a substitute
// for the geometry-based --full join.

const CSV_DIR = path.join(ROOT, "data/external/mpatlas");

// ISO2 (our locations) → ISO3 (MPAtlas country column), for the countries we have.
const ISO3 = {
  AE: "ARE", AU: "AUS", BQ: "BES", BR: "BRA", BS: "BHS", BZ: "BLZ", CN: "CHN",
  CO: "COL", CR: "CRI", CU: "CUB", CV: "CPV", CW: "CUW", CY: "CYP", DJ: "DJI",
  EC: "ECU", EG: "EGY", ER: "ERI", ES: "ESP", FJ: "FJI", FM: "FSM", GD: "GRD",
  HN: "HND", HR: "HRV", ID: "IDN", IN: "IND", IT: "ITA", JO: "JOR", JP: "JPN",
  KE: "KEN", KH: "KHM", KM: "COM", KR: "KOR", KY: "CYM", LC: "LCA", LK: "LKA",
  MG: "MDG", MM: "MMR", MT: "MLT", MV: "MDV", MX: "MEX", MY: "MYS", MZ: "MOZ",
  NU: "NIU", NZ: "NZL", OM: "OMN", PA: "PAN", PF: "PYF", PG: "PNG", PH: "PHL",
  PT: "PRT", PW: "PLW", SA: "SAU", SB: "SLB", SC: "SYC", SD: "SDN", ST: "STP",
  TH: "THA", TT: "TTO", TW: "TWN", TZ: "TZA", US: "USA", VE: "VEN", VG: "VGB",
  VN: "VNM", ZA: "ZAF",
};

const STOP = new Set([
  "national", "park", "marine", "reserve", "reefs", "reef", "natural", "nature",
  "sanctuary", "protected", "area", "areas", "de", "la", "del", "los", "las",
  "monument", "biosphere", "np", "mpa", "island", "islands", "the", "and", "of",
  "state", "wildlife", "refuge", "conservation", "zone", "subzone", "no", "take",
  // Generic geographic / dive-feature words that cause false-positive matches
  // (e.g. "Sodwana Bay" ~ "Shark Fin Bay"). A match must share a distinctive
  // proper-noun token, not just one of these.
  "bay", "rock", "rocks", "shoal", "shoals", "point", "bank", "banks", "wall",
  "hole", "blue", "great", "big", "little", "north", "south", "east", "west",
  "atoll", "cay", "cays", "lagoon", "passage", "channel", "corner", "ridge",
  "pass", "head", "two", "city", "coral", "sea", "bommie", "pinnacle", "wreck",
]);

function stripAccents(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function tokens(s) {
  return new Set(
    stripAccents(String(s ?? ""))
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

// Minimal CSV parser (quoted fields, commas, newlines).
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows
    .filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function loadAssessedSites() {
  const csv = await fs.readFile(path.join(CSV_DIR, "designated_implemented.csv"), "utf8");
  const rows = parseCsv(csv);
  // Group zone rows into sites keyed by (country, site_name).
  const sites = new Map();
  for (const r of rows) {
    const key = `${r.country}::${r.site_name}`;
    if (!sites.has(key)) {
      sites.set(key, {
        siteName: r.site_name,
        country: r.country,
        zones: [],
        siteTokens: tokens(r.site_name),
      });
    }
    sites.get(key).zones.push({
      name: r.name,
      level: r.protection_mpaguide_level,
      stage: r.establishment_stage,
      area: Number(r.zone_area_calc || r.zone_area || 0),
      wdpaId: r.wdpa_id ? Number(r.wdpa_id) : undefined,
      mpatlasId: r.mpa_zone_id,
    });
  }
  return [...sites.values()];
}

// Aggregate a matched site's zones into one representative assessment.
// A site may span zones of differing protection — surface that.
function aggregateZones(zones) {
  const statuses = zones.map((z) => mapMpaStatus(z.level, z.stage)).filter(Boolean);
  const distinct = new Set(statuses);
  // Representative zone = largest by area with a mappable status.
  const rep = [...zones]
    .filter((z) => mapMpaStatus(z.level, z.stage))
    .sort((a, b) => (b.area || 0) - (a.area || 0))[0] ?? zones[0];
  return {
    level: rep.level,
    stage: rep.stage,
    mpaGuideStatus: `${rep.level}/${rep.stage}`,
    wdpaId: rep.wdpaId,
    id: String(rep.mpatlasId ?? ""),
    name: rep.name,
    zoneCount: zones.length,
    mixed: distinct.size > 1,
  };
}

async function runCsv(locByLoc, records) {
  let sites;
  try {
    sites = await loadAssessedSites();
  } catch {
    console.warn(
      `MPAtlas CSV export not found under ${path.relative(ROOT, CSV_DIR)}/\n` +
        "  Expected designated_implemented.csv (the no_geo export).",
    );
    return null;
  }
  const byCountry = new Map();
  for (const s of sites) {
    if (!byCountry.has(s.country)) byCountry.set(s.country, []);
    byCountry.get(s.country).push(s);
  }

  const rows = [];
  for (const rec of records) {
    const loc = locByLoc.get(rec.locationId);
    if (!loc) continue;
    const iso3 = ISO3[loc.countryCode];
    const pool = byCountry.get(iso3) ?? [];
    // Match on the location + explicit MPA name only. The free-text
    // visitorImpactNote leaks generic geographic words ("cape", "shark") that
    // produce false positives, so it is deliberately excluded.
    const locTok = tokens(`${loc.name} ${rec.mpaName ?? ""}`);
    // Score each in-country site by distinctive-token overlap with the
    // location name / note. Require the site's own name tokens to be covered.
    const scored = pool
      .map((s) => {
        const overlap = [...s.siteTokens].filter((t) => locTok.has(t));
        const cover = s.siteTokens.size ? overlap.length / s.siteTokens.size : 0;
        return { site: s, overlap, score: overlap.length, cover };
      })
      .filter((x) => x.score >= 1 && x.cover >= 0.5)
      .sort((a, b) => b.cover - a.cover || b.score - a.score);

    let hit = null;
    if (scored.length) {
      const top = scored[0];
      const ambiguous = scored.length > 1 && scored[1].cover === top.cover;
      const agg = aggregateZones(top.site.zones);
      // A multi-zone park has no single status resolvable from no_geo — we
      // cannot know which zone the dive site sits in. Flag low + reason so it
      // is never presented as a confident change.
      const confidence = ambiguous
        ? "low"
        : agg.mixed
          ? "low"
          : top.cover === 1
            ? "high"
            : "medium";
      hit = {
        ...agg,
        coverage: "assessed",
        confidence,
        reason: ambiguous
          ? "ambiguous name match"
          : agg.mixed
            ? "multi-zone park — site's zone unknown without geometry"
            : undefined,
        matchedSite: top.site.siteName,
      };
    }
    rows.push(buildRow(rec, loc, hit, { mode: "csv" }));
  }
  return rows;
}

// ── Full pipeline: point-in-polygon against licensed zone polygons ───────
//
// For each location we test its centroid AND each of its dive-site
// coordinates against the assessed-zone polygons. A single point can fall in
// several overlapping zones (a specific reef MPA plus a basin-scale marine
// mammal sanctuary) — we keep the SMALLEST (most specific) assessed zone,
// which is the reef park a diver actually cares about, not the sanctuary.

function bboxOf(geom) {
  let mnx = 180, mny = 90, mxx = -180, mxy = -90;
  const walk = (c) => {
    if (typeof c[0] === "number") {
      if (c[0] < mnx) mnx = c[0];
      if (c[0] > mxx) mxx = c[0];
      if (c[1] < mny) mny = c[1];
      if (c[1] > mxy) mxy = c[1];
    } else for (const x of c) walk(x);
  };
  walk(geom.coordinates);
  return [mnx, mny, mxx, mxy];
}

// Distance in km from a point to the nearest edge of a polygon, using a local
// equirectangular projection centred on the point (accurate at the few-km
// scale that near-miss recovery cares about). Returns 0 for degenerate rings.
function segDistKm(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function pointToPolygonKm(lng, lat, geom) {
  const latR = (lat * Math.PI) / 180;
  const kx = 111.32 * Math.cos(latR);
  const ky = 110.574;
  let min = Infinity;
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  for (const poly of polys) {
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const ax = (ring[i][0] - lng) * kx, ay = (ring[i][1] - lat) * ky;
        const bx = (ring[i + 1][0] - lng) * kx, by = (ring[i + 1][1] - lat) * ky;
        const d = segDistKm(0, 0, ax, ay, bx, by);
        if (d < min) min = d;
      }
    }
  }
  return min;
}

// Build the reusable zone matcher once: the polygon index, the property-key
// detection, the CSV enrichment join, and the exact / near-miss lookups. Shared
// by the records pass (runFull) and the recordless-location pass (runStandalone)
// so both resolve a dive point against the exact same assessed geometry.
async function buildMatcher(geojson) {
  const props0 = geojson.features?.[0]?.properties ?? {};
  const keys = {
    levelKey: pick(props0, ["protection_mpaguide_level", "mpaguide_protection_level", "protection_level", "lop"]),
    stageKey: pick(props0, ["establishment_stage", "stage", "status"]),
    nameKey: pick(props0, ["name", "zone_name", "site_name", "wdpa_name"]),
    siteKey: pick(props0, ["site_name", "name"]),
    wdpaKey: pick(props0, ["wdpa_id", "wdpaid", "wdpa"]),
    wdpaPidKey: pick(props0, ["wdpa_pid", "wdpapid"]),
  };
  const { levelKey, stageKey, nameKey, siteKey, wdpaKey, wdpaPidKey } = keys;

  // The polygon layer carries only level/stage/wdpa. The richer per-zone
  // attributes (designated/implemented dates, regulations, peer-reviewed
  // reports, MPAtlas zone id) live in the no_geo CSV export. wdpa_pid is the
  // precise zone key but is frequently "None", so join in descending
  // specificity: wdpa_pid → wdpa_id+name → wdpa_id (any zone of the park).
  const csvByPid = new Map();
  const csvByIdName = new Map();
  const csvByWdpaId = new Map();
  const norm = (s) => stripAccents(String(s ?? "")).trim().toLowerCase();
  try {
    const csvRows = parseCsv(await fs.readFile(path.join(CSV_DIR, "designated_implemented.csv"), "utf8"));
    for (const r of csvRows) {
      if (r.wdpa_pid && r.wdpa_pid !== "None") csvByPid.set(String(r.wdpa_pid), r);
      if (r.wdpa_id && r.wdpa_id !== "None") {
        csvByIdName.set(`${r.wdpa_id}::${norm(r.name)}`, r);
        if (!csvByWdpaId.has(String(r.wdpa_id))) csvByWdpaId.set(String(r.wdpa_id), r);
      }
    }
  } catch {
    // CSV absent — matches still work, just without the enrichment fields.
  }
  const enrich = (p) => {
    const pid = p[wdpaPidKey] != null ? String(p[wdpaPidKey]) : null;
    const wid = p[wdpaKey] != null ? String(p[wdpaKey]) : null;
    const c =
      (pid && pid !== "None" && csvByPid.get(pid)) ||
      (wid && csvByIdName.get(`${wid}::${norm(p[nameKey])}`)) ||
      (wid && csvByWdpaId.get(wid)) ||
      null;
    if (!c) return {};
    return {
      mpatlasId: c.mpa_zone_id || undefined,
      designatedDate: c.designated_date || undefined,
      implementedDate: c.implemented_date || undefined,
      regulationsInForce: c.regulations_in_force || undefined,
      affiliatedReports: c.affiliated_reports && c.affiliated_reports !== "None" ? c.affiliated_reports : undefined,
      assessedAt: c.modified_date || undefined,
    };
  };

  // Precompute a bbox + bbox-area per feature to prefilter and to rank
  // overlapping matches by specificity.
  const index = geojson.features
    .filter((f) => f.geometry && (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"))
    .map((f) => {
      const bb = bboxOf(f.geometry);
      return { f, bb, area: (bb[2] - bb[0]) * (bb[3] - bb[1]) };
    });
  // Only zones carrying a real (non-unknown) level are eligible for near-miss
  // recovery — a boundary gap to an unassessed zone gives no protection value.
  const scoredIndex = index.filter((it) => normLevel(it.f.properties[levelKey]) !== "unknown");

  // All assessed zones containing a point, smallest-first.
  const zonesAt = (lng, lat) => {
    const out = [];
    for (const it of index) {
      if (lng < it.bb[0] || lng > it.bb[2] || lat < it.bb[1] || lat > it.bb[3]) continue;
      if (booleanPointInPolygon([lng, lat], it.f)) out.push(it);
    }
    return out.sort((a, b) => a.area - b.area);
  };

  // Nearest scored zone whose boundary is within NEAR_MISS_KM of any candidate
  // point. `ambiguous` flags a second scored zone of a DIFFERENT mapped status
  // equally close — a genuinely uncertain edge that must never auto-apply.
  const nearestScored = (points) => {
    let best = null;
    const within = [];
    const PAD = NEAR_MISS_KM / 100; // ~1.1km per 0.01° lat — generous prefilter
    for (const pt of points) {
      for (const it of scoredIndex) {
        if (pt.lng < it.bb[0] - PAD || pt.lng > it.bb[2] + PAD || pt.lat < it.bb[1] - PAD || pt.lat > it.bb[3] + PAD) continue;
        const d = pointToPolygonKm(pt.lng, pt.lat, it.f.geometry);
        if (d > NEAR_MISS_KM) continue;
        within.push({ it, d });
        if (!best || d < best.distKm) best = { it, distKm: d, pointLabel: pt.label };
      }
    }
    if (!best) return null;
    const bestStatus = mapMpaStatus(best.it.f.properties[levelKey], best.it.f.properties[stageKey]);
    best.ambiguous = within.some(
      (w) => w.it !== best.it && mapMpaStatus(w.it.f.properties[levelKey], w.it.f.properties[stageKey]) !== bestStatus,
    );
    return best;
  };

  const toHit = (it, via) => {
    const p = it.f.properties;
    return {
      name: p[nameKey],
      matchedSite: p[siteKey],
      level: p[levelKey],
      stage: p[stageKey],
      wdpaId: p[wdpaKey],
      mpaGuideStatus: mpaGuideCode(p[levelKey], p[stageKey]),
      coverage: "assessed",
      via,
      ...enrich(p),
    };
  };
  // Prefer the smallest zone that carries a real (non-unknown) level.
  const bestZone = (zones) =>
    zones.find((z) => normLevel(z.f.properties[levelKey]) !== "unknown") ?? zones[0];

  return { keys, zonesAt, nearestScored, toHit, bestZone };
}

// Resolve one location against the assessed geometry: centroid containment
// first, then dive-site containment, then a bounded near-miss to the nearest
// scored boundary. Returns a hit (with confidence/via/reason) or null.
function matchLocation(matcher, loc, siteById) {
  const { keys, zonesAt, nearestScored, toHit, bestZone } = matcher;
  const { levelKey, stageKey } = keys;

  // 1. Location centroid — most representative of "the location".
  if (typeof loc.lat === "number") {
    const z = zonesAt(loc.lng, loc.lat);
    if (z.length) return { ...toHit(bestZone(z), "centroid"), confidence: "high" };
  }
  // 2. Fall back to the location's dive sites. Collect the mapped status at
  //    each site; if they disagree the location spans protection levels.
  if (siteById) {
    const perSite = [];
    for (const sid of loc.siteIds ?? []) {
      const s = siteById.get(sid);
      const lat = s?.lat, lng = s?.lng ?? s?.lon;
      if (typeof lat !== "number" || typeof lng !== "number") continue;
      const z = zonesAt(lng, lat);
      if (z.length) perSite.push(bestZone(z));
    }
    if (perSite.length) {
      const statuses = new Set(
        perSite.map((z) => mapMpaStatus(z.f.properties[levelKey], z.f.properties[stageKey])).filter(Boolean),
      );
      const rep = perSite.sort((a, b) => a.area - b.area)[0];
      let hit = {
        ...toHit(rep, "dive-site"),
        confidence: statuses.size > 1 ? "low" : "medium",
        reason:
          statuses.size > 1
            ? "location spans zones of differing protection — value is the strictest-covered site"
            : "matched via a dive site within the location, not its centroid",
      };
      if (statuses.size > 1) {
        // When sites disagree, surface the strictest as the representative.
        const order = { "no-take": 3, "strict-mpa": 2, "designated-multi-use": 1 };
        const strict = perSite
          .map((z) => ({ z, s: mapMpaStatus(z.f.properties[levelKey], z.f.properties[stageKey]) }))
          .filter((x) => x.s)
          .sort((a, b) => (order[b.s] ?? 0) - (order[a.s] ?? 0))[0];
        if (strict) hit = { ...toHit(strict.z, "dive-site"), confidence: "low", reason: hit.reason };
      }
      return hit;
    }
  }
  // 3. Near-miss: a rough centroid often lands just outside a small reef
  //    reserve. Recover the nearest scored boundary within NEAR_MISS_KM, graded
  //    by how close: sub-km is confident (medium), further out is held (low).
  const points = [];
  if (typeof loc.lat === "number") points.push({ lng: loc.lng, lat: loc.lat, label: "location centroid" });
  for (const sid of loc.siteIds ?? []) {
    const s = siteById?.get(sid);
    const lat = s?.lat, lng = s?.lng ?? s?.lon;
    if (typeof lat === "number" && typeof lng === "number") points.push({ lng, lat, label: `dive site ${sid}` });
  }
  const near = nearestScored(points);
  if (near && !near.ambiguous) {
    return {
      ...toHit(near.it, "near-miss"),
      confidence: near.distKm <= NEAR_MISS_CONFIDENT_KM ? "medium" : "low",
      dist: near.distKm,
      reason: `no zone contains the point; nearest assessed boundary is ${near.distKm.toFixed(1)}km from the ${near.pointLabel}`,
    };
  }
  return null;
}

async function runFull(locByLoc, records, siteById, matcher) {
  const rows = [];
  for (const rec of records) {
    const loc = locByLoc.get(rec.locationId);
    if (!loc) continue;
    const hit = matchLocation(matcher, loc, siteById);
    rows.push(buildRow(rec, loc, hit, { mode: "full" }));
  }
  return rows;
}

// Recordless-location pass: locations with no editorial reef-pressure record
// that nonetheless sit in (or beside) an assessed, scored zone. Their protection
// status is pure MPAtlas data and lands in src/data/mpa-status.json — never a
// fabricated pressure record.
function runStandalone(locations, recIds, siteById, matcher) {
  const rows = [];
  for (const loc of locations) {
    if (recIds.has(loc.id)) continue;
    const hit = matchLocation(matcher, loc, siteById);
    if (!hit) continue;
    const status = mapMpaStatus(hit.level, hit.stage);
    if (!status) continue; // unknown/unassessed level → no confident standalone value
    rows.push(buildStandaloneRow(loc, hit, status));
  }
  return rows;
}

function pick(obj, keys) {
  return keys.find((k) => k in obj) ?? keys[0];
}

// ── Spot-check: centroid match against the live API ──────────────────────
const SPOT_SITES = [
  "raja-ampat-indonesia",
  "komodo-national-park-indonesia",
  "great-barrier-reef-australia",
  "tubbataha-philippines",
  "wolf-galapagos-ecuador",
  "bonaire-national-marine-park-bonaire",
  "sipadan-malaysia",
  "cozumel-mexico",
  "blue-corner-palau",
  "medes-islands-spain",
  "chuuk-lagoon-fsm",
  "north-male-atoll-maldives",
];

async function runSpotCheck(locByLoc, recByLoc, n) {
  const ids = SPOT_SITES.slice(0, n);
  const rows = [];
  for (const id of ids) {
    const loc = locByLoc.get(id);
    const rec = recByLoc.get(id);
    if (!loc || !rec) {
      console.warn(`  ! ${id}: no location/reef-pressure record`);
      continue;
    }
    let hit = null;
    try {
      const q = encodeURIComponent(loc.name);
      const { items = [] } = await api(`/search?query=${q}`);
      await sleep(PACE_MS);
      // Assessed protection level lives only on `zone` (and `site`) records.
      // `wdpa` items are raw boundaries MPAtlas has NOT yet assessed.
      const zones = items.filter((it) => it.type === "zone" || it.type === "site");
      const wdpaOnly = items.filter((it) => it.type === "wdpa");
      if (zones.length) {
        // Search carries no coords — fetch each zone's detail (capped) for
        // lat/lng + level/stage, then keep the nearest within MAX_KM.
        const detailed = [];
        for (const z of zones.slice(0, 6)) {
          const d = await api(`/details/${z.type}s/${z.id}`);
          await sleep(PACE_MS);
          detailed.push({
            name: z.name,
            type: z.type,
            id: String(z.id),
            dist: haversineKm(loc.lat, loc.lng, d.latitude ?? 999, d.longitude ?? 999),
            level: d.mpaguide_protection_level,
            stage: d.establishment_stage,
            mpaGuideStatus: d.mpaguide_status,
            wdpaId: d.wdpa_id,
            designatedYear: d.designated_year,
          });
        }
        const best = detailed
          .filter((z) => z.level != null && z.dist <= MAX_KM)
          .sort((a, b) => a.dist - b.dist)[0];
        if (best) hit = { ...best, coverage: "assessed" };
      }
      if (!hit && wdpaOnly.length) {
        // An MPA exists here but MPAtlas has no MPA Guide assessment for it.
        hit = { name: wdpaOnly[0].name, coverage: "wdpa-only" };
      }
    } catch (err) {
      console.warn(`  ! ${id}: ${err.message}`);
    }
    const row = buildRow(rec, loc, hit, { mode: "spot-check" });
    rows.push(row);
    const verdict =
      row.mpatlasStatus == null
        ? row.coverage === "wdpa-only"
          ? "unassessed (WDPA only)"
          : "no match"
        : row.agree
          ? "same"
          : "CHANGED";
    console.log(
      `  ${id.padEnd(36)} template=${row.templateStatus.padEnd(20)} mpatlas=${(row.mpatlasStatus ?? "—").padEnd(20)} ${verdict}`,
    );
    await sleep(PACE_MS);
  }
  return rows;
}

// ── Shared row builder ───────────────────────────────────────────────────
function buildRow(rec, loc, hit, { mode }) {
  const templateStatus = rec.mpaStatus;
  const locked = rec.mpaStatusSource === "manual";
  const coverage = hit?.coverage ?? "none";
  let mpatlasStatus = null;
  let assessment = null;
  let confidence = "none";
  if (hit && hit.level != null) {
    mpatlasStatus = mapMpaStatus(hit.level, hit.stage);
    assessment = {
      levelOfProtection: normLevel(hit.level),
      stage: normStage(hit.stage),
      mpaGuideStatus: hit.mpaGuideStatus,
      wdpaId: hit.wdpaId ? Number(hit.wdpaId) : undefined,
      mpatlasId: hit.mpatlasId ?? hit.id,
      mpaName: hit.matchedSite ?? hit.name,
      designatedDate: hit.designatedDate,
      implementedDate: hit.implementedDate,
      regulationsInForce: hit.regulationsInForce,
      affiliatedReports: hit.affiliatedReports,
      assessedAt: hit.assessedAt,
    };
    // Drop undefined keys so the stored block stays clean.
    for (const k of Object.keys(assessment)) if (assessment[k] === undefined) delete assessment[k];
    if (mode === "full") confidence = hit.confidence ?? "high";
    else if (mode === "csv") confidence = hit.confidence ?? "medium";
    else confidence = hit.dist == null ? "medium" : hit.dist <= NEAR_KM ? "medium" : "low";
  }
  return {
    locationId: rec.locationId,
    name: loc.name,
    country: loc.country,
    templateStatus,
    mpatlasStatus,
    agree: mpatlasStatus == null ? null : mpatlasStatus === templateStatus,
    locked,
    coverage,
    confidence,
    match: hit
      ? {
          name: hit.matchedSite ?? hit.name,
          type: hit.type,
          distanceKm: hit.dist != null ? Math.round(hit.dist) : undefined,
          level: hit.level,
          stage: hit.stage,
          mpaGuideStatus: hit.mpaGuideStatus,
          designatedYear: hit.designatedYear,
          zoneCount: hit.zoneCount,
          mixedZones: hit.mixed || undefined,
          reason: hit.reason,
          via: hit.via,
        }
      : null,
    assessment,
  };
}

// A row for a location that has no reef-pressure record. Carries the MPAtlas
// assessment only — the shape src/data/mpa-status.json stores, plus review meta.
function buildStandaloneRow(loc, hit, status) {
  const assessment = {
    levelOfProtection: normLevel(hit.level),
    stage: normStage(hit.stage),
    mpaGuideStatus: hit.mpaGuideStatus,
    wdpaId: hit.wdpaId ? Number(hit.wdpaId) : undefined,
    mpatlasId: hit.mpatlasId ?? hit.id,
    mpaName: hit.matchedSite ?? hit.name,
    designatedDate: hit.designatedDate,
    implementedDate: hit.implementedDate,
    regulationsInForce: hit.regulationsInForce,
    affiliatedReports: hit.affiliatedReports,
    assessedAt: hit.assessedAt,
  };
  for (const k of Object.keys(assessment)) if (assessment[k] === undefined) delete assessment[k];
  return {
    locationId: loc.id,
    name: loc.name,
    country: loc.country,
    mpatlasStatus: status,
    confidence: hit.confidence ?? "high",
    via: hit.via,
    distanceKm: hit.dist != null ? Math.round(hit.dist * 10) / 10 : undefined,
    reason: hit.reason,
    assessment,
  };
}

// ── Review writers ───────────────────────────────────────────────────────
async function writeReview(rows, mode, standalone = []) {
  await fs.mkdir(path.dirname(REVIEW_JSON), { recursive: true });
  await fs.writeFile(REVIEW_JSON, JSON.stringify({ mode, rows, standalone }, null, 2) + "\n");

  // Standalone matches trustworthy enough to store (see standaloneAccepted).
  // The rest are surfaced as candidates for manual confirmation, never stored.
  const standaloneWritable = standalone.filter(standaloneAccepted);
  const standaloneHeld = standalone.filter((s) => s.mpatlasStatus && !standaloneAccepted(s));

  const matched = rows.filter((r) => r.mpatlasStatus != null);
  const diffs = matched.filter((r) => r.agree === false);
  const actionable = diffs.filter((r) => r.confidence === "high" || r.confidence === "medium");
  const needsGeometry = diffs.filter((r) => r.confidence === "low");
  const unmatched = rows.filter((r) => r.mpatlasStatus == null);
  const wdpaOnly = unmatched.filter((r) => r.coverage === "wdpa-only");
  const noMpa = unmatched.filter((r) => r.coverage !== "wdpa-only");

  const line = (r) =>
    `| ${r.name} | ${r.templateStatus} | ${r.mpatlasStatus ?? "—"} | ${r.confidence}${
      r.match?.via ? `/${r.match.via}` : ""
    }${r.match?.distanceKm != null ? ` (${r.match.distanceKm}km)` : ""} | ${
      r.match
        ? `${r.match.name} · ${r.match.level}/${r.match.stage}${r.match.reason ? ` — _${r.match.reason}_` : ""}`
        : "—"
    } |`;
  const HEAD = `| Site | Template | MPAtlas | Confidence/via | Matched MPA · MPA Guide |\n|---|---|---|---|---|`;

  const md = [
    `# MPA-status review — ${mode}`,
    "",
    `Generated by \`scripts/fetch-mpa-status.mjs\`. Template values are the current`,
    `regional-template guesses; MPAtlas values are derived from live MPA Guide`,
    `assessments (level of protection + establishment stage).`,
    "",
    `- sites checked: **${rows.length}**`,
    `- matched to an MPAtlas assessment: **${matched.length}**`,
    `- **would change** vs template: **${diffs.length}**`,
    `- MPA exists but MPAtlas has not assessed it (WDPA only): **${wdpaOnly.length}**`,
    `- no MPA found at all: **${noMpa.length}**`,
    mode === "spot-check"
      ? `\n> Spot-check uses centroid matching against the live API, so treat "low"\n> confidence rows as indicative. The \`--full\` run (point-in-polygon on the\n> licensed download) removes this ambiguity.`
      : "",
    "",
    `## Actionable changes — high/medium confidence, single-zone (${actionable.length})`,
    "",
    `Safe to apply after a look. Single-zone MPAs where the assessed level is`,
    `unambiguous.`,
    "",
    HEAD,
    ...actionable.map(line),
    "",
    `## Changes that need geometry — multi-zone or ambiguous (${needsGeometry.length})`,
    "",
    `Do NOT apply from this run. The park spans zones of differing protection`,
    `and no_geo cannot tell which zone the dive site sits in — a geometry-based`,
    `(--full) join is required.`,
    "",
    HEAD,
    ...needsGeometry.map(line),
    "",
    `## Confirmed same (${matched.length - diffs.length})`,
    "",
    HEAD,
    ...matched.filter((r) => r.agree === true).map(line),
    "",
    `## MPA present but unassessed by MPAtlas — WDPA only (${wdpaOnly.length})`,
    "",
    `These have a real protected-area boundary but no MPA Guide score, so we`,
    `cannot claim an enforcement level. Correct value is a WDPA-backed`,
    `\`designated-multi-use\` pending assessment, not the template's guess.`,
    "",
    ...wdpaOnly.map(
      (r) => `- ${r.name} (${r.country}) — template says \`${r.templateStatus}\`; matched WDPA area: ${r.match?.name ?? "—"}`,
    ),
    "",
    `## No MPA found (${noMpa.length})`,
    "",
    ...noMpa.map((r) => `- ${r.name} (${r.country}) — template says \`${r.templateStatus}\``),
    "",
    `## New standalone coverage — locations with no reef-pressure record (${standaloneWritable.length})`,
    "",
    `Locations whose own centre sits inside a real site-level assessed zone but`,
    `have no editorial reef-pressure record. Written to \`src/data/mpa-status.json\``,
    `on \`--apply\` — pure MPAtlas assessment, no invented pressure copy.`,
    "",
    `| Site | MPAtlas | Confidence/via | Matched MPA |\n|---|---|---|---|`,
    ...standaloneWritable.map(
      (s) =>
        `| ${s.name} (${s.country}) | ${s.mpatlasStatus} | ${s.confidence}/${s.via}${
          s.distanceKm != null ? ` (${s.distanceKm}km)` : ""
        } | ${s.assessment?.mpaName ?? "—"} |`,
    ),
    "",
    `## Standalone candidates — NOT stored, need manual confirmation (${standaloneHeld.length})`,
    "",
    `Matched a zone but not auto-stored: reached via a single dive site in a broad`,
    `region, a near-miss to a boundary, or a basin-scale mammal / EEZ sanctuary`,
    `(Pelagos, Agoa, Humpback) that is not this reef's own protection. Confirm by`,
    `hand before promoting any of these.`,
    "",
    ...standaloneHeld.map(
      (s) =>
        `- ${s.name} (${s.country}) — ${s.mpatlasStatus} via ${s.via}${
          s.distanceKm != null ? ` (${s.distanceKm}km)` : ""
        } → ${s.assessment?.mpaName ?? "—"}`,
    ),
    "",
  ].join("\n");

  await fs.writeFile(REVIEW_MD, md + "\n");
  return {
    matched: matched.length,
    diffs: diffs.length,
    wdpaOnly: wdpaOnly.length,
    noMpa: noMpa.length,
    standalone: standaloneWritable.length,
    standaloneHeld: standaloneHeld.length,
  };
}

// Write the standalone MPAtlas protection file consumed by the app. Fully
// machine-derived and regenerated each run (no manual locks live here), so it
// is rewritten wholesale from the confident standalone matches.
async function writeStandalone(standalone, today) {
  const writable = standalone
    .filter(standaloneAccepted)
    .sort((a, b) => a.locationId.localeCompare(b.locationId))
    .map((s) => ({
      locationId: s.locationId,
      mpaStatus: s.mpatlasStatus,
      mpaStatusSource: "mpatlas",
      mpaAssessment: s.assessment,
      matchVia: s.via,
      ...(s.distanceKm != null ? { matchDistanceKm: s.distanceKm } : {}),
      lastReviewedAt: today,
    }));
  await fs.writeFile(MPA_STATUS_PATH, JSON.stringify(writable, null, 2) + "\n");
  return writable.length;
}

// Reviewer decisions: keep the current value even though geometry produced a
// confident match. A single centroid cannot represent a large multi-use park.
const APPLY_HOLD = new Set([
  "great-barrier-reef-australia", // 15-zone park spanning full→incompatible; stays designated-multi-use
]);

// A standalone match (a location with no reef-pressure record) is trustworthy
// enough to STORE only when:
//  - the location's own centroid sits in the zone (not a single dive site in a
//    broad region, and not a near-miss to a boundary), and
//  - the matched zone is real site-level reef protection — NOT a basin-scale
//    marine-mammal / EEZ sanctuary (Pelagos, Agoa, Humpback), a bare buffer
//    zone, or the Great Barrier Reef umbrella (held as multi-use elsewhere).
// Everything else is surfaced in the review as a manual-confirmation candidate.
function standaloneAccepted(s) {
  if (s.confidence !== "high" && s.confidence !== "medium") return false;
  if (s.via !== "centroid") return false;
  if (APPLY_HOLD.has(s.locationId)) return false;
  const name = String(s.assessment?.mpaName ?? "").toLowerCase();
  if (/sanctuary|mammal|cetacean|whale|pelagos|agoa|great barrier reef/.test(name)) return false;
  if (/\bbuffer\b/.test(name)) return false;
  return true;
}

// Apply high/medium-confidence, non-locked, non-held changes to
// reef-pressure.json with full MPAtlas provenance. Also fixes the legacy
// fishingPressure "medium" typo. Prints exactly what changed vs what was held.
async function applyChanges(rows, records) {
  const byLoc = new Map(records.map((r) => [r.locationId, r]));
  const today = new Date().toISOString().slice(0, 10);
  const applied = [];
  const confirmed = [];
  const refreshed = [];
  const held = [];
  for (const row of rows) {
    if (row.mpatlasStatus == null) continue; // no assessment to apply
    const rec = byLoc.get(row.locationId);
    if (!rec) continue;
    if (rec.mpaStatusSource === "manual") {
      if (row.agree === false) held.push([row.locationId, "manual lock"]);
      continue;
    }
    if (row.confidence !== "high" && row.confidence !== "medium") {
      if (row.agree === false) held.push([row.locationId, `${row.confidence} confidence`]);
      continue;
    }
    if (APPLY_HOLD.has(row.locationId)) {
      if (row.agree === false) held.push([row.locationId, "reviewer hold"]);
      continue;
    }
    if (row.agree === false) {
      // New / changed status — apply it with full provenance.
      rec.mpaStatus = row.mpatlasStatus;
      rec.mpaStatusSource = "mpatlas";
      if (row.assessment) rec.mpaAssessment = row.assessment;
      rec.sourceIds = Array.from(new Set([...(rec.sourceIds ?? []), "mpatlas"]));
      rec.lastReviewedAt = today;
      applied.push([row.locationId, `${row.templateStatus} → ${row.mpatlasStatus}`]);
    } else if (rec.mpaStatusSource === "mpatlas" && row.assessment) {
      // Already MPAtlas-sourced and still agrees: refresh the provenance block
      // so newly-added enrichment fields (dates, regulations, reports) land
      // without flipping any status.
      const before = JSON.stringify(rec.mpaAssessment ?? null);
      if (before !== JSON.stringify(row.assessment)) {
        rec.mpaAssessment = row.assessment;
        rec.lastReviewedAt = today;
        refreshed.push([row.locationId, "provenance refreshed"]);
      }
    } else if (row.assessment) {
      // Template guess that MPAtlas independently confirms. The status is
      // unchanged (it already equalled the assessed value), so this only
      // upgrades the provenance from an editorial guess to a real MPA Guide
      // assessment and attaches the traceability block.
      rec.mpaStatusSource = "mpatlas";
      rec.mpaAssessment = row.assessment;
      rec.sourceIds = Array.from(new Set([...(rec.sourceIds ?? []), "mpatlas"]));
      rec.lastReviewedAt = today;
      confirmed.push([row.locationId, `confirmed ${rec.mpaStatus} (was template)`]);
    }
  }
  let typoFixed = 0;
  for (const r of records) {
    if (r.fishingPressure === "medium") { r.fishingPressure = "moderate"; typoFixed++; }
  }
  await fs.writeFile(RP_PATH, JSON.stringify(records, null, 2) + "\n");
  return { applied, confirmed, refreshed, held, typoFixed };
}

async function main() {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--")) ?? "--full";
  const [flag, val] = arg.replace(/^--/, "").split("=");

  const locations = JSON.parse(await fs.readFile(LOC_PATH, "utf8"));
  const records = JSON.parse(await fs.readFile(RP_PATH, "utf8"));
  const locByLoc = new Map(locations.map((l) => [l.id, l]));
  const recByLoc = new Map(records.map((r) => [r.locationId, r]));

  let rows;
  let standalone = [];
  let mode;
  if (flag === "spot-check") {
    mode = "spot-check";
    const n = Number(val) || 12;
    console.log(`Spot-check: ${n} sites via live MPAtlas API\n`);
    rows = await runSpotCheck(locByLoc, recByLoc, n);
  } else if (flag === "csv") {
    mode = "csv";
    console.log("Offline join: country + name match against the MPAtlas no_geo CSV export\n");
    rows = await runCsv(locByLoc, records);
    if (rows == null) return;
  } else {
    mode = "full";
    console.log("Full pipeline: point-in-polygon against local MPAtlas zone polygons\n");
    let siteById;
    try {
      const sites = JSON.parse(await fs.readFile(path.join(ROOT, "src/data/sites.json"), "utf8"));
      siteById = new Map(sites.map((s) => [s.id, s]));
    } catch {
      siteById = null;
    }
    let geojson;
    try {
      geojson = JSON.parse(await fs.readFile(GEOJSON_PATH, "utf8"));
    } catch {
      console.warn(
        "MPAtlas zone polygons not found at data/external/mpatlas-zones.geojson\n" +
          "  Download the assessed-MPA geodatabase (login) from\n" +
          "  https://guide.mpatlas.org/data/download/ then:\n" +
          "    ogr2ogr -f GeoJSON -t_srs EPSG:4326 data/external/mpatlas-zones.geojson \\\n" +
          "      MPAtlas.gdb MPA_zone_designated_implemented_poly\n" +
          "  Or run with --csv / --spot-check to work without the geodatabase.",
      );
      return; // dataset absent — instructions printed
    }
    const matcher = await buildMatcher(geojson);
    // Records pass (writes into reef-pressure.json) + recordless pass (writes
    // the standalone src/data/mpa-status.json). Both share the same geometry.
    rows = await runFull(locByLoc, records, siteById, matcher);
    const recIds = new Set(records.map((r) => r.locationId));
    standalone = runStandalone(locations, recIds, siteById, matcher);
  }

  const summary = await writeReview(rows, mode, standalone);
  console.log("");
  console.log(`Review written to ${path.relative(ROOT, REVIEW_MD)}`);
  console.log(
    `  matched: ${summary.matched}  would-change: ${summary.diffs}  wdpa-only: ${summary.wdpaOnly}  no-mpa: ${summary.noMpa}`,
  );
  if (mode === "full") {
    console.log(
      `  standalone (new coverage, no record): ${summary.standalone} writable, ${summary.standaloneHeld} held for review`,
    );
  }

  if (process.argv.includes("--apply")) {
    const { applied, confirmed, refreshed, held, typoFixed } = await applyChanges(rows, records);
    console.log("");
    console.log(`Applied ${applied.length} change(s) to ${path.relative(ROOT, RP_PATH)}:`);
    for (const [id, change] of applied) console.log(`  ✓ ${id.padEnd(34)} ${change}`);
    if (confirmed.length) {
      console.log(`Upgraded ${confirmed.length} template → mpatlas (status unchanged):`);
      for (const [id, why] of confirmed) console.log(`  ✓ ${id.padEnd(34)} ${why}`);
    }
    if (refreshed.length) {
      console.log(`Refreshed provenance on ${refreshed.length} (no status change):`);
      for (const [id, why] of refreshed) console.log(`  ↻ ${id.padEnd(34)} ${why}`);
    }
    if (held.length) {
      console.log(`Held ${held.length} (not applied):`);
      for (const [id, why] of held) console.log(`  · ${id.padEnd(34)} ${why}`);
    }
    if (typoFixed) console.log(`Fixed ${typoFixed} legacy fishingPressure "medium" → "moderate".`);
    if (mode === "full") {
      const today = new Date().toISOString().slice(0, 10);
      const n = await writeStandalone(standalone, today);
      console.log("");
      console.log(`Wrote ${n} standalone MPAtlas record(s) to ${path.relative(ROOT, MPA_STATUS_PATH)}.`);
    }
  } else {
    console.log("  Nothing written to reef-pressure.json / mpa-status.json — review, then re-run with --apply.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
