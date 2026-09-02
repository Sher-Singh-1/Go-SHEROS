"use client";

import { useActionState } from "react";
import Link from "next/link";
import { completeLoginTotp, type FormState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function LoginTotpPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(completeLoginTotp, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Enter your authenticator code</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Your password checked out. Open your authenticator app for the current 6-digit code, or use one of your
          backup codes.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Code" htmlFor="code">
          <TextInput
            id="code"
            name="code"
            placeholder="000000 or XXXX-XXXX"
            className="text-center font-mono text-lg tracking-[0.2em]"
            required
            autoFocus
          />
        </Field>
        <FormError message={state?.error} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Verifying…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        <Link href="/login" className="font-medium text-teal hover:underline">
          Back to login
        </Link>
        {" · "}
        <Link href="/forgot-password" className="font-medium text-teal hover:underline">
          Lost access?
        </Link>
      </p>
    </div>
  );
}
