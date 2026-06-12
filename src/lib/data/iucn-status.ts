import iucnData from "@/data/iucn-status.json";
import type { IucnStatus } from "./types";

type IucnData = {
  lastBuiltAt: string;
  records: IucnStatus[];
};

const data = iucnData as unknown as IucnData;
const byName = new Map<string, IucnStatus>();
for (const r of data.records) byName.set(r.scientificName.toLowerCase(), r);

export const getIucnStatus = (
  scientificName: string | undefined | null,
): IucnStatus | null => {
  if (!scientificName) return null;
  // The encounters dataset sometimes encodes multi-species encounters as
  // "Mobula alfredi, Mobula birostris". Use the first binomial for the
  // primary badge.
  const first = scientificName.split(",")[0].trim().toLowerCase();
  return byName.get(first) ?? null;
};

export const IUCN_ENABLED = process.env.NEXT_PUBLIC_IUCN_ENABLED !== "false";

/** Categories that count as "threatened" for summary stats. */
const THREATENED = new Set(["CR", "EN", "VU"]);

/**
 * Given a list of scientific names, return counts of unique threatened
 * species by category level. Deduplicates by name so the same species
 * appearing at multiple sites counts once.
 */
export function countThreatenedSpecies(scientificNames: (string | undefined | null)[]): {
  total: number;
  cr: number;
  en: number;
  vu: number;
} {
  const seen = new Set<string>();
  let total = 0;
  let cr = 0;
  let en = 0;
  let vu = 0;

  for (const raw of scientificNames) {
    if (!raw) continue;
    const name = raw.split(",")[0].trim().toLowerCase();
    if (seen.has(name)) continue;
    seen.add(name);
    const record = byName.get(name);
    if (!record || !THREATENED.has(record.category)) continue;
    total++;
    if (record.category === "CR") cr++;
    else if (record.category === "EN") en++;
    else if (record.category === "VU") vu++;
  }

  return { total, cr, en, vu };
}
