import { requireOnboardedUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/client";
import { GoalWizard } from "./goal-wizard";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const { first } = await searchParams;
  const user = await requireOnboardedUser();
  const prefs = await prisma.userPreferences.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-2xl">
      <GoalWizard
        isFirstGoal={first === "true"}
        defaultHoursPerDay={prefs?.hoursPerDay ?? 2}
        defaultStartHour={prefs?.preferredStartHour ?? 9}
      />
    </div>
  );
}
