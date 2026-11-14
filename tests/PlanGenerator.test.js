import { describe, expect, it } from "vitest";
import { dayDurationMinutes } from "@/core/plan";
import { PlanGenerator } from "@/core/PlanGenerator";
import { EQUIPMENT } from "@/core/profile";
import { exercises, plan, ScriptedAiClient } from "./support";

const beginnerAtHome = {
  level: 1,
  trainingDays: ["monday", "wednesday", "friday"],
  sessionMinutes: 45,
  equipment: ["dumbbells"],
  pains: [],
};

const intermediateInGymWithKneePain = {
  level: 2,
  trainingDays: ["monday", "tuesday", "thursday", "friday"],
  sessionMinutes: 60,
  equipment: EQUIPMENT,
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

function rulesBrokenPerAttempt(result) {
  return result.attempts.map((violations) => violations.map((violation) => violation.rule).sort());
}

describe("PlanGenerator", () => {
  it("accepts a valid AI plan on the first attempt", async () => {
    const ai = new ScriptedAiClient([plan({ monday: fullBodyDay, wednesday: fullBodyDay, friday: fullBodyDay })]);

    const result = await new PlanGenerator(ai).generate(beginnerAtHome);

    expect(result.status).toBe("ready");
    expect(rulesBrokenPerAttempt(result)).toEqual([[]]);
    expect(dayDurationMinutes(result.plan.days[0])).toBe(40);
    expect(ai.calls).toBe(1);
  });

  it("sends violations back to the AI and accepts the corrected plan", async () => {
    const conflictingPlan = plan({
      monday: exercises(["barbell-bench-press", "lat-pulldown"]),
      tuesday: exercises(["dumbbell-bench-press", "dumbbell-biceps-curl"]),
      thursday: exercises(["barbell-back-squat", "dead-bug"]),
      friday: exercises(["face-pull", "seated-cable-row"]),
    });
    const ai = new ScriptedAiClient([conflictingPlan, validGymPlan]);

    const result = await new PlanGenerator(ai).generate(intermediateInGymWithKneePain);

    expect(result.status).toBe("ready");
    expect(rulesBrokenPerAttempt(result)).toEqual([["R2", "R5"], []]);
    expect(ai.calls).toBe(2);
  });

  it("builds a simplified plan when the AI breaks the rules twice", async () => {
    const tooLongMonday = plan({
      monday: exercises(["lat-pulldown", "leg-curl", "face-pull"], 10),
      tuesday: exercises(["dead-bug"]),
      thursday: exercises(["hammer-curl"]),
      friday: exercises(["leg-curl"]),
    });
    const ai = new ScriptedAiClient([tooLongMonday, tooLongMonday]);

    const result = await new PlanGenerator(ai).generate(intermediateInGymWithKneePain);

    expect(result.status).toBe("simplified");
    expect(rulesBrokenPerAttempt(result)).toEqual([["R4"], ["R4"]]);
    expect(result.plan.days.map((day) => day.day)).toEqual(["monday", "tuesday", "thursday", "friday"]);
  });

  it("treats an AI service error or a malformed answer as a failed attempt", async () => {
    const ai = new ScriptedAiClient([new Error("timeout"), { days: "not a list" }]);

    const result = await new PlanGenerator(ai).generate(beginnerAtHome);

    expect(result.status).toBe("simplified");
    expect(rulesBrokenPerAttempt(result)).toEqual([["FORMAT"], ["FORMAT"]]);
  });

  it("does not call the AI when too few exercises are eligible", async () => {
    const ai = new ScriptedAiClient([]);
    const profile = { ...beginnerAtHome, equipment: [], pains: ["knee", "back", "shoulder"] };

    const result = await new PlanGenerator(ai).generate(profile);

    expect(result.status).toBe("error");
    expect(result.message).toContain("Tinkamų pratimų: 3");
    expect(ai.calls).toBe(0);
  });
});
