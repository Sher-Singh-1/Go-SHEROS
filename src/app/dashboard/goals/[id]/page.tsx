import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { TaskRow } from "@/components/tasks/task-row";
import { QuickAdd } from "@/components/tasks/quick-add";
import { daysRemaining } from "@/lib/dates";
import { GoalHeader } from "./goal-header";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;

  const goal = await prisma.goal.findFirst({
    where: { id, userId: user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      tasks: { orderBy: [{ date: "asc" }, { order: "asc" }] },
    },
  });
  if (!goal) notFound();

  const tasksDone = goal.tasks.filter((t) => t.status === "COMPLETED").length;
  const tasksTotal = goal.tasks.length;
  const doneMilestones = goal.milestones.filter((m) => m.completedAt).length;
  const pct = tasksTotal
    ? Math.round((tasksDone / tasksTotal) * 100)
    : goal.milestones.length
    ? Math.round((doneMilestones / goal.milestones.length) * 100)
    : 0;
  const daysLeft = daysRemaining(goal.endDate);
  const upcomingTasks = goal.tasks.filter((t) => t.status !== "COMPLETED").slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-8">
      <GoalHeader
        goal={{
          id: goal.id,
          title: goal.title,
          description: goal.description,
          notes: goal.notes,
          category: goal.category,
          startDate: goal.startDate.toISOString(),
          endDate: goal.endDate.toISOString(),
          priority: goal.priority,
          status: goal.status,
        }}
      />

      {goal.status === "COMPLETED" && (
        <div className="rounded-2xl border border-teal bg-teal-soft px-5 py-4 text-sm text-teal">
          <p className="font-semibold">🎉 Goal completed!</p>
          <p className="mt-0.5">
            &ldquo;{goal.title}&rdquo; — you finished all {tasksTotal} task{tasksTotal === 1 ? "" : "s"}. Nice work.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {tasksTotal > 0 ? `${tasksDone}/${tasksTotal} tasks completed · ${pct}% complete` : "No tasks yet"}
          </span>
          <span className="text-ink-faint">{goal.status === "ACTIVE" ? `${daysLeft} days remaining` : goal.status}</span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-surface-3">
          <div className="h-2.5 rounded-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Add a task to this goal</p>
        <QuickAdd date={today} goalId={goal.id} placeholder="Break this goal into a task…" />
      </div>

      {goal.milestones.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Milestones</p>
          <div className="flex flex-col gap-2">
            {goal.milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                    m.completedAt ? "border-teal bg-teal text-white" : "border-border-strong"
                  }`}
                >
                  {m.completedAt && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-sm">{m.title}</span>
                <span className="font-mono text-xs text-ink-faint">{format(m.targetDate, "MMM d")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Upcoming tasks</p>
        <div className="flex flex-col gap-2">
          {upcomingTasks.length === 0 ? (
            <p className="text-sm text-ink-soft">No upcoming tasks — nice work, or time to add the next one above.</p>
          ) : (
            upcomingTasks.map((t) => <TaskRow key={t.id} task={t} showDelete={false} />)
          )}
        </div>
      </div>
    </div>
  );
}
