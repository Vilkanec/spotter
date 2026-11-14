import { z } from "zod";
import { WEEKDAY_LABELS } from "@/core/labels";
import { checkPlan } from "@/core/planRules";
import { WeekdaySchema } from "@/core/profile";
import { isDayDone, weekStartOf } from "@/core/progress";
import { InputError } from "./InputError";

const BLOCKING_RULES = ["FORMAT", "CATALOG"];

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
  #store;
  #generator;

  constructor(store, generator) {
    this.#store = store;
    this.#generator = generator;
  }

  overview(today) {
    const stored = this.#store.findPlan();
    if (!stored) return null;

    const completions = this.#store.listCompletions(weekStartOf(today));
    const completedDays = stored.plan.days.filter((day) => isDayDone(completions, day)).length;
    return { ...stored, completions, completedDays };
  }

  async generate() {
    const result = await this.#generator.generate(this.#requireProfile());
    if (result.status !== "error") {
      const source = result.status === "ready" ? "ai" : "simplified";
      this.#store.savePlan({ plan: result.plan, source, warnings: [] });
    }
    return result;
  }

  async revise(input) {
    const { plan, instruction } = parseInput(ReviseRequestSchema, input);
    const profile = this.#requireProfile();
    const current = checkPlan(plan, profile);
    if (!current.plan) throw new InputError("Prieš klausiant AI, kiekvienoje dienoje turi būti bent vienas pratimas.");

    return this.#generator.revise(profile, current.plan, instruction);
  }

  saveManual(input) {
    const { plan, violations } = checkPlan(input, this.#requireProfile());
    const blocking = violations.find((violation) => BLOCKING_RULES.includes(violation.rule));
    if (!plan || blocking) throw new InputError(blocking?.message ?? "Netinkamas planas.");

    this.#store.savePlan({ plan, source: "manual", warnings: violations });
    return violations;
  }

  updateCompletion(input, today) {
    const { day, exerciseId, done } = parseInput(CompletionChangeSchema, input);
    const planDay = this.#store.findPlan()?.plan.days.find((candidate) => candidate.day === day);
    if (!planDay) throw new InputError(`${WEEKDAY_LABELS[day]} treniruotės nėra.`);

    const exerciseIds = exerciseId ? [exerciseId] : planDay.exercises.map((planned) => planned.exerciseId);
    if (done) this.#store.markDone(weekStartOf(today), day, exerciseIds);
    else this.#store.unmarkDone(weekStartOf(today), day, exerciseIds);
  }

  #requireProfile() {
    const profile = this.#store.findProfile();
    if (!profile) throw new InputError("Pirmiausia užpildyk profilį.");
    return profile;
  }
}

function parseInput(schema, input) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new InputError("Netinkama užklausa.");
  return parsed.data;
}
