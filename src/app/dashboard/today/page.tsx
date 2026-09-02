import Link from "next/link";
import { addDays, endOfDay, format, isToday, parseISO, startOfDay } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { QuickAdd } from "@/components/tasks/quick-add";
import { SortableTaskList } from "@/components/tasks/sortable-task-list";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { date: dateParam } = await searchParams;
  const date = dateParam ? parseISO(dateParam) : new Date();

  const tasks = await prisma.task.findMany({
    where: { userId: user.id, date: { gte: startOfDay(date), lte: endOfDay(date) } },
    orderBy: { order: "asc" },
  });

  const prev = format(addDays(date, -1), "yyyy-MM-dd");
  const next = format(addDays(date, 1), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{isToday(date) ? "Today" : format(date, "EEEE")}</h1>
          <p className="text-sm text-ink-soft">{format(date, "MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-1">
          <Link href={`/dashboard/today?date=${prev}`} className="rounded-lg p-2 text-ink-soft hover:bg-surface-2" aria-label="Previous day">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" /></svg>
          </Link>
          {!isToday(date) && (
            <Link href="/dashboard/today" className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-teal hover:bg-surface-2">
              Today
            </Link>
          )}
          <Link href={`/dashboard/today?date=${next}`} className="rounded-lg p-2 text-ink-soft hover:bg-surface-2" aria-label="Next day">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" /></svg>
          </Link>
        </div>
      </div>

      <QuickAdd date={date.toISOString()} />
      <SortableTaskList initialTasks={tasks} />
    </div>
  );
}
