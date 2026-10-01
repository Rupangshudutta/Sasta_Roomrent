import { z } from "zod";

/**
 * Environment configuration, validated once at import time.
 *
 * Why: a missing or malformed variable should fail loudly at boot (or at the
 * first server request), not as a confusing runtime error deep inside a
 * feature. Splitting public from server keeps secrets out of client bundles:
 * Next.js only inlines variables prefixed with NEXT_PUBLIC_, and `serverEnv`
 * is guarded by `server-only` at its import site.
 */

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const publicSchema = z.object({
  // No default on purpose: a literal localhost URL would be inlined into the client
  // bundle and the CI bundle scan treats that as a misconfiguration.
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
});

const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  NOTIFY_EMAIL: z.email().optional(),
  PAYMENTS_ENABLED: booleanFromString,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

export class EnvValidationError extends Error {
  constructor(
    public readonly scope: "public" | "server",
    public readonly issues: string[],
  ) {
    super(`Invalid ${scope} environment: ${issues.join("; ")}`);
    this.name = "EnvValidationError";
  }
}

function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  const result = publicSchema.safeParse(source);
  if (!result.success) throw new EnvValidationError("public", formatIssues(result.error));
  return result.data;
}

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = serverSchema.safeParse(source);
  if (!result.success) throw new EnvValidationError("server", formatIssues(result.error));
  return result.data;
}

/**
 * Names of server variables that are required for a given capability.
 * Used by /api/health to report what is missing without leaking values.
 */
export const capabilityRequirements = {
  database: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  privilegedDatabase: ["SUPABASE_SECRET_KEY"],
  email: ["RESEND_API_KEY", "EMAIL_FROM"],
  payments: [
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "RAZORPAY_WEBHOOK_SECRET",
    "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  ],
} as const satisfies Record<string, readonly string[]>;

export type Capability = keyof typeof capabilityRequirements;

export function missingForCapability(
  capability: Capability,
  source: Record<string, string | undefined>,
): string[] {
  return capabilityRequirements[capability].filter((name) => !source[name]);
}
