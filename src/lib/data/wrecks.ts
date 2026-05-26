import wrecksData from "@/data/wrecks.json";
import type { WreckRecord } from "./types";

const records = wrecksData as WreckRecord[];
const bySiteId = new Map<string, WreckRecord[]>();
for (const r of records) {
  const list = bySiteId.get(r.siteId) ?? [];
  list.push(r);
  bySiteId.set(r.siteId, list);
}

export const getAllWrecks = (): WreckRecord[] => records;

export const getWrecksBySiteId = (siteId: string): WreckRecord[] =>
  bySiteId.get(siteId) ?? [];
