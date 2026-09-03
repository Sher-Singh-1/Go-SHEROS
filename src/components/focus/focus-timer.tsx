"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  startFocusSession,
  syncFocusProgress,
  setFocusSessionStatus,
  finishFocusSession,
} from "@/app/dashboard/focus/actions";
import type { SessionMode } from "@prisma/client";

export type FocusTask = { id: string; title: string; estimatedMinutes: number | null };

type Mode = "stopwatch" | "countdown" | "pomodoro";
const POMODORO_WORK_SECONDS = 25 * 60;
const POMODORO_BREAK_SECONDS = 5 * 60;

function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function FocusTimer({ tasks }: { tasks: FocusTask[] }) {
  const router = useRouter();
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("stopwatch");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [breakPhase, setBreakPhase] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const baseSecondsRef = useRef(0);
  const runStartRef = useRef<number | null>(null);
  const lastSyncRef = useRef(0);

  const task = tasks.find((t) => t.id === taskId);
  const plannedSeconds = useMemo(() => {
    if (mode === "pomodoro") return breakPhase ? POMODORO_BREAK_SECONDS : POMODORO_WORK_SECONDS;
    if (mode === "countdown") return (task?.estimatedMinutes ?? 25) * 60;
    return null;
  }, [mode, task, breakPhase]);

  async function handleAutoComplete(current: number) {
    setRunning(false);
    runStartRef.current = null;
    if (mode === "pomodoro" && !breakPhase) {
      if (sessionId) await finishFocusSession(sessionId, Math.round(current), "COMPLETED");
      setSessionId(null);
      baseSecondsRef.current = 0;
      setElapsed(0);
      setBreakPhase(true);
      return;
    }
    if (mode === "pomodoro" && breakPhase) {
      setBreakPhase(false);
      baseSecondsRef.current = 0;
      setElapsed(0);
      return;
    }
    if (sessionId) await finishFocusSession(sessionId, Math.round(current), "COMPLETED");
    setSessionId(null);
    router.refresh();
  }

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      const runStart = runStartRef.current ?? Date.now();
      const current = baseSecondsRef.current + (Date.now() - runStart) / 1000;
      setElapsed(current);

      if (plannedSeconds !== null && current >= plannedSeconds) {
        handleAutoComplete(current);
        return;
      }

      if (sessionId && Date.now() - lastSyncRef.current > 5000) {
        lastSyncRef.current = Date.now();
        syncFocusProgress(sessionId, Math.round(current));
      }
    }, 250);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, sessionId, plannedSeconds]);

  async function handleStart() {
    if (!task) return;
    if (mode !== "pomodoro" || !breakPhase) {
      const dbMode: SessionMode = mode === "stopwatch" ? "STOPWATCH" : mode === "countdown" ? "COUNTDOWN" : "POMODORO";
      const session = await startFocusSession(task.id, dbMode, plannedSeconds);
      setSessionId(session.id);
      baseSecondsRef.current = session.actualSeconds ?? 0;
      setElapsed(baseSecondsRef.current);
    }
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

  async function handleStop(status: "COMPLETED" | "ABANDONED") {
    const current = freezeElapsed();
    setRunning(false);
    if (sessionId) await finishFocusSession(sessionId, Math.round(current), status);
    setSessionId(null);
    baseSecondsRef.current = 0;
    setElapsed(0);
    setFullscreen(false);
    router.refresh();
  }

  function handleReset() {
    baseSecondsRef.current = 0;
    runStartRef.current = running ? Date.now() : null;
    setElapsed(0);
  }

  const remaining = plannedSeconds !== null ? Math.max(0, plannedSeconds - elapsed) : null;
  const displaySeconds = remaining ?? elapsed;
  const progressPct = plannedSeconds ? Math.min(100, (elapsed / plannedSeconds) * 100) : 0;

  const content = (
    <div className="flex flex-col items-center gap-6 text-center">
      {breakPhase && <p className="font-mono text-xs uppercase tracking-wider text-teal">Break</p>}
      <p className="font-display text-xl font-semibold">{task?.title ?? "Pick a task to focus on"}</p>
      <p className="font-mono text-6xl font-semibold tabular-nums tracking-tight">{formatClock(displaySeconds)}</p>
      {plannedSeconds !== null && (
        <div className="h-1.5 w-64 max-w-full rounded-full bg-surface-3">
          <div className="h-1.5 rounded-full bg-accent transition-[width]" style={{ width: `${progressPct}%` }} />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {!running && !sessionId && (
          <button onClick={handleStart} disabled={!task} className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-ink disabled:opacity-50">
            Start
          </button>
        )}
        {running && (
          <button onClick={handlePause} className="rounded-full bg-surface-2 px-6 py-2.5 text-sm font-medium hover:bg-surface-3">
            Pause
          </button>
        )}
        {!running && sessionId && (
          <button onClick={handleResume} className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-ink">
            Resume
          </button>
        )}
        <button onClick={handleReset} className="rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium hover:bg-surface-2">
          Reset
        </button>
        {sessionId && (
          <>
            <button onClick={() => handleStop("COMPLETED")} className="rounded-full border border-teal px-5 py-2.5 text-sm font-medium text-teal hover:bg-teal-soft">
              Finish
            </button>
            <button onClick={() => handleStop("ABANDONED")} className="rounded-full px-5 py-2.5 text-sm font-medium text-ink-faint hover:text-danger">
              Discard
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 bg-bg">
        {content}
        <button onClick={() => setFullscreen(false)} className="absolute right-6 top-6 text-sm font-medium text-ink-faint hover:text-ink">
          Exit full screen
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card flex flex-col gap-6 rounded-2xl border border-border bg-surface p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          disabled={!!sessionId}
          className="min-w-0 max-w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
        >
          {tasks.length === 0 && <option>No open tasks today</option>}
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {(["stopwatch", "countdown", "pomodoro"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => !sessionId && setMode(m)}
              disabled={!!sessionId}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {content}

      <button
        onClick={() => setFullscreen(true)}
        className="self-center text-xs font-medium text-teal hover:underline"
      >
        Enter full-screen focus mode
      </button>

      <p className="text-center text-sm italic text-ink-faint">
        <span className="text-teal">&ldquo;</span> Stay focused. Great things take time. <span className="text-teal">&rdquo;</span>
      </p>
    </div>
  );
}
