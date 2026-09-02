import { z } from "zod";

export const professions = [
  "STUDENT",
  "CORPORATE_EMPLOYEE",
  "BUSINESS_OWNER",
  "FREELANCER",
  "ENTREPRENEUR",
  "DEVELOPER",
  "MANAGER",
  "TEACHER",
  "OTHER",
] as const;

export const professionLabels: Record<(typeof professions)[number], string> = {
  STUDENT: "Student",
  CORPORATE_EMPLOYEE: "Corporate employee",
  BUSINESS_OWNER: "Business owner",
  FREELANCER: "Freelancer",
  ENTREPRENEUR: "Entrepreneur",
  DEVELOPER: "Developer",
  MANAGER: "Manager",
  TEACHER: "Teacher",
  OTHER: "Other",
};

export const onboardingSchema = z.object({
  displayName: z.string().trim().min(1, "Tell us what to call you.").max(60),
  profession: z.enum(professions),
  hoursPerDay: z.coerce.number().min(0.25).max(16),
  preferredStartHour: z.coerce.number().int().min(0).max(23),
  preferredEndHour: z.coerce.number().int().min(1).max(24),
});
