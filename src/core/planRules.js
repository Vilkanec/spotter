import { findExercise } from "./exercises";
import { EQUIPMENT_LABELS, MUSCLE_LABELS, PAIN_ACCUSATIVE, WEEKDAY_LABELS } from "./labels";
import { BEGINNER_MAX_SETS, dayDurationMinutes, resolveExercises, WeeklyPlanSchema } from "./plan";
import { BEGINNER_LEVEL, nextWeekday } from "./profile";

function checkCatalog(plan) {
  const violations = [];
  for (const day of plan.days) {
    for (const planned of day.exercises) {
      if (!findExercise(planned.exerciseId)) {
        violations.push({
          rule: "CATALOG",
          message: `${WEEKDAY_LABELS[day.day]}: pratimo „${planned.exerciseId}“ nėra sąraše. Galima naudoti tik sąrašo pratimus.`,
        });
      }
    }
  }
  return violations;
}

function checkEquipment(plan, profile) {
  const violations = [];
  for (const day of plan.days) {
    for (const { exercise } of resolveExercises(day)) {
      const missing = exercise.equipment.filter((item) => !profile.equipment.includes(item));
      if (missing.length > 0) {
        const missingLabels = missing.map((item) => EQUIPMENT_LABELS[item]).join(", ");
        violations.push({
          rule: "R1",
          message: `${WEEKDAY_LABELS[day.day]}: ${exercise.name} reikia įrangos, kurios nėra (${missingLabels}).`,
        });
      }
    }
  }
  return violations;
}

function checkPains(plan, profile) {
  const violations = [];
  for (const day of plan.days) {
    for (const { exercise } of resolveExercises(day)) {
      const conflicts = exercise.unsuitableFor.filter((pain) => profile.pains.includes(pain));
      if (conflicts.length > 0) {
        const conflictLabels = conflicts.map((pain) => PAIN_ACCUSATIVE[pain]).join(" ir ");
        violations.push({
          rule: "R2",
          message: `${WEEKDAY_LABELS[day.day]}: ${exercise.name} netinka, kai skauda ${conflictLabels}.`,
        });
      }
    }
  }
  return violations;
}

function checkTrainingDays(plan, profile) {
  const planDays = plan.days.map((day) => day.day);
  const violations = [];

  if (new Set(planDays).size !== planDays.length) {
    violations.push({ rule: "R3", message: "Ta pati diena plane kartojasi." });
  }
  if (planDays.length !== profile.trainingDays.length) {
    violations.push({
      rule: "R3",
      message: `Plane treniruočių dienų: ${planDays.length}, o profilyje nurodyta: ${profile.trainingDays.length}.`,
    });
  }
  for (const day of planDays) {
    if (!profile.trainingDays.includes(day)) {
      violations.push({ rule: "R3", message: `${WEEKDAY_LABELS[day]} nėra tarp pasirinktų treniruočių dienų.` });
    }
  }
  return violations;
}

function checkDuration(plan, profile) {
  const violations = [];
  for (const day of plan.days) {
    const minutes = dayDurationMinutes(day);
    if (minutes > profile.sessionMinutes) {
      violations.push({
        rule: "R4",
        message: `${WEEKDAY_LABELS[day.day]}: treniruotė trunka ${minutes} min., o turima tik ${profile.sessionMinutes} min.`,
      });
    }
  }
  return violations;
}

function musclesTrained(day) {
  return new Set(resolveExercises(day).map(({ exercise }) => exercise.muscleGroup));
}

function checkRecovery(plan) {
  const violations = [];
  for (const day of plan.days) {
    const following = plan.days.find((candidate) => candidate.day === nextWeekday(day.day));
    if (!following) continue;

    const followingMuscles = musclesTrained(following);
    for (const muscle of musclesTrained(day)) {
      if (followingMuscles.has(muscle)) {
        violations.push({
          rule: "R5",
          message: `Raumenų grupė „${MUSCLE_LABELS[muscle]}“ treniruojama dvi dienas iš eilės: ${WEEKDAY_LABELS[day.day]} ir ${WEEKDAY_LABELS[following.day]}.`,
        });
      }
    }
  }
  return violations;
}

function checkLevel(plan, profile) {
  const violations = [];
  for (const day of plan.days) {
    for (const { planned, exercise } of resolveExercises(day)) {
      if (exercise.complexity > profile.level) {
        violations.push({
          rule: "R6",
          message: `${WEEKDAY_LABELS[day.day]}: ${exercise.name} per sudėtingas naudotojo lygiui.`,
        });
      }
      if (profile.level === BEGINNER_LEVEL && planned.sets > BEGINNER_MAX_SETS) {
        violations.push({
          rule: "R6",
          message: `${WEEKDAY_LABELS[day.day]}: ${exercise.name} turi per daug serijų (${planned.sets}), pradedančiajam leidžiama daugiausia ${BEGINNER_MAX_SETS}.`,
        });
      }
    }
  }
  return violations;
}

const PLAN_RULES = [checkCatalog, checkEquipment, checkPains, checkTrainingDays, checkDuration, checkRecovery, checkLevel];

export function checkPlan(rawPlan, profile) {
  const parsed = WeeklyPlanSchema.safeParse(rawPlan);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "plan"}: ${issue.message}`);
    return { plan: null, violations: [{ rule: "FORMAT", message: `Netinkamas plano formatas. ${issues.join("; ")}` }] };
  }
  return { plan: parsed.data, violations: PLAN_RULES.flatMap((rule) => rule(parsed.data, profile)) };
}
