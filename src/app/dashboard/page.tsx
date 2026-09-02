import Link from "next/link";
import { format } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import {
  getTodaySnapshot,
  getSevenDayCompletionRate,
  computeProductivityScore,
  formatFocusDuration,
} from "@/lib/analytics/metrics";
import { daysRemaining } from "@/lib/dates";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { TaskRow } from "@/components/tasks/task-row";
import { QuickAdd } from "@/components/tasks/quick-add";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const name = user.profile?.displayName || "there";

  const [{ tasks, completed, completionRate, focusSeconds }, sevenDayRate, goals] = await Promise.all([
    getTodaySnapshot(user.id),
    getSevenDayCompletionRate(user.id),
    prisma.goal.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { milestones: true, _count: { select: { tasks: true } } },
      orderBy: { endDate: "asc" },
      take: 4,
    }),
  ]);

  const streak = user.streak?.currentCount ?? 0;
  const productivityScore = computeProductivityScore(completionRate, sevenDayRate, streak);
  const priorityTasks = tasks.filter((t) => t.priority === "HIGH" && t.status !== "COMPLETED").slice(0, 3);
  const restTasks = tasks.filter((t) => !priorityTasks.includes(t));

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-teal">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {greeting()}, {name} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Here&apos;s your plan for today.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
          <ProgressRing value={completionRate} size={56} stroke={6} />
          <div>
            <p className="text-xs text-ink-faint">Today</p>
            <p className="text-sm font-medium">{completed}/{tasks.length} done</p>
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-faint">Streak</p>
          <p className="mt-1 font-display text-2xl font-semibold">🔥 {streak}d</p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-faint">Focus time</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatFocusDuration(focusSeconds)}</p>
        </div>
        <div className="flex flex-col justify-center rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-ink-faint">Productivity score</p>
          <p className="mt-1 font-display text-2xl font-semibold tabular-nums">{productivityScore}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <QuickAdd date={new Date().toISOString()} />

          {priorityTasks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-ink">Focus on these first</p>
              {priorityTasks.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {restTasks.length === 0 && priorityTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-ink-soft">
                Nothing on today&apos;s list yet. Add a task above, or{" "}
                <Link href="/dashboard/goals/new" className="font-medium text-teal hover:underline">
                  let the AI build you a plan
                </Link>
                .
              </div>
            ) : (
              restTasks.map((t) => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Active goals</p>
              <Link href="/dashboard/goals" className="text-xs font-medium text-teal hover:underline">
                View all
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {goals.length === 0 && (
                <Link
                  href="/dashboard/goals/new"
                  className="block rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-ink-soft hover:border-accent hover:text-accent-ink"
                >
                  + Start your first goal
                </Link>
              )}
              {goals.map((g) => {
                const doneMilestones = g.milestones.filter((m) => m.completedAt).length;
                const pct = g.milestones.length ? Math.round((doneMilestones / g.milestones.length) * 100) : 0;
                const daysLeft = daysRemaining(g.endDate);
                return (
                  <Link
                    key={g.id}
                    href={`/dashboard/goals/${g.id}`}
                    className="rounded-xl border border-border bg-surface p-3.5 hover:border-border-strong"
                  >
                    <p className="truncate text-sm font-medium">{g.title}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-surface-3">
                      <div className="h-1.5 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-faint">{daysLeft}d left · {pct}% milestones</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
