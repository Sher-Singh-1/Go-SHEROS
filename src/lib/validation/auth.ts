import { z } from "zod";

export const emailSchema = z.email({ message: "Enter a valid email address." }).toLowerCase();

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .refine((v) => /[a-zA-Z]/.test(v) && /[0-9]/.test(v), {
    message: "Mix letters and numbers.",
  });

export const sixDigitCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");

export const backupCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/, "Enter a backup code in the form XXXX-XXXX.");

export const nameSchema = z.string().trim().min(1, "This field is required.").max(60);

export const signupSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const resetWithBackupCodeSchema = z.object({
  email: emailSchema,
  backupCode: backupCodeSchema,
  password: passwordSchema,
});
