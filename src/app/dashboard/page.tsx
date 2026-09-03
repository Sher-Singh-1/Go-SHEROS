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
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { QuickAdd } from "@/components/tasks/quick-add";
import { TaskBoard } from "@/components/tasks/task-board";
import { StatCard, StatIcon } from "@/components/ui/stat-card";
import { ActiveGoalsCard } from "@/components/dashboard/active-goals-card";
import { FocusTimerCard } from "@/components/dashboard/focus-timer-card";
import { GlanceCard } from "@/components/dashboard/glance-card";

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
  const nextOpenTask = tasks.find((t) => t.status !== "COMPLETED") ?? null;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-wider text-teal">{format(new Date(), "EEEE, MMMM d")}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {greeting()}, {name} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Here&apos;s your plan for today.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="glass-card flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
            <ProgressRing value={completionRate} size={52} stroke={5} />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Today</p>
              <p className="text-sm font-medium">{completed}/{tasks.length} done</p>
            </div>
          </div>
          <StatCard icon={<StatIcon name="streak" />} label="Streak" value={`${streak}d`} sublabel={streak > 0 ? "Keep it going!" : "Start today"} />
          <StatCard icon={<StatIcon name="clock" />} label="Focus time" value={formatFocusDuration(focusSeconds)} sublabel={focusSeconds > 0 ? "Nice work" : "Start focusing"} />
          <StatCard icon={<StatIcon name="trend" />} label="Productivity score" value={productivityScore} sublabel="Keep improving" />
        </div>

        <ActiveGoalsCard
          goals={goals.map((g) => ({
            id: g.id,
            title: g.title,
            endDate: g.endDate,
            milestonesTotal: g.milestones.length,
            milestonesDone: g.milestones.filter((m) => m.completedAt).length,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <QuickAdd date={new Date().toISOString()} />

          {tasks.length === 0 ? (
            <div className="glass-card rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-ink-soft">
              Nothing on today&apos;s list yet. Add a task above, or{" "}
              <Link href="/dashboard/goals/new" className="font-medium text-teal hover:underline">
                let the AI build you a plan
              </Link>
              .
            </div>
          ) : (
            <TaskBoard title="Today's plan" tasks={tasks} />
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <FocusTimerCard taskId={nextOpenTask?.id ?? null} taskTitle={nextOpenTask?.title ?? null} />
          <GlanceCard
            tasksDone={completed}
            tasksTotal={tasks.length}
            focusLabel={formatFocusDuration(focusSeconds)}
            streakDays={streak}
            productivityScore={productivityScore}
          />
        </aside>
      </div>
    </div>
  );
}
