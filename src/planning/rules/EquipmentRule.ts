import type { Violation, WeeklyPlan } from "@/domain/plan";
import { EQUIPMENT_LABELS, weekdayLabel } from "@/domain/profile";
import { resolveExercises, type PlanRule, type RuleContext } from "./PlanRule";

export class EquipmentRule implements PlanRule {
  check(plan: WeeklyPlan, { profile, catalog }: RuleContext): Violation[] {
    return plan.days.flatMap((day) =>
      resolveExercises(day, catalog).flatMap(({ exercise }) => {
        const missing = exercise.equipment.filter((item) => !profile.equipment.includes(item)).map((item) => EQUIPMENT_LABELS[item]);
        return missing.length === 0
          ? []
          : [{ rule: "R1" as const, message: `${weekdayLabel(day.day)}: ${exercise.name} reikia įrangos, kurios nėra (${missing.join(", ")}).` }];
      }),
    );
  }
}
