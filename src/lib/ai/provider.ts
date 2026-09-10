import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { decomposeGoal, type PlanInput, type PlanResult } from "@/lib/planning/decompose";

export function isRealAIConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function client() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Configurable so an operator can pin/upgrade without a code change —
// check https://docs.anthropic.com/en/docs/about-claude/models for current ids.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const PLAN_TOOL = {
  name: "propose_plan",
  description:
    "Propose a structured goal plan: milestones spanning the full duration, and daily tasks for roughly the next two weeks only.",
  input_schema: {
    type: "object" as const,
    properties: {
      milestones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            targetDate: { type: "string", description: "ISO date" },
          },
          required: ["title", "targetDate"],
        },
      },
      tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            date: { type: "string", description: "ISO date" },
            startTime: { type: "string", description: "HH:MM 24h" },
            estimatedMinutes: { type: "number" },
            milestoneIndex: { type: "number" },
          },
          required: ["title", "date", "startTime", "estimatedMinutes", "milestoneIndex"],
        },
      },
      warnings: { type: "array", items: { type: "string" } },
    },
    required: ["milestones", "tasks", "warnings"],
  },
};

/**
 * Generates a draft plan for a goal. Never writes to the database itself —
 * callers must run the result through validatePlan() and let the user
 * review it before anything is committed (see the AI Coach Architecture
 * section of the blueprint: propose → validate → review → commit).
 */
export async function generatePlanDraft(input: PlanInput): Promise<PlanResult> {
  if (!isRealAIConfigured()) {
    return decomposeGoal(input);
  }

  try {
    const fallback = decomposeGoal(input);
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system:
        "You are Go Sheros' planning engine. Break the user's goal into milestones spanning the full timeframe, " +
        "then daily tasks for roughly the first two weeks only (later weeks are generated just-in-time as the user " +
        "progresses). Respect their stated hours per day — do not overload days. Call propose_plan with your answer.",
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: "propose_plan" },
      messages: [
        {
          role: "user",
          content: `Goal: "${input.goalTitle}"
Start date: ${input.startDate.toISOString().slice(0, 10)}
End date: ${input.endDate.toISOString().slice(0, 10)}
Experience level: ${input.experienceLevel}
Available hours/day: ${input.hoursPerDay}
Preferred start hour: ${input.preferredStartHour}:00`,
        },
      ],
    });

    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return fallback;

    const raw = toolUse.input as {
      milestones: { title: string; targetDate: string }[];
      tasks: { title: string; date: string; startTime: string; estimatedMinutes: number; milestoneIndex: number }[];
      warnings: string[];
    };

    return {
      milestones: raw.milestones.map((m, order) => ({ title: m.title, targetDate: new Date(m.targetDate), order })),
      tasks: raw.tasks.map((t) => ({
        title: t.title,
        date: new Date(t.date),
        startTime: t.startTime,
        estimatedMinutes: t.estimatedMinutes,
        milestoneIndex: t.milestoneIndex,
      })),
      warnings: raw.warnings ?? [],
    };
  } catch (err) {
    console.error("[ai] plan generation failed, falling back to deterministic planner", err);
    return decomposeGoal(input);
  }
}

export type CoachContext = {
  todayTaskCount: number;
  overdueCount: number;
  activeGoalTitles: string[];
  currentStreak: number;
};

const APP_GUIDE = `
Go Sheros is a productivity app with these sections (left sidebar on desktop, bottom tab bar on mobile):
- Dashboard: daily overview — today's tasks, streak, quick stats.
- Today: the day's task list; add, complete, star (high priority), edit, or delete tasks; tasks can repeat on chosen days of the week.
- Goals: set a goal with a timeframe and hours/day; the AI planner breaks it into milestones and daily tasks the user reviews before committing.
- Calendar: month/week view of all scheduled tasks.
- Habits: recurring habit tracking separate from one-off tasks.
- Focus: a focus-timer mode for single-tasking.
- Analytics: charts on completion rate, streaks, and time spent by category.
- AI Coach (this chat): goal planning and productivity Q&A.
- Settings: profile, password, optional 2FA, notification/email preferences, data export & account deletion, and an About tab with app version and credits.
Notifications: a bell icon (top-right on desktop, top bar on mobile) shows in-app notifications with a badge for unread count.
`.trim();

export async function askCoach(userMessage: string, context: CoachContext, history: { role: "user" | "assistant"; content: string }[]) {
  if (!isRealAIConfigured()) {
    return ruleBasedCoachReply(userMessage, context);
  }

  try {
    const response = await client().messages.create({
      model: MODEL,
      max_tokens: 600,
      system:
        "You are the Go Sheros AI Coach: a warm, direct assistant that helps with productivity coaching, goal planning, " +
        "AND general conversation or questions about the app itself. You are not limited to productivity topics — " +
        "answer general knowledge questions, casual chat, and anything else the user brings up naturally and helpfully. " +
        "When asked how the app works or what a feature does, answer using this app guide:\n" +
        APP_GUIDE + "\n\n" +
        `The user's current data: ${context.todayTaskCount} tasks today (${context.overdueCount} overdue), ` +
        `a ${context.currentStreak}-day streak, and active goals: ${context.activeGoalTitles.join(", ") || "none yet"}. ` +
        "Use these real numbers when the conversation is about their productivity — never invent numbers. " +
        "Avoid generic motivational filler. Keep replies under 150 words unless the user asks for more detail.",
      messages: [...history, { role: "user", content: userMessage }],
    });
    const text = response.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text : ruleBasedCoachReply(userMessage, context);
  } catch (err) {
    console.error("[ai] chat failed, falling back to rule-based reply", err);
    return ruleBasedCoachReply(userMessage, context);
  }
}

function ruleBasedCoachReply(message: string, context: CoachContext) {
  const lower = message.toLowerCase();

  if (lower.includes("what is this app") || lower.includes("what does this app") || lower.includes("how does this app") || lower.includes("what can you do")) {
    return APP_GUIDE;
  }
  if (lower.includes("overwhelm") || lower.includes("too many") || lower.includes("busy")) {
    return context.todayTaskCount > 5
      ? `You've got ${context.todayTaskCount} tasks today. Pick the 3 with the nearest deadlines or highest priority and move the rest to tomorrow — a shorter honest list beats a long ignored one.`
      : `${context.todayTaskCount} tasks today is manageable. Start with whichever one you're most tempted to avoid.`;
  }
  if (lower.includes("streak") || lower.includes("consisten")) {
    return context.currentStreak > 0
      ? `You're on a ${context.currentStreak}-day streak. One more meaningful task completed today keeps it alive.`
      : `No active streak yet — completing just one task today starts a new one.`;
  }
  if (context.overdueCount > 0) {
    return `You have ${context.overdueCount} overdue task${context.overdueCount === 1 ? "" : "s"}. Want me to help you reschedule them, or should we leave them and focus on today?`;
  }
  return "Tell me a goal and a timeframe (e.g. \"learn AWS in 6 months\") and I'll draft a plan, or ask me to prioritize today's tasks.";
}
