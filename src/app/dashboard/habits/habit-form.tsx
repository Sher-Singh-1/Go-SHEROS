"use client";

import { useActionState, useRef } from "react";
import { createHabit, type HabitFormState } from "./actions";
import { FormError } from "@/components/ui/field";

export function HabitForm() {
  const [state, formAction, pending] = useActionState<HabitFormState, FormData>(createHabit, undefined);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await formAction(fd);
        ref.current?.reset();
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <input
          name="title"
          required
          placeholder="Read 30 minutes, exercise, drink water…"
          className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" disabled={pending} className="flex-none rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-50">
          {pending ? "Adding…" : "Add habit"}
        </button>
      </div>
      <FormError message={state?.error} />
    </form>
  );
}
