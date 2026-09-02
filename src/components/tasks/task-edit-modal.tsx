"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { updateTask } from "@/app/dashboard/tasks/actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { LinkListEditor } from "./link-list-editor";
import { parseResourceLinks } from "@/lib/tasks/resource-links";
import type { TaskRowData } from "./task-row";

export function TaskEditModal({ task, onClose }: { task: TaskRowData; onClose: () => void }) {
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateTask(task.id, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-display text-base font-semibold">Edit task</h2>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Field label="Title" htmlFor="edit-title">
            <TextInput id="edit-title" name="title" defaultValue={task.title} required maxLength={160} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="edit-date">
              <TextInput id="edit-date" name="date" type="date" defaultValue={format(task.date, "yyyy-MM-dd")} required />
            </Field>
            <Field label="Priority" htmlFor="edit-priority">
              <select
                id="edit-priority"
                name="priority"
                defaultValue={task.priority}
                className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start time" htmlFor="edit-startTime">
              <TextInput id="edit-startTime" name="startTime" type="time" defaultValue={task.startTime ?? ""} />
            </Field>
            <Field label="Estimated minutes" htmlFor="edit-estimatedMinutes">
              <TextInput id="edit-estimatedMinutes" name="estimatedMinutes" type="number" min={1} max={600} defaultValue={task.estimatedMinutes ?? ""} />
            </Field>
          </div>
          <Field label="Category" htmlFor="edit-category">
            <TextInput id="edit-category" name="category" defaultValue={task.category ?? ""} maxLength={60} />
          </Field>
          <LinkListEditor
            initialLinks={parseResourceLinks(task.notes)
              .filter((l): l is { name: string; url: string } => Boolean(l.url))}
          />
          <FormError message={error} />
          <div className="flex gap-3">
            <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
