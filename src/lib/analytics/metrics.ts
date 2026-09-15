import "server-only";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/client";

export async function getTodaySnapshot(userId: string) {
  const today = new Date();
  const range = { gte: startOfDay(today), lte: endOfDay(today) };

  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({ where: { userId, date: range }, orderBy: [{ priority: "desc" }, { order: "asc" }] }),
    prisma.taskSession.findMany({ where: { userId, startedAt: range } }),
  ]);

  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const focusSeconds = sessions.reduce((sum, s) => sum + (s.actualSeconds ?? 0), 0);

  return { tasks, completed, completionRate, focusSeconds };
}

export async function getSevenDayCompletionRate(userId: string) {
  const since = startOfDay(subDays(new Date(), 6));
  const tasks = await prisma.task.findMany({
    where: { userId, date: { gte: since }, status: { in: ["COMPLETED", "SKIPPED", "OVERDUE", "NOT_STARTED", "IN_PROGRESS"] } },
  });
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "COMPLETED").length;
  return Math.round((completed / tasks.length) * 100);
}

export function computeProductivityScore(todayRate: number, sevenDayRate: number, currentStreak: number) {
  const streakBonus = Math.min(10, currentStreak);
  return Math.min(100, Math.round(todayRate * 0.5 + sevenDayRate * 0.4 + streakBonus * 1));
}

function bucketDailyStatusSeries(tasks: { date: Date; status: string }[], days: number) {
  const byDay = new Map<string, { total: number; completed: number }>();
  for (const t of tasks) {
    const key = startOfDay(t.date).toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? { total: 0, completed: 0 };
    bucket.total += 1;
    if (t.status === "COMPLETED") bucket.completed += 1;
    byDay.set(key, bucket);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const key = date.toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? { total: 0, completed: 0 };
    return {
      date,
      total: bucket.total,
      completed: bucket.completed,
      rate: bucket.total ? Math.round((bucket.completed / bucket.total) * 100) : 0,
    };
  });
}

export async function getDailyCompletionSeries(userId: string, days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const tasks = await prisma.task.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, status: true },
  });
  return bucketDailyStatusSeries(tasks, days);
}

/** Same shape as the daily task series, restricted to tasks linked to a goal — the "goal-wise" growth trend. */
export async function getGoalLinkedDailySeries(userId: string, days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const tasks = await prisma.task.findMany({
    where: { userId, date: { gte: since }, goalId: { not: null } },
    select: { date: true, status: true },
  });
  return bucketDailyStatusSeries(tasks, days);
}

/** Daily habit-completion trend: of the habits scheduled for that weekday, how many were logged done. */
export async function getHabitDailySeries(userId: string, days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    select: { id: true, targetDays: true },
  });

  const logs = habits.length
    ? await prisma.habitLog.findMany({
        where: { habitId: { in: habits.map((h) => h.id) }, date: { gte: since } },
        select: { habitId: true, date: true, completed: true },
      })
    : [];

  const logsByDay = new Map<string, Map<string, boolean>>();
  for (const log of logs) {
    const key = startOfDay(log.date).toISOString().slice(0, 10);
    const bucket = logsByDay.get(key) ?? new Map<string, boolean>();
    bucket.set(log.habitId, log.completed);
    logsByDay.set(key, bucket);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const key = date.toISOString().slice(0, 10);
    const scheduled = habits.filter((h) => h.targetDays.includes(date.getDay()));
    const dayLogs = logsByDay.get(key);
    const completed = scheduled.filter((h) => dayLogs?.get(h.id)).length;
    return {
      date,
      total: scheduled.length,
      completed,
      rate: scheduled.length ? Math.round((completed / scheduled.length) * 100) : 0,
    };
  });
}

export function formatFocusDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
