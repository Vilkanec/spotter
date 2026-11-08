import type { Exercise } from "@/domain/exercise";
import { BEGINNER_MAX_SETS, WARM_UP_MINUTES, type Violation, type WeeklyPlan } from "@/domain/plan";
import { LEVEL_LABELS, sortWeekdays, type Profile } from "@/domain/profile";

export interface PlanRequest {
  profile: Profile;
  exercises: readonly Exercise[];
  revision: { plan: WeeklyPlan; instruction: string } | null;
}

export interface PreviousAttempt {
  answer: unknown;
  violations: Violation[];
}

const RESPONSE_EXAMPLE = {
  days: [{ day: "monday", exercises: [{ exerciseId: "goblet-squat", sets: 3, reps: 10 }] }],
};

export class PlanPrompt {
  build(request: PlanRequest, previous: PreviousAttempt | null): string {
    const sections = [this.task(request), this.rules(request.profile), this.responseFormat()];
    if (request.revision) sections.push(this.revision(request.revision));
    if (previous) sections.push(this.correction(previous));
    return sections.join("\n\n");
  }

  private task({ profile, exercises }: PlanRequest): string {
    const allowed = exercises.map(({ id, name, muscleGroup, complexity, minutesPerSet }) => ({
      id,
      name,
      muscleGroup,
      complexity,
      minutesPerSet,
    }));
    return [
      "You are a strength coach. Create a one-week training plan for this user.",
      `Level: ${profile.level} (${LEVEL_LABELS[profile.level]})`,
      `Minutes per session: ${profile.sessionMinutes}`,
      `Allowed exercises (use only these ids): ${JSON.stringify(allowed)}`,
    ].join("\n");
  }

  private rules(profile: Profile): string {
    return [
      "Rules:",
      `- Plan exactly these days and no others: ${sortWeekdays(profile.trainingDays).join(", ")}.`,
      `- For every day, ${WARM_UP_MINUTES} + sum of (sets x minutesPerSet) must be at most ${profile.sessionMinutes}.`,
      "- The same muscle group must not be trained on two consecutive days. Sunday and Monday are consecutive.",
      `- If the level is 1, use at most ${BEGINNER_MAX_SETS} sets per exercise.`,
      "- Every day must contain at least one exercise.",
    ].join("\n");
  }

  private responseFormat(): string {
    return `Respond with JSON only, in exactly this shape: ${JSON.stringify(RESPONSE_EXAMPLE)}`;
  }

  private revision({ plan, instruction }: NonNullable<PlanRequest["revision"]>): string {
    return [
      `This is the user's current plan: ${JSON.stringify(plan)}`,
      `Change it according to this request, keeping everything else the same where possible: "${instruction}"`,
    ].join("\n");
  }

  private correction({ answer, violations }: PreviousAttempt): string {
    const problems = violations.map((violation) => `- ${violation.rule}: ${violation.message}`).join("\n");
    return [
      `Your previous answer was: ${JSON.stringify(answer ?? null)}`,
      `It broke these rules:\n${problems}`,
      "Return a corrected plan that follows every rule.",
    ].join("\n");
  }
}
