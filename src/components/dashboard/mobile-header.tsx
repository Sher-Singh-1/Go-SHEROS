import { NotificationBell } from "@/components/dashboard/notification-bell";

export function MobileHeader() {
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
      <span className="font-display text-sm font-semibold">Go Sheros</span>
      <NotificationBell />
    </div>
  );
}
