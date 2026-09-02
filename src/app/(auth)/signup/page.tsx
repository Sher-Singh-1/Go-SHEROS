"use client";

import { useActionState } from "react";
import Link from "next/link";
import { startSignup, type FormState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(startSignup, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Next you&apos;ll set up an authenticator app for two-factor login — no email verification needed.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email address" htmlFor="email">
          <TextInput id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 10 characters, with letters and numbers.">
          <TextInput id="password" name="password" type="password" autoComplete="new-password" required />
        </Field>
        <FormError message={state?.error} />
        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Creating account…" : "Continue"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
