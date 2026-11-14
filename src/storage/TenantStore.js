export class TenantStore {
  #database;
  #tenantId;

  constructor(database, tenantId) {
    this.#database = database;
    this.#tenantId = tenantId;
  }

  findProfile() {
    const row = this.#database.prepare("SELECT data FROM profiles WHERE tenant_id = ?").get(this.#tenantId);
    return row ? JSON.parse(row.data) : null;
  }

  saveProfile(profile) {
    this.#database
      .prepare("INSERT INTO profiles (tenant_id, data) VALUES (?, ?) ON CONFLICT(tenant_id) DO UPDATE SET data = excluded.data")
      .run(this.#tenantId, JSON.stringify(profile));
  }

  findPlan() {
    const row = this.#database
      .prepare("SELECT data, source, warnings FROM plans WHERE tenant_id = ?")
      .get(this.#tenantId);
    if (!row) return null;
    return { plan: JSON.parse(row.data), source: row.source, warnings: JSON.parse(row.warnings) };
  }

  savePlan({ plan, source, warnings }) {
    this.#database
      .prepare(`
        INSERT INTO plans (tenant_id, data, source, warnings) VALUES (?, ?, ?, ?)
        ON CONFLICT(tenant_id) DO UPDATE SET data = excluded.data, source = excluded.source, warnings = excluded.warnings
      `)
      .run(this.#tenantId, JSON.stringify(plan), source, JSON.stringify(warnings));
  }

  listCompletions(weekStart) {
    return this.#database
      .prepare("SELECT day, exercise_id FROM completions WHERE tenant_id = ? AND week_start = ?")
      .all(this.#tenantId, weekStart)
      .map((row) => ({ day: row.day, exerciseId: row.exercise_id }));
  }

  markDone(weekStart, day, exerciseIds) {
    const insert = this.#database.prepare(
      "INSERT OR IGNORE INTO completions (tenant_id, week_start, day, exercise_id) VALUES (?, ?, ?, ?)",
    );
    for (const exerciseId of exerciseIds) insert.run(this.#tenantId, weekStart, day, exerciseId);
  }

  unmarkDone(weekStart, day, exerciseIds) {
    const remove = this.#database.prepare(
      "DELETE FROM completions WHERE tenant_id = ? AND week_start = ? AND day = ? AND exercise_id = ?",
    );
    for (const exerciseId of exerciseIds) remove.run(this.#tenantId, weekStart, day, exerciseId);
  }
}
