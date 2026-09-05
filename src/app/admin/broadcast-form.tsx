"use client";

import { useActionState } from "react";
import { broadcastNotification, type BroadcastState } from "./actions";
import { Field, TextInput, FormError, FormInfo } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function BroadcastForm() {
  const [state, formAction, pending] = useActionState<BroadcastState, FormData>(broadcastNotification, undefined);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="mb-1 text-sm font-medium">Send an announcement</p>
      <p className="mb-4 text-xs text-ink-soft">
        Delivered as an in-app notification (and push, where subscribed) to every user opted into product updates.
      </p>
      <form action={formAction} className="flex flex-col gap-3">
        <Field label="Title" htmlFor="broadcast-title">
          <TextInput id="broadcast-title" name="title" required maxLength={120} />
        </Field>
        <Field label="Message" htmlFor="broadcast-body">
          <TextInput id="broadcast-body" name="body" required maxLength={500} />
        </Field>
        <FormError message={state?.error} />
        <FormInfo message={state?.info} />
        <Button type="submit" disabled={pending} size="sm" className="self-start">
          {pending ? "Sending…" : "Send announcement"}
        </Button>
      </form>
    </div>
  );
}
