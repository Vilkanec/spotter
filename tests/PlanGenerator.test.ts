import { describe, expect, it } from "vitest";
import { EQUIPMENT, type Profile } from "@/domain/profile";
import { dayDurationMinutes } from "@/planning/rules/DurationRule";
import { catalog, createGenerator, exercises, plan, ScriptedAiClient } from "./support";

const beginnerAtHome: Profile = {
  level: 1,
  trainingDays: ["monday", "wednesday", "friday"],
  sessionMinutes: 45,
  equipment: ["dumbbells"],
  pains: [],
};

const intermediateInGymWithKneePain: Profile = {
  level: 2,
  trainingDays: ["monday", "tuesday", "thursday", "friday"],
  sessionMinutes: 60,
  equipment: [...EQUIPMENT],
  pains: ["knee"],
};

const fullBodyDay = exercises([
  "dumbbell-floor-press",
  "one-arm-dumbbell-row",
  "dumbbell-shoulder-press",
  "goblet-squat",
  "dumbbell-biceps-curl",
]);

const validGymPlan = plan({
  monday: exercises(["barbell-bench-press", "lat-pulldown"]),
  tuesday: exercises(["leg-curl", "dead-bug"]),
  thursday: exercises(["face-pull", "hammer-curl"]),
  friday: exercises(["leg-curl", "seated-cable-row"]),
});

describe("PlanGenerator", () => {
  it("accepts a valid AI plan on the first attempt", async () => {
    const ai = new ScriptedAiClient([plan({ monday: fullBodyDay, wednesday: fullBodyDay, friday: fullBodyDay })]);

    const result = await createGenerator(ai).generate(beginnerAtHome, catalog);

    expect(result.status).toBe("ready");
    expect(result.attempts).toEqual([[]]);
    expect(ai.calls).toBe(1);
    if (result.status === "ready") {
      expect(dayDurationMinutes(result.plan.days[0], catalog)).toBe(40);
    }
  });

  it("sends violations back to the AI and accepts the corrected plan", async () => {
    const conflictingPlan = plan({
      monday: exercises(["barbell-bench-press", "lat-pulldown"]),
      tuesday: exercises(["dumbbell-bench-press", "dumbbell-biceps-curl"]),
      thursday: exercises(["barbell-back-squat", "dead-bug"]),
      friday: exercises(["face-pull", "seated-cable-row"]),
    });
    const ai = new ScriptedAiClient([conflictingPlan, validGymPlan]);

    const result = await createGenerator(ai).generate(intermediateInGymWithKneePain, catalog);

    expect(result.attempts[0].map((violation) => violation.rule).sort()).toEqual(["R2", "R5"]);
    expect(result.attempts[1]).toEqual([]);
    expect(result.status).toBe("ready");
    expect(ai.calls).toBe(2);
  });

  it("builds a simplified plan when the AI fails twice", async () => {
    const tooLongMonday = plan({
      monday: exercises(["lat-pulldown", "leg-curl", "face-pull"], 10),
      tuesday: exercises(["dead-bug"]),
      thursday: exercises(["hammer-curl"]),
      friday: exercises(["leg-curl"]),
    });
    const ai = new ScriptedAiClient([tooLongMonday, tooLongMonday]);

    const result = await createGenerator(ai).generate(intermediateInGymWithKneePain, catalog);

    expect(result.attempts.map((violations) => violations.map((violation) => violation.rule))).toEqual([["R4"], ["R4"]]);
    expect(result.status).toBe("simplified");
  });

  it("does not call the AI when too few exercises are eligible", async () => {
    const ai = new ScriptedAiClient([]);
    const profile: Profile = { ...beginnerAtHome, equipment: [], pains: ["knee", "back", "shoulder"] };

    const result = await createGenerator(ai).generate(profile, catalog);

    expect(result.status).toBe("error");
    expect(ai.calls).toBe(0);
    if (result.status === "error") expect(result.message).toContain("Tinkamų pratimų: 3");
  });

  it("treats an AI timeout or malformed answer as a failed attempt", async () => {
    const ai = new ScriptedAiClient([new Error("timeout"), { days: "not a list" }]);

    const result = await createGenerator(ai).generate(beginnerAtHome, catalog);

    expect(result.attempts.map((violations) => violations.map((violation) => violation.rule))).toEqual([["FORMAT"], ["FORMAT"]]);
    expect(result.status).toBe("simplified");
  });

  it("revises a plan with AI and rejects a revision that breaks the rules", async () => {
    const current = plan({ monday: fullBodyDay, wednesday: fullBodyDay, friday: fullBodyDay });
    const withSquatsOnKnees = plan({ monday: exercises(["goblet-squat"]), wednesday: fullBodyDay, friday: fullBodyDay });
    const profile: Profile = { ...beginnerAtHome, pains: [] };
    const kneeProfile: Profile = { ...beginnerAtHome, pains: ["knee"] };

    const accepted = await createGenerator(new ScriptedAiClient([current])).revise(profile, catalog, current, "keep it");
    const rejected = await createGenerator(new ScriptedAiClient([withSquatsOnKnees, withSquatsOnKnees]))
      .revise(kneeProfile, catalog, current, "add squats");

    expect(accepted.status).toBe("ready");
    expect(rejected.status).toBe("error");
    expect(rejected.attempts).toHaveLength(2);
  });

  it.each([
    [["monday", "wednesday", "friday"]],
    [["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]],
    [["saturday", "sunday", "monday"]],
    [["tuesday", "thursday"]],
  ] as const)("builds a valid simplified plan for %j", async (trainingDays) => {
    for (const level of [1, 2, 3] as const) {
      const profile: Profile = { ...beginnerAtHome, level, trainingDays: [...trainingDays], sessionMinutes: 30 };
      const result = await createGenerator(new ScriptedAiClient([])).generate(profile, catalog);

      expect(result.status).toBe("simplified");
    }
  });
});
