import { LEVEL_LABELS } from "./labels";
import { BEGINNER_MAX_SETS, WARM_UP_MINUTES } from "./plan";
import { sortWeekdays } from "./profile";

const RESPONSE_EXAMPLE = {
  days: [{ day: "monday", exercises: [{ exerciseId: "goblet-squat", sets: 3, reps: 10 }] }],
};

export function buildPlanPrompt({ profile, exercises, revision }, previousAttempt) {
  const sections = [describeTask(profile, exercises), describeRules(profile), describeResponseFormat()];
  if (revision) sections.push(describeRevision(revision));
  if (previousAttempt) sections.push(describeCorrection(previousAttempt));
  return sections.join("\n\n");
}

function describeTask(profile, exercises) {
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

function describeRules(profile) {
  return [
    "Rules:",
    `- Plan exactly these days and no others: ${sortWeekdays(profile.trainingDays).join(", ")}.`,
    `- For every day, ${WARM_UP_MINUTES} + sum of (sets x minutesPerSet) must be at most ${profile.sessionMinutes}.`,
    "- The same muscle group must not be trained on two consecutive days. Sunday and Monday are consecutive.",
    `- If the level is 1, use at most ${BEGINNER_MAX_SETS} sets per exercise.`,
    "- Every day must contain at least one exercise.",
  ].join("\n");
}

function describeResponseFormat() {
  return `Respond with JSON only, in exactly this shape: ${JSON.stringify(RESPONSE_EXAMPLE)}`;
}

function describeRevision({ plan, instruction }) {
  return [
    `This is the user's current plan: ${JSON.stringify(plan)}`,
    `Change it according to this request, keeping everything else the same where possible: "${instruction}"`,
  ].join("\n");
}

function describeCorrection({ answer, violations }) {
  const problems = violations.map((violation) => `- ${violation.rule}: ${violation.message}`).join("\n");
  return [
    `Your previous answer was: ${JSON.stringify(answer ?? null)}`,
    `It broke these rules:\n${problems}`,
    "Return a corrected plan that follows every rule.",
  ].join("\n");
}
