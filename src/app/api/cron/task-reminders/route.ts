import { NextRequest, NextResponse } from "next/server";
import { format, startOfDay, endOfDay } from "date-fns";
import { prisma } from "@/lib/db/client";
import { notifyUser } from "@/lib/notifications/service";

export const dynamic = "force-dynamic";

function inQuietHours(now: Date, quietHoursStart: number | null, quietHoursEnd: number | null) {
  if (quietHoursStart === null || quietHoursEnd === null) return false;
  const hour = now.getHours();
  if (quietHoursStart <= quietHoursEnd) return hour >= quietHoursStart && hour < quietHoursEnd;
  return hour >= quietHoursStart || hour < quietHoursEnd; // wraps past midnight
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = startOfDay(now);

  const rules = await prisma.reminderRule.findMany({
    where: { type: "TASK_DUE", enabled: true },
    include: { user: { include: { preferences: true } } },
  });

  let notified = 0;

  for (const rule of rules) {
    const prefs = rule.user.preferences;
    if (inQuietHours(now, prefs?.quietHoursStart ?? null, prefs?.quietHoursEnd ?? null)) continue;

    const offsetMinutes = rule.offsetMinutes ?? 15;
    const tasks = await prisma.task.findMany({
      where: {
        userId: rule.userId,
        date: { gte: today, lte: endOfDay(now) },
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        remindedAt: null,
        dueTime: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.dueTime) continue;
      const [h, m] = task.dueTime.split(":").map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) continue;
      const dueAt = new Date(today);
      dueAt.setHours(h, m, 0, 0);

      const minutesUntilDue = (dueAt.getTime() - now.getTime()) / 60_000;
      if (minutesUntilDue > offsetMinutes || minutesUntilDue < -offsetMinutes) continue;

      await notifyUser(rule.userId, {
        type: "TASK",
        title: minutesUntilDue >= 0 ? "Task due soon" : "Task overdue",
        body: `"${task.title}" is due at ${task.dueTime}.`,
        actionUrl: `/dashboard/today?date=${format(task.date, "yyyy-MM-dd")}`,
      });
      await prisma.task.update({ where: { id: task.id }, data: { remindedAt: now } });
      notified += 1;
    }
  }

  return NextResponse.json({ ok: true, rulesChecked: rules.length, notified });
}
