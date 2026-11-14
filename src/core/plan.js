import { z } from "zod";
import { findExercise } from "./exercises";
import { WeekdaySchema } from "./profile";

export const WARM_UP_MINUTES = 10;
export const BEGINNER_MAX_SETS = 3;

const PlannedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(50),
});

const PlanDaySchema = z.object({
  day: WeekdaySchema,
  exercises: z.array(PlannedExerciseSchema).min(1),
});

export const WeeklyPlanSchema = z.object({
  days: z.array(PlanDaySchema).min(1),
});

export function resolveExercises(day) {
  return day.exercises.flatMap((planned) => {
    const exercise = findExercise(planned.exerciseId);
    return exercise ? [{ planned, exercise }] : [];
  });
}

export function dayDurationMinutes(day) {
  return resolveExercises(day).reduce(
    (total, { planned, exercise }) => total + planned.sets * exercise.minutesPerSet,
    WARM_UP_MINUTES,
  );
}
