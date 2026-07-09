import type { BleachingAlertLevel, EffectiveFishing } from "./types";

/**
 * Pure, data-layer-free scoring logic for the multi-pillar reef-state model.
 * The location-bound gathering (reading the JSON loaders) lives in
 * reef-state.ts; everything here operates on already-extracted primitives so it
 * stays unit-testable in isolation, exactly like effective-fishing.ts.
 *
 * Design + rationale: _bmad-output/planning-artifacts/prds/prd-scuba-2026-07-09.
 * Grounding: OHI (status rescaled to a per-pillar reference), Reef Health Index
 * (equal-weight, outcome-anchored coral bins) and NOAA CRW (DHW anchored to
 * bleaching/mortality outcomes).
 */

export type PillarKey = "coral" | "thermal" | "fish" | "fishing";

/** One pillar's normalized read. `score` is null when the pillar has no data. */
export type PillarScore = {
  key: PillarKey;
  /** 0 = regionally degraded, 1 = at/above reference. null = no data. */
  score: number | null;
  /** 0..1 — data presence, freshness and sample support for this pillar. */
  confidence: number;
  hasData: boolean;
  /** Short reader-facing summary of what the pillar found. */
  note: string;
};

export type ConfidenceTier = "well-surveyed" | "provisional" | "sparse";

/** Equal importance weights (documented policy default — OHI/RHI precedent). */
export const PILLAR_WEIGHT: Record<PillarKey, number> = {
  coral: 1,
  thermal: 1,
  fish: 1,
  fishing: 1,
};

/** The pillars that count as a *condition survey* for the Not-Surveyed floor. */
export const CONDITION_PILLARS: PillarKey[] = ["coral", "thermal", "fish"];

/**
 * Coral cover → 0..1 against biologically-anchored bins (Reef Health Index /
 * AGRRA style), NOT against a regional mean — a degraded regional mean must not
 * let a collapsed reef read as healthy (shifting-baseline guard). Cutpoints:
 * <5 critical, 5–10 poor, 10–20 fair, 20–40 good, >=40 very good.
 */
export function scoreCoralCover(pct: number): number {
  if (pct < 5) return 0.1;
  if (pct < 10) return 0.3;
  if (pct < 20) return 0.55;
  if (pct < 40) return 0.8;
  return 1;
}

/** True when coral is in the critical outcome-anchored bin (hard Declining trigger). */
export function coralIsCritical(pct: number): boolean {
  return pct < 10;
}

const ALERT_DHW_FLOOR: Record<BleachingAlertLevel, number> = {
  "no-stress": 0,
  watch: 1,
  warning: 2,
  "alert-1": 4,
  "alert-2": 8,
};

/**
 * Thermal stress → 0..1 (inverted: 1 = cool, 0 = severe). Prefers the continuous
 * Degree Heating Weeks value (an anomaly against CRW's per-site baseline, anchored
 * to bleaching/mortality); falls back to the ordinal alert level where DHW is
 * absent. Bins mirror CRW: DHW>=4 = Alert 1 (bleaching likely), >=8 = Alert 2
 * (severe + mortality).
 */
export function scoreThermal(
  dhw: number | null | undefined,
  alertLevel: BleachingAlertLevel | null | undefined,
): number {
  const w = dhw ?? (alertLevel ? ALERT_DHW_FLOOR[alertLevel] : null);
  if (w == null) return 1; // caller only invokes this when a reading exists
  if (w < 1) return 1;
  if (w < 4) return 0.7;
  if (w < 8) return 0.4;
  if (w < 12) return 0.2;
  return 0.05;
}

/** True when heat stress is severe enough to be a hard Declining trigger (Alert 1+). */
export function thermalIsSevere(
  dhw: number | null | undefined,
  alertLevel: BleachingAlertLevel | null | undefined,
): boolean {
  const w = dhw ?? (alertLevel ? ALERT_DHW_FLOOR[alertLevel] : null);
  return w != null && w >= 4;
}

/**
 * Reconciled fishing band → 0..1 (inverted: 1 = protected/light, 0 = heavy).
 * `unknown` returns null — no measured signal, so it should not pull the mean.
 */
export function scoreFishingBand(effective: EffectiveFishing): number | null {
  switch (effective) {
    case "protected":
      return 1;
    case "low":
      return 0.85;
    case "moderate":
      return 0.45;
    case "high":
      return 0.2;
    case "very-high":
      return 0.05;
    case "paper-park":
      return 0.1;
    case "unknown":
    default:
      return null;
  }
}

/**
 * Percentile of `value` within a sorted-ascending reference distribution → 0..1.
 * The reference is the metric's own program distribution across the atlas
 * (FR-8: normalize each fish source within its own metric, no shared B/B0).
 */
export function percentileScore(value: number, sortedAsc: number[]): number {
  const n = sortedAsc.length;
  if (n === 0) return 0.5;
  if (n === 1) return 0.5;
  let below = 0;
  for (const v of sortedAsc) {
    if (v < value) below++;
    else break;
  }
  return Math.max(0, Math.min(1, below / (n - 1)));
}

export type ComposeInput = {
  pillars: PillarScore[];
  /** Coral pillar present with data (required for Improving — FR-4). */
  coralPresent: boolean;
  /** Coral measured as falling (blocks Improving — mirrors the cover chart). */
  coralFalling: boolean;
  /** Coral in the critical bin (hard Declining trigger). */
  coralCritical: boolean;
  /** Severe recent heat stress (hard Declining trigger). */
  thermalSevere: boolean;
  /** Reconciled fishing permits Improving (protected/low/unknown). */
  fishingAllowsImproving: boolean;
};

export type ReefStateVerdict = "thriving" | "pressure" | "change" | "unknown";

const IMPROVING_MIN = 0.7;
const DECLINING_MAX = 0.4;

/**
 * Combine the available pillars into a verdict. Absent pillars contribute zero
 * weight (never a neutral/positive vote). Preserves the invariants the old
 * cascade held: no positive label from absent data (FR-3), Improving needs
 * present non-falling coral (FR-4) and non-blocking fishing (FR-11), and the
 * hard heat/coral triggers still force Declining regardless of a strong fish read.
 */
export function composeReefState(input: ComposeInput): {
  state: ReefStateVerdict;
  tier: ConfidenceTier;
} {
  const withData = input.pillars.filter((p) => p.hasData && p.score !== null);
  const conditionCount = withData.filter((p) =>
    CONDITION_PILLARS.includes(p.key),
  ).length;

  // FR-3 floor: a condition survey (coral / thermal / fish) is required. Fishing
  // or sightings alone never qualify a reef as surveyed.
  if (conditionCount === 0) {
    return { state: "unknown", tier: "sparse" };
  }

  let num = 0;
  let den = 0;
  for (const p of withData) {
    const w = PILLAR_WEIGHT[p.key] * p.confidence;
    num += w * (p.score as number);
    den += w;
  }
  const composite = den > 0 ? num / den : 0;

  const tier = confidenceTier(withData.length, conditionCount, input.pillars);

  // Hard Declining triggers — a strong fish community cannot mask a bleached or
  // collapsing reef.
  if (input.coralCritical || input.thermalSevere) {
    return { state: "change", tier };
  }

  // Thin-evidence guard: a single condition pillar cannot alone drive an extreme
  // (Improving/Declining) label; it resolves to Stable at reduced confidence.
  const thin = conditionCount < 2;

  if (
    !thin &&
    composite >= IMPROVING_MIN &&
    input.coralPresent &&
    !input.coralFalling &&
    input.fishingAllowsImproving
  ) {
    return { state: "thriving", tier };
  }

  if (!thin && composite <= DECLINING_MAX) {
    return { state: "change", tier };
  }

  return { state: "pressure", tier };
}

/** Confidence tier from pillar breadth. Freshness handled by the caller's confidences. */
function confidenceTier(
  pillarCount: number,
  conditionCount: number,
  all: PillarScore[],
): ConfidenceTier {
  const avgConf =
    all.filter((p) => p.hasData).reduce((s, p) => s + p.confidence, 0) /
    Math.max(1, all.filter((p) => p.hasData).length);
  if (pillarCount >= 3 && conditionCount >= 2 && avgConf >= 0.6) {
    return "well-surveyed";
  }
  if (conditionCount >= 1 && (pillarCount >= 2 || avgConf >= 0.5)) {
    return "provisional";
  }
  return "sparse";
}

export const TIER_LABEL: Record<ConfidenceTier, string> = {
  "well-surveyed": "Well surveyed",
  provisional: "Provisional",
  sparse: "Sparse",
};
