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
        right={
          <div className="flex gap-2">
            <ButtonLink href="/dashboard/goals/quick" variant="secondary">+ Quick goal</ButtonLink>
            <ButtonLink href="/dashboard/goals/new">+ AI-planned goal</ButtonLink>
          </div>
        }
      />

      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-sm text-ink-soft">No goals yet — name one and break it into your own tasks, or let the AI draft a plan.</p>
          <div className="mt-4 flex justify-center gap-2">
            <ButtonLink href="/dashboard/goals/quick" variant="secondary">+ Quick goal</ButtonLink>
            <ButtonLink href="/dashboard/goals/new">+ AI-planned goal</ButtonLink>
          </div>
        </div>
      ) : (
        <GoalsTabs
          goals={goals.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            category: g.category,
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
