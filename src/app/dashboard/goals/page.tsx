import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { ButtonLink } from "@/components/ui/button";
import { daysRemaining } from "@/lib/dates";

export default async function GoalsPage() {
  const user = await requireOnboardedUser();
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    include: { milestones: true, tasks: { select: { id: true, status: true } } },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <ButtonLink href="/dashboard/goals/new">+ New goal</ButtonLink>
      </div>

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-sm text-ink-soft">No goals yet — tell the AI what you&apos;re working toward.</p>
          <ButtonLink href="/dashboard/goals/new" className="mt-4">Start a goal</ButtonLink>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {goals.map((g) => {
            const doneMilestones = g.milestones.filter((m) => m.completedAt).length;
            const pct = g.milestones.length ? Math.round((doneMilestones / g.milestones.length) * 100) : 0;
            const doneTasks = g.tasks.filter((t) => t.status === "COMPLETED").length;
            const daysLeft = daysRemaining(g.endDate);

            return (
              <Link
                key={g.id}
                href={`/dashboard/goals/${g.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-border-strong"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-base font-semibold">{g.title}</p>
                  {g.status !== "ACTIVE" && (
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-ink-faint">{g.status}</span>
                  )}
                </div>
                <div className="h-2 rounded-full bg-surface-3">
                  <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-ink-faint">
                  <span>{pct}% milestones · {doneTasks}/{g.tasks.length} tasks</span>
                  <span>{g.status === "ACTIVE" ? `${daysLeft}d left` : ""}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
