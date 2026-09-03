import "server-only";
import { startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/client";

export type UserUsageRow = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  loginCount: number;
  totalSeconds: number;
  lastSeenAt: Date | null;
};

function eventDurationSeconds(loginAt: Date, lastSeenAt: Date, logoutAt: Date | null) {
  const end = logoutAt ?? lastSeenAt;
  return Math.max(0, Math.floor((end.getTime() - loginAt.getTime()) / 1000));
}

export async function getAllUsersUsage(): Promise<UserUsageRow[]> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      createdAt: true,
      profile: { select: { displayName: true } },
      loginEvents: { select: { loginAt: true, lastSeenAt: true, logoutAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => {
    const totalSeconds = u.loginEvents.reduce(
      (sum, ev) => sum + eventDurationSeconds(ev.loginAt, ev.lastSeenAt, ev.logoutAt),
      0
    );
    const lastSeenAt = u.loginEvents.reduce<Date | null>((latest, ev) => {
      const seen = ev.logoutAt ?? ev.lastSeenAt;
      return !latest || seen > latest ? seen : latest;
    }, null);

    return {
      id: u.id,
      email: u.email,
      displayName: u.profile?.displayName ?? null,
      createdAt: u.createdAt,
      loginCount: u.loginEvents.length,
      totalSeconds,
      lastSeenAt,
    };
  });
}

export async function getDailySiteUsage(days: number) {
  const since = startOfDay(subDays(new Date(), days - 1));
  const events = await prisma.loginEvent.findMany({
    where: { loginAt: { gte: since } },
    select: { userId: true, loginAt: true, lastSeenAt: true, logoutAt: true },
  });

  const byDay = new Map<string, { seconds: number; users: Set<string> }>();
  for (const ev of events) {
    const key = startOfDay(ev.loginAt).toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? { seconds: 0, users: new Set<string>() };
    bucket.seconds += eventDurationSeconds(ev.loginAt, ev.lastSeenAt, ev.logoutAt);
    bucket.users.add(ev.userId);
    byDay.set(key, bucket);
  }

  return Array.from({ length: days }, (_, i) => {
    const date = startOfDay(subDays(new Date(), days - 1 - i));
    const key = date.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    return {
      date,
      minutes: bucket ? Math.round(bucket.seconds / 60) : 0,
      activeUsers: bucket ? bucket.users.size : 0,
    };
  });
}
