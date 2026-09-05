"use server";

import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { markRead, markAllRead } from "@/lib/notifications/service";

export async function markNotificationRead(id: string) {
  const user = await requireUser();
  await markRead(user.id, id);
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await markAllRead(user.id);
}

export async function savePushSubscription(subscription: { endpoint: string; p256dh: string; auth: string }) {
  const user = await requireUser();
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    create: { userId: user.id, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth },
    update: { userId: user.id, p256dh: subscription.p256dh, auth: subscription.auth },
  });
}

export async function removePushSubscription(endpoint: string) {
  const user = await requireUser();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
}
