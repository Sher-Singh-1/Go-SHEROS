"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { recalculateStreakOnCompletion } from "@/lib/streaks/engine";
import { createTaskSchema } from "@/lib/validation/tasks";
import type { TaskStatus } from "@prisma/client";

export type TaskFormState = { error?: string } | undefined;

export async function createTask(_prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const user = await requireUser();

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    dueTime: formData.get("dueTime") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    category: formData.get("category") || undefined,
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
    notes: formData.get("notes") || undefined,
    goalId: formData.get("goalId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const maxOrder = await prisma.task.aggregate({
    where: { userId: user.id, date: parsed.data.date },
    _max: { order: true },
  });

  await prisma.task.create({
    data: { ...parsed.data, userId: user.id, order: (maxOrder._max.order ?? 0) + 1 },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/calendar");
}

export async function updateTask(taskId: string, _prev: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const user = await requireUser();

  const parsed = createTaskSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    startTime: formData.get("startTime") || undefined,
    dueTime: formData.get("dueTime") || undefined,
    priority: formData.get("priority") || "MEDIUM",
    category: formData.get("category") || undefined,
    estimatedMinutes: formData.get("estimatedMinutes") || undefined,
    notes: formData.get("notes") || undefined,
    recurrenceDays: formData.getAll("recurrenceDays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const existing = await prisma.task.findUnique({ where: { id: taskId, userId: user.id }, select: { seriesId: true } });
  if (!existing) return { error: "Couldn't find that task." };
  // Generated instances of a series can't themselves become a new root —
  // only the original recurring task can carry recurrenceDays.
  const recurrenceDays = existing.seriesId ? [] : parsed.data.recurrenceDays;

  const result = await prisma.task.updateMany({
    where: { id: taskId, userId: user.id },
    data: {
      title: parsed.data.title,
      date: parsed.data.date,
      startTime: parsed.data.startTime ?? null,
      dueTime: parsed.data.dueTime ?? null,
      priority: parsed.data.priority,
      category: parsed.data.category ?? null,
      estimatedMinutes: parsed.data.estimatedMinutes ?? null,
      notes: parsed.data.notes ?? null,
      recurrenceDays,
    },
  });
  if (result.count === 0) return { error: "Couldn't find that task." };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/calendar");
}

export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const user = await requireUser();

  const task = await prisma.task.update({
    where: { id: taskId, userId: user.id },
    data: { status },
  });

  if (status === "COMPLETED") {
    await recalculateStreakOnCompletion(user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/calendar");
  if (task.goalId) revalidatePath(`/dashboard/goals/${task.goalId}`);
}

// Reuses the existing `priority` field as a lightweight star/pin toggle:
// starring a task simply promotes it to HIGH (unstarring drops it back to
// MEDIUM), so it surfaces in "Focus on these first" without a new column.
export async function toggleTaskPriority(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({ where: { id: taskId, userId: user.id }, select: { priority: true } });
  if (!task) return;

  await prisma.task.update({
    where: { id: taskId, userId: user.id },
    data: { priority: task.priority === "HIGH" ? "MEDIUM" : "HIGH" },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
  revalidatePath("/dashboard/calendar");
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  await prisma.task.delete({ where: { id: taskId, userId: user.id } });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/today");
}

export async function reorderTasks(orderedIds: string[]) {
  const user = await requireUser();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.task.update({ where: { id, userId: user.id }, data: { order: index } })
    )
  );
  revalidatePath("/dashboard/today");
}
