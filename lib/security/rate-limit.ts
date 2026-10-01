import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { logger } from "@/lib/logging/logger";
import { createClient } from "@/lib/supabase/server";

import type { RateLimitRule } from "./rate-limit.rules";

/**
 * Fixed-window rate limiting backed by the consume_rate_limit() RPC.
 *
 * Why in Postgres: Netlify functions are stateless, so an in-memory counter
 * would reset on every cold start and differ per instance. Supabase is already
 * the one shared store we have; a single upsert per request is cheap at our
 * scale and needs no Redis.
 *
 * Fail-open: if the RPC errors (network, misconfig) the request proceeds and we
 * log it. Locking every user out because a counter is unavailable is a worse
 * outcome than briefly losing abuse protection; the auth provider has its own
 * limits underneath ours.
 */
export { rateLimitRules, type RateLimitRule } from "./rate-limit.rules";

/** Client IP as seen by Netlify, falling back to the standard proxy header. */
export async function clientIdentifier(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return ip;
}

/**
 * Returns true when the caller may proceed. `subject` defaults to the hashed
 * client IP; pass a user id for per-account limits. Keys stored in the DB are
 * `scope:sha256(subject)` so no raw IP is ever persisted.
 */
export async function checkRateLimit(rule: RateLimitRule, subject?: string): Promise<boolean> {
  const who = subject ?? (await clientIdentifier());
  const key = `${rule.scope}:${createHash("sha256").update(who).digest("hex").slice(0, 32)}`;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    logger.warn("rate_limit.unavailable", { scope: rule.scope, code: error.code });
    return true;
  }
  if (data === false) logger.warn("rate_limit.exceeded", { scope: rule.scope });
  return data !== false;
}

export const rateLimitedMessage = "Too many attempts. Please wait a few minutes and try again.";
