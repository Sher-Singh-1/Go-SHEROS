"use server";

import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import type { SessionMode } from "@prisma/client";

export async function startFocusSession(taskId: string, mode: SessionMode, plannedSeconds: number | null) {
  const user = await requireUser();

  const existing = await prisma.taskSession.findFirst({
    where: { taskId, userId: user.id, status: { in: ["RUNNING", "PAUSED"] } },
  });
  if (existing) return existing;

  return prisma.taskSession.create({
    data: { taskId, userId: user.id, mode, plannedSeconds: plannedSeconds ?? undefined, actualSeconds: 0, status: "RUNNING" },
  });
}

export async function syncFocusProgress(sessionId: string, actualSeconds: number) {
  const user = await requireUser();
  await prisma.taskSession.update({
    where: { id: sessionId, userId: user.id },
    data: { actualSeconds },
  });
}

export async function setFocusSessionStatus(sessionId: string, status: "PAUSED" | "RUNNING") {
  const user = await requireUser();
  await prisma.taskSession.update({ where: { id: sessionId, userId: user.id }, data: { status } });
}

export async function finishFocusSession(sessionId: string, actualSeconds: number, status: "COMPLETED" | "ABANDONED") {
  const user = await requireUser();
  await prisma.taskSession.update({
    where: { id: sessionId, userId: user.id },
    data: { actualSeconds, status, endedAt: new Date() },
  });
}
