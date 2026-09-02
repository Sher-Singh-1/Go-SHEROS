"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { confirmTotpSetup, type ConfirmTotpState } from "./actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: ConfirmTotpState = { status: "idle" };

export function TotpSetupView({ qrDataUrl, manualKey }: { qrDataUrl: string; manualKey: string }) {
  const [state, formAction, pending] = useActionState(confirmTotpSetup, initialState);

  if (state.status === "success") {
    return <BackupCodesView codes={state.backupCodes} nextPath={state.nextPath} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Set up your authenticator app</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Scan this with Google Authenticator, Authy, 1Password, or any TOTP app. This replaces email for login — no
          inbox needed.
        </p>
      </div>

      <div className="flex justify-center">
        <Image src={qrDataUrl} alt="Scan with your authenticator app" width={200} height={200} className="rounded-xl border border-border" unoptimized />
      </div>

      <div>
        <p className="mb-1 text-xs text-ink-faint">Can&apos;t scan? Enter this key manually:</p>
        <p className="select-all break-all rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-center font-mono text-sm tracking-wider">
          {manualKey}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Enter the 6-digit code from your app" htmlFor="code">
          <TextInput
            id="code"
            name="code"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            className="text-center font-mono text-lg tracking-[0.3em]"
            required
            autoFocus
          />
        </Field>
        <FormError message={state.status === "error" ? state.error : undefined} />
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Confirming…" : "Confirm & enable"}
        </Button>
      </form>
    </div>
  );
}

function BackupCodesView({ codes, nextPath }: { codes: string[]; nextPath: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Save your backup codes</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Two-factor is on. These 8 codes are the only way back into your account if you lose your authenticator
          device — each works once. They&apos;re shown only this one time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm">
        {codes.map((code) => (
          <span key={code} className="text-center tracking-wider">{code}</span>
        ))}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-ink-soft">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="h-4 w-4 accent-accent" />
        I&apos;ve saved these codes somewhere safe
      </label>

      <Button
        size="lg"
        disabled={!saved}
        onClick={() => window.location.assign(nextPath)}
      >
        Continue
      </Button>
    </div>
  );
}
