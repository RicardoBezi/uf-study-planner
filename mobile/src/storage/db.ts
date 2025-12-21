import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("uf_study_planner.db");

export function migrate() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS tasks_local (
      local_id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      course TEXT,
      due_at TEXT,
      est_minutes INTEGER NOT NULL,
      remaining_minutes INTEGER NOT NULL,
      difficulty INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      status TEXT NOT NULL,

      pending_create INTEGER NOT NULL DEFAULT 0,
      pending_update INTEGER NOT NULL DEFAULT 0,
      pending_delete INTEGER NOT NULL DEFAULT 0,

      updated_at_ms INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks_local(user_id);
  `);
}
