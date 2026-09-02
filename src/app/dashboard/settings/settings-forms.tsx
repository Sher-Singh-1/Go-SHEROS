"use client";

import { useActionState } from "react";
import { updateProfile, updatePreferences, changePassword } from "./actions";
import type { FormState } from "@/app/(auth)/actions";
import { Field, TextInput, FormError, FormInfo } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { professions, professionLabels } from "@/lib/validation/onboarding";

export function ProfileForm({ displayName, profession }: { displayName: string; profession: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateProfile, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Display name" htmlFor="displayName">
        <TextInput id="displayName" name="displayName" defaultValue={displayName} required maxLength={60} />
      </Field>
      <Field label="Profession" htmlFor="profession">
        <select
          id="profession"
          name="profession"
          defaultValue={profession}
          className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        >
          {professions.map((p) => (
            <option key={p} value={p}>{professionLabels[p]}</option>
          ))}
        </select>
      </Field>
      <FormError message={state?.error} />
      <FormInfo message={state?.info} />
      <Button type="submit" disabled={pending} size="sm" className="self-start">{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

export function PreferencesForm({
  hoursPerDay,
  preferredStartHour,
  preferredEndHour,
}: {
  hoursPerDay: number;
  preferredStartHour: number;
  preferredEndHour: number;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updatePreferences, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Hours/day" htmlFor="hoursPerDay">
          <TextInput id="hoursPerDay" name="hoursPerDay" type="number" step="0.25" defaultValue={hoursPerDay} required />
        </Field>
        <Field label="Start hour" htmlFor="preferredStartHour" hint="24h">
          <TextInput id="preferredStartHour" name="preferredStartHour" type="number" defaultValue={preferredStartHour} required />
        </Field>
        <Field label="End hour" htmlFor="preferredEndHour" hint="24h">
          <TextInput id="preferredEndHour" name="preferredEndHour" type="number" defaultValue={preferredEndHour} required />
        </Field>
      </div>
      <FormError message={state?.error} />
      <FormInfo message={state?.info} />
      <Button type="submit" disabled={pending} size="sm" className="self-start">{pending ? "Saving…" : "Save preferences"}</Button>
    </form>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(changePassword, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Current password" htmlFor="currentPassword">
        <TextInput id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password" htmlFor="newPassword" hint="At least 10 characters.">
        <TextInput id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
      </Field>
      <FormError message={state?.error} />
      <FormInfo message={state?.info} />
      <Button type="submit" disabled={pending} size="sm" className="self-start">{pending ? "Updating…" : "Change password"}</Button>
    </form>
  );
}
