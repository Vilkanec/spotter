import type { AiClient } from "@/ai/AiClient";
import type { ExerciseCatalog } from "@/domain/exercise";
import type { Violation, WeeklyPlan } from "@/domain/plan";
import type { Profile } from "@/domain/profile";
import type { ExerciseSelector } from "./ExerciseSelector";
import type { FallbackPlanBuilder } from "./FallbackPlanBuilder";
import type { PlanPrompt, PlanRequest, PreviousAttempt } from "./PlanPrompt";
import type { PlanValidator } from "./PlanValidator";
import type { RuleContext } from "./rules/PlanRule";

export const MIN_ELIGIBLE_EXERCISES = 6;
export const MAX_AI_ATTEMPTS = 2;

export type GenerationResult =
  | { status: "ready" | "simplified"; plan: WeeklyPlan; attempts: Violation[][] }
  | { status: "error"; message: string; attempts: Violation[][] };

export class PlanGenerator {
  constructor(
    private readonly ai: AiClient,
    private readonly selector: ExerciseSelector,
    private readonly validator: PlanValidator,
    private readonly prompt: PlanPrompt,
    private readonly fallbackBuilder: FallbackPlanBuilder,
  ) {}

  async generate(profile: Profile, catalog: ExerciseCatalog): Promise<GenerationResult> {
    const eligible = this.selector.select(profile, catalog.exercises);
    if (eligible.length < MIN_ELIGIBLE_EXERCISES) {
      return {
        status: "error",
        message: `Tinkamų pratimų: ${eligible.length}, o reikia bent ${MIN_ELIGIBLE_EXERCISES}. Pridėk įrangos arba peržiūrėk skausmų sąrašą.`,
        attempts: [],
      };
    }

    const context: RuleContext = { profile, catalog };
    const result = await this.askAi({ profile, exercises: eligible, revision: null }, context);
    if (result.plan) return { status: "ready", plan: result.plan, attempts: result.attempts };

    const fallback = this.validator.parseAndValidate(this.fallbackBuilder.build(profile, eligible), context);
    if (fallback.plan && fallback.violations.length === 0) {
      return { status: "simplified", plan: fallback.plan, attempts: result.attempts };
    }
    return { status: "error", message: "Šiam profiliui nepavyko sudaryti tinkamo plano.", attempts: result.attempts };
  }

  async revise(profile: Profile, catalog: ExerciseCatalog, plan: WeeklyPlan, instruction: string): Promise<GenerationResult> {
    const eligible = this.selector.select(profile, catalog.exercises);
    const context: RuleContext = { profile, catalog };
    const result = await this.askAi({ profile, exercises: eligible, revision: { plan, instruction } }, context);

    return result.plan
      ? { status: "ready", plan: result.plan, attempts: result.attempts }
      : { status: "error", message: "AI nepavyko atlikti šio pakeitimo nepažeidžiant plano taisyklių.", attempts: result.attempts };
  }

  private async askAi(request: PlanRequest, context: RuleContext): Promise<{ plan: WeeklyPlan | null; attempts: Violation[][] }> {
    const attempts: Violation[][] = [];
    let previous: PreviousAttempt | null = null;

    for (let attempt = 0; attempt < MAX_AI_ATTEMPTS; attempt++) {
      const answer = await this.requestPlan(this.prompt.build(request, previous));
      const { plan, violations } = answer.failure
        ? { plan: null, violations: [answer.failure] }
        : this.validator.parseAndValidate(answer.value, context);

      attempts.push(violations);
      if (plan && violations.length === 0) return { plan, attempts };
      previous = { answer: answer.value, violations };
    }
    return { plan: null, attempts };
  }

  private async requestPlan(prompt: string): Promise<{ value: unknown; failure: Violation | null }> {
    try {
      return { value: await this.ai.generateJson(prompt), failure: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "nežinoma klaida";
      return { value: null, failure: { rule: "FORMAT", message: `AI nepateikė tinkamo atsakymo: ${reason}` } };
    }
  }
}
