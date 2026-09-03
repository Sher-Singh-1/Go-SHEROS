"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { toggleHabitToday, archiveHabit } from "./actions";
import { celebrate } from "@/lib/celebration";

export type HabitRowData = {
  id: string;
  title: string;
  last7: boolean[]; // oldest → newest, today last
};

export function HabitRow({ habit }: { habit: HabitRowData }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const doneToday = habit.last7[habit.last7.length - 1];

  return (
    <div className={clsx("group glass-card flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3", pending && "opacity-60")}>
      <button
        onClick={(e) => {
          if (!doneToday) {
            const rect = e.currentTarget.getBoundingClientRect();
            celebrate({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
          }
          startTransition(async () => { await toggleHabitToday(habit.id); router.refresh(); });
        }}
        aria-pressed={doneToday}
        className={clsx(
          "flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 transition-colors",
          doneToday ? "border-teal bg-teal text-white" : "border-border-strong hover:border-accent"
        )}
      >
        {doneToday && (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </button>

      <p className="min-w-0 flex-1 truncate text-sm font-medium">{habit.title}</p>

      <div className="flex flex-none gap-1">
        {habit.last7.map((done, i) => (
          <span key={i} className={clsx("h-4 w-4 rounded-[4px]", done ? "bg-teal" : "bg-surface-3")} />
        ))}
      </div>

      <button
        onClick={() => startTransition(async () => { await archiveHabit(habit.id); router.refresh(); })}
        className="flex-none rounded-md p-1.5 text-ink-faint opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100"
        aria-label="Archive habit"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
