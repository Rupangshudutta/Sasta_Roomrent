import { z } from "zod";

/**
 * Validation rules shared by the auth forms (client hints) and the Server
 * Actions (authoritative). Patterns mirror the prototype: Indian mobile numbers
 * start with 6-9 and have 10 digits; passwords need 8+ chars with mixed case,
 * a digit and a symbol.
 */

// Normalise first (trim + lowercase), then validate, so "Asha@Example.com " is accepted.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"));

export const indianPhoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, "").replace(/^(91)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(72, "Use at most 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/\d/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

const nameSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(100, "Too long")
  .regex(/^[A-Za-z][A-Za-z\s.'-]*$/, "Use letters only");

export const signupRoleSchema = z.enum(["tenant", "owner"]);
export type SignupRole = z.infer<typeof signupRoleSchema>;

export const businessTypeOptions = [
  { value: "individual", label: "Individual owner" },
  { value: "company", label: "Company" },
  { value: "agency", label: "Agency" },
  { value: "broker", label: "Broker" },
] as const;

export const experienceOptions = [
  { value: "0-1", label: "0-1 years" },
  { value: "1-3", label: "1-3 years" },
  { value: "3-5", label: "3-5 years" },
  { value: "5+", label: "5+ years" },
] as const;

export const registerSchema = z
  .object({
    role: signupRoleSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: indianPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    agreeTerms: z.literal("on", { message: "You must accept the terms to continue" }),
    businessName: z.string().trim().max(150, "Too long").optional().or(z.literal("")),
    businessType: z
      .enum(["individual", "company", "agency", "broker"])
      .optional()
      .or(z.literal("")),
    experience: z.enum(["0-1", "1-3", "3-5", "5+"]).optional().or(z.literal("")),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((v) => v.role !== "owner" || (v.businessName && v.businessName.length > 0), {
    path: ["businessName"],
    message: "Business or owner name is required for property owners",
  })
  .refine((v) => v.role !== "owner" || (v.businessType && v.businessType.length > 0), {
    path: ["businessType"],
    message: "Select how you operate",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
  next: z
    .string()
    .regex(/^\/(?!\/)[^\s]*$/)
    .optional()
    .or(z.literal("")),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

/** Only allow same-origin relative paths as post-login destinations (no open redirects). */
export function safeNextPath(candidate: string | null | undefined, fallback: string): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\"))
    return fallback;
  return candidate;
}
