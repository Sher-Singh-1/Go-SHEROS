"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateGoal, archiveGoal, reactivateGoal, deleteGoal, type EditGoalState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LinkListEditor } from "@/components/tasks/link-list-editor";
import { ResourceLinkChips } from "@/components/tasks/resource-link-chips";
import { parseResourceLinks } from "@/lib/tasks/resource-links";
import type { GoalStatus, Priority } from "@prisma/client";

export type EditableGoal = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  startDate: string;
  endDate: string;
  priority: Priority;
  status: GoalStatus;
};

export function GoalHeader({ goal }: { goal: EditableGoal }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const boundUpdate = updateGoal.bind(null, goal.id);
  const [state, formAction, submitting] = useActionState<EditGoalState, FormData>(boundUpdate, undefined);

  if (editing) {
    return (
      <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5">
        <Field label="Title" htmlFor="title">
          <TextInput id="title" name="title" defaultValue={goal.title} required maxLength={120} />
        </Field>
        <Field label="Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            defaultValue={goal.description ?? ""}
            rows={3}
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start date" htmlFor="startDate">
            <TextInput id="startDate" name="startDate" type="date" defaultValue={goal.startDate.slice(0, 10)} required />
          </Field>
          <Field label="Target date" htmlFor="endDate">
            <TextInput id="endDate" name="endDate" type="date" defaultValue={goal.endDate.slice(0, 10)} required />
          </Field>
          <Field label="Priority" htmlFor="priority">
            <select
              id="priority"
              name="priority"
              defaultValue={goal.priority}
              className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </Field>
        </div>
        <LinkListEditor
          initialLinks={parseResourceLinks(goal.notes).filter((l): l is { name: string; url: string } => Boolean(l.url))}
        />
        <FormError message={state?.error} />
        <div className="flex gap-3">
          <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Save changes"}</Button>
          <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-teal">
          {format(new Date(goal.startDate), "MMM d")} – {format(new Date(goal.endDate), "MMM d, yyyy")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{goal.title}</h1>
        {goal.description && <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{goal.description}</p>}
        {goal.notes && <div className="mt-2"><ResourceLinkChips links={parseResourceLinks(goal.notes)} /></div>}
      </div>
      <div className="flex flex-none items-center gap-4">
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-ink-faint hover:text-ink">
          Edit
        </button>
        {goal.status === "ACTIVE" ? (
          <button
            onClick={() => startTransition(() => archiveGoal(goal.id))}
            disabled={pending}
            className="text-xs font-medium text-ink-faint hover:text-accent-ink"
          >
            Archive
          </button>
        ) : (
          <button
            onClick={() => startTransition(async () => { await reactivateGoal(goal.id); router.refresh(); })}
            disabled={pending}
            className="text-xs font-medium text-ink-faint hover:text-teal"
          >
            Reactivate
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm(`Delete "${goal.title}" permanently? Its tasks will stay on your list, unlinked from any goal.`)) {
              startTransition(() => deleteGoal(goal.id));
            }
          }}
          disabled={pending}
          className="text-xs font-medium text-ink-faint hover:text-danger"
        >
          Delete
        </button>
      </div>
    </header>
  );
}
