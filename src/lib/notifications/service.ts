import "server-only";
import { prisma } from "@/lib/db/client";
import { isPushConfigured, sendPush } from "@/lib/push/vapid";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(
  userId: string,
  input: { title: string; body: string; type?: NotificationType; actionUrl?: string }
) {
  const notification = await prisma.notification.create({
    data: {
      userId,
      title: input.title,
      body: input.body,
      type: input.type ?? "SYSTEM",
      actionUrl: input.actionUrl,
    },
  });

  if (isPushConfigured()) {
    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendPush(sub, { title: input.title, body: input.body, actionUrl: input.actionUrl });
        if (result === "expired") {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      })
    );
  }

  return notification;
}

export async function listNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
}

export async function unreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markRead(userId: string, id: string) {
  await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}
