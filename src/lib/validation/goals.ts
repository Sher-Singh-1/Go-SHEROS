import { z } from "zod";

export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;

export const draftGoalSchema = z.object({
  goalTitle: z.string().trim().min(2, "Give the goal a name.").max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  experienceLevel: z.enum(experienceLevels),
});

export const acceptPlanSchema = z.object({
  goalTitle: z.string().trim().min(2).max(120),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  planJson: z.string(), // serialized PlanResult, round-tripped through the review form
});

export const manualGoalSchema = z.object({
  title: z.string().trim().min(2, "Give the goal a name.").max(120),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});
