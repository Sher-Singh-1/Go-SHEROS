"use client";

import { useActionState } from "react";
import { completeOnboarding } from "./actions";
import type { FormState } from "@/app/(auth)/actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { professions, professionLabels } from "@/lib/validation/onboarding";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(completeOnboarding, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field label="What should we call you?" htmlFor="displayName">
        <TextInput id="displayName" name="displayName" required autoFocus maxLength={60} />
      </Field>

      <Field label="What best describes you?" htmlFor="profession">
        <select
          id="profession"
          name="profession"
          required
          defaultValue="OTHER"
          className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
        >
          {professions.map((p) => (
            <option key={p} value={p}>
              {professionLabels[p]}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Hours/day" htmlFor="hoursPerDay">
          <TextInput id="hoursPerDay" name="hoursPerDay" type="number" step="0.25" min={0.25} max={16} defaultValue={2} required />
        </Field>
        <Field label="Start hour" htmlFor="preferredStartHour" hint="24h">
          <TextInput id="preferredStartHour" name="preferredStartHour" type="number" min={0} max={23} defaultValue={9} required />
        </Field>
        <Field label="End hour" htmlFor="preferredEndHour" hint="24h">
          <TextInput id="preferredEndHour" name="preferredEndHour" type="number" min={1} max={24} defaultValue={21} required />
        </Field>
      </div>

      <FormError message={state?.error} />
      <Button type="submit" disabled={pending} size="lg" className="mt-1 w-full">
        {pending ? "Saving…" : "Continue to your first goal"}
      </Button>
    </form>
  );
}
