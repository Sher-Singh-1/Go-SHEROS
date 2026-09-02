"use client";

import { useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import { sendConversationMessage } from "./actions";

type Message = { role: string; content: string };

export function ConversationView({
  conversationId: initialConversationId,
  initialMessages,
}: {
  conversationId: string | null;
  initialMessages: Message[];
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-1 flex-col rounded-2xl border border-border bg-surface">
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="font-display text-base font-medium">What&apos;s on your mind?</p>
            <p className="max-w-xs text-sm text-ink-soft">
              Try &ldquo;I have an exam in 45 days&rdquo; or &ldquo;I have too many tasks today.&rdquo;
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user" ? "ml-auto bg-accent text-accent-ink" : "bg-surface-2 text-ink"
                )}
              >
                {m.content}
              </div>
            ))}
            {pending && <div className="w-fit rounded-2xl bg-surface-2 px-4 py-2.5 text-sm text-ink-faint">Thinking…</div>}
          </div>
        )}
      </div>

      <form
        ref={formRef}
        action={(formData) => {
          const message = String(formData.get("message") ?? "").trim();
          if (!message) return;
          setMessages((prev) => [...prev, { role: "user", content: message }]);
          formRef.current?.reset();
          startTransition(async () => {
            const res = await sendConversationMessage(conversationId, message);
            setConversationId(res.conversationId);
            setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
          });
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <input
          name="message"
          placeholder="Ask your coach…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}
