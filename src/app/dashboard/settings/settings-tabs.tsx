"use client";

import { useState, type ReactNode } from "react";
import { clsx } from "clsx";

export type SettingsTab = { id: string; label: string; content: ReactNode };

export function SettingsTabs({ tabs }: { tabs: SettingsTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="glass-card flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-surface sm:flex-row">
      <nav className="flex flex-none gap-1 overflow-x-auto border-b border-border p-2 sm:w-48 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={clsx(
              "flex-none whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              current?.id === t.id ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 p-6">{current?.content}</div>
    </div>
  );
}
