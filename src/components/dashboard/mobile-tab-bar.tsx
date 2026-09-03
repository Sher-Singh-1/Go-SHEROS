"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { NavIcon } from "@/components/dashboard/nav-items";

const TABS = [
  { href: "/dashboard/today", label: "Today", icon: "check" },
  { href: "/dashboard/goals", label: "Goals", icon: "target" },
  { href: "/dashboard/focus", label: "Focus", icon: "clock" },
] as const;

// Everything else lives behind "More" — a phone-width bar can't fit all 8
// sections, so this sheet is how Calendar, Habits, Analytics, etc. stay
// reachable on mobile instead of disappearing entirely.
const MORE_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" },
  { href: "/dashboard/habits", label: "Habits", icon: "repeat" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/ai", label: "AI Coach", icon: "spark" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE_LINKS.some((l) => pathname.startsWith(l.href) && l.href !== "/dashboard") || pathname === "/dashboard";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-3 pb-6 shadow-[0_-8px_30px_-8px_rgba(0,0,0,0.35)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
            <nav className="flex flex-col gap-0.5">
              {MORE_LINKS.map((item) => {
                const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      active ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                    )}
                  >
                    <NavIcon name={item.icon} className="h-4.5 w-4.5 flex-none" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

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
              <NavIcon name={tab.icon} className="h-4.5 w-4.5" />
              {tab.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          aria-expanded={open}
          className={clsx(
            "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
            moreActive || open ? "text-accent-ink" : "text-ink-faint"
          )}
        >
          <NavIcon name="more" className="h-4.5 w-4.5" />
          More
        </button>
      </nav>
    </>
  );
}
