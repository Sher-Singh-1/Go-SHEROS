"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { notifyUser } from "@/lib/notifications/service";

export type BroadcastState = { error?: string; info?: string } | undefined;

export async function broadcastNotification(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "Both a title and a message are required." };

  const recipients = await prisma.user.findMany({
    where: { preferences: { marketingOptIn: true } },
    select: { id: true },
  });

  const CHUNK_SIZE = 20;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
    const chunk = recipients.slice(i, i + CHUNK_SIZE);
    await Promise.all(chunk.map((r) => notifyUser(r.id, { type: "MARKETING", title, body })));
    sent += chunk.length;
  }

  revalidatePath("/admin");
  return { info: `Sent to ${sent} opted-in user${sent === 1 ? "" : "s"}.` };
}
