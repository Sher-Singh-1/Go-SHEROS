/**
 * One-off: turn the "DevOps/Cloud Engineer 135-Day Comic Workbook" PDF into a
 * Goal + 8 Milestones (phases) + 135 Tasks (one per day) for a user.
 *
 * Run this yourself — it reads DATABASE_URL from your own .env.local, which
 * this sandbox isn't allowed to touch.
 *
 * Usage (from the project root):
 *   npx tsx scripts/import-devops-workbook.ts [email] [YYYY-MM-DD start date]
 *
 * Defaults to singhsher.me298@gmail.com and today. Safe to re-run: if a goal
 * with the same title already exists for the user, it exits without creating
 * a duplicate.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const email = process.argv[2] || "singhsher.me298@gmail.com";
const startDateArg = process.argv[3];

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL is not set. Make sure .env.local has it (it should, for production).");
  process.exit(1);
}
if (/localhost|127\.0\.0\.1/.test(dbUrl)) {
  console.error("Refusing to run: DATABASE_URL looks like a local database, not production.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });

const GOAL_TITLE = "DevOps / Cloud Engineer — 135-Day Roadmap";

const PHASE_NAMES: Record<number, string> = {
  1: "Foundation",
  2: "CI/CD",
  3: "AWS Cloud",
  4: "Terraform",
  5: "Kubernetes",
  6: "Monitoring",
  7: "Capstone",
  8: "Job Switch",
};

type Phase = { num: number; start: number; end: number };
type Day = {
  num: number;
  topic: string;
  concepts: string;
  handsOn: string;
  deliverable: string;
  review: string;
  resources: string[];
};

const PHASES: Phase[] = [
  { num: 1, start: 1, end: 20 },
  { num: 2, start: 21, end: 35 },
  { num: 3, start: 36, end: 65 },
  { num: 4, start: 66, end: 80 },
  { num: 5, start: 81, end: 105 },
  { num: 6, start: 106, end: 115 },
  { num: 7, start: 116, end: 125 },
  { num: 8, start: 126, end: 135 },
];

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// Parses "YYYY-MM-DD" as a local-midnight Date (never via the UTC-parsing
// `new Date(string)` form, which combined with local setHours() shifts the
// date back a day in any timezone ahead of UTC).
function parseLocalDate(input?: string): Date {
  if (!input) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const [y, m, day] = input.split("-").map(Number);
  return new Date(y, m - 1, day);
}

function highPriorityDay(topic: string): boolean {
  return /assessment|capstone|checkpoint|interview|readiness/i.test(topic);
}

function fmtLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  const days: Day[] = JSON.parse(
    require("fs").readFileSync(require("path").join(__dirname, "workbook-days.json"), "utf-8")
  );

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email ${email} found in the database. Sign up (or run the migration script) first.`);
    process.exit(1);
  }

  const existing = await prisma.goal.findFirst({ where: { userId: user.id, title: GOAL_TITLE } });
  if (existing) {
    console.log(`Goal "${GOAL_TITLE}" already exists for ${email} (id ${existing.id}) — nothing to do.`);
    return;
  }

  const startDate = parseLocalDate(startDateArg);
  const endDate = addDays(startDate, 134);

  const goal = await prisma.goal.create({
    data: {
      userId: user.id,
      title: GOAL_TITLE,
      description:
        "135-day practical roadmap from Jr. DevOps Engineer to DevOps/Cloud Engineer: " +
        "Linux, Git, Docker, CI/CD, AWS, Terraform, Kubernetes and Monitoring, finishing with a " +
        "portfolio-ready capstone and interview prep. Daily rule: 10 practice/interview questions " +
        "plus hands-on work — if you can't explain it out loud, you don't own it yet.",
      startDate,
      endDate,
      priority: "HIGH",
      status: "ACTIVE",
    },
  });

  const milestoneIdByPhase = new Map<number, string>();
  for (const phase of PHASES) {
    const milestone = await prisma.milestone.create({
      data: {
        goalId: goal.id,
        title: `Phase ${phase.num} — ${PHASE_NAMES[phase.num]} (Days ${phase.start}–${phase.end})`,
        targetDate: addDays(startDate, phase.end - 1),
        order: phase.num,
      },
    });
    milestoneIdByPhase.set(phase.num, milestone.id);
  }

  function phaseForDay(dayNum: number): number {
    return PHASES.find((p) => dayNum >= p.start && dayNum <= p.end)!.num;
  }

  const taskData = days.map((day) => {
    const phaseNum = phaseForDay(day.num);
    const description = [
      `🧠 Concepts: ${day.concepts}`,
      `🛠️ Hands-on: ${day.handsOn}`,
      `📦 Deliverable: ${day.deliverable}`,
      `🎤 Review out loud: ${day.review}`,
      day.resources.length ? `🔗 Resources: ${day.resources.join(" • ")}` : null,
      "",
      "🧪 Do the 10 daily practice/interview questions from the workbook for this day.",
      "📝 End-of-day check: Can I do the lab without a tutorial? Can I explain the failure mode? What did I struggle with?",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      userId: user.id,
      goalId: goal.id,
      milestoneId: milestoneIdByPhase.get(phaseNum)!,
      title: `Day ${day.num}: ${day.topic}`,
      description,
      date: addDays(startDate, day.num - 1),
      priority: highPriorityDay(day.topic) ? ("HIGH" as const) : ("MEDIUM" as const),
      category: PHASE_NAMES[phaseNum],
      status: "NOT_STARTED" as const,
    };
  });

  await prisma.task.createMany({ data: taskData, skipDuplicates: true });

  console.log("Done.");
  console.log({
    goalId: goal.id,
    milestones: PHASES.length,
    tasks: taskData.length,
    startDate: fmtLocal(startDate),
    endDate: fmtLocal(endDate),
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
