"use client";

import { useActionState, useState } from "react";
import { updateProfile, updatePreferences, updateNotificationSettings, changePassword } from "./actions";
import type { FormState } from "@/app/(auth)/actions";
import { Field, TextInput, FormError, FormInfo } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
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

export function NotificationsForm({
  reminderEnabled,
  timeOfDay,
  quietHoursStart,
  quietHoursEnd,
}: {
  reminderEnabled: boolean;
  timeOfDay: string;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateNotificationSettings, undefined);
  const [enabled, setEnabled] = useState(reminderEnabled);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Daily planning reminder</p>
          <p className="text-xs text-ink-soft">A nudge to plan your day, in-app.</p>
        </div>
        <input type="hidden" name="reminderEnabled" value={enabled ? "on" : "off"} />
        <Toggle checked={enabled} onChange={setEnabled} label="Daily planning reminder" />
      </div>
      <Field label="Reminder time" htmlFor="timeOfDay" hint="24h">
        <TextInput id="timeOfDay" name="timeOfDay" type="time" defaultValue={timeOfDay} className={!enabled ? "opacity-50" : undefined} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Quiet hours start" htmlFor="quietHoursStart" hint="24h, optional">
          <TextInput id="quietHoursStart" name="quietHoursStart" type="number" min={0} max={23} defaultValue={quietHoursStart ?? ""} />
        </Field>
        <Field label="Quiet hours end" htmlFor="quietHoursEnd" hint="24h, optional">
          <TextInput id="quietHoursEnd" name="quietHoursEnd" type="number" min={0} max={23} defaultValue={quietHoursEnd ?? ""} />
        </Field>
      </div>
      <FormError message={state?.error} />
      <FormInfo message={state?.info} />
      <Button type="submit" disabled={pending} size="sm" className="self-start">{pending ? "Saving…" : "Save notifications"}</Button>
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
