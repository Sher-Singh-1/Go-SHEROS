import { z } from "zod";

export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;

export const draftGoalSchema = z.object({
  goalTitle: z.string().trim().min(2, "Give the goal a name.").max(120),
  notes: z.string().trim().max(2000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  experienceLevel: z.enum(experienceLevels),
  hoursPerDay: z.coerce
    .number()
    .min(0.5, "At least half an hour a day.")
    .max(16, "That's more than 16 hours — try something more sustainable."),
  preferredStartTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Pick a start time.")
    .transform((v) => Number(v.slice(0, 2))),
  daysOfWeek: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Pick at least one day to work on this."),
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
  category: z.string().trim().max(60).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});
