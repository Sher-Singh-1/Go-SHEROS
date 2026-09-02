"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { logout } from "@/app/(auth)/actions";
import { QuickThemeToggle } from "@/components/ui/theme-toggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "home" },
  { href: "/dashboard/today", label: "Today", icon: "check" },
  { href: "/dashboard/goals", label: "Goals", icon: "target" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" },
  { href: "/dashboard/habits", label: "Habits", icon: "repeat" },
  { href: "/dashboard/focus", label: "Focus", icon: "clock" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "chart" },
  { href: "/dashboard/ai", label: "AI Coach", icon: "spark" },
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.7, viewBox: "0 0 24 24" };
  switch (name) {
    case "home":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>;
    case "check":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" /></svg>;
    case "target":
      return <svg {...common}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></svg>;
    case "calendar":
      return <svg {...common}><rect x="3.5" y="5" width="17" height="16" rx="2" /><path strokeLinecap="round" d="M8 3v4M16 3v4M3.5 10h17" /></svg>;
    case "repeat":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h11a4 4 0 0 1 4 4v1M20 16H9a4 4 0 0 1-4-4v-1M7 5 4 8l3 3M17 19l3-3-3-3" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4.5l3 2" /></svg>;
    case "chart":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M12 20V4M20 20v-7" /></svg>;
    case "spark":
      return <svg {...common}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /><circle cx="12" cy="12" r="2.6" /></svg>;
    default:
      return null;
  }
}

export function Sidebar({ displayName, email }: { displayName: string; email: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-none flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center justify-between px-6 py-6">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-accent to-[#a85f17] font-display text-sm font-bold text-[#221202]">
            GS
          </span>
          <span className="font-display text-base font-semibold">Go Sheros</span>
        </Link>
        <QuickThemeToggle />
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
                active ? "bg-accent-soft text-accent-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
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
          <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold uppercase text-ink-soft">
            {displayName.slice(0, 1) || email.slice(0, 1)}
          </div>
          <span className="truncate">{displayName || email}</span>
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
