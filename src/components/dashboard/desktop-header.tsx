import { NotificationBell } from "@/components/dashboard/notification-bell";
import { QuickThemeToggle } from "@/components/ui/theme-toggle";

export function DesktopHeader() {
  return (
    <div className="sticky top-0 z-20 hidden items-center justify-end gap-2 border-b border-border bg-surface px-10 py-3 md:flex">
      <NotificationBell />
      <QuickThemeToggle />
    </div>
  );
}
