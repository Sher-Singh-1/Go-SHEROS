"use server";

import { startOfDay, endOfDay } from "date-fns";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { askCoach } from "@/lib/ai/provider";
import { revalidatePath } from "next/cache";

async function buildContext(userId: string) {
  const today = new Date();
  const [todayTasks, overdue, goals, streak] = await Promise.all([
    prisma.task.count({ where: { userId, date: { gte: startOfDay(today), lte: endOfDay(today) } } }),
    prisma.task.count({ where: { userId, status: "OVERDUE" } }),
    prisma.goal.findMany({ where: { userId, status: "ACTIVE" }, select: { title: true } }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  return {
    todayTaskCount: todayTasks,
    overdueCount: overdue,
    activeGoalTitles: goals.map((g) => g.title),
    currentStreak: streak?.currentCount ?? 0,
  };
}

export async function askCoachAction(message: string) {
  const user = await requireUser();
  const context = await buildContext(user.id);
  return askCoach(message, context, []);
}

export async function sendConversationMessage(conversationId: string | null, message: string) {
  const user = await requireUser();
  const context = await buildContext(user.id);

  const conversation = conversationId
    ? await prisma.aIConversation.findFirstOrThrow({ where: { id: conversationId, userId: user.id } })
    : await prisma.aIConversation.create({ data: { userId: user.id, title: message.slice(0, 60) } });

  const priorMessages = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });

  const reply = await askCoach(
    message,
    context,
    priorMessages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }))
  );

  await prisma.aIMessage.create({ data: { conversationId: conversation.id, role: "assistant", content: reply } });

  revalidatePath("/dashboard/ai");
  return { conversationId: conversation.id, reply };
}
