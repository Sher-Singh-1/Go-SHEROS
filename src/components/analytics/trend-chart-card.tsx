"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { CompletionChart, type SeriesPoint } from "./completion-chart";
import { MultiLineChart, type MultiLinePoint } from "./multi-line-chart";

type View = "tasks" | "goals" | "habits" | "combined";

const TABS: { id: View; label: string }[] = [
  { id: "tasks", label: "Daily tasks" },
  { id: "goals", label: "Goal-wise" },
  { id: "habits", label: "Habit-wise" },
  { id: "combined", label: "Combined" },
];

export function TrendChartCard({
  taskSeries,
  goalSeries,
  habitSeries,
  combinedSeries,
}: {
  taskSeries: SeriesPoint[];
  goalSeries: SeriesPoint[];
  habitSeries: SeriesPoint[];
  combinedSeries: MultiLinePoint[];
}) {
  const [view, setView] = useState<View>("tasks");

  return (
    <div className="glass-card rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Last 14 days — completion rate</p>
        <div className="flex flex-wrap gap-1 rounded-full border border-border bg-surface-2 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                view === tab.id ? "bg-accent text-accent-ink" : "text-ink-faint hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === "tasks" && <CompletionChart data={taskSeries} />}
      {view === "goals" && <CompletionChart data={goalSeries} />}
      {view === "habits" && <CompletionChart data={habitSeries} />}
      {view === "combined" && <MultiLineChart data={combinedSeries} />}
    </div>
  );
}
