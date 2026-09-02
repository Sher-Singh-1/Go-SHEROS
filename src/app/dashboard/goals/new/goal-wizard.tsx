"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { generateDraftPlan, acceptDraftPlan, type PlanFormState, type SerializedPlan } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: PlanFormState = { status: "idle" };

export function GoalWizard({ isFirstGoal }: { isFirstGoal: boolean }) {
  // Remounting on "Start over" resets every hook below — including
  // useActionState — in one step, rather than tracking a separate reset flag.
  const [attempt, setAttempt] = useState(0);
  return <GoalWizardAttempt key={attempt} isFirstGoal={isFirstGoal} onStartOver={() => setAttempt((n) => n + 1)} />;
}

function GoalWizardAttempt({ isFirstGoal, onStartOver }: { isFirstGoal: boolean; onStartOver: () => void }) {
  const [state, formAction, pending] = useActionState(generateDraftPlan, initialState);

  if (state.status === "drafted") {
    return (
      <PlanReview
        goalTitle={state.goalTitle}
        startDate={state.startDate}
        endDate={state.endDate}
        plan={state.plan}
        onStartOver={onStartOver}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{isFirstGoal ? "What do you want to achieve?" : "Start a new goal"}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          Give the AI a goal and a timeframe — it&apos;ll draft milestones and a first couple of weeks of tasks,
          sized to your available hours.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Goal" htmlFor="goalTitle">
          <TextInput id="goalTitle" name="goalTitle" placeholder="Learn AWS Cloud" required autoFocus maxLength={120} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="startDate">
            <TextInput id="startDate" name="startDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
          </Field>
          <Field label="Target date" htmlFor="endDate">
            <TextInput id="endDate" name="endDate" type="date" required />
          </Field>
        </div>
        <Field label="Experience level with this" htmlFor="experienceLevel">
          <select
            id="experienceLevel"
            name="experienceLevel"
            defaultValue="beginner"
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-accent"
          >
            <option value="beginner">Beginner — starting from scratch</option>
            <option value="intermediate">Intermediate — some experience</option>
            <option value="advanced">Advanced — sharpening existing skill</option>
          </select>
        </Field>
        <FormError message={state.status === "error" ? state.error : undefined} />
        <Button type="submit" disabled={pending} size="lg" className="mt-1">
          {pending ? "Building your plan…" : "Draft my plan"}
        </Button>
      </form>
    </div>
  );
}

function PlanReview({
  goalTitle,
  startDate,
  endDate,
  plan,
  onStartOver,
}: {
  goalTitle: string;
  startDate: string;
  endDate: string;
  plan: SerializedPlan;
  onStartOver: () => void;
}) {
  const [tasks, setTasks] = useState(plan.tasks);
  const byDay = groupByDay(tasks);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Here&apos;s the plan for &ldquo;{goalTitle}&rdquo;</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Review it, remove anything that doesn&apos;t fit, then accept. Only the next couple of weeks are
            scheduled — later weeks generate as you go, based on your actual pace.
          </p>
        </div>
        <button type="button" onClick={onStartOver} className="flex-none text-xs font-medium text-ink-faint hover:text-ink">
          Start over
        </button>
      </div>

      {plan.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {plan.warnings.map((w, i) => (
            <p key={i} className="rounded-lg border border-accent-soft-border bg-accent-soft px-3.5 py-2.5 text-sm text-accent-ink">
              {w}
            </p>
          ))}
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Milestones</p>
        <div className="flex flex-col gap-2">
          {plan.milestones.map((m, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm">
              <span>{m.title}</span>
              <span className="font-mono text-xs text-ink-faint">{format(new Date(m.targetDate), "MMM d")}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Daily tasks</p>
        <div className="flex flex-col gap-4">
          {byDay.map(([day, dayTasks]) => (
            <div key={day}>
              <p className="mb-1.5 text-xs font-medium text-ink-soft">{format(new Date(day), "EEEE, MMM d")}</p>
              <div className="flex flex-col gap-1.5">
                {dayTasks.map((t) => (
                  <div key={t.title + t.date} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <div className="flex flex-none items-center gap-3">
                      <span className="font-mono text-xs text-ink-faint">{t.startTime} · {t.estimatedMinutes}m</span>
                      <button
                        type="button"
                        onClick={() => setTasks((prev) => prev.filter((x) => x !== t))}
                        className="text-xs font-medium text-danger hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <form action={acceptDraftPlan} className="flex gap-3">
        <input type="hidden" name="goalTitle" value={goalTitle} />
        <input type="hidden" name="startDate" value={startDate} />
        <input type="hidden" name="endDate" value={endDate} />
        <input type="hidden" name="planJson" value={JSON.stringify({ ...plan, tasks })} />
        <Button type="submit" size="lg">Accept &amp; add to my plan</Button>
      </form>
    </div>
  );
}

function groupByDay(tasks: SerializedPlan["tasks"]) {
  const map = new Map<string, SerializedPlan["tasks"]>();
  for (const t of tasks) {
    const key = t.date.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}
