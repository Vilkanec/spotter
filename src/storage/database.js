import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SAMPLE_TENANTS } from "./sampleData";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profiles (
    tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS plans (
    tenant_id TEXT PRIMARY KEY REFERENCES tenants(id),
    data TEXT NOT NULL,
    source TEXT NOT NULL,
    warnings TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS completions (
    tenant_id TEXT NOT NULL REFERENCES tenants(id),
    week_start TEXT NOT NULL,
    day TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    PRIMARY KEY (tenant_id, week_start, day, exercise_id)
  );
`;

export function openDatabase(path) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });

  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(SCHEMA);
  insertSampleData(database);
  return database;
}

export function listTenants(database) {
  return database
    .prepare("SELECT id, name, description FROM tenants ORDER BY name")
    .all()
    .map(({ id, name, description }) => ({ id, name, description }));
}

function insertSampleData(database) {
  const insertTenant = database.prepare(
    "INSERT INTO tenants (id, name, description) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description",
  );
  const insertProfile = database.prepare("INSERT OR IGNORE INTO profiles (tenant_id, data) VALUES (?, ?)");
  const insertPlan = database.prepare(
    "INSERT OR IGNORE INTO plans (tenant_id, data, source, warnings) VALUES (?, ?, 'manual', '[]')",
  );

  for (const tenant of SAMPLE_TENANTS) {
    insertTenant.run(tenant.id, tenant.name, tenant.description);
    insertProfile.run(tenant.id, JSON.stringify(tenant.profile));
    if (tenant.plan) insertPlan.run(tenant.id, JSON.stringify(tenant.plan));
  }
}
