import { requireOnboardedUser } from "@/lib/auth/current-user";
import { countRemainingBackupCodes } from "@/lib/auth/backup-codes";
import { ThemeToggle, ReducedMotionToggle } from "@/components/ui/theme-toggle";
import { ProfileForm, PreferencesForm, PasswordForm } from "./settings-forms";
import { ExportDataButton, DeleteAccountButton } from "./data-actions";
import { TwoFactorSection } from "./two-factor-section";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
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
  const remainingCodes = await countRemainingBackupCodes(user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Section title="Two-factor authentication" description="Every login on this account requires your authenticator app.">
        <TwoFactorSection remainingCodes={remainingCodes} />
      </Section>

      <Section title="Profile">
        <ProfileForm displayName={user.profile?.displayName ?? ""} profession={user.profile?.profession ?? "OTHER"} />
      </Section>

      <Section title="Planning preferences" description="This shapes how the AI paces goals it drafts for you.">
        <PreferencesForm
          hoursPerDay={user.preferences?.hoursPerDay ?? 2}
          preferredStartHour={user.preferences?.preferredStartHour ?? 9}
          preferredEndHour={user.preferences?.preferredEndHour ?? 21}
        />
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <span className="text-sm">Theme</span>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Reduce motion</span>
          <ReducedMotionToggle />
        </div>
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
  );
}
