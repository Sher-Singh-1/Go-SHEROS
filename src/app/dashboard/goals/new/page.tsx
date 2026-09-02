import { GoalWizard } from "./goal-wizard";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: Promise<{ first?: string }>;
}) {
  const { first } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl">
      <GoalWizard isFirstGoal={first === "true"} />
    </div>
  );
}
