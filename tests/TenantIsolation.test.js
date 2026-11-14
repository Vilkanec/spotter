import { describe, expect, it } from "vitest";
import { openDatabase } from "@/storage/database";
import { exercises, plan, planServiceFor } from "./support";

const today = new Date(2026, 10, 9);

describe("Tenant isolation", () => {
  it("does not let one client read or change another client's data", () => {
    const database = openDatabase(":memory:");
    const alex = planServiceFor(database, "alex");
    const rita = planServiceFor(database, "rita");
    const ritasPlan = rita.overview(today).plan;

    expect(alex.overview(today)).toBeNull();
    expect(() => alex.updateCompletion({ day: "tuesday", exerciseId: null, done: true }, today)).toThrow();

    alex.saveManual(plan({ monday: exercises(["hammer-curl"]) }));
    rita.updateCompletion({ day: "tuesday", exerciseId: null, done: true }, today);

    expect(rita.overview(today).plan).toEqual(ritasPlan);
    expect(rita.overview(today).completedDays).toBe(1);
    expect(alex.overview(today).completedDays).toBe(0);
  });
});
