import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { materializeRecurringTasks } from "@/lib/tasks/recurrence";
import { clsx } from "clsx";
import { PageHeader } from "@/components/ui/page-header";

const PRIORITY_DOT: Record<string, string> = { HIGH: "bg-danger", MEDIUM: "bg-accent", LOW: "bg-teal" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { month: monthParam } = await searchParams;
  const anchor = monthParam ? parse(monthParam, "yyyy-MM", new Date()) : new Date();

  const gridStart = startOfWeek(startOfMonth(anchor));
  const gridEnd = endOfWeek(endOfMonth(anchor));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  await materializeRecurringTasks(user.id, gridEnd);

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, date: { gte: gridStart, lte: gridEnd } },
    orderBy: [{ priority: "desc" }],
    select: { id: true, title: true, date: true, priority: true, status: true },
  });

  const byDay = new Map<string, typeof tasks>();
  for (const t of tasks) {
    const key = format(t.date, "yyyy-MM-dd");
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }

  const prevMonth = format(addMonths(anchor, -1), "yyyy-MM");
  const nextMonth = format(addMonths(anchor, 1), "yyyy-MM");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        subtitle="Plan your days. Achieve your goals."
        right={
          <>
            <span className="mr-2 hidden text-sm font-medium text-ink-soft sm:inline">{format(anchor, "MMMM yyyy")}</span>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
              <Link href={`/dashboard/calendar?month=${prevMonth}`} className="rounded-md p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Previous month">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" /></svg>
              </Link>
              <Link href="/dashboard/calendar" className="rounded-md bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-teal hover:bg-surface-3">Today</Link>
              <Link href={`/dashboard/calendar?month=${nextMonth}`} className="rounded-md p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Next month">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" /></svg>
              </Link>
            </div>
          </>
        }
      />

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 text-center text-xs font-medium uppercase tracking-wide text-ink-faint">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTasks = byDay.get(key) ?? [];
              return (
                <Link
                  key={key}
                  href={`/dashboard/today?date=${key}`}
                  className={clsx(
                    "glass-card flex min-h-[92px] flex-col gap-1 rounded-xl border border-border bg-surface p-2 text-left hover:border-border-strong",
                    !isSameMonth(day, anchor) && "opacity-40",
                    isToday(day) && "border-accent-soft-border"
                  )}
                >
                  <span className={clsx("self-start rounded-full px-1.5 text-xs font-medium", isToday(day) && "bg-accent text-accent-ink")}>
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <div key={t.id} className="flex items-center gap-1 truncate text-[11px] text-ink-soft">
                        <span className={clsx("h-1 w-1 flex-none rounded-full", PRIORITY_DOT[t.priority])} />
                        <span className={clsx("truncate", t.status === "COMPLETED" && "text-ink-faint line-through")}>{t.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 3 && <span className="text-[11px] text-ink-faint">+{dayTasks.length - 3} more</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
