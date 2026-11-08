import type { AiClient } from "@/ai/AiClient";
import { ExerciseCatalog } from "@/domain/exercise";
import type { PlannedExercise, WeeklyPlan } from "@/domain/plan";
import type { Weekday } from "@/domain/profile";
import { EXERCISE_CATALOG } from "@/persistence/exerciseCatalog";
import { ExerciseSelector } from "@/planning/ExerciseSelector";
import { FallbackPlanBuilder } from "@/planning/FallbackPlanBuilder";
import { PlanGenerator } from "@/planning/PlanGenerator";
import { PlanPrompt } from "@/planning/PlanPrompt";
import { PlanValidator } from "@/planning/PlanValidator";

export const catalog = new ExerciseCatalog(EXERCISE_CATALOG);

export class ScriptedAiClient implements AiClient {
  calls = 0;

  constructor(private readonly answers: unknown[]) {}

  async generateJson(): Promise<unknown> {
    const answer = this.answers[this.calls++];
    if (answer instanceof Error) throw answer;
    return answer;
  }
}

export function createGenerator(ai: AiClient): PlanGenerator {
  return new PlanGenerator(ai, new ExerciseSelector(), new PlanValidator(), new PlanPrompt(), new FallbackPlanBuilder());
}

export function exercises(ids: string[], sets = 3, reps = 10): PlannedExercise[] {
  return ids.map((exerciseId) => ({ exerciseId, sets, reps }));
}

export function plan(days: Partial<Record<Weekday, PlannedExercise[]>>): WeeklyPlan {
  return {
    days: Object.entries(days).map(([day, dayExercises]) => ({ day: day as Weekday, exercises: dayExercises ?? [] })),
  };
}
