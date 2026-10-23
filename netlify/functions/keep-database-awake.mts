import { logger } from "../../lib/logging/logger";

/**
 * Netlify scheduled function: one small read against Supabase every day so the
 * free-tier project is never paused for inactivity. It was paused on 2026-10-22
 * and every sign-in and sign-up failed until it was restored by hand.
 *
 * The `Production smoke` workflow was meant to provide this traffic, but GitHub
 * runs scheduled workflows only from the default branch (`main`), which does not
 * have it yet. Netlify runs schedules on the published production deploy, which
 * builds from this branch. Delete this file once the project is on a paid plan.
 */
const TIMEOUT_MS = 10_000;

export default async function keepDatabaseAwake(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    logger.error("keepalive.misconfigured");
    return;
  }
  try {
    // Same anonymous, RLS-permitted read as /api/health.
    const response = await fetch(`${url}/rest/v1/platform_settings?select=id&id=eq.1`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) logger.info("keepalive.ok");
    else logger.error("keepalive.failed", { status: response.status });
  } catch (error) {
    logger.error("keepalive.failed", { error: error instanceof Error ? error.name : "unknown" });
  }
}

export const config = { schedule: "@daily" };
