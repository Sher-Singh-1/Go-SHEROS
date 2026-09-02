import "server-only";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db/client";

const RECOVERY_COOLDOWN_DAYS = 7;
const MILESTONES = [7, 14, 30, 100];

/**
 * Recalculates the user's streak after they complete a task or habit today.
 * Implements streak protection: a single missed day is forgiven, once per
 * 7-day cooldown, so one bad day doesn't erase weeks of consistency.
 */
export async function recalculateStreakOnCompletion(userId: string, completedAt: Date = new Date()) {
  const today = startOfDay(completedAt);

  const streak = await prisma.streak.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  if (streak.lastActiveDate && differenceInCalendarDays(today, startOfDay(streak.lastActiveDate)) === 0) {
    return streak; // already counted today
  }

  const gap = streak.lastActiveDate ? differenceInCalendarDays(today, startOfDay(streak.lastActiveDate)) : null;
  const recoveryAvailable =
    !streak.recoveryUsedAt || differenceInCalendarDays(today, startOfDay(streak.recoveryUsedAt)) >= RECOVERY_COOLDOWN_DAYS;

  let nextCount: number;
  let recoveryUsedAt = streak.recoveryUsedAt;

  if (gap === null || gap > 2 || (gap === 2 && !recoveryAvailable)) {
    nextCount = 1;
  } else if (gap === 1) {
    nextCount = streak.currentCount + 1;
  } else {
    // gap === 2 and a recovery is available — bridge the missed day.
    nextCount = streak.currentCount + 1;
    recoveryUsedAt = today;
  }

  const longestCount = Math.max(streak.longestCount, nextCount);

  const updated = await prisma.streak.update({
    where: { userId },
    data: { currentCount: nextCount, longestCount, lastActiveDate: today, recoveryUsedAt },
  });

  await unlockStreakAchievements(userId, nextCount);
  return updated;
}

async function unlockStreakAchievements(userId: string, currentCount: number) {
  const reached = MILESTONES.filter((m) => currentCount >= m);
  for (const milestone of reached) {
    await prisma.achievement.upsert({
      where: { userId_type: { userId, type: `STREAK_${milestone}` } },
      create: { userId, type: `STREAK_${milestone}` },
      update: {},
    });
  }
}
