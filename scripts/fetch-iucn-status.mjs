#!/usr/bin/env node
/**
 * Wave v2.1 — IUCN Red List status refresh.
 *
 * Reads every scientific name we display (from encounters + sites) and,
 * for each unique binomial, queries the IUCN Red List API for the
 * current category + population trend + last-assessed year. Writes
 * back to src/data/iucn-status.json keyed by lowercased binomial.
 *
 *   docs:  https://api.iucnredlist.org/
 *   key:   register at https://api.iucnredlist.org/ for a free key and
 *          set IUCN_API_KEY in .env.local (gitignored).
 *
 * If IUCN_API_KEY is unset, the script logs a warning and exits 0 — the
 * seeded values in iucn-status.json continue to be used at build time.
 *
 * Pace: 1s between requests (IUCN API is rate-limited).
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const ENC_PATH = path.join(ROOT, "src/data/encounters.json");
const SITES_PATH = path.join(ROOT, "src/data/sites.json");
const OUT_PATH = path.join(ROOT, "src/data/iucn-status.json");

const KEY = process.env.IUCN_API_KEY;
// 1.2s between binomials — each binomial does up to 2 API calls (taxa
// lookup + assessment detail for population trend), so this caps us at
// ~3000 requests over a full run of ~260 binomials.
const PACE_MS = 1200;
const API_BASE = "https://api.iucnredlist.org/api/v4/taxa/scientific_name";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const CATEGORY_LABEL = {
  EX: "Extinct",
  EW: "Extinct in the Wild",
  CR: "Critically Endangered",
  EN: "Endangered",
  VU: "Vulnerable",
  NT: "Near Threatened",
  LC: "Least Concern",
  DD: "Data Deficient",
  NE: "Not Evaluated",
};

function collectBinomials(encounters, sites) {
  const set = new Set();
  for (const e of encounters) {
    if (e.speciesScientific) {
      for (const name of e.speciesScientific.split(",")) {
        const trimmed = name.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  for (const s of sites) {
    for (const sp of s.species ?? []) {
      if (sp.scientificName) set.add(sp.scientificName.trim());
    }
  }
  return Array.from(set);
}

const ASSESSMENT_BASE = "https://api.iucnredlist.org/api/v4/assessment";

async function fetchOne(binomial) {
  const parts = binomial.split(/\s+/);
  if (parts.length < 2) return null;
  const [genus, species] = parts;
  const url =
    `${API_BASE}?genus_name=${encodeURIComponent(genus)}&species_name=${encodeURIComponent(species)}`;
  const res = await fetch(url, {
    headers: { Authorization: KEY, Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();
  // v4 taxa/scientific_name returns { taxon, assessments[] } — pick the
  // latest global assessment. assessments[].latest is a boolean.
  const assessments = (json?.assessments ?? [])
    .filter((a) => {
      const scopes = a?.scopes ?? [];
      const isGlobal = scopes.length === 0 || scopes.some((s) => s?.code === "1");
      return isGlobal;
    })
    .sort((a, b) => Number(b?.year_published ?? 0) - Number(a?.year_published ?? 0));
  if (assessments.length === 0) return null;
  const latest = assessments.find((a) => a?.latest === true) ?? assessments[0];
  const category = latest?.red_list_category_code ?? "NE";
  const year = Number(latest?.year_published);
  const assessmentUrl =
    latest?.url ?? `https://www.iucnredlist.org/species/${latest?.sis_taxon_id ?? ""}`;

  // population_trend isn't on the taxa list response — fetch the
  // assessment detail to get it. Best-effort; on failure, fall back to
  // "unknown" rather than killing the whole binomial.
  let populationTrend = "unknown";
  const assessmentId = latest?.assessment_id;
  if (assessmentId) {
    try {
      const detailRes = await fetch(`${ASSESSMENT_BASE}/${assessmentId}`, {
        headers: { Authorization: KEY, Accept: "application/json" },
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const trendDesc = (
          detail?.population_trend?.description?.en ?? ""
        ).toLowerCase();
        if (["increasing", "decreasing", "stable", "unknown"].includes(trendDesc)) {
          populationTrend = trendDesc;
        }
      }
    } catch {
      // ignore — keep "unknown"
    }
  }

  return {
    category,
    categoryLabel: CATEGORY_LABEL[category] ?? category,
    populationTrend,
    lastAssessedYear: Number.isFinite(year) ? year : undefined,
    assessmentUrl,
  };
}

async function main() {
  if (!KEY) {
    console.warn(
      "IUCN_API_KEY not set — skipping IUCN refresh.\n" +
        "  Register at https://api.iucnredlist.org/ and add\n" +
        "  IUCN_API_KEY=... to .env.local to enable.\n" +
        "  Build continues using the seeded src/data/iucn-status.json values.",
    );
    return;
  }

  const encounters = JSON.parse(await fs.readFile(ENC_PATH, "utf8"));
  const sites = JSON.parse(await fs.readFile(SITES_PATH, "utf8"));
  const existing = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
  const binomials = collectBinomials(encounters, sites);

  const existingByName = new Map();
  for (const r of existing.records ?? []) {
    existingByName.set(r.scientificName.toLowerCase(), r);
  }

  const fetchedAt = new Date().toISOString();
  const records = [];
  const failures = [];

  for (const name of binomials) {
    try {
      const result = await fetchOne(name);
      if (!result) {
        const prev = existingByName.get(name.toLowerCase());
        if (prev) records.push(prev);
        else failures.push({ name, reason: "not found" });
      } else {
        records.push({
          scientificName: name.toLowerCase(),
          commonName:
            existingByName.get(name.toLowerCase())?.commonName ?? undefined,
          category: result.category,
          categoryLabel: result.categoryLabel,
          populationTrend: result.populationTrend,
          lastAssessedYear: result.lastAssessedYear,
          assessmentUrl: result.assessmentUrl,
          source: "iucn-red-list",
          fetchedAt,
        });
        console.log(`  ${name.padEnd(40)} → ${result.category}`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      failures.push({ name, reason });
      const prev = existingByName.get(name.toLowerCase());
      if (prev) records.push(prev);
      console.warn(`  ! ${name}: ${reason}`);
    }
    await sleep(PACE_MS);
  }

  const out = {
    ...existing,
    lastBuiltAt: fetchedAt.slice(0, 10),
    records,
  };
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("");
  console.log(`IUCN refresh complete @ ${fetchedAt}`);
  console.log(`  binomials: ${binomials.length}`);
  console.log(`  updated:   ${records.length}`);
  console.log(`  failed:    ${failures.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
