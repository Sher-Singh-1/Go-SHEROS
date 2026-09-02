"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const TABS = [
  { href: "/dashboard/today", label: "Today" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/focus", label: "Focus" },
  { href: "/dashboard/ai", label: "Coach" },
  { href: "/dashboard/settings", label: "More" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface md:hidden">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-accent-ink" : "text-ink-faint"
            )}
          >
            <span className={clsx("h-1.5 w-1.5 rounded-full", active ? "bg-accent" : "bg-transparent")} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
