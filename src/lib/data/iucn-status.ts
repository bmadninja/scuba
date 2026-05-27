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
