"use client";

import { useEffect, useState, useTransition } from "react";
import { getExistingSubscription, isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push/client";
import { savePushSubscription, removePushSubscription } from "@/app/dashboard/notifications/actions";
import { Toggle } from "@/components/ui/toggle";

export function PushToggle() {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(isPushSupported());
    getExistingSubscription().then((sub) => setSubscribed(Boolean(sub)));
  }, []);

  function toggle(next: boolean) {
    setError(undefined);
    startTransition(async () => {
      try {
        if (next) {
          const subscription = await subscribeToPush();
          await savePushSubscription(subscription);
          setSubscribed(true);
        } else {
          const endpoint = await unsubscribeFromPush();
          if (endpoint) await removePushSubscription(endpoint);
          setSubscribed(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  if (!supported) {
    return <p className="text-xs text-ink-faint">Push notifications aren&apos;t supported in this browser.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Browser push notifications</p>
          <p className="text-xs text-ink-soft">Get notified even when Go Sheros isn&apos;t open in a tab.</p>
        </div>
        <Toggle checked={subscribed} onChange={toggle} label="Browser push notifications" />
      </div>
      {pending && <p className="text-xs text-ink-faint">Updating…</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
