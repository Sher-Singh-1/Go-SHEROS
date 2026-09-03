"use client";

import { useState } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { daysRemaining } from "@/lib/dates";

export type GoalCardData = {
  id: string;
  title: string;
  status: string;
  endDate: Date;
  milestonesTotal: number;
  milestonesDone: number;
  tasksDone: number;
  tasksTotal: number;
};

export function GoalsTabs({ goals }: { goals: GoalCardData[] }) {
  const [tab, setTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const active = goals.filter((g) => g.status === "ACTIVE");
  const completed = goals.filter((g) => g.status !== "ACTIVE");
  const shown = tab === "ACTIVE" ? active : completed;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 self-start rounded-lg bg-surface-2 p-1">
        <button
          onClick={() => setTab("ACTIVE")}
          className={clsx(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "ACTIVE" ? "bg-accent text-accent-ink" : "text-ink-faint hover:text-ink"
          )}
        >
          Active goals
        </button>
        <button
          onClick={() => setTab("COMPLETED")}
          className={clsx(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "COMPLETED" ? "bg-accent text-accent-ink" : "text-ink-faint hover:text-ink"
          )}
        >
          Completed goals
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border-strong p-10 text-center text-sm text-ink-soft">
          {tab === "ACTIVE" ? "No active goals — tell the AI what you're working toward." : "Nothing completed yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shown.map((g) => {
            const pct = g.milestonesTotal ? Math.round((g.milestonesDone / g.milestonesTotal) * 100) : 0;
            const daysLeft = daysRemaining(g.endDate);
            return (
              <Link
                key={g.id}
                href={`/dashboard/goals/${g.id}`}
                className="glass-card flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 hover:border-border-strong"
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
                  <span>{pct}% milestones &middot; {g.tasksDone}/{g.tasksTotal} tasks</span>
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
