import { NextResponse } from "next/server";

import { buildCapabilityReport } from "@/lib/config/health";
import { featureFlags } from "@/lib/config/server-env";
import { createClient } from "@/lib/supabase/server";

/**
 * Operational health endpoint.
 *
 * Reports which capabilities are configured (by env *name*, never value) and
 * pings the database through the anonymous client, so it also proves that the
 * public key, URL and RLS read policies work. Returns 503 when the core is
 * degraded so monitors and the post-deploy smoke test catch a broken deploy.
 */
export const dynamic = "force-dynamic";

const DB_PING_TIMEOUT_MS = 3000;

async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    const supabase = await createClient();
    // A health check must answer quickly even when the database is unreachable,
    // so the probe is bounded instead of waiting on network timeouts.
    const { error } = await supabase
      .from("platform_settings")
      .select("id")
      .eq("id", 1)
      .abortSignal(AbortSignal.timeout(DB_PING_TIMEOUT_MS))
      .maybeSingle();
    return { ok: !error, latencyMs: Date.now() - started, error: error?.code };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.name : "unknown",
    };
  }
}

export async function GET() {
  const capabilities = buildCapabilityReport(process.env);
  const database = capabilities.database.ok
    ? await pingDatabase()
    : { ok: false, latencyMs: 0, error: "not_configured" };
  const coreOk = capabilities.database.ok && database.ok;

  return NextResponse.json(
    {
      status: coreOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      capabilities,
      database,
      flags: { paymentsEnabled: featureFlags.paymentsEnabled },
      version: process.env.COMMIT_REF ?? "local",
    },
    { status: coreOk ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
