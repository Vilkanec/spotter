import { BEGINNER_MAX_SETS, type Violation, type WeeklyPlan } from "@/domain/plan";
import { BEGINNER, weekdayLabel } from "@/domain/profile";
import { resolveExercises, type PlanRule, type RuleContext } from "./PlanRule";

export class LevelRule implements PlanRule {
  check(plan: WeeklyPlan, { profile, catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) =>
      resolveExercises(day, catalog).flatMap(({ planned, exercise }) => {
        const violations: Violation[] = [];
        if (exercise.complexity > profile.level) {
          violations.push({ rule: "R6", message: `${weekdayLabel(day.day)}: ${exercise.name} per sudėtingas naudotojo lygiui.` });
        }
        if (profile.level === BEGINNER && planned.sets > BEGINNER_MAX_SETS) {
          violations.push({
            rule: "R6",
            message: `${weekdayLabel(day.day)}: ${exercise.name} turi per daug serijų (${planned.sets}), pradedančiajam leidžiama daugiausia ${BEGINNER_MAX_SETS}.`,
          });
        }
        return violations;
      }),
    );
  }
}
