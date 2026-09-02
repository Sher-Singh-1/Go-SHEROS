import { requireOnboardedUser } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import { AiDock } from "@/components/dashboard/ai-dock";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireOnboardedUser();

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar displayName={user.profile?.displayName ?? ""} email={user.email} />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
      </div>
      <MobileTabBar />
      <AiDock />
    </div>
  );
}
