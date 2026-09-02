import { addDays, differenceInCalendarDays, differenceInCalendarWeeks } from "date-fns";

export type PlanInput = {
  goalTitle: string;
  startDate: Date;
  endDate: Date;
  hoursPerDay: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredStartHour: number;
};

export type PlannedMilestone = {
  title: string;
  targetDate: Date;
  order: number;
};

export type PlannedTask = {
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  estimatedMinutes: number;
  milestoneIndex: number;
};

export type PlanResult = {
  milestones: PlannedMilestone[];
  tasks: PlannedTask[];
  warnings: string[];
};

/**
 * Deterministic, rule-based goal decomposition. This is the "AI coach" in
 * its zero-external-dependency form — see lib/ai/provider.ts, which calls
 * this directly when no ANTHROPIC_API_KEY is configured, and otherwise asks
 * Claude to produce the same shape, validated against the same rules.
 *
 * Only the CURRENT week's daily tasks are generated (see the blueprint's
 * "just-in-time" planning rationale) — later weeks are generated as the
 * user progresses, so pacing reflects how the goal is actually going.
 */
export function decomposeGoal(input: PlanInput): PlanResult {
  const warnings: string[] = [];
  const totalDays = Math.max(1, differenceInCalendarDays(input.endDate, input.startDate));
  const totalWeeks = Math.max(1, differenceInCalendarWeeks(input.endDate, input.startDate));

  const milestoneCount = Math.min(8, Math.max(3, Math.round(totalWeeks / 3) || 3));
  const milestones: PlannedMilestone[] = buildMilestones(input.goalTitle, input.startDate, totalDays, milestoneCount);

  const daysToGenerate = Math.min(totalDays, 14); // "this week" plus a buffer week
  const tasksPerDay = input.experienceLevel === "beginner" ? 2 : input.experienceLevel === "advanced" ? 4 : 3;
  const minutesPerTask = Math.max(20, Math.round((input.hoursPerDay * 60) / tasksPerDay));

  if (input.hoursPerDay * 60 < tasksPerDay * 20) {
    warnings.push(
      `${input.hoursPerDay}h/day is tight for ${tasksPerDay} tasks — consider fewer, longer sessions.`
    );
  }
  if (totalWeeks > 0 && totalDays / totalWeeks < 7 * (input.hoursPerDay > 0 ? 1 : 0)) {
    // placeholder guard kept intentionally simple for the deterministic fallback
  }

  const tasks: PlannedTask[] = [];
  const topics = buildTopicQueue(input.goalTitle, input.experienceLevel, daysToGenerate * tasksPerDay);
  let topicCursor = 0;

  for (let day = 0; day < daysToGenerate; day++) {
    const date = addDays(input.startDate, day);
    const milestoneIndex = Math.min(
      milestones.length - 1,
      Math.floor((day / totalDays) * milestones.length)
    );

    for (let t = 0; t < tasksPerDay; t++) {
      const hour = input.preferredStartHour + Math.floor((t * minutesPerTask) / 60);
      const minute = (t * minutesPerTask) % 60;
      tasks.push({
        title: topics[topicCursor % topics.length],
        date,
        startTime: `${String(hour % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        estimatedMinutes: minutesPerTask,
        milestoneIndex,
      });
      topicCursor++;
    }
  }

  if (totalDays > 14) {
    warnings.push(
      `Only the first ${daysToGenerate} days were scheduled — later weeks generate as you go, adjusted to your actual pace.`
    );
  }

  return { milestones, tasks, warnings };
}

function buildMilestones(goalTitle: string, startDate: Date, totalDays: number, count: number): PlannedMilestone[] {
  const phaseNames = [
    "Foundations",
    "Core concepts",
    "Applied practice",
    "Intermediate depth",
    "Real-world projects",
    "Advanced topics",
    "Polish & review",
    "Final push",
  ];

  return Array.from({ length: count }, (_, i) => {
    const dayOffset = Math.round(((i + 1) / count) * totalDays);
    return {
      title: `${phaseNames[i] ?? `Phase ${i + 1}`}: ${goalTitle}`,
      targetDate: addDays(startDate, dayOffset),
      order: i,
    };
  });
}

function buildTopicQueue(goalTitle: string, level: PlanInput["experienceLevel"], count: number): string[] {
  const verbs =
    level === "beginner"
      ? ["Learn the basics of", "Practice", "Review", "Take notes on"]
      : level === "advanced"
      ? ["Deep-dive into", "Build a project using", "Optimize", "Teach back / document"]
      : ["Study", "Practice", "Apply", "Review"];

  return Array.from({ length: Math.max(count, 8) }, (_, i) => {
    const verb = verbs[i % verbs.length];
    return `${verb} ${goalTitle} — session ${i + 1}`;
  });
}
