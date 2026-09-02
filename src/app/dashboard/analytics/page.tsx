import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { getDailyCompletionSeries, formatFocusDuration } from "@/lib/analytics/metrics";
import { computeInsights } from "@/lib/analytics/insights";
import { CompletionChart } from "@/components/analytics/completion-chart";
import { Heatmap } from "@/components/analytics/heatmap";

export default async function AnalyticsPage() {
  const user = await requireOnboardedUser();

  const [series14, series84, sessions, achievements] = await Promise.all([
    getDailyCompletionSeries(user.id, 14),
    getDailyCompletionSeries(user.id, 84),
    prisma.taskSession.aggregate({ where: { userId: user.id }, _sum: { actualSeconds: true } }),
    prisma.achievement.count({ where: { userId: user.id } }),
  ]);

  const insights = await computeInsights(user.id);
  const totalCompleted = series84.reduce((sum, d) => sum + d.completed, 0);
  const totalTasks = series84.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-ink-soft">How consistent you&apos;ve been, and where it&apos;s trending.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Current streak" value={`🔥 ${user.streak?.currentCount ?? 0}d`} />
        <Stat label="Longest streak" value={`${user.streak?.longestCount ?? 0}d`} />
        <Stat label="Total focus time" value={formatFocusDuration(sessions._sum.actualSeconds ?? 0)} />
        <Stat label="Badges earned" value={String(achievements)} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm font-medium">Last 14 days — completion rate</p>
        <CompletionChart data={series14.map((d) => ({ date: d.date.toISOString(), rate: d.rate, completed: d.completed, total: d.total }))} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-baseline justify-between">
          <p className="text-sm font-medium">Last 12 weeks</p>
          <p className="text-xs text-ink-faint">{totalCompleted}/{totalTasks} tasks completed</p>
        </div>
        <Heatmap points={series84.map((d) => ({ date: d.date, rate: d.rate, total: d.total }))} />
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Insights</p>
        <div className="flex flex-col gap-2">
          {insights.map((insight, i) => (
            <p key={i} className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-soft">
              {insight}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
