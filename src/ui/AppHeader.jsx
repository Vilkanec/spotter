import Link from "next/link";
import { allTenants, currentTenant } from "@/server/tenantContext";
import { TenantSwitch } from "./TenantSwitch";

export async function AppHeader() {
  const tenant = await currentTenant();

  return (
    <header className="header">
      <Link className="wordmark" href="/">Spotter</Link>
      <TenantSwitch tenants={allTenants()} currentTenantId={tenant.id} />
    </header>
  );
}
