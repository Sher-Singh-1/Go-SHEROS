import type { InputHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-danger-soft bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
      {message}
    </p>
  );
}

export function FormInfo({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-lg border border-accent-soft-border bg-accent-soft px-3.5 py-2.5 text-sm text-accent-ink">
      {message}
    </p>
  );
}
