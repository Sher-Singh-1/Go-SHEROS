"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/dashboard/tasks/actions";
import { LinkListEditor } from "./link-list-editor";

export function QuickAdd({ date, goalId, placeholder }: { date: string; goalId?: string; placeholder?: string }) {
  const [pending, startTransition] = useTransition();
  const [showLink, setShowLink] = useState(false);
  const [repeatDaily, setRepeatDaily] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createTask(undefined, formData);
          formRef.current?.reset();
          setShowLink(false);
          setRepeatDaily(false);
          router.refresh();
        });
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="date" value={date} />
      {goalId && <input type="hidden" name="goalId" value={goalId} />}
      {repeatDaily && [0, 1, 2, 3, 4, 5, 6].map((d) => <input key={d} type="hidden" name="recurrenceDays" value={d} />)}
      <div className="flex gap-2">
        <input
          name="title"
          required
          placeholder={placeholder ?? "Add a task for today…"}
          className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        {goalId && (
          <button
            type="button"
            onClick={() => setRepeatDaily((v) => !v)}
            aria-pressed={repeatDaily}
            title="Repeat every day"
            className={
              "flex-none rounded-lg border px-3 text-sm " +
              (repeatDaily ? "border-accent bg-accent-soft text-accent-ink" : "border-border-strong text-ink-soft hover:bg-surface-2")
            }
          >
            🔁
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowLink((v) => !v)}
          aria-pressed={showLink}
          title="Attach a link"
          className="flex-none rounded-lg border border-border-strong px-3 text-sm text-ink-soft hover:bg-surface-2"
        >
          🔗
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-none rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-3 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {showLink && <LinkListEditor />}
    </form>
  );
}
