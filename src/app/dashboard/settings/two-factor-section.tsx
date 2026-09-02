"use client";

import { useState, useTransition } from "react";
import { regenerateBackupCodes } from "./actions";
import { Button } from "@/components/ui/button";

export function TwoFactorSection({ remainingCodes }: { remainingCodes: number }) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-sm">
        <span>Authenticator app</span>
        <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-medium text-teal">Enabled</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>Backup codes remaining</span>
        <span className="font-mono tabular-nums">{remainingCodes} / 8</span>
      </div>

      {codes ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-soft">
            New codes generated — your old ones no longer work. Save these somewhere safe; they&apos;re shown only
            this once.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface-2 p-4 font-mono text-sm">
            {codes.map((code) => (
              <span key={code} className="text-center tracking-wider">{code}</span>
            ))}
          </div>
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setCodes(null)}>
            Done
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          disabled={pending}
          onClick={() => startTransition(async () => setCodes(await regenerateBackupCodes()))}
        >
          {pending ? "Generating…" : "Regenerate backup codes"}
        </Button>
      )}
    </div>
  );
}
