import "server-only";

import { serverEnv } from "@/lib/config/server-env";

/**
 * Best-effort transactional email via Resend's REST API.
 *
 * Design rules (from the first version of this product, kept on purpose):
 * - Email must never fail the user's request. Every error is logged and swallowed.
 * - When RESEND_API_KEY is not configured (local dev, CI) sending is a no-op that
 *   returns { sent: false, reason: "not_configured" } so callers can test the path.
 * - No SDK: one fetch call keeps the dependency surface small and the bundle lean.
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult =
  { sent: true; id: string } | { sent: false; reason: "not_configured" | "rejected" | "network" };

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 8000;

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = serverEnv.RESEND_API_KEY;
  const from = serverEnv.EMAIL_FROM;
  if (!apiKey || !from) {
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("email.send rejected", { status: response.status, subject: input.subject });
      return { sent: false, reason: "rejected" };
    }
    const body = (await response.json()) as { id?: string };
    return { sent: true, id: body.id ?? "unknown" };
  } catch (error) {
    console.error("email.send failed", {
      subject: input.subject,
      error: error instanceof Error ? error.name : "unknown",
    });
    return { sent: false, reason: "network" };
  }
}

/** Minimal HTML escaping for values interpolated into email templates. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
