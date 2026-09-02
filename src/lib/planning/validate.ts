import { formatISO } from "date-fns";
import type { PlanResult } from "@/lib/planning/decompose";

/**
 * The validation layer described in the AI Coach Architecture: every
 * proposed plan — whether from the deterministic planner or a real model —
 * is checked against the user's stated capacity before it's shown to them.
 * The AI never gets a free pass on realism.
 */
export function validatePlanAgainstCapacity(plan: PlanResult, hoursPerDay: number): PlanResult {
  const budgetMinutes = hoursPerDay * 60;
  const byDay = new Map<string, number>();

  for (const task of plan.tasks) {
    const key = formatISO(task.date, { representation: "date" });
    byDay.set(key, (byDay.get(key) ?? 0) + task.estimatedMinutes);
  }

  const warnings = [...plan.warnings];
  const overloadedDays = [...byDay.entries()].filter(([, minutes]) => minutes > budgetMinutes * 1.15);

  if (overloadedDays.length > 0) {
    warnings.push(
      `${overloadedDays.length} day${overloadedDays.length === 1 ? "" : "s"} in this plan exceed your ${hoursPerDay}h/day budget — trim tasks before accepting, or raise your daily hours in Settings.`
    );
  }

  return { ...plan, warnings };
}
