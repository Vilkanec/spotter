import { describe, expect, it } from "vitest";
import { openDatabase } from "@/storage/database";
import { exercises, plan, planServiceFor } from "./support";

const today = new Date(2026, 10, 9);

describe("PlanService", () => {
  it("saves a manual plan that breaks a rule and keeps the warning", () => {
    const alex = planServiceFor(openDatabase(":memory:"), "alex");
    const planWithSquats = plan({
      monday: exercises(["goblet-squat"]),
      wednesday: exercises(["hammer-curl"]),
      friday: exercises(["lateral-raise"]),
    });

    const warnings = alex.saveManual(planWithSquats);

    expect(warnings.map((warning) => warning.rule)).toEqual(["R2"]);
    expect(alex.overview(today).plan).toEqual(planWithSquats);
    expect(alex.overview(today).warnings).toEqual(warnings);
  });
});
