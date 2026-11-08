import { cookies } from "next/headers";
import type { Tenant } from "@/persistence/TenantRepository";
import { listTenants, servicesFor, type Services } from "@/services/container";
import { InputError } from "@/services/errors";

const TENANT_COOKIE = "spotter_tenant";

export async function currentTenant(): Promise<Tenant> {
  const requested = (await cookies()).get(TENANT_COOKIE)?.value;
  const tenants = listTenants();
  return tenants.find((tenant) => tenant.id === requested) ?? tenants[0];
}

export async function currentServices(): Promise<Services> {
  return servicesFor((await currentTenant()).id);
}

export async function switchTenant(tenantId: unknown): Promise<void> {
  if (!listTenants().some((tenant) => tenant.id === tenantId)) throw new InputError("Nežinomas klientas.");
  (await cookies()).set(TENANT_COOKIE, String(tenantId), { httpOnly: true, sameSite: "lax", path: "/" });
}
