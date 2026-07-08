#!/usr/bin/env node
/**
 * Merge sharded sightings outputs into src/data/sightings.json.
 *
 * fetch-sightings-live.mjs run with --shards K --shard I writes only the
 * records it owns to src/data/.sightings-shard-<I>.json. This script reads the
 * existing sightings.json plus every shard file, overlays each shard's records
 * by id (a record is owned by exactly one shard, so there is never a
 * conflict), carries through any existing record no shard touched, and writes
 * the assembled file back. It then deletes the shard files.
 *
 * Why a separate merge step: running the K shards in parallel CI jobs is what
 * keeps the whole refresh under the 6-hour ceiling. Each job produces a
 * partial; this step is the barrier that reassembles them into one file.
 *
 * Safety:
 *   - With --shards K, every shard file 0..K-1 must be present, or the merge
 *     aborts (a missing shard would silently drop ~1/K of the data).
 *   - If the merged record count falls below MIN_RETENTION of the existing
 *     count, the merge aborts without writing (guards against a mass wipe).
 *
 * Flags:
 *   --shards K   expected shard count; assert all K shard files exist.
 *   --dry-run    report what would be written, do not write or delete.
 *   --keep       do not delete shard files after a successful merge.
 */

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const DATA_DIR = path.join(ROOT, "src/data");
const SIGHT_PATH = path.join(DATA_DIR, "sightings.json");
const SHARD_RE = /^\.sightings-shard-(\d+)\.json$/;

// Never write a merged file smaller than this fraction of the prior file.
const MIN_RETENTION = 0.9;

function parseArgs(argv) {
  const args = { shards: null, dryRun: false, keep: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--shards") args.shards = Number(argv[++i]);
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--keep") args.keep = true;
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const existing = JSON.parse(await fs.readFile(SIGHT_PATH, "utf8"));

  // Discover shard files.
  const entries = await fs.readdir(DATA_DIR);
  const shardFiles = entries
    .map((name) => {
      const m = name.match(SHARD_RE);
      return m ? { name, index: Number(m[1]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);

  if (shardFiles.length === 0) {
    console.error("FAIL: no .sightings-shard-*.json files found — nothing to merge.");
    process.exit(1);
  }

  // If an expected count is given, insist every shard is present.
  if (args.shards != null) {
    const found = new Set(shardFiles.map((s) => s.index));
    const missing = [];
    for (let i = 0; i < args.shards; i += 1) if (!found.has(i)) missing.push(i);
    if (missing.length > 0) {
      console.error(
        `FAIL: expected ${args.shards} shards but shard file(s) [${missing.join(", ")}] are missing. ` +
          `Refusing to merge a partial set (would drop ~${Math.round((missing.length / args.shards) * 100)}% of records).`,
      );
      process.exit(1);
    }
  }

  // Existing records, keyed by id, in original order.
  const byId = new Map(existing.map((r) => [r.id, r]));
  const order = existing.map((r) => r.id);
  const seenOrder = new Set(order);

  let overlaid = 0;
  let added = 0;
  const perShard = [];

  for (const { name, index } of shardFiles) {
    const records = JSON.parse(await fs.readFile(path.join(DATA_DIR, name), "utf8"));
    perShard.push({ index, count: records.length });
    for (const rec of records) {
      if (!rec || typeof rec.id !== "string") continue;
      if (byId.has(rec.id)) {
        overlaid += 1;
      } else {
        added += 1;
        order.push(rec.id);
        seenOrder.add(rec.id);
      }
      byId.set(rec.id, rec);
    }
  }

  const merged = order.map((id) => byId.get(id));

  console.log(`Merging ${shardFiles.length} shard file(s):`);
  for (const s of perShard) console.log(`  shard ${s.index}: ${s.count} records`);
  console.log(`  existing:        ${existing.length}`);
  console.log(`  overlaid (updated): ${overlaid}`);
  console.log(`  added (new):        ${added}`);
  console.log(`  merged total:       ${merged.length}`);

  if (merged.length < existing.length * MIN_RETENTION) {
    console.error(
      `\nFAIL: merged ${merged.length} records is below ${Math.round(MIN_RETENTION * 100)}% ` +
        `of the existing ${existing.length}. Refusing to write.`,
    );
    process.exit(1);
  }

  if (args.dryRun) {
    console.log("\n[DRY RUN] Not writing sightings.json and not deleting shard files.");
    return;
  }

  await fs.writeFile(SIGHT_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(`\nWrote ${merged.length} records to src/data/sightings.json`);

  if (!args.keep) {
    for (const { name } of shardFiles) {
      await fs.rm(path.join(DATA_DIR, name));
    }
    console.log(`Deleted ${shardFiles.length} shard file(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
