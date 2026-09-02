import "server-only";
import { cookies } from "next/headers";

const PENDING_TTL_SECONDS = 60 * 15; // 15 minutes — just long enough to grab your authenticator app

/**
 * A short-lived, purpose-scoped cookie carrying a userId between the
 * password check and the second factor at login — deliberately separate
 * from the real session cookie, which is only set once both checks pass.
 */
export async function setPendingUser(name: string, userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(name, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_TTL_SECONDS,
  });
}

export async function getPendingUser(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value ?? null;
}

export async function clearPendingUser(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}

export const PENDING_2FA_COOKIE = "gosheros_pending_2fa";
