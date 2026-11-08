import { z } from "zod";
import { WeekdaySchema } from "./profile";

export const WARM_UP_MINUTES = 10;
export const BEGINNER_MAX_SETS = 3;

export const PlannedExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(50),
});

export const PlanDaySchema = z.object({
  day: WeekdaySchema,
  exercises: z.array(PlannedExerciseSchema).min(1),
});

export const WeeklyPlanSchema = z.object({
  days: z.array(PlanDaySchema).min(1),
});

export type PlannedExercise = z.infer<typeof PlannedExerciseSchema>;
export type PlanDay = z.infer<typeof PlanDaySchema>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;

export type RuleCode = "FORMAT" | "CATALOG" | "R1" | "R2" | "R3" | "R4" | "R5" | "R6";

export interface Violation {
  rule: RuleCode;
  message: string;
}

export type PlanSource = "ai" | "simplified" | "manual";
