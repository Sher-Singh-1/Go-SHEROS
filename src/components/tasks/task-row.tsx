"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { isBefore, startOfDay } from "date-fns";
import { setTaskStatus, deleteTask } from "@/app/dashboard/tasks/actions";
import { TaskEditModal } from "./task-edit-modal";
import { celebrate } from "@/lib/celebration";
import { parseResourceLinks } from "@/lib/tasks/resource-links";
import { ResourceLinkChips } from "./resource-link-chips";
import type { Priority, TaskStatus } from "@prisma/client";

export type TaskRowData = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  date: Date;
  startTime: string | null;
  category: string | null;
  estimatedMinutes: number | null;
  description?: string | null;
  notes?: string | null;
};

const PRIORITY_DOT: Record<Priority, string> = {
  HIGH: "bg-danger",
  MEDIUM: "bg-accent",
  LOW: "bg-teal",
};

export function TaskRow({ task, showDelete = true }: { task: TaskRowData; showDelete?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const isCompleted = task.status === "COMPLETED";
  const isOverdue = !isCompleted && task.status !== "SKIPPED" && isBefore(startOfDay(task.date), startOfDay(new Date()));
  const resourceLinks = parseResourceLinks(task.notes);
  const hasDetails = Boolean(task.description) || resourceLinks.length > 0;

  function toggle(e: React.MouseEvent<HTMLButtonElement>) {
    const willComplete = !isCompleted;
    if (willComplete) {
      const rect = e.currentTarget.getBoundingClientRect();
      celebrate({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    startTransition(async () => {
      await setTaskStatus(task.id, willComplete ? "COMPLETED" : "NOT_STARTED");
      router.refresh();
    });
  }

  return (
    <div
      className={clsx(
        "group rounded-xl border border-border bg-surface px-4 py-3 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <div className="flex items-center gap-3">
      <button
        onClick={toggle}
        aria-pressed={isCompleted}
        aria-label={isCompleted ? "Mark not completed" : "Mark completed"}
        className={clsx(
          "flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 transition-colors",
          isCompleted ? "border-teal bg-teal text-white" : "border-border-strong hover:border-accent"
        )}
      >
        {isCompleted && (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      <span className={clsx("h-1.5 w-1.5 flex-none rounded-full", PRIORITY_DOT[task.priority])} />

      <button
        type="button"
        onClick={() => hasDetails && setExpanded((v) => !v)}
        className={clsx("min-w-0 flex-1 text-left", hasDetails && "cursor-pointer")}
      >
        <p className={clsx("truncate text-sm font-medium", isCompleted && "text-ink-faint line-through")}>{task.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-faint">
          {task.startTime && <span className="font-mono">{task.startTime}</span>}
          {task.estimatedMinutes && <span>{task.estimatedMinutes}m</span>}
          {task.category && <span>{task.category}</span>}
          {isOverdue && <span className="font-medium text-danger">Overdue</span>}
          {hasDetails && <span className="font-medium text-teal">{expanded ? "Hide details" : "Details"}</span>}
        </div>
      </button>

      <button
        onClick={() => setEditing(true)}
        aria-label="Edit task"
        className="flex-none rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>

      {showDelete && (
        <button
          onClick={() => startTransition(async () => { await deleteTask(task.id); router.refresh(); })}
          aria-label="Delete task"
          className="flex-none rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}

      </div>

      {expanded && hasDetails && (
        <div className="ml-8 mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
          {task.description && (
            <p className="whitespace-pre-line text-xs text-ink-soft">{task.description}</p>
          )}
          <ResourceLinkChips links={resourceLinks} />
        </div>
      )}

      {editing && <TaskEditModal task={task} onClose={() => setEditing(false)} />}
    </div>
  );
}
