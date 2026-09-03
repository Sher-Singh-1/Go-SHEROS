import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { PageHeader } from "@/components/ui/page-header";
import { HabitForm } from "./habit-form";
import { HabitRow } from "./habit-row";

export default async function HabitsPage() {
  const user = await requireOnboardedUser();
  const since = startOfDay(subDays(new Date(), 6));

  const habits = await prisma.habit.findMany({
    where: { userId: user.id, archived: false },
    include: { logs: { where: { date: { gte: since } } } },
    orderBy: { createdAt: "asc" },
  });

  const last7Days = eachDayOfInterval({ start: since, end: new Date() }).map((d) => format(d, "yyyy-MM-dd"));

  const rows = habits.map((h) => {
    const doneDates = new Set(h.logs.map((l) => format(l.date, "yyyy-MM-dd")));
    return { id: h.id, title: h.title, last7: last7Days.map((d) => doneDates.has(d)) };
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Habits" subtitle="Build good habits. Break bad ones." />

      <HabitForm />

      <div className="flex flex-col gap-2">
        {rows.length === 0 ? (
          <div className="glass-card rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-ink-soft">
            No habits yet. Add one above to start tracking it.
          </div>
        ) : (
          rows.map((h) => <HabitRow key={h.id} habit={h} />)
        )}
      </div>
    </div>
  );
}
