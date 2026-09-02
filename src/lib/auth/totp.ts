import "server-only";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "@/lib/db/client";

const ISSUER = "Go Sheros";

export function generateTotpSecret() {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

function buildTotp(email: string, secret: string) {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export async function buildProvisioningQrCode(email: string, secret: string) {
  const totp = buildTotp(email, secret);
  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 });
  return { otpauthUrl, qrDataUrl };
}

/** Allows one 30s step of clock drift on either side. */
export function verifyTotpToken(email: string, secret: string, token: string) {
  const totp = buildTotp(email, secret);
  const delta = totp.validate({ token, window: 1 });
  return delta !== null;
}

/** Idempotent: only generates and persists a secret if the user doesn't already have one. */
export async function ensureTotpSecret(userId: string, existingSecret: string | null) {
  if (existingSecret) return existingSecret;
  const secret = generateTotpSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpSecret: secret } });
  return secret;
}
