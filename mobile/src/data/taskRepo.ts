import { db } from "../storage/db";
import { apiGet, apiPost, apiDelete } from "../api/client";

export type TaskLocal = {
  local_id: string;
  server_id?: number | null;

  user_id: string;
  title: string;
  course?: string;
  due_at?: string;
  est_minutes: number;
  remaining_minutes: number;
  difficulty: number;
  task_type: string;
  status: string;

  pending_create: 0 | 1;
  pending_update: 0 | 1;
  pending_delete: 0 | 1;
  updated_at_ms: number;
};

type TaskServer = {
  id: number;
  user_id: string;
  title: string;
  course: string;
  due_at: string;
  est_minutes: number;
  remaining_minutes: number;
  difficulty: number;
  task_type: string;
  status: string;
};

function now() {
  return Date.now();
}

function makeLocalId() {
  return `local_${now()}_${Math.floor(Math.random() * 1e9)}`;
}

function rowToTask(row: any): TaskLocal {
  return {
    local_id: row.local_id,
    server_id: row.server_id ?? null,
    user_id: row.user_id,
    title: row.title,
    course: row.course ?? "",
    due_at: row.due_at ?? "",
    est_minutes: Number(row.est_minutes),
    remaining_minutes: Number(row.remaining_minutes),
    difficulty: Number(row.difficulty),
    task_type: row.task_type,
    status: row.status,
    pending_create: Number(row.pending_create) as 0 | 1,
    pending_update: Number(row.pending_update) as 0 | 1,
    pending_delete: Number(row.pending_delete) as 0 | 1,
    updated_at_ms: Number(row.updated_at_ms),
  };
}

export const TaskRepo = {
  // ---- LOCAL ----
  getLocalTasks(userId: string): TaskLocal[] {
    const res = db.getAllSync(
      `SELECT * FROM tasks_local
       WHERE user_id = ?
       AND pending_delete = 0
       ORDER BY due_at ASC, updated_at_ms DESC`,
      [userId]
    );
    return (res as any[]).map(rowToTask);
  },

  upsertLocalTask(t: TaskLocal) {
    db.runSync(
      `INSERT INTO tasks_local (
        local_id, server_id, user_id, title, course, due_at,
        est_minutes, remaining_minutes, difficulty, task_type, status,
        pending_create, pending_update, pending_delete, updated_at_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(local_id) DO UPDATE SET
        server_id = excluded.server_id,
        title = excluded.title,
        course = excluded.course,
        due_at = excluded.due_at,
        est_minutes = excluded.est_minutes,
        remaining_minutes = excluded.remaining_minutes,
        difficulty = excluded.difficulty,
        task_type = excluded.task_type,
        status = excluded.status,
        pending_create = excluded.pending_create,
        pending_update = excluded.pending_update,
        pending_delete = excluded.pending_delete,
        updated_at_ms = excluded.updated_at_ms
      `,
      [
        t.local_id,
        t.server_id ?? null,
        t.user_id,
        t.title,
        t.course ?? "",
        t.due_at ?? "",
        t.est_minutes,
        t.remaining_minutes,
        t.difficulty,
        t.task_type,
        t.status,
        t.pending_create,
        t.pending_update,
        t.pending_delete,
        t.updated_at_ms,
      ]
    );
  },

  markPendingDelete(localId: string) {
    db.runSync(
      `UPDATE tasks_local
       SET pending_delete = 1, updated_at_ms = ?
       WHERE local_id = ?`,
      [now(), localId]
    );
  },

  // ---- HIGH-LEVEL OPS ----
  async addTaskOfflineFirst(input: {
    user_id: string;
    title: string;
    course: string;
    due_at: string;
    est_minutes: number;
    difficulty: number;
    task_type: string;
  }): Promise<TaskLocal> {
    const local: TaskLocal = {
      local_id: makeLocalId(),
      server_id: null,
      user_id: input.user_id,
      title: input.title,
      course: input.course,
      due_at: input.due_at,
      est_minutes: input.est_minutes,
      remaining_minutes: input.est_minutes,
      difficulty: input.difficulty,
      task_type: input.task_type,
      status: "active",
      pending_create: 1,
      pending_update: 0,
      pending_delete: 0,
      updated_at_ms: now(),
    };

    TaskRepo.upsertLocalTask(local);

    try {
      const created = await apiPost<TaskServer>("/tasks", {
        user_id: input.user_id,
        title: input.title,
        course: input.course,
        due_at: input.due_at,
        est_minutes: input.est_minutes,
        difficulty: input.difficulty,
        task_type: input.task_type,
      });

      const synced: TaskLocal = {
        ...local,
        server_id: created.id,
        pending_create: 0,
        updated_at_ms: now(),
        remaining_minutes: created.remaining_minutes ?? local.remaining_minutes,
        status: created.status ?? local.status,
      };
      TaskRepo.upsertLocalTask(synced);
      return synced;
    } catch {
      return local;
    }
  },

  // Pull server → merge into local (simple + safe for now)
  async refreshFromServer(userId: string) {
    const serverTasks = await apiGet<TaskServer[]>(
      `/tasks?user_id=${encodeURIComponent(userId)}`
    );

    for (const st of serverTasks) {
      type LocalRow = { local_id: string };

      const rows = db.getAllSync(
        `SELECT local_id FROM tasks_local WHERE server_id = ? LIMIT 1`,
        [st.id]
      ) as LocalRow[];

      const localId = rows.length ? rows[0].local_id : makeLocalId();

      const merged: TaskLocal = {
        local_id: localId,
        server_id: st.id,
        user_id: st.user_id,
        title: st.title,
        course: st.course ?? "",
        due_at: st.due_at ?? "",
        est_minutes: st.est_minutes,
        remaining_minutes: st.remaining_minutes,
        difficulty: st.difficulty,
        task_type: st.task_type,
        status: st.status,
        pending_create: 0,
        pending_update: 0,
        pending_delete: 0,
        updated_at_ms: now(),
      };

      TaskRepo.upsertLocalTask(merged);
    }
  },

  async syncPendingCreates(userId: string) {
    const pend = db.getAllSync(
      `SELECT * FROM tasks_local
       WHERE user_id = ? AND pending_create = 1 AND pending_delete = 0
       ORDER BY updated_at_ms ASC`,
      [userId]
    ) as any[];

    for (const row of pend) {
      const t = rowToTask(row);
      try {
        const created = await apiPost<TaskServer>("/tasks", {
          user_id: t.user_id,
          title: t.title,
          course: t.course ?? "",
          due_at: t.due_at ?? "",
          est_minutes: t.est_minutes,
          difficulty: t.difficulty,
          task_type: t.task_type,
        });

        TaskRepo.upsertLocalTask({
          ...t,
          server_id: created.id,
          pending_create: 0,
          updated_at_ms: now(),
          remaining_minutes: created.remaining_minutes ?? t.remaining_minutes,
          status: created.status ?? t.status,
        });
      } catch {
        break;
      }
    }
  },

  async deleteTask(local: TaskLocal) {
    TaskRepo.markPendingDelete(local.local_id);

    if (local.server_id) {
      try {
        await apiDelete(`/tasks/${local.server_id}`);
      } catch {
        // keep pending_delete
      }
    }
  },
};
