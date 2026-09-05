"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { professions } from "@/lib/validation/onboarding";
import { issueBackupCodes } from "@/lib/auth/backup-codes";
import type { FormState } from "@/app/(auth)/actions";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const profession = String(formData.get("profession") ?? "OTHER");
  if (!displayName) return { error: "Display name can't be empty." };
  if (!professions.includes(profession as (typeof professions)[number])) return { error: "Invalid selection." };

  await prisma.profile.update({
    where: { userId: user.id },
    data: { displayName, profession: profession as (typeof professions)[number] },
  });
  revalidatePath("/dashboard/settings");
  return { info: "Saved." };
}

export async function updatePreferences(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const hoursPerDay = Number(formData.get("hoursPerDay"));
  const preferredStartHour = Number(formData.get("preferredStartHour"));
  const preferredEndHour = Number(formData.get("preferredEndHour"));

  if (!Number.isFinite(hoursPerDay) || hoursPerDay <= 0 || hoursPerDay > 16) {
    return { error: "Hours per day should be between 0 and 16." };
  }
  if (preferredEndHour <= preferredStartHour) {
    return { error: "End hour needs to be after the start hour." };
  }

  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: { hoursPerDay, preferredStartHour, preferredEndHour },
  });
  revalidatePath("/dashboard/settings");
  return { info: "Saved." };
}

export async function updateNotificationSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const reminderEnabled = formData.get("reminderEnabled") === "on";
  const timeOfDay = String(formData.get("timeOfDay") ?? "08:00");
  const taskDueEnabled = formData.get("taskDueEnabled") === "on";
  const marketingOptIn = formData.get("marketingOptIn") === "on";
  const quietHoursStartRaw = formData.get("quietHoursStart");
  const quietHoursEndRaw = formData.get("quietHoursEnd");
  const quietHoursStart = quietHoursStartRaw ? Number(quietHoursStartRaw) : null;
  const quietHoursEnd = quietHoursEndRaw ? Number(quietHoursEndRaw) : null;

  if (!/^\d{2}:\d{2}$/.test(timeOfDay)) return { error: "Invalid reminder time." };
  if (quietHoursStart !== null && (quietHoursStart < 0 || quietHoursStart > 23)) return { error: "Quiet hours start must be 0-23." };
  if (quietHoursEnd !== null && (quietHoursEnd < 0 || quietHoursEnd > 23)) return { error: "Quiet hours end must be 0-23." };

  const existing = await prisma.reminderRule.findFirst({ where: { userId: user.id, type: "DAILY_PLANNING" } });
  if (existing) {
    await prisma.reminderRule.update({ where: { id: existing.id }, data: { enabled: reminderEnabled, timeOfDay } });
  } else {
    await prisma.reminderRule.create({
      data: { userId: user.id, type: "DAILY_PLANNING", channel: "IN_APP", enabled: reminderEnabled, timeOfDay },
    });
  }

  const existingTaskDue = await prisma.reminderRule.findFirst({ where: { userId: user.id, type: "TASK_DUE" } });
  if (existingTaskDue) {
    await prisma.reminderRule.update({ where: { id: existingTaskDue.id }, data: { enabled: taskDueEnabled } });
  } else {
    await prisma.reminderRule.create({
      data: { userId: user.id, type: "TASK_DUE", channel: "IN_APP", enabled: taskDueEnabled, offsetMinutes: 15 },
    });
  }

  await prisma.userPreferences.update({
    where: { userId: user.id },
    data: { quietHoursStart, quietHoursEnd, marketingOptIn },
  });

  revalidatePath("/dashboard/settings");
  return { info: "Saved." };
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 10) return { error: "New password needs at least 10 characters." };
  if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "Current password is incorrect." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  return { info: "Password updated." };
}

export async function regenerateBackupCodes() {
  const user = await requireUser();
  if (!user.totpEnabled) throw new Error("Two-factor isn't enabled on this account.");
  return issueBackupCodes(user.id);
}

export async function deleteAccount() {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}

export async function exportUserData() {
  const user = await requireUser();
  const [goals, tasks, habits, sessions] = await Promise.all([
    prisma.goal.findMany({ where: { userId: user.id }, include: { milestones: true } }),
    prisma.task.findMany({ where: { userId: user.id } }),
    prisma.habit.findMany({ where: { userId: user.id }, include: { logs: true } }),
    prisma.taskSession.findMany({ where: { userId: user.id } }),
  ]);

  return JSON.stringify(
    { exportedAt: new Date().toISOString(), profile: user.profile, preferences: user.preferences, goals, tasks, habits, sessions },
    null,
    2
  );
}
