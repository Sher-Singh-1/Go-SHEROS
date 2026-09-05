import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listNotifications, unreadCount } from "@/lib/notifications/service";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, unread] = await Promise.all([listNotifications(user.id), unreadCount(user.id)]);
  return NextResponse.json({ unreadCount: unread, items });
}
