"use client";

import { useTransition } from "react";
import { exportUserData, deleteAccount } from "./actions";
import { Button } from "@/components/ui/button";

export function ExportDataButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const json = await exportUserData();
          const blob = new Blob([json], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `go-sheros-export-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        })
      }
    >
      {pending ? "Preparing…" : "Export my data"}
    </Button>
  );
}

export function DeleteAccountButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="danger"
      disabled={pending}
      onClick={() => {
        if (!window.confirm("Delete your account and everything in it? This can't be undone.")) return;
        startTransition(() => deleteAccount());
      }}
    >
      {pending ? "Deleting…" : "Delete account"}
    </Button>
  );
}
