import operatorsData from "@/data/operators.json";
import type { Operator } from "./types";

const operators = operatorsData as Operator[];
const byId = new Map(operators.map((o) => [o.id, o]));

export const getAllOperators = (): Operator[] => operators;

export const getOperatorById = (id: string): Operator | null =>
  byId.get(id) ?? null;

export const getOperatorsByIds = (ids: string[]): Operator[] =>
  ids
    .map((id) => byId.get(id))
    .filter((o): o is Operator => Boolean(o));

export const getOperatorsByEncounter = (encounterId: string): Operator[] =>
  operators.filter((o) => o.encounterIds.includes(encounterId));
