import { cookies } from "next/headers";
import { GeminiClient } from "@/ai/GeminiClient";
import { PlanGenerator } from "@/core/PlanGenerator";
import { InputError } from "@/services/InputError";
import { OnboardingService } from "@/services/OnboardingService";
import { PlanService } from "@/services/PlanService";
import { listTenants, openDatabase } from "@/storage/database";
import { TenantStore } from "@/storage/TenantStore";

const TENANT_COOKIE = "spotter_tenant";

const ai = new GeminiClient(process.env.GEMINI_API_KEY, process.env.GEMINI_MODEL ?? "gemini-3.8-flash");

function database() {
  globalThis.spotterDatabase ??= openDatabase(process.env.DATABASE_PATH ?? "data/spotter.db");
  return globalThis.spotterDatabase;
}

export function allTenants() {
  return listTenants(database());
}

export async function currentTenant() {
  const requestedId = (await cookies()).get(TENANT_COOKIE)?.value;
  const tenants = allTenants();
  return tenants.find((tenant) => tenant.id === requestedId) ?? tenants[0];
}

export async function currentServices() {
  const tenant = await currentTenant();
  const store = new TenantStore(database(), tenant.id);
  return {
    onboarding: new OnboardingService(store, ai),
    plans: new PlanService(store, new PlanGenerator(ai)),
  };
}

export async function switchTenant(tenantId) {
  if (!allTenants().some((tenant) => tenant.id === tenantId)) throw new InputError("Nežinomas klientas.");
  (await cookies()).set(TENANT_COOKIE, tenantId, { httpOnly: true, sameSite: "lax", path: "/" });
}
