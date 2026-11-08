import type { DatabaseSync } from "node:sqlite";
import { GeminiClient } from "@/ai/GeminiClient";
import { ExerciseCatalog } from "@/domain/exercise";
import { CompletionRepository } from "@/persistence/CompletionRepository";
import { openDatabase } from "@/persistence/database";
import { EXERCISE_CATALOG } from "@/persistence/exerciseCatalog";
import { PlanRepository } from "@/persistence/PlanRepository";
import { ProfileRepository } from "@/persistence/ProfileRepository";
import { TenantRepository, type Tenant } from "@/persistence/TenantRepository";
import { ExerciseSelector } from "@/planning/ExerciseSelector";
import { FallbackPlanBuilder } from "@/planning/FallbackPlanBuilder";
import { PlanGenerator } from "@/planning/PlanGenerator";
import { PlanPrompt } from "@/planning/PlanPrompt";
import { PlanValidator } from "@/planning/PlanValidator";
import { OnboardingService } from "./OnboardingService";
import { PlanService } from "./PlanService";

export interface Services {
  onboarding: OnboardingService;
  plans: PlanService;
}

export const catalog = new ExerciseCatalog(EXERCISE_CATALOG);

const ai = new GeminiClient(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL ?? "gemini-3.8-flash");
const validator = new PlanValidator();
const generator = new PlanGenerator(ai, new ExerciseSelector(), validator, new PlanPrompt(), new FallbackPlanBuilder());

const cache = globalThis as { spotterDatabase?: DatabaseSync };

function database(): DatabaseSync {
  cache.spotterDatabase ??= openDatabase(process.env.DATABASE_PATH ?? "data/spotter.db");
  return cache.spotterDatabase;
}

export function listTenants(): Tenant[] {
  return new TenantRepository(database()).list();
}

export function servicesFor(tenantId: string): Services {
  const profiles = new ProfileRepository(database(), tenantId);
  return {
    onboarding: new OnboardingService(ai, profiles),
    plans: new PlanService(
      catalog,
      profiles,
      new PlanRepository(database(), tenantId),
      new CompletionRepository(database(), tenantId),
      generator,
      validator,
    ),
  };
}
