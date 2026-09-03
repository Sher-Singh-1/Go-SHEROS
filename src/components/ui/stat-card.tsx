import type { ReactNode } from "react";

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  accent = false,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-card flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon && <span className="flex h-4 w-4 flex-none items-center justify-center">{icon}</span>}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={"font-display text-2xl font-semibold tabular-nums " + (accent ? "text-accent-ink" : "text-ink")}>
        {value}
      </p>
      {sublabel && <p className="text-xs text-ink-faint">{sublabel}</p>}
    </div>
  );
}

export function StatIcon({ name }: { name: "ring" | "flame" | "clock" | "trend" | "tasks" | "streak" }) {
  const common = { className: "h-full w-full", fill: "none", stroke: "currentColor", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  switch (name) {
    case "flame":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c1 3-2.5 4.5-2.5 8a4.5 4.5 0 1 0 9 0c0-1.5-.6-2.4-1.2-3.2.1 1.4-.6 2-1.1 2.2.6-2.4-1-4.3-4.2-7Z" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4.5l3 2" /></svg>;
    case "trend":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 17 9 11l4 4 8-8M15 7h6v6" /></svg>;
    case "tasks":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></svg>;
    case "streak":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h11a4 4 0 0 1 4 4v1M20 16H9a4 4 0 0 1-4-4v-1M7 5 4 8l3 3M17 19l3-3-3-3" /></svg>;
    default:
      return null;
  }
}
