import "server-only";
import { eachDayOfInterval, isSameDay, max as maxDate, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/client";

// 45 days comfortably covers both a typical "due soon" lookback and the
// widest calendar month grid (6 weeks = 42 days) in one bound.
const LOOKBACK_DAYS = 45;

/**
 * On-demand materializer: for every recurring "root" task (non-empty
 * recurrenceDays, no seriesId of its own), creates the concrete Task rows for
 * any matching weekday between the root's start date and `uptoDate` that
 * don't already exist. Bounded to a 30-day lookback so an old root can't
 * trigger a huge backfill the first time it's viewed again.
 */
export async function materializeRecurringTasks(userId: string, uptoDate: Date) {
  const upto = startOfDay(uptoDate);

  const roots = await prisma.task.findMany({
    where: { userId, seriesId: null, recurrenceDays: { isEmpty: false } },
  });
  if (roots.length === 0) return;

  for (const root of roots) {
    const rootDate = startOfDay(root.date);
    const lowerBound = maxDate([rootDate, subDays(upto, LOOKBACK_DAYS)]);
    if (lowerBound > upto) continue;

    const candidateDates = eachDayOfInterval({ start: lowerBound, end: upto }).filter(
      (d) => !isSameDay(d, rootDate) && root.recurrenceDays.includes(d.getDay())
    );
    if (candidateDates.length === 0) continue;

    const existing = await prisma.task.findMany({
      where: { userId, seriesId: root.id, date: { gte: lowerBound, lte: upto } },
      select: { date: true },
    });
    const existingKeys = new Set(existing.map((t) => startOfDay(t.date).getTime()));
    const toCreate = candidateDates.filter((d) => !existingKeys.has(d.getTime()));
    if (toCreate.length === 0) continue;

    await prisma.task.createMany({
      data: toCreate.map((date) => ({
        userId,
        goalId: root.goalId,
        milestoneId: root.milestoneId,
        title: root.title,
        description: root.description,
        date,
        startTime: root.startTime,
        dueTime: root.dueTime,
        priority: root.priority,
        category: root.category,
        estimatedMinutes: root.estimatedMinutes,
        notes: root.notes,
        seriesId: root.id,
        recurrenceDays: [],
      })),
    });
  }
}
