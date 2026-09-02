import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { readSession } from "@/lib/auth/session";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profile: true, preferences: true, streak: true },
  });
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireOnboardedUser() {
  const user = await requireUser();
  if (!user.totpEnabled) redirect("/setup-totp");
  if (!user.profile?.onboardedAt) redirect("/onboarding");
  return user;
}
