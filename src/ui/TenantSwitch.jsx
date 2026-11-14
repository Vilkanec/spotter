"use client";

import { useRouter } from "next/navigation";
import { sendJson } from "./api";

export function TenantSwitch({ tenants, currentTenantId }) {
  const router = useRouter();

  async function switchTo(tenantId) {
    await sendJson("/api/tenant", "PUT", { tenantId });
    router.push("/");
    router.refresh();
  }

  return (
    <select className="input" value={currentTenantId} aria-label="Klientas" onChange={(event) => switchTo(event.target.value)}>
      {tenants.map((tenant) => (
        <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
      ))}
    </select>
  );
}
