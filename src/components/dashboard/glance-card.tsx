import { StatIcon } from "@/components/ui/stat-card";

export function GlanceCard({
  tasksDone,
  tasksTotal,
  focusLabel,
  streakDays,
  productivityScore,
}: {
  tasksDone: number;
  tasksTotal: number;
  focusLabel: string;
  streakDays: number;
  productivityScore: number;
}) {
  const rows = [
    { icon: "tasks" as const, label: "Tasks", value: `${tasksDone}/${tasksTotal}` },
    { icon: "clock" as const, label: "Focus time", value: focusLabel },
    { icon: "streak" as const, label: "Streak", value: `${streakDays}d` },
    { icon: "trend" as const, label: "Productivity", value: `${productivityScore}/100` },
  ];

  return (
    <div className="glass-card flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Today at a glance</p>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <span className="h-3.5 w-3.5 flex-none text-ink-faint">
                <StatIcon name={r.icon} />
              </span>
              {r.label}
            </span>
            <span className="font-medium tabular-nums">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
