"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { verifyTotpToken, ensureTotpSecret } from "@/lib/auth/totp";
import { consumeBackupCode } from "@/lib/auth/backup-codes";
import { createSession, destroySession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/auth/rate-limit";
import { PENDING_2FA_COOKIE, setPendingUser, getPendingUser, clearPendingUser } from "@/lib/auth/pending";
import { signupSchema, loginSchema, sixDigitCodeSchema, resetWithBackupCodeSchema } from "@/lib/validation/auth";

export type FormState = { error?: string; info?: string } | undefined;

export async function startSignup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { email, password } = parsed.data;

  const limit = rateLimit(`signup:${email}`, 5, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists. Try logging in instead." };

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, passwordHash } });
  await ensureTotpSecret(user.id, null);

  await prisma.userPreferences.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  await prisma.streak.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });

  await createSession({ userId: user.id, email: user.email });
  redirect("/setup-totp");
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { email, password } = parsed.data;

  const limit = rateLimit(`login:${email}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return { error: "Incorrect email or password." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Incorrect email or password." };

  if (!user.totpEnabled) {
    // No second factor set up yet — sign them in and the dashboard gate will
    // route them through setup before they can go any further.
    await ensureTotpSecret(user.id, user.totpSecret);
    await createSession({ userId: user.id, email: user.email });
    redirect("/setup-totp");
  }

  await setPendingUser(PENDING_2FA_COOKIE, user.id);
  redirect("/login-totp");
}

export async function completeLoginTotp(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = await getPendingUser(PENDING_2FA_COOKIE);
  if (!userId) return { error: "Your login session expired. Log in again." };

  const rawCode = String(formData.get("code") ?? "").trim();
  const limit = rateLimit(`login-totp:${userId}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.totpSecret) return { error: "Two-factor isn't set up on this account. Log in again." };

  const codeParsed = sixDigitCodeSchema.safeParse(rawCode);
  const validTotp = codeParsed.success && verifyTotpToken(user.email, user.totpSecret, codeParsed.data);
  const validBackup = !validTotp && rawCode.length > 0 && (await consumeBackupCode(userId, rawCode));

  if (!validTotp && !validBackup) {
    return { error: "That code doesn't match. You can also use a backup code." };
  }

  await clearPendingUser(PENDING_2FA_COOKIE);
  await createSession({ userId: user.id, email: user.email });

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
  redirect(profile?.onboardedAt ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function resetPasswordWithBackupCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetWithBackupCodeSchema.safeParse({
    email: formData.get("email"),
    backupCode: formData.get("backupCode"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { email, backupCode, password } = parsed.data;

  const limit = rateLimit(`reset:${email}`, 8, 15 * 60 * 1000);
  if (!limit.ok) return { error: "Too many attempts. Try again in a few minutes." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "That backup code doesn't match this account." };

  const ok = await consumeBackupCode(user.id, backupCode);
  if (!ok) return { error: "That backup code doesn't match this account, or was already used." };

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await createSession({ userId: user.id, email: user.email });
  redirect("/dashboard");
}
