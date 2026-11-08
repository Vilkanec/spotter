import { describe, expect, it } from "vitest";
import type { Profile } from "@/domain/profile";
import { PlanValidator } from "@/planning/PlanValidator";
import { catalog, exercises, plan } from "./support";

const profile: Profile = {
  level: 1,
  trainingDays: ["monday", "wednesday", "friday"],
  sessionMinutes: 45,
  equipment: ["dumbbells"],
  pains: ["knee"],
};

const validator = new PlanValidator();

function rulesBroken(raw: unknown, overrides: Partial<Profile> = {}): string[] {
  return validator.parseAndValidate(raw, { profile: { ...profile, ...overrides }, catalog }).violations.map((violation) => violation.rule);
}

const validDay = exercises(["dumbbell-floor-press", "one-arm-dumbbell-row"]);

describe("PlanValidator", () => {
  it("accepts a plan that follows every rule", () => {
    expect(rulesBroken(plan({ monday: validDay, wednesday: validDay, friday: validDay }))).toEqual([]);
  });

  it("rejects an invalid format", () => {
    expect(rulesBroken({ days: [{ day: "funday", exercises: [] }] })).toEqual(["FORMAT"]);
  });

  it("rejects exercises that are not in the catalog", () => {
    expect(rulesBroken(plan({ monday: exercises(["moon-jump"]), wednesday: validDay, friday: validDay }))).toEqual(["CATALOG"]);
  });

  it("R1: rejects exercises that need missing equipment", () => {
    expect(rulesBroken(plan({ monday: exercises(["lat-pulldown"]), wednesday: validDay, friday: validDay }))).toEqual(["R1"]);
  });

  it("R2: rejects exercises unsuitable for the user's pain", () => {
    expect(rulesBroken(plan({ monday: exercises(["goblet-squat"]), wednesday: validDay, friday: validDay }))).toEqual(["R2"]);
  });

  it("R3: rejects missing and unexpected training days", () => {
    expect(rulesBroken(plan({ monday: validDay, thursday: validDay }))).toEqual(["R3", "R3"]);
  });

  it("R4: rejects a day that exceeds the session length", () => {
    const longDay = exercises(["dumbbell-floor-press", "one-arm-dumbbell-row", "hammer-curl", "lateral-raise", "dumbbell-reverse-fly", "dumbbell-biceps-curl"]);
    expect(rulesBroken(plan({ monday: longDay, wednesday: validDay, friday: validDay }))).toEqual(["R4"]);
  });

  it("R5: treats Sunday and Monday as consecutive days", () => {
    const days = plan({ monday: validDay, wednesday: exercises(["hammer-curl"]), sunday: validDay });
    expect(rulesBroken(days, { trainingDays: ["monday", "wednesday", "sunday"] })).toEqual(["R5", "R5"]);
  });

  it("R6: rejects complex exercises and too many sets for beginners", () => {
    const hardDay = [...exercises(["dumbbell-romanian-deadlift"]), ...exercises(["hammer-curl"], 4)];
    expect(rulesBroken(plan({ monday: hardDay, wednesday: validDay, friday: validDay }))).toEqual(["R6", "R6"]);
  });
});
