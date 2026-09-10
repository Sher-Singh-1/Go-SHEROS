"use client";

import { useActionState, useState } from "react";
import { clsx } from "clsx";
import { format } from "date-fns";
import { generateDraftPlan, acceptDraftPlan, type PlanFormState, type SerializedPlan } from "../actions";
import { Field, TextInput, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: PlanFormState = { status: "idle" };

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function GoalWizard({
  isFirstGoal,
  defaultHoursPerDay,
  defaultStartHour,
}: {
  isFirstGoal: boolean;
  defaultHoursPerDay: number;
  defaultStartHour: number;
}) {
  // Remounting on "Start over" resets every hook below — including
  // useActionState — in one step, rather than tracking a separate reset flag.
  const [attempt, setAttempt] = useState(0);
  return (
    <GoalWizardAttempt
      key={attempt}
      isFirstGoal={isFirstGoal}
      defaultHoursPerDay={defaultHoursPerDay}
      defaultStartHour={defaultStartHour}
      onStartOver={() => setAttempt((n) => n + 1)}
    />
  );
}

function GoalWizardAttempt({
  isFirstGoal,
  defaultHoursPerDay,
  defaultStartHour,
  onStartOver,
}: {
  isFirstGoal: boolean;
  defaultHoursPerDay: number;
  defaultStartHour: number;
  onStartOver: () => void;
}) {
  const [state, formAction, pending] = useActionState(generateDraftPlan, initialState);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [mode, setMode] = useState<"review" | "direct">("review");

  function toggleDay(day: number) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

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
          Tell it what you&apos;re working toward, on your terms — topic, timeframe, which days, how much time.
          It&apos;ll draft milestones and a first couple of weeks of tasks built around that, not a generic template.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Goal" htmlFor="goalTitle">
          <TextInput id="goalTitle" name="goalTitle" placeholder="Anything — learn AWS, train for a 10K, write a novel…" required autoFocus maxLength={120} />
        </Field>
        <Field label="Details (optional)" htmlFor="notes" hint="Specific topics, sub-skills, or constraints — the plan will rotate through these instead of repeating the goal title.">
          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={2000}
            placeholder="e.g. EC2, S3, IAM basics, then a small deployed project"
            className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-accent"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" htmlFor="startDate">
            <TextInput id="startDate" name="startDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
          </Field>
          <Field label="Target date" htmlFor="endDate">
            <TextInput id="endDate" name="endDate" type="date" required />
          </Field>
        </div>
        <Field label="Which days do you want to work on this?" htmlFor="daysOfWeek">
          <div id="daysOfWeek" className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <label key={d.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="daysOfWeek"
                  value={d.value}
                  checked={selectedDays.includes(d.value)}
                  onChange={() => toggleDay(d.value)}
                  className="peer sr-only"
                />
                <span
                  className={clsx(
                    "flex h-9 w-12 items-center justify-center rounded-lg border text-xs font-medium transition-colors",
                    selectedDays.includes(d.value)
                      ? "border-accent bg-accent-soft text-accent-ink"
                      : "border-border-strong text-ink-soft hover:border-border"
                  )}
                >
                  {d.label}
                </span>
              </label>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours per day for this" htmlFor="hoursPerDay">
            <TextInput
              id="hoursPerDay"
              name="hoursPerDay"
              type="number"
              step="0.5"
              min="0.5"
              max="16"
              defaultValue={defaultHoursPerDay}
              required
            />
          </Field>
          <Field label="Preferred start time" htmlFor="preferredStartTime">
            <TextInput
              id="preferredStartTime"
              name="preferredStartTime"
              type="time"
              defaultValue={`${String(defaultStartHour).padStart(2, "0")}:00`}
              required
            />
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
        <Field label="Before it's added" htmlFor="mode">
          <input type="hidden" name="mode" value={mode} />
          <div id="mode" className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("review")}
              className={clsx(
                "rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                mode === "review" ? "border-accent bg-accent-soft text-accent-ink" : "border-border-strong text-ink-soft hover:border-border"
              )}
            >
              <span className="block font-medium">Let me review first</span>
              <span className="block text-xs opacity-80">See and edit every task before it&apos;s added</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={clsx(
                "rounded-lg border px-3.5 py-2.5 text-left text-sm transition-colors",
                mode === "direct" ? "border-accent bg-accent-soft text-accent-ink" : "border-border-strong text-ink-soft hover:border-border"
              )}
            >
              <span className="block font-medium">Just go</span>
              <span className="block text-xs opacity-80">Skip review, add it straight to my plan</span>
            </button>
          </div>
        </Field>
        <FormError message={state.status === "error" ? state.error : undefined} />
        <Button type="submit" disabled={pending} size="lg" className="mt-1">
          {pending ? (mode === "direct" ? "Creating your goal…" : "Building your plan…") : mode === "direct" ? "Create goal" : "Draft my plan"}
        </Button>
      </form>
    </div>
  );
}

type EditableTask = SerializedPlan["tasks"][number] & { _key: number };
type EditableMilestone = SerializedPlan["milestones"][number] & { _key: number };

let nextKey = 0;

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
  const [milestones, setMilestones] = useState<EditableMilestone[]>(() => plan.milestones.map((m, i) => ({ ...m, _key: i })));
  const [tasks, setTasks] = useState<EditableTask[]>(() => plan.tasks.map((t, i) => ({ ...t, _key: i })));
  const byDay = groupByDay(tasks);

  function updateTask(key: number, patch: Partial<EditableTask>) {
    setTasks((prev) => prev.map((t) => (t._key === key ? { ...t, ...patch } : t)));
  }

  function addTask(day: string) {
    setTasks((prev) => [
      ...prev,
      {
        _key: -(++nextKey),
        title: "New task",
        date: `${day}T00:00:00.000Z`,
        startTime: "09:00",
        estimatedMinutes: 30,
        milestoneIndex: 0,
      },
    ]);
  }

  const cleanPlan: SerializedPlan = {
    warnings: plan.warnings,
    milestones: milestones.map((m) => ({ title: m.title, targetDate: m.targetDate, order: m.order })),
    tasks: tasks.map((t) => ({
      title: t.title,
      date: t.date,
      startTime: t.startTime,
      estimatedMinutes: t.estimatedMinutes,
      milestoneIndex: t.milestoneIndex,
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Here&apos;s the plan for &ldquo;{goalTitle}&rdquo;</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Everything below is editable — change titles, dates, times, or remove/add tasks — then accept. Only
            the next couple of weeks are scheduled; later weeks generate as you go, based on your actual pace.
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
          {milestones.map((m) => (
            <div key={m._key} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm">
              <input
                type="text"
                value={m.title}
                onChange={(e) => setMilestones((prev) => prev.map((x) => (x._key === m._key ? { ...x, title: e.target.value } : x)))}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <input
                type="date"
                value={m.targetDate.slice(0, 10)}
                onChange={(e) =>
                  setMilestones((prev) =>
                    prev.map((x) => (x._key === m._key ? { ...x, targetDate: `${e.target.value}T00:00:00.000Z` } : x))
                  )
                }
                className="flex-none bg-transparent font-mono text-xs text-ink-faint outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Daily tasks</p>
        <div className="flex flex-col gap-4">
          {byDay.map(([day, dayTasks]) => (
            <div key={day}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-ink-soft">{format(new Date(day), "EEEE, MMM d")}</p>
                <button type="button" onClick={() => addTask(day)} className="text-xs font-medium text-teal hover:underline">
                  + Add task
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {dayTasks.map((t) => (
                  <div key={t._key} className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm">
                    <input
                      type="text"
                      value={t.title}
                      onChange={(e) => updateTask(t._key, { title: e.target.value })}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                    <input
                      type="date"
                      value={t.date.slice(0, 10)}
                      onChange={(e) => updateTask(t._key, { date: `${e.target.value}T00:00:00.000Z` })}
                      className="flex-none bg-transparent font-mono text-xs text-ink-faint outline-none"
                    />
                    <input
                      type="time"
                      value={t.startTime}
                      onChange={(e) => updateTask(t._key, { startTime: e.target.value })}
                      className="flex-none bg-transparent font-mono text-xs text-ink-faint outline-none"
                    />
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={t.estimatedMinutes}
                      onChange={(e) => updateTask(t._key, { estimatedMinutes: Number(e.target.value) })}
                      className="w-12 flex-none bg-transparent font-mono text-xs text-ink-faint outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setTasks((prev) => prev.filter((x) => x._key !== t._key))}
                      className="flex-none text-xs font-medium text-danger hover:underline"
                    >
                      Remove
                    </button>
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
        <input type="hidden" name="planJson" value={JSON.stringify(cleanPlan)} />
        <Button type="submit" size="lg">Accept &amp; add to my plan</Button>
      </form>
    </div>
  );
}

function groupByDay(tasks: EditableTask[]) {
  const map = new Map<string, EditableTask[]>();
  for (const t of tasks) {
    const key = t.date.slice(0, 10);
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
}
