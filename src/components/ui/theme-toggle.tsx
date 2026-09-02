"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

type ThemeChoice = "system" | "light" | "dark";

function useThemeChoice() {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");

  useEffect(() => {
    // Reading localStorage during render would mismatch SSR output, so this
    // has to run post-mount — the one legitimate case for setState-in-effect.
    const stored = localStorage.getItem("gosheros-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoiceState(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  function setChoice(next: ThemeChoice) {
    setChoiceState(next);
    if (next === "system") {
      localStorage.removeItem("gosheros-theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("gosheros-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
  }

  return [choice, setChoice] as const;
}

export function ThemeToggle() {
  const [choice, setChoice] = useThemeChoice();

  return (
    <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
      {(["system", "light", "dark"] as ThemeChoice[]).map((option) => (
        <button
          key={option}
          onClick={() => setChoice(option)}
          className={clsx(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
            choice === option ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

const CYCLE: ThemeChoice[] = ["light", "dark", "system"];
const ICON_LABEL: Record<ThemeChoice, string> = { light: "Light theme", dark: "Dark theme", system: "System theme" };

/** Compact icon toggle for persistent chrome (sidebar) — cycles light → dark → system. */
export function QuickThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useThemeChoice();

  function cycle() {
    const next = CYCLE[(CYCLE.indexOf(choice) + 1) % CYCLE.length];
    setChoice(next);
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${ICON_LABEL[choice]}. Click to change.`}
      title={ICON_LABEL[choice]}
      className={clsx(
        "flex h-8 w-8 flex-none items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface-2 hover:text-ink",
        className
      )}
    >
      {choice === "light" && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="4.2" />
          <path strokeLinecap="round" d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      )}
      {choice === "dark" && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      )}
      {choice === "system" && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3.5" y="5" width="17" height="12" rx="1.5" />
          <path strokeLinecap="round" d="M9 20h6M12 17v3" />
        </svg>
      )}
    </button>
  );
}

export function ReducedMotionToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Same reasoning as useThemeChoice above — localStorage is client-only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(localStorage.getItem("gosheros-reduced-motion") === "true");
  }, []);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      localStorage.setItem("gosheros-reduced-motion", "true");
      document.documentElement.setAttribute("data-reduced-motion", "true");
    } else {
      localStorage.removeItem("gosheros-reduced-motion");
      document.documentElement.removeAttribute("data-reduced-motion");
    }
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={enabled}
      className={clsx(
        "flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition-colors",
        enabled ? "bg-accent" : "bg-surface-3"
      )}
    >
      <span className={clsx("h-5 w-5 rounded-full bg-white shadow transition-transform", enabled && "translate-x-5")} />
    </button>
  );
}
