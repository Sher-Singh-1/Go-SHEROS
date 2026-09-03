import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { GoalsTabs } from "./goals-tabs";

export default async function GoalsPage() {
  const user = await requireOnboardedUser();
  const goals = await prisma.goal.findMany({
    where: { userId: user.id },
    include: { milestones: true, tasks: { select: { id: true, status: true } } },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Goals"
        subtitle="Define your goals. Track your progress."
        right={<ButtonLink href="/dashboard/goals/new">+ New goal</ButtonLink>}
      />

      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-sm text-ink-soft">No goals yet — tell the AI what you&apos;re working toward.</p>
          <ButtonLink href="/dashboard/goals/new" className="mt-4">Start a goal</ButtonLink>
        </div>
      ) : (
        <GoalsTabs
          goals={goals.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            endDate: g.endDate,
            milestonesTotal: g.milestones.length,
            milestonesDone: g.milestones.filter((m) => m.completedAt).length,
            tasksDone: g.tasks.filter((t) => t.status === "COMPLETED").length,
            tasksTotal: g.tasks.length,
          }))}
        />
      )}
    </div>
  );
}
