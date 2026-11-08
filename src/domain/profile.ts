import { z } from "zod";

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export const EQUIPMENT = ["dumbbells", "barbell", "bench", "pullup_bar", "kettlebell", "cable_machine", "leg_machine"] as const;
export const PAINS = ["knee", "back", "shoulder"] as const;

export const MIN_TRAINING_DAYS = 2;
export const MAX_TRAINING_DAYS = 6;
export const MIN_SESSION_MINUTES = 20;
export const MAX_SESSION_MINUTES = 120;

export const WeekdaySchema = z.enum(WEEKDAYS);
export const EquipmentSchema = z.enum(EQUIPMENT);
export const PainSchema = z.enum(PAINS);
export const LevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const ProfileSchema = z.object({
  level: LevelSchema,
  trainingDays: z.array(WeekdaySchema).min(MIN_TRAINING_DAYS).max(MAX_TRAINING_DAYS)
    .refine((days) => new Set(days).size === days.length),
  sessionMinutes: z.number().int().min(MIN_SESSION_MINUTES).max(MAX_SESSION_MINUTES),
  equipment: z.array(EquipmentSchema),
  pains: z.array(PainSchema),
});

export type Weekday = z.infer<typeof WeekdaySchema>;
export type Equipment = z.infer<typeof EquipmentSchema>;
export type Pain = z.infer<typeof PainSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type Profile = z.infer<typeof ProfileSchema>;

export const BEGINNER: Level = 1;

export const LEVEL_LABELS: Record<Level, string> = { 1: "Pradedantysis", 2: "Vidutinis", 3: "Pažengęs" };

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  dumbbells: "Hanteliai",
  barbell: "Štanga",
  bench: "Suoliukas",
  pullup_bar: "Skersinis",
  kettlebell: "Gira",
  cable_machine: "Lyninis treniruoklis",
  leg_machine: "Kojų treniruokliai",
};

export const PAIN_LABELS: Record<Pain, string> = { knee: "Kelis", back: "Nugara", shoulder: "Petys" };

export const PAIN_ACCUSATIVE: Record<Pain, string> = { knee: "kelį", back: "nugarą", shoulder: "petį" };

const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Pirmadienis",
  tuesday: "Antradienis",
  wednesday: "Trečiadienis",
  thursday: "Ketvirtadienis",
  friday: "Penktadienis",
  saturday: "Šeštadienis",
  sunday: "Sekmadienis",
};

export function weekdayLabel(day: Weekday): string {
  return WEEKDAY_LABELS[day];
}

export function sortWeekdays(days: readonly Weekday[]): Weekday[] {
  return [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b));
}

export function nextWeekday(day: Weekday): Weekday {
  return WEEKDAYS[(WEEKDAYS.indexOf(day) + 1) % WEEKDAYS.length];
}

export function previousWeekday(day: Weekday): Weekday {
  return WEEKDAYS[(WEEKDAYS.indexOf(day) + WEEKDAYS.length - 1) % WEEKDAYS.length];
}
