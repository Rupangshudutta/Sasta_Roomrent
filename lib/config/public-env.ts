import { parsePublicEnv, type PublicEnv } from "./env";

/**
 * Public env is read explicitly by name so Next.js can inline each value into
 * the client bundle at build time. `process.env` cannot be enumerated in the
 * browser, which is why the object literal below is not `process.env` itself.
 * Kept in its own module so unit tests can import the parsers without
 * triggering validation of the real environment.
 */
export const publicEnv: PublicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
});
