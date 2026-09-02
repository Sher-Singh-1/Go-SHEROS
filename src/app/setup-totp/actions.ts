"use server";

import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { verifyTotpToken } from "@/lib/auth/totp";
import { issueBackupCodes } from "@/lib/auth/backup-codes";
import { rateLimit } from "@/lib/auth/rate-limit";
import { sixDigitCodeSchema } from "@/lib/validation/auth";

export type ConfirmTotpState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; backupCodes: string[]; nextPath: string };

export async function confirmTotpSetup(_prev: ConfirmTotpState, formData: FormData): Promise<ConfirmTotpState> {
  const user = await requireUser();
  if (user.totpEnabled) return { status: "error", error: "Two-factor is already enabled on this account." };
  if (!user.totpSecret) return { status: "error", error: "Something went wrong generating your secret. Reload the page." };

  const parsed = sixDigitCodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { status: "error", error: parsed.error.issues[0]?.message ?? "Invalid code." };

  const limit = rateLimit(`totp-setup:${user.id}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { status: "error", error: "Too many attempts. Try again in a few minutes." };

  const valid = verifyTotpToken(user.email, user.totpSecret, parsed.data);
  if (!valid) return { status: "error", error: "That code didn't match — check the time on your phone and try again." };

  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  const backupCodes = await issueBackupCodes(user.id);

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  return { status: "success", backupCodes, nextPath: profile?.onboardedAt ? "/dashboard" : "/onboarding" };
}
