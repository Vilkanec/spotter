import { MUSCLE_LABELS, type ExerciseCatalog, type MuscleGroup } from "@/domain/exercise";
import type { PlanDay, Violation, WeeklyPlan } from "@/domain/plan";
import { nextWeekday, weekdayLabel } from "@/domain/profile";
import { resolveExercises, type PlanRule, type RuleContext } from "./PlanRule";

export class RecoveryRule implements PlanRule {
  check(plan: WeeklyPlan, { catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) => {
      const following = plan.days.find((candidate) => candidate.day === nextWeekday(day.day));
      if (!following) return [];

      const followingMuscles = this.musclesOf(following, catalog);
      return [...this.musclesOf(day, catalog)]
        .filter((muscle) => followingMuscles.has(muscle))
        .map((muscle) => ({
          rule: "R5" as const,
          message: `Raumenų grupė „${MUSCLE_LABELS[muscle]}“ treniruojama dvi dienas iš eilės: ${weekdayLabel(day.day)} ir ${weekdayLabel(following.day)}.`,
        }));
    });
  }

  private musclesOf(day: PlanDay, catalog: ExerciseCatalog): Set<MuscleGroup> {
    return new Set(resolveExercises(day, catalog).map(({ exercise }) => exercise.muscleGroup));
  }
}
