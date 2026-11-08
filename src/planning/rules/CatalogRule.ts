import type { Violation, WeeklyPlan } from "@/domain/plan";
import { weekdayLabel } from "@/domain/profile";
import type { PlanRule, RuleContext } from "./PlanRule";

export class CatalogRule implements PlanRule {
  check(plan: WeeklyPlan, { catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) =>
      day.exercises
        .filter((planned) => !catalog.has(planned.exerciseId))
        .map((planned) => ({
          rule: "CATALOG" as const,
          message: `${weekdayLabel(day.day)}: pratimo „${planned.exerciseId}“ nėra sąraše. Galima naudoti tik sąrašo pratimus.`,
        })),
    );
  }
}
