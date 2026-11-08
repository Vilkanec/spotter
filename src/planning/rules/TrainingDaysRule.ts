import type { Violation, WeeklyPlan } from "@/domain/plan";
import { weekdayLabel } from "@/domain/profile";
import type { PlanRule, RuleContext } from "./PlanRule";

export class TrainingDaysRule implements PlanRule {
  check(plan: WeeklyPlan, { profile }: RuleContext): Violation[] {
    const planDays = plan.days.map((day) => day.day);
    const violations: Violation[] = [];

    if (new Set(planDays).size !== planDays.length) {
      violations.push({ rule: "R3", message: "Ta pati diena plane kartojasi." });
    }
    if (planDays.length !== profile.trainingDays.length) {
      violations.push({
        rule: "R3",
        message: `Plane treniruočių dienų: ${planDays.length}, o profilyje nurodyta: ${profile.trainingDays.length}.`,
      });
    }
    for (const day of planDays.filter((day) => !profile.trainingDays.includes(day))) {
      violations.push({ rule: "R3", message: `${weekdayLabel(day)} nėra tarp pasirinktų treniruočių dienų.` });
    }
    return violations;
  }
}
