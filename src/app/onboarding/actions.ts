"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/current-user";
import { onboardingSchema } from "@/lib/validation/onboarding";
import type { FormState } from "@/app/(auth)/actions";

export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    profession: formData.get("profession"),
    hoursPerDay: formData.get("hoursPerDay"),
    preferredStartHour: formData.get("preferredStartHour"),
    preferredEndHour: formData.get("preferredEndHour"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const data = parsed.data;

  if (data.preferredEndHour <= data.preferredStartHour) {
    return { error: "Your working window needs an end time after the start time." };
  }

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      displayName: data.displayName,
      profession: data.profession,
      onboardedAt: new Date(),
    },
    update: {
      displayName: data.displayName,
      profession: data.profession,
      onboardedAt: new Date(),
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      hoursPerDay: data.hoursPerDay,
      preferredStartHour: data.preferredStartHour,
      preferredEndHour: data.preferredEndHour,
    },
    update: {
      hoursPerDay: data.hoursPerDay,
      preferredStartHour: data.preferredStartHour,
      preferredEndHour: data.preferredEndHour,
    },
  });

  redirect("/dashboard/goals/new?first=true");
}
