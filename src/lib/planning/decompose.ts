import { addDays, differenceInCalendarDays, differenceInCalendarWeeks } from "date-fns";

export type PlanInput = {
  goalTitle: string;
  notes?: string;
  startDate: Date;
  endDate: Date;
  hoursPerDay: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  preferredStartHour: number;
  /** Days of week to schedule tasks on, 0=Sunday..6=Saturday (matches Date#getDay()). Empty/omitted means every day. */
  daysOfWeek?: number[];
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

  const allowedWeekdays = new Set(
    input.daysOfWeek && input.daysOfWeek.length > 0 ? input.daysOfWeek : [0, 1, 2, 3, 4, 5, 6]
  );
  const maxScheduledDays = Math.min(totalDays, 14); // "this week" plus a buffer week
  const tasksPerDay = input.experienceLevel === "beginner" ? 2 : input.experienceLevel === "advanced" ? 4 : 3;
  const minutesPerTask = Math.max(20, Math.round((input.hoursPerDay * 60) / tasksPerDay));

  if (input.hoursPerDay * 60 < tasksPerDay * 20) {
    warnings.push(
      `${input.hoursPerDay}h/day is tight for ${tasksPerDay} tasks — consider fewer, longer sessions.`
    );
  }

  const tasks: PlannedTask[] = [];
  const topics = buildTopicQueue(input.goalTitle, input.notes, input.experienceLevel, maxScheduledDays * tasksPerDay);
  let topicCursor = 0;
  let scheduledDays = 0;
  let dayOffset = 0;

  while (scheduledDays < maxScheduledDays && dayOffset < totalDays) {
    const date = addDays(input.startDate, dayOffset);
    dayOffset++;
    if (!allowedWeekdays.has(date.getDay())) continue;

    const milestoneIndex = Math.min(
      milestones.length - 1,
      Math.floor((dayOffset / totalDays) * milestones.length)
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
    scheduledDays++;
  }

  if (tasks.length === 0) {
    warnings.push("None of your selected days fall within this timeframe — try widening the date range or day selection.");
  } else if (scheduledDays >= maxScheduledDays && dayOffset < totalDays) {
    warnings.push(
      `Only the first ${scheduledDays} scheduled days were planned — later weeks generate as you go, adjusted to your actual pace.`
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

function buildTopicQueue(
  goalTitle: string,
  notes: string | undefined,
  level: PlanInput["experienceLevel"],
  count: number
): string[] {
  const verbs =
    level === "beginner"
      ? ["Learn the basics of", "Practice", "Review", "Take notes on", "Watch/read a primer on", "Try a small exercise on"]
      : level === "advanced"
      ? ["Deep-dive into", "Build a project using", "Optimize", "Teach back / document", "Benchmark", "Refactor a past attempt at"]
      : ["Study", "Practice", "Apply", "Review", "Explore", "Work through examples of"];

  // If the user gave specifics, split them into sub-topics so tasks rotate
  // through what they actually want to focus on instead of repeating the
  // goal title verbatim with a generic verb slapped on front.
  const subtopics = (notes ?? "")
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const focusList = subtopics.length > 0 ? subtopics : [goalTitle];

  return Array.from({ length: Math.max(count, 8) }, (_, i) => {
    const verb = verbs[i % verbs.length];
    const focus = focusList[Math.floor(i / verbs.length) % focusList.length];
    return `${verb} ${focus}`;
  });
}
