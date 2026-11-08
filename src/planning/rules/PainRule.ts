import type { Violation, WeeklyPlan } from "@/domain/plan";
import { PAIN_ACCUSATIVE, weekdayLabel } from "@/domain/profile";
import { resolveExercises, type PlanRule, type RuleContext } from "./PlanRule";

export class PainRule implements PlanRule {
  check(plan: WeeklyPlan, { profile, catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) =>
      resolveExercises(day, catalog).flatMap(({ exercise }) => {
        const conflicts = exercise.unsuitableFor.filter((pain) => profile.pains.includes(pain)).map((pain) => PAIN_ACCUSATIVE[pain]);
        return conflicts.length === 0
          ? []
          : [{ rule: "R2" as const, message: `${weekdayLabel(day.day)}: ${exercise.name} netinka, kai skauda ${conflicts.join(" ir ")}.` }];
      }),
    );
  }
}
