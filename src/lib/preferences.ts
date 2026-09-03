// Client-only display/behavior preferences, following the same pattern as
// theme and reduced-motion (src/components/ui/theme-toggle.tsx): stored in
// localStorage rather than the DB, since they're per-device UI toggles, not
// account data. Each reader is SSR-safe (returns the default on the server).

const SOUND_KEY = "gosheros-sound-enabled";
const SHOW_COMPLETED_KEY = "gosheros-show-completed";
const TIME_FORMAT_KEY = "gosheros-time-format";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "false";
}

export function setSoundEnabled(enabled: boolean) {
  if (enabled) localStorage.removeItem(SOUND_KEY);
  else localStorage.setItem(SOUND_KEY, "false");
}

export function isShowCompletedDefault(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SHOW_COMPLETED_KEY) !== "false";
}

export function setShowCompletedDefault(enabled: boolean) {
  if (enabled) localStorage.removeItem(SHOW_COMPLETED_KEY);
  else localStorage.setItem(SHOW_COMPLETED_KEY, "false");
}

export type TimeFormat = "12h" | "24h";

export function getTimeFormat(): TimeFormat {
  if (typeof window === "undefined") return "12h";
  return localStorage.getItem(TIME_FORMAT_KEY) === "24h" ? "24h" : "12h";
}

export function setTimeFormat(format: TimeFormat) {
  if (format === "12h") localStorage.removeItem(TIME_FORMAT_KEY);
  else localStorage.setItem(TIME_FORMAT_KEY, "24h");
}

/** task.startTime is stored as a 24h "HH:mm" string; this renders it per the user's format preference. */
export function formatTaskTime(time: string, format: TimeFormat): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return time;
  if (format === "24h") return time;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${period}`;
}
