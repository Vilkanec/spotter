import { eligibleExercises } from "./exercises";
import { buildFallbackPlan } from "./fallbackPlan";
import { buildPlanPrompt } from "./planPrompt";
import { checkPlan } from "./planRules";

export const MIN_ELIGIBLE_EXERCISES = 6;
export const MAX_AI_ATTEMPTS = 2;

export class PlanGenerator {
  #ai;

  constructor(ai) {
    this.#ai = ai;
  }

  async generate(profile) {
    const exercises = eligibleExercises(profile);
    if (exercises.length < MIN_ELIGIBLE_EXERCISES) {
      return {
        status: "error",
        message: `Tinkamų pratimų: ${exercises.length}, o reikia bent ${MIN_ELIGIBLE_EXERCISES}. Pridėk įrangos arba peržiūrėk skausmų sąrašą.`,
        attempts: [],
      };
    }

    const { plan, attempts } = await this.#askAi({ profile, exercises, revision: null });
    if (plan) return { status: "ready", plan, attempts };

    const fallback = checkPlan(buildFallbackPlan(profile, exercises), profile);
    if (fallback.plan && fallback.violations.length === 0) {
      return { status: "simplified", plan: fallback.plan, attempts };
    }
    return { status: "error", message: "Šiam profiliui nepavyko sudaryti tinkamo plano.", attempts };
  }

  async revise(profile, currentPlan, instruction) {
    const exercises = eligibleExercises(profile);
    const { plan, attempts } = await this.#askAi({ profile, exercises, revision: { plan: currentPlan, instruction } });

    if (plan) return { status: "ready", plan, attempts };
    return { status: "error", message: "AI nepavyko atlikti šio pakeitimo nepažeidžiant plano taisyklių.", attempts };
  }

  async #askAi(request) {
    const attempts = [];
    let previousAttempt = null;

    for (let attempt = 0; attempt < MAX_AI_ATTEMPTS; attempt++) {
      const { answer, failure } = await this.#requestAnswer(buildPlanPrompt(request, previousAttempt));
      const { plan, violations } = failure
        ? { plan: null, violations: [failure] }
        : checkPlan(answer, request.profile);

      attempts.push(violations);
      if (plan && violations.length === 0) return { plan, attempts };
      previousAttempt = { answer, violations };
    }
    return { plan: null, attempts };
  }

  async #requestAnswer(prompt) {
    try {
      return { answer: await this.#ai.generateJson(prompt), failure: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "nežinoma klaida";
      return { answer: null, failure: { rule: "FORMAT", message: `AI nepateikė tinkamo atsakymo: ${reason}` } };
    }
  }
}
