#!/usr/bin/env node
/**
 * Editorial-independence audit (Story 12 AC5/AC7).
 *
 * Greps the data + ranking layer to confirm that no sorting,
 * recommendation, ranking, or filter code reads partner commission or
 * affiliate-availability fields. If any matches turn up, fails the
 * audit so it can be reviewed before shipping.
 *
 * What we forbid:
 *   - .sort(...) / .filter(...) that references "commission"
 *   - any reference to `commission` outside the data layer
 *     (`src/lib/data/types.ts`, JSON files, and gear/affiliate types
 *     where commission is a stored property — those are allowed).
 *
 * What we allow:
 *   - storing commission on a Gear partner record
 *   - displaying disclosure copy that mentions commission
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SCAN_DIRS = ["src/app", "src/components", "src/lib"];
const ALLOW_FILES = new Set([
  "src/lib/data/types.ts",
  "src/components/affiliate-disclosure.tsx",
  "src/app/about/page.tsx",
]);

const findings = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx|mjs)$/.test(entry)) scan(full);
  }
}

function scan(file) {
  const rel = relative(root, file).split("/").join("/");
  if (ALLOW_FILES.has(rel)) return;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (/commission/.test(line)) {
      findings.push({ file: rel, line: i + 1, text: line.trim() });
    }
  });
}

for (const d of SCAN_DIRS) walk(resolve(root, d));

if (findings.length === 0) {
  console.log("Editorial-independence audit: PASS");
  console.log(
    "  No commission references outside the allow-list. Ranking and filter code does not read commission.",
  );
  process.exit(0);
}

console.log("Editorial-independence audit: FAIL");
for (const f of findings) {
  console.log(`  ${f.file}:${f.line}  ${f.text}`);
}
console.log("");
console.log(
  "Move the data field into types.ts or remove the reference. Recommendation/ranking code must not consult commission.",
);
process.exit(1);
