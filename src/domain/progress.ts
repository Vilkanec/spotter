import type { PlanDay } from "./plan";
import type { Weekday } from "./profile";

export interface Completion {
  day: Weekday;
  exerciseId: string;
}

export function isExerciseDone(completions: Completion[], day: Weekday, exerciseId: string): boolean {
  return completions.some((item) => item.day === day && item.exerciseId === exerciseId);
}

export function isDayDone(completions: Completion[], day: PlanDay): boolean {
  return day.exercises.every((exercise) => isExerciseDone(completions, day.day, exercise.exerciseId));
}
