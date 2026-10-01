import { NextResponse } from "next/server";

import { buildCapabilityReport } from "@/lib/config/health";
import { featureFlags } from "@/lib/config/server-env";

/**
 * Operational health endpoint.
 *
 * Reports which capabilities are configured and which env names are missing,
 * never their values. Returns 503 when a capability required for the core
 * product (database) is not configured, so uptime monitors and the
 * post-deploy smoke test can catch a broken deploy before users do.
 *
 * Database connectivity is added in Slice 1 once the Supabase clients exist.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const capabilities = buildCapabilityReport(process.env);
  const coreOk = capabilities.database.ok;

  return NextResponse.json(
    {
      status: coreOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      capabilities,
      flags: { paymentsEnabled: featureFlags.paymentsEnabled },
      version: process.env.COMMIT_REF ?? "local",
    },
    {
      status: coreOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
