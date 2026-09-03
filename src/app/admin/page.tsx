import { format, formatDistanceToNow, startOfDay, subDays } from "date-fns";
import { requireAdmin } from "@/lib/auth/current-user";
import { getAllUsersUsage, getDailySiteUsage } from "@/lib/analytics/admin-metrics";
import { formatFocusDuration } from "@/lib/analytics/metrics";
import { SiteUsageChart } from "@/components/admin/site-usage-chart";
import { UserUsageChart } from "@/components/admin/user-usage-chart";
import { logout } from "@/app/(auth)/actions";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [users, daily] = await Promise.all([getAllUsersUsage(), getDailySiteUsage(30)]);

  const today = startOfDay(new Date());
  const weekAgo = subDays(today, 6);
  const minutesToday = daily.find((d) => d.date.getTime() === today.getTime())?.minutes ?? 0;
  const minutesThisWeek = daily.filter((d) => d.date.getTime() >= weekAgo.getTime()).reduce((s, d) => s + d.minutes, 0);
  const activeToday = daily.find((d) => d.date.getTime() === today.getTime())?.activeUsers ?? 0;

  const usageBars = [...users]
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 12)
    .map((u) => ({ label: u.displayName || u.email, minutes: Math.round(u.totalSeconds / 60) }));

  return (
    <div className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 md:px-10">
        <div>
          <p className="font-display text-lg font-semibold">Admin</p>
          <p className="text-xs text-ink-faint">Signed in as {admin.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="text-xs font-medium text-ink-soft hover:text-ink">
            Back to app
          </a>
          <form action={logout}>
            <button type="submit" className="text-xs font-medium text-ink-faint hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 md:px-10 md:py-10">
        <div>
          <h1 className="text-2xl font-semibold">Site usage</h1>
          <p className="text-sm text-ink-soft">Who&apos;s using Go Sheros, and how much time they spend in it.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Total users" value={String(users.length)} />
          <Stat label="Active today" value={String(activeToday)} />
          <Stat label="Minutes today" value={String(minutesToday)} />
          <Stat label="Minutes this week" value={String(minutesThisWeek)} />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm font-medium">Last 30 days — total time on site (reach)</p>
          <SiteUsageChart data={daily.map((d) => ({ date: d.date.toISOString(), minutes: d.minutes, activeUsers: d.activeUsers }))} />
        </div>

        {usageBars.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="mb-4 text-sm font-medium">Time spent per user (top {usageBars.length})</p>
            <UserUsageChart data={usageBars} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface">
          <p className="border-b border-border px-5 py-4 text-sm font-medium">All users</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-ink-faint">
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Joined</th>
                  <th className="px-5 py-2 font-medium">Logins</th>
                  <th className="px-5 py-2 font-medium">Total time</th>
                  <th className="px-5 py-2 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <p className="font-medium text-ink">{u.email}</p>
                      {u.displayName && <p className="text-xs text-ink-faint">{u.displayName}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{format(u.createdAt, "MMM d, yyyy")}</td>
                    <td className="px-5 py-3 text-ink-soft">{u.loginCount}</td>
                    <td className="px-5 py-3 font-mono text-ink-soft">{formatFocusDuration(u.totalSeconds)}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {u.lastSeenAt ? formatDistanceToNow(u.lastSeenAt, { addSuffix: true }) : "never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
