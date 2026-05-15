import gearData from "@/data/gear.json";
import type { Gear, SkillLevel } from "./types";

const gear = gearData as Gear[];
const byId = new Map(gear.map((g) => [g.id, g]));

export const getAllGear = (): Gear[] => gear;

export const getGearById = (id: string): Gear | null => byId.get(id) ?? null;

export const getGearForLevel = (level: SkillLevel): Gear[] =>
  gear.filter((g) => g.levels.includes(level));
