import Link from "next/link";
import { daysRemaining } from "@/lib/dates";

export type ActiveGoalCardData = {
  id: string;
  title: string;
  endDate: Date;
  milestonesTotal: number;
  milestonesDone: number;
};

export function ActiveGoalsCard({ goals }: { goals: ActiveGoalCardData[] }) {
  const top = goals[0];

  return (
    <div className="glass-card relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Active goals</p>
        <Link href="/dashboard/goals" className="text-xs font-medium text-teal hover:underline">
          View all
        </Link>
      </div>

      {!top ? (
        <Link
          href="/dashboard/goals/new"
          className="block rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-ink-soft hover:border-accent hover:text-accent-ink"
        >
          + Start your first goal
        </Link>
      ) : (
        <Link href={`/dashboard/goals/${top.id}`} className="relative flex flex-col gap-1">
          <p className="pr-14 text-sm font-medium leading-snug">{top.title}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {daysRemaining(top.endDate)}d left · {top.milestonesTotal ? Math.round((top.milestonesDone / top.milestonesTotal) * 100) : 0}% milestones
          </p>
          <MountainGlyph className="pointer-events-none absolute -right-1 -top-2 h-14 w-16 text-accent/70" />
        </Link>
      )}

      {goals.length > 1 && (
        <div className="flex flex-col gap-1 border-t border-border pt-2">
          {goals.slice(1).map((g) => (
            <Link key={g.id} href={`/dashboard/goals/${g.id}`} className="truncate text-xs text-ink-soft hover:text-ink">
              {g.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MountainGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" className={className} fill="none">
      <path d="M2 44 20 14l9 12 5-7 18 25Z" fill="currentColor" opacity="0.5" />
      <path d="M20 14l4.5 6.2-4.5 5.3-6-8.2Z" fill="currentColor" opacity="0.85" />
      <path d="m20 14 2 2.8-2 2.3-2.3-3Z" fill="#fff" opacity="0.9" />
      <path d="m34 19 1.6 2.3-1.6 1.8-1.8-2.4Z" fill="#fff" opacity="0.8" />
    </svg>
  );
}
