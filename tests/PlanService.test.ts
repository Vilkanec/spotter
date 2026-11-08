import type { DatabaseSync } from "node:sqlite";
import { describe, expect, it } from "vitest";
import { CompletionRepository } from "@/persistence/CompletionRepository";
import { openDatabase } from "@/persistence/database";
import { PlanRepository } from "@/persistence/PlanRepository";
import { ProfileRepository } from "@/persistence/ProfileRepository";
import { PlanValidator } from "@/planning/PlanValidator";
import { PlanService } from "@/services/PlanService";
import { catalog, createGenerator, exercises, plan, ScriptedAiClient } from "./support";

const today = new Date(2026, 10, 9);

function planServiceFor(database: DatabaseSync, tenantId: string): PlanService {
  return new PlanService(
    catalog,
    new ProfileRepository(database, tenantId),
    new PlanRepository(database, tenantId),
    new CompletionRepository(database, tenantId),
    createGenerator(new ScriptedAiClient([])),
    new PlanValidator(),
  );
}

describe("PlanService", () => {
  it("saves a manual plan with a pain warning", () => {
    const alex = planServiceFor(openDatabase(":memory:"), "alex");
    const withSquats = plan({ monday: exercises(["goblet-squat"]), wednesday: exercises(["hammer-curl"]), friday: exercises(["lateral-raise"]) });

    const warnings = alex.saveManual(withSquats);

    expect(warnings.map((warning) => warning.rule)).toEqual(["R2"]);
    expect(alex.overview(today)?.warnings).toEqual(warnings);
  });

  it("counts a day as done when all its exercises are marked", async () => {
    const alex = planServiceFor(openDatabase(":memory:"), "alex");
    await alex.generate();

    alex.updateCompletion({ day: "monday", exerciseId: null, done: true }, today);

    expect(alex.overview(today)?.completedDays).toBe(1);
  });

  it("keeps each client's data separate", () => {
    const database = openDatabase(":memory:");
    const alex = planServiceFor(database, "alex");
    const rita = planServiceFor(database, "rita");
    const ritasPlan = rita.overview(today)?.plan;

    expect(alex.overview(today)).toBeNull();
    expect(() => alex.updateCompletion({ day: "tuesday", exerciseId: null, done: true }, today)).toThrow();

    alex.saveManual(plan({ monday: exercises(["hammer-curl"]) }));
    rita.updateCompletion({ day: "tuesday", exerciseId: null, done: true }, today);

    expect(rita.overview(today)?.plan).toEqual(ritasPlan);
    expect(rita.overview(today)?.completedDays).toBe(1);
    expect(alex.overview(today)?.completedDays).toBe(0);
  });
});
