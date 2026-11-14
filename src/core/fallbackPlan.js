import { MUSCLE_GROUPS } from "./exercises";
import { WARM_UP_MINUTES } from "./plan";
import { nextWeekday, previousWeekday, sortWeekdays } from "./profile";

const ALTERNATING_SPLITS = [
  ["chest", "shoulders", "arms"],
  ["legs", "back", "core"],
];
const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const MAX_EXERCISES_PER_DAY = 6;

export function buildFallbackPlan(profile, eligible) {
  const musclesByDay = assignMuscles(profile.trainingDays);
  const minutesBudget = profile.sessionMinutes - WARM_UP_MINUTES;
  return {
    days: sortWeekdays(profile.trainingDays).map((day) => ({
      day,
      exercises: pickExercises(musclesByDay.get(day) ?? [], eligible, minutesBudget),
    })),
  };
}

function assignMuscles(trainingDays) {
  const musclesByDay = new Map();
  const runStarts = trainingDays.filter((day) => !trainingDays.includes(previousWeekday(day)));

  for (const start of runStarts) {
    const run = consecutiveDaysFrom(start, trainingDays);
    run.forEach((day, index) => {
      const muscles = run.length === 1 ? MUSCLE_GROUPS : ALTERNATING_SPLITS[index % ALTERNATING_SPLITS.length];
      musclesByDay.set(day, muscles);
    });
  }
  return musclesByDay;
}

function consecutiveDaysFrom(start, trainingDays) {
  const run = [];
  for (let day = start; trainingDays.includes(day) && !run.includes(day); day = nextWeekday(day)) {
    run.push(day);
  }
  return run;
}

function pickExercises(muscles, eligible, minutesBudget) {
  const optionsByMuscle = muscles.map((muscle) => eligible.filter((exercise) => exercise.muscleGroup === muscle));
  const picked = [];
  let minutesLeft = minutesBudget;

  for (let round = 0; picked.length < MAX_EXERCISES_PER_DAY; round++) {
    const candidates = optionsByMuscle.flatMap((options) => (round < options.length ? [options[round]] : []));
    if (candidates.length === 0) break;

    for (const exercise of candidates) {
      const minutes = DEFAULT_SETS * exercise.minutesPerSet;
      if (picked.length < MAX_EXERCISES_PER_DAY && minutes <= minutesLeft) {
        picked.push({ exerciseId: exercise.id, sets: DEFAULT_SETS, reps: DEFAULT_REPS });
        minutesLeft -= minutes;
      }
    }
  }
  return picked;
}
