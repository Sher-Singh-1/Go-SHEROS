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

  // Daily digest: every user with unfinished tasks today gets a single
  // reminder, regardless of whether they've set up a TASK_DUE reminder rule.
  const PENDING_DIGEST_TITLE = "Pending tasks today";
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  let pendingDigestsSent = 0;

  for (const u of allUsers) {
    const alreadySent = await prisma.notification.findFirst({
      where: { userId: u.id, title: PENDING_DIGEST_TITLE, createdAt: { gte: today } },
      select: { id: true },
    });
    if (alreadySent) continue;

    const pendingCount = await prisma.task.count({
      where: {
        userId: u.id,
        date: { gte: today, lte: endOfDay(now) },
        status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
      },
    });
    if (pendingCount === 0) continue;

    await notifyUser(u.id, {
      type: "TASK",
      title: PENDING_DIGEST_TITLE,
      body: `You have ${pendingCount} task${pendingCount === 1 ? "" : "s"} left to finish today.`,
      actionUrl: "/dashboard/today",
    });
    pendingDigestsSent += 1;
  }

  return NextResponse.json({ ok: true, rulesChecked: rules.length, notified, pendingDigestsSent });
}
