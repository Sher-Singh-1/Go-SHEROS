"use client";

import { clsx } from "clsx";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
      className={clsx(
        "flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition-colors",
        checked ? "bg-accent" : "bg-surface-3"
      )}
    >
      <span className={clsx("h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
    </button>
  );
}
