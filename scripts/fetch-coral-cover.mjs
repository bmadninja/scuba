#!/usr/bin/env node
/**
 * Wave v2.1 — Coral cover refresh from NCRMP + AGRRA.
 *
 * NCRMP and AGRRA both publish jurisdiction-level coral cover means in
 * PDF status reports + Healthy Reefs Initiative card downloads, not in
 * a single queryable API. (NCRMP raw data lives on NOAA NCEI as multi-
 * GB CSV bundles per cycle; AGRRA has an interactive data-explorer
 * around a non-public-API backend.) This script does two things:
 *
 *   1. Validates that the URLs in src/data/coral-cover.json are still
 *      reachable (HEAD request per source). If any are 404, it prints
 *      a warning so a maintainer can re-cite. It does NOT auto-rewrite
 *      coral-cover.json — the cover values are human-curated from
 *      published reports and should not be edited by a robot.
 *
 *   2. Bumps `lastBuiltAt` to today.
 *
 * When NCRMP/AGRRA publish a queryable API in the future, the body of
 * this script becomes the place to wire it in. For now: validation +
 * timestamp.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const CC_PATH = path.join(ROOT, "src/data/coral-cover.json");

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "scubaseason.fun coral-cover validation" },
    });
    return res.status < 400;
  } catch {
    return false;
  }
}

async function main() {
  const raw = await fs.readFile(CC_PATH, "utf8");
  const data = JSON.parse(raw);
  const failures = [];
  for (const j of data.jurisdictions) {
    if (j.sourceUrl) {
      const ok = await headOk(j.sourceUrl);
      console.log(`  ${ok ? "ok " : "!! "} ${j.id.padEnd(28)} ${j.sourceUrl}`);
      if (!ok) failures.push({ id: j.id, url: j.sourceUrl });
    }
  }
  data.lastBuiltAt = new Date().toISOString().slice(0, 10);
  await fs.writeFile(CC_PATH, JSON.stringify(data, null, 2) + "\n");
  console.log("");
  console.log(`coral-cover.json refreshed @ ${data.lastBuiltAt}`);
  console.log(`  jurisdictions: ${data.jurisdictions.length}`);
  console.log(`  unreachable:   ${failures.length}`);
  if (failures.length > 0) {
    console.warn(
      "\nSome citation URLs failed HEAD checks — re-cite in src/data/coral-cover.json:",
    );
    for (const f of failures) console.warn(`  - ${f.id}: ${f.url}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
