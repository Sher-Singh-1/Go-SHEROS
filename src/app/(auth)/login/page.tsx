"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type FormState } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(login, undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Log in to pick up where you left off.</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Email address" htmlFor="email">
          <TextInput id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <div className="-mt-2 flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-teal hover:underline">
            Forgot password?
          </Link>
        </div>
        <FormError message={state?.error} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        New to Go Sheros?{" "}
        <Link href="/signup" className="font-medium text-teal hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
