"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { logout } from "@/app/(auth)/actions";
import { QuickThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import { NAV, NavIcon as Icon } from "@/components/dashboard/nav-items";

export function Sidebar({ displayName, email }: { displayName: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-none flex-col overflow-y-auto border-r border-border bg-surface md:flex">
      <div className="flex items-center justify-between px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-accent to-[#a8341f] font-display text-sm font-bold text-[#fff8ec]">
            GS
          </span>
          <span className="font-display text-base font-semibold">Go Sheros</span>
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <QuickThemeToggle />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "glass-card border border-accent-soft-border bg-accent-soft text-accent-ink"
                  : "text-ink-soft hover:bg-surface-2 hover:text-ink"
              )}
            >
              <Icon name={item.icon} className="h-4.5 w-4.5 flex-none" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-2 border-t border-border px-3 py-4">
        <Link
          href="/dashboard/settings"
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/dashboard/settings") ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
          )}
        >
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-accent to-teal text-[11px] font-semibold uppercase text-accent-ink">
            {displayName.slice(0, 1) || email.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate leading-tight">{displayName || email}</p>
            <p className="truncate text-[11px] font-normal text-ink-faint">Level up daily 🚀</p>
          </div>
        </Link>
        <form action={logout}>
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-ink-faint hover:text-ink">
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
