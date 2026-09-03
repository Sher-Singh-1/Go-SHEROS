import Link from "next/link";
import { addDays, endOfDay, format, isToday, parseISO, startOfDay } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskBoard } from "@/components/tasks/task-board";
import { PageHeader } from "@/components/ui/page-header";

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
      <PageHeader
        title={isToday(date) ? "Today" : format(date, "EEEE")}
        subtitle="Stay focused and get things done."
        right={
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            <Link href={`/dashboard/today?date=${prev}`} className="rounded-md p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Previous day">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" /></svg>
            </Link>
            <span className="px-2 text-xs font-medium text-ink-soft">{format(date, "EEE, MMM d")}</span>
            <Link href={`/dashboard/today?date=${next}`} className="rounded-md p-1.5 text-ink-soft hover:bg-surface-2" aria-label="Next day">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" /></svg>
            </Link>
            {!isToday(date) && (
              <Link href="/dashboard/today" className="ml-1 rounded-md bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-teal hover:bg-surface-3">
                Today
              </Link>
            )}
          </div>
        }
      />

      <QuickAdd date={date.toISOString()} />

      {tasks.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border-strong p-10 text-center text-sm text-ink-soft">
          Nothing scheduled for this day.
        </div>
      ) : (
        <TaskBoard title="Today's plan" tasks={tasks} />
      )}

      <p className="mt-2 text-center text-sm italic text-ink-faint">
        <span className="text-teal">&ldquo;</span> Discipline today &middot; Freedom tomorrow. <span className="text-teal">&rdquo;</span>
      </p>
    </div>
  );
}
