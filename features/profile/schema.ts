import { z } from "zod";

import { indianPhoneSchema, passwordSchema } from "@/features/auth/schema";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Too long")
  .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Use letters only");

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: indianPhoneSchema,
});

export const ownerProfileSchema = profileSchema.extend({
  businessName: z
    .string()
    .trim()
    .min(2, "Enter your business or trading name")
    .max(150, "Too long"),
  businessType: z.enum(["individual", "company", "agency", "broker"], {
    message: "Select how you operate",
  }),
  experience: z.enum(["0-1", "1-3", "3-5", "5+"]).optional().or(z.literal("")),
  primaryLocation: z.string().trim().max(120, "Too long").optional().or(z.literal("")),
  about: z.string().trim().max(2000, "Keep it under 2000 characters").optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
