import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost, apiDelete } from "../api/client";

const USER_ID = "patrick-test";

type HealthResp = { ok: boolean };

type Task = {
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

type PlanBlock = {
  task_id?: number;
  task_name?: string;
  title?: string;
  minutes: number;
};

type PlanDay =
  | { date: string; blocks: PlanBlock[] }
  | { day: string; blocks: PlanBlock[] };

type GeneratePlanResp = { userId: string; plan: any };
type ExplainResp = { explanation: string };

function safeString(x: any): string {
  return typeof x === "string" ? x : JSON.stringify(x, null, 2);
}

function formatDue(dueAt: string) {
  const d = new Date(dueAt);
  if (Number.isNaN(d.getTime())) return dueAt;
  return d.toLocaleString();
}

function getDaysFromPlan(plan: any): PlanDay[] {
  if (!plan) return [];
  if (Array.isArray(plan)) return plan as PlanDay[];
  if (Array.isArray(plan.days)) return plan.days as PlanDay[];
  if (Array.isArray(plan.schedule)) return plan.schedule as PlanDay[];
  return [];
}

function InkButton({
  title,
  iconName,
  onPress,
  variant = "primary",
}: {
  title: string;
  iconName?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  variant?: "primary" | "secondary";
}) {
  const cls =
    variant === "primary"
      ? "flex-row items-center justify-center gap-3 rounded-full bg-ink px-8 py-4 active:opacity-90"
      : "flex-row items-center justify-center gap-3 rounded-full border border-ink/30 bg-transparent px-8 py-4 active:opacity-90";

  const textCls =
    variant === "primary"
      ? "text-lg font-semibold text-gold"
      : "text-lg font-semibold text-ink";

  const iconColor = variant === "primary" ? "#F2AA4C" : "#101820";

  return (
    <Pressable onPress={onPress} className={cls}>
      {iconName ? <Ionicons name={iconName} size={20} color={iconColor} /> : null}
      <Text className={textCls}>{title}</Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-gold/80">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? "default"}
        className="h-12 rounded-2xl border border-white/10 bg-white/95 px-4 text-base text-ink"
        placeholderTextColor="#6B7280"
      />
    </View>
  );
}

export default function Home() {
  const [health, setHealth] = useState<string>("Not checked");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>("");

  const [title, setTitle] = useState("COP3530 Project");
  const [course, setCourse] = useState("COP3530");
  const [dueAt, setDueAt] = useState("2025-12-27T23:59:00");
  const [minutes, setMinutes] = useState("240");
  const [difficulty, setDifficulty] = useState("4");

  const [planRaw, setPlanRaw] = useState<any>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");

  const totalRemaining = useMemo(
    () => tasks.reduce((sum, t) => sum + (t.remaining_minutes ?? 0), 0),
    [tasks]
  );

  async function checkHealth() {
    setError("");
    try {
      const r = await apiGet<HealthResp>("/health");
      setHealth(r.ok ? "Online" : "Offline");
    } catch (e: any) {
      setHealth("Offline");
      setError(e?.message ?? String(e));
    }
  }

  async function refreshTasks() {
    setError("");
    try {
      const r = await apiGet<Task[]>(`/tasks?user_id=${encodeURIComponent(USER_ID)}`);
      setTasks(r);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function addTask() {
    setError("");
    setAiExplanation("");
    setPlanRaw(null);
    try {
      await apiPost<Task>("/tasks", {
        user_id: USER_ID,
        title,
        course,
        due_at: dueAt,
        est_minutes: Number(minutes),
        difficulty: Number(difficulty),
        task_type: "assignment",
      });
      await refreshTasks();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function deleteTask(taskId: number) {
    setError("");
    try {
      await apiDelete(`/tasks/${taskId}`);
      // Clear plan & AI explanation so UI doesn’t reflect deleted tasks
      setPlanRaw(null);
      setAiExplanation("");
      await refreshTasks();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  async function generatePlanAndExplain() {
    setError("");
    setAiExplanation("");
    setPlanRaw(null);

    try {
      // ensure we have fresh tasks
      const currentTasks =
        tasks.length > 0
          ? tasks
          : await apiGet<Task[]>(`/tasks?user_id=${encodeURIComponent(USER_ID)}`);

      setTasks(currentTasks);

      // generate plan
      const gen = await apiPost<GeneratePlanResp>("/plan/generate", {
        user_id: USER_ID,
        days: 7,
      });

      setPlanRaw(gen.plan);

      // ask Gemini to explain
      const ai = await apiPost<ExplainResp>("/ai/explain-plan", {
        tasks: currentTasks,
        plan: gen.plan,
      });

      setAiExplanation(ai.explanation);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  useEffect(() => {
    checkHealth();
    refreshTasks();
  }, []);

  const days = useMemo(() => getDaysFromPlan(planRaw), [planRaw]);

  return (
    <ScrollView className="flex-1 bg-gold" contentContainerStyle={{ paddingBottom: 56 }}>
      <View className="px-6 pt-8">
        {/* HERO */}
        <View className="overflow-hidden rounded-3xl border border-ink/10 bg-gold shadow-sm">
          <View className="p-10">
            <Text className="text-6xl font-extrabold tracking-tight text-ink">
              UF Study Planner
            </Text>

            <Text className="mt-6 max-w-2xl text-lg leading-7 text-ink/80">
              Algorithmic weekly planning + Gemini explanation (backend-proxied).
            </Text>

            <View className="mt-7 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-ink/10 px-3 py-1">
                <Text className="text-xs font-semibold text-ink">Backend: {health}</Text>
              </View>
              <View className="rounded-full bg-ink/10 px-3 py-1">
                <Text className="text-xs font-semibold text-ink">{tasks.length} tasks</Text>
              </View>
              <View className="rounded-full bg-ink/10 px-3 py-1">
                <Text className="text-xs font-semibold text-ink">{totalRemaining} min left</Text>
              </View>
            </View>

            <View className="mt-10 flex-row flex-wrap gap-4">
              <InkButton
                title="Generate Plan"
                iconName="calendar-outline"
                onPress={generatePlanAndExplain}
              />
              <InkButton
                title="Refresh"
                iconName="sync-outline"
                onPress={refreshTasks}
                variant="secondary"
              />
            </View>
          </View>

          <View className="bg-ink px-10 py-5">
            <Text className="text-base text-gold">
              Tip: due dates + remaining minutes drive scheduling. Gemini explains the rationale.
            </Text>
          </View>
        </View>

        {/* ERROR */}
        {error ? (
          <View className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4">
            <Text className="font-semibold text-red-700">Something went wrong</Text>
            <Text className="mt-1 text-red-700 whitespace-pre-wrap">{error}</Text>
          </View>
        ) : null}

        {/* ADD TASK */}
        <View className="mt-8 rounded-3xl bg-ink p-6 shadow-sm">
          <Text className="text-xl font-semibold text-gold">Add task</Text>

          <View className="mt-5 gap-4">
            <Field label="Title" value={title} onChangeText={setTitle} />
            <Field label="Course" value={course} onChangeText={setCourse} />
            <Field
              label="Due (ISO)"
              value={dueAt}
              onChangeText={setDueAt}
              placeholder="YYYY-MM-DDTHH:MM:SS"
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field
                  label="Est. minutes"
                  value={minutes}
                  onChangeText={setMinutes}
                  keyboardType="numeric"
                />
              </View>
              <View className="w-28">
                <Field
                  label="Difficulty"
                  value={difficulty}
                  onChangeText={setDifficulty}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Pressable
              onPress={addTask}
              className="mt-2 h-12 items-center justify-center rounded-2xl bg-gold active:opacity-90"
            >
              <Text className="text-base font-semibold text-ink">Add task</Text>
            </Pressable>
          </View>
        </View>

        {/* PLAN */}
        {planRaw ? (
          <View className="mt-8 rounded-3xl bg-ink p-6 shadow-sm">
            <Text className="text-xl font-semibold text-gold">Weekly Plan</Text>
            <Text className="mt-1 text-sm text-gold/70">
              Generated by your scheduler.
            </Text>

            {days.length === 0 ? (
              <View className="mt-4 rounded-2xl bg-white/5 p-4">
                <Text className="text-sm text-gold/80">Raw plan:</Text>
                <Text className="mt-2 text-xs text-gold/70 whitespace-pre-wrap">
                  {safeString(planRaw)}
                </Text>
              </View>
            ) : (
              <View className="mt-5 gap-4">
                {days.map((d: any, idx: number) => {
                  const dateLabel = d.date ?? d.day ?? `Day ${idx + 1}`;
                  const blocks: PlanBlock[] = Array.isArray(d.blocks) ? d.blocks : [];
                  return (
                    <View key={`${dateLabel}_${idx}`} className="rounded-2xl bg-white/5 p-4">
                      <Text className="text-base font-semibold text-gold">{dateLabel}</Text>

                      {blocks.length === 0 ? (
                        <Text className="mt-2 text-sm text-gold/60">No blocks scheduled.</Text>
                      ) : (
                        <View className="mt-3 gap-2">
                          {blocks.map((b, j) => (
                            <View
                              key={`${idx}_${j}`}
                              className="flex-row items-center justify-between rounded-xl bg-gold px-4 py-3"
                            >
                              <Text className="flex-1 pr-3 text-sm font-semibold text-ink">
                                {b.task_name ?? b.title ?? "Task"}
                              </Text>
                              <Text className="text-sm font-bold text-ink">{b.minutes}m</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {aiExplanation ? (
              <View className="mt-6 rounded-2xl bg-white/5 p-4">
                <Text className="text-base font-semibold text-gold">Why this plan?</Text>
                <Text className="mt-3 text-sm text-gold/80 whitespace-pre-wrap">
                  {aiExplanation}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* TASKS */}
        <View className="mt-8">
          <Text className="text-xl font-extrabold text-ink">Tasks</Text>

          {tasks.length === 0 ? (
            <View className="mt-4 rounded-3xl bg-ink p-6 shadow-sm">
              <Text className="text-base font-semibold text-gold">No tasks yet</Text>
              <Text className="mt-1 text-sm text-gold/70">Add one above and refresh.</Text>
            </View>
          ) : (
            <View className="mt-4 gap-3">
              {tasks.map((t) => {
                const donePct =
                  t.est_minutes > 0
                    ? Math.max(
                        0,
                        Math.min(
                          100,
                          ((t.est_minutes - t.remaining_minutes) / t.est_minutes) * 100
                        )
                      )
                    : 0;

                return (
                  <View key={t.id} className="rounded-3xl bg-ink p-6 shadow-sm">
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-gold">
                          {t.course ? `[${t.course}] ` : ""}
                          {t.title}
                        </Text>
                        <Text className="mt-1 text-sm text-gold/70">
                          Due {formatDue(t.due_at)}
                        </Text>
                      </View>

                      <View className="items-end gap-3">
                        <Pressable
                          onPress={() => deleteTask(t.id)}
                          className="h-10 w-10 items-center justify-center rounded-full bg-gold active:opacity-90"
                        >
                          <Ionicons name="trash-outline" size={18} color="#eb0000ff" />
                        </Pressable>

                        <View className="items-end">
                          <Text className="text-sm font-semibold text-gold">
                            {t.remaining_minutes}/{t.est_minutes} min
                          </Text>
                          <Text className="mt-1 text-xs text-gold/60">
                            diff {t.difficulty} • {t.task_type}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gold/20">
                      <View
                        className="h-2 rounded-full bg-gold"
                        style={{ width: `${donePct}%` }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
