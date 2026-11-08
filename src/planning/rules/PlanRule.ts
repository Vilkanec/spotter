import type { Exercise, ExerciseCatalog } from "@/domain/exercise";
import type { PlanDay, PlannedExercise, Violation, WeeklyPlan } from "@/domain/plan";
import type { Profile } from "@/domain/profile";

export interface RuleContext {
  profile: Profile;
  catalog: ExerciseCatalog;
}

export interface PlanRule {
  check(plan: WeeklyPlan, context: RuleContext): Violation[];
}

export interface ResolvedExercise {
  planned: PlannedExercise;
  exercise: Exercise;
}

export function resolveExercises(day: PlanDay, catalog: ExerciseCatalog): ResolvedExercise[] {
  return day.exercises.flatMap((planned) => {
    const exercise = catalog.find(planned.exerciseId);
    return exercise ? [{ planned, exercise }] : [];
  });
}
