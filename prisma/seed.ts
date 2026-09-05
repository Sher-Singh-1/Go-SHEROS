import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, startOfDay } from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = "demo@gosheros.app";
const DEMO_PASSWORD = "GoSheros2026!";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    create: { email: DEMO_EMAIL, firstName: "Demo", lastName: "User", passwordHash },
    update: { passwordHash },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, displayName: "Demo", profession: "DEVELOPER", onboardedAt: new Date() },
    update: { onboardedAt: new Date() },
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id, hoursPerDay: 2, preferredStartHour: 9, preferredEndHour: 21 },
    update: {},
  });

  await prisma.streak.upsert({
    where: { userId: user.id },
    create: { userId: user.id, currentCount: 3, longestCount: 5, lastActiveDate: startOfDay(new Date()) },
    update: {},
  });

  const existingGoal = await prisma.goal.findFirst({ where: { userId: user.id, title: "Learn AWS Cloud" } });
  const goal =
    existingGoal ??
    (await prisma.goal.create({
      data: {
        userId: user.id,
        title: "Learn AWS Cloud",
        startDate: startOfDay(new Date()),
        endDate: addDays(startOfDay(new Date()), 180),
      },
    }));

  const milestoneTitles = ["Foundations: Learn AWS Cloud", "Core services: Learn AWS Cloud", "Applied projects: Learn AWS Cloud"];
  const milestones = [];
  for (let i = 0; i < milestoneTitles.length; i++) {
    const existing = await prisma.milestone.findFirst({ where: { goalId: goal.id, title: milestoneTitles[i] } });
    milestones.push(
      existing ??
        (await prisma.milestone.create({
          data: { goalId: goal.id, title: milestoneTitles[i], order: i, targetDate: addDays(new Date(), 30 * (i + 1)) },
        }))
    );
  }
  await prisma.milestone.update({ where: { id: milestones[0].id }, data: { completedAt: new Date() } });

  const todayTaskCount = await prisma.task.count({ where: { userId: user.id, date: { gte: startOfDay(new Date()) } } });
  if (todayTaskCount === 0) {
    await prisma.task.createMany({
      data: [
        { userId: user.id, goalId: goal.id, milestoneId: milestones[1].id, title: "Learn AWS IAM basics", date: startOfDay(new Date()), startTime: "09:00", estimatedMinutes: 40, priority: "HIGH" },
        { userId: user.id, goalId: goal.id, milestoneId: milestones[1].id, title: "Practice: launch an EC2 instance", date: startOfDay(new Date()), startTime: "09:40", estimatedMinutes: 40 },
        { userId: user.id, title: "Reply to team standup notes", date: startOfDay(new Date()), priority: "LOW", category: "Work" },
        { userId: user.id, title: "Plan tomorrow's tasks", date: addDays(startOfDay(new Date()), 1), priority: "MEDIUM" },
      ],
    });
  }

  const habitCount = await prisma.habit.count({ where: { userId: user.id } });
  if (habitCount === 0) {
    await prisma.habit.create({ data: { userId: user.id, title: "Read 30 minutes" } });
  }

  console.log(
    `\nSeeded demo account:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n` +
      `  Two-factor isn't set up yet — the first login walks through it, same as a real signup.\n`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
