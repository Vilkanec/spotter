import type { DatabaseSync } from "node:sqlite";
import type { Profile } from "@/domain/profile";

export class ProfileRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly tenantId: string,
  ) {}

  find(): Profile | null {
    const row = this.database.prepare("SELECT data FROM profiles WHERE tenant_id = ?").get(this.tenantId) as
      | { data: string }
      | undefined;
    return row ? (JSON.parse(row.data) as Profile) : null;
  }

  save(profile: Profile): void {
    this.database
      .prepare("INSERT INTO profiles (tenant_id, data) VALUES (?, ?) ON CONFLICT(tenant_id) DO UPDATE SET data = excluded.data")
      .run(this.tenantId, JSON.stringify(profile));
  }
}
