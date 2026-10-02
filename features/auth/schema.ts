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

// Accepts what people actually type or autofill on phones: spaces, dashes, a +91 / 91
// country code or a leading 0 trunk prefix. All of them normalise to the 10-digit number.
export const indianPhoneSchema = z
  .string()
  .transform((v) =>
    v
      .replace(/\D/g, "")
      .replace(/^(91)(?=\d{10}$)/, "")
      .replace(/^0(?=\d{10}$)/, ""),
  )
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export type PasswordRule = {
  id: string;
  /** Shown in the live checklist under the field. */
  label: string;
  /** Returned as the validation error when the rule fails. */
  message: string;
  test: (value: string) => boolean;
};

/**
 * Single source of truth for password strength. The zod schema below and the
 * live checklist in the sign-up form both read this list, so the rules the user
 * sees can never drift from the rules the server enforces.
 */
export const passwordRules: readonly PasswordRule[] = [
  {
    id: "length",
    label: "At least 8 characters",
    message: "Use at least 8 characters",
    test: (v) => v.length >= 8,
  },
  {
    id: "upper",
    label: "One uppercase letter (A-Z)",
    message: "Include an uppercase letter",
    test: (v) => /[A-Z]/.test(v),
  },
  {
    id: "lower",
    label: "One lowercase letter (a-z)",
    message: "Include a lowercase letter",
    test: (v) => /[a-z]/.test(v),
  },
  {
    id: "digit",
    label: "One number (0-9)",
    message: "Include a number",
    test: (v) => /\d/.test(v),
  },
  {
    id: "symbol",
    label: "One symbol, e.g. @ # ! -",
    message: "Include a symbol such as @ # ! -",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

// superRefine reports EVERY failing rule, not just the first, so the user can fix
// them all in one go. 72 is bcrypt's input limit (Supabase Auth hashes with bcrypt).
export const passwordSchema = z
  .string()
  .max(72, "Use at most 72 characters")
  .superRefine((value, ctx) => {
    for (const rule of passwordRules) {
      if (!rule.test(value)) ctx.addIssue({ code: "custom", message: rule.message });
    }
  });

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
