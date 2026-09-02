"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { generatePlanDraft } from "@/lib/ai/provider";
import { validatePlanAgainstCapacity } from "@/lib/planning/validate";
import { draftGoalSchema, manualGoalSchema } from "@/lib/validation/goals";

export type SerializedPlan = {
  milestones: { title: string; targetDate: string; order: number }[];
  tasks: { title: string; date: string; startTime: string; estimatedMinutes: number; milestoneIndex: number }[];
  warnings: string[];
};

export type PlanFormState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "drafted";
      plan: SerializedPlan;
      goalTitle: string;
      startDate: string;
      endDate: string;
    };

export async function generateDraftPlan(_prev: PlanFormState, formData: FormData): Promise<PlanFormState> {
  const user = await requireUser();

  const parsed = draftGoalSchema.safeParse({
    goalTitle: formData.get("goalTitle"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    experienceLevel: formData.get("experienceLevel"),
  });
  if (!parsed.success) return { status: "error", error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;

  if (data.endDate <= data.startDate) {
    return { status: "error", error: "End date needs to be after the start date." };
  }

  const prefs = await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: {},
  });

  const rawPlan = await generatePlanDraft({
    goalTitle: data.goalTitle,
    startDate: data.startDate,
    endDate: data.endDate,
    hoursPerDay: prefs.hoursPerDay,
    experienceLevel: data.experienceLevel,
    preferredStartHour: prefs.preferredStartHour,
  });
  const plan = validatePlanAgainstCapacity(rawPlan, prefs.hoursPerDay);

  return {
    status: "drafted",
    goalTitle: data.goalTitle,
    startDate: data.startDate.toISOString(),
    endDate: data.endDate.toISOString(),
    plan: {
      warnings: plan.warnings,
      milestones: plan.milestones.map((m) => ({ title: m.title, targetDate: m.targetDate.toISOString(), order: m.order })),
      tasks: plan.tasks.map((t) => ({
        title: t.title,
        date: t.date.toISOString(),
        startTime: t.startTime,
        estimatedMinutes: t.estimatedMinutes,
        milestoneIndex: t.milestoneIndex,
      })),
    },
  };
}

export async function acceptDraftPlan(formData: FormData) {
  const user = await requireUser();

  const goalTitle = String(formData.get("goalTitle") ?? "");
  const startDate = new Date(String(formData.get("startDate")));
  const endDate = new Date(String(formData.get("endDate")));
  const planJson = String(formData.get("planJson") ?? "{}");
  const plan = JSON.parse(planJson) as SerializedPlan;

  const goal = await prisma.$transaction(async (tx) => {
    const createdGoal = await tx.goal.create({
      data: { userId: user.id, title: goalTitle, startDate, endDate },
    });

    const createdMilestones = await Promise.all(
      plan.milestones.map((m) =>
        tx.milestone.create({
          data: { goalId: createdGoal.id, title: m.title, targetDate: new Date(m.targetDate), order: m.order },
        })
      )
    );

    if (plan.tasks.length > 0) {
      await tx.task.createMany({
        data: plan.tasks.map((t) => ({
          userId: user.id,
          goalId: createdGoal.id,
          milestoneId: createdMilestones[t.milestoneIndex]?.id,
          title: t.title,
          date: new Date(t.date),
          startTime: t.startTime,
          estimatedMinutes: t.estimatedMinutes,
        })),
      });
    }

    return createdGoal;
  });

  redirect(`/dashboard/goals/${goal.id}`);
}

export type ManualGoalState = { error?: string } | undefined;

export async function createManualGoal(_prev: ManualGoalState, formData: FormData): Promise<ManualGoalState> {
  const user = await requireUser();

  const parsed = manualGoalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    priority: formData.get("priority") || "MEDIUM",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;

  if (data.endDate <= data.startDate) return { error: "End date needs to be after the start date." };

  const goal = await prisma.goal.create({ data: { ...data, userId: user.id } });
  redirect(`/dashboard/goals/${goal.id}`);
}

export async function archiveGoal(goalId: string) {
  const user = await requireUser();
  await prisma.goal.updateMany({ where: { id: goalId, userId: user.id }, data: { status: "ARCHIVED" } });
  redirect("/dashboard/goals");
}

export async function reactivateGoal(goalId: string) {
  const user = await requireUser();
  await prisma.goal.updateMany({ where: { id: goalId, userId: user.id }, data: { status: "ACTIVE" } });
  revalidatePath(`/dashboard/goals/${goalId}`);
}

export type EditGoalState = { error?: string } | undefined;

export async function updateGoal(goalId: string, _prev: EditGoalState, formData: FormData): Promise<EditGoalState> {
  const user = await requireUser();

  const parsed = manualGoalSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    notes: formData.get("notes") || undefined,
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    priority: formData.get("priority") || "MEDIUM",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const data = parsed.data;

  if (data.endDate <= data.startDate) return { error: "End date needs to be after the start date." };

  const result = await prisma.goal.updateMany({
    where: { id: goalId, userId: user.id },
    data: { ...data, description: data.description ?? null, notes: data.notes ?? null },
  });
  if (result.count === 0) return { error: "Couldn't find that goal." };

  revalidatePath(`/dashboard/goals/${goalId}`);
  revalidatePath("/dashboard/goals");
  redirect(`/dashboard/goals/${goalId}`);
}

export async function deleteGoal(goalId: string) {
  const user = await requireUser();
  await prisma.goal.deleteMany({ where: { id: goalId, userId: user.id } });
  redirect("/dashboard/goals");
}
