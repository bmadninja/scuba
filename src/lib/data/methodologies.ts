import methodologiesData from "@/data/methodologies.json";
import type { ClaimType, MethodologyNote } from "./types";

const methodologies = methodologiesData as MethodologyNote[];
const byClaimId = new Map(methodologies.map((m) => [m.claimId, m]));

export const getAllMethodologies = (): MethodologyNote[] => methodologies;

export const getMethodologyByClaimId = (
  claimId: string,
): MethodologyNote | null => byClaimId.get(claimId) ?? null;

export const getMethodologiesByClaimType = (
  claimType: ClaimType,
): MethodologyNote[] => methodologies.filter((m) => m.claimType === claimType);
