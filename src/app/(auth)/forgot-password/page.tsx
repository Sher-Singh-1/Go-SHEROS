"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordWithBackupCode, type FormState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(resetPasswordWithBackupCode, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          There&apos;s no email recovery — use one of the backup codes you saved when you set up two-factor
          authentication.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email address" htmlFor="email">
          <TextInput id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Backup code" htmlFor="backupCode" hint="One of the 8 codes shown when you set up your authenticator app.">
          <TextInput
            id="backupCode"
            name="backupCode"
            placeholder="XXXX-XXXX"
            className="font-mono uppercase tracking-wider"
            required
          />
        </Field>
        <Field label="New password" htmlFor="password" hint="At least 10 characters, with letters and numbers.">
          <TextInput id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <FormError message={state?.error} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        No backup codes left? You&apos;ll need to sign up again with a new account — this is the tradeoff of not
        depending on email.
      </p>
      <p className="text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-teal hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
