import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { FocusTimer } from "@/components/focus/focus-timer";
import { formatFocusDuration } from "@/lib/analytics/metrics";
import { PageHeader } from "@/components/ui/page-header";

export default async function FocusPage() {
  const user = await requireOnboardedUser();
  const today = new Date();

  const [tasks, recentSessions] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, date: { gte: startOfDay(today), lte: endOfDay(today) }, status: { not: "COMPLETED" } },
      orderBy: { order: "asc" },
      select: { id: true, title: true, estimatedMinutes: true },
    }),
    prisma.taskSession.findMany({
      where: { userId: user.id, startedAt: { gte: subDays(today, 7) }, status: { in: ["COMPLETED", "ABANDONED"] } },
      include: { task: { select: { title: true } } },
      orderBy: { startedAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Focus" subtitle="Eliminate distractions. Deep work." />

      <FocusTimer tasks={tasks} />

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Recent sessions</p>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-ink-soft">No focus sessions logged in the last 7 days yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentSessions.map((s) => (
              <div key={s.id} className="glass-card flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.task.title}</p>
                  <p className="text-xs text-ink-faint">{format(s.startedAt, "MMM d, h:mm a")} · {s.mode.toLowerCase()}</p>
                </div>
                <span className="flex-none font-mono text-sm tabular-nums text-ink-soft">
                  {formatFocusDuration(s.actualSeconds ?? 0)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
