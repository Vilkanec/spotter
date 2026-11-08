import { WeeklyPlanSchema, type Violation, type WeeklyPlan } from "@/domain/plan";
import { CatalogRule } from "./rules/CatalogRule";
import { DurationRule } from "./rules/DurationRule";
import { EquipmentRule } from "./rules/EquipmentRule";
import { LevelRule } from "./rules/LevelRule";
import { PainRule } from "./rules/PainRule";
import type { PlanRule, RuleContext } from "./rules/PlanRule";
import { RecoveryRule } from "./rules/RecoveryRule";
import { TrainingDaysRule } from "./rules/TrainingDaysRule";

export interface ParseResult {
  plan: WeeklyPlan | null;
  violations: Violation[];
}

export class PlanValidator {
  private readonly rules: PlanRule[] = [
    new CatalogRule(),
    new EquipmentRule(),
    new PainRule(),
    new TrainingDaysRule(),
    new DurationRule(),
    new RecoveryRule(),
    new LevelRule(),
  ];

  validate(plan: WeeklyPlan, context: RuleContext): Violation[] {
    return this.rules.flatMap((rule) => rule.check(plan, context));
  }

  parseAndValidate(raw: unknown, context: RuleContext): ParseResult {
    const parsed = WeeklyPlanSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "plan"}: ${issue.message}`);
      return { plan: null, violations: [{ rule: "FORMAT", message: `Netinkamas plano formatas. ${issues.join("; ")}` }] };
    }
    return { plan: parsed.data, violations: this.validate(parsed.data, context) };
  }
}
