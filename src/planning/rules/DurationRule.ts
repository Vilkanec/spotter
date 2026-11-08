import type { ExerciseCatalog } from "@/domain/exercise";
import { WARM_UP_MINUTES, type PlanDay, type Violation, type WeeklyPlan } from "@/domain/plan";
import { weekdayLabel } from "@/domain/profile";
import { resolveExercises, type PlanRule, type RuleContext } from "./PlanRule";

export function dayDurationMinutes(day: PlanDay, catalog: ExerciseCatalog): number {
  return resolveExercises(day, catalog).reduce(
    (total, { planned, exercise }) => total + planned.sets * exercise.minutesPerSet,
    WARM_UP_MINUTES,
  );
}

export class DurationRule implements PlanRule {
  check(plan: WeeklyPlan, { profile, catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) => {
      const minutes = dayDurationMinutes(day, catalog);
      return minutes <= profile.sessionMinutes
        ? []
        : [{ rule: "R4" as const, message: `${weekdayLabel(day.day)}: treniruotė trunka ${minutes} min., o turima tik ${profile.sessionMinutes} min.` }];
    });
  }
}
