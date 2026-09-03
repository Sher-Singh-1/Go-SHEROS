"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { Toggle } from "@/components/ui/toggle";
import {
  isSoundEnabled,
  setSoundEnabled,
  isShowCompletedDefault,
  setShowCompletedDefault,
  getTimeFormat,
  setTimeFormat,
  type TimeFormat,
} from "@/lib/preferences";

export function GeneralToggles() {
  const [sound, setSound] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [format, setFormat] = useState<TimeFormat>("12h");

  useEffect(() => {
    // localStorage isn't readable during SSR — same reasoning as the theme toggle.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSound(isSoundEnabled());
    setShowCompleted(isShowCompletedDefault());
    setFormat(getTimeFormat());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Enable sound</p>
          <p className="text-xs text-ink-soft">Play a short chime when you complete a task or habit.</p>
        </div>
        <Toggle
          checked={sound}
          onChange={(next) => {
            setSound(next);
            setSoundEnabled(next);
          }}
          label="Enable sound"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show completed tasks</p>
          <p className="text-xs text-ink-soft">Default Today&apos;s-plan lists to All instead of Pending-only.</p>
        </div>
        <Toggle
          checked={showCompleted}
          onChange={(next) => {
            setShowCompleted(next);
            setShowCompletedDefault(next);
          }}
          label="Show completed tasks by default"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Time format</p>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {(["12h", "24h"] as TimeFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFormat(f);
                setTimeFormat(f);
              }}
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                format === f ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
              )}
            >
              {f === "12h" ? "12-hour" : "24-hour"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
