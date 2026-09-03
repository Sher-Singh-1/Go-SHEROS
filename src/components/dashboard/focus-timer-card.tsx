"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  startFocusSession,
  syncFocusProgress,
  setFocusSessionStatus,
  finishFocusSession,
} from "@/app/dashboard/focus/actions";

const WORK_SECONDS = 25 * 60;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function FocusTimerCard({ taskId, taskTitle }: { taskId: string | null; taskTitle: string | null }) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const baseSecondsRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const runStart = runStartRef.current ?? Date.now();
      const current = baseSecondsRef.current + (Date.now() - runStart) / 1000;
      setElapsed(current);
      if (current >= WORK_SECONDS) {
        setRunning(false);
        runStartRef.current = null;
        if (sessionId) finishFocusSession(sessionId, WORK_SECONDS, "COMPLETED").then(() => router.refresh());
        setSessionId(null);
        return;
      }
      if (sessionId && Date.now() - lastSyncRef.current > 5000) {
        lastSyncRef.current = Date.now();
        syncFocusProgress(sessionId, Math.round(current));
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, sessionId]);

  async function handleStart() {
    if (!taskId) return;
    const session = await startFocusSession(taskId, "POMODORO", WORK_SECONDS);
    setSessionId(session.id);
    baseSecondsRef.current = session.actualSeconds ?? 0;
    setElapsed(baseSecondsRef.current);
    runStartRef.current = Date.now();
    setRunning(true);
  }

  function freezeElapsed() {
    const runStart = runStartRef.current ?? Date.now();
    const current = baseSecondsRef.current + (Date.now() - runStart) / 1000;
    baseSecondsRef.current = current;
    runStartRef.current = null;
    return current;
  }

  async function handlePause() {
    const current = freezeElapsed();
    setRunning(false);
    if (sessionId) {
      await syncFocusProgress(sessionId, Math.round(current));
      await setFocusSessionStatus(sessionId, "PAUSED");
    }
  }

  async function handleResume() {
    if (sessionId) await setFocusSessionStatus(sessionId, "RUNNING");
    runStartRef.current = Date.now();
    setRunning(true);
  }

  const remaining = Math.max(0, WORK_SECONDS - elapsed);
  const progressPct = Math.min(100, (elapsed / WORK_SECONDS) * 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="glass-card flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="self-start text-xs font-semibold uppercase tracking-wide text-ink-faint">Focus timer</p>

      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg width={112} height={112} className="-rotate-90">
          <circle cx={56} cy={56} r={radius} fill="none" stroke="var(--color-surface-3)" strokeWidth={5} />
          <circle
            cx={56}
            cy={56}
            r={radius}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={sessionId ? offset : circumference}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-xl font-semibold tabular-nums">{formatClock(sessionId ? remaining : WORK_SECONDS)}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">Deep work</span>
        </div>
      </div>

      <p className="min-h-[1rem] max-w-full truncate text-center text-xs text-ink-faint">{taskTitle ?? "No open tasks today"}</p>

      {!sessionId && (
        <button
          onClick={handleStart}
          disabled={!taskId}
          className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:opacity-50"
        >
          Start focus
        </button>
      )}
      {sessionId && running && (
        <button onClick={handlePause} className="w-full rounded-full bg-surface-2 px-4 py-2 text-sm font-medium hover:bg-surface-3">
          Pause
        </button>
      )}
      {sessionId && !running && (
        <button onClick={handleResume} className="w-full rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink">
          Resume
        </button>
      )}

      <Link href="/dashboard/focus" className={clsx("text-xs font-medium text-teal hover:underline")}>
        Open full focus mode
      </Link>
    </div>
  );
}
