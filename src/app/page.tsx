import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

const FEATURES = [
  {
    title: "AI planning",
    body: "Tell it \"learn AWS in 6 months\" and it drafts milestones, weekly objectives, and today's tasks — sized to your real hours.",
  },
  {
    title: "Smart tasks",
    body: "Priority, subtasks, recurrence, drag-and-drop reordering — a task manager with nothing missing.",
  },
  {
    title: "Focus timer",
    body: "Stopwatch, countdown, or Pomodoro, with a full-screen mode and a history of what you actually spent.",
  },
  {
    title: "Progress analytics",
    body: "Completion rate, a calendar heatmap, and insights pulled straight from your own data — not guesses.",
  },
  {
    title: "Consistency streaks",
    body: "Built-in streak protection means one missed day doesn't erase weeks of showing up.",
  },
  {
    title: "Reminders, your way",
    body: "\"Every day at 7am.\" \"30 minutes before.\" \"At 9pm, only if I haven't finished.\" You set the rule.",
  },
];

const STEPS = [
  { label: "Plan", body: "Name a goal and a timeframe. The AI drafts it, you edit it." },
  { label: "Do", body: "Today's tasks are ready the moment you land on the dashboard." },
  { label: "Track", body: "Streaks, completion rate, and a heatmap make consistency visible." },
  { label: "Improve", body: "The AI coach adjusts the plan when life gets in the way." },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-accent to-[#a8341f] font-display text-sm font-bold text-[#fff8ec]">
            GS
          </span>
          <span className="font-display text-base font-semibold">Go Sheros</span>
        </Link>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">Log in</Link>
          <ButtonLink href="/signup" size="sm">Create your free account</ButtonLink>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 pb-20 pt-16 text-center">
          <span className="rounded-full border border-border-strong bg-surface px-3.5 py-1 font-mono text-xs text-ink-soft">
            An AI planning partner, not another checklist
          </span>
          <h1 className="text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Turn your goals into a plan.
            <br />
            Turn your plan into progress.
          </h1>
          <p className="max-w-xl text-balance text-lg text-ink-soft">
            Tell Go Sheros what you&apos;re working toward and how long you have. It drafts the milestones, paces
            the daily tasks to your real schedule, and keeps you honest about whether you&apos;re doing it.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/signup" size="lg">Start planning</ButtonLink>
            <ButtonLink href="/login" size="lg" variant="secondary">Log in</ButtonLink>
          </div>
        </section>

        <section className="border-y border-border bg-surface py-14">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex flex-col items-center gap-2 text-center">
                <span className="font-mono text-xs text-teal">{String(i + 1).padStart(2, "0")}</span>
                <p className="font-display text-base font-semibold">{step.label}</p>
                <p className="text-xs text-ink-soft">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="mb-10 text-center font-display text-2xl font-semibold">Everything the plan needs, nothing it doesn&apos;t</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-surface p-5">
                <p className="font-display text-base font-semibold">{f.title}</p>
                <p className="mt-1.5 text-sm text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-24 text-center">
          <h2 className="font-display text-2xl font-semibold">Every hero needs a plan.</h2>
          <p className="mt-2 text-ink-soft">Free to start — no credit card.</p>
          <ButtonLink href="/signup" size="lg" className="mt-6">Create your free account</ButtonLink>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-ink-faint">
        Go Sheros — Plan → Do → Track → Improve.
      </footer>
    </div>
  );
}
