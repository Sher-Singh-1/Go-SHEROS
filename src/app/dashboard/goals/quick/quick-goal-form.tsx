"use client";

import { useActionState } from "react";
import { format } from "date-fns";
import { createManualGoal, type ManualGoalState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const CATEGORY_PRESETS = ["Career", "Health", "Learning", "Finance", "Personal", "Relationships", "Other"];

export function QuickGoalForm() {
  const [state, formAction, pending] = useActionState<ManualGoalState, FormData>(createManualGoal, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">New goal</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Name it, give it a deadline, and add your own tasks next — no generated filler, just what you actually need to do.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="startDate" value={format(new Date(), "yyyy-MM-dd")} />
        <Field label="Goal name" htmlFor="title">
          <TextInput id="title" name="title" placeholder="Get a Job" required autoFocus maxLength={120} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="category">
            <TextInput id="category" name="category" list="category-presets" placeholder="Career" maxLength={60} />
            <datalist id="category-presets">
              {CATEGORY_PRESETS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Priority" htmlFor="priority">
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>
        </div>
        <Field label="Deadline" htmlFor="endDate">
          <TextInput id="endDate" name="endDate" type="date" min={format(new Date(), "yyyy-MM-dd")} required />
        </Field>
        <Field label="Notes (optional)" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={2000}
            placeholder="Any context worth remembering about this goal"
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent"
          />
        </Field>
        <FormError message={state?.error} />
        <Button type="submit" disabled={pending} size="lg" className="mt-1">
          {pending ? "Creating…" : "Create goal"}
        </Button>
      </form>
    </div>
  );
}
