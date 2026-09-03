/**
 * One-off: copy a single user's data from the local Docker Postgres into the
 * production database. Run this yourself — it reads DATABASE_URL from your
 * own environment (.env.local), which this sandbox isn't allowed to touch.
 *
 * Usage (from the project root, in your own terminal):
 *   npx tsx scripts/migrate-user-to-prod.ts singhsher.me298@gmail.com
 *
 * Safe to re-run: every insert is an upsert or skipDuplicates, so running it
 * twice won't create duplicates. It never deletes anything, never touches
 * another user's data, and never overwrites an existing production user's
 * password/TOTP settings.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

const LOCAL_DATABASE_URL = "postgresql://gosheros:gosheros_dev@localhost:5433/gosheros?schema=public";

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts/migrate-user-to-prod.ts <email>");
  process.exit(1);
}

const targetUrl = process.env.DATABASE_URL;
if (!targetUrl) {
  console.error("DATABASE_URL is not set. Run this with your production env loaded, e.g.:\n" +
    "  npx dotenv -e .env.local -- npx tsx scripts/migrate-user-to-prod.ts " + email);
  process.exit(1);
}
if (/localhost|127\.0\.0\.1/.test(targetUrl)) {
  console.error("Refusing to run: DATABASE_URL looks like a local database, not production.");
  process.exit(1);
}

const source = new PrismaClient({ adapter: new PrismaPg({ connectionString: LOCAL_DATABASE_URL }) });
const target = new PrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl }) });

async function main() {
  const sourceUser = await source.user.findUnique({ where: { email } });
  if (!sourceUser) {
    console.error(`No user with email ${email} found in the local database.`);
    process.exit(1);
  }

  let targetUser = await target.user.findUnique({ where: { email } });
  let createdUser = false;
  if (!targetUser) {
    targetUser = await target.user.create({
      data: {
        id: sourceUser.id,
        email: sourceUser.email,
        passwordHash: sourceUser.passwordHash,
        totpSecret: sourceUser.totpSecret,
        totpEnabled: sourceUser.totpEnabled,
        createdAt: sourceUser.createdAt,
      },
    });
    createdUser = true;
    console.log(`Created production user ${targetUser.id} (copied password/TOTP from local).`);
  } else {
    console.log(`Production user ${targetUser.id} already exists — leaving password/TOTP untouched.`);
  }
  const userId = targetUser.id;

  const [profile, preferences, streak] = await Promise.all([
    source.profile.findUnique({ where: { userId: sourceUser.id } }),
    source.userPreferences.findUnique({ where: { userId: sourceUser.id } }),
    source.streak.findUnique({ where: { userId: sourceUser.id } }),
  ]);

  if (profile) {
    await target.profile.upsert({
      where: { userId },
      create: { ...profile, userId },
      update: { displayName: profile.displayName, profession: profile.profession, onboardedAt: profile.onboardedAt },
    });
  }
  if (preferences) {
    await target.userPreferences.upsert({
      where: { userId },
      create: { ...preferences, userId },
      update: { ...preferences, id: undefined, userId: undefined },
    });
  }
  if (streak) {
    await target.streak.upsert({
      where: { userId },
      create: { ...streak, userId },
      update: { ...streak, id: undefined, userId: undefined },
    });
  }

  const goals = await source.goal.findMany({ where: { userId: sourceUser.id } });
  if (goals.length) {
    await target.goal.createMany({ data: goals.map((g) => ({ ...g, userId })), skipDuplicates: true });
  }

  const milestones = await source.milestone.findMany({ where: { goalId: { in: goals.map((g) => g.id) } } });
  if (milestones.length) {
    await target.milestone.createMany({ data: milestones, skipDuplicates: true });
  }

  const tasks = await source.task.findMany({ where: { userId: sourceUser.id } });
  if (tasks.length) {
    await target.task.createMany({ data: tasks.map((t) => ({ ...t, userId })), skipDuplicates: true });
  }

  const subtasks = await source.subtask.findMany({ where: { taskId: { in: tasks.map((t) => t.id) } } });
  if (subtasks.length) {
    await target.subtask.createMany({ data: subtasks, skipDuplicates: true });
  }

  const sessions = await source.taskSession.findMany({ where: { userId: sourceUser.id } });
  if (sessions.length) {
    await target.taskSession.createMany({ data: sessions.map((s) => ({ ...s, userId })), skipDuplicates: true });
  }

  const habits = await source.habit.findMany({ where: { userId: sourceUser.id } });
  if (habits.length) {
    await target.habit.createMany({ data: habits.map((h) => ({ ...h, userId })), skipDuplicates: true });
  }
  const habitLogs = await source.habitLog.findMany({ where: { habitId: { in: habits.map((h) => h.id) } } });
  if (habitLogs.length) {
    await target.habitLog.createMany({ data: habitLogs, skipDuplicates: true });
  }

  const achievements = await source.achievement.findMany({ where: { userId: sourceUser.id } });
  if (achievements.length) {
    await target.achievement.createMany({ data: achievements.map((a) => ({ ...a, userId })), skipDuplicates: true });
  }

  const conversations = await source.aIConversation.findMany({ where: { userId: sourceUser.id } });
  if (conversations.length) {
    await target.aIConversation.createMany({ data: conversations.map((c) => ({ ...c, userId })), skipDuplicates: true });
  }
  const messages = await source.aIMessage.findMany({
    where: { conversationId: { in: conversations.map((c) => c.id) } },
  });
  if (messages.length) {
    await target.aIMessage.createMany({ data: messages, skipDuplicates: true });
  }
  const plans = await source.aIGeneratedPlan.findMany({ where: { goalId: { in: goals.map((g) => g.id) } } });
  if (plans.length) {
    await target.aIGeneratedPlan.createMany({
      data: plans.map((p) => ({ ...p, proposedJson: p.proposedJson === null ? Prisma.JsonNull : p.proposedJson })),
      skipDuplicates: true,
    });
  }

  const reminders = await source.reminderRule.findMany({ where: { userId: sourceUser.id } });
  if (reminders.length) {
    await target.reminderRule.createMany({ data: reminders.map((r) => ({ ...r, userId })), skipDuplicates: true });
  }
  const notifications = await source.notification.findMany({ where: { userId: sourceUser.id } });
  if (notifications.length) {
    await target.notification.createMany({ data: notifications.map((n) => ({ ...n, userId })), skipDuplicates: true });
  }

  console.log("Done.");
  console.log({
    userCreated: createdUser,
    profile: !!profile,
    preferences: !!preferences,
    streak: !!streak,
    goals: goals.length,
    milestones: milestones.length,
    tasks: tasks.length,
    subtasks: subtasks.length,
    taskSessions: sessions.length,
    habits: habits.length,
    habitLogs: habitLogs.length,
    achievements: achievements.length,
    aiConversations: conversations.length,
    aiMessages: messages.length,
    aiPlans: plans.length,
    reminderRules: reminders.length,
    notifications: notifications.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
