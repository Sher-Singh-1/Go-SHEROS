"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { isShowCompletedDefault } from "@/lib/preferences";
import { SortableTaskList } from "./sortable-task-list";
import type { TaskRowData } from "./task-row";

type Filter = "ALL" | "PENDING" | "COMPLETED";

export function TaskBoard({ title, tasks }: { title: string; tasks: TaskRowData[] }) {
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    // "Show completed tasks" (Settings → General) defaults this view to
    // Pending-only for anyone who's turned it off — localStorage isn't
    // readable during SSR, so this has to run post-mount like the theme
    // toggle above it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isShowCompletedDefault()) setFilter("PENDING");
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter === "PENDING") return t.status !== "COMPLETED";
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{title}</p>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-soft">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>
        <div className="flex flex-none gap-1 rounded-lg bg-surface-2 p-1">
          {(["ALL", "PENDING", "COMPLETED"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f ? "bg-surface text-ink shadow-sm" : "text-ink-faint hover:text-ink"
              )}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl border border-dashed border-border-strong p-8 text-center text-sm text-ink-soft">
          {filter === "COMPLETED" ? "Nothing completed yet." : filter === "PENDING" ? "Nothing pending — you're clear." : "Nothing scheduled."}
        </div>
      ) : (
        <SortableTaskList initialTasks={filtered} />
      )}
    </div>
  );
}
