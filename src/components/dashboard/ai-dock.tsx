"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { askCoachAction } from "@/app/dashboard/ai/actions";

export function AiDock() {
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="fixed bottom-20 right-5 z-30 md:bottom-6 md:right-6">
      {open && (
        <div className="mb-3 w-80 rounded-2xl border border-border bg-surface/95 p-4 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur">
          <p className="mb-2 font-display text-sm font-semibold">Ask your coach</p>
          {reply && <p className="mb-3 rounded-lg bg-surface-2 p-3 text-sm text-ink-soft">{reply}</p>}
          <form
            action={(formData) => {
              const message = String(formData.get("message") ?? "");
              if (!message.trim()) return;
              startTransition(async () => {
                const res = await askCoachAction(message);
                setReply(res);
              });
            }}
            className="flex gap-2"
          >
            <input
              name="message"
              placeholder="I have too many tasks today…"
              className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
            >
              {pending ? "…" : "Ask"}
            </button>
          </form>
          <Link href="/dashboard/ai" className="mt-2 block text-center text-xs font-medium text-teal hover:underline">
            Open full conversation
          </Link>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="AI coach"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_8px_24px_-8px_rgba(201,122,31,0.6)] transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      </button>
    </div>
  );
}
