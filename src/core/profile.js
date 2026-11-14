import { z } from "zod";

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const EQUIPMENT = ["dumbbells", "barbell", "bench", "pullup_bar", "kettlebell", "cable_machine", "leg_machine"];
export const PAINS = ["knee", "back", "shoulder"];

export const BEGINNER_LEVEL = 1;
export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 6;
export const MIN_SESSION_MINUTES = 20;
export const MAX_SESSION_MINUTES = 120;

export const WeekdaySchema = z.enum(WEEKDAYS);

export const ProfileSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  trainingDays: z
    .array(WeekdaySchema)
    .min(MIN_TRAINING_DAYS)
    .max(MAX_TRAINING_DAYS)
    .refine((days) => new Set(days).size === days.length),
  sessionMinutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
  equipment: z.array(z.enum(EQUIPMENT)),
  pains: z.array(z.enum(PAINS)),
});

export function sortWeekdays(days) {
  return [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
}

export function nextWeekday(day) {
  return WEEKDAYS[(WEEKDAYS.indexOf(day) + 1) % WEEKDAYS.length];
}

export function previousWeekday(day) {
  return WEEKDAYS[(WEEKDAYS.indexOf(day) + WEEKDAYS.length - 1) % WEEKDAYS.length];
}
