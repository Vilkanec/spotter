import type { DatabaseSync } from "node:sqlite";

export interface Tenant {
  id: string;
  name: string;
  description: string;
}

export class TenantRepository {
  constructor(private readonly database: DatabaseSync) {}

  list(): Tenant[] {
    const rows = this.database.prepare("SELECT id, name, description FROM tenants ORDER BY name").all() as unknown as Tenant[];
    return rows.map(({ id, name, description }) => ({ id, name, description }));
  }
}
