import type { DatabaseSync } from "node:sqlite";
import type { PlanSource, Violation, WeeklyPlan } from "@/domain/plan";

export interface StoredPlan {
  plan: WeeklyPlan;
  source: PlanSource;
  warnings: Violation[];
}

export class PlanRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly tenantId: string,
  ) {}

  find(): StoredPlan | null {
    const row = this.database
      .prepare("SELECT data, source, warnings FROM plans WHERE tenant_id = ?")
      .get(this.tenantId) as { data: string; source: PlanSource; warnings: string } | undefined;
    if (!row) return null;
    return { plan: JSON.parse(row.data) as WeeklyPlan, source: row.source, warnings: JSON.parse(row.warnings) as Violation[] };
  }

  save({ plan, source, warnings }: StoredPlan): void {
    this.database
      .prepare(`
        INSERT INTO plans (tenant_id, data, source, warnings) VALUES (?, ?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET data = excluded.data, source = excluded.source, warnings = excluded.warnings
      `)
      .run(this.tenantId, JSON.stringify(plan), source, JSON.stringify(warnings));
  }
}
