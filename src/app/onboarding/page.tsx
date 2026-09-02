import { requireUser } from "@/lib/auth/current-user";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(19,32,30,0.04),0_8px_24px_-12px_rgba(19,32,30,0.14)]">
        <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-teal">Step 1 of 2</span>
        <h1 className="text-xl font-semibold">A little about you</h1>
        <p className="mt-1.5 mb-6 text-sm text-ink-soft">
          This shapes how the AI paces your plans — nothing here is permanent, you can change it anytime in Settings.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
