import { z } from "zod";
import type { ExerciseCatalog } from "@/domain/exercise";
import type { Violation } from "@/domain/plan";
import { weekdayLabel, WeekdaySchema, type Profile } from "@/domain/profile";
import { isDayDone, type Completion } from "@/domain/progress";
import type { CompletionRepository } from "@/persistence/CompletionRepository";
import type { PlanRepository, StoredPlan } from "@/persistence/PlanRepository";
import type { ProfileRepository } from "@/persistence/ProfileRepository";
import type { GenerationResult, PlanGenerator } from "@/planning/PlanGenerator";
import type { PlanValidator } from "@/planning/PlanValidator";
import { InputError } from "./errors";
import { weekStartOf } from "./week";

export interface PlanOverview extends StoredPlan {
  completions: Completion[];
  completedDays: number;
}

const ReviseRequestSchema = z.object({
  plan: z.unknown(),
  instruction: z.string().trim().min(3).max(500),
});

const CompletionChangeSchema = z.object({
  day: WeekdaySchema,
  exerciseId: z.string().nullable(),
  done: z.boolean(),
});

export class PlanService {
  constructor(
    private readonly catalog: ExerciseCatalog,
    private readonly profiles: ProfileRepository,
    private readonly plans: PlanRepository,
    private readonly completions: CompletionRepository,
    private readonly generator: PlanGenerator,
    private readonly validator: PlanValidator,
  ) {}

  overview(today: Date): PlanOverview | null {
    const stored = this.plans.find();
    if (!stored) return null;

    const completions = this.completions.list(weekStartOf(today));
    const completedDays = stored.plan.days.filter((day) => isDayDone(completions, day)).length;
    return { ...stored, completions, completedDays };
  }

  async generate(): Promise<GenerationResult> {
    const result = await this.generator.generate(this.requireProfile(), this.catalog);
    if (result.status !== "error") {
      this.plans.save({ plan: result.plan, source: result.status === "ready" ? "ai" : "simplified", warnings: [] });
    }
    return result;
  }

  async revise(input: unknown): Promise<GenerationResult> {
    const { plan, instruction } = this.parse(ReviseRequestSchema, input);
    const profile = this.requireProfile();
    const current = this.validator.parseAndValidate(plan, { profile, catalog: this.catalog });
    if (!current.plan) throw new InputError("Prieš klausiant AI, kiekvienoje dienoje turi būti bent vienas pratimas.");

    return this.generator.revise(profile, this.catalog, current.plan, instruction);
  }

  saveManual(input: unknown): Violation[] {
    const { plan, violations } = this.validator.parseAndValidate(input, { profile: this.requireProfile(), catalog: this.catalog });
    const blocking = violations.find((violation) => violation.rule === "FORMAT" || violation.rule === "CATALOG");
    if (!plan || blocking) throw new InputError(blocking?.message ?? "Netinkamas planas.");

    this.plans.save({ plan, source: "manual", warnings: violations });
    return violations;
  }

  updateCompletion(input: unknown, today: Date): void {
    const { day, exerciseId, done } = this.parse(CompletionChangeSchema, input);
    const planDay = this.plans.find()?.plan.days.find((candidate) => candidate.day === day);
    if (!planDay) throw new InputError(`${weekdayLabel(day)} treniruotės nėra.`);

    const exerciseIds = exerciseId ? [exerciseId] : planDay.exercises.map((exercise) => exercise.exerciseId);
    if (done) this.completions.mark(weekStartOf(today), day, exerciseIds);
    else this.completions.unmark(weekStartOf(today), day, exerciseIds);
  }

  private requireProfile(): Profile {
    const profile = this.profiles.find();
    if (!profile) throw new InputError("Pirmiausia užpildyk profilį.");
    return profile;
  }

  private parse<T>(schema: z.ZodType<T>, input: unknown): T {
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new InputError("Netinkama užklausa.");
    return parsed.data;
  }
}
