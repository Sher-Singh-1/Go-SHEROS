import { NotificationBell } from "@/components/dashboard/notification-bell";

export function MobileHeader() {
  return (
    <div className="flex items-center justify-between bg-transparent px-4 py-3 md:hidden">
      <span className="font-display text-sm font-semibold">Go Sheros</span>
      <NotificationBell />
    </div>
  );
}
