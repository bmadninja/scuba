/**
 * Regression + unit tests for the fishing-pressure / reef-state model.
 * Runs the real pure functions from src/lib/data/effective-fishing.ts and
 * re-derives reef state against the actual data files.
 *
 *   node --experimental-strip-types scripts/verify-fishing-model.ts
 *
 * No test framework in this repo; this is a self-contained assert harness.
 */
import fs from "node:fs";
import {
  editorialEffortLevel,
  fishingAllowsImproving,
  fishingTrend,
  gfwEffortLevel,
  reconcile,
} from "../src/lib/data/effective-fishing.ts";

let failures = 0;
function eq(actual: unknown, expected: unknown, msg: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`  ✗ ${msg}: expected ${e}, got ${a}`);
  }
}

// ── Unit: gfwEffortLevel band boundaries ────────────────────────────────
eq(gfwEffortLevel(0), "low", "0h → low");
eq(gfwEffortLevel(199), "low", "199h → low");
eq(gfwEffortLevel(200), "moderate", "200h → moderate");
eq(gfwEffortLevel(2499), "moderate", "2499h → moderate");
eq(gfwEffortLevel(2500), "high", "2500h → high");
eq(gfwEffortLevel(24999), "high", "24999h → high");
eq(gfwEffortLevel(25000), "very-high", "25000h → very-high");
eq(gfwEffortLevel(null), "unknown", "null → unknown");

// ── Unit: reconcile matrix ──────────────────────────────────────────────
eq(reconcile("low", "no-take"), "protected", "low + no-take → protected");
eq(reconcile("low", "strict-mpa"), "protected", "low + strict-mpa → protected");
eq(reconcile("low", "designated-multi-use"), "low", "low + multi-use → low");
eq(reconcile("low", null), "low", "low + none → low");
eq(reconcile("moderate", "no-take"), "moderate", "moderate + no-take → moderate (no boost)");
eq(reconcile("high", "no-take"), "paper-park", "high + no-take → paper-park");
eq(reconcile("very-high", "strict-mpa"), "paper-park", "very-high + strict → paper-park");
eq(reconcile("high", "designated-multi-use"), "high", "high + multi-use → high");
eq(reconcile("unknown", "no-take"), "unknown", "unknown + no-take → unknown");

// ── Unit: trend ─────────────────────────────────────────────────────────
eq(fishingTrend(200, 100), "rising", "2x → rising");
eq(fishingTrend(100, 200), "falling", "0.5x → falling");
eq(fishingTrend(100, 100), "stable", "1x → stable");
eq(fishingTrend(5, 0), "rising", "from zero baseline → rising");
eq(fishingTrend(0, 0), "stable", "0 from 0 → stable");
eq(fishingTrend(null, 100), "unknown", "no current → unknown");
eq(fishingTrend(100, null), "unknown", "no baseline → unknown");

// ── Unit: improving gate + editorial fallback ───────────────────────────
for (const e of ["protected", "low", "unknown"] as const) eq(fishingAllowsImproving(e), true, `${e} allows improving`);
for (const e of ["moderate", "high", "very-high", "paper-park"] as const) eq(fishingAllowsImproving(e), false, `${e} blocks improving`);
eq(editorialEffortLevel("medium"), "moderate", "editorial medium → moderate");
eq(editorialEffortLevel("very-high"), "high", "editorial very-high → high");
eq(editorialEffortLevel(undefined), "unknown", "editorial undefined → unknown");

// ── Regression: reef-state distribution against real data ───────────────
const read = (p: string) => JSON.parse(fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const rp = read("src/data/reef-pressure.json") as any[];
const gfwRaw = read("src/data/fishing-pressure.json") as { records: any[] };
const rhRaw = read("src/data/reef-health.json") as any;
const rhList: any[] = Array.isArray(rhRaw) ? rhRaw : rhRaw.records ?? [];

const gfw = new Map(gfwRaw.records.map((r) => [r.locationId, r]));
const rpBy = new Map(rp.map((r) => [r.locationId, r]));
const health = new Map<string, any[]>();
for (const r of rhList) {
  const arr = health.get(r.locationId) ?? [];
  arr.push(r);
  health.set(r.locationId, arr);
}
const ALERT: Record<string, number> = { "no-stress": 0, watch: 1, warning: 2, "alert-1": 3, "alert-2": 4 };

// Mirrors getReefState() in reef-state.ts, including the "unknown" branch for
// reefs with no condition signal (no coral survey and no thermal reading).
function reefState(locationId: string): "Improving" | "Stable" | "Declining" | "unknown" {
  let worst: string | null = null;
  let best: number | null = null;
  let before: number | null = null;
  for (const r of health.get(locationId) ?? []) {
    const a = r.thermalStress?.alertLevel;
    if (a && (worst === null || ALERT[a] > ALERT[worst])) worst = a;
    const c = r.observed?.coralCoverPercent;
    if (c !== undefined && (best === null || c > best)) {
      best = c;
      before = r.observed?.historicalCoralCoverPercent ?? null;
    }
  }
  if (worst === null && best === null) return "unknown"; // no condition signal
  const rank = worst ? ALERT[worst] : 0;
  const g = gfw.get(locationId);
  const hours = g?.current?.fishingHours ?? null;
  const effort = g ? gfwEffortLevel(hours) : editorialEffortLevel(rpBy.get(locationId)?.fishingPressure);
  const effective = reconcile(effort, rpBy.get(locationId)?.mpaStatus ?? null);
  // Coral trend gate, mirrored from reef-state.ts: a reef whose cover has
  // fallen cannot be "Improving" — the label would contradict its cover chart.
  const coralFalling = best !== null && before !== null && best < before;
  if ((best !== null && best < 25) || rank >= 3) return "Declining";
  if ((best === null || best >= 40) && rank <= 1 && fishingAllowsImproving(effective) && !coralFalling)
    return "Improving";
  return "Stable";
}

// Invariant (data-growth-proof): the trend gate guarantees no reef labelled
// "Improving" has coral that has fallen vs its historical survey. Asserting the
// property rather than a hardcoded count keeps this green as the discovery bot
// adds new sites.
const contradictions = rp.filter((r) => {
  if (reefState(r.locationId) !== "Improving") return false;
  const recs = health.get(r.locationId) ?? [];
  let best: number | null = null, before: number | null = null;
  for (const rec of recs) {
    const c = rec.observed?.coralCoverPercent;
    if (c !== undefined && (best === null || c > best)) {
      best = c;
      before = rec.observed?.historicalCoralCoverPercent ?? null;
    }
  }
  return best !== null && before !== null && best < before;
});
eq(contradictions.map((r) => r.locationId), [], "no Improving reef has falling coral (state never contradicts its chart)");

// Targeted cases spanning the trend and fishing gates.
eq(reefState("raja-ampat-indonesia"), "Improving", "Raja Ampat Improving (coral rising 54→56, low fishing)");
eq(reefState("niue-avaiki-cave"), "Improving", "Niue Improving (coral holding steady 40→40)");
eq(reefState("apo-reef-philippines"), "Stable", "Apo Reef Stable (coral fell 42→40, no longer contradicts chart)");
eq(reefState("tubbataha-philippines"), "Stable", "Tubbataha Stable (coral fell 50→47)");
eq(reefState("komodo-national-park-indonesia"), "Stable", "Komodo Stable (moderate measured fishing)");
eq(reefState("great-barrier-reef-australia"), "Stable", "GBR Stable");
eq(rpBy.get("great-barrier-reef-australia")?.mpaStatus, "designated-multi-use", "GBR stays multi-use");

if (failures) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}
console.log("All fishing-model checks passed (unit + reef-state regression).");
