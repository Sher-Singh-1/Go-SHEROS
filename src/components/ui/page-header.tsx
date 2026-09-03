import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="font-mono text-xs uppercase tracking-wider text-teal">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {right && <div className="flex flex-none items-center gap-2">{right}</div>}
    </div>
  );
}
