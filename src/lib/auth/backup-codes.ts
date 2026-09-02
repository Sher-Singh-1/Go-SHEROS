import "server-only";
import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db/client";

const CODE_COUNT = 8;
const HASH_ROUNDS = 10;

function generateOneCode() {
  const part = () => randomInt(0, 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `${part()}-${part()}`;
}

/** Generates fresh backup codes, persists their hashes, and returns the plaintext — shown to the user exactly once. */
export async function issueBackupCodes(userId: string) {
  const codes = Array.from({ length: CODE_COUNT }, generateOneCode);

  await prisma.$transaction([
    prisma.backupCode.deleteMany({ where: { userId } }),
    prisma.backupCode.createMany({
      data: await Promise.all(
        codes.map(async (code) => ({ userId, codeHash: await bcrypt.hash(code, HASH_ROUNDS) }))
      ),
    }),
  ]);

  return codes;
}

export async function consumeBackupCode(userId: string, code: string) {
  const candidates = await prisma.backupCode.findMany({ where: { userId, usedAt: null } });

  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.codeHash)) {
      await prisma.backupCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } });
      return true;
    }
  }
  return false;
}

export async function countRemainingBackupCodes(userId: string) {
  return prisma.backupCode.count({ where: { userId, usedAt: null } });
}
