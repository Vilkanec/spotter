import Link from "next/link";
import { currentTenant } from "@/server/tenant";
import { listTenants } from "@/services/container";
import { TenantSwitch } from "./TenantSwitch";

export async function AppHeader() {
  return (
    <header className="header">
      <Link className="wordmark" href="/">Spotter</Link>
      <TenantSwitch tenants={listTenants()} currentTenantId={(await currentTenant()).id} />
    </header>
  );
}
