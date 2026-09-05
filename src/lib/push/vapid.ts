import "server-only";
import webPush from "web-push";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must be set to send web push.");
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

export type PushSubscriptionKeys = { endpoint: string; p256dh: string; auth: string };

/** Sends one push message. Returns "expired" for a dead subscription (404/410) so the caller can prune it. */
export async function sendPush(
  subscription: PushSubscriptionKeys,
  payload: { title: string; body: string; actionUrl?: string | null }
): Promise<"sent" | "expired"> {
  ensureConfigured();
  try {
    await webPush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({ title: payload.title, body: payload.body, url: payload.actionUrl ?? "/dashboard/today" })
    );
    return "sent";
  } catch (err) {
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) return "expired";
    throw err;
  }
}
