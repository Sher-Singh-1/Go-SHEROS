import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { decomposeGoal, type PlanInput, type PlanResult } from "@/lib/planning/decompose";
import { matchFaq, resolveFaqReply, APP_GUIDE, type CoachContext } from "@/lib/ai/faq";

export type { CoachContext };

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

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDaysOfWeek(days?: number[]) {
  if (!days || days.length === 0 || days.length === 7) return "every day";
  return days
    .slice()
    .sort()
    .map((d) => WEEKDAY_NAMES[d])
    .join(", ");
}

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
        "progresses). Respect their stated hours per day — do not overload days. Only schedule tasks on the days of " +
        "week the user listed. Use their notes/details to make each task specific and varied — never repeat the " +
        "goal title verbatim with a generic verb in front of it (e.g. do not just write \"Study <goal>\" over and " +
        "over). Call propose_plan with your answer.",
      tools: [PLAN_TOOL],
      tool_choice: { type: "tool", name: "propose_plan" },
      messages: [
        {
          role: "user",
          content: `Goal: "${input.goalTitle}"
${input.notes ? `Details/focus areas: ${input.notes}\n` : ""}Start date: ${input.startDate.toISOString().slice(0, 10)}
End date: ${input.endDate.toISOString().slice(0, 10)}
Experience level: ${input.experienceLevel}
Available hours/day: ${input.hoursPerDay}
Preferred start hour: ${input.preferredStartHour}:00
Days of week to schedule on: ${formatDaysOfWeek(input.daysOfWeek)}`,
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
  const match = matchFaq(message);
  if (match) return resolveFaqReply(match, context);

  return context.overdueCount > 0
    ? `You have ${context.overdueCount} overdue task${context.overdueCount === 1 ? "" : "s"}. Want help rescheduling them, or should we focus on today instead?`
    : "Tell me a goal and a timeframe (e.g. \"learn AWS in 6 months\") and I'll draft a plan, ask me to prioritize today's tasks, or just ask me anything about the app.";
}
