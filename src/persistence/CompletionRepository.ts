import type { DatabaseSync } from "node:sqlite";
import type { Weekday } from "@/domain/profile";
import type { Completion } from "@/domain/progress";

export class CompletionRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly tenantId: string,
  ) {}

  list(weekStart: string): Completion[] {
    const rows = this.database
      .prepare("SELECT day, exercise_id FROM completions WHERE tenant_id = ? AND week_start = ?")
      .all(this.tenantId, weekStart) as { day: Weekday; exercise_id: string }[];
    return rows.map((row) => ({ day: row.day, exerciseId: row.exercise_id }));
  }

  mark(weekStart: string, day: Weekday, exerciseIds: string[]): void {
    const insert = this.database.prepare(
      "INSERT OR IGNORE INTO completions (tenant_id, week_start, day, exercise_id) VALUES (?, ?, ?, ?)",
    );
    for (const exerciseId of exerciseIds) insert.run(this.tenantId, weekStart, day, exerciseId);
  }

  unmark(weekStart: string, day: Weekday, exerciseIds: string[]): void {
    const remove = this.database.prepare(
      "DELETE FROM completions WHERE tenant_id = ? AND week_start = ? AND day = ? AND exercise_id = ?",
    );
    for (const exerciseId of exerciseIds) remove.run(this.tenantId, weekStart, day, exerciseId);
  }
}
