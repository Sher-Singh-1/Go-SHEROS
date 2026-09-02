import { z } from "zod";

export const taskStatuses = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "SKIPPED", "OVERDUE"] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Give the task a name.").max(160),
  date: z.coerce.date(),
  startTime: z.string().trim().optional(),
  dueTime: z.string().trim().optional(),
  priority: z.enum(priorities).default("MEDIUM"),
  category: z.string().trim().max(60).optional(),
  estimatedMinutes: z.coerce.number().int().min(1).max(600).optional(),
  notes: z.string().trim().max(2000).optional(),
  goalId: z.string().optional(),
});

export const updateTaskStatusSchema = z.object({
  taskId: z.string(),
  status: z.enum(taskStatuses),
});

export const reorderTasksSchema = z.object({
  orderedIds: z.array(z.string()),
});
