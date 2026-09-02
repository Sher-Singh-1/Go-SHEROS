import "server-only";
import { startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/client";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Every number here comes straight from the database — this is the rules
 * layer the AI coach narrates from (see lib/ai/provider.ts), never numbers
 * the model invents itself.
 */
export async function computeInsights(userId: string): Promise<string[]> {
  const since = startOfDay(subDays(new Date(), 30));
  const tasks = await prisma.task.findMany({
    where: { userId, date: { gte: since } },
    select: { date: true, status: true },
  });

  const insights: string[] = [];
  if (tasks.length < 5) {
    return ["Complete a few more tasks and this page will start surfacing patterns in when and how consistently you work."];
  }

  const byWeekday = Array.from({ length: 7 }, () => ({ total: 0, completed: 0 }));
  for (const t of tasks) {
    const bucket = byWeekday[t.date.getDay()];
    bucket.total += 1;
    if (t.status === "COMPLETED") bucket.completed += 1;
  }
  const withRate = byWeekday
    .map((b, i) => ({ day: DAY_NAMES[i], rate: b.total ? b.completed / b.total : 0, total: b.total }))
    .filter((b) => b.total >= 2);
  if (withRate.length > 0) {
    const best = withRate.reduce((a, b) => (b.rate > a.rate ? b : a));
    insights.push(`You're most consistent on ${best.day}s — ${Math.round(best.rate * 100)}% of tasks completed there.`);
  }

  const lastWeek = tasks.filter((t) => t.date >= startOfDay(subDays(new Date(), 7)));
  const priorWeek = tasks.filter(
    (t) => t.date >= startOfDay(subDays(new Date(), 14)) && t.date < startOfDay(subDays(new Date(), 7))
  );
  const rateOf = (list: typeof tasks) =>
    list.length ? list.filter((t) => t.status === "COMPLETED").length / list.length : null;
  const lastRate = rateOf(lastWeek);
  const priorRate = rateOf(priorWeek);
  if (lastRate !== null && priorRate !== null && priorWeek.length >= 3) {
    const delta = Math.round((lastRate - priorRate) * 100);
    if (Math.abs(delta) >= 5) {
      insights.push(
        delta > 0
          ? `Your completion rate improved ${delta} points versus the previous week.`
          : `Your completion rate dropped ${Math.abs(delta)} points versus the previous week — worth a lighter plan tomorrow.`
      );
    }
  }

  const overdue = tasks.filter((t) => t.status === "OVERDUE" || t.status === "SKIPPED").length;
  if (overdue > 0) {
    insights.push(`${overdue} task${overdue === 1 ? "" : "s"} went overdue or were skipped in the last 30 days.`);
  }

  return insights.length > 0 ? insights : ["Nothing unusual in the last 30 days — steady as it goes."];
}
