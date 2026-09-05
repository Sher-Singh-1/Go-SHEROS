"use client";

import { useEffect } from "react";
import { isPushSupported } from "@/lib/push/client";

// Re-registers the service worker on every dashboard visit for users who
// already granted notification permission in an earlier session — this never
// itself prompts for permission (that only happens from the explicit Settings
// toggle), it just keeps an existing subscription's worker alive.
export function PushRegistration() {
  useEffect(() => {
    if (!isPushSupported()) return;
    if (Notification.permission !== "granted") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
