/**
 * Regression + unit tests for the multi-pillar reef-state model.
 * Runs the real pure functions from src/lib/data/reef-state-pillars.ts and
 * re-derives reef state against the actual data files (mirroring the gather in
 * getReefStateDetail — kept in sync by shape, like verify-fishing-model.ts).
 *
 *   node --experimental-strip-types scripts/verify-reef-state.ts
 */
import fs from "node:fs";
import {
  composeReefState,
  coralIsCritical,
  percentileScore,
  scoreCoralCover,
  scoreFishingBand,
  scoreThermal,
  thermalIsSevere,
  type PillarScore,
} from "../src/lib/data/reef-state-pillars.ts";
import {
  editorialEffortLevel,
  fishingAllowsImproving,
  fishingTrend,
  gfwEffortLevel,
  reconcile,
} from "../src/lib/data/effective-fishing.ts";

const read = (p: string) => JSON.parse(fs.readFileSync(new URL(`../src/data/${p}`, import.meta.url), "utf8"));
const health = read("reef-health.json");
const fishing = read("fishing-pressure.json").records;
const rls = read("fish-biomass-series.json");
const agrra = read("agrra-reef-series.json");
const reef = read("reef-fish-abundance-series.json");
const pressure = read("reef-pressure.json");

const ALERT_RANK: Record<string, number> = { "no-stress": 0, watch: 1, warning: 2, "alert-1": 3, "alert-2": 4 };

const RLS_SORTED = rls.map((r: any) => r.latest?.biomassKgPerHa).filter((v: any) => typeof v === "number").sort((a: number, b: number) => a - b);
const AGRRA_SORTED = agrra.map((r: any) => r.fish?.latest?.fishBiomassGper100m2).filter((v: any) => typeof v === "number").sort((a: number, b: number) => a - b);

const healthByLoc = new Map<string, any[]>();
for (const r of health) if (r.locationId) (healthByLoc.get(r.locationId) ?? healthByLoc.set(r.locationId, []).get(r.locationId))!.push(r);
const fishingByLoc = new Map(fishing.map((r: any) => [r.locationId, r]));
const rlsByLoc = new Map(rls.map((r: any) => [r.locationId, r]));
const agrraByLoc = new Map(agrra.map((r: any) => [r.locationId, r]));
const reefByLoc = new Map(reef.map((r: any) => [r.locationId, r]));
const pressureByLoc = new Map((Array.isArray(pressure) ? pressure : Object.values(pressure)).map((r: any) => [r.locationId, r]));

function recencyConf(days: number | null) { if (days === null) return 0.5; if (days <= 730) return 1; if (days <= 1460) return 0.7; return 0.4; }

function fishPillar(locationId: string): PillarScore {
  const r = rlsByLoc.get(locationId) as any;
  if (r?.latest?.biomassKgPerHa !== undefined)
    return { key: "fish", score: percentileScore(r.latest.biomassKgPerHa, RLS_SORTED), confidence: Math.min(1, 0.5 + (r.surveyYears ?? 1) * 0.15), hasData: true, note: "RLS" };
  const a = agrraByLoc.get(locationId) as any;
  if (a?.fish?.latest?.fishBiomassGper100m2 !== undefined)
    return { key: "fish", score: percentileScore(a.fish.latest.fishBiomassGper100m2, AGRRA_SORTED), confidence: Math.min(1, 0.5 + (a.fishSurveyYears ?? 1) * 0.12), hasData: true, note: "AGRRA" };
  const e = reefByLoc.get(locationId) as any;
  if (e?.latest?.densityIndex !== undefined)
    return { key: "fish", score: Math.max(0, Math.min(1, (e.latest.densityIndex - 1) / 3)), confidence: Math.min(0.8, 0.4 + (e.surveyYears ?? 1) * 0.08), hasData: true, note: "REEF" };
  return { key: "fish", score: null, confidence: 0, hasData: false, note: "none" };
}

function verdict(locationId: string) {
  const recs = healthByLoc.get(locationId) ?? [];
  let worstAlert: string | null = null, worstDHW: number | null = null, bestCover: number | null = null, bestBefore: number | null = null, bestDays: number | null = null;
  for (const r of recs) {
    const al = r.thermalStress?.alertLevel;
    if (al && (!worstAlert || ALERT_RANK[al] > ALERT_RANK[worstAlert])) worstAlert = al;
    const dhw = r.thermalStress?.degreeHeatingWeeks;
    if (typeof dhw === "number" && (worstDHW === null || dhw > worstDHW)) worstDHW = dhw;
    const c = r.observed?.coralCoverPercent;
    if (c !== undefined && (bestCover === null || c > bestCover)) { bestCover = c; bestBefore = r.observed?.historicalCoralCoverPercent ?? null; const d = r.observed?.surveyDate; bestDays = d ? Math.floor((Date.now() - new Date(d + "T00:00:00Z").getTime()) / 86400000) : null; }
  }
  const coralFalling = bestCover !== null && bestBefore !== null && bestCover < bestBefore;
  const thermalHas = worstAlert !== null || worstDHW !== null;
  const p = pressureByLoc.get(locationId) as any;
  const gfw = fishingByLoc.get(locationId) as any;
  const hours = gfw?.current?.fishingHours ?? null;
  const effort = gfw ? gfwEffortLevel(hours) : editorialEffortLevel(p?.fishingPressure);
  const effective = reconcile(effort, p?.mpaStatus ?? null);
  const fscore = scoreFishingBand(effective);

  const pillars: PillarScore[] = [
    { key: "coral", score: bestCover !== null ? scoreCoralCover(bestCover) : null, confidence: recencyConf(bestDays), hasData: bestCover !== null, note: "" },
    { key: "thermal", score: thermalHas ? scoreThermal(worstDHW, worstAlert as any) : null, confidence: 0.8, hasData: thermalHas, note: "" },
    fishPillar(locationId),
    { key: "fishing", score: fscore, confidence: gfw ? 0.8 : 0.4, hasData: fscore !== null, note: "" },
  ];
  return composeReefState({
    pillars, coralPresent: bestCover !== null, coralFalling,
    coralCritical: bestCover !== null && coralIsCritical(bestCover),
    thermalSevere: thermalIsSevere(worstDHW, worstAlert as any),
    fishingAllowsImproving: fishingAllowsImproving(effective),
  });
}

// ── Unit assertions on the pure engine ──────────────────────────────────
let fail = 0;
const eq = (a: unknown, e: unknown, m: string) => { if (JSON.stringify(a) !== JSON.stringify(e)) { fail++; console.error(`  ✗ ${m}: expected ${JSON.stringify(e)}, got ${JSON.stringify(a)}`); } };

eq(scoreCoralCover(3), 0.1, "3% coral → critical");
eq(scoreCoralCover(45), 1, "45% coral → very good");
eq(coralIsCritical(8), true, "8% coral is critical");
eq(coralIsCritical(15), false, "15% coral not critical");
eq(scoreThermal(0, "no-stress"), 1, "0 DHW → cool");
eq(scoreThermal(9, "alert-2"), 0.2, "9 DHW → severe");
eq(thermalIsSevere(5, null), true, "5 DHW severe");
eq(scoreFishingBand("protected"), 1, "protected → 1");
eq(scoreFishingBand("moderate"), 0.45, "moderate → 0.45");
eq(scoreFishingBand("unknown"), null, "unknown → null");
eq(percentileScore(50, [10, 20, 30, 40, 50]), 1, "max → 1");
eq(percentileScore(10, [10, 20, 30, 40, 50]), 0, "min → 0");

// Floor: fishing-only never surveyed
eq(composeReefState({ pillars: [{ key: "fishing", score: 1, confidence: 0.8, hasData: true, note: "" }], coralPresent: false, coralFalling: false, coralCritical: false, thermalSevere: false, fishingAllowsImproving: true }).state, "unknown", "fishing-only → unknown");
// Hard trigger: critical coral forces change even with strong fish
eq(composeReefState({ pillars: [{ key: "coral", score: 0.1, confidence: 1, hasData: true, note: "" }, { key: "fish", score: 1, confidence: 1, hasData: true, note: "" }], coralPresent: true, coralFalling: false, coralCritical: true, thermalSevere: false, fishingAllowsImproving: true }).state, "change", "critical coral → change despite strong fish");
// Coral-absent cannot be thriving
eq(composeReefState({ pillars: [{ key: "fish", score: 1, confidence: 1, hasData: true, note: "" }, { key: "fishing", score: 1, confidence: 1, hasData: true, note: "" }], coralPresent: false, coralFalling: false, coralCritical: false, thermalSevere: false, fishingAllowsImproving: true }).state !== "thriving", true, "coral-absent never thriving");

// ── Regression: the 4 manual-override sites ─────────────────────────────
console.log("\nOverride sites (computed verdict — all currently kept as manual overrides):");
for (const id of ["torre-guaceto-italy", "abrolhos-banks", "chumbe-island-tanzania", "channel-islands-usa"]) {
  const v = verdict(id);
  const ov = (pressureByLoc.get(id) as any)?.manualReefState ?? "—";
  console.log(`  ${id.padEnd(24)} computed=${v.state.padEnd(9)} tier=${v.tier.padEnd(13)} (override=${ov})`);
}

// ── Distribution across all surveyed locations ──────────────────────────
const dist: Record<string, number> = {};
for (const id of healthByLoc.keys()) { const s = verdict(id).state; dist[s] = (dist[s] ?? 0) + 1; }
console.log("\nVerdict distribution across", healthByLoc.size, "surveyed locations:", JSON.stringify(dist));

// ── FR-10/FR-17 regression report (committed artifact) ──────────────────
const overrides = (Array.isArray(pressure) ? pressure : Object.values(pressure)).filter((r: any) => r?.manualReefState);
const STATE_TEXT: Record<string, string> = { thriving: "Improving", pressure: "Stable", change: "Declining", unknown: "Not surveyed" };
const rows = overrides.map((o: any) => {
  const v = verdict(o.locationId);
  const computable = v.state === o.manualReefState;
  return { id: o.locationId, override: o.manualReefState, computed: v.state, tier: v.tier, computable };
});
const report = `# Reef-State Override Regression (FR-10 / FR-17)

_Generated by \`node --experimental-strip-types scripts/verify-reef-state.ts\` · ${new Date().toISOString().slice(0, 10)}_

Classifies every \`manualReefState\` override as **computable** (the model reproduces it → the override can retire) or **genuine-exception** (must remain a cited override). Run before removing any override.

## Overrides (${rows.length})

| Location | Override | Computed | Tier | Classification |
|---|---|---|---|---|
${rows.map((r) => `| \`${r.id}\` | ${STATE_TEXT[r.override]} | ${STATE_TEXT[r.computed]} | ${r.tier} | ${r.computable ? "✅ computable" : "🔒 genuine-exception"} |`).join("\n")}

**Genuine-exception reasons:** the three fish-driven \`thriving\` reserves (\`torre-guaceto-italy\`, \`abrolhos-banks\`, \`chumbe-island-tanzania\`) carry no structured condition survey, so the model returns Not surveyed — their biomass evidence lives only in prose literature citations and cannot be computed. They remain cited overrides (PRD §4.8).

## Verdict distribution — ${healthByLoc.size} surveyed locations

${Object.entries(dist).map(([k, n]) => `- ${STATE_TEXT[k]}: ${n}`).join("\n")}
`;
const reportPath = new URL("../_bmad-output/planning-artifacts/prds/prd-scuba-2026-07-09/reef-state-regression.md", import.meta.url);
fs.writeFileSync(reportPath, report);
console.log("\nWrote regression report →", reportPath.pathname);

console.log(fail === 0 ? "\n✓ all unit assertions passed" : `\n✗ ${fail} assertion(s) failed`);
process.exit(fail === 0 ? 0 : 1);
