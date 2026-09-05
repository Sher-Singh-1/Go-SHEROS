import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { countRemainingBackupCodes } from "@/lib/auth/backup-codes";
import { ThemeToggle, ReducedMotionToggle } from "@/components/ui/theme-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm, PreferencesForm, NotificationsForm, PasswordForm } from "./settings-forms";
import { ExportDataButton, DeleteAccountButton } from "./data-actions";
import { TwoFactorSection } from "./two-factor-section";
import { GeneralToggles } from "./general-toggles";
import { PushToggle } from "./push-toggle";
import { SettingsTabs, type SettingsTab } from "./settings-tabs";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const [remainingCodes, dailyReminder, taskDueReminder] = await Promise.all([
    countRemainingBackupCodes(user.id),
    prisma.reminderRule.findFirst({ where: { userId: user.id, type: "DAILY_PLANNING" } }),
    prisma.reminderRule.findFirst({ where: { userId: user.id, type: "TASK_DUE" } }),
  ]);

  const tabs: SettingsTab[] = [
    {
      id: "general",
      label: "General",
      content: (
        <Section title="General settings">
          <GeneralToggles />
        </Section>
      ),
    },
    {
      id: "notifications",
      label: "Notifications",
      content: (
        <Section title="Notifications" description="A daily nudge, task-due alerts, and quiet hours they won't interrupt.">
          <div className="flex flex-col gap-6">
            <PushToggle />
            <NotificationsForm
              reminderEnabled={dailyReminder?.enabled ?? false}
              timeOfDay={dailyReminder?.timeOfDay ?? "08:00"}
              taskDueEnabled={taskDueReminder?.enabled ?? false}
              marketingOptIn={user.preferences?.marketingOptIn ?? true}
              quietHoursStart={user.preferences?.quietHoursStart ?? null}
              quietHoursEnd={user.preferences?.quietHoursEnd ?? null}
            />
          </div>
        </Section>
      ),
    },
    {
      id: "appearance",
      label: "Appearance",
      content: (
        <Section title="Appearance">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Reduce motion</span>
              <ReducedMotionToggle />
            </div>
          </div>
        </Section>
      ),
    },
    {
      id: "focus",
      label: "Focus",
      content: (
        <Section title="Planning & focus preferences" description="This shapes how the AI paces goals it drafts for you.">
          <PreferencesForm
            hoursPerDay={user.preferences?.hoursPerDay ?? 2}
            preferredStartHour={user.preferences?.preferredStartHour ?? 9}
            preferredEndHour={user.preferences?.preferredEndHour ?? 21}
          />
        </Section>
      ),
    },
    {
      id: "account",
      label: "Account",
      content: (
        <div className="flex flex-col gap-8">
          <Section
            title="Two-factor authentication"
            description={
              user.totpEnabled
                ? "Every login on this account requires your authenticator app."
                : "Optional — add an authenticator app for extra login security."
            }
          >
            <TwoFactorSection enabled={user.totpEnabled} remainingCodes={remainingCodes} />
          </Section>
          <Section title="Profile">
            <ProfileForm displayName={user.profile?.displayName ?? ""} profession={user.profile?.profession ?? "OTHER"} />
          </Section>
          <Section title="Password">
            <PasswordForm />
          </Section>
          <Section title="Your data" description="Full export, any time — and permanent deletion, on your terms.">
            <div className="flex flex-wrap gap-3">
              <ExportDataButton />
              <DeleteAccountButton />
            </div>
          </Section>
        </div>
      ),
    },
    {
      id: "about",
      label: "About",
      content: (
        <Section title="About Go Sheros">
          <div className="flex flex-col gap-2 text-sm text-ink-soft">
            <p>An AI planning partner that turns goals into a paced, daily plan — and keeps you honest about whether you did it.</p>
            <p className="text-ink-faint">Version 0.1.0</p>
          </div>
        </Section>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" subtitle="Customize your experience." />
      <SettingsTabs tabs={tabs} />
    </div>
  );
}
