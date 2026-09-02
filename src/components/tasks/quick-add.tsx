"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/app/dashboard/tasks/actions";

export function QuickAdd({ date }: { date: string }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          await createTask(undefined, formData);
          formRef.current?.reset();
          router.refresh();
        });
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="date" value={date} />
      <input
        name="title"
        required
        placeholder="Add a task for today…"
        className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex-none rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-3 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
