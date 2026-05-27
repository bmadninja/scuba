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
const PACE_MS = 1000;
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

async function fetchOne(binomial) {
  const url = `${API_BASE}/${encodeURIComponent(binomial)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: KEY,
      Accept: "application/json",
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = await res.json();
  // v4 returns a taxon with assessments[]; pick the latest published one.
  const assessments = (json?.assessments ?? json?.taxon?.assessments ?? [])
    .filter((a) => a?.latest === true || a?.published);
  if (assessments.length === 0) return null;
  assessments.sort((a, b) => (b?.year_published ?? 0) - (a?.year_published ?? 0));
  const a = assessments[0];
  const category = a?.red_list_category?.code ?? a?.category ?? "NE";
  const trend = (a?.population_trend ?? "").toLowerCase();
  const populationTrend = ["increasing", "decreasing", "stable", "unknown"].includes(
    trend,
  )
    ? trend
    : "unknown";
  return {
    category,
    categoryLabel: CATEGORY_LABEL[category] ?? category,
    populationTrend,
    lastAssessedYear: a?.year_published ?? a?.assessment_year ?? undefined,
    assessmentUrl: a?.url ?? `https://www.iucnredlist.org/search?query=${encodeURIComponent(binomial)}`,
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
