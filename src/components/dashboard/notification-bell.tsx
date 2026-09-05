"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { formatDistanceToNowStrict } from "date-fns";
import { markNotificationRead, markAllNotificationsRead } from "@/app/dashboard/notifications/actions";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
};

const POLL_MS = 30_000;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function refresh() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Transient network hiccup — the next poll will retry.
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount, same pattern as polling below
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function openItem(item: NotificationItem) {
    if (!item.readAt) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      startTransition(async () => {
        await markNotificationRead(item.id);
      });
    }
    setOpen(false);
    if (item.actionUrl) router.push(item.actionUrl);
  }

  function markAll() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsRead();
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 8a6 6 0 1 1 12 0c0 4.5 1.5 6 2 7H4c.5-1 2-2.5 2-7Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 18a2.5 2.5 0 0 0 5 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-card absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-border bg-surface shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={pending}
                className="text-xs font-medium text-teal hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-faint">Nothing yet.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={clsx(
                    "flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-2",
                    !item.readAt && "bg-accent-soft/40"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!item.readAt && <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.title}</p>
                  </div>
                  <p className="line-clamp-2 text-xs text-ink-soft">{item.body}</p>
                  <p className="text-[11px] text-ink-faint">
                    {formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
