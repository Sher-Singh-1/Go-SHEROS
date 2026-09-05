import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { readSession, touchActivity } from "@/lib/auth/session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true, preferences: true, streak: true },
  });
  if (user) await touchActivity(user.id);
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.profile?.onboardedAt) redirect("/onboarding");
  return user;
}

export function isAdminEmail(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  return !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}

export async function requireAdmin() {
  const user = await requireUser();
  // 404, not a redirect — a non-admin (or a curious authenticated user)
  // shouldn't be able to tell this route exists at all.
  if (!isAdminEmail(user.email)) notFound();
  return user;
}
