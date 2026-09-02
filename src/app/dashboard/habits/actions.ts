"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { recalculateStreakOnCompletion } from "@/lib/streaks/engine";

export type HabitFormState = { error?: string } | undefined;

export async function createHabit(_prev: HabitFormState, formData: FormData): Promise<HabitFormState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give the habit a name." };

  await prisma.habit.create({ data: { userId: user.id, title } });
  revalidatePath("/dashboard/habits");
}

export async function toggleHabitToday(habitId: string) {
  const user = await requireUser();
  const today = startOfDay(new Date());

  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date: today } } });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({ data: { habitId, date: today, completed: true } });
    await recalculateStreakOnCompletion(user.id, today);
  }

  revalidatePath("/dashboard/habits");
  revalidatePath("/dashboard");
}

export async function archiveHabit(habitId: string) {
  const user = await requireUser();
  await prisma.habit.updateMany({ where: { id: habitId, userId: user.id }, data: { archived: true } });
  revalidatePath("/dashboard/habits");
}
